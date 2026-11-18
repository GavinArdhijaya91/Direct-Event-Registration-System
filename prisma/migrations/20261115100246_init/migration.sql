-- CreateEnum
CREATE TYPE "AttendeeStatus" AS ENUM ('TERDAFTAR', 'HADIR');

-- CreateEnum
CREATE TYPE "RegistrationCategory" AS ENUM ('MAHASISWA', 'ALUMNI', 'TAMU_UNDANGAN');

-- CreateEnum
CREATE TYPE "InformationSource" AS ENUM ('INSTAGRAM', 'WHATSAPP_GROUP', 'TEMAN_KATING', 'POSTER_KAMPUS', 'GEREJA');

-- CreateEnum
CREATE TYPE "CheckinMethod" AS ENUM ('SCAN_MANDIRI', 'MANUAL_ADMIN');

-- CreateTable
CREATE TABLE "pengaturan_acara" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nama_acara" VARCHAR(120) NOT NULL DEFAULT 'Natal PWK 2026',
    "tanggal_acara" DATE NOT NULL DEFAULT '2027-01-28 00:00:00 +00:00',
    "lokasi_acara" VARCHAR(120) NOT NULL DEFAULT 'Gedung B6, FBS UNNES',
    "kode_lokasi_aktif" VARCHAR(100),
    "kuota_maksimal" INTEGER NOT NULL DEFAULT 300,
    "jumlah_terdaftar" INTEGER NOT NULL DEFAULT 0,
    "pendaftaran_dibuka" BOOLEAN NOT NULL DEFAULT false,
    "waktu_buka_checkin" TIMESTAMPTZ(3),
    "waktu_tutup_checkin" TIMESTAMPTZ(3),
    "diperbarui_pada" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pengaturan_acara_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peserta" (
    "id" UUID NOT NULL,
    "kode_tiket" VARCHAR(20) NOT NULL,
    "token_tiket_hash" CHAR(64) NOT NULL,
    "kode_pemulihan_hash" CHAR(64) NOT NULL,
    "nama_lengkap" VARCHAR(120) NOT NULL,
    "nomor_wa" VARCHAR(16) NOT NULL,
    "kategori" "RegistrationCategory" NOT NULL,
    "asal_instansi" VARCHAR(120) NOT NULL,
    "sumber_informasi" "InformationSource" NOT NULL,
    "status" "AttendeeStatus" NOT NULL DEFAULT 'TERDAFTAR',
    "dibuat_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktu_checkin" TIMESTAMPTZ(3),
    "metode_checkin" "CheckinMethod",

    CONSTRAINT "peserta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_admin" (
    "id" UUID NOT NULL,
    "actor" VARCHAR(40) NOT NULL DEFAULT 'shared-admin',
    "aksi" VARCHAR(80) NOT NULL,
    "alasan" VARCHAR(500),
    "details" JSONB,
    "dibuat_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batas_permintaan" (
    "kunci" CHAR(64) NOT NULL,
    "percobaan" INTEGER NOT NULL DEFAULT 0,
    "mulai_jendela" TIMESTAMPTZ(3) NOT NULL,
    "diblokir_sampai" TIMESTAMPTZ(3),
    "diperbarui_pada" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "batas_permintaan_pkey" PRIMARY KEY ("kunci")
);

-- CreateIndex
CREATE UNIQUE INDEX "peserta_kode_tiket_key" ON "peserta"("kode_tiket");

-- CreateIndex
CREATE UNIQUE INDEX "peserta_token_tiket_hash_key" ON "peserta"("token_tiket_hash");

-- CreateIndex
CREATE UNIQUE INDEX "peserta_nomor_wa_key" ON "peserta"("nomor_wa");

-- CreateIndex
CREATE INDEX "peserta_status_dibuat_pada_idx" ON "peserta"("status", "dibuat_pada");

-- CreateIndex
CREATE INDEX "log_admin_dibuat_pada_idx" ON "log_admin"("dibuat_pada");

-- CreateIndex
CREATE INDEX "batas_permintaan_diperbarui_pada_idx" ON "batas_permintaan"("diperbarui_pada");
