import { createHmac } from "node:crypto";

export const QR_ROTATION_INTERVAL_SECONDS = 180;
export const QR_TOKEN_LENGTH = 10;
export const QR_MESSAGE_PREFIX = "PWK2026";

const crockfordAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const locationCodePattern = /^[A-Z0-9][A-Z0-9_-]{2,99}$/;

export type QrMode = "STATIC" | "DYNAMIC";

export function canonicalizeLocationCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

export function isValidLocationCode(value: string) {
  return locationCodePattern.test(value);
}

function encodeToken(buffer: Buffer) {
  let token = "";
  for (let index = 0; index < QR_TOKEN_LENGTH; index += 1) {
    const bitOffset = index * 5;
    const byteIndex = Math.floor(bitOffset / 8);
    const bitInByte = bitOffset % 8;
    const pair =
      (buffer[byteIndex] << 8) | (buffer[byteIndex + 1] ?? 0);
    const shift = 11 - bitInByte - 5;
    token += crockfordAlphabet[(pair >> shift) & 31];
  }
  return token;
}

function createToken(
  signingSecret: string,
  locationCode: string,
  step: number,
) {
  const hmac = createHmac("sha256", signingSecret);
  hmac.update(`${QR_MESSAGE_PREFIX}:${locationCode}:${step}`);
  return encodeToken(hmac.digest());
}

export function getDynamicQrToken(
  signingSecret: string,
  locationCode: string,
  timestampMs = Date.now(),
) {
  const intervalMs = QR_ROTATION_INTERVAL_SECONDS * 1000;
  const step = Math.floor(timestampMs / intervalMs);
  const secondsRemaining = Math.ceil(
    (intervalMs - (timestampMs % intervalMs)) / 1000,
  );
  const canonicalCode = canonicalizeLocationCode(locationCode);

  if (!signingSecret) {
    throw new Error("Secret penandatangan QR wajib tersedia.");
  }
  if (!isValidLocationCode(canonicalCode)) {
    throw new Error("Kode lokasi QR tidak valid.");
  }

  return {
    token: createToken(signingSecret, canonicalCode, step),
    step,
    secondsRemaining,
  };
}

export function buildDynamicQrPayload(
  signingSecret: string,
  locationCode: string,
  timestampMs = Date.now(),
) {
  const canonicalCode = canonicalizeLocationCode(locationCode);
  const { token } = getDynamicQrToken(
    signingSecret,
    canonicalCode,
    timestampMs,
  );
  return `${canonicalCode}.${token}`;
}

function normalizeScannedCode(value: string) {
  return value.trim().toUpperCase();
}

export function verifyDynamicQrCode(
  scannedCode: string,
  activeLocationCode: string,
  signingSecret: string,
  timestampMs = Date.now(),
) {
  if (!signingSecret) {
    return false;
  }

  const scanned = normalizeScannedCode(scannedCode);
  const base = canonicalizeLocationCode(activeLocationCode);
  if (!scanned || !isValidLocationCode(base)) {
    return false;
  }

  const intervalMs = QR_ROTATION_INTERVAL_SECONDS * 1000;
  const currentStep = Math.floor(timestampMs / intervalMs);
  const candidateSteps = [currentStep, currentStep - 1];

  for (const step of candidateSteps) {
    const token = createToken(signingSecret, base, step);
    if (scanned === `${base}.${token}` || scanned === token) {
      return true;
    }
  }

  return false;
}

export function verifyLocationCodeForMode(
  scannedCode: string,
  activeLocationCode: string,
  mode: QrMode,
  signingSecret: string | null,
  timestampMs = Date.now(),
) {
  const scanned = normalizeScannedCode(scannedCode);
  const base = canonicalizeLocationCode(activeLocationCode);
  if (!scanned || !isValidLocationCode(base)) {
    return false;
  }

  if (mode === "STATIC") {
    return scanned === base;
  }

  if (!signingSecret) {
    return false;
  }

  return verifyDynamicQrCode(scanned, base, signingSecret, timestampMs);
}
