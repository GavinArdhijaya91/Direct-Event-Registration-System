export type DatabaseSslOptions = {
  ca: string;
  rejectUnauthorized: true;
};

/**
 * Koneksi database harus memverifikasi sertifikat. Kalau CA tidak tersedia,
 * lebih baik gagal daripada diam-diam menerima sertifikat apa pun.
 */
export function databaseSslOptions(ca: string | undefined): DatabaseSslOptions {
  if (!ca || !ca.includes("-----BEGIN CERTIFICATE-----")) {
    throw new Error(
      "supabase-ca.crt tidak tersedia; verifikasi sertifikat database tidak boleh dimatikan.",
    );
  }

  return { ca, rejectUnauthorized: true };
}
