-- Kuota bawaan diubah dari 300 menjadi 250 sesuai keputusan panitia.
-- Hanya baris yang masih memakai nilai lama yang diubah, dan perubahannya dicatat di audit.

ALTER TABLE "pengaturan_acara"
  ALTER COLUMN "kuota_maksimal" SET DEFAULT 250;

WITH updated AS (
  UPDATE "pengaturan_acara"
  SET "kuota_maksimal" = 250,
      "diperbarui_pada" = CURRENT_TIMESTAMP
  WHERE "id" = 1 AND "kuota_maksimal" = 300
  RETURNING "kuota_maksimal"
)
INSERT INTO "log_admin" ("id", "actor", "aksi", "alasan", "details")
SELECT
  gen_random_uuid(),
  'shared-admin',
  'settings-updated',
  'Kuota bawaan disesuaikan dari 300 menjadi 250 sesuai keputusan panitia.',
  jsonb_build_object(
    'before', jsonb_build_object('maxCapacity', 300),
    'after', jsonb_build_object('maxCapacity', 250)
  )
FROM updated;
