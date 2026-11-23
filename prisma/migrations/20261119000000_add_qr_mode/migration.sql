-- CreateEnum
CREATE TYPE "QrMode" AS ENUM ('STATIC', 'DYNAMIC');

-- AlterTable
ALTER TABLE "pengaturan_acara" ADD COLUMN "mode_qr" "QrMode" NOT NULL DEFAULT 'DYNAMIC';
