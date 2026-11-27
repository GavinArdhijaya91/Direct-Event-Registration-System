"use client";

import { useState, type FormEvent } from "react";
import AdminIcon from "@/app/admin/admin-icons";
import { wibInputToIso, useAdmin } from "@/app/admin/admin-context";

export default function AdminPengaturanPage() {
  const { dashboard, draft, setDraft, refresh, setNotice, setPageError } = useAdmin();
  const [bulkReason, setBulkReason] = useState("");
  const [bulkConfirmation, setBulkConfirmation] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const overrideNeeded = Number(draft.maxCapacity) !== dashboard.settings.maxCapacity;

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError(null);
    setNotice(null);
    setSavingSettings(true);
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
          qrMode: draft.qrMode,
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
      await refresh(true);
    } catch (caught) {
      setPageError(
        caught instanceof Error ? caught.message : "Koneksi gagal saat menyimpan pengaturan.",
      );
    } finally {
      setSavingSettings(false);
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
        body: JSON.stringify({ reason: bulkReason, confirmation: bulkConfirmation }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setPageError(body.message ?? "Penghapusan massal tidak berhasil.");
        return;
      }
      setNotice(body.message ?? "Data peserta berhasil dihapus.");
      setBulkReason("");
      setBulkConfirmation("");
      await refresh();
    } catch {
      setPageError("Koneksi gagal saat menghapus data peserta.");
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <section aria-labelledby="pengaturan-heading" className="admin-section">
      <div className="admin-section-head">
        <div>
          <p className="admin-kicker">Konfigurasi acara</p>
          <h1 className="admin-section-title" id="pengaturan-heading">
            Pengaturan acara
          </h1>
          <p className="admin-section-note">
            Perubahan kuota wajib menyertakan alasan dan tercatat di riwayat
            aktivitas.
          </p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">Informasi & pendaftaran</h2>
        </div>
        <div className="admin-card-body">
          <form className="admin-form-grid" onSubmit={saveSettings}>
            <div className="admin-field">
              <label className="admin-label" htmlFor="event-name">Nama acara</label>
              <input
                className="admin-input"
                id="event-name"
                maxLength={120}
                onChange={(event) => setDraft({ ...draft, eventName: event.target.value })}
                required
                value={draft.eventName}
              />
            </div>
            <div className="admin-field-grid">
              <div className="admin-field">
                <label className="admin-label" htmlFor="event-date">Tanggal acara</label>
                <input
                  className="admin-input"
                  id="event-date"
                  onChange={(event) => setDraft({ ...draft, eventDate: event.target.value })}
                  required
                  type="date"
                  value={draft.eventDate}
                />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="capacity">Kuota maksimal</label>
                <input
                  className="admin-input"
                  id="capacity"
                  min={1}
                  onChange={(event) => setDraft({ ...draft, maxCapacity: event.target.value })}
                  required
                  type="number"
                  value={draft.maxCapacity}
                />
              </div>
            </div>
            {overrideNeeded ? (
              <div className="admin-field">
                <label className="admin-label" htmlFor="capacity-reason">
                  Alasan perubahan kuota (wajib)
                </label>
                <textarea
                  className="admin-textarea"
                  id="capacity-reason"
                  maxLength={500}
                  onChange={(event) =>
                    setDraft({ ...draft, capacityOverrideReason: event.target.value })
                  }
                  required
                  value={draft.capacityOverrideReason}
                />
              </div>
            ) : null}
            <div className="admin-field">
              <label className="admin-label" htmlFor="event-location">Lokasi acara</label>
              <input
                className="admin-input"
                id="event-location"
                maxLength={120}
                onChange={(event) => setDraft({ ...draft, eventLocation: event.target.value })}
                required
                value={draft.eventLocation}
              />
            </div>
            <label className="admin-check">
              <input
                checked={draft.registrationOpen}
                onChange={(event) => setDraft({ ...draft, registrationOpen: event.target.checked })}
                type="checkbox"
              />
              Buka pendaftaran
            </label>
            <div className="admin-field">
              <label className="admin-label" htmlFor="qr-mode">Mode QR presensi</label>
              <select
                className="admin-select"
                id="qr-mode"
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    qrMode: event.target.value === "STATIC" ? "STATIC" : "DYNAMIC",
                  })
                }
                value={draft.qrMode}
              >
                <option value="DYNAMIC">Dinamis (berputar tiap 3 menit)</option>
                <option value="STATIC">Statis (cetak)</option>
              </select>
              <p className="admin-help">
                QR dinamis berputar otomatis tiap 3 menit dan cocok untuk
                proyektor di aula. Mode statis tetap tersedia untuk poster cetak
                bila layar tidak bisa dipakai. Karena isinya tidak
                berubah, pasang poster hanya di lokasi acara dan pantau
                kehadiran dari panel admin.
              </p>
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="location-code">Kode QR lokasi aktif</label>
              <input
                autoComplete="off"
                className="admin-input"
                id="location-code"
                maxLength={100}
                onChange={(event) => setDraft({ ...draft, locationCode: event.target.value })}
                value={draft.locationCode}
              />
            </div>
            <div className="admin-field-grid">
              <div className="admin-field">
                <label className="admin-label" htmlFor="checkin-opens">Check-in dibuka (WIB)</label>
                <input
                  className="admin-input"
                  id="checkin-opens"
                  onChange={(event) => setDraft({ ...draft, checkinOpensAt: event.target.value })}
                  type="datetime-local"
                  value={draft.checkinOpensAt}
                />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="checkin-closes">Check-in ditutup (WIB)</label>
                <input
                  className="admin-input"
                  id="checkin-closes"
                  onChange={(event) => setDraft({ ...draft, checkinClosesAt: event.target.value })}
                  type="datetime-local"
                  value={draft.checkinClosesAt}
                />
              </div>
            </div>
            <button className="admin-btn admin-btn-primary" disabled={savingSettings} type="submit">
              {savingSettings ? (
                <>
                  <span className="admin-btn-spinner" aria-hidden="true" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <AdminIcon name="check" /> Simpan pengaturan
                </>
              )}
            </button>
          </form>

          <details className="admin-danger-zone">
            <summary className="admin-danger-title">
              Penghapusan massal (jarang dipakai)
            </summary>
            <p className="admin-help" style={{ marginTop: "0.5rem" }}>
              Hanya tersedia 20 Februari–15 Maret 2027 WIB. Data peserta dan
              tiket dihapus; log lama tetap disimpan. Penghapusan satu peserta
              tersedia kapan saja pada halaman daftar peserta.
            </p>
            <form className="admin-form-grid" onSubmit={deleteAllAttendees} style={{ marginTop: "0.8rem" }}>
              <div className="admin-field">
                <label className="admin-label" htmlFor="bulk-delete-reason">Alasan penghapusan (wajib)</label>
                <textarea
                  className="admin-textarea"
                  disabled={bulkDeleting}
                  id="bulk-delete-reason"
                  maxLength={500}
                  onChange={(event) => setBulkReason(event.target.value)}
                  required
                  value={bulkReason}
                />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="bulk-delete-confirmation">
                  Ketik HAPUS SEMUA PESERTA untuk mengonfirmasi
                </label>
                <input
                  autoComplete="off"
                  className="admin-input"
                  disabled={bulkDeleting}
                  id="bulk-delete-confirmation"
                  onChange={(event) => setBulkConfirmation(event.target.value)}
                  required
                  value={bulkConfirmation}
                />
              </div>
              <button
                className="admin-btn admin-btn-danger-solid"
                disabled={
                  !dashboard.bulkDeletionAllowed ||
                  dashboard.attendees.length === 0 ||
                  !bulkReason.trim() ||
                  bulkConfirmation !== "HAPUS SEMUA PESERTA" ||
                  bulkDeleting
                }
                type="submit"
              >
                {bulkDeleting
                  ? "Menghapus data…"
                  : `Hapus semua ${dashboard.attendees.length} peserta`}
              </button>
              {!dashboard.bulkDeletionAllowed ? (
                <p className="admin-help">
                  Tombol aktif hanya pada jendela tanggal yang ditentukan.
                  Server tetap memvalidasi waktu saat permintaan diterima.
                </p>
              ) : null}
            </form>
          </details>
        </div>
      </div>
    </section>
  );
}
