import { normalizeWhatsappNumber } from "@/lib/registration";

const recoveryCodePattern = /^[A-F0-9]{32}$/;
const ticketCodePattern = /^EVT-[A-HJ-NP-Z2-9]{4}$/i;

export type RecoveryInput = {
  whatsappNumber: string;
  recoveryCode: string;
};

export type RecoveryInputValidation =
  | { valid: true; whatsappNumber: string; recoveryCode: string }
  | { valid: false; message: string };

/**
 * Validasi bentuk input pemulihan sebelum permintaan dikirim. Pesan yang
 * dihasilkan hanya membahas format, sehingga aman ditampilkan di klien tanpa
 * mengungkap apakah sebuah nomor atau kode terdaftar.
 */
export function validateRecoveryInput(
  input: RecoveryInput,
): RecoveryInputValidation {
  if (!input.whatsappNumber.trim()) {
    return { valid: false, message: "Nomor WhatsApp wajib diisi." };
  }

  const whatsappNumber = normalizeWhatsappNumber(input.whatsappNumber.trim());
  if (!whatsappNumber) {
    return {
      valid: false,
      message: "Masukkan nomor WhatsApp Indonesia yang valid, misalnya 081234567890.",
    };
  }

  const recoveryCode = input.recoveryCode.trim().toUpperCase();
  if (!recoveryCode) {
    return { valid: false, message: "Kode pemulihan wajib diisi." };
  }

  if (ticketCodePattern.test(recoveryCode)) {
    return {
      valid: false,
      message:
        "Itu kode tiket (EVT-XXXX), bukan kode pemulihan. Masukkan kode 32 karakter yang muncul setelah pendaftaran.",
    };
  }

  if (!recoveryCodePattern.test(recoveryCode)) {
    return {
      valid: false,
      message:
        "Kode pemulihan harus 32 karakter (huruf A–F dan angka 0–9). Kode itu ditampilkan sekali setelah pendaftaran.",
    };
  }

  return { valid: true, whatsappNumber, recoveryCode };
}
