-- Venue acara diperbarui menjadi L4, FEB UNNES.
-- Hanya nilai lama yang diketahui yang diubah; kustomisasi lain dari admin tidak ditimpa.

ALTER TABLE "pengaturan_acara"
  ALTER COLUMN "lokasi_acara" SET DEFAULT 'L4, FEB UNNES';

UPDATE "pengaturan_acara"
SET "lokasi_acara" = 'L4, FEB UNNES',
    "diperbarui_pada" = CURRENT_TIMESTAMP
WHERE "lokasi_acara" = 'Gedung B6, FBS UNNES';
