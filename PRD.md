# Product Requirements Document (PRD)
## Sistem Registrasi dan Check-in Natal PWK 2026

| Atribut | Spesifikasi |
|---|---|
| Nama produk | Sistem Registrasi Event Natal PWK 2026 |
| Tema acara | "Terang Natal menuntun Civitas Akademika di tengah kegelapan" (Yohanes 1:5) |
| Versi/status | 5.9 — Draft revisi; beberapa keputusan masih terbuka |
| Kapasitas awal | 250 peserta |
| Tanggal acara | 28 Januari 2027 |
| Lokasi acara | L4, FEB UNNES |
| Target biaya | Mengutamakan paket gratis; biaya Rp0 tidak dijamin |
| Platform rencana | Next.js App Router, TypeScript, PostgreSQL terkelola, Prisma |
| Pemilik produk/data | TBD |

---

## 1. Latar Belakang dan Tujuan

Pendaftaran dan presensi sebelumnya mengandalkan Google Form dan pencarian manual di spreadsheet. Kendala yang ingin dikurangi:

- Antrean di pintu masuk karena pencarian peserta satu per satu.
- Pendaftaran ganda dan format asal/instansi yang tidak konsisten.
- Panitia sulit melihat jumlah kehadiran dengan cepat.

### Tujuan

1. Memudahkan peserta mendaftar tanpa membuat akun.
2. Memberi peserta bukti pendaftaran yang dapat dibuka kembali.
3. Membantu panitia mencatat kehadiran dengan konsisten, termasuk saat kamera peserta bermasalah.
4. Menyediakan pemantauan dan ekspor data untuk panitia.
5. Mengutamakan layanan yang sederhana dan berbiaya rendah.

### Bukan tujuan

- Akun peserta, pengenalan wajah, WhatsApp Gateway, atau pembayaran.
- Menjamin pencegahan kecurangan menggunakan QR lokasi statis.
- Menjanjikan layanan gratis, kapasitas, atau ketersediaan vendor tanpa verifikasi.

## 2. Pengguna dan User Stories

### Peserta

- **US-01 Registrasi:** Sebagai calon peserta, saya dapat mendaftar untuk diri sendiri tanpa akun, kata sandi, atau email. Setiap anggota kelompok mendaftar sendiri dan mendapat tiket sendiri.
- **US-02 Bukti tiket:** Setelah mendaftar, saya dapat menyimpan tautan tiket melalui fitur berbagi WhatsApp (`wa.me/?text=...`). Fitur ini hanya membuka WhatsApp dengan teks yang sudah disiapkan; sistem tidak mengirim pesan atau memverifikasi nomor.
- **US-03 Cegah duplikasi:** Jika nomor WA sudah terdaftar, sistem tidak membuat peserta ganda atau membocorkan nama/tiket. Sistem mengarahkan peserta untuk memulihkan tiket dengan nomor WA dan kode pemulihan rahasia.
- **US-04 Pindah perangkat:** Saya dapat membuka tiket pada perangkat lain menggunakan nomor WA dan kode pemulihan rahasia, bukan nomor WA saja.
- **US-05 Jadwal check-in:** Check-in hanya diterima server pada rentang waktu yang dikonfigurasi.
- **US-06 Check-in:** Saya dapat memindai QR lokasi dari halaman tiket. Jika kamera tidak dapat digunakan, panitia dapat membantu melalui prosedur manual.

### Panitia dan admin

- **US-07 Konfigurasi:** Admin dapat mengatur informasi acara, waktu check-in, QR lokasi aktif, kuota, dan status buka/tutup pendaftaran.
- **US-08 Operasional:** Panitia dapat melihat statistik dan peserta, serta melakukan check-in manual yang tercatat.
- **US-09 Laporan:** Admin dapat mengunduh CSV berisi data peserta dan timestamp yang diperlukan.
- **US-10 Privasi:** Peserta mendapat penjelasan tentang data yang dikumpulkan dan tujuannya sebelum mendaftar.

## 3. Ruang Lingkup dan Aturan Produk

### 3.1 Formulir registrasi

Setiap pengiriman formulir adalah untuk satu orang. Field registrasi yang disetujui:

| Field | Aturan |
|---|---|
| `nama_lengkap` | Wajib; maksimal 120 karakter |
| `nomor_wa` | Wajib; dinormalisasi ke format internasional Indonesia sebelum pemeriksaan duplikasi |
| `tempat_lahir` | Wajib; teks kota/kabupaten tempat lahir (maksimal 100 karakter) |
| `tanggal_lahir` | Wajib; format tanggal `YYYY-MM-DD` |
| `stasi_asal_gereja` | Wajib; asal gereja/stasi identitas jemaat (maksimal 150 karakter) |
| `domisili` | Wajib; alamat tempat tinggal sekarang/kost (maksimal 255 karakter) |
| `tipe_peserta` | Wajib; `MAHASISWA_ALUMNI` atau `UMUM` |
| `status_akademik` | Wajib jika tipe peserta `MAHASISWA_ALUMNI`; `MAHASISWA` atau `ALUMNI` |
| `tahun_kelulusan` | Wajib jika status `ALUMNI`; 4 digit tahun kelulusan |
| `tipe_kampus` | Wajib jika tipe peserta `MAHASISWA_ALUMNI`; `UNNES` atau `LUAR_UNNES` |
| `fakultas` | Dropdown 9 fakultas jika UNNES (`FK`, `FEB`, `FIPP`, `FMIPA`, `FBS`, `FISIP`, `FH`, `FT`, `FIK`); input teks jika Luar UNNES |
| `prodi` | Wajib untuk mahasiswa/alumni; teks nama program studi |
| `nama_kampus` | Wajib jika kampus `LUAR_UNNES`; teks nama universitas |
| `kategori` | Diturunkan otomatis di server: `MAHASISWA`, `ALUMNI`, atau `TAMU_UNDANGAN` |
| `asal_instansi` | Diturunkan otomatis atau input instansi; maksimal 120 karakter |
| `sumber_informasi` | Wajib; `INSTAGRAM`, `WHATSAPP`, `FACEBOOK`, atau `TEMAN_KOMUNITAS_GEREJA`. WhatsApp tetap disimpan sebagai `GRUP_WA` agar data lama terbaca; `POSTER_KAMPUS` sudah tidak ditawarkan, label lama di database dipertahankan hanya untuk data historis. |

Mode pendaftaran satu orang atau kelompok tidak digunakan. Afiliasi kelompok/PMK dicatat sebagai asal/instansi. Satu nomor WA hanya boleh digunakan untuk satu peserta setelah dinormalisasi.

Normalisasi nomor WA menghapus karakter non-digit, menangani awalan `08`, `8`, dan `62` secara konsisten, lalu menolak nomor yang tidak masuk akal. Validasi wajib dilakukan di server, bukan hanya pada browser. `asal_instansi` memangkas dan merapikan spasi, mengubah kata umum menjadi Title Case, dan mempertahankan kapitalisasi singkatan `FMIPA`, `FT`, `FBS`, `FISIP`, `FEB`, `FH`, `FIK`, `FIPP`, `FK`, `UNNES`, `UNDIP`, `PMK`, `KMK`, `UK3`, `TI`, dan `SI`. Contoh: `fmipa - teknik informatika` menjadi `FMIPA - Teknik Informatika`.

### 3.2 Tiket dan pemulihan

- Halaman tiket menggunakan token akses acak yang tidak dapat ditebak. Token di URL adalah rahasia: siapa pun yang memilikinya dapat membuka tiket.
- Kode tampilan berbentuk `EVT-XXXX`, dengan empat karakter acak dari `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. Kode hanya untuk identifikasi visual dan bukan kredensial akses. Bentrok kode tampilan harus ditangani oleh batas unik dan percobaan ulang.
- Simpan hash token akses bila memungkinkan; token mentah hanya ditampilkan/diberikan saat pembuatan tautan.
- Nomor WA tidak diverifikasi. Endpoint cek tiket tidak boleh mengembalikan tiket atau data peserta hanya berdasarkan nomor WA.
- Email tidak dikumpulkan atau diverifikasi. Saat registrasi berhasil, sistem membuat kode pemulihan acak berentropi tinggi dan menampilkannya sekali agar peserta menyimpannya sendiri.
- Pemulihan memerlukan nomor WA yang dinormalisasi dan kode pemulihan yang cocok. Simpan hash kode, batasi percobaan, dan jangan mengungkap apakah nomor terdaftar melalui pesan yang berbeda. Setelah pemulihan berhasil, terbitkan token URL baru dan cabut token sebelumnya.
- Jika nomor yang dikirim sudah terdaftar, respons tidak boleh memuat kode/URL tiket, nama peserta, atau informasi sensitif lainnya; arahkan peserta ke formulir pemulihan.

Pendaftaran tetap satu orang per pengiriman. Pendaftaran kelompok tidak digunakan; setiap anggota mendaftar sendiri dengan nomor WA unik dan menerima tiket sendiri.

### 3.3 Check-in dan QR lokasi

Rencana awal memakai satu QR statis di venue. QR berisi kode lokasi yang dapat dibaca kamera. Server memvalidasi:

1. Token tiket yang valid dan peserta berstatus `TERDAFTAR`.
2. Kode lokasi yang cocok dengan konfigurasi aktif.
3. Waktu server berada dalam rentang check-in pada zona `Asia/Jakarta`, termasuk tepat pada batas buka dan tutup.
4. Perubahan status dilakukan secara atomik agar permintaan serentak hanya menghasilkan satu check-in.

Pemilik produk menerima penggunaan QR statis dengan pemantauan petugas, dengan pemahaman bahwa QR dapat difoto, dibagikan, atau dipindai dari luar venue. Karena itu:

- QR statis bukan bukti kehadiran fisik dan bukan faktor anti-kecurangan yang kuat.
- Jam atau animasi pada browser adalah petunjuk visual saja; klien dapat dimanipulasi dan screenshot dapat diedit.
- Petugas harus memantau status yang bersumber dari server pada dashboard/helpdesk dan membantu peserta bila terjadi masalah.
- Jika risiko check-in jarak jauh tidak dapat diterima, pemilik produk perlu memilih QR dinamis atau pemindaian tiket oleh petugas. Sistem kini mendukung **QR Proyektor Dinamis Berbasis Waktu (Rotasi Tiap 3 Menit)**:
  - Menggunakan HMAC-SHA256 stateless berbasis interval 180 detik.
  - Server memvalidasi window saat ini serta memberi toleransi 1 window sebelumnya/sesudahnya (grace period) untuk mengakomodasi latensi sinyal HP di aula.
  - Panel admin menyediakan saklar toggle antara Mode Dinamis (proyektor aula) dan Mode Statis (poster/banner cetak).
  - Peserta dapat memindai QR dinamis atau mengetik token 6-karakter jika kamera silau dari proyektor.

Check-in manual harus melakukan transisi status yang sama, hanya tersedia pada jendela check-in, mempertahankan timestamp check-in pertama, dan merekam metode `MANUAL_ADMIN`.

Pendaftaran langsung (OTS / tamu yang datang tanpa tiket) adalah jalur bantuan admin bagi tamu yang tidak dapat atau tidak nyaman mengisi formulir sendiri. Admin mendaftarkan satu orang dan langsung mencatat `HADIR` dalam transaksi yang sama. Karena tindakan ini setara check-in, server tetap memeriksa jendela check-in; di luar jendela, OTS ditolak dengan pesan yang jelas dan tidak mengubah data. OTS boleh menerima peserta saat pendaftaran ditutup atau kuota penuh; ini adalah override kuota yang wajib menyertakan alasan dan dicatat di audit seperti perubahan kuota lainnya.

### 3.4 Kuota dan duplikasi

- Kuota awal 250 peserta; nilai aktual dikonfigurasi admin.
- Jika kuota penuh, pendaftaran baru ditolak/ditandai penuh. Admin boleh melakukan override; alasan wajib diisi dan perubahan dicatat.
- Pengecekan kuota dan pembuatan peserta harus aman terhadap permintaan bersamaan agar batas tidak terlampaui tanpa sengaja.
- Pengecekan nomor duplikat harus memakai nilai nomor WA yang sudah dinormalisasi dan ditopang constraint database.

## 4. Halaman dan Pengalaman Pengguna

### Halaman utama (`/`)

- Navigasi: **Daftar Baru** dan **Sudah Daftar / Cek Tiket**.
- Formulir mobile-first, label dan pesan validasi yang jelas, status pendaftaran terbuka/penuh, serta penjelasan privasi sebelum submit.
- Alur pemulihan meminta nomor WA dan kode pemulihan; jangan mengungkap data hanya dari nomor WA.

### Halaman tiket (`/ticket/[token]`)

- Setelah registrasi, tampilkan kode pemulihan sekali dan minta peserta menyimpannya secara aman; jangan tampilkan kembali kode rahasia pada permintaan biasa.
- Status `TERDAFTAR`: identitas peserta secukupnya, kode tiket tampilan, tombol simpan/berbagi tautan WhatsApp, dan aksi scan QR saat jadwal dibuka.
- Muat library pemindai kamera secara lazy saat peserta memilih scan. Sediakan petunjuk izin kamera dan browser yang didukung serta jalur bantuan manual.
- Status `HADIR`: tampilkan **Live Boarding Pass**, indikator hadir, dan waktu check-in dari server. Animasi denyut atau jam WIB boleh dipakai untuk kejelasan visual, bukan sebagai bukti keamanan.
- Gunakan kanvas putih/netral; hijau emerald tua (`#064E3B`) untuk aksi utama, crimson (`#E11D48`) sebagai aksen, blush (`#FFF1F2`) untuk informasi ringan, dan mint (`#10B981`) untuk status hadir. Prioritaskan keterbacaan, aksesibilitas, dan performa di ponsel.

### Dashboard admin (`/admin`)

- Statistik: total terdaftar, total hadir, dan kapasitas tersisa/kelebihan kuota.
- Pencarian peserta, pengaturan acara, buka/tutup pendaftaran, check-in manual, penghapusan peserta satu per satu, penghapusan massal terjadwal, dan unduh CSV.
- Refresh otomatis rencana setiap 20 detik dengan saklar On/Off, tombol refresh manual, dan jeda saat tab tidak aktif. Angka adalah snapshot berkala, bukan real-time.
- Tampilkan maksimal 50 aktivitas admin terbaru, termasuk alasan dan perubahan sebelum/sesudah untuk pengaturan; label pelaku tetap `shared-admin` dan tidak mengidentifikasi orang.
- Penghapusan satu peserta tersedia kapan saja. Penghapusan massal hanya tersedia 20 Februari–15 Maret 2027 WIB; keduanya meminta alasan dan dicatat. Penghapusan massal perlu konfirmasi eksplisit.
- Perubahan pengaturan dan aksi manual harus memberi hasil sukses/gagal yang jelas. Setiap perubahan nilai kuota wajib menyertakan alasan dan dicatat di audit log.

## 5. Arsitektur dan Data

### Rencana arsitektur

```text
Browser peserta/panitia
        |
        | HTTPS: registrasi, tiket, check-in, admin
        v
Next.js App Router di Vercel (rencana)
        |
        | Prisma melalui koneksi/pooler yang sesuai runtime
        v
Supabase PostgreSQL Free (pilihan awal)
```

Supabase Free dipilih untuk implementasi dan rencana deployment awal guna menekan biaya. Aplikasi memakai Transaction Pooler; Prisma CLI memakai Session Pooler untuk migrasi. Proyek Free dapat dijeda saat aktivitas database rendah dan harus di-resume melalui dashboard; paket ini tidak menyediakan backup harian otomatis. Vercel menyediakan hosting aplikasi secara terpisah. Batas paket, lokasi data, backup manual, dan penanggung jawab pemulihan perlu ditinjau sebelum pendaftaran publik dibuka. Jangan menganggap satu instance `PrismaClient` atau URL pooler tertentu otomatis cocok untuk semua runtime/provider.

### Entitas data awal

| Entitas | Field utama |
|---|---|
| `pengaturan_acara` | `id`, `nama_acara`, `tanggal_acara` (28 Januari 2027), `lokasi_acara` (L4, FEB UNNES), `kode_lokasi_aktif`, `kuota_maksimal`, `waktu_buka_checkin`, `waktu_tutup_checkin`, `pendaftaran_dibuka`, `diperbarui_pada` |
| `peserta` | `id` internal, `kode_tiket` unik, `token_tiket_hash` unik, `kode_pemulihan_hash`, `nama_lengkap`, `nomor_wa` ternormalisasi dan unik, `kategori`, `asal_instansi`, `sumber_informasi`, `status`, `dibuat_pada`, `waktu_checkin`, `metode_checkin` |
| Log admin | Waktu, aktor `shared-admin`, tindakan, alasan override kuota/penghapusan, ringkasan perubahan sebelum/sesudah; kata sandi bersama tidak dapat mengidentifikasi admin individual |

Timestamp disimpan sebagai instan waktu yang konsisten dan ditampilkan dalam `Asia/Jakarta`. Definisi waktu buka/tutup harus jelas termasuk perilaku pada batas menit/detik. Jadwal dan status selalu diperiksa di server.

## 6. API dan Aturan Backend

Endpoint berikut merupakan kontrak awal, bukan keputusan framework final:

| Endpoint | Fungsi dan batasan |
|---|---|
| `POST /api/register` | Validasi input, status pendaftaran, duplikasi, dan kuota di server. Membuat satu peserta. Respons duplikasi generik tidak menyertakan kode/URL tiket, nama, atau data sensitif. |
| `GET /ticket/[token]` | Menampilkan tiket bila token valid. Jangan memakai kode tiket pendek sebagai token. |
| `POST /api/tickets/recover` | Memvalidasi nomor WA dan kode pemulihan dengan pesan kegagalan generik serta rate limit; bila cocok, mengganti hash token dan mengembalikan tautan tiket baru sehingga tautan lama tidak lagi berlaku. |
| `POST /api/checkin` | Menerima token tiket dan kode lokasi; memvalidasi waktu/status/kode lokasi; melakukan update status secara atomik. |
| `POST /api/admin/login` | Memvalidasi rahasia admin dari environment dan membuat sesi aman. Jangan pernah mengirim rahasia ke client atau menyimpan contoh rahasia nyata di repo. |
| `POST /api/admin/logout` | Mengakhiri sesi admin dengan mencabut token di server sehingga token lama tidak dapat dipakai lagi. |
| `GET /api/admin/dashboard` | Mengambil statistik dan data yang diperlukan untuk panel setelah autentikasi/otorisasi. |
| `PATCH /api/admin/settings` | Mengubah konfigurasi setelah autentikasi dan validasi server. Override kuota wajib menyertakan alasan dan dicatat. |
| `POST /api/admin/manual-checkin` | Mencatat check-in manual setelah autentikasi; tidak menimpa check-in pertama. |
| `POST /api/admin/register-walkin` | Mendaftarkan tamu OTS dan langsung mencatat `HADIR` setelah autentikasi, Same-Origin, dan validasi jendela check-in; alasan wajib, override kuota dicatat. |
| `POST /api/admin/delete-attendee` | Menghapus satu peserta setelah autentikasi, validasi same-origin, dan alasan wajib; memperbarui penghitung pendaftaran serta mencatat kode tiket dan alasan. |
| `POST /api/admin/delete-attendees` | Menghapus semua peserta hanya pada 20 Februari–15 Maret 2027 WIB; server memeriksa jendela, meminta alasan/konfirmasi, memperbarui penghitung, dan mencatat jumlah yang dihapus. |
| `GET /api/admin/export` | Menghasilkan CSV setelah autentikasi dan perlindungan terhadap formula injection. |

Untuk login kata sandi bersama, implementasi minimum perlu session cookie `HttpOnly`, `Secure` pada HTTPS, `SameSite=Strict`, masa berlaku, rate limit, dan perlindungan request lintas situs yang sesuai. Implementasi awal memakai sesi 8 jam serta membatasi login dan pemulihan; batas ini perlu ditinjau sebelum rilis. Rahasia disimpan di environment deployment dan tidak dikomit. Rotasi dipicu ketika admin melaporkan keluhan atau kekhawatiran terkait akses dan menjadi tanggung jawab developer; batas waktu dan langkah pelaksanaan masih perlu ditetapkan. Kata sandi bersama adalah kompromi operasional: audit mencatat tindakan, waktu, alasan, dan perubahan sebelum/sesudah, tetapi tidak dapat mengatribusikan tindakan kepada orang tertentu. Setiap perubahan kuota wajib menyertakan alasan; batas maksimum override tidak ditetapkan, dan perubahan konfigurasi serta check-in manual dicatat. Percobaan login gagal, logout, dan pemulihan tiket juga dicatat di audit tanpa menyimpan nomor WA atau token tiket.

Check-in sukses harus mempertahankan waktu pertama. Jika sudah hadir, berikan status yang konsisten tanpa memproses check-in kedua. Kegagalan database, validasi, atau autentikasi tidak boleh berubah menjadi respons sukses.

CSV memuat kode tiket, nama, nomor WA, kategori, instansi, sumber informasi, waktu daftar, status, waktu check-in, dan metode check-in dalam zona `Asia/Jakarta`. File memakai UTF-8 BOM, melindungi nilai teks dari formula spreadsheet, dan endpoint dibatasi ke admin.

## 7. Keamanan, Privasi, dan Operasional

### Risiko dan mitigasi

| Risiko | Dampak | Mitigasi minimum |
|---|---|---|
| QR statis tersebar ke luar venue | Check-in jarak jauh | Nyatakan batasan; batasi distribusi; pantau status dari server; evaluasi QR dinamis/petugas scanner bila tingkat risiko tidak diterima |
| Tautan tiket diteruskan atau bocor | Akses tiket oleh orang lain | Token acak kuat; minimalkan paparan di log/referrer/analitik; beri tahu peserta agar tidak membagikan tautan |
| Kata sandi admin bersama bocor | Akses ke data dan operasi admin | Rahasia kuat di environment; rate limit dan sesi aman; prosedur rotasi; batasi pengguna yang mengetahui rahasia |
| Proyek Supabase Free dijeda karena aktivitas rendah | Registrasi, tiket, dan check-in gagal sampai proyek di-resume | Pantau notifikasi/status proyek; tetapkan penanggung jawab resume; siapkan backup dan prosedur gangguan sebelum pendaftaran dibuka |
| Lonjakan melebihi kuota provider | Registrasi/check-in lambat atau gagal | Uji beban realistis, pemantauan penggunaan, kueri ringan, dan SOP manual |
| Permintaan serentak pada kuota/check-in | Data melewati batas atau status ganda | Constraint database, update atomik/transaksi, dan tes konkurensi |
| Ekspor CSV dibuka di spreadsheet | Formula injection/kebocoran data | Escape nilai berbahaya, pilih kolom seperlunya, dan lindungi endpoint |

### Privasi dan retensi

Nomor WA dan data identitas harus digunakan hanya untuk kebutuhan acara yang dijelaskan kepada peserta. Target retensi peserta adalah 1–2 bulan setelah acara. Penghapusan massal tidak berjalan otomatis: semua pemegang kata sandi admin bersama dapat memilih kapan melakukannya pada 20 Februari–15 Maret 2027 WIB; penghapusan satu peserta tersedia kapan saja. Setiap penghapusan meminta alasan dan dicatat. Baris peserta, termasuk token tiket dan hash kode pemulihan, dihapus; log aktivitas lama, termasuk kode tiket yang tercatat, tetap disimpan. Masa retensi log dan cakupan backup masih TBD. Sebelum rilis, tentukan pemilik/pengendali data, siapa yang dapat mengakses, cara menghapus/arsip, dan kontak permintaan data. Jangan menambah analitik atau mengirim data pribadi ke layanan eksternal tanpa kebutuhan dan persetujuan yang jelas.

### Hari-H dan pemulihan

- Cetak dan uji QR lokasi pada ukuran/bahan yang tetap terbaca kamera (rencana minimal A3/A2, matte/anti-silau); isi QR adalah kode lokasi, bukan URL.
- Pastikan satu atau dua perangkat helpdesk dapat mengakses panel sebelum acara dan siapkan cara check-in manual.
- Siapkan prosedur jika internet, kamera, aplikasi, atau database tidak tersedia. Tentukan bagaimana catatan manual direkonsiliasi setelah layanan pulih.
- Uji alur peserta dari pendaftaran sampai check-in pada beberapa browser/perangkat dan kondisi jaringan.

## 8. Biaya, Kinerja, dan Deployment

- Supabase Free dipilih untuk implementasi dan rencana deployment awal; biaya Rp0 hanya selama penggunaan sesuai batas dan ketentuan provider, bukan jaminan.
- Verifikasi ketentuan Vercel, batas function invocation/compute, koneksi database, storage, bandwidth, backup, serta kebutuhan kapasitas sebelum pendaftaran publik dibuka.
- Supabase Free dapat dijeda setelah aktivitas database rendah selama 7 hari; pemulihan dilakukan manual dari dashboard. Tidak ada backup harian otomatis pada paket ini. Tetapkan pemantauan, backup manual, dan penanggung jawab sebelum rilis.
- Uji beban untuk 250 pendaftar dan lonjakan check-in yang realistis; siapkan pemantauan dan prosedur jika limit terlampaui.
- Polling dashboard rencana 20 detik, dijeda saat tab tersembunyi, dan dapat dimatikan. Hindari query penuh yang berulang bila statistik agregat cukup.
- Tetapkan environment variables hanya di lingkungan lokal/deployment yang tepat, misalnya `DATABASE_URL`, `DIRECT_URL` jika diperlukan provider, `ADMIN_PASSWORD`, dan `ADMIN_SESSION_SECRET` acak minimal 32 byte. File contoh hanya memakai placeholder yang jelas dan tidak dapat dipakai sebagai kredensial.
- Terapkan koneksi database/pooler sesuai dokumentasi provider dan runtime yang dipilih. Jangan mencantumkan port/provider tertentu sebagai ketentuan universal.
- Koneksi PostgreSQL harus memverifikasi sertifikat Supabase CA (`sslmode=verify-full`); jangan menonaktifkan verifikasi sertifikat untuk mengatasi error TLS.

## 9. Kriteria Rilis Awal

- Peserta dapat mendaftar dan menerima token tiket yang tidak dapat ditebak.
- Nomor WA dinormalisasi konsisten; percobaan duplikasi tidak membocorkan tiket atau identitas.
- Kuota tidak terlampaui akibat permintaan bersamaan, kecuali admin melakukan override yang disetujui dan alasannya dicatat.
- Check-in hanya dapat terjadi dalam jadwal dan satu kali per peserta; update bersamaan tidak membuat status/timestamp ganda.
- Semua endpoint admin dan unduhan CSV terlindungi.
- CSV tidak mengeksekusi nilai teks sebagai formula spreadsheet.
- Fitur utama dapat digunakan pada ponsel; ada jalur manual untuk masalah kamera/perangkat.
- Backup, retensi data, biaya/limit vendor, akses admin, dan SOP gangguan telah ditinjau sebelum hari-H.

## 10. Keputusan Terbuka Sebelum Implementasi

1. Tanggal acara 28 Januari 2027 dan venue L4, FEB UNNES sudah ditetapkan. Jam check-in direncanakan diisi pada 22 Januari; pemilik data masih TBD. Keputusan produk berasal dari divisi acara secara kolektif, bukan atas nama perorangan. Kontak dan pengumuman untuk peserta disampaikan lewat media sosial/chat panitia; nama narahubung per individu tidak dicantumkan di website. Secara operasional, developer mengelola web; divisi acara atau sekretaris biasanya menjalankan administrasi.
2. Penghapusan massal tersedia 20 Februari–15 Maret 2027 WIB dan dipicu manual oleh admin; penghapusan satu peserta boleh kapan saja. Log lama yang memuat kode tiket tetap disimpan, tetapi masa retensi log dan cakupan backup masih TBD.
3. Rotasi kata sandi admin bersama dipicu oleh keluhan/kekhawatiran akses dan menjadi tanggung jawab developer; batas waktu/prosedur rotasi masih TBD. Audit tetap menggunakan identitas `shared-admin` dan tidak dapat mengidentifikasi admin individual.
4. Override kuota tidak memiliki batas maksimum; perubahan nilai kuota tetap wajib menyertakan alasan dan tercatat beserta nilai sebelum/sesudah.
5. Supabase Free dipilih untuk implementasi dan rencana deployment awal. Koneksi runtime memakai Transaction Pooler dan migrasi memakai Session Pooler. Domain rilis awal adalah `https://natal-pwk-unnes-2026.vercel.app` (dapat diganti lewat `NEXT_PUBLIC_APP_URL` bila memakai domain sendiri); penanggung jawab backup manual masih perlu ditetapkan. Dashboard diperbarui berkala dan ekspor peserta tersedia dalam CSV; ini bukan backup database otomatis. Tinjau kembali risiko jeda serta batas provider sebelum pendaftaran publik dibuka.
6. OTS diputuskan sebagai jalur administratif untuk tamu yang datang langsung, termasuk tamu yang tidak nyaman memakai formulir mandiri. Pendaftaran dan pencatatan `HADIR` terjadi sekaligus, tetapi tetap hanya di dalam jendela check-in yang diperiksa server. Kuota atau status tutup pendaftaran boleh di-override dengan alasan wajib dan tercatat di audit.
