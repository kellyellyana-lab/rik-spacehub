import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { spaceHubService } from '../../services/spaceHubService';
import { Reservation, Facility, Equipment, FacultyCode } from '../../types';
import { FACULTIES_DATA } from '../../data/seedData';
import { Button } from '../../components/ui/Button';
import {
  TrendingUp,
  Download,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  PieChart,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsAnalytics: React.FC = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('genap_2026');

  useEffect(() => {
    const fetch = async () => {
      const [res, fac] = await Promise.all([
        spaceHubService.getReservations(currentUser),
        spaceHubService.getFacilities(),
      ]);
      setReservations(res);
      setFacilities(fac);
    };
    fetch();
  }, [currentUser]);

  // Aggregate stats
  const totalBookings = reservations.length || 1;
  const approvedBookings = reservations.filter((r) => r.status === 'approved' || r.status === 'completed');

  // Faculty distribution
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

  // Room popularity count
  const roomCounts: Record<string, number> = {};
  reservations.forEach((r) => {
    roomCounts[r.facilityName] = (roomCounts[r.facilityName] || 0) + 1;
  });

  // Sorted room ranking
  const sortedRooms = Object.entries(roomCounts).sort((a, b) => b[1] - a[1]);

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = [
      'Kode Tiket',
      'Nama Kegiatan',
      'Fakultas',
      'Pemohon',
      'Ruangan',
      'Waktu Mulai',
      'Waktu Selesai',
      'Status',
    ];
    const rows = reservations.map((r) => [
      `"${r.reservationCode}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.userFaculty}"`,
      `"${r.userName}"`,
      `"${r.facilityName}"`,
      `"${new Date(r.startTime).toLocaleString('id-ID')}"`,
      `"${new Date(r.endTime).toLocaleString('id-ID')}"`,
      `"${r.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Peminjaman_Fasilitas_RIK_UI_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Pusat Data & Analitik TU
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Laporan Utilisasi Fasilitas RIK UI
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Analisis okupansi ruangan bersama, komparasi peminjaman 5 fakultas, dan ekspor data audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-800" />}
            onClick={handleExportCSV}
          >
            Ekspor Data (CSV / Excel)
          </Button>
          <Button
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Cetak Laporan PDF
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Total Permohonan
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{reservations.length}</span>
            <span className="text-xs text-stone-500 font-medium">kegiatan diajukan</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Approval Rate (Disetujui)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950">
              {Math.round((approvedBookings.length / totalBookings) * 100)}%
            </span>
            <span className="text-xs text-stone-500 font-medium">lolos verifikasi TU</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Fakultas Teraktif
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-stone-900 block">Fakultas Kedokteran</span>
            <span className="text-[11px] text-stone-500 font-medium">BEM & Himpunan FK UI</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Rata-rata Durasi
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">4.5</span>
            <span className="text-xs text-stone-500 font-medium">Jam per peminjaman</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Faculty Utilization Comparison */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Porsi Penggunaan 5 Fakultas
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Jumlah permohonan sarana bersama yang diajukan oleh masing-masing fakultas
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-emerald-800" />
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              { code: 'FK' as FacultyCode, name: 'Fakultas Kedokteran', barBg: 'bg-emerald-700' },
              { code: 'FF' as FacultyCode, name: 'Fakultas Farmasi', barBg: 'bg-amber-600' },
              { code: 'FKG' as FacultyCode, name: 'Fakultas Kedokteran Gigi', barBg: 'bg-teal-600' },
              { code: 'FIK' as FacultyCode, name: 'Fakultas Ilmu Keperawatan', barBg: 'bg-sky-600' },
              { code: 'FKM' as FacultyCode, name: 'Fakultas Kesehatan Masyarakat', barBg: 'bg-indigo-600' },
            ].map((f) => {
              const count = facultyCounts[f.code];
              const pct = Math.round((count / totalBookings) * 100);
              return (
                <div key={f.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-stone-800 font-bold">
                      {f.code} • {f.name}
                    </span>
                    <span className="text-stone-900 font-extrabold">
                      {count} Peminjaman ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className={`h-full ${f.barBg} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Room Popularity Ranking */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Peringkat Ruangan Paling Sering Digunakan
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Frekuensi pemesanan fasilitas gedung RIK UI
              </p>
            </div>
            <Building2 className="w-5 h-5 text-emerald-800" />
          </div>

          <div className="space-y-2.5 pt-2">
            {sortedRooms.map(([name, count], idx) => {
              const maxCount = sortedRooms[0] ? sortedRooms[0][1] : 1;
              const barWidth = Math.round((count / maxCount) * 100);

              return (
                <div key={name} className="p-3 rounded-xl bg-stone-50 border border-stone-200/70">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-stone-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {name}
                    </span>
                    <span className="font-extrabold text-emerald-900">
                      {count} Kali Dipesan
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-200/80 overflow-hidden">
                    <div
                      className="h-full bg-[#52B788] rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audit Log Data Table Preview */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Rekapitulasi Reservasi Terjadwal Semester Ini
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Data siap audit untuk Dekanat dan Pimpinan Universitas Indonesia
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            Unduh Format CSV
          </Button>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-2.5 px-3.5">Kode</th>
                <th className="py-2.5 px-3.5">Judul Kegiatan</th>
                <th className="py-2.5 px-3.5">Fakultas</th>
                <th className="py-2.5 px-3.5">Ruangan</th>
                <th className="py-2.5 px-3.5">Waktu Pelaksanaan</th>
                <th className="py-2.5 px-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="py-2.5 px-3.5 font-mono font-bold text-stone-700">
                    {r.reservationCode}
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-stone-900">{r.title}</td>
                  <td className="py-2.5 px-3.5 font-bold text-stone-800">{r.userFaculty}</td>
                  <td className="py-2.5 px-3.5 text-stone-600">{r.facilityName}</td>
                  <td className="py-2.5 px-3.5 text-stone-500">
                    {new Date(r.startTime).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className="font-bold text-[11px] capitalize text-emerald-800">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
