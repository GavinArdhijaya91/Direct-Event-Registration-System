import assert from "node:assert/strict";
import test from "node:test";
import { databaseSslOptions } from "@/lib/db-ssl";

test("database connection uses the CA with strict certificate verification", () => {
  const ca = "-----BEGIN CERTIFICATE-----\nCONTOH\n-----END CERTIFICATE-----";
  const options = databaseSslOptions(ca);

  assert.equal(options.ca, ca);
  assert.equal(options.rejectUnauthorized, true);
});

test("database connection fails closed when the CA is missing or invalid", () => {
  assert.throws(() => databaseSslOptions(undefined), /verifikasi sertifikat/);
  assert.throws(() => databaseSslOptions(""), /verifikasi sertifikat/);
  assert.throws(() => databaseSslOptions("bukan sertifikat"), /verifikasi sertifikat/);
});
