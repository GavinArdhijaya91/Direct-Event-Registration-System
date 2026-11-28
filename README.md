# Sistem Registrasi & Presensi Natal PWK UNNES 2026

Website untuk membantu panitia Natal PWK UNNES 2026 mencatat pendaftaran dan kehadiran peserta tanpa antrean panjang di pintu masuk.

Acara berlangsung **28 Januari 2027** di **L4, FEB UNNES**, dengan kuota awal **250 peserta**. Setiap orang mendaftar untuk dirinya sendiri dan mendapat tiketnya sendiri.

Tema acara adalah **Terang Natal menuntun Civitas Akademika di tengah kegelapan** (Yohanes 1:5). Teks di website dan poster memakai tema yang sama.

Dokumen ini ditulis untuk siapa saja yang terlibat: panitia, peserta, dan orang yang kelak mengelola sistemnya. Bagian teknis ada di bawah, setelah bagian alur.

---

## Daftar isi

- [Untuk siapa sistem ini](#untuk-siapa-sistem-ini)
- [Apa yang bisa dilakukan](#apa-yang-bisa-dilakukan)
- [Alur untuk peserta](#alur-untuk-peserta)
- [Alur untuk panitia](#alur-untuk-panitia)
- [Hal yang perlu disiapkan panitia](#hal-yang-perlu-disiapkan-panitia)
- [Data dan privasi](#data-dan-privasi)
- [Keterbatasan yang perlu diketahui](#keterbatasan-yang-perlu-diketahui)
- [Menjalankan di komputer sendiri](#menjalankan-di-komputer-sendiri)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Pemeriksaan sebelum rilis](#pemeriksaan-sebelum-rilis)
- [Yang belum diputuskan](#yang-belum-diputuskan)

---

## Untuk siapa sistem ini

- **Peserta**: mahasiswa dan alumni UNNES, jemaat dari gereja atau stasi asal, serta tamu undangan. Mereka tidak perlu membuat akun atau kata sandi.
- **Panitia registrasi**: memantau siapa yang sudah daftar dan siapa yang sudah hadir, membantu peserta yang mengalami kendala, serta mengunduh data dalam bentuk CSV.
- **Penanggung jawab acara**: mengatur kuota, jadwal check-in, dan informasi acara dari panel admin.

Satu hal yang penting sejak awal: **nomor WhatsApp tidak diverifikasi**. Nomor itu dipakai untuk mencegah pendaftaran ganda dan membantu pemulihan tiket, tetapi bukan bukti identitas.

---

## Apa yang bisa dilakukan

**Halaman utama**

- Mendaftar satu orang per pengiriman formulir.
- Membuka tiket yang sudah dibuat kembali lewat nomor WhatsApp dan kode pemulihan.
- Melihat status pendaftaran sedang dibuka atau sudah penuh.

**Halaman tiket**

- Menyimpan atau membagikan tautan tiket ke WhatsApp.
- Memindai QR presensi yang ditayangkan panitia.
- Mengetik kode token pendek bila kamera silau atau tidak bisa dipakai.
- Melihat status hadir dan waktu check-in setelah server mencatatnya.

**Panel admin**

Panel admin dibagi menjadi lima halaman agar mudah dipakai:

| Halaman | Isinya |
|---|---|
| Ringkasan | Jumlah peserta, jumlah yang hadir, dan sisa kuota |
| Presensi & QR | Menayangkan QR untuk proyektor, check-in manual, dan pendaftaran tamu langsung |
| Daftar peserta | Mencari peserta, melihat detailnya, memfilter yang hadir atau belum hadir, dan mengunduh CSV |
| Pengaturan | Nama acara, lokasi, kuota, jadwal check-in, dan mode QR |
| Riwayat | Catatan tindakan admin, beserta alasan untuk perubahan penting |

Panel ini memakai **satu kata sandi bersama**. Setiap tindakan tetap tercatat, tetapi catatannya tidak bisa menunjukkan siapa orang di baliknya. Karena itu, akses hanya dibagikan kepada petugas yang ditunjuk.

---

## Alur untuk peserta

1. **Daftar.** Isi formulir dengan data diri, asal gereja atau stasi, dan asal kampus atau instansi. Formulir menyesuaikan: alumni diminta tahun kelulusan, mahasiswa UNNES memilih fakultas dan program studi.
2. **Simpan dua hal.** Setelah berhasil, peserta mendapat tautan tiket dan **kode pemulihan**. Kode pemulihan hanya ditampilkan sekali, jadi harus disimpan sendiri.
3. **Buka tiket.** Tautan tiket berisi token acak. Siapa pun yang memilikinya bisa membuka tiket itu, jadi jangan dibagikan bebas.
4. **Scan saat check-in.** Pada jadwal yang sudah ditentukan server, peserta memindai QR yang ditayangkan panitia. Bila kamera bermasalah, panitia bisa membantu lewat check-in manual.
5. **Lihat status.** Setelah check-in berhasil, halaman tiket menampilkan status hadir dan waktu check-in dari server.

**Kalau tautan tiket hilang:** buka menu "Sudah Daftar / Cek Tiket", lalu masukkan nomor WhatsApp dan kode pemulihan. Sistem akan menerbitkan tautan baru dan mencabut tautan yang lama. Kode pemulihan tidak berubah, jadi tetap bisa dipakai bila tautan baru hilang lagi. Nomor WhatsApp saja tidak cukup.

Kalau kode pemulihan ikut hilang, tidak ada pemulihan otomatis. Peserta perlu dibantu panitia.

---

## Alur untuk panitia

**Sebelum acara**

- Buka pendaftaran dan tentukan kuota di halaman Pengaturan.
- Isi jadwal buka dan tutup check-in dalam WIB.
- Pilih mode QR: dinamis untuk proyektor, atau statis untuk poster cetak. Tombol "Cetak poster" hanya muncul pada mode statis.
- Siapkan QR presensi di layar dan uji dengan satu atau dua perangkat.

**Saat acara**

- Tayangkan QR dari halaman Presensi & QR.
- Pantau jumlah hadir dari halaman Ringkasan atau Daftar peserta.
- Bila peserta tidak bisa memindai, cari namanya dan gunakan tombol "Absenkan hadir", atau ketik kode tiket `EVT-XXXX` di form check-in manual.
- Bila tamu datang langsung tanpa tiket, gunakan menu Tamu OTS saat jendela check-in terbuka. Alasan wajib diisi; kuota boleh dilampaui sebagai override dan semuanya tercatat di riwayat.

Angka di panel diperbarui berkala, bukan detik demi detik. Ada tombol refresh manual dan pengatur auto-refresh yang bisa dimatikan.

**Setelah acara**

- Unduh data peserta lewat tombol Ekspor CSV di halaman Daftar peserta.
- Perubahan sensitif, seperti ubah kuota atau hapus data, memerlukan alasan dan masuk ke halaman Riwayat. Login gagal, logout, dan pemulihan tiket juga tercatat di sana tanpa menyimpan nomor WA atau token.

---

## Hal yang perlu disiapkan panitia

Beberapa hal belum bisa diputuskan dari kode saja dan perlu ditetapkan oleh panitia:

- **Jam acara dan jam check-in** yang pasti.
- **Penanggung jawab database.** Paket database yang dipakai saat ini dapat dijeda setelah beberapa hari tanpa aktivitas. Proyek harus diaktifkan kembali sebelum pendaftaran dibuka dan sebelum hari-H.
- **Prosedur cadangan.** Ekspor CSV bukan cadangan database. Perlu ada prosedur dan penanggung jawab pencadangan manual.
- **Kontak bantuan** yang bisa dihubungi peserta bila tiket atau kode pemulihan bermasalah.
- **Pemilik data** dan tata cara permintaan penghapusan data peserta.

---

## SOP hari-H dan uji coba lapangan

Bagian ini dipakai untuk praktik lapangan. SOP ini tidak menggantikan keputusan panitia yang masih tercantum di bagian sebelumnya.

**Uji coba 30 menit sebelum acara**

Lakukan dengan 5 sampai 10 ponsel panitia, campuran WiFi dan paket data:

1. Daftar dengan nomor WhatsApp uji. Jangan pakai nomor peserta asli untuk uji coba.
2. Simpan kode pemulihan, lalu buka halaman tiket dari ponsel tersebut.
3. Coba scan QR dinamis. Jika kamera silau, coba ketik kode 6 karakter.
4. Buka panel admin, cari peserta uji, lalu lakukan check-in manual.
5. Unduh XLSX atau CSV, pastikan kolom sumber informasi dan waktu check-in terbaca.
6. Hapus peserta uji lewat panel admin, lalu cek Riwayat aktivitas.

**Sebelum hari-H**

- Pastikan proyek Supabase aktif dan tidak dijeda. Tentukan satu orang yang bertugas mengaktifkan kembali bila perlu.
- Isi jendela check-in di pengaturan admin sesuai keputusan panitia.
- Siapkan QR dinamis di proyektor dan kode 6 karakternya sebagai cadangan.
- Siapkan satu atau dua ponsel helpdesk yang sudah bisa login admin.
- Pastikan panitia tahu jalur check-in manual lewat kode `EVT-XXXX`.

**Saat acara**

- Peserta datang bertahap, jadi tidak perlu menyuruh semua orang scan bersamaan.
- Pantau jumlah hadir dari panel admin, bukan dari jam atau animasi di ponsel peserta.
- Bila scan gagal karena kamera, sinyal, atau browser, minta peserta membuka tautan di Chrome atau Safari, lalu gunakan kode manual jika perlu.
- Bila layanan atau database terganggu, catat kehadiran di kertas, lalu rekonsiliasi lewat check-in manual setelah layanan pulih.

**Catatan kapasitas**

Untuk 250 peserta yang datang bertahap, beban check-in diperkirakan ringan. Campuran WiFi dan paket data tidak menambah beban database secara berarti. Batas percobaan per IP dan per token tetap berlaku. Ini masih estimasi dari desain, bukan hasil uji beban, jadi pantau penggunaan di dashboard Supabase bila memungkinkan.

---

## Data dan privasi

Data yang dikumpulkan hanya untuk kebutuhan acara: nama, nomor WhatsApp, tempat dan tanggal lahir, stasi atau gereja asal, domisili, asal kampus atau instansi, serta sumber informasi tentang acara.

Beberapa aturan yang dijalankan sistem:

- Satu nomor WhatsApp hanya untuk satu peserta, setelah dinormalisasi.
- Kata sandi dan kode pemulihan disimpan sebagai sidik (hash), bukan teks asli.
- Token tiket di URL bersifat rahasia dan acak; kode `EVT-XXXX` hanya untuk tampilan, bukan kredensial.
- Panel admin dan unduhan CSV hanya bisa diakses setelah login.
- Nilai yang berpotensi dibaca sebagai rumus spreadsheet diberi tanda khusus saat diekspor ke CSV.
- Target retensi data peserta adalah **1–2 bulan setelah acara**, lalu dihapus atau dianonimkan. Tanggal pastinya masih perlu ditetapkan.

---

## Keterbatasan yang perlu diketahui

- **QR presensi bukan bukti kehadiran fisik.** QR di proyektor bisa dipotret atau dikirim ke orang di luar venue. Mode dinamis berputar tiap tiga menit dan server memberi sedikit toleransi untuk koneksi yang lambat, tetapi tetap ada batasan ini. Petugas perlu memantau status dari server.
- **Kamera dan jaringan bisa bermasalah.** Sengaja disediakan check-in manual dan pendaftaran tamu langsung sebagai jalur bantuan.
- **Kata sandi admin bersama** tidak bisa mengidentifikasi orang per orang. Audit mencatat tindakan dan alasan, bukan nama petugas.
- **Beberapa percobaan dibatasi.** Login admin dan pemulihan tiket punya batas percobaan agar tidak bisa ditebak terus-menerus. Bila mendapat pesan "terlalu banyak percobaan", tunggu sampai jendela waktu berakhir.
- **Biaya tidak dijamin nol.** Pilihan hosting dan database saat ini dipilih untuk menekan biaya, tetapi batas dan ketentuan penyedia tetap perlu dicek sebelum pendaftaran publik dibuka.

---

## Menjalankan di komputer sendiri

Bagian ini untuk orang yang akan mengubah atau menguji kode.

Diperlukan **Node.js versi 22.12 ke atas** dan akses ke database PostgreSQL yang sudah disiapkan.

```bash
git clone https://github.com/GavinArdhijaya91/Direct-Event-Registration-System.git
cd Direct-Event-Registration-System
npm install
cp .env.example .env
```

Buka `.env` dan isi nilai yang diperlukan. File contoh hanya berisi placeholder.

```bash
npm run db:prepare   # migrasi + isi pengaturan awal
npm run dev
```

Aplikasi bisa dibuka di `http://localhost:3000`.

Perintah yang biasa dipakai saat mengerjakan kode:

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan aplikasi untuk pengembangan |
| `npm test` | Menjalankan pengujian otomatis |
| `npm run typecheck` | Memeriksa kesalahan tipe TypeScript |
| `npm run lint` | Memeriksa gaya dan aturan kode |
| `npm run build` | Membuat versi produksi |

---

## Deploy ke Vercel

Sebagian kebutuhan deploy sudah disiapkan di repo: Prisma Client dibuat otomatis saat `npm install`, runtime ditetapkan ke Node.js, dan berkas sertifikat database ikut disertakan.

**1. Hubungkan repo ke Vercel.** Import repo GitHub ini dan pastikan branch yang dipakai adalah `main`. Setiap push ke branch tersebut akan memicu build jika proyek Vercelnya memang terhubung.

**2. Isi environment variables di dashboard Vercel.** File `.env` tidak ikut ter-commit, jadi nilai aslinya harus diisi lewat Project Settings → Environment Variables.

| Variabel | Isi singkat |
|---|---|
| `DATABASE_URL` | Alamat koneksi Transaction Pooler Supabase, untuk aplikasi saat berjalan |
| `DIRECT_URL` | Alamat Session Pooler Supabase, untuk perintah migrasi |
| `ADMIN_PASSWORD` | Kata sandi bersama panitia, minimal 12 karakter |
| `ADMIN_SESSION_SECRET` | Kunci acak minimal 32 byte untuk sesi login |
| `QR_SIGNING_SECRET` | Kunci acak minimal 32 byte untuk QR dinamis |
| `NEXT_PUBLIC_APP_URL` | `https://natal-pwk-unnes-2026.vercel.app` (tanpa garis miring akhir) |

Tiga rahasia di atas bisa dibuat dengan `openssl rand -base64 32`. Jangan menaruh nilai asli di repo. `NEXT_PUBLIC_APP_URL` bukan rahasia; nilai itu dipakai untuk menghasilkan tautan gambar pratinjau (Open Graph/Twitter) yang benar. Bila nanti memakai domain sendiri, cukup ubah nilai variabel ini — kode tidak perlu diubah.

**3. Siapkan database sekali.** Dari komputer lokal yang `.env`-nya mengarah ke database produksi, jalankan:

```bash
npm run db:prepare
```

Tanpa langkah ini, baris pengaturan acara belum ada dan pendaftaran tidak akan berjalan. Vercel tidak menjalankan migrasi otomatis, jadi ulangi perintah ini setiap kali ada migrasi baru.

**4. Cek hasil deploy.** Uji dari awal sampai akhir: daftar satu peserta, simpan kode pemulihan, buka tiket, pulihkan tiket, atur jadwal check-in di admin, coba presensi, login admin, lalu unduh CSV.

### Catatan koneksi database

Koneksi memakai verifikasi sertifikat penuh (`sslmode=verify-full`). Jangan mematikan verifikasi hanya karena ada error TLS. Berkas `supabase-ca.crt` di repo harus berisi sertifikat **Supabase Root 2021** yang diunduh dari Supabase Dashboard → Project Settings → Database → SSL Configuration. Sertifikat dari penyedia lain tidak akan cocok.

---

## Pemeriksaan sebelum rilis

- [ ] Proyek database aktif dan tidak dalam jeda.
- [ ] Environment variables produksi sudah terisi dan sesuai.
- [ ] `npm run db:prepare` sudah dijalankan terhadap database produksi.
- [ ] Jadwal check-in dan kuota sudah diatur di panel admin.
- [ ] QR presensi sudah diuji dengan beberapa perangkat dan ukuran cetak.
- [ ] Satu perangkat panitia bisa membuka panel admin dan melakukan check-in manual.
- [ ] Alur daftar → tiket → presensi → CSV sudah dicoba di URL produksi.
- [ ] Penanggung jawab cadangan data dan penanganan gangguan sudah ditetapkan.

---

## Yang belum diputuskan

Rincian ini masih terbuka dan perlu keputusan panitia sebelum dipakai luas:

- Jadwal pasti check-in (direncanakan diisi pada 22 Januari).
- Pemilik data dan prosedur permintaan penghapusan data.
- Tanggal pasti penghapusan data dan berapa lama log aktivitas disimpan.
- Aturan dan jadwal rotasi kata sandi admin bersama.
- Domain rilis awal sudah ditetapkan: `https://natal-pwk-unnes-2026.vercel.app` (bisa diganti lewat `NEXT_PUBLIC_APP_URL`). Penanggung jawab pencadangan manual masih perlu ditetapkan.

Kontak dan pengumuman untuk peserta disampaikan lewat media sosial/chat panitia. Nama narahubung per individu tidak dicantumkan di website; keputusan diambil oleh divisi acara secara kolektif.

Keputusan produk yang lengkap ada di `PRD.md`.
