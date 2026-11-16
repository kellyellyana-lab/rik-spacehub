import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { spaceHubService } from '../../services/spaceHubService';
import { Reservation, ReservationStatus } from '../../types';
import { StatusBadge, FacultyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  FileText,
  Clock,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ChevronRight,
  PlusCircle,
  XCircle,
  Download,
  Info,
  RotateCcw,
} from 'lucide-react';

export const MyReservations: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ReservationStatus>('all');
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionFileName, setRevisionFileName] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [successBannerCode, setSuccessBannerCode] = useState<string | null>(
    (location.state as any)?.newBookingCode || null
  );

  const fetchMyReservations = async () => {
    const list = await spaceHubService.getReservations(currentUser);
    const mine = list.filter((r) => r.userId === currentUser.id);
    setReservations(mine);
    if (activeReservation) {
      const refreshed = mine.find((r) => r.id === activeReservation.id);
      if (refreshed) setActiveReservation(refreshed);
    }
  };

  useEffect(() => {
    fetchMyReservations();

    // Subscribe to live updates
    const unsubscribe = spaceHubService.subscribeToRealtimeBookings(() => {
      fetchMyReservations();
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filtered = reservations.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.status === selectedFilter;
  });

  const handleConfirmCancel = async () => {
    if (!activeReservation) return;
    try {
      await spaceHubService.cancelReservation(
        activeReservation.id,
        currentUser,
        cancelReason || 'Dibatalkan oleh pemohon'
      );
      setIsCancelModalOpen(false);
      setCancelReason('');
      fetchMyReservations();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal membatalkan permohonan.');
    }
  };

  const handleResubmitRevision = async () => {
    if (!activeReservation) return;
    if (!revisionFileName.trim()) {
      alert('Harap pilih berkas PDF hasil perbaikan yang diminta TU.');
      return;
    }

    setIsSubmittingRevision(true);
    try {
      const newDoc = {
        id: `doc_rev_${Date.now()}`,
        name: revisionFileName,
        sizeBytes: 1540000,
        type: 'application/pdf',
        storagePath: `${currentUser.id}/${activeReservation.id}/${revisionFileName}`,
        url: '#',
        uploadedAt: new Date().toISOString(),
      };

      await spaceHubService.resubmitReservation(
        activeReservation.id,
        currentUser,
        [newDoc],
        revisionNote || 'Berkas revisi telah diunggah dan diajukan ulang ke TU Pusat.'
      );

      setIsRevisionModalOpen(false);
      setRevisionFileName('');
      setRevisionNote('');
      alert('Berkas revisi berhasil dikirim! Status permohonan kini kembali ke "Menunggu TU".');
      fetchMyReservations();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal mengajukan revisi.');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Banner if navigated from wizard */}
      {successBannerCode && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Permohonan Berhasil Dikirim ke TU Pusat RIK!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Nomor Tiket Anda:{' '}
                <strong className="font-mono bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-950">
                  {successBannerCode}
                </strong>
                . Pihak TU Pusat akan memverifikasi kelengkapan berkas maksimal dalam 1x24 jam kerja.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessBannerCode(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Riwayat & Status
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            My Requests (Permohonan Peminjaman Saya)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Lacak progres verifikasi dokumen oleh TU Pusat, instruksi revisi, dan status persetujuan.
          </p>
        </div>

        <Link to="/reservations/new">
          <Button icon={<PlusCircle className="w-4 h-4" />}>
            Buat Permohonan Baru
          </Button>
        </Link>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'Semua Status' },
          { key: 'pending', label: 'Menunggu TU' },
          { key: 'revision_requested', label: 'Perlu Revisi' },
          { key: 'approved', label: 'Disetujui' },
          { key: 'completed', label: 'Selesai' },
          { key: 'rejected', label: 'Ditolak' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
              selectedFilter === tab.key
                ? 'bg-[#1B4332] text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reservations List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-800">Tidak ada permohonan</h4>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            Belum ada permohonan peminjaman ruangan dengan kategori ini.
          </p>
          <Link to="/reservations/new">
            <Button size="sm" icon={<PlusCircle className="w-3.5 h-3.5" />}>
              Ajukan Peminjaman Sekarang
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((res) => (
            <div
              key={res.id}
              onClick={() => setActiveReservation(res)}
              className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                res.status === 'revision_requested'
                  ? 'border-orange-400 bg-orange-50/20 ring-1 ring-orange-300'
                  : 'border-stone-200 hover:border-emerald-600/40'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-stone-500">
                    {res.reservationCode}
                  </span>
                  <StatusBadge status={res.status} />
                  <span className="text-[11px] text-stone-400 font-medium">
                    Diajukan{' '}
                    {new Date(res.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-stone-900 line-clamp-1">
                  {res.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                  <span className="flex items-center gap-1 font-semibold text-stone-800">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    {res.facilityName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {new Date(res.startTime).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {new Date(res.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(res.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                </div>

                {res.status === 'revision_requested' && res.adminNotes && (
                  <p className="text-xs font-semibold text-orange-950 bg-orange-100/70 p-2 rounded-lg border border-orange-300 mt-2">
                    ⚠️ <strong>Catatan Revisi TU:</strong> {res.adminNotes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button variant="outline" size="sm" className="text-xs">
                  Lihat Detail Status
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservation Detail & Status History Modal */}
      {activeReservation && (
        <Modal
          isOpen={Boolean(activeReservation)}
          onClose={() => setActiveReservation(null)}
          title={`Detail Peminjaman: ${activeReservation.reservationCode}`}
          subtitle={`${activeReservation.facilityName} • ${activeReservation.userOrganization}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Status Summary Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Status Saat Ini
                </span>
                <div className="mt-1">
                  <StatusBadge status={activeReservation.status} />
                </div>
              </div>

              {activeReservation.status === 'approved' && (
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Persetujuan Resmi TU RIK
                  </span>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">
                    Oleh: {activeReservation.reviewedByName}
                  </p>
                </div>
              )}
            </div>

            {/* Admin Notes if any */}
            {activeReservation.adminNotes && (
              <div
                className={`p-4 rounded-xl border ${
                  activeReservation.status === 'revision_requested'
                    ? 'bg-orange-50 border-orange-300 text-orange-950'
                    : 'bg-amber-50/80 border-amber-300/80 text-amber-950'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-current" />
                  Catatan dari Tata Usaha Pusat:
                </h4>
                <p className="text-xs font-medium leading-relaxed">
                  "{activeReservation.adminNotes}"
                </p>
              </div>
            )}

            {/* Event Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/80">
                <span className="text-stone-400 font-bold uppercase tracking-wider block text-[10px]">
                  Judul Acara
                </span>
                <p className="font-bold text-stone-900 mt-0.5">{activeReservation.title}</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/80">
                <span className="text-stone-400 font-bold uppercase tracking-wider block text-[10px]">
                  Jadwal Waktu
                </span>
                <p className="font-bold text-stone-900 mt-0.5">
                  {new Date(activeReservation.startTime).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-emerald-800 font-bold">
                  {new Date(activeReservation.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(activeReservation.endTime).toLocaleTimeString([], {
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
                Peralatan Sarpras Tambahan
              </h4>
              {activeReservation.equipment.length === 0 ? (
                <p className="text-xs text-stone-500 italic">
                  Tidak ada peralatan tambahan yang dipinjam.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activeReservation.equipment.map((eq, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs text-stone-800 border border-stone-200/60"
                    >
                      <span className="font-medium">{eq.equipmentName}</span>
                      <span className="font-bold text-emerald-900">
                        {eq.quantityRequested} Unit
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents attached */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Dokumen Pendukung Terenkripsi (Private Bucket)
              </h4>
              <div className="space-y-1.5">
                {activeReservation.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <span className="font-semibold text-stone-800">{doc.name}</span>
                    </div>
                    <button
                      onClick={() =>
                        alert(
                          `Membuka berkas terenkripsi: ${doc.name} (Tersimpan aman dengan signed token Supabase)`
                        )
                      }
                      className="text-xs text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Riwayat Jejak Audit Perubahan Status
              </h4>
              <div className="space-y-3 pl-2 border-l-2 border-emerald-800/20">
                {activeReservation.history.map((hist, idx) => (
                  <div key={idx} className="relative pl-3 text-xs">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#1B4332]" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{hist.changedByName}</span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(hist.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {hist.notes && (
                      <p className="text-stone-600 text-[11px] mt-0.5">{hist.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {activeReservation.status === 'revision_requested' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<RotateCcw className="w-4 h-4" />}
                    onClick={() => {
                      setRevisionFileName(`Revisi_Surat_${activeReservation.reservationCode}.pdf`);
                      setIsRevisionModalOpen(true);
                    }}
                  >
                    Unggah Berkas Revisi & Ajukan Ulang
                  </Button>
                )}

                {(activeReservation.status === 'pending' || activeReservation.status === 'revision_requested') && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<XCircle className="w-4 h-4" />}
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    Batalkan Permohonan
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveReservation(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {isCancelModalOpen && activeReservation && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Batalkan Permohonan Peminjaman"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-stone-600">
              Apakah Anda yakin ingin membatalkan permohonan{' '}
              <strong>{activeReservation.reservationCode}</strong>? Tindakan ini tidak dapat diurungkan.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Alasan Pembatalan:
              </label>
              <textarea
                rows={3}
                placeholder="Misal: Perubahan tanggal kegiatan atau kendala panitia..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Kembali
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancel}
              >
                Ya, Batalkan Peminjaman
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Revision Resubmission Modal */}
      {isRevisionModalOpen && activeReservation && (
        <Modal
          isOpen={isRevisionModalOpen}
          onClose={() => setIsRevisionModalOpen(false)}
          title="Unggah Berkas Revisi Permohonan"
          subtitle={`Tiket: ${activeReservation.reservationCode} - ${activeReservation.facilityName}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900">
              <strong>Catatan Penolakan/Revisi TU:</strong>
              <p className="mt-0.5 italic">"{activeReservation.adminNotes || 'Harap perbaiki berkas pendukung'}"</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Pilih Berkas PDF Revisi:
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (!file.name.toLowerCase().endsWith('.pdf')) {
                      alert('Format berkas harus PDF!');
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      alert('Ukuran berkas melebihi batas 10MB!');
                      return;
                    }
                    setRevisionFileName(file.name);
                  }
                }}
                className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
              />
              {revisionFileName && (
                <p className="text-xs text-emerald-800 font-bold mt-1.5 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5" /> Berkas terpilih: {revisionFileName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Catatan Penjelasan Perbaikan untuk TU:
              </label>
              <textarea
                rows={3}
                placeholder="Misal: Sudah melampirkan tanda tangan Wadek 1 dan cap basah dekanat..."
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRevisionModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                disabled={isSubmittingRevision || !revisionFileName}
                onClick={handleResubmitRevision}
              >
                {isSubmittingRevision ? 'Mengirim...' : 'Kirim Ulang ke TU Pusat'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
