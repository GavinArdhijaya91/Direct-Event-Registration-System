"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  describeAuditLog,
  type AdminAuditEntry,
} from "@/lib/admin-audit";
import AdminQrScanner from "@/app/admin/admin-qr-scanner";
import AdminWalkinModal from "@/app/admin/admin-walkin-modal";
import AdminVenueQrModal from "@/app/admin/admin-venue-qr-modal";

type Attendee = {
  ticketCode: string;
  fullName: string;
  whatsappNumber: string;
  category: string;
  institution: string;
  informationSource: string;
  status: "TERDAFTAR" | "HADIR";
  registeredAt: string;
  checkedInAt: string | null;
  checkinMethod: string | null;
};

type EventSettings = {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  maxCapacity: number;
  registeredCount: number;
  registrationOpen: boolean;
  locationCode: string | null;
  checkinOpensAt: string | null;
  checkinClosesAt: string | null;
};

type DashboardData = {
  settings: EventSettings;
  auditLogs: AdminAuditEntry[];
  bulkDeletionAllowed: boolean;
  stats: {
    totalRegistered: number;
    totalCheckedIn: number;
    capacityRemaining: number;
  };
  attendees: Attendee[];
};

type SettingsDraft = {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  maxCapacity: string;
  registrationOpen: boolean;
  locationCode: string;
  checkinOpensAt: string;
  checkinClosesAt: string;
  capacityOverrideReason: string;
};

function isDashboardData(value: unknown): value is DashboardData {
  return (
    typeof value === "object" &&
    value !== null &&
    "settings" in value &&
    "stats" in value &&
    "attendees" in value &&
    Array.isArray(value.attendees) &&
    "auditLogs" in value &&
    Array.isArray(value.auditLogs)
  );
}

function dateToWibInput(value: string | null) {
  if (!value) {
    return "";
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function wibInputToIso(value: string) {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("Format waktu check-in tidak valid.");
  }
  const [, year, month, day, hour, minute] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - 7,
      Number(minute),
    ),
  ).toISOString();
}

function formatWib(value: string | null) {
  if (!value) {
    return "—";
  }
  return `${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`;
}

const emptyDraft: SettingsDraft = {
  eventName: "",
  eventDate: "",
  eventLocation: "",
  maxCapacity: "",
  registrationOpen: false,
  locationCode: "",
  checkinOpensAt: "",
  checkinClosesAt: "",
  capacityOverrideReason: "",
};

export default function AdminPanel() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [draft, setDraft] = useState<SettingsDraft>(emptyDraft);
  const [auth, setAuth] = useState<"checking" | "anonymous" | "authenticated">(
    "checking",
  );
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [manualTicketCode, setManualTicketCode] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteTargetTicketCode, setDeleteTargetTicketCode] = useState<
    string | null
  >(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deletingTicketCode, setDeletingTicketCode] = useState<string | null>(
    null,
  );
  const [bulkDeleteReason, setBulkDeleteReason] = useState("");
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [showVenueQrModal, setShowVenueQrModal] = useState(false);
  const [checkingInTicketCode, setCheckingInTicketCode] = useState<string | null>(null);

  const refreshDashboard = useCallback(async (updateDraft = false) => {
    try {
      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });
      if (response.status === 401) {
        setAuth("anonymous");
        setDashboard(null);
        return;
      }

      const body: unknown = await response.json();
      if (!response.ok || !isDashboardData(body)) {
        setPageError("Dashboard tidak dapat dimuat. Coba muat ulang.");
        setAuth((current) =>
          current === "checking" ? "anonymous" : current,
        );
        return;
      }

      setDashboard(body);
      setAuth("authenticated");
      setPageError(null);
      if (updateDraft) {
        setDraft({
          eventName: body.settings.eventName,
          eventDate: body.settings.eventDate.slice(0, 10),
          eventLocation: body.settings.eventLocation,
          maxCapacity: String(body.settings.maxCapacity),
          registrationOpen: body.settings.registrationOpen,
          locationCode: body.settings.locationCode ?? "",
          checkinOpensAt: dateToWibInput(body.settings.checkinOpensAt),
          checkinClosesAt: dateToWibInput(body.settings.checkinClosesAt),
          capacityOverrideReason: "",
        });
      }
    } catch {
      setPageError("Koneksi ke dashboard gagal.");
      setAuth((current) => (current === "checking" ? "anonymous" : current));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshDashboard(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshDashboard]);

  useEffect(() => {
    if (auth !== "authenticated" || !autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        void refreshDashboard();
      }
    }, 20_000);
    const handleVisibility = () => {
      if (!document.hidden) {
        void refreshDashboard();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [auth, autoRefresh, refreshDashboard]);

  const visibleAttendees = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("id-ID");
    if (!needle) {
      return dashboard?.attendees ?? [];
    }
    return (dashboard?.attendees ?? []).filter((attendee) =>
      [
        attendee.ticketCode,
        attendee.fullName,
        attendee.whatsappNumber,
        attendee.institution,
      ].some((value) => value.toLocaleLowerCase("id-ID").includes(needle)),
    );
  }, [dashboard?.attendees, search]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setLoginError(body.message ?? "Login tidak berhasil.");
        return;
      }
      setPageError(null);
      setLoginPassword("");
      setAuth("authenticated");
      await refreshDashboard(true);
    } catch {
      setLoginError("Koneksi gagal. Coba login kembali.");
    }
  }

  async function logout() {
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) {
        setPageError("Logout tidak berhasil. Coba lagi.");
        return;
      }
      setDashboard(null);
      setAuth("anonymous");
      setNotice(null);
    } catch {
      setPageError("Koneksi gagal saat logout.");
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: draft.eventName,
          eventDate: draft.eventDate,
          eventLocation: draft.eventLocation,
          maxCapacity: Number(draft.maxCapacity),
          registrationOpen: draft.registrationOpen,
          locationCode: draft.locationCode || null,
          checkinOpensAt: wibInputToIso(draft.checkinOpensAt),
          checkinClosesAt: wibInputToIso(draft.checkinClosesAt),
          capacityOverrideReason: draft.capacityOverrideReason,
        }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setPageError(body.message ?? "Pengaturan tidak berhasil disimpan.");
        return;
      }
      setNotice("Pengaturan acara berhasil disimpan.");
      await refreshDashboard(true);
    } catch (caught) {
      setPageError(
        caught instanceof Error
          ? caught.message
          : "Koneksi gagal saat menyimpan pengaturan.",
      );
    }
  }

  async function performCheckin(ticketCode: string): Promise<boolean> {
    setPageError(null);
    setNotice(null);
    setCheckingInTicketCode(ticketCode);
    try {
      const response = await fetch("/api/admin/manual-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setPageError(body.message ?? "Check-in gagal.");
        return false;
      }
      setNotice(body.message ?? "Check-in berhasil dicatat.");
      setManualTicketCode("");
      await refreshDashboard();
      return true;
    } catch {
      setPageError("Koneksi gagal saat memproses check-in.");
      return false;
    } finally {
      setCheckingInTicketCode(null);
    }
  }

  async function manualCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualTicketCode.trim()) return;
    await performCheckin(manualTicketCode.trim());
  }

  async function deleteAttendee(ticketCode: string) {
    setPageError(null);
    setNotice(null);
    setDeletingTicketCode(ticketCode);
    try {
      const response = await fetch("/api/admin/delete-attendee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode, reason: deleteReason }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setPageError(body.message ?? "Data peserta tidak berhasil dihapus.");
        return;
      }
      setNotice(body.message ?? "Data peserta berhasil dihapus.");
      setDeleteTargetTicketCode(null);
      setDeleteReason("");
      await refreshDashboard();
    } catch {
      setPageError("Koneksi gagal saat menghapus data peserta.");
    } finally {
      setDeletingTicketCode(null);
    }
  }

  async function deleteAllAttendees(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError(null);
    setNotice(null);
    setBulkDeleting(true);
    try {
      const response = await fetch("/api/admin/delete-attendees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: bulkDeleteReason,
          confirmation: bulkDeleteConfirmation,
        }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setPageError(body.message ?? "Penghapusan massal tidak berhasil.");
        return;
      }
      setNotice(body.message ?? "Data peserta berhasil dihapus.");
      setBulkDeleteReason("");
      setBulkDeleteConfirmation("");
      await refreshDashboard();
    } catch {
      setPageError("Koneksi gagal saat menghapus data peserta.");
    } finally {
      setBulkDeleting(false);
    }
  }

  if (auth === "checking") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-5">
        <p aria-live="polite">Memeriksa sesi admin…</p>
      </main>
    );
  }

  if (auth === "anonymous") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
          Natal PWK 2026
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Masuk admin
        </h1>
        <p className="mt-3 leading-6 text-[var(--muted)]">
          Akses ini memakai kata sandi bersama panitia. Aktivitas tercatat,
          tetapi tidak dapat diatribusikan kepada orang tertentu.
        </p>
        {pageError ? (
          <div
            aria-live="assertive"
            className="mt-4 rounded-xl border border-[var(--red)] bg-[var(--rose)] px-4 py-3 text-sm text-[var(--red)]"
            role="alert"
          >
            {pageError}
          </div>
        ) : null}
        <form className="mt-7 space-y-4" onSubmit={login}>
          <label className="block text-sm font-semibold" htmlFor="admin-password">
            Kata sandi admin
          </label>
          <input
            autoComplete="current-password"
            autoFocus
            className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base"
            id="admin-password"
            onChange={(event) => setLoginPassword(event.target.value)}
            placeholder="Masukkan kata sandi panitia"
            required
            type="password"
            value={loginPassword}
          />
          {loginError ? (
            <div
              aria-live="assertive"
              className="flex items-start gap-2 rounded-xl border border-[var(--red)] bg-[var(--rose)] px-4 py-3 text-sm text-[var(--red)]"
              role="alert"
            >
              <span aria-hidden="true" className="mt-0.5 flex-shrink-0 text-base">⚠️</span>
              <span>{loginError}</span>
            </div>
          ) : null}
          <button
            className="min-h-12 w-full rounded-full bg-[var(--forest)] px-6 font-semibold text-white hover:bg-[var(--forest-deep)]"
            type="submit"
          >
            Masuk
          </button>
        </form>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
        <h1 className="text-2xl font-semibold">Dashboard belum tersedia</h1>
        <p className="mt-3 text-[var(--muted)]">
          {pageError ?? "Konfigurasi acara belum tersedia."}
        </p>
        <button
          className="mt-5 min-h-11 w-fit rounded-full bg-[var(--forest)] px-5 font-semibold text-white"
          onClick={() => void refreshDashboard(true)}
          type="button"
        >
          Coba lagi
        </button>
      </main>
    );
  }

  const overrideNeeded =
    Number(draft.maxCapacity) !== dashboard.settings.maxCapacity;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--forest)]">
            Operasional acara
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Dashboard admin
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="min-h-10 rounded-full bg-[var(--forest)] px-4 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[var(--forest-deep)] transition"
            onClick={() => setShowVenueQrModal(true)}
            type="button"
          >
            🖥️ Tampilkan QR Presensi (Proyektor)
          </button>
          <button
            className="min-h-10 rounded-full border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--cream)] hover:text-[var(--forest)]"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              void refreshDashboard();
            }}
            type="button"
          >
            {loading ? "Memuat…" : "Refresh"}
          </button>
          <button
            className="min-h-10 rounded-full border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--cream)] hover:text-[var(--red)]"
            onClick={() => void logout()}
            type="button"
          >
            Keluar
          </button>
        </div>
      </header>

      {pageError || notice ? (
        <p
          aria-live="polite"
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${
            pageError
              ? "bg-[var(--rose)] text-[var(--red)]"
              : "bg-[var(--moss)] text-[var(--forest-deep)]"
          }`}
          role={pageError ? "alert" : "status"}
        >
          {pageError ?? notice}
        </p>
      ) : null}

      <section
        aria-label="Statistik acara"
        className="mt-7 grid gap-3 sm:grid-cols-3"
      >
        {[
          ["Total terdaftar", String(dashboard.stats.totalRegistered)],
          ["Sudah hadir", String(dashboard.stats.totalCheckedIn)],
          [
            dashboard.stats.capacityRemaining < 0
              ? "Kelebihan kuota"
              : "Sisa kuota",
            String(Math.abs(dashboard.stats.capacityRemaining)),
          ],
        ].map(([label, value]) => (
          <article
            className="rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-5"
            key={label}
          >
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </section>

      <div className="mt-8 grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Pengaturan acara</h2>
          <form className="mt-5 space-y-4" onSubmit={saveSettings}>
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="event-name">
                Nama acara
              </label>
              <input
                className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                id="event-name"
                maxLength={120}
                onChange={(event) =>
                  setDraft({ ...draft, eventName: event.target.value })
                }
                required
                value={draft.eventName}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="event-date">
                Tanggal acara
              </label>
              <input
                className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                id="event-date"
                onChange={(event) =>
                  setDraft({ ...draft, eventDate: event.target.value })
                }
                required
                type="date"
                value={draft.eventDate}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="event-location">
                Lokasi acara
              </label>
              <input
                className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                id="event-location"
                maxLength={120}
                onChange={(event) =>
                  setDraft({ ...draft, eventLocation: event.target.value })
                }
                required
                value={draft.eventLocation}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="capacity">
                Kuota maksimal
              </label>
              <input
                className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                id="capacity"
                min={1}
                onChange={(event) =>
                  setDraft({ ...draft, maxCapacity: event.target.value })
                }
                required
                type="number"
                value={draft.maxCapacity}
              />
            </div>
            {overrideNeeded ? (
              <div>
                <label className="mb-1.5 block text-sm font-semibold" htmlFor="capacity-reason">
                  Alasan perubahan kuota (wajib)
                </label>
                <textarea
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2"
                  id="capacity-reason"
                  maxLength={500}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      capacityOverrideReason: event.target.value,
                    })
                  }
                  required
                  rows={2}
                  value={draft.capacityOverrideReason}
                />
              </div>
            ) : null}
            <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
              <input
                checked={draft.registrationOpen}
                onChange={(event) =>
                  setDraft({ ...draft, registrationOpen: event.target.checked })
                }
                type="checkbox"
              />
              Buka pendaftaran
            </label>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-semibold" htmlFor="location-code">
                  Kode QR lokasi aktif
                </label>
                {(draft.locationCode || dashboard.settings.locationCode) ? (
                  <button
                    type="button"
                    onClick={() => setShowVenueQrModal(true)}
                    className="text-xs font-semibold text-[var(--forest)] underline hover:text-[var(--forest-deep)]"
                  >
                    🖥️ Buka Layar Proyektor
                  </button>
                ) : null}
              </div>
              <input
                autoComplete="off"
                className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                id="location-code"
                maxLength={100}
                onChange={(event) =>
                  setDraft({ ...draft, locationCode: event.target.value })
                }
                value={draft.locationCode}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="checkin-opens">
                Check-in dibuka (WIB)
              </label>
              <input
                className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                id="checkin-opens"
                onChange={(event) =>
                  setDraft({ ...draft, checkinOpensAt: event.target.value })
                }
                type="datetime-local"
                value={draft.checkinOpensAt}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="checkin-closes">
                Check-in ditutup (WIB)
              </label>
              <input
                className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                id="checkin-closes"
                onChange={(event) =>
                  setDraft({ ...draft, checkinClosesAt: event.target.value })
                }
                type="datetime-local"
                value={draft.checkinClosesAt}
              />
            </div>
            <button className="min-h-11 w-full rounded-full bg-[var(--forest)] px-5 font-semibold text-white hover:bg-[var(--forest-deep)]">
              Simpan pengaturan
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <h3 className="font-semibold text-lg">Presensi & Penyelamat Hari-H</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Tayangkan 1 QR presensi untuk semua peserta (ala UNNES), atau gunakan scanner/tombol darurat jika peserta terkendala.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowVenueQrModal(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--forest)] px-4 text-xs sm:text-sm font-semibold text-white shadow hover:bg-[var(--forest-deep)] transition"
              >
                <span>🖥️</span>
                <span>Tampilkan QR Presensi (Layar Penuh / Proyektor)</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--cream)] transition"
                >
                  <span>📷</span>
                  <span>Scan Tiket Petugas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(true)}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--forest)] bg-white px-3 text-xs font-semibold text-[var(--forest)] shadow-sm hover:bg-[var(--moss)] transition"
                >
                  <span>🆘</span>
                  <span>Tamu OTS</span>
                </button>
              </div>
            </div>
            <form className="mt-3 flex gap-2" onSubmit={manualCheckin}>
              <input
                aria-label="Kode tiket untuk check-in manual"
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-white px-3 font-mono text-sm uppercase"
                maxLength={8}
                onChange={(event) => setManualTicketCode(event.target.value)}
                pattern="EVT-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}"
                placeholder="EVT-ABCD"
                required
                value={manualTicketCode}
              />
              <button className="min-h-11 rounded-full border border-[var(--forest)] px-4 text-sm font-semibold text-[var(--forest)] hover:bg-[var(--moss)]">
                Check-in
              </button>
            </form>
          </div>

          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <h3 className="font-semibold">Penghapusan massal</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Hanya tersedia 20 Februari–15 Maret 2027 WIB. Data peserta dan
              tiket akan dihapus; log aktivitas lama tetap disimpan. Penghapusan
              satu peserta tersedia pada daftar peserta kapan saja. Sesi admin
              bersama dapat menjalankan tindakan ini.
            </p>
            <form className="mt-3 space-y-3" onSubmit={deleteAllAttendees}>
              <label className="block text-sm font-semibold" htmlFor="bulk-delete-reason">
                Alasan penghapusan (wajib)
              </label>
              <textarea
                className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2"
                disabled={bulkDeleting}
                id="bulk-delete-reason"
                maxLength={500}
                onChange={(event) => setBulkDeleteReason(event.target.value)}
                required
                rows={2}
                value={bulkDeleteReason}
              />
              <label
                className="block text-sm font-semibold"
                htmlFor="bulk-delete-confirmation"
              >
                Ketik HAPUS SEMUA PESERTA untuk mengonfirmasi
              </label>
              <input
                autoComplete="off"
                className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3"
                disabled={bulkDeleting}
                id="bulk-delete-confirmation"
                onChange={(event) =>
                  setBulkDeleteConfirmation(event.target.value)
                }
                required
                value={bulkDeleteConfirmation}
              />
              <button
                className="min-h-11 w-full rounded-full border border-[var(--red)] px-5 font-semibold text-[var(--red)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  !dashboard.bulkDeletionAllowed ||
                  dashboard.attendees.length === 0 ||
                  !bulkDeleteReason.trim() ||
                  bulkDeleteConfirmation !== "HAPUS SEMUA PESERTA" ||
                  bulkDeleting ||
                  deletingTicketCode !== null
                }
                type="submit"
              >
                {bulkDeleting
                  ? "Menghapus data…"
                  : `Hapus semua ${dashboard.attendees.length} peserta`}
              </button>
              {!dashboard.bulkDeletionAllowed ? (
                <p className="text-xs text-[var(--muted)]">
                  Tombol akan aktif hanya pada jendela tanggal yang ditentukan.
                  Server tetap memvalidasi waktu saat permintaan diterima.
                </p>
              ) : null}
            </form>
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Peserta</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Snapshot diperbarui berkala; jam ditampilkan dalam WIB.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--forest)] bg-white px-3 text-xs font-semibold text-[var(--forest)] shadow-sm hover:bg-[var(--moss)] hover:text-[var(--forest-deep)] transition"
              >
                <span>📷</span>
                <span>Scan QR</span>
              </button>
              <button
                type="button"
                onClick={() => setShowWalkinModal(true)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--forest)] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[var(--forest-deep)] transition"
              >
                <span>🆘</span>
                <span>Tamu OTS</span>
              </button>
              <label className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--muted)]">
                <input
                  checked={autoRefresh}
                  onChange={(event) => setAutoRefresh(event.target.checked)}
                  type="checkbox"
                />
                Auto-refresh
              </label>
              <a
                className="inline-flex min-h-9 items-center rounded-full bg-[var(--forest)] px-3 text-xs font-semibold text-white hover:bg-[var(--forest-deep)] hover:text-white"
                href="/api/admin/export"
              >
                CSV
              </a>
            </div>
          </div>
          <label className="mt-5 block">
            <span className="sr-only">Cari peserta</span>
            <input
              className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-base"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, nomor WA, kode tiket, atau instansi"
              type="search"
              value={search}
            />
          </label>
          <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)] md:hidden">
            <span>👉 Geser tabel ke samping untuk data & aksi lengkap</span>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                  <th className="py-3 pr-3 font-semibold">Peserta</th>
                  <th className="py-3 pr-3 font-semibold">Kategori / Instansi</th>
                  <th className="py-3 pr-3 font-semibold">Terdaftar</th>
                  <th className="py-3 pr-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Check-in</th>
                  <th className="py-3 pl-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleAttendees.map((attendee) => (
                  <tr className="border-b border-[var(--line)] align-top" key={attendee.ticketCode}>
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{attendee.fullName}</p>
                      <p className="mt-1 font-mono text-xs">{attendee.ticketCode}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{attendee.whatsappNumber}</p>
                    </td>
                    <td className="py-3 pr-3">
                      {attendee.category.replaceAll("_", " ")}
                      <p className="mt-1 text-xs text-[var(--muted)]">{attendee.institution}</p>
                    </td>
                    <td className="py-3 pr-3">{formatWib(attendee.registeredAt)}</td>
                    <td className="py-3 pr-3">
                      {attendee.status === "HADIR" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--moss)] px-2.5 py-1 text-xs font-semibold text-[var(--forest-deep)]">
                          <span className="flex h-2 w-2 rounded-full bg-[var(--forest)]" />
                          Hadir
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={checkingInTicketCode === attendee.ticketCode}
                          onClick={() => void performCheckin(attendee.ticketCode)}
                          title={`Klik tombol bulat untuk absenkan hadir ${attendee.fullName}`}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--forest)] bg-white py-1 pl-1.5 pr-2.5 text-xs font-semibold text-[var(--forest)] shadow-sm hover:bg-[var(--forest)] hover:text-white active:scale-95 transition disabled:opacity-50"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--moss)] text-[9px] text-[var(--forest-deep)] font-bold group-hover:bg-white group-hover:text-[var(--forest)]">
                            {checkingInTicketCode === attendee.ticketCode ? "…" : "✓"}
                          </span>
                          <span>Absen</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3">
                      {formatWib(attendee.checkedInAt)}
                      {attendee.checkinMethod ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">{attendee.checkinMethod}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pl-3">
                      {deleteTargetTicketCode === attendee.ticketCode ? (
                        <form
                          className="min-w-44 space-y-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void deleteAttendee(attendee.ticketCode);
                          }}
                        >
                          <label
                            className="sr-only"
                            htmlFor={`delete-reason-${attendee.ticketCode}`}
                          >
                            Alasan menghapus {attendee.ticketCode}
                          </label>
                          <input
                            className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-xs"
                            id={`delete-reason-${attendee.ticketCode}`}
                            maxLength={500}
                            onChange={(event) =>
                              setDeleteReason(event.target.value)
                            }
                            placeholder="Alasan wajib"
                            required
                            value={deleteReason}
                          />
                          <button
                            className="min-h-9 rounded-full bg-[var(--red)] px-3 text-xs font-semibold text-white disabled:opacity-50"
                            disabled={
                              !deleteReason.trim() ||
                              deletingTicketCode !== null ||
                              bulkDeleting
                            }
                            type="submit"
                          >
                            {deletingTicketCode === attendee.ticketCode
                              ? "Menghapus…"
                              : "Konfirmasi hapus"}
                          </button>
                          <button
                            className="ml-2 min-h-9 px-2 text-xs underline"
                            onClick={() => {
                              setDeleteTargetTicketCode(null);
                              setDeleteReason("");
                            }}
                            type="button"
                          >
                            Batal
                          </button>
                        </form>
                      ) : (
                        <button
                          className="min-h-9 rounded-full border border-[var(--red)] px-3 text-xs font-semibold text-[var(--red)]"
                          disabled={
                            deletingTicketCode !== null || bulkDeleting
                          }
                          onClick={() => {
                            setDeleteTargetTicketCode(attendee.ticketCode);
                            setDeleteReason("");
                          }}
                          type="button"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {visibleAttendees.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-[var(--muted)]" colSpan={6}>
                      {search ? "Tidak ada peserta yang cocok." : "Belum ada peserta terdaftar."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <p className="mt-7 text-xs leading-5 text-[var(--muted)]">
        Admin menggunakan kata sandi bersama. Log mencatat tindakan, bukan
        identitas panitia; bagikan akses hanya kepada petugas yang ditunjuk.
      </p>

      <section
        aria-labelledby="audit-heading"
        className="mt-7 rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-5 sm:p-6"
      >
        <h2 className="text-xl font-semibold" id="audit-heading">
          Riwayat aktivitas admin
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          Menampilkan maksimal 50 tindakan terbaru dari akun bersama. Log
          menunjukkan perubahan, tetapi tidak dapat mengidentifikasi admin
          individual.
        </p>
        {dashboard.auditLogs.length > 0 ? (
          <ol className="mt-4 divide-y divide-[var(--line)]">
            {dashboard.auditLogs.map((log) => (
              <li className="py-3 first:pt-0 last:pb-0" key={log.id}>
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                  <span>{log.actor}</span>
                  <time dateTime={log.createdAt}>
                    {formatWib(log.createdAt)}
                  </time>
                </div>
                <p className="mt-1 break-words text-sm font-medium">
                  {describeAuditLog(log)}
                </p>
                {log.reason ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Alasan: {log.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Belum ada aktivitas admin yang tercatat.
          </p>
        )}
      </section>

      {showScanner ? (
        <AdminQrScanner
          onClose={() => setShowScanner(false)}
          onScan={async (scannedText) => {
            return await performCheckin(scannedText);
          }}
        />
      ) : null}

      {showWalkinModal ? (
        <AdminWalkinModal
          onClose={() => setShowWalkinModal(false)}
          onSuccess={async () => {
            setNotice("Peserta OTS berhasil didaftarkan dan diabsenkan HADIR.");
            await refreshDashboard();
          }}
        />
      ) : null}

      {showVenueQrModal ? (
        <AdminVenueQrModal
          eventName={draft.eventName || dashboard.settings.eventName || "Natal PWK 2026"}
          eventLocation={draft.eventLocation || dashboard.settings.eventLocation || "Gedung B6 FBS UNNES"}
          isOpen={showVenueQrModal}
          locationCode={draft.locationCode || dashboard.settings.locationCode || ""}
          onClose={() => setShowVenueQrModal(false)}
        />
      ) : null}
    </main>
  );
}
