import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { spaceHubService } from '../../services/spaceHubService';
import { Reservation, Facility, FacultyCode } from '../../types';
import { FacultyBadge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Building2,
  Clock,
  Filter,
  PlusCircle,
  MapPin,
  ShieldCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';

export const SharedCalendar: React.FC = () => {
  const { currentUser, isTUAdmin, connectionMode } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const fetchBookings = async () => {
    const [res, fac] = await Promise.all([
      spaceHubService.getReservations(currentUser),
      spaceHubService.getFacilities(),
    ]);
    setReservations(res);
    setFacilities(fac);
    setLastSyncTime(new Date());
  };

  useEffect(() => {
    fetchBookings();

    // REQUIREMENT 5: Real-time updates for confirmed bookings
    const unsubscribe = spaceHubService.subscribeToRealtimeBookings((payload) => {
      console.log('Real-time calendar trigger received:', payload);
      fetchBookings();
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Selected date reference
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + selectedDayOffset);

  const filteredReservations = reservations.filter((r) => {
    const isApprovedOrPending = r.status === 'approved' || r.status === 'pending';
    if (!isApprovedOrPending) return false;

    const matchesFaculty =
      selectedFaculty === 'all' || r.userFaculty === selectedFaculty;
    const matchesFacility =
      selectedFacility === 'all' || r.facilityId === selectedFacility;

    return matchesFaculty && matchesFacility;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Jadwal Bersama
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
              Live Sync Real-Time
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight mt-0.5">
            Room Calendar (Kalender Terpadu RIK UI)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Transparansi jadwal penggunaan sarana dan prasarana bersama 5 fakultas RIK.
          </p>
        </div>

        <Link to="/reservations/new">
          <Button icon={<PlusCircle className="w-4 h-4" />}>
            Pesan Ruangan
          </Button>
        </Link>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
          <p className="text-xs text-emerald-950 font-medium">
            <strong>Row Level Security (RLS) Aktif:</strong> Jadwal menampilkan slot terisi secara real-time. Informasi pribadi (nomor kontak panitia & berkas proposal internal) disamarkan untuk pengguna di luar pemohon dan TU Pusat.
          </p>
        </div>
        <span className="text-[10px] text-stone-400 font-mono hidden md:inline shrink-0">
          Sync: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center gap-4">
        {/* Filter by Faculty */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-600 shrink-0">Fakultas:</span>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">Semua 5 Fakultas</option>
            <option value="FK">FK - Kedokteran</option>
            <option value="FF">FF - Farmasi</option>
            <option value="FKG">FKG - Kedokteran Gigi</option>
            <option value="FIK">FIK - Keperawatan</option>
            <option value="FKM">FKM - Kesehatan Masyarakat</option>
          </select>
        </div>

        {/* Filter by Facility */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-600 shrink-0">Ruangan:</span>
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">Semua Ruangan RIK</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Day Jumper Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSelectedDayOffset(selectedDayOffset - 1)}
            className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-stone-800 px-2">
            {currentDate.toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={() => setSelectedDayOffset(selectedDayOffset + 1)}
            className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {selectedDayOffset !== 0 && (
            <button
              onClick={() => setSelectedDayOffset(0)}
              className="text-xs text-emerald-800 font-bold hover:underline ml-1"
            >
              Hari Ini
            </button>
          )}
        </div>
      </div>

      {/* Agenda & Time Grid View */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-800" />
          Daftar Acara Terjadwal ({filteredReservations.length} Kegiatan Terdaftar)
        </h3>

        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <CalendarDays className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-stone-800">
              Tidak ada kegiatan pada kriteria ini
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Ruangan tersedia untuk diajukan peminjaman.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReservations.map((item) => {
              const isMine = item.userId === currentUser.id;
              const canSeePrivate = isMine || isTUAdmin;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                    isMine
                      ? 'border-emerald-600/50 bg-emerald-50/20 ring-1 ring-emerald-600/30'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <FacultyBadge faculty={item.userFaculty} />
                      <StatusBadge status={item.status} size="sm" />
                      {isMine && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Pengajuan Anda
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-400">
                      {item.reservationCode}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 mt-2 line-clamp-2">
                    {item.title}
                  </h4>

                  <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-center gap-2 font-semibold text-stone-800">
                      <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{item.facilityName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-900 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>
                        {new Date(item.startTime).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                        })}
                        ,{' '}
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

                    {/* Privacy Guard Indicator */}
                    <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <span>Penyelenggara: {item.userOrganization || `Ormawa ${item.userFaculty}`}</span>
                      {!canSeePrivate && (
                        <span className="flex items-center gap-1 text-stone-400 text-[10px]">
                          <Lock className="w-3 h-3" /> Berkas & Kontak Terproteksi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
