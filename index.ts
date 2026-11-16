export type FacultyCode = 'FK' | 'FKG' | 'FKM' | 'FF' | 'FIK' | 'PUSAT_RIK';

export interface FacultyMeta {
  code: FacultyCode;
  name: string;
  shortName: string;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
}

export type UserRole = 'faculty_user' | 'tu_admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  faculty: FacultyCode;
  identityNumber: string; // NPM or NIP
  phone: string;
  organization: string; // e.g. BEM FK UI, HMD Farmasi, Departemen IKM
  avatarUrl: string;
}

export type RoomType =
  | 'auditorium'
  | 'amphitheater'
  | 'discussion_room'
  | 'cbt_lab'
  | 'meeting_room'
  | 'open_space';

export interface Facility {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  roomType: RoomType;
  description: string;
  amenities: string[];
  images: string[];
  rules: string[];
  isActive: boolean;
}

export type EquipmentCategory = 'audio_visual' | 'furniture' | 'electronics' | 'other';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  totalQuantity: number;
  availableQuantity: number;
  condition: 'Baik' | 'Perlu Perbaikan' | 'Dalam Perawatan';
  description: string;
  isActive: boolean;
}

export type ReservationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'cancelled'
  | 'completed';

export type EventType =
  | 'academic'
  | 'student_org'
  | 'faculty_seminar'
  | 'guest_lecture'
  | 'workshop'
  | 'other';

export interface ReservationEquipmentItem {
  equipmentId: string;
  equipmentName: string;
  quantityRequested: number;
  quantityApproved?: number;
}

export interface ReservationDocument {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  url: string;
  storagePath?: string;
  uploadedAt: string;
}

export interface StatusHistoryItem {
  status: ReservationStatus;
  timestamp: string;
  changedByName: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  reservationCode: string; // e.g., RIK-2026-0042
  userId: string;
  userName: string;
  userFaculty: FacultyCode;
  userPhone: string;
  userNPM: string;
  userOrganization: string;
  facilityId: string;
  facilityName: string;
  facilityBuilding: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  title: string;
  description: string;
  eventType: EventType;
  expectedAttendees: number;
  equipment: ReservationEquipmentItem[];
  documents: ReservationDocument[];
  status: ReservationStatus;
  adminNotes?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  history: StatusHistoryItem[];
}

export interface DateConflict {
  hasConflict: boolean;
  conflictingReservations: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    facilityName: string;
  }>;
}

export interface EquipmentAvailabilityCheck {
  isAvailable: boolean;
  exceededItems: Array<{
    equipmentId: string;
    name: string;
    requested: number;
    availableForWindow: number;
    totalStock: number;
  }>;
}

export interface ConnectionStatus {
  mode: 'supabase_live' | 'demo_local';
  supabaseUrl?: string;
  isRealtimeActive: boolean;
}
