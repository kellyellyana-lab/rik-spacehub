import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { spaceHubService } from '../../services/spaceHubService';
import { Reservation, Facility, Equipment, FacultyCode } from '../../types';
import { StatusBadge, FacultyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Inbox,
  CheckCircle2,
  AlertCircle,
  Building2,
  Boxes,
  Users,
  Calendar,
  ChevronRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  MapPin,
  Clock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [r, f, eq] = await Promise.all([
        spaceHubService.getReservations(currentUser),
        spaceHubService.getFacilities(),
        spaceHubService.getEquipment(),
      ]);
      setReservations(r);
      setFacilities(f);
      setEquipment(eq);
    };
    fetch();
  }, [currentUser]);

  const pendingRequests = reservations.filter((r) => r.status === 'pending');
  const approvedRequests = reservations.filter((r) => r.status === 'approved');

  // Faculty distribution count
  const facultyCounts: Record<FacultyCode, number> = {
    FK: 0,
    FF: 0,
    FKG: 0,
    FIK: 0,
    FKM: 0,
    PUSAT_RIK: 0,
  };

  reservations.forEach((r) => {
    if (facultyCounts[r.userFaculty] !== undefined) {
      facultyCounts[r.userFaculty]++;
    }
  });

  const totalBookings = reservations.length || 1;

  return (
    <div className="space-y-6">
      {/* Admin Command Banner */}
      <div className="bg-gradient-to-r from-[#132A13] via-[#1B4332] to-[#2D6A4F] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#52B788]/20 border border-[#52B788]/40 text-[#D8F3DC] text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-[#52B788]"></span>
            Kantor Tata Usaha & Sarana Prasarana Terpadu RIK UI
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Command Center Tata Usaha RIK
          </h2>
          <p className="text-xs sm:text-sm text-stone-200 mt-1 max-w-xl leading-relaxed">
            Kelola permohonan ruang kuliah bersama, verifikasi berkas perizinan dekanat 5 fakultas, dan alokasi peralatan secara transparan dan terpusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/admin/requests">
            <Button
              variant="secondary"
              size="md"
              icon={<Inbox className="w-4 h-4 text-[#1B4332]" />}
              className="font-bold shadow-md"
            >
              Buka Inbox Permohonan ({pendingRequests.length})
            </Button>
          </Link>
          <Link to="/admin/facilities">
            <Button
              variant="outline"
              size="md"
              icon={<Building2 className="w-4 h-4 text-stone-700" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xs"
            >
              Kelola Ruangan
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Menunggu Review TU
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900">{pendingRequests.length}</span>
            <span className="text-xs text-stone-500 font-medium">butuh tindakan segera</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Peminjaman Disetujui
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950">
              {approvedRequests.length}
            </span>
            <span className="text-xs text-stone-500 font-medium">terjadwal di kalender</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Ruangan Bersama
            </span>
            <div className="p-2 rounded-xl bg-stone-100 text-stone-700 border border-stone-200">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{facilities.length}</span>
            <span className="text-xs text-stone-500 font-medium">ruang aktif</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Inventaris Sarpras
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">
              {equipment.reduce((acc, eq) => acc + eq.totalQuantity, 0)}
            </span>
            <span className="text-xs text-stone-500 font-medium">unit peralatan</span>
          </div>
        </div>
      </div>

      {/* Grid: Urgent Review Queue & Faculty Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Action Queue (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Antrean Review Permohonan Masuk
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Pengajuan terbaru dari organisasi & dekanat yang memerlukan keputusan TU
              </p>
            </div>
            <Link
              to="/admin/requests"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              Lihat Semua Inbox <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-800">
                Semua Permohonan Telah Ditinjau!
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Tidak ada permohonan tertunda yang menunggu verifikasi saat ini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {pendingRequests.slice(0, 4).map((req) => (
                <div key={req.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-stone-500">
                        {req.reservationCode}
                      </span>
                      <FacultyBadge faculty={req.userFaculty} />
                      <span className="text-[11px] text-stone-500 font-medium">
                        Oleh: <strong>{req.userName}</strong> ({req.userOrganization})
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 line-clamp-1">
                      {req.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        {req.facilityName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(req.startTime).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                        , {new Date(req.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                      {req.documents.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-800 font-bold flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> {req.documents.length} Dokumen
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link to={`/admin/requests?reviewId=${req.id}`}>
                    <Button size="sm" className="font-bold text-xs">
                      Tinjau & Putuskan
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Faculty Distribution (1 col) */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Distribusi Peminjaman 5 Fakultas
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Porsi utilisasi sarana bersama RIK
            </p>

            <div className="mt-5 space-y-3">
              {[
                { code: 'FK' as FacultyCode, name: 'Fakultas Kedokteran', barBg: 'bg-emerald-600' },
                { code: 'FF' as FacultyCode, name: 'Fakultas Farmasi', barBg: 'bg-amber-600' },
                { code: 'FKG' as FacultyCode, name: 'Fakultas Kedokteran Gigi', barBg: 'bg-teal-600' },
                { code: 'FIK' as FacultyCode, name: 'Fakultas Ilmu Keperawatan', barBg: 'bg-sky-600' },
                { code: 'FKM' as FacultyCode, name: 'Fakultas Kesehatan Masyarakat', barBg: 'bg-indigo-600' },
              ].map((f) => {
                const count = facultyCounts[f.code];
                const pct = Math.round((count / totalBookings) * 100);
                return (
                  <div key={f.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-stone-700">{f.code} • {f.name}</span>
                      <span className="text-stone-900 font-bold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className={`h-full ${f.barBg} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100">
            <Link to="/calendar" className="w-full block">
              <Button variant="outline" size="sm" className="w-full">
                Buka Kalender Master RIK
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
