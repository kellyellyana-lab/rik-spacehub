# RIK SpaceHub - Integrasi Supabase & Arsitektur Keamanan

Sistem Reservasi dan Manajemen Fasilitas Terpadu 5 Fakultas Rumpun Ilmu Kesehatan (RIK), Universitas Indonesia:
- **FK** (Fakultas Kedokteran)
- **FF** (Fakultas Farmasi)
- **FKG** (Fakultas Kedokteran Gigi)
- **FIK** (Fakultas Ilmu Keperawatan)
- **FKM** (Fakultas Kesehatan Masyarakat)
- **TU Pusat** (Kantor Tata Usaha & Sarpras Terpadu RIK UI)

---

## 🔒 8 Persyaratan Keamanan & Integrasi Sistem (Telah Diimplementasikan)

1. **Isolasi Permohonan Pengguna Fakultas:**
   * Mahasiswa dan staf fakultas hanya dapat melihat dan mengelola berkas permohonan peminjaman miliknya sendiri.
   * Terlindungi dengan Row Level Security (RLS) pada tabel `public.reservations`.
2. **Transparansi Jadwal Bersama Tanpa Bocor Data Pribadi (PII):**
   * Kalender bersama menampilkan slot jam yang terisi untuk menghindari tabrakan jadwal.
   * **Privasi Ketat:** Nomor telepon panitia, identitas NPM/NIP, dan berkas proposal internal disamarkan untuk pengguna di luar pemohon dan TU Pusat.
3. **Wewenang Tunggal Keputusan TU Pusat:**
   * Hanya akun berhak peran `tu_admin` yang dapat menyetujui (*Approve*), menolak (*Reject*), atau meminta perbaikan berkas (*Request Revision*).
4. **Penyimpanan Berkas Privat (Private Document Storage):**
   * Berkas surat izin dan proposal PDF disimpan di bucket privat `reservation-documents`.
   * Akses unduh dilindungi dengan *Signed Token URL* yang kedaluwarsa otomatis dalam 1 jam. Mahasiswa fakultas lain tidak dapat mengakses berkas ini.
5. **Pembaruan Kalender Real-Time (Supabase Realtime):**
   * Saat petugas TU Pusat menekan tombol "Setujui", seluruh peramban yang sedang membuka kalender langsung terbarui secara instan melalui websocket tanpa perlu me-refresh halaman.
6. **Pencegahan Double-Booking Ruangan di Level Database:**
   * Ditegakkan secara matematis menggunakan PostgreSQL Exclusion Constraint `btree_gist`:
     ```sql
     ALTER TABLE public.reservations ADD CONSTRAINT no_overlapping_approved_bookings
     EXCLUDE USING gist (
         facility_id WITH =,
         tstzrange(start_time, end_time) WITH &&
     ) WHERE (status = 'approved');
     ```
7. **Pencegahan Overbooking Sarana & Peralatan:**
   * Sebelum permohonan disetujui, fungsi `validate_equipment_quota()` menghitung total kuota alat (proyektor, mic wireless, sound system) yang telah teralokasi pada jendela waktu yang sama agar tidak melampaui stok fisik gudang TU.
8. **Jejak Audit Otomatis (Status History Audit Trail):**
   * Trigger PostgreSQL `trg_reservation_status_change` secara otomatis mencatat setiap transisi status (`pending` ➔ `approved` / `rejected` / `revision_requested`) ke dalam tabel `reservation_status_history` lengkap dengan stempel waktu dan ID peninjau.

---

## 🛠️ Panduan Menghubungkan ke Supabase (Step-by-Step)

### Langkah 1: Buat Proyek di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan login/daftar akun gratis.
2. Klik tombol **New Project**, beri nama `rik-spacehub`, pilih region terdekat (misal: Singapore), dan tentukan kata sandi basis data.

### Langkah 2: Jalankan Skrip Database Migration
1. Di dashboard proyek Supabase Anda, buka menu **SQL Editor** di bilah kiri.
2. Salin seluruh isi berkas [**`supabase_schema.sql`**](./supabase_schema.sql) atau berkas migrasi di [`supabase/migrations/20261116000000_rik_spacehub_schema.sql`](./supabase/migrations/20261116000000_rik_spacehub_schema.sql).
3. Tempelkan ke dalam editor SQL dan klik **Run**.
4. Skrip ini akan secara otomatis:
   * Mengaktifkan ekstensi `uuid-ossp` dan `btree_gist`.
   * Membuat seluruh tabel: `profiles`, `facilities`, `equipment`, `reservations`, `reservation_equipment`, `reservation_documents`, dan `reservation_status_history`.
   * Mengonfigurasi *Exclusion Constraint*, trigger audit, trigger auto-profile saat signup, fungsi validasi alat, dan seluruh aturan Row Level Security (RLS).
   * Membuat bucket penyimpanan privat `reservation-documents`.

### Langkah 3: Konfigurasi File Environment (.env)
1. Di dashboard Supabase, buka **Project Settings** ➔ **API**.
2. Salin:
   * **Project URL**
   * **Project API Keys (anon / public)**
3. Buat berkas baru bernama `.env` di folder proyek ini (sejajar dengan `package.json`), lalu isi:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Simpan berkas `.env`.

> ⚠️ **PENTING:** Jangan pernah memasukkan `service_role key` ke dalam file `.env` frontend. Gunakan selalu `anon` key yang telah diproteksi oleh RLS.

---

## 🟡 Mode Simulasi Lokal (Demo Mode)

Jika kredensial Supabase belum diisi atau aplikasi dibuka secara mandiri melalui [**`rik_spacehub_demo.html`**](./rik_spacehub_demo.html):
* Aplikasi secara otomatis beroperasi dalam **Mode Simulasi Lokal (Demo Mode)**.
* Di bilah atas (*Navbar*) muncul status **"Demo Mode (Simulasi Lokal)"**.
* Sistem menggunakan `localStorage` peramban untuk menyimpan data, dan **tidak berpura-pura data terbagi antar pengguna nyata**.
* Penguji dapat berganti akun secara instan dengan menu **"Ganti Akun Demo"** untuk menguji sudut pandang **Dr. Ratna (TU Admin)** dan mahasiswa dari **5 fakultas (FK, FF, FKG, FIK, FKM)**.

---

## 💻 Menjalankan Aplikasi di Komputer Lokal

```powershell
# 1. Masuk ke direktori
cd "c:\Users\kelly\Downloads\RIK SpaceHub"

# 2. Pasang dependensi
npm install

# 3. Jalankan server lokal
npm run dev
```

Buka peramban di `http://localhost:3000`.
Aplikasi akan secara otomatis mendeteksi apakah Supabase telah terhubung (🟢 Live Cloud) atau beroperasi dalam mode simulasi (🟡 Demo Mode).
