import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { spaceHubService } from '../../services/spaceHubService';
import { supabaseStorageService } from '../../services/supabaseStorage';
import {
  Facility,
  Equipment,
  ReservationEquipmentItem,
  ReservationDocument,
  DateConflict,
  EquipmentAvailabilityCheck,
  EventType,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { FacultyBadge } from '../../components/ui/Badge';
import {
  Calendar,
  Clock,
  Building2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Boxes,
  Users,
  ShieldCheck,
  FileCheck,
  Trash2,
} from 'lucide-react';

export const NewReservationWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Form State
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    searchParams.get('facilityId') || ''
  );
  const [date, setDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    return tomorrow.toISOString().split('T')[0];
  });
  const [startTimeStr, setStartTimeStr] = useState<string>('09:00');
  const [endTimeStr, setEndTimeStr] = useState<string>('12:00');

  // Conflict Checking State
  const [conflictResult, setConflictResult] = useState<DateConflict>({
    hasConflict: false,
    conflictingReservations: [],
  });

  // Equipment Overbooking State
  const [equipmentQuotaCheck, setEquipmentQuotaCheck] = useState<EquipmentAvailabilityCheck>({
    isAvailable: true,
    exceededItems: [],
  });

  // Step 2 State
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('student_org');
  const [expectedAttendees, setExpectedAttendees] = useState<number>(50);
  const [description, setDescription] = useState('');

  // Step 3 State: Equipment items
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, number>>({});

  // Step 4 State: Documents
  const [documents, setDocuments] = useState<ReservationDocument[]>([
    {
      id: 'doc_init_1',
      name: `Surat_Pengantar_Dekanat_${currentUser.faculty}_2026.pdf`,
      sizeBytes: 1240000,
      type: 'application/pdf',
      url: '#',
      storagePath: `${currentUser.id}/temp/Surat_Pengantar_Dekanat.pdf`,
      uploadedAt: new Date().toISOString(),
    },
  ]);

  // Load master data
  useEffect(() => {
    const fetch = async () => {
      const [f, eq] = await Promise.all([
        spaceHubService.getFacilities(),
        spaceHubService.getEquipment(),
      ]);
      setFacilities(f);
      setEquipmentList(eq);
      if (!selectedFacilityId && f.length > 0) {
        setSelectedFacilityId(f[0].id);
      }
    };
    fetch();
  }, []);

  const getFullIsoDates = () => {
    const startIso = new Date(`${date}T${startTimeStr}:00`).toISOString();
    const endIso = new Date(`${date}T${endTimeStr}:00`).toISOString();
    return { startIso, endIso };
  };

  // Run room conflict check whenever facility or time changes
  useEffect(() => {
    if (!selectedFacilityId || !date || !startTimeStr || !endTimeStr) return;

    const check = async () => {
      try {
        const { startIso, endIso } = getFullIsoDates();
        const res = await spaceHubService.checkDateConflict(
          selectedFacilityId,
          startIso,
          endIso
        );
        setConflictResult(res);
      } catch (err) {
        console.error('Conflict check error:', err);
      }
    };

    check();
  }, [selectedFacilityId, date, startTimeStr, endTimeStr]);

  // Run equipment overbooking check whenever selected equipment or time changes
  useEffect(() => {
    const checkQuota = async () => {
      const { startIso, endIso } = getFullIsoDates();
      const requests = Object.entries(selectedEquipment).map(([equipmentId, quantityRequested]) => ({
        equipmentId,
        quantityRequested,
      }));

      if (requests.length === 0) {
        setEquipmentQuotaCheck({ isAvailable: true, exceededItems: [] });
        return;
      }

      const result = await spaceHubService.checkEquipmentAvailability(
        requests,
        startIso,
        endIso
      );
      setEquipmentQuotaCheck(result);
    };

    checkQuota();
  }, [selectedEquipment, date, startTimeStr, endTimeStr]);

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  const handleEquipmentChange = (eqId: string, qty: number) => {
    setSelectedEquipment((prev) => {
      if (qty <= 0) {
        const copy = { ...prev };
        delete copy[eqId];
        return copy;
      }
      return { ...prev, [eqId]: qty };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploadingDoc(true);
        const uploadedDoc = await supabaseStorageService.uploadPrivateDocument(
          file,
          currentUser.id,
          'draft_submission'
        );
        setDocuments((prev) => [...prev, uploadedDoc]);
      } catch (err: any) {
        alert(err.message || 'Gagal mengunggah berkas.');
      } finally {
        setIsUploadingDoc(false);
      }
    }
  };

  const handleRemoveDoc = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmit = async () => {
    if (!selectedFacility) return;
    setIsSubmitting(true);

    try {
      const { startIso, endIso } = getFullIsoDates();

      const equipmentPayload: ReservationEquipmentItem[] = Object.entries(
        selectedEquipment
      ).map(([eqId, qty]) => {
        const eqObj = equipmentList.find((e) => e.id === eqId);
        return {
          equipmentId: eqId,
          equipmentName: eqObj ? eqObj.name : 'Peralatan',
          quantityRequested: qty,
        };
      });

      const newReservation = await spaceHubService.createReservation(
        {
          userId: currentUser.id,
          userName: currentUser.name,
          userFaculty: currentUser.faculty,
          userPhone: currentUser.phone,
          userNPM: currentUser.identityNumber,
          userOrganization: currentUser.organization,
          facilityId: selectedFacility.id,
          facilityName: selectedFacility.name,
          facilityBuilding: `${selectedFacility.building} (Lt. ${selectedFacility.floor})`,
          startTime: startIso,
          endTime: endIso,
          title: eventTitle,
          description: description,
          eventType: eventType,
          expectedAttendees: Number(expectedAttendees),
          equipment: equipmentPayload,
          documents: documents,
          status: 'pending',
        },
        currentUser
      );

      navigate('/my-reservations', {
        state: { newBookingCode: newReservation.reservationCode },
      });
    } catch (err: any) {
      console.error(err);
      alert(`Gagal mengirimkan permohonan: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    'Pilih Waktu & Ruang',
    'Detail Kegiatan',
    'Peralatan & Sarpras',
    'Unggah Dokumen',
    'Review & Kirim',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          Formulir Pengajuan
        </span>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
          Reservation Form (Reservasi Fasilitas RIK UI)
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Ikuti 5 langkah untuk mengajukan permohonan penggunaan sarpras bersama ke TU Pusat RIK.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="grid grid-cols-5 gap-2">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isDone = step > stepNum;
            const isCurrent = step === stepNum;
            return (
              <div
                key={stepNum}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                    : isDone
                    ? 'text-stone-700 font-semibold'
                    : 'text-stone-400 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    isCurrent
                      ? 'bg-[#1B4332] text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                </div>
                <span className="text-[11px] leading-tight hidden sm:inline">
                  {title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Content Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        {/* STEP 1: TIME & ROOM */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Langkah 1: Tentukan Ruangan dan Jadwal Peminjaman
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Sistem otomatis memverifikasi bentrok jadwal dengan constraint PostgreSQL BTree-GIST.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Pilih Ruangan RIK
                  </label>
                  <select
                    value={selectedFacilityId}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.building} - Kapasitas {f.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Tanggal Kegiatan
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Waktu Mulai
                    </label>
                    <input
                      type="time"
                      value={startTimeStr}
                      onChange={(e) => setStartTimeStr(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Waktu Selesai
                    </label>
                    <input
                      type="time"
                      value={endTimeStr}
                      onChange={(e) => setEndTimeStr(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>
                </div>
              </div>

              {/* Room Snapshot & Conflict Status Box */}
              <div className="space-y-4">
                {selectedFacility && (
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <img
                      src={selectedFacility.images[0]}
                      alt={selectedFacility.name}
                      className="w-full h-32 rounded-lg object-cover mb-3"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        {selectedFacility.name}
                      </span>
                      <span className="text-xs font-semibold text-emerald-800">
                        Max {selectedFacility.capacity} org
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {selectedFacility.building} • Lantai {selectedFacility.floor}
                    </p>
                  </div>
                )}

                {/* Realtime Conflict Indicator */}
                {conflictResult.hasConflict ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-900">
                          Jadwal Bentrok Terdeteksi!
                        </h4>
                        <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                          Ruangan ini sudah dipesan pada rentang waktu yang sama oleh:
                        </p>
                        <ul className="mt-2 space-y-1">
                          {conflictResult.conflictingReservations.map((c) => (
                            <li
                              key={c.id}
                              className="text-[11px] font-semibold bg-rose-100/70 p-1.5 rounded"
                            >
                              • {c.title} (
                              {new Date(c.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(c.endTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              )
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] text-rose-800 font-medium mt-2">
                          Silakan ubah jam mulai/selesai atau pilih ruangan lain.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        Jadwal Tersedia!
                      </h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Tidak ada reservasi lain yang bentrok pada jam ini.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: EVENT DETAILS */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Langkah 2: Detail Kegiatan & Organisasi Pemohon
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Informasi ini akan diverifikasi oleh Tata Usaha Pusat RIK.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div>
                <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                  Nama Pemohon:
                </span>
                <p className="text-xs font-bold text-stone-800">{currentUser.name}</p>
                <p className="text-[11px] text-stone-500">NPM/NIP: {currentUser.identityNumber}</p>
              </div>
              <div>
                <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                  Fakultas & Organisasi:
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <FacultyBadge faculty={currentUser.faculty} />
                  <span className="text-xs font-bold text-stone-800">
                    {currentUser.organization}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nama / Tajuk Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kuliah Umum Farmakoterapi Lintas Rumpun Ilmu Kesehatan"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Kategori Acara
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    <option value="student_org">Kegiatan Mahasiswa / Ormawa</option>
                    <option value="academic">Perkuliahan / Tutorial / Ujian</option>
                    <option value="faculty_seminar">Seminar / Simposium Fakultas</option>
                    <option value="guest_lecture">Kuliah Tamu / Pakar Eksternal</option>
                    <option value="workshop">Workshop / Pelatihan Klinis</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Estimasi Jumlah Hadir (Orang)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedFacility?.capacity || 500}
                    value={expectedAttendees}
                    onChange={(e) => setExpectedAttendees(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Deskripsi Singkat & Tujuan Peminjaman
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan ringkasan acara, kebutuhan khusus, dan susunan panitia..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: EQUIPMENT SELECTION & OVERBOOKING PREVENT */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Langkah 3: Peminjaman Peralatan Pendukung (Opsional)
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Pilih peralatan yang dikelola oleh Tata Usaha Pusat RIK. Sistem otomatis memvalidasi kuota stok terhadap peminjaman lain.
              </p>
            </div>

            {/* Overbooking Alert Banner if triggered */}
            {!equipmentQuotaCheck.isAvailable && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">
                      Peringatan Overbooking Peralatan!
                    </h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Jumlah unit yang diminta melebihi stok fisik yang tersedia di jendela waktu ini:
                    </p>
                    <ul className="mt-1 space-y-1">
                      {equipmentQuotaCheck.exceededItems.map((ex) => (
                        <li key={ex.equipmentId} className="text-[11px] font-semibold text-rose-900">
                          • {ex.name}: Diminta {ex.requested} unit (Hanya tersisa {ex.availableForWindow} unit dari total {ex.totalStock} unit).
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {equipmentList.map((eq) => {
                const currentQty = selectedEquipment[eq.id] || 0;
                return (
                  <div
                    key={eq.id}
                    className={`p-4 rounded-xl border transition-all ${
                      currentQty > 0
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                        : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{eq.name}</h4>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                          {eq.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-700 shrink-0">
                        Total: {eq.totalQuantity} Unit
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-600">Jumlah Pinjam:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEquipmentChange(eq.id, currentQty - 1)}
                          disabled={currentQty <= 0}
                          className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 disabled:opacity-40 text-stone-800 font-bold text-sm flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-stone-900">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEquipmentChange(eq.id, currentQty + 1)}
                          disabled={currentQty >= eq.totalQuantity}
                          className="w-7 h-7 rounded-lg bg-[#1B4332] hover:bg-[#132A13] disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: PRIVATE DOCUMENT UPLOAD */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Langkah 4: Unggah Dokumen Pendukung & Izin Dekanat
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Wajib melampirkan Surat Pengantar Dekanat atau Proposal Kegiatan berformat PDF.
              </p>
            </div>

            {/* Privacy Alert */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
              <p className="text-xs text-emerald-900">
                <strong>Enkripsi Private Bucket Supabase:</strong> Dokumen yang Anda unggah disimpan dalam storage privat. Hanya Anda dan Admin TU Pusat yang dapat mengakses berkas ini dengan signed token 1 jam.
              </p>
            </div>

            {/* Upload Dropzone */}
            <div className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center hover:border-emerald-700 bg-stone-50/50 transition-colors">
              <UploadCloud className="w-10 h-10 text-emerald-800 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-800">
                Klik untuk memilih file PDF atau dokumen pendukung
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Format: PDF, DOCX, JPG (Maks. 10 MB per file)
              </p>
              <label className="inline-block mt-3">
                <span className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-bold cursor-pointer hover:bg-[#132A13] shadow-xs">
                  {isUploadingDoc ? 'Mengunggah ke Storage...' : 'Pilih Berkas Komputer'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.jpg,.png"
                  onChange={handleFileUpload}
                  disabled={isUploadingDoc}
                />
              </label>
            </div>

            {/* Uploaded Documents List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Dokumen Terlampir ({documents.length}):
              </h4>
              {documents.length === 0 ? (
                <p className="text-xs text-stone-400 italic">Belum ada dokumen yang diunggah.</p>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200"
                  >
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-emerald-700" />
                      <div>
                        <p className="text-xs font-bold text-stone-900">{doc.name}</p>
                        <p className="text-[10px] text-stone-500">
                          {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB • Terenkripsi
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200/50 transition-colors"
                      title="Hapus berkas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Langkah 5: Konfirmasi & Kirim Permohonan
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Tinjau kembali data permohonan Anda sebelum diteruskan ke meja verifikasi Tata Usaha Pusat RIK.
              </p>
            </div>

            <div className="border border-stone-200 rounded-2xl p-5 space-y-4 bg-stone-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Fasilitas Yang Dipinjam
                  </span>
                  <p className="text-sm font-bold text-stone-900 mt-0.5">
                    {selectedFacility?.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {selectedFacility?.building} (Lt. {selectedFacility?.floor})
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Jadwal Waktu
                  </span>
                  <p className="text-sm font-bold text-stone-900 mt-0.5">
                    {new Date(date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-emerald-800 font-bold">
                    Pukul {startTimeStr} - {endTimeStr} WIB
                  </p>
                </div>
              </div>

              <div className="space-y-2 pb-4 border-b border-stone-200">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Nama Kegiatan
                </span>
                <p className="text-sm font-bold text-stone-900">{eventTitle || '(Belum diisi)'}</p>
                <div className="flex items-center gap-2">
                  <FacultyBadge faculty={currentUser.faculty} />
                  <span className="text-xs text-stone-600 font-medium">
                    Estimasi: {expectedAttendees} Peserta
                  </span>
                </div>
              </div>

              {/* Equipment summary */}
              <div className="pb-4 border-b border-stone-200">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Peralatan Tambahan:
                </span>
                {Object.keys(selectedEquipment).length === 0 ? (
                  <p className="text-xs text-stone-500 italic mt-0.5">
                    Tidak ada peralatan tambahan yang dipinjam.
                  </p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {Object.entries(selectedEquipment).map(([eqId, qty]) => {
                      const item = equipmentList.find((e) => e.id === eqId);
                      return (
                        <li key={eqId} className="text-xs text-stone-700 font-medium">
                          • {item?.name} : <strong>{qty} unit</strong>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Documents summary */}
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Dokumen Pendukung:
                </span>
                <ul className="mt-1 space-y-1">
                  {documents.map((d) => (
                    <li key={d.id} className="text-xs text-stone-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{d.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Buttons */}
        <div className="mt-8 pt-5 border-t border-stone-200 flex items-center justify-between">
          {step > 1 ? (
            <Button
              variant="outline"
              size="md"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setStep(step - 1)}
            >
              Kembali
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              disabled={
                (step === 1 && conflictResult.hasConflict) ||
                (step === 3 && !equipmentQuotaCheck.isAvailable)
              }
              onClick={() => {
                if (step === 2 && !eventTitle.trim()) {
                  alert('Harap isi nama kegiatan terlebih dahulu.');
                  return;
                }
                setStep(step + 1);
              }}
            >
              Lanjutkan
            </Button>
          ) : (
            <Button
              size="md"
              isLoading={isSubmitting}
              className="bg-[#1B4332] hover:bg-[#132A13] font-bold text-sm px-6"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleSubmit}
            >
              Kirim Permohonan ke TU Pusat RIK
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
