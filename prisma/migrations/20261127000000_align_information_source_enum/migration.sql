-- Selaraskan label enum dengan skema setelah perubahan manual di database produksi.
-- Aman dijalankan dua kali: rename hanya terjadi bila label lama ada dan label baru belum ada.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'InformationSource' AND e.enumlabel = 'WHATSAPP_GROUP'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'InformationSource' AND e.enumlabel = 'GRUP_WA'
  ) THEN
    ALTER TYPE "InformationSource" RENAME VALUE 'WHATSAPP_GROUP' TO 'GRUP_WA';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'InformationSource' AND e.enumlabel = 'GEREJA'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'InformationSource' AND e.enumlabel = 'GEREJA_PMK'
  ) THEN
    ALTER TYPE "InformationSource" RENAME VALUE 'GEREJA' TO 'GEREJA_PMK';
  END IF;
END $$;
