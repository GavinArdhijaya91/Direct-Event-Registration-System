import assert from "node:assert/strict";
import test from "node:test";
import { validateRecoveryInput } from "@/lib/ticket-recovery-input";

const kodePemulihan = "a1b2c3d4e5f60718293a4b5c6d7e8f90";

test("menerima nomor WA 08 dan kode huruf kecil lalu menormalkannya", () => {
  const result = validateRecoveryInput({
    whatsappNumber: "0812 3456 7890",
    recoveryCode: kodePemulihan,
  });

  assert.equal(result.valid, true);
  if (!result.valid) return;
  assert.equal(result.whatsappNumber, "6281234567890");
  assert.equal(result.recoveryCode, kodePemulihan.toUpperCase());
});

test("kode tiket EVT-XXXX ditolak dengan petunjuk yang spesifik", () => {
  const result = validateRecoveryInput({
    whatsappNumber: "081234567890",
    recoveryCode: "EVT-A2B3",
  });

  assert.equal(result.valid, false);
  if (result.valid) return;
  assert.match(result.message, /bukan kode pemulihan/);
});

test("kode pemulihan yang bukan 32 karakter heksadesimal ditolak", () => {
  const result = validateRecoveryInput({
    whatsappNumber: "081234567890",
    recoveryCode: "A1B2C3",
  });

  assert.equal(result.valid, false);
  if (result.valid) return;
  assert.match(result.message, /32 karakter/);
});

test("nomor WhatsApp yang tidak valid ditolak", () => {
  const result = validateRecoveryInput({
    whatsappNumber: "123",
    recoveryCode: kodePemulihan,
  });

  assert.equal(result.valid, false);
  if (result.valid) return;
  assert.match(result.message, /nomor WhatsApp Indonesia/);
});

test("kolom kosong ditolak sebelum permintaan dikirim", () => {
  const nomorKosong = validateRecoveryInput({
    whatsappNumber: "",
    recoveryCode: kodePemulihan,
  });
  const kodeKosong = validateRecoveryInput({
    whatsappNumber: "081234567890",
    recoveryCode: "   ",
  });

  assert.equal(nomorKosong.valid, false);
  assert.equal(kodeKosong.valid, false);
});
