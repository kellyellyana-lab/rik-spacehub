import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { spaceHubService } from '../../services/spaceHubService';
import { Reservation, ReservationStatus } from '../../types';
import { StatusBadge, FacultyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  History,
  Search,
  Filter,
  Download,
  Building2,
  Calendar,
  Clock,
  FileCheck,
  Star,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export const BookingHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const [historyList, setHistoryList] = useState<Reservation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'cancelled' | 'rejected'>('all');
  const [receiptReservation, setReceiptReservation] = useState<Reservation | null>(null);
  const [feedbackReservation, setFeedbackReservation] = useState<Reservation | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const all = await spaceHubService.getReservations(currentUser);
      // Filter reservations belonging to currentUser or past events
      const past = all.filter((r) => {
        const isPastDate = new Date(r.endTime).getTime() < Date.now();
        const isEndedStatus = r.status === 'completed' || r.status === 'cancelled' || r.status === 'rejected';
        const isMine = r.userId === currentUser.id;
        return isMine && (isEndedStatus || isPastDate);
      });
      setHistoryList(past);
    };
    fetch();
  }, [currentUser]);

  const filtered = historyList.filter((r) => {
    const matchesSearch =
      r.reservationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.facilityName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === 'all' || r.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const handleSendFeedback = () => {
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackReservation(null);
      setFeedbackSubmitted(false);
      setFeedbackText('');
      alert('Terima kasih! Ulasan fasilitas Anda telah dicatat untuk audit mutu TU RIK UI.');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Arsip & Riwayat
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Riwayat Peminjaman Fasilitas
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Daftar kegiatan yang telah terlaksana, arsip surat izin peminjaman, dan bukti pemakaian sarpras.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari arsip berdasarkan kode tiket, judul kegiatan, atau ruangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-stone-500 shrink-0">Status:</span>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">Semua Riwayat</option>
            <option value="completed">Selesai Terlaksana</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* History Items */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <History className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-800">Belum ada riwayat kegiatan</h4>
          <p className="text-xs text-stone-500 mt-1">
            Kegiatan yang telah selesai atau dibatalkan akan otomatis masuk ke dalam arsip ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-700/30 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-500">
                    {item.reservationCode}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                  <span className="text-[11px] text-stone-400 font-medium">
                    {new Date(item.startTime).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-stone-900">{item.title}</h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-semibold text-stone-700">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    {item.facilityName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    Pukul{' '}
                    {new Date(item.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(item.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                </div>

                {item.adminNotes && (
                  <p className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200/60 max-w-2xl">
                    <strong>Catatan TU:</strong> {item.adminNotes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                {item.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    icon={<Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    onClick={() => setFeedbackReservation(item)}
                  >
                    Beri Ulasan
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold"
                  icon={<FileText className="w-3.5 h-3.5 text-emerald-800" />}
                  onClick={() => setReceiptReservation(item)}
                >
                  Bukti Peminjaman
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Receipt / Surat Bukti Peminjaman Modal */}
      {receiptReservation && (
        <Modal
          isOpen={Boolean(receiptReservation)}
          onClose={() => setReceiptReservation(null)}
          title="Surat Bukti Izin Penggunaan Fasilitas RIK"
          subtitle={`Kode Registrasi: ${receiptReservation.reservationCode}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 print:p-0">
            {/* Header Letterhead Simulation */}
            <div className="border-b-2 border-stone-800 pb-4 text-center space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-900">
                UNIVERSITAS INDONESIA
              </h3>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                KANTOR TATA USAHA & SARANA PRASARANA RUMPUN ILMU KESEHATAN (RIK)
              </h4>
              <p className="text-[10px] text-stone-500">
                Kampus UI Salemba & Depok, Gedung Pelayanan Bersama RIK UI • Telp: (021) 786-4126
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-stone-900 underline underline-offset-4">
                SURAT KETERANGAN VERIFIKASI PEMINJAMAN RUANGAN
              </h4>
              <p className="text-[11px] font-mono text-stone-600 mt-1">
                Nomor: {receiptReservation.reservationCode}/RIK-UI/SARPRAS/2026
              </p>
            </div>

            {/* Details Table */}
            <div className="border border-stone-300 rounded-xl overflow-hidden text-xs">
              <table className="w-full divide-y divide-stone-200">
                <tbody className="divide-y divide-stone-200">
                  <tr className="bg-stone-50">
                    <td className="py-2.5 px-3.5 font-bold text-stone-600 w-1/3">Nama Pemohon</td>
                    <td className="py-2.5 px-3.5 font-bold text-stone-900">{receiptReservation.userName}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-stone-600">NPM / Identitas</td>
                    <td className="py-2.5 px-3.5 font-mono text-stone-900">{receiptReservation.userNPM}</td>
                  </tr>
                  <tr className="bg-stone-50">
                    <td className="py-2.5 px-3.5 font-bold text-stone-600">Fakultas & Organisasi</td>
                    <td className="py-2.5 px-3.5 text-stone-900">
                      {receiptReservation.userFaculty} - {receiptReservation.userOrganization}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-stone-600">Nama Kegiatan</td>
                    <td className="py-2.5 px-3.5 font-bold text-stone-900">{receiptReservation.title}</td>
                  </tr>
                  <tr className="bg-stone-50">
                    <td className="py-2.5 px-3.5 font-bold text-stone-600">Fasilitas / Ruangan</td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-950">
                      {receiptReservation.facilityName} ({receiptReservation.facilityBuilding})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-stone-600">Waktu Pelaksanaan</td>
                    <td className="py-2.5 px-3.5 text-stone-900">
                      {new Date(receiptReservation.startTime).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      , Pukul{' '}
                      {new Date(receiptReservation.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(receiptReservation.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </td>
                  </tr>
                  <tr className="bg-stone-50">
                    <td className="py-2.5 px-3.5 font-bold text-stone-600">Status Persetujuan</td>
                    <td className="py-2.5 px-3.5">
                      <StatusBadge status={receiptReservation.status} size="sm" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Signature Section */}
            <div className="flex justify-between items-end pt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-16 h-16 border-2 border-stone-800 rounded-lg flex items-center justify-center font-mono font-bold text-[9px] text-center p-1">
                  QR VERIFIED RIK UI
                </div>
                <div className="text-[10px] text-stone-500">
                  <p>Dokumen digital sah</p>
                  <p>Tervalidasi di sistem RIK SpaceHub</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[11px] text-stone-500">Depok, {new Date().toLocaleDateString('id-ID')}</p>
                <p className="font-bold text-stone-800 mt-1">Kepala Tata Usaha Pusat RIK UI,</p>
                <div className="my-2 font-serif italic text-emerald-900 font-bold text-sm">
                  Dr. Ratna Widjaja, M.Kes
                </div>
                <p className="text-[10px] font-mono text-stone-500">NIP: 197508152002122001</p>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReceiptReservation(null)}>
                Tutup
              </Button>
              <Button
                size="sm"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Cetak Surat Bukti (PDF)
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Feedback Rating Modal */}
      {feedbackReservation && (
        <Modal
          isOpen={Boolean(feedbackReservation)}
          onClose={() => setFeedbackReservation(null)}
          title="Ulasan & Evaluasi Fasilitas"
          subtitle={feedbackReservation.title}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-stone-600">
              Bagikan penilaian Anda mengenai kebersihan, pendingin udara (AC), dan kelengkapan audio-visual di{' '}
              <strong>{feedbackReservation.facilityName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Rating Kualitas Fasilitas:
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Kritik & Saran untuk Petugas TU:
              </label>
              <textarea
                rows={3}
                placeholder="Misal: AC sangat dingin, mikrofon jernih, proyektor tajam..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setFeedbackReservation(null)}>
                Batal
              </Button>
              <Button size="sm" isLoading={feedbackSubmitted} onClick={handleSendFeedback}>
                Kirim Ulasan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
