import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  PlusCircle,
  FileText,
  History,
  Inbox,
  Boxes,
  BarChart3,
  HeartPulse,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isTUAdmin, currentUser, facultyMeta } = useAuth();

  const facultyNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/facilities', label: 'Explore Facilities', icon: Building2 },
    { to: '/reservations/new', label: 'Reservation Form', icon: PlusCircle },
    { to: '/my-reservations', label: 'My Requests', icon: FileText },
    { to: '/booking-history', label: 'Booking History', icon: History },
    { to: '/calendar', label: 'Room Calendar', icon: CalendarDays },
  ];

  const adminNavItems = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/requests', label: 'Reservation Management', icon: Inbox },
    { to: '/admin/facilities', label: 'Room Management', icon: Building2 },
    { to: '/admin/equipment', label: 'Equipment Inventory', icon: Boxes },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/calendar', label: 'Room Calendar (Master)', icon: CalendarDays },
  ];

  const navItems = isTUAdmin ? adminNavItems : facultyNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#132A13] text-stone-100 flex flex-col transition-transform duration-200 ease-in-out border-r border-[#1B4332] shadow-xl md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo & Header */}
        <div className="p-5 border-b border-[#1B4332] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#52B788] to-[#2D6A4F] flex items-center justify-center text-white shadow-md">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                RIK SpaceHub
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#95D5B2]">
                Universitas Indonesia
              </p>
            </div>
          </div>
        </div>

        {/* User Faculty Badge Card */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-[#1B4332]/60 border border-[#2D6A4F]/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#52B788] animate-ping" />
            <span className="text-[11px] font-bold text-[#D8F3DC]">
              {isTUAdmin ? 'Akses Administrator TU' : `Delegasi ${facultyMeta.code}`}
            </span>
          </div>
          <p className="text-xs text-stone-200 font-semibold mt-1 truncate">
            {currentUser.name}
          </p>
          <p className="text-[11px] text-stone-400 font-medium truncate">
            {currentUser.organization}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#74C69D]">
            {isTUAdmin ? 'Menu Administrasi Pusat' : 'Menu Layanan Ruangan'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/admin'}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#2D6A4F] text-white shadow-sm border border-[#52B788]/40'
                      : 'text-stone-300 hover:bg-[#1B4332] hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-[#95D5B2]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Five Faculties Legend Footer */}
        <div className="p-4 border-t border-[#1B4332] bg-[#0E1F0E]/50">
          <p className="text-[10px] font-bold text-[#74C69D] uppercase tracking-wider mb-2">
            5 Fakultas RIK Terintegrasi:
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              FK
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
              FKG
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              FKM
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
              FF
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
              FIK
            </span>
          </div>
          <p className="text-[9px] text-stone-400 mt-2">
            Tata Usaha Gedung RIK UI Salemba & Depok
          </p>
        </div>
      </aside>
    </>
  );
};
