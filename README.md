# Sistem Registrasi dan Presensi Natal PWK 2026
Persekutuan Warga Kristen (PWK) — UK3 Universitas Negeri Semarang (UNNES)

Aplikasi web mandiri yang dirancang untuk memfasilitasi pendaftaran peserta, penerbitan tiket digital, serta pencatatan presensi kehadiran terpusat (self check-in) pada perayaan Natal PWK 2026.

- Lokasi Acara: Gedung B6, Fakultas Bahasa dan Seni (FBS) UNNES
- Tanggal Acara: 28 Januari 2027
- Kapasitas: 200–300 Peserta (Mahasiswa, Alumni, dan Tamu Undangan)

---

## 1. Tujuan Sistem

1. Pendaftaran Mandiri Tanpa Akun: Peserta dapat langsung mendaftar tanpa membuat akun, kata sandi, atau terikat login email kampus/Google tertentu.
2. Presensi Cepat Ala Kampus (Self Check-in): Mengurangi antrean di pintu masuk aula dengan memanfaatkan satu QR Code terpusat di proyektor atau laptop meja registrasi yang dapat dipindai langsung oleh peserta.
3. Pencegahan Presensi Jarak Jauh (Rotasi QR 3 Menit): Konten QR Code panitia diperbarui secara berkala setiap 3 menit, sehingga foto QR yang dibagikan ke luar ruangan akan segera kedaluwarsa.
4. Jaminan Kelancaran Hari-H (Tiga Lapis Pengaman): Menyediakan alur cadangan berupa input kode manual di ponsel peserta, serta tombol absen manual satu klik di meja bantuan panitia untuk peserta yang kehabisan baterai atau kuota internet.
5. Pemantauan dan Rekapitulasi Real-Time: Panitia dapat memantau pergerakan jumlah kehadiran secara langsung dan mengunduh laporan data lengkap dalam format CSV.

---

## 2. Panduan Penggunaan Bagi Peserta

Alur utama peserta:
Daftar Online -> Simpan Tiket -> Datang dan Pindai QR di Hari-H

### Langkah 1: Pendaftaran Online
1. Buka formulir pendaftaran pada situs web acara.
2. Masukkan Nama Lengkap, Nomor WhatsApp aktif, Kategori Peserta (Mahasiswa, Alumni, atau Tamu Undangan), Asal Instansi, dan Sumber Informasi.
3. Klik tombol "Daftar Sekarang".

### Langkah 2: Menyimpan Tiket dan Kode Pemulihan
1. Setelah berhasil mendaftar, Anda akan diarahkan ke halaman tiket pribadi.
2. Simpan tautan tiket ke obrolan WhatsApp pribadi menggunakan tombol yang tersedia.
3. Catat atau simpan kode pemulihan rahasia yang tertera. Kode ini digunakan untuk membuka kembali tiket jika Anda berpindah perangkat atau browser.

### Langkah 3: Presensi Saat Tiba di Lokasi
1. Buka tautan tiket pada ponsel Anda saat tiba di depan pintu masuk aula Gedung B6 FBS UNNES.
2. Klik tombol "Scan QR Presensi di Layar Proyektor / Banner".
3. Izinkan akses kamera pada browser, lalu arahkan kamera ke layar laptop atau proyektor panitia.
4. Halaman tiket akan langsung berubah status menjadi "SUDAH HADIR" lengkap dengan catatan waktu kedatangan.

### Bantuan Kendala Teknis:
- Jika kamera silau oleh pantulan layar: Klik opsi "Kamera silau? Masukkan kode presensi secara manual" pada halaman tiket, lalu ketikkan 6 karakter kode yang tertulis di bawah QR panitia.
- Jika ponsel kehabisan kuota internet atau kehabisan baterai: Datangi meja registrasi panitia dan sebutkan nama lengkap Anda. Petugas helpdesk akan memverifikasi dan mengabsenkan Anda secara langsung lewat sistem.

---

## 3. Panduan Penggunaan Bagi Panitia (Admin dan Helpdesk)

Akses panel operasional acara dapat dibuka melalui rute `/admin` dengan memasukkan kata sandi panitia.

### Langkah 1: Menayangkan QR Presensi di Pintu Masuk
1. Hubungkan laptop panitia ke layar proyektor aula, atau tempatkan 2 hingga 3 laptop di meja registrasi depan pintu masuk.
2. Klik tombol "Tampilkan QR Presensi (Proyektor)" pada bagian atas dashboard.
3. Pilih "Mode Proyektor (Fullscreen)" untuk menampilkan QR Code dalam ukuran penuh.
4. QR Code akan otomatis berotasi setiap 3 menit. Peserta yang datang dapat langsung mengarahkan kamera ponsel mereka ke layar tersebut.

### Langkah 2: Mengabsenkan Peserta yang Mengalami Kendala Koneksi
1. Jika peserta datang dengan kondisi ponsel mati atau tidak memiliki kuota internet:
   - Ketikkan nama peserta atau nomor WhatsApp pada kolom pencarian dashboard admin.
   - Pada baris data peserta yang bersangkutan, klik tombol bulat "[Absen]".
   - Status peserta seketika berubah menjadi "Hadir" dengan metode tercatat "MANUAL_ADMIN".

### Langkah 3: Pendaftaran Tamu On-The-Spot (OTS) Saat Kuota Penuh
1. Jika kuota pendaftaran online telah habis namun terdapat tamu undangan khusus atau kehormatan yang hadir langsung di lokasi:
   - Klik tombol "Tamu OTS" pada panel operasional.
   - Masukkan identitas singkat tamu beserta alasan wajib penambahan kuota.
   - Sistem akan langsung menerbitkan data peserta baru dengan status "HADIR" serta mencatat alasannya pada log audit.

### Langkah 4: Pemantauan dan Rekapitulasi Data
1. Statistik total pendaftar, total kehadiran, dan sisa kapasitas akan diperbarui secara otomatis setiap 20 detik.
2. Klik tombol "CSV" untuk mengunduh seluruh data pendaftar dan timestamp kehadiran ke dalam format spreadsheet untuk arsip pertanggungjawaban panitia.

---

## 4. Informasi Penyelenggara
Diselenggarakan oleh Persekutuan Warga Kristen (PWK) — Unit Kegiatan Kerohanian Kristen (UK3) Universitas Negeri Semarang.
