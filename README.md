# Registrasi Natal PWK 2026

Web registrasi peserta, tiket privat, check-in QR, dan operasi admin untuk Natal PWK 2026.

## Status implementasi

Alur registrasi, pemulihan tiket, check-in QR, dan operasi admin dasar sudah
diimplementasikan. PRD masih draft; keputusan dan detail yang belum final
tercatat di [PRD.md](./PRD.md).

## Prasyarat

- Node.js 20.9 atau lebih baru.
- PostgreSQL yang dapat diakses dari lingkungan aplikasi dan Prisma CLI.
- Rahasia admin dan sesi yang diatur secara lokal/deployment; jangan commit nilai rahasia.

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env`. Dari dashboard Supabase, ambil connection string Transaction Pooler (port 6543) untuk `DATABASE_URL` dan Session Pooler (port 5432) untuk `DIRECT_URL`. Unduh sertifikat CA dari **Database Settings → SSL Configuration** dan simpan sebagai `supabase-ca.crt` di root proyek. Gunakan `sslmode=verify-full` dan `sslrootcert=./supabase-ca.crt` pada kedua URL. Isi juga `ADMIN_PASSWORD` dan `ADMIN_SESSION_SECRET` dengan nilai lokal yang kuat. Jangan commit `.env` atau membagikan connection string.
2. Pasang dependensi: `npm install`.
3. Generate Prisma Client: `npm run db:generate`.
4. Terapkan migrasi yang sudah ada ke proyek Supabase: `npm run db:deploy`.
5. Isi konfigurasi awal: `npm run db:seed`.
6. Jalankan aplikasi lokal: `npm run dev`.

`npm run db:migrate` hanya untuk database pengembangan terpisah; jangan jalankan
perintah itu pada database yang dipakai pendaftar. Untuk deployment, gunakan
`npm run db:deploy`. Atur `DATABASE_URL` dan `DIRECT_URL` sebagai secret di
environment deployment yang sesuai. Aplikasi memakai Transaction Pooler; Prisma
CLI memakai Session Pooler untuk migrasi. Sertakan `supabase-ca.crt` dalam
artefak deployment; sertifikat CA bersifat publik, tetapi connection string dan
rahasia admin tidak.

Supabase Free dapat menjeda proyek saat aktivitas database rendah. Jika dijeda,
proyek perlu di-resume melalui dashboard Supabase; tentukan penanggung jawab
pemantauan dan backup sebelum pendaftaran publik dibuka.

Pendaftaran tertutup secara default. Login admin memerlukan
`ADMIN_PASSWORD` dan `ADMIN_SESSION_SECRET` acak minimal 32 byte. Konfigurasikan
jadwal check-in serta kode lokasi di `/admin` sebelum acara. Kata sandi admin
bersama tidak mengidentifikasi petugas secara individual.

## Pemeriksaan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

Jangan gunakan data peserta nyata pada lingkungan pengembangan.
