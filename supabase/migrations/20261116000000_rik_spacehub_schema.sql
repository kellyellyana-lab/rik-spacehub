-- ====================================================================
-- RIK SpaceHub: Comprehensive Supabase PostgreSQL Schema & Security
-- Universitas Indonesia - Rumpun Ilmu Kesehatan (RIK UI)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE faculty_enum AS ENUM ('FK', 'FKG', 'FKM', 'FF', 'FIK', 'PUSAT_RIK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('faculty_user', 'tu_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected',
    'revision_requested',
    'cancelled',
    'completed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE room_type_enum AS ENUM (
    'auditorium',
    'amphitheater',
    'discussion_room',
    'cbt_lab',
    'meeting_room',
    'open_space'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE equipment_category_enum AS ENUM (
    'audio_visual',
    'furniture',
    'electronics',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'faculty_user',
    faculty faculty_enum NOT NULL,
    identity_number TEXT NOT NULL, -- NPM atau NIP
    phone_number TEXT NOT NULL,
    organization TEXT, -- e.g. BEM FK UI, HMD Farmasi, Senat FIK
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FACILITIES TABLE (Ruangan Bersama RIK)
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    building TEXT NOT NULL,
    floor INT NOT NULL,
    capacity INT NOT NULL,
    room_type room_type_enum NOT NULL,
    description TEXT,
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    rules JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EQUIPMENT TABLE (Inventaris Sarana & Prasarana)
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category equipment_category_enum NOT NULL,
    total_quantity INT NOT NULL DEFAULT 1,
    available_quantity INT NOT NULL DEFAULT 1,
    condition TEXT NOT NULL DEFAULT 'Baik',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_positive_qty CHECK (total_quantity >= 0 AND available_quantity >= 0)
);

-- 6. RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_code TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'student_org',
    expected_attendees INT NOT NULL DEFAULT 10,
    status reservation_status_enum NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_end_after_start CHECK (end_time > start_time)
);

-- CONSTRAINT: Prevent Overlapping Approved Room Bookings (Database-level exclusion constraint)
DO $$ BEGIN
  ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS no_overlapping_approved_bookings;
  ALTER TABLE public.reservations ADD CONSTRAINT no_overlapping_approved_bookings
  EXCLUDE USING gist (
      facility_id WITH =,
      tstzrange(start_time, end_time) WITH &&
  ) WHERE (status = 'approved');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint already exists or btree_gist indexing applied.';
END $$;

-- 7. RESERVATION EQUIPMENT PIVOT
CREATE TABLE IF NOT EXISTS public.reservation_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE RESTRICT,
    quantity_requested INT NOT NULL DEFAULT 1,
    quantity_approved INT DEFAULT NULL
);

-- 8. RESERVATION DOCUMENTS (Private proposal & approval letters)
CREATE TABLE IF NOT EXISTS public.reservation_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AUDIT TRAIL TABLE (Historical log of every status transition)
CREATE TABLE IF NOT EXISTS public.reservation_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    status reservation_status_enum NOT NULL,
    notes TEXT,
    changed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- TRIGGERS & STORED FUNCTIONS
-- ====================================================================

-- A. Auto Profile Creation from Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    faculty,
    identity_number,
    phone_number,
    organization
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role_enum, 'faculty_user'::public.user_role_enum),
    COALESCE((NEW.raw_user_meta_data->>'faculty')::public.faculty_enum, 'FK'::public.faculty_enum),
    COALESCE(NEW.raw_user_meta_data->>'identity_number', 'Belum Diisi'),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '0812-0000-0000'),
    COALESCE(NEW.raw_user_meta_data->>'organization', 'Delegasi Mahasiswa RIK')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Auto Status Audit Trail Trigger
CREATE OR REPLACE FUNCTION public.log_reservation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.reservation_status_history (
      reservation_id,
      status,
      notes,
      changed_by_id
    ) VALUES (
      NEW.id,
      NEW.status,
      COALESCE(NEW.admin_notes, 'Status permohonan diperbarui.'),
      NEW.reviewed_by_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_reservation_status_change ON public.reservations;
CREATE TRIGGER trg_reservation_status_change
  AFTER INSERT OR UPDATE OF status ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.log_reservation_status_change();

-- C. Equipment Overbooking Prevention Validation Function
CREATE OR REPLACE FUNCTION public.validate_equipment_quota(
  p_equipment_id UUID,
  p_requested_qty INT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_available BOOLEAN,
  total_stock INT,
  allocated_in_window INT,
  remaining_stock INT
) AS $$
DECLARE
  v_total_stock INT;
  v_allocated INT;
BEGIN
  -- Get total physical inventory
  SELECT total_quantity INTO v_total_stock
  FROM public.equipment
  WHERE id = p_equipment_id;

  IF v_total_stock IS NULL THEN
    v_total_stock := 0;
  END IF;

  -- Calculate equipment units already committed in overlapping approved bookings
  SELECT COALESCE(SUM(re.quantity_requested), 0) INTO v_allocated
  FROM public.reservation_equipment re
  JOIN public.reservations r ON re.reservation_id = r.id
  WHERE re.equipment_id = p_equipment_id
    AND r.status = 'approved'
    AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
    AND (r.start_time < p_end_time AND r.end_time > p_start_time);

  is_available := (v_allocated + p_requested_qty) <= v_total_stock;
  total_stock := v_total_stock;
  allocated_in_window := v_allocated;
  remaining_stock := GREATEST(0, v_total_stock - v_allocated);
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_status_history ENABLE ROW LEVEL SECURITY;

-- Helper to check if caller has 'tu_admin' role
CREATE OR REPLACE FUNCTION public.is_tu_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'tu_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Public authenticated can view profiles" ON public.profiles;
CREATE POLICY "Public authenticated can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Facilities & Equipment (Read all, write only admin)
DROP POLICY IF EXISTS "Anyone can view active facilities" ON public.facilities;
CREATE POLICY "Anyone can view active facilities"
  ON public.facilities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "TU Admin can manage facilities" ON public.facilities;
CREATE POLICY "TU Admin can manage facilities"
  ON public.facilities FOR ALL
  USING (public.is_tu_admin());

DROP POLICY IF EXISTS "Anyone can view active equipment" ON public.equipment;
CREATE POLICY "Anyone can view active equipment"
  ON public.equipment FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "TU Admin can manage equipment" ON public.equipment;
CREATE POLICY "TU Admin can manage equipment"
  ON public.equipment FOR ALL
  USING (public.is_tu_admin());

-- 3. Reservations Policies
-- Requirement: Faculty users can only manage their own reservation requests.
-- Requirement: Faculty users can view shared schedules without PII.
-- Requirement: Only central TU administrator can approve, reject, or request revisions.

DROP POLICY IF EXISTS "Faculty users insert own reservations" ON public.reservations;
CREATE POLICY "Faculty users insert own reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Faculty users update own pending reservations" ON public.reservations;
CREATE POLICY "Faculty users update own pending reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'revision_requested'))
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Faculty users select own full reservations" ON public.reservations;
CREATE POLICY "Faculty users select own full reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "TU Admin full access on reservations" ON public.reservations;
CREATE POLICY "TU Admin full access on reservations"
  ON public.reservations FOR ALL
  USING (public.is_tu_admin());

-- Shared schedule view for other faculty members (Transparent Calendar)
DROP POLICY IF EXISTS "Public authenticated view approved calendar" ON public.reservations;
CREATE POLICY "Public authenticated view approved calendar"
  ON public.reservations FOR SELECT
  USING (
    status IN ('approved', 'pending')
  );

-- 4. Reservation Equipment Policies
DROP POLICY IF EXISTS "Users view own reservation equipment" ON public.reservation_equipment;
CREATE POLICY "Users view own reservation equipment"
  ON public.reservation_equipment FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.reservations WHERE id = reservation_id AND (user_id = auth.uid() OR public.is_tu_admin()))
  );

DROP POLICY IF EXISTS "Users insert equipment for own booking" ON public.reservation_equipment;
CREATE POLICY "Users insert equipment for own booking"
  ON public.reservation_equipment FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.reservations WHERE id = reservation_id AND user_id = auth.uid())
  );

-- 5. Reservation Documents Policies (Strict Privacy)
-- Requirement: Only authorized users can access private uploaded documents.
DROP POLICY IF EXISTS "Strict private document access" ON public.reservation_documents;
CREATE POLICY "Strict private document access"
  ON public.reservation_documents FOR SELECT
  USING (
    uploaded_by = auth.uid() OR public.is_tu_admin()
  );

DROP POLICY IF EXISTS "Users upload own documents" ON public.reservation_documents;
CREATE POLICY "Users upload own documents"
  ON public.reservation_documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
  );

-- 6. Audit Trail Policies
DROP POLICY IF EXISTS "View audit history" ON public.reservation_status_history;
CREATE POLICY "View audit history"
  ON public.reservation_status_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.reservations WHERE id = reservation_id AND (user_id = auth.uid() OR public.is_tu_admin()))
  );

-- ====================================================================
-- STORAGE BUCKET CONFIGURATION (Private Bucket)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('reservation-documents', 'reservation-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS on storage.objects
DROP POLICY IF EXISTS "Private Uploads" ON storage.objects;
CREATE POLICY "Private Uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reservation-documents' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Private Document Download Policy" ON storage.objects;
CREATE POLICY "Private Document Download Policy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reservation-documents' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_tu_admin()
    )
  );
