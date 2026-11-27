-- Sumber informasi dipisah: Instagram, WhatsApp, Facebook, dan Teman/Komunitas Gereja.
-- WhatsApp tetap memakai label lama GRUP_WA di database agar data yang sudah ada tidak berubah.
-- Label lama lain sengaja dipertahankan untuk data historis, tetapi tidak lagi ditawarkan di formulir.

ALTER TYPE "InformationSource" ADD VALUE IF NOT EXISTS 'FACEBOOK';
ALTER TYPE "InformationSource" ADD VALUE IF NOT EXISTS 'TEMAN_KOMUNITAS_GEREJA';
