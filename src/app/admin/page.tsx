"use client";

import Link from "next/link";
import AdminIcon, { type AdminIconName } from "@/app/admin/admin-icons";
import { useAdmin } from "@/app/admin/admin-context";

export default function AdminOverviewPage() {
  const { dashboard } = useAdmin();
  const totalRegistered = dashboard.stats.totalRegistered;
  const hadirCount = dashboard.stats.totalCheckedIn;
  const belumCount = Math.max(totalRegistered - hadirCount, 0);
  const overCapacity = dashboard.stats.capacityRemaining < 0;

  const stats: {
    label: string;
    value: string;
    foot: string;
    icon: AdminIconName;
    tone: string;
  }[] = [
    {
      label: "Total terdaftar",
      value: String(totalRegistered),
      foot: `Kuota maksimal ${dashboard.settings.maxCapacity}`,
      icon: "users",
      tone: "admin-stat--green",
    },
    {
      label: "Sudah hadir",
      value: String(hadirCount),
      foot: "Check-in tercatat di server",
      icon: "checkCircle",
      tone: "admin-stat--mint",
    },
    {
      label: "Belum hadir",
      value: String(belumCount),
      foot: "Belum tercatat check-in",
      icon: "clock",
      tone: "admin-stat--gold",
    },
    {
      label: overCapacity ? "Kelebihan kuota" : "Sisa kuota",
      value: String(Math.abs(dashboard.stats.capacityRemaining)),
      foot: overCapacity ? "Perlu tinjauan panitia" : "Masih dapat menerima pendaftar",
      icon: "ticket",
      tone: overCapacity ? "admin-stat--red" : "admin-stat--green",
    },
  ];

  return (
    <section aria-labelledby="ringkasan-heading" className="admin-section">
      <div className="admin-section-head">
        <div>
          <p className="admin-kicker">Snapshot berkala</p>
          <h1 className="admin-section-title" id="ringkasan-heading">
            Ringkasan acara
          </h1>
          <p className="admin-section-note">
            Lihat kondisi pendaftaran dan kehadiran terkini. Lanjut ke presensi
            untuk menyiapkan QR, atau ke daftar peserta untuk mencari orang.
            Angka diperbarui berkala, bukan waktu nyata.
          </p>
        </div>
      </div>
      <div className="admin-stat-grid">
        {stats.map((stat) => (
          <article className={`admin-stat ${stat.tone}`} key={stat.label}>
            <span className="admin-stat-icon">
              <AdminIcon name={stat.icon} />
            </span>
            <p className="admin-stat-label">{stat.label}</p>
            <p className="admin-stat-value">{stat.value}</p>
            <p className="admin-stat-foot">{stat.foot}</p>
          </article>
        ))}
      </div>
      <div className="admin-card" style={{ marginTop: "1rem" }}>
        <div className="admin-card-body admin-overview-actions">
          <Link className="admin-btn admin-btn-primary" href="/admin/presensi">
            <AdminIcon name="monitor" /> Buka presensi & QR
          </Link>
          <Link className="admin-btn admin-btn-ghost" href="/admin/peserta">
            <AdminIcon name="users" /> Lihat daftar peserta
          </Link>
        </div>
      </div>
    </section>
  );
}
