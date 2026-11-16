import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { spaceHubService } from '../../services/spaceHubService';
import { Facility } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Search,
  Filter,
  Users,
  MapPin,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export const FacilityDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const data = await spaceHubService.getFacilities();
      setFacilities(data);
    };
    fetch();
  }, []);

  const filteredFacilities = facilities.filter((fac) => {
    const matchesSearch =
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.building.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBuilding =
      selectedBuilding === 'all' || fac.building.includes(selectedBuilding);

    const matchesType =
      selectedType === 'all' || fac.roomType === selectedType;

    return matchesSearch && matchesBuilding && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Katalog Fasilitas Bersama
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Ruangan & Fasilitas RIK UI
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Pilih ruangan perkuliahan, auditorium, atau lab bersama untuk kegiatan akademik, ormawa, dan simposium 5 fakultas.
          </p>
        </div>

        <Link to="/reservations/new">
          <Button icon={<Sparkles className="w-4 h-4" />}>
            Ajukan Peminjaman Sekarang
          </Button>
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama ruangan, kode (misal AUD-401), atau fasilitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-stone-500 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Gedung:
          </span>
          {['all', 'Gedung A', 'Gedung B', 'Gedung C'].map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBuilding(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                selectedBuilding === b
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {b === 'all' ? 'Semua Gedung' : b}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-stone-500 shrink-0">Tipe:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">Semua Tipe Ruang</option>
            <option value="auditorium">Auditorium</option>
            <option value="amphitheater">Amphitheater</option>
            <option value="discussion_room">Ruang Diskusi (IPE)</option>
            <option value="cbt_lab">Lab Komputer / CBT</option>
            <option value="meeting_room">Ruang Rapat</option>
            <option value="open_space">Plaza Terbuka</option>
          </select>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      {filteredFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <Info className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-800">Ruangan tidak ditemukan</h4>
          <p className="text-xs text-stone-500 mt-1">
            Coba ubah kata kunci pencarian atau reset filter gedung/tipe ruangan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-700/40 transition-all flex flex-col group"
            >
              {/* Image Preview */}
              <div className="relative h-48 bg-stone-100 overflow-hidden">
                <img
                  src={fac.images[0]}
                  alt={fac.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-bold">
                    {fac.code}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-900/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
                    <Users className="w-3 h-3" />
                    {fac.capacity} Orang
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      {fac.building} • Lantai {fac.floor}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {fac.name}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                    {fac.description}
                  </p>

                  {/* Amenities snapshot */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {fac.amenities.slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-medium"
                      >
                        {item}
                      </span>
                    ))}
                    {fac.amenities.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 text-[10px] font-medium">
                        +{fac.amenities.length - 3} lainnya
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setSelectedFacility(fac)}
                  >
                    Detail & Aturan
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-bold"
                    onClick={() => navigate(`/reservations/new?facilityId=${fac.id}`)}
                  >
                    Pesan Ruang
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Facility Detail Modal */}
      {selectedFacility && (
        <Modal
          isOpen={Boolean(selectedFacility)}
          onClose={() => setSelectedFacility(null)}
          title={selectedFacility.name}
          subtitle={`${selectedFacility.code} • ${selectedFacility.building} Lt. ${selectedFacility.floor}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="h-56 rounded-xl overflow-hidden bg-stone-100 relative">
              <img
                src={selectedFacility.images[0]}
                alt={selectedFacility.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/75 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Kapasitas Maksimal: {selectedFacility.capacity} Orang
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                Deskripsi Fasilitas
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                {selectedFacility.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Fasilitas & Sarpras Terpasang
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedFacility.amenities.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-stone-700 p-2 rounded-lg bg-stone-50 border border-stone-200/60"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Tata Tertib & Ketentuan Penggunaan
              </h4>
              <ul className="space-y-1.5">
                {selectedFacility.rules.map((rule, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-stone-600 flex items-start gap-2 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60"
                  >
                    <span className="text-amber-800 font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedFacility(null)}>
                Tutup
              </Button>
              <Button
                size="sm"
                className="font-bold"
                onClick={() => {
                  const id = selectedFacility.id;
                  setSelectedFacility(null);
                  navigate(`/reservations/new?facilityId=${id}`);
                }}
              >
                Pilih Ruangan Ini untuk Dipinjam
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
