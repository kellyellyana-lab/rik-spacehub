import React, { useState, useEffect } from 'react';
import { spaceHubService } from '../../services/spaceHubService';
import { Equipment, EquipmentCategory } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Boxes,
  PlusCircle,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Search,
} from 'lucide-react';

export const EquipmentManager: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Equipment Form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<EquipmentCategory>('audio_visual');
  const [newTotalQty, setNewTotalQty] = useState<number>(5);
  const [newDescription, setNewDescription] = useState('');

  const fetchEquipment = async () => {
    const list = await spaceHubService.getEquipment();
    setEquipmentList(list);
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleSaveNew = async () => {
    if (!newName.trim()) {
      alert('Nama peralatan wajib diisi.');
      return;
    }

    const newItem: Equipment = {
      id: `eq_${Date.now()}`,
      name: newName,
      category: newCategory,
      totalQuantity: Number(newTotalQty),
      availableQuantity: Number(newTotalQty),
      condition: 'Baik',
      description: newDescription || 'Peralatan operasional RIK UI.',
      isActive: true,
    };

    await spaceHubService.saveEquipment(newItem);
    setIsAddModalOpen(false);
    setNewName('');
    setNewDescription('');
    fetchEquipment();
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    await spaceHubService.saveEquipment(editingItem);
    setEditingItem(null);
    fetchEquipment();
  };

  const filtered = equipmentList.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'all' || eq.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Logistik & Sarpras
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Inventaris Peralatan & Sarana Pendukung
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Monitor stok proyektor portabel, sound system, mikrofon, dan sarana logistik 5 fakultas.
          </p>
        </div>

        <Button
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Tambah Peralatan Baru
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari alat (misal proyektor, mic, clicker)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-stone-500 shrink-0">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">Semua Kategori</option>
            <option value="audio_visual">Audio Visual</option>
            <option value="furniture">Furniture / Kursi / Stand</option>
            <option value="electronics">Elektronik / Presenter</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3 px-4">Nama Alat</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Total Unit</th>
                <th className="py-3 px-4">Siap Dipinjam</th>
                <th className="py-3 px-4">Kondisi Fisik</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-stone-900">{item.name}</div>
                    <div className="text-[11px] text-stone-500 line-clamp-1">
                      {item.description}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium capitalize">
                      {item.category.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-stone-900">
                    {item.totalQuantity} Unit
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                        item.availableQuantity > 0
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {item.availableQuantity} Unit Tersedia
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {item.condition}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Stok
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Tambah Peralatan Sarpras Baru"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nama Alat
              </label>
              <input
                type="text"
                placeholder="Contoh: Mikrofon Wireless Clip-on"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Kategori
                </label>
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as EquipmentCategory)
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                >
                  <option value="audio_visual">Audio Visual</option>
                  <option value="furniture">Furniture</option>
                  <option value="electronics">Elektronik</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Jumlah Total Unit
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTotalQty}
                  onChange={(e) => setNewTotalQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Deskripsi & Spesifikasi
              </label>
              <textarea
                rows={2}
                placeholder="Spesifikasi teknis alat..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
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
                Simpan Peralatan
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <Modal
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          title={`Edit Inventaris: ${editingItem.name}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Total Unit
                </label>
                <input
                  type="number"
                  value={editingItem.totalQuantity}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      totalQuantity: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Unit Siap Pakai
                </label>
                <input
                  type="number"
                  value={editingItem.availableQuantity}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      availableQuantity: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Kondisi Fisik
              </label>
              <select
                value={editingItem.condition}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    condition: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
              >
                <option value="Baik">Baik (Siap Pakai)</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                <option value="Dalam Perawatan">Dalam Perawatan Bengkel TU</option>
              </select>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
              >
                Batal
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Perbarui Stok
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
