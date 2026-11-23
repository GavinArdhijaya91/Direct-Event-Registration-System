import assert from "node:assert/strict";
import { X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Supabase CA file contains the root CA used by the database pooler", () => {
  const text = readFileSync("supabase-ca.crt", "utf8");
  const blocks =
    text.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) ??
    [];

  assert.ok(blocks.length > 0, "supabase-ca.crt tidak berisi sertifikat");

  const subjects = blocks.map((block) => new X509Certificate(block).subject);
  assert.ok(
    subjects.some(
      (subject) =>
        subject.includes("O=Supabase Inc") &&
        subject.includes("CN=Supabase Root 2021 CA"),
    ),
    "supabase-ca.crt harus berisi Supabase Root 2021 CA dari Supabase Dashboard, bukan bundle CA Amazon RDS",
  );
});
