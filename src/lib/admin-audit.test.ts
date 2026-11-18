import assert from "node:assert/strict";
import test from "node:test";
import { describeAuditLog } from "@/lib/admin-audit";

test("summarizes setting changes with before and after values", () => {
  assert.equal(
    describeAuditLog({
      id: "log-1",
      actor: "shared-admin",
      action: "settings-updated",
      reason: "Tambahan kursi",
      details: {
        before: { maxCapacity: 300, registrationOpen: false },
        after: { maxCapacity: 350, registrationOpen: true },
      },
      createdAt: "2026-11-15T00:00:00.000Z",
    }),
    "Kuota: 300 → 350 · Pendaftaran: Ditutup → Dibuka",
  );
});

test("summarizes manual check-ins without treating the ticket code as identity", () => {
  assert.equal(
    describeAuditLog({
      id: "log-2",
      actor: "shared-admin",
      action: "manual-checkin",
      reason: null,
      details: { ticketCode: "EVT-ABCD" },
      createdAt: "2026-11-15T00:00:00.000Z",
    }),
    "EVT-ABCD · check-in manual",
  );
});

test("summarizes individual and bulk participant deletions", () => {
  const baseLog = {
    id: "log-3",
    actor: "shared-admin",
    reason: "Permintaan penghapusan",
    createdAt: "2027-02-20T01:00:00.000Z",
  };
  assert.equal(
    describeAuditLog({
      ...baseLog,
      action: "attendee-deleted",
      details: { ticketCode: "EVT-ABCD" },
    }),
    "Peserta EVT-ABCD dihapus",
  );
  assert.equal(
    describeAuditLog({
      ...baseLog,
      action: "attendees-bulk-deleted",
      details: { deletedCount: 12 },
    }),
    "Penghapusan massal: 12 peserta",
  );
});

test("summarizes walk-in OTS registration override", () => {
  assert.equal(
    describeAuditLog({
      id: "log-4",
      actor: "shared-admin",
      action: "walkin-registration-override",
      reason: "Tamu kehormatan datang langsung",
      details: {
        ticketCode: "EVT-WALK",
        fullName: "Yohanes Silalahi",
        whatsappNumber: "081234567890",
      },
      createdAt: "2026-12-10T10:00:00.000Z",
    }),
    "Pendaftaran OTS: EVT-WALK · Yohanes Silalahi",
  );
});
