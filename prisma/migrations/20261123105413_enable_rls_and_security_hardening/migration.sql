-- Enable Row Level Security (RLS) on all application tables
ALTER TABLE "pengaturan_acara" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "peserta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "log_admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "batas_permintaan" ENABLE ROW LEVEL SECURITY;

-- Deny all public / anonymous access via Supabase REST (PostgREST / anon / authenticated role)
-- The application connects directly via connection pooler as the database owner (postgres),
-- so the server-side Next.js backend bypasses RLS while protecting against any leaked anon keys or public REST API probing.
DROP POLICY IF EXISTS "Deny anon and authenticated access to pengaturan_acara" ON "pengaturan_acara";
CREATE POLICY "Deny anon and authenticated access to pengaturan_acara" ON "pengaturan_acara"
    FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Deny anon and authenticated access to peserta" ON "peserta";
CREATE POLICY "Deny anon and authenticated access to peserta" ON "peserta"
    FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Deny anon and authenticated access to log_admin" ON "log_admin";
CREATE POLICY "Deny anon and authenticated access to log_admin" ON "log_admin"
    FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Deny anon and authenticated access to batas_permintaan" ON "batas_permintaan";
CREATE POLICY "Deny anon and authenticated access to batas_permintaan" ON "batas_permintaan"
    FOR ALL TO anon, authenticated USING (false);
