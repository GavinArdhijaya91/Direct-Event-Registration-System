"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import AdminIcon from "@/app/admin/admin-icons";
import { formatWib, useAdmin } from "@/app/admin/admin-context";

function getMethodBadge(method: string | null) {
  if (method === "SCAN_QR_VENUE") {
    return {
      label: "Scan QR Venue",
      bg: "#ecfdf5",
      color: "#065f46",
      border: "#a7f3d0",
    };
  }
  if (method === "MANUAL" || method === "MANUAL_ADMIN") {
    return {
      label: "Manual Panitia",
      bg: "#fef3c7",
      color: "#92400e",
      border: "#fde68a",
    };
  }
  if (method === "WALK_IN") {
    return {
      label: "Tamu Walk-in OTS",
      bg: "#eff6ff",
      color: "#1e40af",
      border: "#bfdbfe",
    };
  }
  return {
    label: method ? method.replaceAll("_", " ") : "Presensi Mandiri",
    bg: "#f4f4f5",
    color: "#3f3f46",
    border: "#e4e4e7",
  };
}

export default function AdminPresensiPage() {
  const {
    dashboard,
    openVenueQr,
    openWalkin,
    performCheckin,
    checkingInTicketCode,
  } = useAdmin();
  const [ticketCode, setTicketCode] = useState("");

  const totalRegistered = dashboard.stats.totalRegistered;
  const hadirCount = dashboard.stats.totalCheckedIn;
  const belumCount = Math.max(totalRegistered - hadirCount, 0);
  const persentaseHadir =
    totalRegistered > 0 ? ((hadirCount / totalRegistered) * 100).toFixed(1) : "0";

  // Urutkan peserta yang HADIR dari yang paling baru check-in
  const hadirAttendees = useMemo(() => {
    return dashboard.attendees
      .filter((a) => a.status === "HADIR")
      .sort((a, b) => (b.checkedInAt || "").localeCompare(a.checkedInAt || ""));
  }, [dashboard.attendees]);

  // Cukup tampilkan 10 aktivitas terbaru agar tetap fokus sebagai live feed operasional
  const recentAttendees = useMemo(() => {
    return hadirAttendees.slice(0, 10);
  }, [hadirAttendees]);

  async function submitManualCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticketCode.trim()) return;
    const accepted = await performCheckin(ticketCode.trim());
    if (accepted) setTicketCode("");
  }

  return (
    <section aria-labelledby="presensi-heading" className="admin-section">
      <div className="admin-section-head">
        <div>
          <p className="admin-kicker">Stasiun Operasional Hari-H</p>
          <h1 className="admin-section-title" id="presensi-heading">
            Presensi & QR
          </h1>
          <p className="admin-section-note">
            Konsol kerja panitia untuk proyektor aula, input walk-in, dan pemantauan aktivitas kehadiran terkini.
          </p>
        </div>
        <div>
          <a
            className="admin-btn admin-btn-ghost admin-btn-sm"
            href="/api/admin/export?type=presensi&format=xlsx"
            download
            title="Unduh rekapitulasi kehadiran peserta hari-H dalam format Excel (.xlsx)"
          >
            <AdminIcon name="download" /> Unduh Rekap Kehadiran (.xlsx)
          </a>
        </div>
      </div>

      <div className="admin-info">
        <AdminIcon name="info" />
        <div>
          <p style={{ margin: "0 0 0.25rem" }}>
            <strong>Alur Presensi di Tempat</strong>
          </p>
          <ol className="admin-guide">
            <li>
              Buka halaman QR presensi di <strong>laptop</strong> atau{" "}
              <strong>HP panitia registrasi</strong>, lalu tayangkan ke{" "}
              <strong>proyektor aula</strong> atau tunjukkan langsung ke peserta.
            </li>
            <li>Peserta memindai QR langsung dari halaman tiket digital mereka di ponsel.</li>
            <li>Aktivitas scan yang berhasil akan langsung muncul pada log terkini di bawah.</li>
          </ol>
        </div>
      </div>

      {/* Ringkasan Cepat Kehadiran Hari-H */}
      <div className="admin-stat-grid admin-stat-grid--3" style={{ marginTop: "1rem" }}>
        <div className="admin-stat admin-stat--mint">
          <div className="admin-stat-icon">
            <AdminIcon name="checkCircle" />
          </div>
          <p className="admin-stat-label">Hadir Hari-H</p>
          <p className="admin-stat-value">{hadirCount}</p>
          <p className="admin-stat-foot">{persentaseHadir}% dari total terdaftar</p>
        </div>
        <div className="admin-stat admin-stat--gold">
          <div className="admin-stat-icon">
            <AdminIcon name="clock" />
          </div>
          <p className="admin-stat-label">Belum Hadir</p>
          <p className="admin-stat-value">{belumCount}</p>
          <p className="admin-stat-foot">Menunggu kedatangan di venue</p>
        </div>
        <div className="admin-stat admin-stat--green">
          <div className="admin-stat-icon">
            <AdminIcon name="users" />
          </div>
          <p className="admin-stat-label">Total Terdaftar</p>
          <p className="admin-stat-value">{totalRegistered}</p>
          <p className="admin-stat-foot">Kapasitas tercatat</p>
        </div>
      </div>

      {/* Aksi Operasional Presensi */}
      <div className="admin-card" style={{ marginTop: "1rem" }}>
        <div className="admin-card-head">
          <div>
            <h2 className="admin-card-title">Aksi Presensi Cepat</h2>
            <p className="admin-card-sub">
              Tayangkan QR proyektor atau daftarkan tamu yang langsung hadir di tempat.
            </p>
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-quick-grid">
            <button
              className="admin-quick admin-quick--primary"
              onClick={openVenueQr}
              type="button"
            >
              <span className="admin-quick-icon">
                <AdminIcon name="monitor" />
              </span>
              <span>
                <span className="admin-quick-label">Tampilkan QR presensi</span>
                <span className="admin-quick-hint">
                  Buka layar penuh untuk proyektor aula
                </span>
              </span>
            </button>
            <button className="admin-quick" onClick={openWalkin} type="button">
              <span className="admin-quick-icon">
                <AdminIcon name="userPlus" />
              </span>
              <span>
                <span className="admin-quick-label">Tamu OTS / walk-in</span>
                <span className="admin-quick-hint">
                  Daftarkan tamu yang datang langsung
                </span>
              </span>
            </button>
          </div>

          <p className="admin-label" style={{ margin: "1.25rem 0 0.5rem" }}>
            Kalau peserta tidak bisa memindai (Check-in Manual)
          </p>
          <form
            className="admin-inline-form"
            onSubmit={submitManualCheckin}
            style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}
          >
            <label className="admin-label sr-only" htmlFor="manual-ticket">
              Kode tiket untuk check-in manual
            </label>
            <input
              aria-label="Kode tiket untuk check-in manual"
              className="admin-input admin-mono"
              id="manual-ticket"
              maxLength={8}
              onChange={(event) => setTicketCode(event.target.value)}
              pattern="EVT-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}"
              placeholder="EVT-ABCD"
              required
              style={{ textTransform: "uppercase" }}
              value={ticketCode}
            />
            <button
              className="admin-btn admin-btn-primary"
              disabled={checkingInTicketCode !== null}
              type="submit"
            >
              <AdminIcon name="check" />
              {checkingInTicketCode ? "Memproses…" : "Check-in manual"}
            </button>
          </form>
          <p className="admin-help" style={{ marginTop: "0.5rem" }}>
            Masukkan kode tiket EVT-XXXX milik peserta jika kamera HP bermasalah. Status check-in akan langsung tercatat server.
          </p>
        </div>
      </div>

      {/* Live Feed: Aktivitas Presensi Terkini */}
      <div className="admin-card" style={{ marginTop: "1rem" }}>
        <div className="admin-card-head" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: hadirAttendees.length > 0 ? "#10b981" : "#9ca3af",
                  boxShadow: hadirAttendees.length > 0 ? "0 0 0 3px rgba(16, 185, 129, 0.2)" : "none",
                }}
                aria-hidden="true"
              />
              <h2 className="admin-card-title">
                Aktivitas Presensi Terkini
              </h2>
            </div>
            <p className="admin-card-sub">
              Log 10 peserta terakhir yang baru saja presensi masuk (diperbarui otomatis).
            </p>
          </div>
          <div>
            <Link
              className="admin-btn admin-btn-ghost admin-btn-sm"
              href="/admin/peserta"
              title="Buka menu Daftar Peserta untuk pencarian dan pengelolaan data lengkap"
            >
              <AdminIcon name="users" /> Lihat Semua di Daftar Peserta ({hadirAttendees.length}) →
            </Link>
          </div>
        </div>

        <div className="admin-card-body">
          {recentAttendees.length === 0 ? (
            <div className="admin-empty" style={{ padding: "2.5rem 1rem" }}>
              <AdminIcon name="checkCircle" />
              <strong>Belum ada presensi tercatat hari ini</strong>
              <p>
                Tayangkan QR presensi di proyektor aula atau lakukan check-in manual. Begitu ada peserta yang presensi, aktivitas masuk akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Peserta</th>
                      <th scope="col">Kategori & Instansi</th>
                      <th scope="col">Waktu Presensi</th>
                      <th scope="col">Metode Masuk</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendees.map((attendee) => {
                      const badge = getMethodBadge(attendee.checkinMethod);
                      return (
                        <tr key={attendee.ticketCode}>
                          <td>
                            <div className="admin-person">
                              <span aria-hidden="true" className="admin-avatar">
                                {attendee.fullName.trim().charAt(0).toUpperCase() || "?"}
                              </span>
                              <div>
                                <p className="admin-person-name">{attendee.fullName}</p>
                                <p className="admin-mono">{attendee.ticketCode}</p>
                                <p className="admin-subtext">{attendee.whatsappNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            {attendee.category.replaceAll("_", " ")}
                            <p className="admin-subtext">{attendee.institution}</p>
                          </td>
                          <td>
                            <strong>{formatWib(attendee.checkedInAt)}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td>
                            <span className="admin-pill admin-pill--hadir">Hadir</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  background: "#faf8f5",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  color: "var(--a-muted)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <span>
                  Menampilkan <strong>{recentAttendees.length}</strong> dari total <strong>{hadirCount}</strong> peserta yang sudah hadir.
                </span>
                <Link
                  href="/admin/peserta"
                  style={{
                    color: "var(--a-accent, #065f46)",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  Buka menu Daftar Peserta untuk pencarian & ekspor data lengkap →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
