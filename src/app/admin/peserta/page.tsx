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
          <a className="admin-btn admin-btn-ghost admin-btn-sm" href="/api/admin/export">
            <AdminIcon name="download" /> Ekspor CSV
          </a>
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
                      {attendee.category.replaceAll("_", " ")}
                      <p className="admin-subtext">{attendee.institution}</p>
                    </td>
                    <td>{formatWib(attendee.registeredAt)}</td>
                    <td>
                      <div className="admin-status-cell">
                        {attendee.status === "HADIR" ? (
                          <span className="admin-pill admin-pill--hadir">Hadir</span>
                        ) : (
                          <span className="admin-pill admin-pill--belum">Belum hadir</span>
                        )}
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
                      </div>
                    </td>
                    <td>
                      {formatWib(attendee.checkedInAt)}
                      {attendee.checkinMethod ? (
                        <p className="admin-subtext">{attendee.checkinMethod}</p>
                      ) : null}
                    </td>
                    <td>
                      <div className="admin-actions-row">
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
