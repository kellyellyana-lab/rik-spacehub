import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { spaceHubService } from '../../services/spaceHubService';
import { Reservation, Facility } from '../../types';
import { StatusBadge, FacultyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  CalendarDays,
  PlusCircle,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  MapPin,
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { currentUser, facultyMeta } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [resList, facList] = await Promise.all([
        spaceHubService.getReservations(currentUser),
        spaceHubService.getFacilities(),
      ]);
      setReservations(resList);
      setFacilities(facList);
      setIsLoading(false);
    };
    loadData();
  }, [currentUser]);

  const myReservations = reservations.filter((r) => r.userId === currentUser.id);
  const myPending = myReservations.filter((r) => r.status === 'pending');
  const myApproved = myReservations.filter((r) => r.status === 'approved');

  const upcomingEvents = reservations
    .filter((r) => r.status === 'approved' && new Date(r.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#132A13] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Building2 className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#52B788]/20 border border-[#52B788]/40 text-[#D8F3DC] text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse"></span>
            Portal Terpadu RIK UI • {facultyMeta.name}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Datang, {currentUser.name}
          </h2>
          <p className="text-sm text-stone-200 mt-2 leading-relaxed">
            Sistem reservasi terpusat sarana dan prasarana bersama 5 fakultas RIK (Kedokteran, Farmasi, Kedokteran Gigi, Keperawatan, dan Kesmas). Cek jadwal tanpa tumpang-tindih dan ajukan peminjaman secara transparan.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link to="/reservations/new">
              <Button
                variant="secondary"
                size="md"
                icon={<PlusCircle className="w-4 h-4 text-[#1B4332]" />}
                className="font-bold shadow-md"
              >
                Ajukan Peminjaman Baru
              </Button>
            </Link>
            <Link to="/facilities">
              <Button
                variant="outline"
                size="md"
                icon={<Building2 className="w-4 h-4 text-stone-700" />}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xs"
              >
                Jelajahi Ruangan RIK
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-600/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Permohonan Aktif Saya
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{myPending.length}</span>
            <span className="text-xs text-stone-500 font-medium">menunggu persetujuan TU</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-600/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Peminjaman Disetujui
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{myApproved.length}</span>
            <span className="text-xs text-stone-500 font-medium">siap digunakan</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-600/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Fasilitas RIK Siap Pakai
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{facilities.length}</span>
            <span className="text-xs text-stone-500 font-medium">ruangan terpusat</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-600/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Perlindungan Privasi
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-bold text-emerald-900 block">
              Row Level Security Aktif
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Dokumen & kontak aman
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: My Status & Upcoming Calendar Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Active Bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Status Permohonan Terbaru Saya
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Pantau proses verifikasi berkas oleh Tata Usaha Pusat RIK
              </p>
            </div>
            <Link
              to="/my-reservations"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-stone-400 text-xs">Memuat data...</div>
          ) : myReservations.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
              <FileCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">
                Belum ada permohonan peminjaman
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Pilih ruangan dan ajukan kegiatan mahasiswa atau fakultas Anda dengan mudah.
              </p>
              <Link to="/reservations/new">
                <Button size="sm" icon={<PlusCircle className="w-3.5 h-3.5" />}>
                  Buat Permohonan Sekarang
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {myReservations.slice(0, 3).map((res) => (
                <div key={res.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-stone-500">
                        {res.reservationCode}
                      </span>
                      <StatusBadge status={res.status} size="sm" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 hover:text-emerald-800 line-clamp-1">
                      {res.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-stone-400" />
                        {res.facilityName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {new Date(res.startTime).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                        , {new Date(res.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                  </div>

                  <Link to="/my-reservations">
                    <Button variant="outline" size="sm">
                      Detail
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Upcoming Approved Events in RIK */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Agenda Bersama RIK</h3>
              <p className="text-xs text-stone-500 mt-0.5">Kegiatan terdekat 5 fakultas</p>
            </div>
            <Link
              to="/calendar"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900"
            >
              Kalender
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-6 text-center">
                Belum ada agenda terjadwal minggu ini.
              </p>
            ) : (
              upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <FacultyBadge faculty={evt.userFaculty} />
                    <span className="text-[10px] font-bold text-stone-500">
                      {new Date(evt.startTime).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-stone-900 line-clamp-1 mt-1">
                    {evt.title}
                  </h5>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {evt.facilityName}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100">
            <Link to="/calendar" className="w-full block">
              <Button variant="secondary" size="sm" className="w-full">
                Buka Kalender Lengkap
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
