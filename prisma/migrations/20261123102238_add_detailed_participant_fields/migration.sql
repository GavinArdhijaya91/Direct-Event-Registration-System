-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('MAHASISWA_ALUMNI', 'UMUM');

-- CreateEnum
CREATE TYPE "AcademicStatus" AS ENUM ('MAHASISWA', 'ALUMNI');

-- CreateEnum
CREATE TYPE "CampusType" AS ENUM ('UNNES', 'LUAR_UNNES');

-- AlterTable
ALTER TABLE "peserta" ADD COLUMN "tempat_lahir" VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN "tanggal_lahir" VARCHAR(10) NOT NULL DEFAULT '',
ADD COLUMN "stasi_asal_gereja" VARCHAR(150) NOT NULL DEFAULT '',
ADD COLUMN "domisili" VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN "tipe_peserta" "ParticipantType" NOT NULL DEFAULT 'MAHASISWA_ALUMNI',
ADD COLUMN "status_akademik" "AcademicStatus",
ADD COLUMN "tahun_kelulusan" VARCHAR(4),
ADD COLUMN "tipe_kampus" "CampusType",
ADD COLUMN "nama_kampus" VARCHAR(120),
ADD COLUMN "fakultas" VARCHAR(100),
ADD COLUMN "prodi" VARCHAR(100);
