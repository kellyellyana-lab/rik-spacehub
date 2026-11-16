import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { spaceHubService } from '../../services/spaceHubService';
import { Facility, Reservation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { FacultyBadge } from '../../components/ui/Badge';
import {
  Building2,
  Users,
  MapPin,
  CheckCircle,
  Calendar,
  Clock,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Share2,
  Layers,
  Zap,
  Wifi,
  Volume2,
} from 'lucide-react';

export const FacilityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      if (id) {
        const found = await spaceHubService.getFacilityById(id);
        if (found) {
          setFacility(found);
        }
      }
      const allRes = await spaceHubService.getReservations(currentUser);
      setReservations(allRes.filter((r) => r.facilityId === id && r.status === 'approved'));
      setIsLoading(false);
    };
    load();
  }, [id, currentUser]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-stone-400 text-sm">
        Memuat detail ruangan...
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-stone-900">Ruangan Tidak Ditemukan</h3>
        <p className="text-xs text-stone-500 mt-1 mb-5">
          Fasilitas yang Anda cari tidak terdaftar atau telah dinonaktifkan oleh administrator.
        </p>
        <Link to="/facilities">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Kembali ke Katalog Ruangan
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button & Top Action */}
      <div className="flex items-center justify-between">
        <Link
          to="/facilities"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Katalog Fasilitas
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Share2 className="w-3.5 h-3.5" />}
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Tautan ruangan disalin ke clipboard!');
            }}
          >
            Bagikan
          </Button>
          <Button
            size="sm"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => navigate(`/reservations/new?facilityId=${facility.id}`)}
          >
            Pesan Ruangan Ini
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        {/* Photo Gallery Banner */}
        <div className="relative h-72 sm:h-96 bg-stone-900 overflow-hidden">
          <img
            src={facility.images[activeImageIndex] || facility.images[0]}
            alt={facility.name}
            className="w-full h-full object-cover transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Badges on Image */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-stone-900/90 text-white font-mono text-xs font-bold backdrop-blur-xs">
              {facility.code}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-xs ${
              facility.isActive ? 'bg-emerald-900/90 text-emerald-100' : 'bg-amber-900/90 text-amber-100'
            }`}>
              {facility.isActive ? '● Operasional Aktif' : '● Pemeliharaan'}
            </span>
          </div>

          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 rounded-full bg-emerald-800/90 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs shadow-md">
              <Users className="w-3.5 h-3.5" />
              Kapasitas: {facility.capacity} Orang
            </span>
          </div>

          {/* Title & Location Overlay */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center gap-2 text-xs text-stone-200 font-medium mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#52B788]" />
              <span>{facility.building} • Lantai {facility.floor}</span>
              <span>•</span>
              <span className="capitalize">{facility.roomType.replace('_', ' ')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {facility.name}
            </h1>
          </div>
        </div>

        {/* Thumbnail Selector if multiple images */}
        {facility.images.length > 1 && (
          <div className="p-3 bg-stone-50 border-b border-stone-200 flex gap-2 overflow-x-auto">
            {facility.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  activeImageIndex === idx ? 'border-emerald-700 ring-2 ring-emerald-700/30' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Key Specs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-stone-100 border-b border-stone-100 p-4 bg-stone-50/50 text-center text-xs">
          <div>
            <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">Daya Tampung</span>
            <p className="text-sm font-black text-stone-900 mt-0.5">{facility.capacity} Kursi</p>
          </div>
          <div>
            <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">Gedung / Lokasi</span>
            <p className="text-sm font-black text-stone-900 mt-0.5">{facility.building}</p>
          </div>
          <div>
            <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">Lantai</span>
            <p className="text-sm font-black text-stone-900 mt-0.5">Lantai {facility.floor}</p>
          </div>
          <div>
            <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">Fasilitas Standar</span>
            <p className="text-sm font-black text-emerald-800 mt-0.5">Audio & Proyektor HD</p>
          </div>
        </div>
      </div>

      {/* 2-Columns Body: Specs & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description, Amenities & Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-2">
              Tentang Ruangan Ini
            </h3>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {facility.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
              Fasilitas & Sarpras Terpasang
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {facility.amenities.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs font-semibold text-stone-800"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules and Regulations */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
              Tata Tertib & Ketentuan Penggunaan
            </h3>
            <div className="space-y-2">
              {facility.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 font-medium leading-relaxed"
                >
                  <span className="text-amber-800 font-bold">•</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Booking Card & Existing Bookings Snapshot */}
        <div className="space-y-6">
          {/* Booking Action Box */}
          <div className="bg-gradient-to-br from-[#1B4332] to-[#132A13] text-white rounded-2xl p-6 shadow-lg space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Reservasi Cepat
            </div>
            <h4 className="text-lg font-black text-white">
              Gunakan Ruangan Ini Untuk Kegiatan Anda
            </h4>
            <p className="text-xs text-stone-200 leading-relaxed">
              Ajukan permohonan ke TU Pusat RIK sekarang. Sistem akan langsung memvalidasi jadwal agar tidak bentrok.
            </p>
            <Button
              variant="secondary"
              size="md"
              className="w-full font-bold shadow-md"
              onClick={() => navigate(`/reservations/new?facilityId=${facility.id}`)}
            >
              Lanjutkan ke Formulir Reservasi →
            </Button>
          </div>

          {/* Room Schedule Snapshot */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Jadwal Terisi di Ruangan Ini
              </h4>
              <Link to="/calendar" className="text-[11px] font-bold text-emerald-800 hover:underline">
                Buka Kalender
              </Link>
            </div>

            {reservations.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-4 text-center">
                Belum ada jadwal terisi dalam waktu dekat. Ruangan ini tersedia bebas.
              </p>
            ) : (
              <div className="space-y-2.5">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <FacultyBadge faculty={res.userFaculty} />
                      <span className="text-[10px] text-stone-400 font-mono font-bold">
                        {res.reservationCode}
                      </span>
                    </div>
                    <p className="font-bold text-stone-900 line-clamp-1">{res.title}</p>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {new Date(res.startTime).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      ,{' '}
                      {new Date(res.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(res.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
