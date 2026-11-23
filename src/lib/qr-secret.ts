import "server-only";

export function getQrSigningSecret() {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error(
      "QR_SIGNING_SECRET harus diatur dengan minimal 32 byte acak.",
    );
  }
  return secret;
}
