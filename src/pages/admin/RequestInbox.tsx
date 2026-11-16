import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { spaceHubService } from '../../services/spaceHubService';
import { Reservation, ReservationStatus, FacultyCode } from '../../types';
import { StatusBadge, FacultyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileCheck,
  Building2,
  Calendar,
  Clock,
  Phone,
  User,
  Download,
  AlertTriangle,
  Info,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

export const RequestInbox: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeReviewReq, setActiveReviewReq] = useState<Reservation | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    const list = await spaceHubService.getReservations(currentUser);
    setReservations(list);

    const reviewId = searchParams.get('reviewId');
    if (reviewId) {
      const target = list.find((r) => r.id === reviewId);
      if (target) {
        setActiveReviewReq(target);
        setAdminNote(target.adminNotes || '');
      }
    }
  };

  useEffect(() => {
    fetchRequests();
    // Subscribe to real-time updates
    const unsubscribe = spaceHubService.subscribeToRealtimeBookings(() => {
      fetchRequests();
    });
    return () => unsubscribe();
  }, [currentUser]);

  const filteredRequests = reservations.filter((r) => {
    const matchesSearch =
      r.reservationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.facilityName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFaculty =
      selectedFaculty === 'all' || r.userFaculty === selectedFaculty;

    const matchesStatus =
      selectedStatus === 'all' || r.status === selectedStatus;

    return matchesSearch && matchesFaculty && matchesStatus;
  });

  const handleApprove = async () => {
    if (!activeReviewReq) return;
    setIsProcessing(true);
    try {
      const note =
        adminNote ||
        'Disetujui oleh Tata Usaha Pusat RIK. Petugas teknisi dan ruangan akan disiapkan tepat waktu.';
      await spaceHubService.updateReservationStatus(
        activeReviewReq.id,
        'approved',
        note,
        currentUser
      );
      setActiveReviewReq(null);
      setAdminNote('');
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyetujui: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!activeReviewReq) return;
    if (!adminNote.trim()) {
      alert('Harap masukkan alasan penolakan pada kolom catatan untuk pemohon.');
      return;
    }
    setIsProcessing(true);
    try {
      await spaceHubService.updateReservationStatus(
        activeReviewReq.id,
        'rejected',
        adminNote,
        currentUser
      );
      setActiveReviewReq(null);
      setAdminNote('');
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menolak: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!activeReviewReq) return;
    if (!adminNote.trim()) {
      alert('Harap jelaskan berkas atau bagian mana yang perlu direvisi oleh pemohon.');
      return;
    }
    setIsProcessing(true);
    try {
      await spaceHubService.updateReservationStatus(
        activeReviewReq.id,
        'revision_requested',
        adminNote,
        currentUser
      );
      setActiveReviewReq(null);
      setAdminNote('');
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert(`Gagal meminta revisi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          Meja Verifikasi Tata Usaha
        </span>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
          Reservation Management (Inbox Persetujuan)
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Tinjau berkas izin dekanat 5 fakultas, setujui peminjaman, tolak, atau minta perbaikan berkas.
        </p>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode tiket, judul kegiatan, nama pemohon, atau ruangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-stone-500 shrink-0">Fakultas:</span>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">Semua Fakultas</option>
            <option value="FK">FK - Kedokteran</option>
            <option value="FF">FF - Farmasi</option>
            <option value="FKG">FKG - Kedokteran Gigi</option>
            <option value="FIK">FIK - Keperawatan</option>
            <option value="FKM">FKM - Kesmas</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-stone-500 shrink-0">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Review TU</option>
            <option value="revision_requested">Perlu Revisi Dokumen</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-stone-800">
              Tidak ada permohonan yang sesuai
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Semua permohonan telah ditangani atau sesuaikan kata kunci filter Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">Tiket & Pemohon</th>
                  <th className="py-3 px-4">Fakultas</th>
                  <th className="py-3 px-4">Kegiatan & Ruangan</th>
                  <th className="py-3 px-4">Jadwal Acara</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-stone-800">
                        {req.reservationCode}
                      </div>
                      <div className="text-stone-900 font-bold mt-0.5">{req.userName}</div>
                      <div className="text-[11px] text-stone-500">{req.userOrganization}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <FacultyBadge faculty={req.userFaculty} />
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-stone-900 line-clamp-1">{req.title}</div>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-stone-400" />
                        {req.facilityName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-800">
                        {new Date(req.startTime).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        {new Date(req.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(req.endTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant={
                          req.status === 'pending' || req.status === 'revision_requested'
                            ? 'primary'
                            : 'outline'
                        }
                        className="text-xs font-bold"
                        onClick={() => {
                          setActiveReviewReq(req);
                          setAdminNote(req.adminNotes || '');
                        }}
                      >
                        {req.status === 'pending' ? 'Tinjau & Putuskan' : 'Lihat Detail'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TU Review, Revision & Decision Modal */}
      {activeReviewReq && (
        <Modal
          isOpen={Boolean(activeReviewReq)}
          onClose={() => setActiveReviewReq(null)}
          title={`Verifikasi Permohonan: ${activeReviewReq.reservationCode}`}
          subtitle={`${activeReviewReq.title} • ${activeReviewReq.userOrganization}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Applicant Profile Card */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Data Pemohon
                </span>
                <p className="text-sm font-bold text-stone-900 mt-0.5">
                  {activeReviewReq.userName}
                </p>
                <p className="text-stone-500 font-mono text-[11px]">
                  NPM/NIP: {activeReviewReq.userNPM}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <FacultyBadge faculty={activeReviewReq.userFaculty} />
                  <span className="text-stone-700 font-semibold text-[11px]">
                    {activeReviewReq.userOrganization}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Kontak Narahubung
                </span>
                <p className="text-xs font-bold text-stone-800 mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  {activeReviewReq.userPhone}
                </p>
                <span className="text-[10px] text-stone-500 block mt-1">
                  Estimasi Peserta: <strong>{activeReviewReq.expectedAttendees} Orang</strong>
                </span>
              </div>
            </div>

            {/* Room & Time */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                  Ruangan RIK
                </span>
                <p className="text-sm font-bold text-emerald-950 mt-0.5">
                  {activeReviewReq.facilityName}
                </p>
                <p className="text-emerald-800 text-[11px]">
                  {activeReviewReq.facilityBuilding}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                  Waktu Peminjaman
                </span>
                <p className="text-xs font-bold text-emerald-950 mt-0.5">
                  {new Date(activeReviewReq.startTime).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-emerald-900 font-bold text-xs">
                  {new Date(activeReviewReq.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(activeReviewReq.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  WIB
                </p>
              </div>
            </div>

            {/* Equipment Requested */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Peralatan Sarpras Yang Diminta
              </h4>
              {activeReviewReq.equipment.length === 0 ? (
                <p className="text-xs text-stone-500 italic">
                  Tidak ada peralatan tambahan yang diajukan.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activeReviewReq.equipment.map((eq, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs border border-stone-200"
                    >
                      <span className="font-semibold text-stone-800">{eq.equipmentName}</span>
                      <span className="font-bold text-emerald-900">
                        {eq.quantityRequested} Unit Diminta
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attached Documents for TU Inspection */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Verifikasi Dokumen & Surat Izin Dekanat
              </h4>
              {activeReviewReq.documents.length === 0 ? (
                <p className="text-xs text-rose-600 font-medium">
                  ⚠️ Tidak ada dokumen perizinan yang dilampirkan oleh pemohon.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeReviewReq.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="w-5 h-5 text-emerald-700" />
                        <div>
                          <p className="font-bold text-stone-900">{doc.name}</p>
                          <p className="text-[10px] text-stone-500">
                            {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB • PDF Asli
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          alert(`Membuka berkas privat aman: ${doc.name} (Tervalidasi dengan signed token Supabase)`)
                        }
                        className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-xs font-bold text-stone-700 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Buka Berkas
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Decision & Notes Input */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Catatan Petugas TU (Wajib diisi bila Menolak / Meminta Revisi):
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Disetujui. Petugas teknisi proyektor standby 1 jam sebelumnya. ATAU: Surat izin dekanat belum ditandatangani, harap revisi..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            {/* Decision Buttons: Approve, Request Revision, Reject */}
            <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveReviewReq(null)}
              >
                Tutup
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Tolak */}
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isProcessing}
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={handleReject}
                >
                  Tolak
                </Button>

                {/* 2. Minta Revisi Dokumen */}
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isProcessing}
                  className="border-orange-400 text-orange-900 bg-orange-50 hover:bg-orange-100 font-bold"
                  icon={<RotateCcw className="w-4 h-4 text-orange-700" />}
                  onClick={handleRequestRevision}
                >
                  Minta Revisi
                </Button>

                {/* 3. Setujui & Jadwalkan */}
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isProcessing}
                  className="font-bold bg-[#1B4332] hover:bg-[#132A13]"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleApprove}
                >
                  Setujui & Jadwalkan
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
