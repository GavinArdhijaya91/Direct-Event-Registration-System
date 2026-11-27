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

test("normalizes allowed registration fields and handles UNNES mahasiswa", () => {
  const result = registrationSchema.safeParse({
    fullName: "  Peserta Natal  ",
    whatsappNumber: "081234567890",
    birthPlace: "Semarang",
    birthDate: "2003-05-12",
    churchOrigin: "Gereja Santo Fransiskus Asisi, Batam",
    domicile: "Sekaran, Gunungpati, Semarang",
    participantType: "MAHASISWA_ALUMNI",
    academicStatus: "MAHASISWA",
    campusType: "UNNES",
    faculty: "FMIPA",
    studyProgram: "teknik informatika",
    informationSource: "INSTAGRAM",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.fullName, "Peserta Natal");
    assert.equal(result.data.whatsappNumber, "6281234567890");
    assert.equal(result.data.category, "MAHASISWA");
    assert.equal(result.data.institution, "FMIPA - Teknik Informatika UNNES");
  }
});

test("validates alumni with graduation year", () => {
  const result = registrationSchema.safeParse({
    fullName: "Alumni Sukses",
    whatsappNumber: "081234567891",
    birthPlace: "Medan",
    birthDate: "2000-01-01",
    churchOrigin: "GKJ Semarang",
    domicile: "Semarang",
    participantType: "MAHASISWA_ALUMNI",
    academicStatus: "ALUMNI",
    graduationYear: "2022",
    campusType: "UNNES",
    faculty: "FT",
    studyProgram: "Teknik Sipil",
    informationSource: "WHATSAPP",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.category, "ALUMNI");
    assert.equal(result.data.graduationYear, "2022");
  }

  // Missing graduation year
  const invalidAlumni = registrationSchema.safeParse({
    fullName: "Alumni Tanpa Tahun",
    whatsappNumber: "081234567891",
    birthPlace: "Medan",
    birthDate: "2000-01-01",
    churchOrigin: "GKJ Semarang",
    domicile: "Semarang",
    participantType: "MAHASISWA_ALUMNI",
    academicStatus: "ALUMNI",
    campusType: "UNNES",
    faculty: "FT",
    studyProgram: "Teknik Sipil",
    informationSource: "WHATSAPP",
  });
  assert.equal(invalidAlumni.success, false);
});

test("validates outside campus participant", () => {
  const result = registrationSchema.safeParse({
    fullName: "Mahasiswa Undip",
    whatsappNumber: "081234567892",
    birthPlace: "Solo",
    birthDate: "2002-04-10",
    churchOrigin: "GKI",
    domicile: "Tembalang",
    participantType: "MAHASISWA_ALUMNI",
    academicStatus: "MAHASISWA",
    campusType: "LUAR_UNNES",
    campusName: "Universitas Diponegoro",
    faculty: "Fakultas Hukum",
    studyProgram: "Ilmu Hukum",
    informationSource: "WHATSAPP",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.institution, "Universitas Diponegoro - Fakultas Hukum / Ilmu Hukum");
  }
});

test("validates umum / tamu undangan", () => {
  const result = registrationSchema.safeParse({
    fullName: "Tamu Terhormat",
    whatsappNumber: "081234567893",
    birthPlace: "Jakarta",
    birthDate: "1995-12-25",
    churchOrigin: "Gereja Katedral Semarang",
    domicile: "Kota Semarang",
    participantType: "UMUM",
    informationSource: "FACEBOOK",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.category, "TAMU_UNDANGAN");
    assert.equal(result.data.institution, "Gereja Katedral Semarang");
  }
});

test("menolak sumber informasi yang sudah tidak ditawarkan", () => {
  const base = {
    fullName: "Peserta Uji",
    whatsappNumber: "081234567894",
    birthPlace: "Semarang",
    birthDate: "2000-01-01",
    churchOrigin: "Gereja Uji",
    domicile: "Semarang",
    participantType: "UMUM",
  } as const;

  for (const source of ["POSTER_KAMPUS", "TEMAN_GRUP_GEREJA"]) {
    const result = registrationSchema.safeParse({ ...base, informationSource: source });
    assert.equal(result.success, false, `sumber ${source} masih diterima`);
  }
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
