import "server-only";

import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

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

  let poolConfig: ConstructorParameters<typeof Pool>[0];
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslrootcert");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    poolConfig = {
      connectionString: url.toString(),
      ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
    };
  } catch {
    poolConfig = { connectionString };
  }

  const pool = new Pool(poolConfig);
  const client = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  globalForPrisma.prisma = client;
  return client;
}
