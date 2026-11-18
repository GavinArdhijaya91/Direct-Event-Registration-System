import assert from "node:assert/strict";
import test from "node:test";
import { csvCell } from "@/lib/csv";
import {
  normalizeInstitution,
  normalizeWhatsappNumber,
  registrationSchema,
} from "@/lib/registration";
import {
  createRecoveryCode,
  createTicketCode,
  createTicketToken,
  hashCredential,
} from "@/lib/ticket-credentials";
import { getCheckinWindowStatus } from "@/lib/checkin-window";

test("normalizes Indonesian WhatsApp number prefixes", () => {
  assert.equal(normalizeWhatsappNumber("0812 3456 7890"), "6281234567890");
  assert.equal(normalizeWhatsappNumber("81234567890"), "6281234567890");
  assert.equal(normalizeWhatsappNumber("+62 (812)-3456-7890"), "6281234567890");
  assert.equal(normalizeWhatsappNumber("6281234567890"), "6281234567890");
  assert.equal(normalizeWhatsappNumber("08abc12-3456-7890"), "6281234567890");
});

test("rejects malformed or implausible WhatsApp numbers", () => {
  assert.equal(normalizeWhatsappNumber("0215551234"), null);
  assert.equal(normalizeWhatsappNumber("0812-ABCD"), null);
  assert.equal(normalizeWhatsappNumber("08123"), null);
});

test("normalizes allowed registration fields and rejects oversized names", () => {
  const result = registrationSchema.safeParse({
    fullName: "  Peserta Natal  ",
    whatsappNumber: "081234567890",
    category: "MAHASISWA",
    institution: "  fmipa   - teknik  informatika  ",
    informationSource: "INSTAGRAM",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.fullName, "Peserta Natal");
    assert.equal(result.data.whatsappNumber, "6281234567890");
    assert.equal(result.data.institution, "FMIPA - Teknik Informatika");
  }

  const oversized = registrationSchema.safeParse({
    fullName: "N".repeat(121),
    whatsappNumber: "081234567890",
    category: "MAHASISWA",
    institution: "Universitas PWK",
    informationSource: "INSTAGRAM",
  });
  assert.equal(oversized.success, false);
});

test("keeps configured institution abbreviations uppercase", () => {
  assert.equal(normalizeInstitution("  unnes / pmk - ft "), "UNNES / PMK - FT");
  assert.equal(normalizeInstitution("fisip fakultas ekonomi"), "FISIP Fakultas Ekonomi");
});

test("escapes CSV formulas and quotes", () => {
  assert.equal(csvCell('=HYPERLINK("https://example.invalid")'), '"\'=HYPERLINK(""https://example.invalid"")"');
  assert.equal(csvCell("Nama peserta"), '"Nama peserta"');
});

test("enforces inclusive server check-in window boundaries", () => {
  const opensAt = new Date("2026-12-25T02:00:00.000Z");
  const closesAt = new Date("2026-12-25T10:00:00.000Z");

  assert.equal(getCheckinWindowStatus(new Date(opensAt.getTime() - 1), opensAt, closesAt), "not-open");
  assert.equal(getCheckinWindowStatus(opensAt, opensAt, closesAt), "open");
  assert.equal(getCheckinWindowStatus(closesAt, opensAt, closesAt), "open");
  assert.equal(getCheckinWindowStatus(new Date(closesAt.getTime() + 1), opensAt, closesAt), "closed");
  assert.equal(getCheckinWindowStatus(new Date(), null, closesAt), "not-configured");
});

test("generates high-entropy ticket and recovery credentials", () => {
  const ticketToken = createTicketToken();
  const recoveryCode = createRecoveryCode();

  assert.match(ticketToken, /^[A-Za-z0-9_-]{43}$/);
  assert.match(recoveryCode, /^[A-F0-9]{32}$/);
  assert.equal(hashCredential(ticketToken).length, 64);
  assert.notEqual(hashCredential(ticketToken), ticketToken);
  assert.match(createTicketCode(), /^EVT-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
});
