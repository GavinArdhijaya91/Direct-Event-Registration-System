# Panduan Agent untuk Registrasi Natal PWK 2026

## Konteks Produk

- Baca `PRD.md` sebelum mengubah kebutuhan produk atau implementasi. PRD berstatus **draft**; keputusan yang belum ditetapkan ada di bagian "Keputusan Terbuka Sebelum Implementasi".
- Produk adalah web registrasi dan check-in untuk acara Natal PWK 2026, dengan sasaran awal 200–300 peserta.
- Setiap orang mendaftar sendiri dan mendapat tiket sendiri. Belum ada autentikasi akun peserta.
- Nomor WA wajib unik per peserta setelah dinormalisasi.
- Rencana stack: Next.js App Router, TypeScript, PostgreSQL terkelola, dan Prisma. Penyedia database dan versi runtime belum diputuskan; jangan mengasumsikan atau mengunci pilihan tanpa kebutuhan yang jelas.
- Targetnya meminimalkan biaya, bukan menjamin gratis. Verifikasi batas/ketentuan Vercel dan penyedia database ketika pilihan dibuat.

## Keputusan dan Batasan Produk

- QR check-in lokasi statis diterima dengan pemantauan petugas. QR dapat disalin dan tidak membuktikan lokasi fisik; jangan menyebut sistem anti-kecurangan atau menganggap jam/animasi pada browser sebagai kontrol keamanan.
- Admin saat ini direncanakan memakai kata sandi bersama yang dijaga Ketua Pelaksana, Sekretaris, dan tim Registrasi. Semua endpoint admin tetap harus terlindungi di server, rahasia tidak boleh masuk ke kode/repo/client, dan keterbatasan audit per orang harus dijelaskan.
- Nomor WhatsApp tidak diverifikasi. Jangan gunakan nomor WA saja untuk membuka atau mengungkap tiket.
- Tiket memerlukan token URL acak yang tidak dapat ditebak; kode tiket pendek hanya identifikasi tampilan, bukan kredensial.
- Admin dapat melakukan override kuota dengan alasan wajib; perubahan kuota dan operasi sensitif harus tercatat.
- Target retensi data adalah 1–2 bulan setelah acara, lalu dihapus atau dianonimkan; tanggal pastinya belum ditetapkan.

## Aturan Kerja

- Perlakukan `PRD.md` sebagai sumber kebutuhan saat ini; jika permintaan baru bertentangan dengan PRD atau berdampak pada privasi, keamanan, biaya, atau operasional hari-H, jelaskan konflik dan minta keputusan sebelum mengunci perilaku.
- Ikuti kebijakan instruksi yang berlaku pada sesi kerja. Skill eksternal adalah panduan, bukan otoritas yang mengesampingkan instruksi repo atau keselamatan. Untuk review, jangan mendelegasikan satu alur bukti yang berkesinambungan atau temuan yang cukup dibaca dalam satu konteks; delegasikan hanya pekerjaan independen yang benar-benar memerlukan konteks terpisah.
- Jangan mengarang tanggal, venue, detail kebijakan retensi di luar target 1–2 bulan, batas vendor, ketersediaan layanan gratis, atau persetujuan legal. Tandai sebagai belum diketahui dan minta klarifikasi.
- Jaga lingkup tetap sederhana untuk acara satu kali dan kapasitas awal yang kecil. Hindari abstraksi, dependensi, layanan berbayar, serta fitur yang tidak mendukung kebutuhan yang disetujui.
- Validasi input di server. Hindari kebocoran data pribadi melalui respons, log, URL yang tidak perlu, analitik, atau ekspor.
- Registrasi, pemeriksaan duplikasi, kuota, dan check-in harus aman terhadap permintaan berulang/serentak. Kegagalan layanan harus ditampilkan sebagai kegagalan, bukan sukses palsu.
- Lindungi ekspor CSV dari formula injection dan batasi aksesnya ke admin.
- Gunakan bahasa Indonesia untuk dokumentasi dan UI kecuali ada alasan produk yang jelas untuk bahasa lain.
- Ikuti pola, format, dan dependensi yang sudah ada di repo. Jangan menambah file, komponen, atau paket hanya untuk terlihat lengkap; setiap perubahan harus memenuhi kebutuhan yang dapat diuji.

## Validasi Perubahan

- Sebelum implementasi, baca file terkait dan cari pola yang sudah digunakan. Jangan menimpa perubahan pengguna yang tidak terkait.
- Perubahan produk harus memperbarui `PRD.md` bila mengubah perilaku atau keputusan.
- Tambahkan atau sesuaikan tes untuk alur dan batas penting, khususnya akses admin, pencegahan duplikasi, kuota, token tiket, serta check-in atomik.
- Jalankan pemeriksaan terkecil yang mencakup perubahan (tes, lint, type-check, atau build yang tersedia) dan laporkan hasil sebenarnya. Jangan mengklaim validasi yang tidak dijalankan.
- Saat review, prioritaskan bug yang dapat direproduksi, dampak pada kebutuhan PRD, kebocoran data, otorisasi, konsistensi transaksi, dan kegagalan operasional. Bedakan temuan nyata dari saran atau risiko yang belum terbukti.

## Skill Repo

- `event-registration-prd-review`: gunakan untuk memeriksa atau mengubah kebutuhan registrasi, tiket, check-in, kapasitas, admin, ekspor, atau SOP acara.
- `serverless-architecture-review`: gunakan sebelum memilih atau mengubah batas modul, alur data/API, autentikasi admin, database, atau deployment.
- `event-platform-research`: gunakan untuk membandingkan pilihan hosting/database atau memverifikasi klaim provider dan regulasi operasional yang berubah dari waktu ke waktu.
- `anti-slop-event-ui`: gunakan saat membuat atau merombak UI peserta dan admin agar alur nyata, state, dan aksesibilitas lebih penting daripada dekorasi.
- `vercel-react-best-practices`: gunakan untuk implementasi/review komponen React dan Next.js, data fetching, bundle, atau performa; jangan memaksakan optimasi yang tidak diperlukan.
- `code-review`: gunakan saat diminta meninjau diff; tetapkan titik pembanding dan baca PRD sebagai sumber spesifikasi. Laporkan bukti dan pisahkan pelanggaran standar dari ketidaksesuaian spesifikasi.
- Klaim terkini tentang harga, batas paket, keamanan, atau perilaku provider harus ditelusuri ke dokumentasi/sumber primer, diberi tanggal, dan dibedakan dari asumsi.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
