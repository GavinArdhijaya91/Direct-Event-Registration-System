import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL atau DATABASE_URL harus diatur sebelum menjalankan seed.");
}

// For Supabase SSL certificate verification
// Currently using sslmode=disable for development due to certificate chain issues
// TODO: For production, change to sslmode=verify-full as per PRD
// See: https://pris.ly/d/driver-adapters for SSL configuration options
connectionString = connectionString.replace(/sslmode=[^&]*/, "sslmode=disable");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: connectionString,
  }),
});

async function main() {
  try {
    await prisma.eventSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        eventName: "Natal PWK 2026",
        eventDate: new Date("2027-01-28T00:00:00.000Z"),
        eventLocation: "Gedung B6, FBS UNNES",
        maxCapacity: 300,
        registrationOpen: true,
      },
      update: {
        eventName: "Natal PWK 2026",
        eventDate: new Date("2027-01-28T00:00:00.000Z"),
        eventLocation: "Gedung B6, FBS UNNES",
        maxCapacity: 300,
        registrationOpen: true,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
