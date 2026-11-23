"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminIcon, { type AdminIconName } from "@/app/admin/admin-icons";
import {
  AdminProvider,
  dateToWibInput,
  type AdminContextValue,
  type DashboardData,
  type SettingsDraft,
} from "@/app/admin/admin-context";
import AdminWalkinModal from "@/app/admin/admin-walkin-modal";
import AdminVenueQrModal from "@/app/admin/admin-venue-qr-modal";

const sectionTitles: Record<string, string> = {
  "/admin": "Ringkasan acara",
  "/admin/presensi": "Presensi & QR",
  "/admin/peserta": "Daftar peserta",
  "/admin/pengaturan": "Pengaturan acara",
  "/admin/riwayat": "Riwayat aktivitas",
};

const emptyDraft: SettingsDraft = {
  eventName: "",
  eventDate: "",
  eventLocation: "",
  maxCapacity: "",
  registrationOpen: false,
  locationCode: "",
  qrMode: "DYNAMIC",
  checkinOpensAt: "",
  checkinClosesAt: "",
  capacityOverrideReason: "",
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

export default function AdminPanel({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [draft, setDraft] = useState<SettingsDraft>(emptyDraft);
  const [auth, setAuth] = useState<"checking" | "anonymous" | "authenticated">(
    "checking",
  );
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [checkingInTicketCode, setCheckingInTicketCode] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [showVenueQrModal, setShowVenueQrModal] = useState(false);

  const refresh = useCallback(async (updateDraft = false) => {
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
        setAuth((current) => (current === "checking" ? "anonymous" : current));
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
          qrMode: body.settings.qrMode,
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
      void refresh(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (auth !== "authenticated" || !autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        void refresh();
      }
    }, 20_000);
    const handleVisibility = () => {
      if (!document.hidden) {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [auth, autoRefresh, refresh]);

  function toggleSidebar() {
    if (window.matchMedia("(max-width: 1100px)").matches) {
      setSidebarOpen((open) => !open);
      return;
    }
    setSidebarCollapsed((collapsed) => !collapsed);
  }

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
      await refresh(true);
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
      await refresh();
      return true;
    } catch {
      setPageError("Koneksi gagal saat memproses check-in.");
      return false;
    } finally {
      setCheckingInTicketCode(null);
    }
  }

  if (auth === "checking") {
    return (
      <main className="admin-loading" aria-live="polite">
        <span className="admin-spinner" aria-hidden="true" />
        <p>Memeriksa sesi admin…</p>
      </main>
    );
  }

  if (auth === "anonymous") {
    return (
      <main className="admin-auth">
        <div className="admin-auth-card">
          <div className="admin-auth-art">
            <div>
              <Image alt="" height={56} src="/images/logos/logo-natal-pwk-2026.png" width={56} />
            </div>
            <div>
              <p className="admin-kicker" style={{ color: "#c2a863" }}>
                Panel Pengelola Acara
              </p>
              <h1>Masuk ke dashboard Natal PWK 2026</h1>
              <p>
                Pantau pendaftaran dan kehadiran peserta, siapkan QR presensi,
                serta kelola data panitia dari satu tempat.
              </p>
            </div>
            <p className="admin-auth-art-foot">Damai dan sukacita · 2026</p>
          </div>
          <div className="admin-auth-panel">
            <h2>Masuk admin</h2>
            <p>
              Gunakan kata sandi bersama panitia. Aktivitas tercatat, tetapi
              tidak dapat diatribusikan kepada orang tertentu.
            </p>
            {pageError ? (
              <div
                aria-live="assertive"
                className="admin-notice admin-notice--error"
                role="alert"
                style={{ marginTop: "1rem", marginBottom: 0 }}
              >
                <AdminIcon name="alert" />
                <span>{pageError}</span>
              </div>
            ) : null}
            <form className="admin-form-grid" onSubmit={login}>
              <div className="admin-field">
                <label className="admin-label" htmlFor="admin-password">
                  Kata sandi admin
                </label>
                <input
                  autoComplete="current-password"
                  autoFocus
                  className="admin-input"
                  id="admin-password"
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Masukkan kata sandi panitia"
                  required
                  type="password"
                  value={loginPassword}
                />
                {loginError ? (
                  <p
                    aria-live="assertive"
                    className="admin-notice admin-notice--error"
                    role="alert"
                    style={{ margin: 0 }}
                  >
                    <AdminIcon name="alert" />
                    <span>{loginError}</span>
                  </p>
                ) : null}
              </div>
              <button className="admin-btn admin-btn-primary" type="submit">
                Masuk ke panel
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="admin-auth">
        <div className="admin-auth-card">
          <div className="admin-auth-panel" style={{ gridColumn: "1 / -1" }}>
            <h2>Dashboard belum tersedia</h2>
            <p>{pageError ?? "Konfigurasi acara belum tersedia."}</p>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => void refresh(true)}
              style={{ marginTop: "1.25rem" }}
              type="button"
            >
              <AdminIcon name="refresh" /> Coba lagi
            </button>
          </div>
        </div>
      </main>
    );
  }

  const navItems: { href: string; label: string; icon: AdminIconName; count?: number }[] = [
    { href: "/admin", label: "Ringkasan", icon: "grid" },
    { href: "/admin/presensi", label: "Presensi & QR", icon: "monitor" },
    {
      href: "/admin/peserta",
      label: "Daftar peserta",
      icon: "users",
      count: dashboard.stats.totalRegistered,
    },
    { href: "/admin/pengaturan", label: "Pengaturan", icon: "settings" },
    { href: "/admin/riwayat", label: "Riwayat admin", icon: "history" },
  ];

  const contextValue: AdminContextValue = {
    dashboard,
    draft,
    setDraft,
    refresh,
    loading,
    pageError,
    setPageError,
    notice,
    setNotice,
    performCheckin,
    checkingInTicketCode,
    openVenueQr: () => setShowVenueQrModal(true),
    openWalkin: () => setShowWalkinModal(true),
  };

  return (
    <AdminProvider value={contextValue}>
      <main className={`admin-shell${sidebarCollapsed ? " is-collapsed" : ""}`}>
        <aside aria-label="Navigasi panel admin" className={`admin-sidebar${sidebarOpen ? " is-open" : ""}`}>
          <div className="admin-brand">
            <Image alt="" height={42} src="/images/logos/logo-natal-pwk-2026.png" width={42} />
            <span>
              <span className="admin-brand-name">Natal PWK 2026</span>
              <span className="admin-brand-sub">Panel administrasi</span>
            </span>
          </div>
          <nav className="admin-nav" aria-label="Bagian panel">
            <p className="admin-nav-label">Operasional</p>
            {navItems.slice(0, 3).map((item) => (
              <Link
                aria-current={pathname === item.href ? "page" : undefined}
                className={`admin-nav-link${pathname === item.href ? " is-active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setSidebarOpen(false)}
                title={item.label}
              >
                <AdminIcon name={item.icon} />
                <span>{item.label}</span>
                {item.count !== undefined ? <span className="admin-nav-count">{item.count}</span> : null}
              </Link>
            ))}
            <p className="admin-nav-label">Pengelolaan</p>
            {navItems.slice(3).map((item) => (
              <Link
                aria-current={pathname === item.href ? "page" : undefined}
                className={`admin-nav-link${pathname === item.href ? " is-active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setSidebarOpen(false)}
                title={item.label}
              >
                <AdminIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="admin-sidebar-foot">
            <p>
              Akses bersama <strong>shared-admin</strong>. Setiap tindakan
              tercatat, tetapi tidak dapat diatribusikan per orang.
            </p>
            <Link className="admin-sidebar-home" href="/">
              <AdminIcon name="grid" /> Lihat situs utama
            </Link>
          </div>
        </aside>
        {sidebarOpen ? (
          <button
            aria-label="Tutup navigasi"
            className="admin-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
        ) : null}

        <div className="admin-workspace">
          <header className="admin-topbar">
            <button
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
              className="admin-icon-btn admin-menu-btn"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
              type="button"
            >
              <AdminIcon name="menu" />
            </button>
            <div className="admin-topbar-main">
              <span className="admin-crumb">Natal PWK 2026 / Panel admin</span>
              <strong className="admin-topbar-title">
                {sectionTitles[pathname] ?? "Dashboard admin"}
              </strong>
            </div>
            <div className="admin-topbar-actions">
              <span className="admin-event-chip">
                <AdminIcon name="calendar" />
                {dashboard.settings.eventName} ·{" "}
                {dashboard.settings.registrationOpen
                  ? "Pendaftaran dibuka"
                  : "Pendaftaran ditutup"}
              </span>
              <label className="admin-check admin-topbar-refresh">
                <input
                  checked={autoRefresh}
                  onChange={(event) => setAutoRefresh(event.target.checked)}
                  type="checkbox"
                />
                Auto-refresh
              </label>
              <button
                aria-label="Muat ulang data dashboard"
                className="admin-icon-btn"
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  void refresh();
                }}
                title="Muat ulang data dashboard"
                type="button"
              >
                <AdminIcon name="refresh" />
              </button>
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => void logout()}
                type="button"
              >
                <AdminIcon name="logout" /> Keluar
              </button>
            </div>
          </header>

          <div className="admin-content">
            {pageError || notice ? (
              <div
                aria-live="polite"
                className={`admin-notice ${pageError ? "admin-notice--error" : "admin-notice--success"}`}
                role={pageError ? "alert" : "status"}
              >
                <AdminIcon name={pageError ? "alert" : "checkCircle"} />
                <span>{pageError ?? notice}</span>
              </div>
            ) : null}

            {children}

            <p className="admin-footnote">
              Admin menggunakan kata sandi bersama. Bagikan akses hanya kepada
              petugas yang ditunjuk; setiap tindakan tercatat atas nama
              shared-admin.
            </p>
          </div>
        </div>

        {showWalkinModal ? (
          <AdminWalkinModal
            onClose={() => setShowWalkinModal(false)}
            onSuccess={async () => {
              setNotice("Peserta OTS berhasil didaftarkan dan diabsenkan HADIR.");
              await refresh();
            }}
          />
        ) : null}

        {showVenueQrModal ? (
          <AdminVenueQrModal
            eventName={draft.eventName || dashboard.settings.eventName || "Natal PWK 2026"}
            eventLocation={draft.eventLocation || dashboard.settings.eventLocation || "Gedung B6 FBS UNNES"}
            isOpen={showVenueQrModal}
            onClose={() => setShowVenueQrModal(false)}
          />
        ) : null}
      </main>
    </AdminProvider>
  );
}
