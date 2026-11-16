import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FacultyBadge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  UserCheck,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Database,
  ShieldCheck,
  KeyRound,
  LogOut,
  Info,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const {
    currentUser,
    isTUAdmin,
    availablePersonas,
    switchUser,
    resetAllDemoData,
    connectionMode,
    isDemoMode,
    signOut,
  } = useAuth();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between">
        {/* Left: Mobile trigger & breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            aria-label="Toggle Navigation"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-stone-500">
            <span className="font-semibold text-emerald-800">RIK SpaceHub</span>
            <span>/</span>
            <span className="text-stone-700 capitalize">
              {isTUAdmin ? 'Portal Tata Usaha Pusat' : 'Fasilitas RIK UI'}
            </span>
          </div>

          {/* Database Connection Pill */}
          <button
            onClick={() => setShowDatabaseModal(true)}
            className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              connectionMode === 'supabase_live'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
            title="Klik untuk melihat konfigurasi database Supabase"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionMode === 'supabase_live'
                  ? 'bg-emerald-600'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
            {connectionMode === 'supabase_live' ? (
              <span>Supabase Live (PostgreSQL)</span>
            ) : (
              <span>Demo Mode (Simulasi Lokal)</span>
            )}
          </button>
        </div>

        {/* Right: Persona Switcher & Current User Identity */}
        <div className="flex items-center gap-3">
          {/* Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-700/30 bg-emerald-50/70 hover:bg-emerald-100/70 text-xs font-semibold text-emerald-900 transition-colors shadow-xs"
              title="Ganti akun untuk mencoba peran TU atau Mahasiswa"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline font-bold">Ganti Akun Demo:</span>
              <span className="max-w-[120px] sm:max-w-none truncate font-bold">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
            </button>

            {showPersonaMenu && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95"
                onClick={() => setShowPersonaMenu(false)}
              >
                <div className="px-3 py-1.5 border-b border-stone-100 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Pilih Persona Uji Coba:
                  </p>
                </div>
                {availablePersonas.map((p) => {
                  const isActive = p.id === currentUser.id;
                  const isAdm = p.role === 'tu_admin';
                  return (
                    <button
                      key={p.id}
                      onClick={() => switchUser(p.id)}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-stone-50 transition-colors ${
                        isActive ? 'bg-emerald-50/60 font-semibold' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {isAdm ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">
                            TU
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-[10px] font-bold">
                            {p.faculty}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {p.name}
                          </p>
                          {isActive && (
                            <span className="text-[10px] text-emerald-700 font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">
                          {p.organization}
                        </p>
                      </div>
                    </button>
                  );
                })}
                <div className="border-t border-stone-100 mt-1 pt-1 px-3 space-y-1">
                  <button
                    onClick={resetAllDemoData}
                    className="w-full text-left py-1.5 text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1.5 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Data Demo ke Awal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Current User Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-200">
            <FacultyBadge faculty={currentUser.faculty} />
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-stone-800 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-stone-500 font-medium">
                {isTUAdmin ? 'Administrator Pusat' : currentUser.identityNumber}
              </span>
            </div>
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-stone-300 object-cover"
            />
          </div>
        </div>
      </div>

      {/* Database Connection Info Modal */}
      {showDatabaseModal && (
        <Modal
          isOpen={showDatabaseModal}
          onClose={() => setShowDatabaseModal(false)}
          title="Status Integrasi Supabase & Database"
          subtitle="PostgreSQL, Authentication, Private Storage & Row Level Security"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div
              className={`p-4 rounded-xl border ${
                connectionMode === 'supabase_live'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Database className="w-5 h-5 shrink-0 mt-0.5 text-current" />
                <div>
                  <h4 className="font-bold text-sm">
                    {connectionMode === 'supabase_live'
                      ? 'Terhubung ke Backend Supabase Live!'
                      : 'Sedang Berjalan dalam Mode Simulasi Lokal (Demo Mode)'}
                  </h4>
                  <p className="mt-1 leading-relaxed">
                    {connectionMode === 'supabase_live'
                      ? 'Aplikasi terhubung ke database PostgreSQL Supabase. Seluruh data ruangan, reservasi, audit trail, dan berkas privat tersimpan secara permanen di cloud dengan enkripsi RLS.'
                      : 'Variabel VITE_SUPABASE_URL belum dikonfigurasi. Aplikasi secara otomatis beroperasi dalam Mode Simulasi Lokal menggunakan localStorage. Data tidak terhubung antar pengguna sebenarnya sampai Anda menghubungkan Supabase.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 space-y-2 bg-stone-50">
              <h5 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                Fitur Keamanan Terintegrasi:
              </h5>
              <ul className="space-y-1.5 text-stone-700">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>
                    <strong>Row Level Security (RLS):</strong> Mahasiswa hanya dapat membaca berkas proposal dan kontak pribadi miliknya sendiri.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>
                    <strong>Anti-Overlapping Bookings:</strong> Constraint PostgreSQL BTree-GIST mencegah dobel jadwal ruangan yang disetujui.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>
                    <strong>Pencegahan Overbooking Sarpras:</strong> Stok peralatan tervalidasi terhadap peminjaman yang beririsan.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>
                    <strong>Private Document Storage:</strong> Berkas PDF diunggah ke private bucket dengan signed URL 1 jam.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDatabaseModal(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
};
