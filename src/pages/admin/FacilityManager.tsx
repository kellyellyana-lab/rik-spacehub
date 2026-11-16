import React, { useState, useEffect } from 'react';
import { spaceHubService } from '../../services/spaceHubService';
import { Facility, RoomType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Building2,
  PlusCircle,
  Edit2,
  Users,
  CheckCircle,
  AlertTriangle,
  Search,
  Sparkles,
} from 'lucide-react';

export const FacilityManager: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New facility form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newBuilding, setNewBuilding] = useState('Gedung A RIK');
  const [newFloor, setNewFloor] = useState<number>(2);
  const [newCapacity, setNewCapacity] = useState<number>(60);
  const [newRoomType, setNewRoomType] = useState<RoomType>('discussion_room');
  const [newDescription, setNewDescription] = useState('');

  const fetchFacilities = async () => {
    const list = await spaceHubService.getFacilities();
    setFacilities(list);
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleToggleActive = async (facility: Facility) => {
    const updated: Facility = { ...facility, isActive: !facility.isActive };
    await spaceHubService.saveFacility(updated);
    fetchFacilities();
  };

  const handleSaveNew = async () => {
    if (!newName.trim() || !newCode.trim()) {
      alert('Nama ruangan dan kode ruangan wajib diisi.');
      return;
    }

    const newFacility: Facility = {
      id: `fac_${Date.now()}`,
      name: newName,
      code: newCode,
      building: newBuilding,
      floor: Number(newFloor),
      capacity: Number(newCapacity),
      roomType: newRoomType,
      description: newDescription || 'Ruangan fasilitas bersama RIK UI.',
      amenities: ['AC Sentral', 'Proyektor HD', 'WiFi Eduroam UI', 'Papan Tulis Whiteboard'],
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
      ],
      rules: ['Dilarang merokok dan menjaga kebersihan ruangan.'],
      isActive: true,
    };

    await spaceHubService.saveFacility(newFacility);
    setIsAddModalOpen(false);
    // Reset form
    setNewName('');
    setNewCode('');
    setNewDescription('');
    fetchFacilities();
  };

  const handleSaveEdit = async () => {
    if (!editingFacility) return;
    await spaceHubService.saveFacility(editingFacility);
    setEditingFacility(null);
    fetchFacilities();
  };

  const filtered = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.building.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Tata Kelola Sarpras
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Master Data Fasilitas Ruangan
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kelola inventaris ruang bersama, pemeliharaan berkala, dan kapasitas daya tampung.
          </p>
        </div>

        <Button
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Tambah Ruangan Baru
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ruangan berdasarkan nama atau kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((fac) => (
          <div
            key={fac.id}
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-500">
                  {fac.code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    fac.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {fac.isActive ? 'Operasional Aktif' : 'Dalam Perawatan (Off)'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-stone-900 mt-2 line-clamp-1">
                {fac.name}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {fac.building} • Lantai {fac.floor}
              </p>

              <div className="mt-3 flex items-center gap-3 text-xs text-stone-600">
                <span className="flex items-center gap-1 font-semibold text-emerald-900">
                  <Users className="w-3.5 h-3.5" />
                  Kapasitas: {fac.capacity} Orang
                </span>
              </div>

              <p className="text-xs text-stone-500 mt-2 line-clamp-2">
                {fac.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setEditingFacility(fac)}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>

              <button
                type="button"
                onClick={() => handleToggleActive(fac)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  fac.isActive
                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {fac.isActive ? 'Set Dalam Perawatan' : 'Aktifkan Kembali'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Facility Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Tambah Ruangan Fasilitas RIK Baru"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nama Ruangan
              </label>
              <input
                type="text"
                placeholder="Contoh: Amphitheater RIK 203"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Kode Ruangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: AMP-RIK-203"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Gedung
                </label>
                <select
                  value={newBuilding}
                  onChange={(e) => setNewBuilding(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800"
                >
                  <option value="Gedung A RIK">Gedung A RIK</option>
                  <option value="Gedung B RIK">Gedung B RIK</option>
                  <option value="Gedung C RIK">Gedung C RIK</option>
                  <option value="Gedung Utama RIK">Gedung Utama RIK</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Kapasitas (Orang)
                </label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Lantai
                </label>
                <input
                  type="number"
                  value={newFloor}
                  onChange={(e) => setNewFloor(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Deskripsi
              </label>
              <textarea
                rows={2}
                placeholder="Fasilitas dan peruntukan ruangan..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                Batal
              </Button>
              <Button size="sm" onClick={handleSaveNew}>
                Simpan Ruangan
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingFacility && (
        <Modal
          isOpen={Boolean(editingFacility)}
          onClose={() => setEditingFacility(null)}
          title={`Edit Fasilitas: ${editingFacility.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nama Ruangan
              </label>
              <input
                type="text"
                value={editingFacility.name}
                onChange={(e) =>
                  setEditingFacility({ ...editingFacility, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Kapasitas Maksimal
                </label>
                <input
                  type="number"
                  value={editingFacility.capacity}
                  onChange={(e) =>
                    setEditingFacility({
                      ...editingFacility,
                      capacity: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Status Operasional
                </label>
                <select
                  value={editingFacility.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setEditingFacility({
                      ...editingFacility,
                      isActive: e.target.value === 'active',
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                >
                  <option value="active">Aktif (Dapat Dipinjam)</option>
                  <option value="inactive">Dalam Pemeliharaan (Tutup)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Deskripsi
              </label>
              <textarea
                rows={3}
                value={editingFacility.description}
                onChange={(e) =>
                  setEditingFacility({
                    ...editingFacility,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingFacility(null)}
              >
                Batal
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Perbarui Data
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
