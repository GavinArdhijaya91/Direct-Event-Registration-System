import { createHmac } from "node:crypto";

/**
 * Durasi rotasi QR presensi: 3 menit (180 detik).
 * Memberi cukup waktu bagi peserta untuk scan dengan santai di aula,
 * sekaligus mencegah foto QR disebarkan ke peserta di luar lokasi.
 */
export const QR_ROTATION_INTERVAL_SECONDS = 180;

/**
 * Menghasilkan token dinamis berbasis waktu (3 menit) menggunakan HMAC-SHA256.
 * Bersifat stateless (tanpa query database).
 */
export function getDynamicQrToken(
  secretOrLocationCode: string,
  timestampMs = Date.now(),
): { token: string; step: number; secondsRemaining: number } {
  const intervalMs = QR_ROTATION_INTERVAL_SECONDS * 1000;
  const step = Math.floor(timestampMs / intervalMs);
  const secondsRemaining = Math.ceil(
    (intervalMs - (timestampMs % intervalMs)) / 1000,
  );

  const hmac = createHmac("sha256", secretOrLocationCode);
  hmac.update(`PWK2026-STEP-${step}`);
  // Ambil 6 karakter alphanumeric kapital yang mudah dibaca
  const token = hmac.digest("hex").slice(0, 6).toUpperCase();

  return { token, step, secondsRemaining };
}

/**
 * Membuat payload lengkap yang dikodekan ke dalam QR Code proyektor.
 * Format: KODE_LOKASI.TOKEN (contoh: PWK2026-B6-FBS.A3F9B2)
 */
export function buildDynamicQrPayload(
  baseLocationCode: string,
  timestampMs = Date.now(),
): string {
  const { token } = getDynamicQrToken(baseLocationCode, timestampMs);
  return `${baseLocationCode}.${token}`;
}

/**
 * Memvalidasi apakah kode presensi yang discan atau diketik peserta cocok.
 * Mendukung:
 * 1. Format Dinamis: KODE_LOKASI.TOKEN (dengan toleransi window sekarang dan 1 window sebelumnya/sesudahnya)
 * 2. Format Token Saja: TOKEN (jika peserta hanya mengetik 6 karakter token yang tampil di proyektor)
 * 3. Format Statis: KODE_LOKASI (jika dicetak di banner / mode manual)
 */
export function verifyLocationCode(
  scannedCode: string,
  activeLocationCode: string,
  timestampMs = Date.now(),
): boolean {
  const trimmed = scannedCode.trim().toUpperCase();
  const base = activeLocationCode.trim().toUpperCase();

  // 1. Cocok persis dengan kode lokasi statis
  if (trimmed === base) {
    return true;
  }

  const intervalMs = QR_ROTATION_INTERVAL_SECONDS * 1000;
  const currentStep = Math.floor(timestampMs / intervalMs);

  // Periksa jendela toleransi: step saat ini, 1 step sebelumnya (-1), dan 1 step sesudahnya (+1)
  // Menghindari kegagalan jika jam server/klien selisih sedikit atau sinyal HP lemot saat perpindahan
  const candidateSteps = [currentStep, currentStep - 1, currentStep + 1];

  for (const step of candidateSteps) {
    const hmac = createHmac("sha256", activeLocationCode);
    hmac.update(`PWK2026-STEP-${step}`);
    const token = hmac.digest("hex").slice(0, 6).toUpperCase();

    // Cek format lengkap: "BASE.TOKEN"
    if (trimmed === `${base}.${token}`) {
      return true;
    }

    // Cek format singkat jika peserta mengetik token 6-karakter saja
    if (trimmed === token) {
      return true;
    }
  }

  return false;
}
