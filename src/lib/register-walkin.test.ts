import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  registerWalkinAttendee,
  type WalkinInput,
} from "@/lib/register-walkin";

const walkinInput: WalkinInput = {
  fullName: "Tamu OTS",
  whatsappNumber: "6281234567890",
  birthPlace: "Semarang",
  birthDate: "1950-01-01",
  churchOrigin: "Gereja Uji",
  domicile: "Semarang",
  participantType: "UMUM",
  category: "TAMU_UNDANGAN",
  institution: "Gereja Uji",
  reason: "Tamu datang langsung dan tidak membawa formulir.",
};

const inWindow = new Date("2027-01-28T01:00:00.000Z");

type FakeOptions = {
  existing?: {
    id: string;
    ticketCode: string;
    fullName: string;
    status: "TERDAFTAR" | "HADIR";
  } | null;
  opensAt?: Date | null;
  closesAt?: Date | null;
  registeredCount?: number;
  maxCapacity?: number;
};

function fakeWalkinClient(options: FakeOptions = {}) {
  const created: Array<Record<string, unknown>> = [];
  const audits: Array<Record<string, unknown>> = [];
  const updates: Array<Record<string, unknown>> = [];
  const settings = {
    id: 1,
    registeredCount: options.registeredCount ?? 250,
    maxCapacity: options.maxCapacity ?? 250,
    checkinOpensAt:
      options.opensAt === undefined
        ? new Date("2027-01-28T00:00:00.000Z")
        : options.opensAt,
    checkinClosesAt:
      options.closesAt === undefined
        ? new Date("2027-01-28T06:00:00.000Z")
        : options.closesAt,
  };

  const client = {
    eventSettings: {
      findUnique: async () => settings,
      update: async () => ({
        ...settings,
        registeredCount: settings.registeredCount + 1,
      }),
    },
    attendee: {
      findUnique: async () => options.existing ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { id: "a1" };
      },
      updateMany: async (args: Record<string, unknown>) => {
        updates.push(args);
        return { count: 1 };
      },
    },
    adminAuditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        audits.push(data);
        return { id: "audit-1" };
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(client),
  };

  return { client: client as unknown as PrismaClient, created, audits, updates };
}

test("OTS mendaftar dan langsung HADIR meski kuota penuh", async () => {
  const { client, created, audits } = fakeWalkinClient({
    registeredCount: 250,
    maxCapacity: 250,
  });

  const outcome = await registerWalkinAttendee(walkinInput, client, inWindow);

  assert.equal(outcome.status, "registered");
  assert.equal(created.length, 1);
  assert.equal(created[0].status, "HADIR");
  assert.equal(created[0].checkinMethod, "MANUAL_ADMIN");
  assert.equal(audits.length, 1);
  assert.equal(audits[0].action, "walkin-registration-override");
  assert.equal(audits[0].reason, walkinInput.reason);
  const details = audits[0].details as Record<string, unknown>;
  assert.equal(details.registeredCountBefore, 250);
  assert.equal(details.registeredCountAfter, 251);
});

test("OTS ditolak sebelum jendela check-in dibuka", async () => {
  const { client, created, audits } = fakeWalkinClient({
    opensAt: new Date("2027-01-28T02:00:00.000Z"),
  });

  const outcome = await registerWalkinAttendee(walkinInput, client, inWindow);

  assert.equal(outcome.status, "not-open");
  assert.equal(created.length, 0);
  assert.equal(audits.length, 0);
});

test("OTS ditolak setelah jendela check-in ditutup", async () => {
  const { client, created } = fakeWalkinClient({
    closesAt: new Date("2027-01-28T01:00:00.000Z"),
  });

  const outcome = await registerWalkinAttendee(
    walkinInput,
    client,
    new Date("2027-01-28T01:00:01.000Z"),
  );

  assert.equal(outcome.status, "outside-window");
  assert.equal(created.length, 0);
});

test("OTS ditolak bila jadwal check-in belum dikonfigurasi", async () => {
  const { client, created } = fakeWalkinClient({
    opensAt: null,
    closesAt: null,
  });

  const outcome = await registerWalkinAttendee(walkinInput, client, inWindow);

  assert.equal(outcome.status, "not-configured");
  assert.equal(created.length, 0);
});

test("check-in OTS untuk peserta yang sudah terdaftar ditolak di luar jendela", async () => {
  const { client, updates } = fakeWalkinClient({
    existing: {
      id: "a1",
      ticketCode: "EVT-TEST",
      fullName: "Tamu Sebelumnya",
      status: "TERDAFTAR",
    },
    closesAt: new Date("2027-01-28T01:00:00.000Z"),
  });

  const outcome = await registerWalkinAttendee(
    walkinInput,
    client,
    new Date("2027-01-28T01:00:01.000Z"),
  );

  assert.equal(outcome.status, "outside-window");
  assert.equal(updates.length, 0);
});
