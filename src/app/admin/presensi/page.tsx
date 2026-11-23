"use client";

import { useState, type FormEvent } from "react";
import AdminIcon from "@/app/admin/admin-icons";
import { useAdmin } from "@/app/admin/admin-context";

export default function AdminPresensiPage() {
  const {
    openVenueQr,
    openWalkin,
    performCheckin,
    checkingInTicketCode,
  } = useAdmin();
  const [ticketCode, setTicketCode] = useState("");

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
          <p className="admin-kicker">Prioritas hari-H</p>
          <h1 className="admin-section-title" id="presensi-heading">
            Presensi & QR
          </h1>
          <p className="admin-section-note">
            Tayangkan satu QR untuk semua peserta, lalu pantau hasilnya di
            halaman Daftar peserta.
          </p>
        </div>
      </div>

      <div className="admin-info">
        <AdminIcon name="info" />
        <div>
          <p style={{ margin: "0 0 0.25rem" }}>
            <strong>Alurnya: panitia menayangkan QR, peserta yang memindai.</strong>
          </p>
          <ol className="admin-guide">
            <li>Buka QR presensi di layar proyektor.</li>
            <li>Peserta memindai dari halaman tiketnya sendiri.</li>
            <li>Cek status hadir di menu Daftar peserta.</li>
          </ol>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: "1rem" }}>
        <div className="admin-card-head">
          <div>
            <h2 className="admin-card-title">Aksi presensi</h2>
            <p className="admin-card-sub">
              Tayangkan QR di proyektor aula atau daftarkan tamu yang datang
              langsung.
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
                  Layar penuh untuk proyektor aula
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
            Kalau peserta tidak bisa memindai
          </p>
          <form className="admin-inline-form" onSubmit={submitManualCheckin} style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
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
            Masukkan kode tiket EVT-XXXX milik peserta. Waktu dan status
            check-in tetap ditentukan server, sesuai jadwal yang berlaku.
          </p>
        </div>
      </div>
    </section>
  );
}
