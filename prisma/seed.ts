import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("DIRECT_URL atau DATABASE_URL harus diatur sebelum menjalankan seed.");
}

const caPath = path.resolve(process.cwd(), "supabase-ca.crt");
const ca = fs.existsSync(caPath) ? fs.readFileSync(caPath, "utf-8") : undefined;

let poolConfig: ConstructorParameters<typeof Pool>[0];
try {
  const url = new URL(rawUrl);
  url.searchParams.delete("sslmode");
  poolConfig = {
    connectionString: url.toString(),
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
  };
} catch {
  poolConfig = { connectionString: rawUrl };
}

const pool = new Pool(poolConfig);
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  try {
    await prisma.eventSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        eventName: "Natal PWK 2026",
        eventDate: new Date("2027-01-28T00:00:00.000Z"),
        eventLocation: "L4, FEB UNNES",
        qrMode: "DYNAMIC",
        maxCapacity: 250,
        registrationOpen: true,
      },
      update: {
        eventName: "Natal PWK 2026",
        eventDate: new Date("2027-01-28T00:00:00.000Z"),
        eventLocation: "L4, FEB UNNES",
        qrMode: "DYNAMIC",
        maxCapacity: 250,
        registrationOpen: true,
      },
    });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
