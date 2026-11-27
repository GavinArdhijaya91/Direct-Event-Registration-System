"use client";

import { useMemo, useState } from "react";
import AdminIcon from "@/app/admin/admin-icons";
import AdminParticipantDetail from "@/app/admin/admin-participant-detail";
import { formatWib, useAdmin, type Attendee } from "@/app/admin/admin-context";

type AttendanceFilter = "ALL" | "HADIR" | "BELUM";

export default function AdminPesertaPage() {
  const { dashboard, refresh, setNotice, setPageError, performCheckin, checkingInTicketCode } = useAdmin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AttendanceFilter>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deletingTicketCode, setDeletingTicketCode] = useState<string | null>(null);
  const [detailAttendee, setDetailAttendee] = useState<Attendee | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const totalRegistered = dashboard.stats.totalRegistered;
  const hadirCount = dashboard.stats.totalCheckedIn;
  const belumCount = Math.max(totalRegistered - hadirCount, 0);

  const visibleAttendees = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("id-ID");
    return dashboard.attendees.filter((attendee: Attendee) => {
      const matchesStatus =
        filter === "ALL" ||
        (filter === "HADIR" && attendee.status === "HADIR") ||
        (filter === "BELUM" && attendee.status !== "HADIR");
      const matchesSearch =
        !needle ||
        [attendee.ticketCode, attendee.fullName, attendee.whatsappNumber, attendee.institution]
          .some((value) => value.toLocaleLowerCase("id-ID").includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [dashboard.attendees, filter, search]);

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
      setDeleteTarget(null);
      setDeleteReason("");
      await refresh();
    } catch {
      setPageError("Koneksi gagal saat menghapus data peserta.");
    } finally {
      setDeletingTicketCode(null);
    }
  }

  return (
    <section aria-labelledby="peserta-heading" className="admin-section">
      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h1 className="admin-card-title" id="peserta-heading">
              Daftar peserta
            </h1>
            <p className="admin-card-sub">
              Cari nama atau kode tiket untuk mengecek status. &ldquo;Belum
              hadir&rdquo; berarti check-in belum tercatat, bukan ketidakhadiran
              pasti.
            </p>
          </div>
          <div className="relative inline-block text-left">
            <button
              className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              type="button"
              aria-expanded={showExportMenu}
            >
              <AdminIcon name="download" /> Ekspor Data ▾
            </button>
            {showExportMenu ? (
              <div
                className="absolute right-0 mt-2 w-72 rounded-xl border border-[var(--line)] bg-white p-3 shadow-xl z-20"
                style={{ minWidth: "18rem" }}
              >
                <div className="mb-2 pb-2 border-b border-[var(--line)]">
                  <p className="text-xs font-bold text-[var(--forest)] uppercase tracking-wider">
                    Format Excel (.xlsx)
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Format rapi, otomatis menyesuaikan kolom
                  </p>
                </div>
                <div className="space-y-1">
                  <a
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--moss)] hover:text-[var(--forest-deep)] transition"
                    href="/api/admin/export?type=all&format=xlsx"
                    onClick={() => setShowExportMenu(false)}
                    download
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                    </svg>
                    <span>Laporan Lengkap (2 Sheet)</span>
                  </a>
                  <a
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink)] hover:bg-[var(--cream)] transition"
                    href="/api/admin/export?type=internal&format=xlsx"
                    onClick={() => setShowExportMenu(false)}
                    download
                  >
                    <svg className="w-3.5 h-3.5 text-stone-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span>Data Peserta Internal (Profil Saja)</span>
                  </a>
                  <a
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink)] hover:bg-[var(--cream)] transition"
                    href="/api/admin/export?type=presensi&format=xlsx"
                    onClick={() => setShowExportMenu(false)}
                    download
                  >
                    <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 6 12 12 15 15" />
                    </svg>
                    <span>Rekap Kehadiran Hari-H</span>
                  </a>
                </div>

                <div className="my-2 pt-2 border-t border-[var(--line)]">
                  <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                    Format Alternatif (CSV)
                  </p>
                </div>
                <div className="space-y-1">
                  <a
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-[11px] text-[var(--muted)] hover:bg-[var(--cream)] hover:text-[var(--ink)] transition"
                    href="/api/admin/export?type=internal&format=csv"
                    onClick={() => setShowExportMenu(false)}
                    download
                  >
                    <svg className="w-3 h-3 text-stone-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Data Internal (.csv)</span>
                  </a>
                  <a
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-[11px] text-[var(--muted)] hover:bg-[var(--cream)] hover:text-[var(--ink)] transition"
                    href="/api/admin/export?type=presensi&format=csv"
                    onClick={() => setShowExportMenu(false)}
                    download
                  >
                    <svg className="w-3 h-3 text-stone-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Rekap Kehadiran (.csv)</span>
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-toolbar">
            <div aria-label="Filter status kehadiran" className="admin-tabs" role="group">
              {(
                [
                  ["ALL", "Semua", totalRegistered],
                  ["HADIR", "Hadir", hadirCount],
                  ["BELUM", "Belum hadir", belumCount],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  aria-pressed={filter === value}
                  className={`admin-tab${filter === value ? " is-active" : ""}`}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {label}
                  <span className="admin-tab-count">({count})</span>
                </button>
              ))}
            </div>
            <label className="admin-search">
              <span className="sr-only">Cari peserta</span>
              <AdminIcon name="search" />
              <input
                className="admin-input"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau kode tiket"
                type="search"
                value={search}
              />
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Peserta</th>
                  <th scope="col">Kategori / Instansi</th>
                  <th scope="col">Terdaftar</th>
                  <th scope="col">Status</th>
                  <th scope="col">Check-in</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleAttendees.map((attendee) => (
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
                      {attendee.category.charAt(0) + attendee.category.slice(1).toLowerCase().replaceAll("_", " ")}
                      <p className="admin-subtext">{attendee.institution}</p>
                    </td>
                    <td>{formatWib(attendee.registeredAt)}</td>
                    <td>
                      {attendee.status === "HADIR" ? (
                        <span className="admin-pill admin-pill--hadir">Hadir</span>
                      ) : (
                        <span className="admin-pill admin-pill--belum">Belum hadir</span>
                      )}
                    </td>
                    <td>
                      {formatWib(attendee.checkedInAt)}
                      {attendee.checkinMethod ? (
                        <p className="admin-subtext">{attendee.checkinMethod}</p>
                      ) : null}
                    </td>
                    <td>
                      <div className="admin-actions-row">
                        {attendee.status !== "HADIR" ? (
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            disabled={checkingInTicketCode === attendee.ticketCode}
                            onClick={() => void performCheckin(attendee.ticketCode)}
                            title={`Absenkan hadir ${attendee.fullName}`}
                            type="button"
                          >
                            <AdminIcon name="check" />
                            {checkingInTicketCode === attendee.ticketCode ? "Memproses…" : "Absenkan hadir"}
                          </button>
                        ) : null}
                        <button
                          aria-label={`Lihat detail ${attendee.fullName}`}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          onClick={() => setDetailAttendee(attendee)}
                          type="button"
                        >
                          Detail
                        </button>
                      {deleteTarget === attendee.ticketCode ? (
                        <form
                          className="admin-form-grid"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void deleteAttendee(attendee.ticketCode);
                          }}
                          style={{ minWidth: "11rem" }}
                        >
                          <label className="sr-only" htmlFor={`delete-reason-${attendee.ticketCode}`}>
                            Alasan menghapus {attendee.ticketCode}
                          </label>
                          <input
                            className="admin-input"
                            id={`delete-reason-${attendee.ticketCode}`}
                            maxLength={500}
                            onChange={(event) => setDeleteReason(event.target.value)}
                            placeholder="Alasan wajib"
                            required
                            value={deleteReason}
                          />
                          <div className="admin-actions-row">
                            <button
                              className="admin-btn admin-btn-danger-solid admin-btn-sm"
                              disabled={!deleteReason.trim() || deletingTicketCode !== null}
                              type="submit"
                            >
                              {deletingTicketCode === attendee.ticketCode ? "Menghapus…" : "Konfirmasi hapus"}
                            </button>
                            <button
                              className="admin-btn admin-btn-ghost admin-btn-sm"
                              onClick={() => {
                                setDeleteTarget(null);
                                setDeleteReason("");
                              }}
                              type="button"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          disabled={deletingTicketCode !== null}
                          onClick={() => {
                            setDeleteTarget(attendee.ticketCode);
                            setDeleteReason("");
                          }}
                          type="button"
                        >
                          Hapus
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-empty">
                        <AdminIcon name="users" />
                        <strong>
                          {search ? "Tidak ada peserta yang cocok." : "Belum ada peserta terdaftar."}
                        </strong>
                        <p>
                          {search || filter !== "ALL"
                            ? "Ubah kata kunci atau filter status untuk melihat peserta lain."
                            : "Peserta baru akan muncul setelah pendaftaran berhasil."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="admin-scroll-hint">
            Geser tabel ke samping untuk melihat data dan aksi lengkap.
          </p>
        </div>
      </div>

      <AdminParticipantDetail
        attendee={detailAttendee}
        onClose={() => setDetailAttendee(null)}
      />
    </section>
  );
}
