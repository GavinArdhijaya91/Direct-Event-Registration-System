export type AdminAuditEntry = {
  id: string;
  actor: string;
  action: string;
  reason: string | null;
  details: unknown;
  createdAt: string;
};

function formatWib(value: string) {
  return `${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`;
}

function formatAuditValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (key === "registrationOpen" && typeof value === "boolean") {
    return value ? "Dibuka" : "Ditutup";
  }
  if (key === "eventDate" && typeof value === "string") {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeZone: "Asia/Jakarta",
    }).format(new Date(value));
  }
  if (
    (key === "checkinOpensAt" || key === "checkinClosesAt") &&
    typeof value === "string"
  ) {
    return formatWib(value);
  }
  return String(value);
}

export function describeAuditLog(log: AdminAuditEntry) {
  if (typeof log.details !== "object" || log.details === null) {
    return log.action;
  }

  const details = log.details as Record<string, unknown>;
  if (log.action === "settings-updated") {
    const before =
      typeof details.before === "object" && details.before !== null
        ? (details.before as Record<string, unknown>)
        : {};
    const after =
      typeof details.after === "object" && details.after !== null
        ? (details.after as Record<string, unknown>)
        : {};
    const labels: Record<string, string> = {
      eventName: "Nama acara",
      eventDate: "Tanggal acara",
      eventLocation: "Lokasi",
      maxCapacity: "Kuota",
      registrationOpen: "Pendaftaran",
      locationCode: "Kode lokasi",
      checkinOpensAt: "Check-in dibuka",
      checkinClosesAt: "Check-in ditutup",
    };
    const changes = Object.keys(labels)
      .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
      .map(
        (key) =>
          `${labels[key]}: ${formatAuditValue(key, before[key])} → ${formatAuditValue(key, after[key])}`,
      );
    return changes.length > 0 ? changes.join(" · ") : "Pengaturan disimpan";
  }
  if (
    (log.action === "manual-checkin" ||
      log.action === "manual-checkin-already-present") &&
    typeof details.ticketCode === "string"
  ) {
    return `${details.ticketCode} · ${
      log.action === "manual-checkin"
        ? "check-in manual"
        : "sudah hadir saat diperiksa"
    }`;
  }
  if (
    log.action === "walkin-registration-override" &&
    typeof details.ticketCode === "string"
  ) {
    const nameStr = typeof details.fullName === "string" ? ` · ${details.fullName}` : "";
    return `Pendaftaran OTS: ${details.ticketCode}${nameStr}`;
  }
  if (
    log.action === "attendee-deleted" &&
    typeof details.ticketCode === "string"
  ) {
    return `Peserta ${details.ticketCode} dihapus`;
  }
  if (
    log.action === "attendees-bulk-deleted" &&
    typeof details.deletedCount === "number"
  ) {
    return `Penghapusan massal: ${details.deletedCount} peserta`;
  }
  if (
    log.action === "attendees-bulk-deleted" &&
    typeof details.deletedCount !== "number"
  ) {
    return "Penghapusan massal peserta";
  }
  return log.action;
}
