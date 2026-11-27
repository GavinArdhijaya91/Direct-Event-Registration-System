import assert from "node:assert/strict";
import test from "node:test";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { checkInWithTicketToken } from "@/lib/checkin";
import { registerAttendee } from "@/lib/register-attendee";
import type { RegistrationInput } from "@/lib/registration";
import { recoverTicket } from "@/lib/ticket-recovery";
import { hashCredential } from "@/lib/ticket-credentials";

const registrationInput: RegistrationInput = {
  fullName: "Peserta Uji",
  whatsappNumber: "6281234567890",
  birthPlace: "Semarang",
  birthDate: "2000-01-01",
  churchOrigin: "Gereja Uji",
  domicile: "Semarang",
  participantType: "UMUM",
  informationSource: "INSTAGRAM",
  category: "TAMU_UNDANGAN",
  institution: "Gereja Uji",
};

type FakeRegisterOptions = {
  existingWa?: boolean;
  reservationCount?: number;
  registrationOpen?: boolean;
  capacity?: number;
  createError?: unknown;
};

function fakeRegisterClient(options: FakeRegisterOptions = {}) {
  const created: Array<Record<string, unknown>> = [];
  const client = {
    attendee: {
      findUnique: async () => (options.existingWa ? { id: "a1" } : null),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (options.createError) {
          throw options.createError;
        }
        created.push(data);
        return { id: "a1" };
      },
    },
    eventSettings: {
      fields: { maxCapacity: options.capacity ?? 250 },
      updateMany: async () => ({ count: options.reservationCount ?? 1 }),
      findUnique: async () => ({
        registrationOpen: options.registrationOpen ?? true,
        registeredCount: 249,
        maxCapacity: options.capacity ?? 250,
      }),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(client),
  };

  return { client: client as unknown as PrismaClient, created };
}

test("pendaftaran menolak nomor WA yang sudah ada tanpa membuat peserta", async () => {
  const { client, created } = fakeRegisterClient({ existingWa: true });

  assert.deepEqual(await registerAttendee(registrationInput, client), {
    status: "duplicate",
  });
  assert.equal(created.length, 0);
});

test("pendaftaran ditolak saat kuota penuh", async () => {
  const { client, created } = fakeRegisterClient({ reservationCount: 0 });

  assert.deepEqual(await registerAttendee(registrationInput, client), {
    status: "full",
  });
  assert.equal(created.length, 0);
});

test("pendaftaran menyimpan hash token tiket dan kode pemulihan", async () => {
  const { client, created } = fakeRegisterClient();
  const result = await registerAttendee(registrationInput, client);

  assert.equal(result.status, "registered");
  if (result.status !== "registered") {
    return;
  }
  assert.equal(created.length, 1);
  assert.equal(created[0].ticketTokenHash, hashCredential(result.ticketToken));
  assert.equal(created[0].recoveryCodeHash, hashCredential(result.recoveryCode));
});

test("duplikat WA saat penyisipan konkurensi dibalas duplikat", async () => {
  const duplicateError = new Prisma.PrismaClientKnownRequestError("duplikat", {
    code: "P2002",
    meta: { target: ["whatsappNumber"] },
    clientVersion: "test",
  });
  const { client, created } = fakeRegisterClient({ createError: duplicateError });

  assert.deepEqual(await registerAttendee(registrationInput, client), {
    status: "duplicate",
  });
  assert.equal(created.length, 0);
});

type FakeCheckinOptions = {
  attendeeStatus?: "TERDAFTAR" | "HADIR";
  updateCount?: number;
};

function fakeCheckinClient(options: FakeCheckinOptions = {}) {
  let findCount = 0;
  const updates: unknown[] = [];
  const checkedInAt = new Date("2027-01-28T02:00:00.000Z");
  const attendee = {
    id: "a1",
    status: options.attendeeStatus ?? "TERDAFTAR",
    checkedInAt: options.attendeeStatus === "HADIR" ? checkedInAt : null,
  };
  const client = {
    eventSettings: {
      findUnique: async () => ({
        locationCode: "PWK2026-L4-FEB",
        qrMode: "STATIC" as const,
        checkinOpensAt: new Date("2027-01-28T00:00:00.000Z"),
        checkinClosesAt: new Date("2027-01-28T06:00:00.000Z"),
      }),
    },
    attendee: {
      findUnique: async () => {
        findCount += 1;
        if (findCount > 1 && options.updateCount === 0) {
          return { id: "a1", status: "HADIR", checkedInAt };
        }
        return attendee;
      },
      updateMany: async (args: unknown) => {
        updates.push(args);
        return { count: options.updateCount ?? 1 };
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(client),
  };

  return { client: client as unknown as PrismaClient, updates };
}

const checkinNow = new Date("2027-01-28T01:00:00.000Z");
const validLocationCode = "PWK2026-L4-FEB";

test("check-in berhasil dan hanya mengubah status sekali", async () => {
  const { client, updates } = fakeCheckinClient();
  const result = await checkInWithTicketToken(
    "token-uji",
    validLocationCode,
    checkinNow,
    client,
  );

  assert.equal(result.status, "checked-in");
  assert.equal(updates.length, 1);
});

test("peserta yang sudah hadir tidak diubah lagi", async () => {
  const { client, updates } = fakeCheckinClient({ attendeeStatus: "HADIR" });
  const result = await checkInWithTicketToken(
    "token-uji",
    validLocationCode,
    checkinNow,
    client,
  );

  assert.equal(result.status, "already-checked-in");
  assert.equal(updates.length, 0);
});

test("pembaruan konkurensi yang gagal tidak dilaporkan sebagai sukses", async () => {
  const { client, updates } = fakeCheckinClient({ updateCount: 0 });
  const result = await checkInWithTicketToken(
    "token-uji",
    validLocationCode,
    checkinNow,
    client,
  );

  assert.equal(result.status, "already-checked-in");
  assert.equal(updates.length, 1);
});

test("kode lokasi yang salah ditolak tanpa mengubah status", async () => {
  const { client, updates } = fakeCheckinClient();
  const result = await checkInWithTicketToken(
    "token-uji",
    "KODE-SALAH",
    checkinNow,
    client,
  );

  assert.equal(result.status, "invalid-location");
  assert.equal(updates.length, 0);
});

type RecoveryUpdate = {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
};

function fakeRecoveryClient() {
  const updates: RecoveryUpdate[] = [];
  const audits: Array<{ actor: string; action: string; details: unknown }> = [];
  const ticketTokenHash = hashCredential("token-lama");
  const recoveryCodeHash = hashCredential("kode-lama");
  const client = {
    attendee: {
      findUnique: async () => ({
        id: "a1",
        ticketCode: "EVT-TEST",
        ticketTokenHash,
        recoveryCodeHash,
      }),
      updateMany: async (args: RecoveryUpdate) => {
        updates.push(args);
        return { count: 1 };
      },
    },
    adminAuditLog: {
      create: async ({
        data,
      }: {
        data: { actor: string; action: string; details: unknown };
      }) => {
        audits.push(data);
        return { id: "audit-1" };
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(client),
  };

  return {
    client: client as unknown as PrismaClient,
    updates,
    audits,
    ticketTokenHash,
    recoveryCodeHash,
  };
}

test("pemulihan merotasi token tiket dan kode pemulihan", async () => {
  const { client, updates, audits, ticketTokenHash, recoveryCodeHash } =
    fakeRecoveryClient();
  const result = await recoverTicket("6281234567890", "kode-lama", client);

  assert.equal(result.recovered, true);
  if (!result.recovered) {
    return;
  }
  assert.equal(updates.length, 1);
  assert.equal(audits.length, 1);
  assert.equal(audits[0].action, "ticket-recovered");
  assert.equal(audits[0].actor, "peserta");
  assert.deepEqual(updates[0].where, {
    id: "a1",
    ticketTokenHash,
    recoveryCodeHash,
  });
  assert.equal(updates[0].data.ticketTokenHash, hashCredential(result.ticketToken));
  assert.equal(updates[0].data.recoveryCodeHash, hashCredential(result.recoveryCode));
  assert.notEqual(result.ticketToken, "token-lama");
});

test("kode pemulihan yang salah tidak merotasi kredensial", async () => {
  const { client, updates, audits } = fakeRecoveryClient();
  const result = await recoverTicket("6281234567890", "kode-salah", client);

  assert.equal(result.recovered, false);
  assert.equal(updates.length, 0);
  assert.equal(audits.length, 0);
});
