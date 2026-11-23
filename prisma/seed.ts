import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL atau DATABASE_URL harus diatur sebelum menjalankan seed.");
}

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
        qrMode: "DYNAMIC",
        maxCapacity: 300,
        registrationOpen: true,
      },
      update: {
        eventName: "Natal PWK 2026",
        eventDate: new Date("2027-01-28T00:00:00.000Z"),
        eventLocation: "Gedung B6, FBS UNNES",
        qrMode: "DYNAMIC",
        maxCapacity: 300,
        registrationOpen: true,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
