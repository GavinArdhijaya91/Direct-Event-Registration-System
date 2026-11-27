import "server-only";

import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseSslOptions } from "@/lib/db-ssl";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL harus diatur sebelum mengakses database.");
  }

  const caPath = path.resolve(process.cwd(), "supabase-ca.crt");
  const ca = fs.existsSync(caPath) ? fs.readFileSync(caPath, "utf-8") : undefined;

  const ssl = databaseSslOptions(ca);

  let poolConfig: ConstructorParameters<typeof Pool>[0];
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslrootcert");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    poolConfig = {
      connectionString: url.toString(),
      ssl,
    };
  } catch {
    throw new Error("DATABASE_URL tidak valid; koneksi database aman tidak dapat disiapkan.");
  }

  // Supabase menyarankan pool aplikasi = 1 koneksi per instance serverless.
  // Default `pg` adalah 10, yang dapat menguras backend pooler saat lonjakan check-in.
  const pool = new Pool({
    ...poolConfig,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  const client = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  globalForPrisma.prisma = client;
  return client;
}
