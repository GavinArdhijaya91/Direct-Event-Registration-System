# Sistem Registrasi & Presensi Natal PWK 2026
### Persekutuan Warga Kristen (PWK) — UK3 Universitas Negeri Semarang (UNNES)

Aplikasi web modern, ringan, dan mandiri yang dirancang khusus untuk memfasilitasi pendaftaran peserta, penerbitan tiket digital, serta presensi kehadiran terpusat (*self check-in*) pada perayaan **Natal PWK 2026**.

* 📍 **Lokasi Acara**: Gedung B6, Fakultas Bahasa dan Seni (FBS) UNNES
* 📅 **Tanggal Acara**: 28 Januari 2027
* 🎯 **Sasaran Kapasitas**: 200–300 Peserta (Mahasiswa, Alumni, dan Tamu Undangan)

---

## 🎯 Tujuan Sistem

1. **Pendaftaran Cepat Tanpa Akun (*Accountless*)**: Peserta dapat mendaftar langsung tanpa perlu membuat akun, kata sandi, ataupun terikat login email kampus/Google tertentu.
2. **Presensi Cepat Ala Kampus UNNES (*Self Check-in*)**: Menghilangkan antrean panjang di pintu masuk aula dengan memanfaatkan 1 QR Code terpusat di proyektor/laptop panitia yang dapat dipindai serentak oleh peserta.
3. **Anti Titip Absen Jarak Jauh (*Dynamic QR Rotation*)**: Konten QR Code panitia diperbarui secara otomatis setiap 3 menit sehingga foto QR yang disebarkan ke luar ruangan akan segera kedaluwarsa.
4. **Jaminan Kelancaran Hari-H (*Zero Single Point of Failure*)**: Dilengkapi 3 lapis pengaman presensi (scan kamera web, ketik kode mandiri, dan tombol 1-klik absen di meja bantuan panitia jika peserta kehabisan kuota internet).
5. **Transparansi & Rekapitulasi Real-Time**: Panitia dapat memantau pergerakan jumlah kehadiran secara langsung dan mengunduh rekapitulasi data lengkap dalam format CSV.

---

## 📱 Panduan Penggunaan Bagi Peserta

```text
[ 1. Daftar Online ] ──> [ 2. Simpan Tiket ] ──> [ 3. Datang & Scan QR di Hari-H ]
```

### 1. Pendaftaran
* Kunjungi halaman pendaftaran di situs web acara.
* Masukkan Nama Lengkap, Nomor WhatsApp aktif, Kategori Peserta (Mahasiswa/Alumni/Tamu), Asal Instansi, dan Sumber Informasi.
* Tekan tombol **Daftar Sekarang**.

### 2. Menyimpan Tiket & Kode Pemulihan
* Setelah pendaftaran berhasil, Anda akan diarahkan ke **Halaman Tiket Pribadi**.
* Simpan link tiket Anda dengan menekan tombol **Simpan Tiket ke WhatsApp** (tautan akan dikirimkan ke chat nomor pribadi Anda).
* Simpan juga **Kode Pemulihan** 6-karakter yang ditampilkan. Kode ini berguna jika Anda ingin membuka tiket di perangkat/HP lain.

### 3. Presensi Saat Tiba di Gedung B6 FBS UNNES
* Buka halaman tiket Anda di HP masing-masing saat tiba di depan pintu aula.
* Tekan tombol hijau **`📷 Scan QR Presensi di Layar Proyektor / Banner`**.
* Izinkan akses kamera browser, lalu arahkan HP Anda ke layar laptop/proyektor yang disediakan panitia.
* Tiket Anda seketika berubah menjadi hijau mint: **SUDAH HADIR** (tunjukkan ke panitia di pintu masuk).

### 🆘 Bantuan Jika Terjadi Kendala:
* **Kamera HP Silau dari Layar?**  
  Tekan opsi *"Kamera silau? Masukkan kode presensi secara manual"* di halaman tiket Anda, lalu ketik 6 karakter kode yang tertulis di bawah QR panitia.
* **Kuota Internet Habis / HP Lowbat?**  
  Cukup datangi meja panitia di pintu masuk dan sebutkan nama Anda. Panitia akan langsung mengabsenkan Anda secara manual lewat sistem meja registrasi.

---

## 💻 Panduan Penggunaan Bagi Panitia (Admin & Helpdesk)

Akses panel operasional acara melalui rute `/admin` menggunakan kata sandi bersama panitia.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DASHBOARD ADMIN PWK 2026                        │
│  [Total Terdaftar: 250]   [Sudah Hadir: 180]   [Sisa Kuota: 50]        │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Menayangkan QR Presensi di Pintu Masuk
* Hubungkan laptop panitia ke layar proyektor atau siapkan 2–3 laptop di meja registrasi depan aula.
* Klik tombol **`🖥️ Tampilkan QR Presensi (Proyektor)`** di header dashboard.
* Aktifkan tombol **Mode Proyektor (Fullscreen)**.
* Layar akan menayangkan 1 QR Code besar beresolusi tinggi yang otomatis berganti token setiap 3 menit (anti titip absen). Peserta yang datang tinggal mengarahkan kamera HP mereka ke layar tersebut.

### 2. Mengabsenkan Peserta Tanpa Kuota / HP Mati (Meja Bantuan)
* Jika ada peserta datang melapor bahwa kuota internetnya habis atau HP-nya mati total:
  1. Panitia cukup mengetik nama peserta di kolom pencarian dashboard `/admin`.
  2. Pada baris nama peserta, tekan tombol bulat **`(✓) Absen`**.
  3. Status peserta seketika berubah menjadi `Hadir` dengan jam kehadiran tercatat rapi berlabel `MANUAL_ADMIN`.

### 3. Menangani Tamu On-The-Spot (OTS) Saat Kuota Penuh
* Jika kuota pendaftaran online sudah habis (`300/300`), namun ada tamu kehormatan/undangan khusus yang tiba langsung di lokasi:
  1. Klik tombol **`🆘 Tamu OTS`** di dashboard admin.
  2. Isi identitas singkat tamu serta tuliskan alasan penambahan kuota darurat.
  3. Sistem akan langsung menerbitkan tiket dan menandai tamu tersebut sebagai `HADIR` dengan pencatatan audit resmi.

### 4. Ekspor Data & Pemantauan
* Dashboard otomatis memperbarui data kehadiran setiap 20 detik tanpa perlu me-refresh halaman.
* Setelah acara selesai, panitia dapat menekan tombol **`CSV`** untuk mengunduh rekapitulasi data seluruh pendaftar lengkap dengan jam kehadiran masing-masing.

---

## 🕊️ Informasi Acara
Diselenggarakan oleh **Persekutuan Warga Kristen (PWK) — Unit Kegiatan Kerohanian Kristen (UK3) Universitas Negeri Semarang**.  
*Kiranya damai dan sukacita Natal menyertai seluruh pelayanan kita.* 🎄✨
