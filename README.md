# Sistem Registrasi & Presensi Natal PWK UNNES 2026
> **A High-Reliability, Serverless Event Registration & Verification System**  
> Diselenggarakan oleh Paguyuban Warga Kristiani Universitas Negeri Semarang (PWK UNNES)

---

## Latar Belakang Masalah (Background Story)

Perayaan Natal PWK UNNES merupakan **acara tahunan akbar** yang mempertemukan mahasiswa aktif, alumni lintas angkatan, jemaat gereja, hingga tamu undangan umum di lingkungan Universitas Negeri Semarang. 

Pada tahun-tahun sebelumnya, proses registrasi dan presensi acara mengandalkan **Google Form konvensional dan pencarian manual lembar spreadsheet di meja registrasi**. Kendala nyata yang kerap dihadapi setiap tahun:
1. **Antrean Mengular di Pintu Masuk:** Pencarian nama ratusan jemaat satu per satu di spreadsheet memakan waktu lama dan menyebabkan penumpukan di pintu aula.
2. **Data Ganda & Format Tidak Baku:** Peserta sering mendaftar ulang berkali-kali karena lupa apakah sudah terdaftar, serta format penulisan fakultas/instansi yang berantakan.
3. **Keterbatasan Hubungan Jangka Panjang:** Karena acara setahun sekali, panitia kesulitan memetakan persebaran mahasiswa (fakultas/prodi), jejaring alumni, serta stasi/gereja asal jemaat untuk pembinaan dan relasi persaudaraan pasca-acara.
4. **Tantangan Biaya Infrastruktur:** Acara berbasis organisasi kemahasiswaan membutuhkan sistem mandiri yang andal, aman, namun **harus efisien secara anggaran (target Rp0 / Free-Tier Friendly)**.

Untuk menjawab persoalan tersebut, sistem ini dibangun secara khusus dari nol (*custom-built*) dengan arsitektur modern yang mengedepankan **integritas data, kecepatan presensi di pintu masuk, dan keamanan informasi**.

---

## Arsitektur & Rekayasa Sistem (Key Engineering Highlights)

Aplikasi ini dibangun menggunakan arsitektur **Modern Serverless Web Application** dengan pertimbangan teknis tinggi:

### 1. Concurrency-Safe & Zero Overbooking (Atomic Transactions)
- Menggunakan **Prisma Transaction (`$transaction`)** pada PostgreSQL untuk menangani perebutan sisa kuota registrasi (*race condition*).
- Jika puluhan pendaftar menekan tombol *submit* di milidetik yang sama menjelang kuota habis, database menjamin tidak ada tiket lebih yang diterbitkan melebihi kapasitas aula (*pessimistic/atomic reservation*).

### 2. Time-Based Dynamic Rotating QR Code (Anti-Cheat Presence)
- Presensi venue menggunakan kode QR yang **berotasi otomatis setiap 3 menit** di layar proyektor / laptop panitia.
- Ditenagai algoritma **HMAC-SHA256 time-slice token**, sehingga foto atau tangkapan layar (*screenshot*) QR yang dikirimkan ke grup chat di luar venue akan segera hangus dan ditolak server.

### 3. Serverless Connection Pooling
- Dirancang untuk lingkungan hosting *serverless* (Vercel) yang rentan terhadap *connection exhaust*.
- Menggunakan **PgBouncer Connection Pooling (Port 6543)** via `@prisma/adapter-pg` pada Supabase PostgreSQL, menjaga performa tetap stabil di bawah batas kuota gratis.

### 4. Zero Credential Leakage & Token Recovery
- Peserta tidak perlu membuat akun/kata sandi baru. Tiket diakses via URL bertoken kriptografis acak (43-char Base64URL).
- Dilengkapi **High-Entropy Recovery Code** dan tombol integrasi cepat *"Simpan ke WA Saya"*. Nomor WhatsApp tidak pernah dijadikan satu-satunya kredensial pembuka tiket guna mencegah kebocoran data pribadi oleh pihak asing.

### 5. Multi-Layer Fault Tolerance (Hari-H Disaster Recovery)
Sistem memiliki 3 lapis perlindungan operasional meja registrasi:
- **Jalur Utama:** Peserta memindai QR dinamis di layar laptop/proyektor panitia secara mandiri.
- **Jalur Bantuan (Helpdesk):** Fitur *Check-in Manual* instan oleh panitia jika baterai HP peserta habis atau kamera silau.
- **Jalur Penyelamat (OTS / Walk-In):** Modal pendaftaran darurat untuk tamu terhormat yang datang langsung tanpa tiket saat kuota penuh, lengkap dengan pencatatan alasan wajib pada **Admin Audit Log**.

### 6. Security Hardening & Privacy
- **Row-Level Security (RLS):** Seluruh tabel PostgreSQL dikunci dengan RLS untuk memblokir akses REST API anonim publik (mencegah scraping Supabase PostgREST).
- **Anti Formula-Injection:** Proteksi otomatis terhadap karakter manipulasi spreadsheet (`=`, `+`, `-`, `@`) saat panitia mengekspor laporan CSV.
- **CSRF & Origin Verification:** Verifikasi origin ketat pada seluruh mutasi data sensitif admin.
- **Timing-Safe Comparison:** Mengamankan autentikasi admin panel dari ancaman *timing attacks*.

---

## Struktur & Skema Profil Peserta

Formulir registrasi mengadopsi struktur bercabang dinamis (*Dynamic Categorization*):
* **Mahasiswa / Alumni:**
  * Status: Mahasiswa Aktif vs Alumni (khusus alumni wajib input tahun kelulusan).
  * Asal Kampus:
    * **UNNES:** Pilihan dropdown fakultas baku (`FK`, `FEB`, `FIPP`, `FMIPA`, `FBS`, `FISIP`, `FH`, `FT`, `FIK`) dan prodi.
    * **Luar UNNES:** Input bebas nama perguruan tinggi, fakultas, dan prodi.
* **Umum / Tamu Undangan:** Jalur khusus jemaat dan undangan luar kampus tanpa isian akademik.
* **Data Relasi Komunitas (Semua Peserta):** Tempat & tanggal lahir, stasi/identitas gereja asal, alamat domisili, dan nomor WhatsApp.

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| **Framework** | Next.js (App Router, Server Actions, Route Handlers) |
| **Language** | TypeScript (Strict Type Safety) |
| **Database** | PostgreSQL (Supabase Managed Database) |
| **ORM** | Prisma ORM dengan `@prisma/adapter-pg` |
| **Validation** | Zod Schema Validation |
| **Styling** | Tailwind CSS (Mobile-First, Ergonomic Touch Targets) |
| **Deployment** | Vercel (Serverless Edge & Node.js Runtime) |
| **Testing** | Node.js Native Test Runner (`tsx --test`) |

---

## Panduan Menjalankan Secara Lokal

1. **Clone repositori:**
   ```bash
   git clone https://github.com/username/Direct-Event-Registration-System.git
   cd Direct-Event-Registration-System
   ```

2. **Pasang dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment (`.env`):**
   Salin berkas template:
   ```bash
   cp .env.example .env
   ```
   Isi `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, dan `ADMIN_SESSION_SECRET`, dan `QR_SIGNING_SECRET`.

4. **Migrasi Database:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Jalankan Pengujian Unit:**
   ```bash
   npm test
   ```

6. **Mulai Server Pengembangan:**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## Deploy ke Vercel

Repo ini sudah menyiapkan hal yang bisa disiapkan di kode: Prisma Client di-generate otomatis saat install (`postinstall`), runtime Node dibatasi ke v22+, dan `supabase-ca.crt` dimasukkan ke bundle function agar koneksi `verify-full` tidak gagal. Yang perlu dilakukan sekali:

### 1. Isi environment variables di Vercel

Buka **Project Settings → Environment Variables**, tambahkan untuk **Production** dan **Preview**:

| Variabel | Sumber dan aturan |
|---|---|
| `DATABASE_URL` | Supabase **Transaction Pooler** (port 6543), dengan `?pgbouncer=true&sslmode=verify-full&sslrootcert=./supabase-ca.crt` |
| `DIRECT_URL` | Supabase **Session Pooler** (port 5432), dengan `?sslmode=verify-full&sslrootcert=./supabase-ca.crt`. Juga dibaca oleh `prisma generate` saat build. |
| `ADMIN_PASSWORD` | Rahasia bersama panitia, minimal 12 karakter |
| `ADMIN_SESSION_SECRET` | 32 byte acak, misal `openssl rand -base64 32` |
| `QR_SIGNING_SECRET` | 32 byte acak, misal `openssl rand -base64 32`. Wajib diisi karena mode QR bawaan adalah dinamis. |

Jangan pernah memasukkan nilai asli ke repo; `.env.example` hanya berisi placeholder. Setelah env terisi, cukup **Import/Deploy** project dari GitHub — build command tidak perlu diubah.

### 2. Siapkan database produksi (sekali)

Dari komputer lokal yang `.env`-nya mengarah ke database produksi:

```bash
npm run db:prepare
```

Perintah ini menjalankan `prisma migrate deploy` lalu `prisma db seed`. Tanpa seed, baris pengaturan `id=1` tidak ada dan pendaftaran akan tertutup. Jalankan ulang `npm run db:prepare` setiap kali ada migrasi baru.

### 3. Verifikasi setelah deploy

Uji alur lengkap di URL deployment: daftar satu peserta → simpan kode pemulihan → buka tiket → pulihkan tiket → atur jendela check-in di admin → scan/ketik kode presensi → login admin → unduh CSV.

### Catatan operasional

- Supabase Free dapat dijeda setelah sekitar 7 hari tanpa aktivitas. **Resume** project sebelum pendaftaran dibuka dan sebelum hari-H, dan tentukan penanggung jawabnya.
- Paket Free tidak menyediakan backup harian. Siapkan prosedur backup manual; ekspor CSV **bukan** backup database.
- Koneksi database memakai `sslmode=verify-full`. Jangan menonaktifkan verifikasi sertifikat untuk mengatasi error TLS.
- `supabase-ca.crt` harus berisi **Supabase Root 2021 CA** yang di-download dari **Supabase Dashboard → Project Settings → Database → SSL Configuration → Download Certificate**. Bundle CA Amazon RDS tidak akan terverifikasi oleh pooler Supabase dan membuat halaman menampilkan "Layanan belum tersedia".
- Vercel tidak menjalankan migrasi secara otomatis; langkah `npm run db:prepare` tetap wajib dilakukan setelah deploy ke database baru.

---

## Lisensi & Kontribusi
Dikembangkan dengan penuh dedikasi untuk melayani perayaan Natal PWK UNNES 2026. Hak cipta milik tim pengembang sistem Natal PWK UNNES.
