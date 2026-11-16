import {
  Facility,
  Equipment,
  Reservation,
  ReservationStatus,
  DateConflict,
  EquipmentAvailabilityCheck,
  UserProfile,
} from '../types';
import {
  SEED_FACILITIES,
  SEED_EQUIPMENT,
  SEED_RESERVATIONS,
} from '../data/seedData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  FACILITIES: 'rik_spacehub_facilities_v1',
  EQUIPMENT: 'rik_spacehub_equipment_v1',
  RESERVATIONS: 'rik_spacehub_reservations_v1',
};

class SpaceHubService {
  private realtimeChannel: any = null;

  private getStored<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  private setStored<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  // --- FACILITIES ---
  async getFacilities(): Promise<Facility[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          building: d.building,
          floor: d.floor,
          capacity: d.capacity,
          roomType: d.room_type,
          description: d.description,
          amenities: Array.isArray(d.amenities) ? d.amenities : [],
          images: Array.isArray(d.images) ? d.images : [],
          rules: Array.isArray(d.rules) ? d.rules : [],
          isActive: d.is_active,
        }));
      }
    }
    return this.getStored<Facility[]>(STORAGE_KEYS.FACILITIES, SEED_FACILITIES);
  }

  async getFacilityById(id: string): Promise<Facility | undefined> {
    const facilities = await this.getFacilities();
    return facilities.find((f) => f.id === id);
  }

  async saveFacility(facility: Facility): Promise<Facility> {
    const facilities = await this.getFacilities();
    const index = facilities.findIndex((f) => f.id === facility.id);
    let updated: Facility[];
    if (index >= 0) {
      updated = [...facilities];
      updated[index] = facility;
    } else {
      updated = [facility, ...facilities];
    }
    this.setStored(STORAGE_KEYS.FACILITIES, updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('facilities').upsert({
        id: facility.id,
        code: facility.code,
        name: facility.name,
        building: facility.building,
        floor: facility.floor,
        capacity: facility.capacity,
        room_type: facility.roomType,
        description: facility.description,
        amenities: facility.amenities,
        images: facility.images,
        rules: facility.rules,
        is_active: facility.isActive,
      });
    }
    return facility;
  }

  // --- EQUIPMENT & OVERBOOKING PREVENTION ---
  async getEquipment(): Promise<Equipment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        return data.map((e) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          totalQuantity: e.total_quantity,
          availableQuantity: e.available_quantity,
          condition: e.condition,
          description: e.description,
          isActive: e.is_active,
        }));
      }
    }
    return this.getStored<Equipment[]>(STORAGE_KEYS.EQUIPMENT, SEED_EQUIPMENT);
  }

  async saveEquipment(item: Equipment): Promise<Equipment> {
    const items = await this.getEquipment();
    const index = items.findIndex((e) => e.id === item.id);
    let updated: Equipment[];
    if (index >= 0) {
      updated = [...items];
      updated[index] = item;
    } else {
      updated = [item, ...items];
    }
    this.setStored(STORAGE_KEYS.EQUIPMENT, updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('equipment').upsert({
        id: item.id,
        name: item.name,
        category: item.category,
        total_quantity: item.totalQuantity,
        available_quantity: item.availableQuantity,
        condition: item.condition,
        description: item.description,
        is_active: item.isActive,
      });
    }
    return item;
  }

  /**
   * REQUIREMENT 7: Prevent equipment overbooking based on inventory quantities.
   * Calculates total equipment units committed in other overlapping approved bookings.
   */
  async checkEquipmentAvailability(
    requests: Array<{ equipmentId: string; quantityRequested: number }>,
    startTime: string,
    endTime: string,
    excludeReservationId?: string
  ): Promise<EquipmentAvailabilityCheck> {
    const allEquipment = await this.getEquipment();
    const allReservations = this.getStored<Reservation[]>(
      STORAGE_KEYS.RESERVATIONS,
      SEED_RESERVATIONS
    );

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    // Find overlapping approved bookings
    const overlappingApproved = allReservations.filter((r) => {
      if (r.status !== 'approved') return false;
      if (excludeReservationId && r.id === excludeReservationId) return false;
      const rStart = new Date(r.startTime).getTime();
      const rEnd = new Date(r.endTime).getTime();
      return start < rEnd && end > rStart;
    });

    const exceededItems: EquipmentAvailabilityCheck['exceededItems'] = [];

    for (const req of requests) {
      const eq = allEquipment.find((e) => e.id === req.equipmentId);
      if (!eq) continue;

      // Sum units of this equipment already committed in the window
      let committedInWindow = 0;
      for (const res of overlappingApproved) {
        const item = res.equipment?.find((e) => e.equipmentId === req.equipmentId);
        if (item) {
          committedInWindow += item.quantityApproved ?? item.quantityRequested;
        }
      }

      const availableForWindow = Math.max(0, eq.totalQuantity - committedInWindow);
      if (req.quantityRequested > availableForWindow) {
        exceededItems.push({
          equipmentId: eq.id,
          name: eq.name,
          requested: req.quantityRequested,
          availableForWindow,
          totalStock: eq.totalQuantity,
        });
      }
    }

    return {
      isAvailable: exceededItems.length === 0,
      exceededItems,
    };
  }

  // --- REQUIREMENT 6: Prevent Overlapping Confirmed Room Bookings ---
  async checkDateConflict(
    facilityId: string,
    startTime: string,
    endTime: string,
    excludeReservationId?: string
  ): Promise<DateConflict> {
    // If Supabase is live, query database directly with tsrange overlap
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, title, start_time, end_time, facilities(name)')
        .eq('facility_id', facilityId)
        .eq('status', 'approved')
        .filter('start_time', 'lt', endTime)
        .filter('end_time', 'gt', startTime);

      if (!error && data) {
        const filtered = excludeReservationId
          ? data.filter((d: any) => d.id !== excludeReservationId)
          : data;

        return {
          hasConflict: filtered.length > 0,
          conflictingReservations: filtered.map((c: any) => ({
            id: c.id,
            title: c.title,
            startTime: c.start_time,
            endTime: c.end_time,
            facilityName: c.facilities?.name || 'Ruangan RIK',
          })),
        };
      }
    }

    // Local / fallback evaluation
    const reservations = this.getStored<Reservation[]>(
      STORAGE_KEYS.RESERVATIONS,
      SEED_RESERVATIONS
    );

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    const conflicts = reservations.filter((res) => {
      if (res.facilityId !== facilityId) return false;
      if (res.status !== 'approved') return false;
      if (excludeReservationId && res.id === excludeReservationId) return false;

      const resStart = new Date(res.startTime).getTime();
      const resEnd = new Date(res.endTime).getTime();
      return start < resEnd && end > resStart;
    });

    return {
      hasConflict: conflicts.length > 0,
      conflictingReservations: conflicts.map((c) => ({
        id: c.id,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        facilityName: c.facilityName,
      })),
    };
  }

  // --- RESERVATIONS & PRIVACY ---
  /**
   * REQUIREMENT 1 & 2 & 4:
   * - Faculty users can only manage and see full details of their own reservations.
   * - Faculty users can view shared schedules (without PII or private documents).
   * - Central TU Admin can see all details & private documents.
   */
  async getReservations(currentUser: UserProfile): Promise<Reservation[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          facilities (name, building, floor),
          profiles:user_id (full_name, faculty, phone_number, identity_number, organization),
          reservation_equipment (*, equipment(name)),
          reservation_documents (*),
          reservation_status_history (*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => {
          const isOwner = d.user_id === currentUser.id;
          const isAdmin = currentUser.role === 'tu_admin';

          return {
            id: d.id,
            reservationCode: d.reservation_code,
            userId: d.user_id,
            userName: isOwner || isAdmin ? d.profiles?.full_name || 'Pemohon RIK' : `Mahasiswa ${d.profiles?.faculty || ''}`,
            userFaculty: d.profiles?.faculty || 'FK',
            userPhone: isOwner || isAdmin ? d.profiles?.phone_number || '' : '***-****-****',
            userNPM: isOwner || isAdmin ? d.profiles?.identity_number || '' : '**********',
            userOrganization: d.profiles?.organization || '',
            facilityId: d.facility_id,
            facilityName: d.facilities?.name || 'Ruangan RIK',
            facilityBuilding: `${d.facilities?.building || ''} (Lt. ${d.facilities?.floor || ''})`,
            startTime: d.start_time,
            endTime: d.end_time,
            title: d.title,
            description: isOwner || isAdmin ? d.description : '(Deskripsi internal)',
            eventType: d.event_type,
            expectedAttendees: d.expected_attendees,
            status: d.status,
            adminNotes: isOwner || isAdmin ? d.admin_notes : undefined,
            reviewedByName: d.reviewed_by_id,
            reviewedAt: d.reviewed_at,
            createdAt: d.created_at,
            equipment: (d.reservation_equipment || []).map((re: any) => ({
              equipmentId: re.equipment_id,
              equipmentName: re.equipment?.name || 'Peralatan',
              quantityRequested: re.quantity_requested,
              quantityApproved: re.quantity_approved,
            })),
            documents: isOwner || isAdmin
              ? (d.reservation_documents || []).map((doc: any) => ({
                  id: doc.id,
                  name: doc.file_name,
                  sizeBytes: doc.file_size,
                  type: doc.file_type,
                  storagePath: doc.storage_path,
                  url: '#',
                  uploadedAt: doc.created_at,
                }))
              : [],
            history: (d.reservation_status_history || []).map((h: any) => ({
              status: h.status,
              timestamp: h.created_at,
              changedByName: h.changed_by_id || 'Sistem',
              notes: h.notes,
            })),
          };
        });
      }
    }

    // Local / fallback engine
    const rawReservations = this.getStored<Reservation[]>(
      STORAGE_KEYS.RESERVATIONS,
      SEED_RESERVATIONS
    );

    if (currentUser.role === 'tu_admin') {
      return rawReservations;
    }

    return rawReservations.map((res) => {
      if (res.userId === currentUser.id) {
        return res;
      }
      return {
        ...res,
        userName: `Delegasi ${res.userFaculty}`,
        userPhone: '***-****-****',
        userNPM: '**********',
        description: '(Deskripsi internal)',
        adminNotes: undefined,
        documents: [], // Hide private files
      };
    });
  }

  async createReservation(
    data: Omit<Reservation, 'id' | 'reservationCode' | 'createdAt' | 'history'>,
    currentUser: UserProfile
  ): Promise<Reservation> {
    // 1. Conflict Validation before creation
    const conflictCheck = await this.checkDateConflict(
      data.facilityId,
      data.startTime,
      data.endTime
    );
    if (conflictCheck.hasConflict) {
      throw new Error('Jadwal bentrok dengan acara yang telah disetujui sebelumnya!');
    }

    // 2. Equipment quota validation
    if (data.equipment && data.equipment.length > 0) {
      const eqCheck = await this.checkEquipmentAvailability(
        data.equipment.map((e) => ({
          equipmentId: e.equipmentId,
          quantityRequested: e.quantityRequested,
        })),
        data.startTime,
        data.endTime
      );
      if (!eqCheck.isAvailable) {
        const item = eqCheck.exceededItems[0];
        throw new Error(
          `Stok peralatan ${item.name} tidak mencukupi untuk rentang waktu ini (Tersedia: ${item.availableForWindow}).`
        );
      }
    }

    const reservations = this.getStored<Reservation[]>(
      STORAGE_KEYS.RESERVATIONS,
      SEED_RESERVATIONS
    );

    const year = new Date().getFullYear();
    const count = reservations.length + 1;
    const reservationCode = `RIK-${year}-${String(count).padStart(4, '0')}`;
    const id = `res_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newReservation: Reservation = {
      ...data,
      id,
      reservationCode,
      createdAt: nowIso,
      history: [
        {
          status: 'pending',
          timestamp: nowIso,
          changedByName: currentUser.name,
          notes: 'Permohonan peminjaman berhasil diajukan ke TU Pusat RIK.',
        },
      ],
    };

    const updated = [newReservation, ...reservations];
    this.setStored(STORAGE_KEYS.RESERVATIONS, updated);

    // Save to live Supabase if connected
    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from('reservations')
        .insert({
          reservation_code: reservationCode,
          user_id: currentUser.id,
          facility_id: data.facilityId,
          start_time: data.startTime,
          end_time: data.endTime,
          title: data.title,
          description: data.description,
          event_type: data.eventType,
          expected_attendees: data.expectedAttendees,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && inserted) {
        // Insert equipment items
        if (data.equipment && data.equipment.length > 0) {
          await supabase.from('reservation_equipment').insert(
            data.equipment.map((e) => ({
              reservation_id: inserted.id,
              equipment_id: e.equipmentId,
              quantity_requested: e.quantityRequested,
            }))
          );
        }

        // Insert documents
        if (data.documents && data.documents.length > 0) {
          await supabase.from('reservation_documents').insert(
            data.documents.map((d) => ({
              reservation_id: inserted.id,
              file_name: d.name,
              storage_path: d.storagePath || `${currentUser.id}/${inserted.id}/${d.name}`,
              file_type: d.type,
              file_size: d.sizeBytes,
              uploaded_by: currentUser.id,
            }))
          );
        }
      }
    }

    return newReservation;
  }

  /**
   * REQUIREMENT 3: Only Central TU Administrator can approve, reject, or request revisions.
   */
  async updateReservationStatus(
    reservationId: string,
    newStatus: ReservationStatus,
    adminNotes: string,
    adminUser: UserProfile
  ): Promise<Reservation> {
    if (adminUser.role !== 'tu_admin') {
      throw new Error('Akses ditolak: Hanya Administrator TU Pusat yang berwenang mengubah status permohonan.');
    }

    const reservations = this.getStored<Reservation[]>(
      STORAGE_KEYS.RESERVATIONS,
      SEED_RESERVATIONS
    );

    const index = reservations.findIndex((r) => r.id === reservationId);
    if (index === -1) {
      throw new Error('Permohonan tidak ditemukan.');
    }

    const current = reservations[index];

    // If approving, enforce double-booking prevention check once more
    if (newStatus === 'approved') {
      const conflict = await this.checkDateConflict(
        current.facilityId,
        current.startTime,
        current.endTime,
        current.id
      );
      if (conflict.hasConflict) {
        throw new Error(
          `Gagal menyetujui: Terdapat jadwal bentrok dengan acara "${conflict.conflictingReservations[0].title}".`
        );
      }

      // Check equipment quota availability before approving
      if (current.equipment && current.equipment.length > 0) {
        const eqCheck = await this.checkEquipmentAvailability(
          current.equipment.map((e) => ({
            equipmentId: e.equipmentId,
            quantityRequested: e.quantityApproved ?? e.quantityRequested,
          })),
          current.startTime,
          current.endTime,
          current.id
        );
        if (!eqCheck.isAvailable) {
          const item = eqCheck.exceededItems[0];
          throw new Error(
            `Gagal menyetujui: Kuota peralatan ${item.name} melampaui stok gudang untuk rentang jam ini (Tersedia: ${item.availableForWindow}).`
          );
        }
      }
    }

    const nowIso = new Date().toISOString();
    const updatedRecord: Reservation = {
      ...current,
      status: newStatus,
      adminNotes: adminNotes || current.adminNotes,
      reviewedByName: adminUser.name,
      reviewedAt: nowIso,
      history: [
        ...current.history,
        {
          status: newStatus,
          timestamp: nowIso,
          changedByName: adminUser.name,
          notes: adminNotes || `Status diubah menjadi ${newStatus}.`,
        },
      ],
    };

    reservations[index] = updatedRecord;
    this.setStored(STORAGE_KEYS.RESERVATIONS, reservations);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('reservations')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_by_id: adminUser.id,
          reviewed_at: nowIso,
        })
        .eq('id', reservationId);
    }

    return updatedRecord;
  }

  async resubmitReservation(
    reservationId: string,
    currentUser: UserProfile,
    newDocuments: any[],
    notes?: string
  ): Promise<Reservation> {
    const reservations = this.getStored<Reservation[]>(
      STORAGE_KEYS.RESERVATIONS,
      SEED_RESERVATIONS
    );

    const index = reservations.findIndex((r) => r.id === reservationId);
    if (index === -1) {
      throw new Error('Permohonan tidak ditemukan.');
    }

    const current = reservations[index];
    if (current.userId !== currentUser.id && currentUser.role !== 'tu_admin') {
      throw new Error('Anda tidak memiliki izin merevisi permohonan ini.');
    }

    const nowIso = new Date().toISOString();
    const mergedDocs = [...(current.documents || []), ...newDocuments];
    const updatedRecord: Reservation = {
      ...current,
      status: 'pending',
      documents: mergedDocs,
      history: [
        ...current.history,
        {
          status: 'pending',
          timestamp: nowIso,
          changedByName: currentUser.name,
          notes: notes || 'Berkas revisi telah diunggah dan diajukan ulang ke TU Pusat.',
        },
      ],
    };

    reservations[index] = updatedRecord;
    this.setStored(STORAGE_KEYS.RESERVATIONS, reservations);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('reservations')
        .update({ status: 'pending' })
        .eq('id', reservationId);

      if (newDocuments.length > 0) {
        await supabase.from('reservation_documents').insert(
          newDocuments.map((d) => ({
            reservation_id: reservationId,
            file_name: d.name,
            storage_path: d.storagePath || `${currentUser.id}/${reservationId}/${d.name}`,
            file_type: d.type || 'application/pdf',
            file_size: d.sizeBytes || 1024,
            uploaded_by: currentUser.id,
          }))
        );
      }
    }

    return updatedRecord;
  }

  async cancelReservation(
    reservationId: string,
    currentUser: UserProfile,
    reason: string
  ): Promise<Reservation> {
    const reservations = this.getStored<Reservation[]>(
      STORAGE_KEYS.RESERVATIONS,
      SEED_RESERVATIONS
    );

    const index = reservations.findIndex((r) => r.id === reservationId);
    if (index === -1) {
      throw new Error('Permohonan tidak ditemukan.');
    }

    const current = reservations[index];
    if (current.userId !== currentUser.id && currentUser.role !== 'tu_admin') {
      throw new Error('Anda tidak memiliki izin membatalkan permohonan ini.');
    }

    const nowIso = new Date().toISOString();
    const updatedRecord: Reservation = {
      ...current,
      status: 'cancelled',
      history: [
        ...current.history,
        {
          status: 'cancelled',
          timestamp: nowIso,
          changedByName: currentUser.name,
          notes: `Dibatalkan oleh pemohon: ${reason}`,
        },
      ],
    };

    reservations[index] = updatedRecord;
    this.setStored(STORAGE_KEYS.RESERVATIONS, reservations);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);
    }

    return updatedRecord;
  }

  // --- REQUIREMENT 5: Real-time Updates for Confirmed Bookings ---
  subscribeToRealtimeBookings(onUpdate: (payload: any) => void): () => void {
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const channel = client
        .channel('public:reservations')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reservations' },
          (payload) => {
            console.log('[Supabase Realtime] Booking update received:', payload);
            onUpdate(payload);
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }

    // Demo Mode listener using window storage events across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.RESERVATIONS) {
        onUpdate({ event: 'LOCAL_STORAGE_CHANGE' });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }
}

export const spaceHubService = new SpaceHubService();
