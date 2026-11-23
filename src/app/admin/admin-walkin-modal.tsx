"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { UNNES_FACULTIES } from "@/lib/registration";
import AdminIcon from "@/app/admin/admin-icons";

export default function AdminWalkinModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [participantType, setParticipantType] = useState<"MAHASISWA_ALUMNI" | "UMUM">("MAHASISWA_ALUMNI");
  const [academicStatus, setAcademicStatus] = useState<"MAHASISWA" | "ALUMNI">("MAHASISWA");
  const [campusType, setCampusType] = useState<"UNNES" | "LUAR_UNNES">("UNNES");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/register-walkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await res.json()) as { message?: string };
        if (!res.ok) {
          setError(body.message ?? "Pendaftaran OTS gagal.");
          return;
        }
        await onSuccess();
        onClose();
      } catch {
        setError("Koneksi gagal saat memproses pendaftaran OTS.");
      }
    });
  }

  return (
    <div className="admin-modal" role="presentation">
      <div
        aria-labelledby="walkin-title"
        aria-modal="true"
        className="admin-dialog admin-dialog--wide"
        role="dialog"
      >
        <div className="admin-dialog-head">
          <div>
            <h3 className="admin-dialog-title" id="walkin-title">
              <AdminIcon name="userPlus" /> Pendaftaran tamu OTS / walk-in
            </h3>
            <p className="admin-dialog-sub">
              Gunakan bila tamu datang langsung dan kuota online penuh. Peserta
              langsung tercatat HADIR oleh server.
            </p>
          </div>
          <button
            aria-label="Tutup pendaftaran tamu"
            className="admin-close"
            onClick={onClose}
            type="button"
          >
            <AdminIcon name="close" />
          </button>
        </div>

        {error ? (
          <div
            aria-live="assertive"
            className="admin-notice admin-notice--error"
            role="alert"
            style={{ margin: "1rem 1.25rem 0" }}
          >
            <AdminIcon name="alert" /> <span>{error}</span>
          </div>
        ) : null}

        <form className="admin-dialog-body admin-form-grid" onSubmit={submit}>
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="admin-label">Kategori pendaftar</legend>
            <div className="admin-actions-row" style={{ marginTop: "0.35rem" }}>
              <label className="admin-check">
                <input
                  checked={participantType === "MAHASISWA_ALUMNI"}
                  name="participantType"
                  onChange={() => setParticipantType("MAHASISWA_ALUMNI")}
                  type="radio"
                  value="MAHASISWA_ALUMNI"
                />
                Mahasiswa / alumni
              </label>
              <label className="admin-check">
                <input
                  checked={participantType === "UMUM"}
                  name="participantType"
                  onChange={() => setParticipantType("UMUM")}
                  type="radio"
                  value="UMUM"
                />
                Umum / tamu undangan
              </label>
            </div>
          </fieldset>

          {participantType === "MAHASISWA_ALUMNI" ? (
            <div className="admin-card" style={{ background: "#f9faf7" }}>
              <div className="admin-card-body admin-form-grid">
                <div className="admin-actions-row">
                  <label className="admin-check">
                    <input
                      checked={academicStatus === "MAHASISWA"}
                      name="academicStatus"
                      onChange={() => setAcademicStatus("MAHASISWA")}
                      type="radio"
                      value="MAHASISWA"
                    />
                    Mahasiswa
                  </label>
                  <label className="admin-check">
                    <input
                      checked={academicStatus === "ALUMNI"}
                      name="academicStatus"
                      onChange={() => setAcademicStatus("ALUMNI")}
                      type="radio"
                      value="ALUMNI"
                    />
                    Alumni
                  </label>
                </div>

                {academicStatus === "ALUMNI" ? (
                  <div className="admin-field">
                    <label className="admin-label" htmlFor="walkin-grad-year">
                      Tahun kelulusan
                    </label>
                    <input
                      className="admin-input"
                      id="walkin-grad-year"
                      maxLength={4}
                      name="graduationYear"
                      pattern="\d{4}"
                      placeholder="Contoh: 2022"
                      required
                    />
                  </div>
                ) : null}

                <div className="admin-actions-row">
                  <label className="admin-check">
                    <input
                      checked={campusType === "UNNES"}
                      name="campusType"
                      onChange={() => setCampusType("UNNES")}
                      type="radio"
                      value="UNNES"
                    />
                    UNNES
                  </label>
                  <label className="admin-check">
                    <input
                      checked={campusType === "LUAR_UNNES"}
                      name="campusType"
                      onChange={() => setCampusType("LUAR_UNNES")}
                      type="radio"
                      value="LUAR_UNNES"
                    />
                    Luar UNNES
                  </label>
                </div>

                {campusType === "UNNES" ? (
                  <div className="admin-field-grid">
                    <div className="admin-field">
                      <label className="admin-label" htmlFor="walkin-fac">Fakultas</label>
                      <select
                        className="admin-select"
                        defaultValue=""
                        id="walkin-fac"
                        name="faculty"
                        required
                      >
                        <option disabled value="">Pilih fakultas</option>
                        {UNNES_FACULTIES.map((faculty) => (
                          <option key={faculty} value={faculty}>{faculty}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-field">
                      <label className="admin-label" htmlFor="walkin-prodi">Program studi</label>
                      <input
                        className="admin-input"
                        id="walkin-prodi"
                        name="studyProgram"
                        placeholder="Teknik Informatika"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label className="admin-label" htmlFor="walkin-camp-name">
                        Nama kampus / universitas
                      </label>
                      <input
                        className="admin-input"
                        id="walkin-camp-name"
                        name="campusName"
                        placeholder="Contoh: UNDIP"
                        required
                      />
                    </div>
                    <div className="admin-field-grid">
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="walkin-fac-other">Fakultas</label>
                        <input
                          className="admin-input"
                          id="walkin-fac-other"
                          name="faculty"
                          placeholder="Fakultas Teknik"
                          required
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="walkin-prodi-other">Program studi</label>
                        <input
                          className="admin-input"
                          id="walkin-prodi-other"
                          name="studyProgram"
                          placeholder="Teknik Sipil"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="admin-field">
            <label className="admin-label" htmlFor="walkin-name">Nama lengkap peserta</label>
            <input
              className="admin-input"
              id="walkin-name"
              maxLength={120}
              name="fullName"
              placeholder="Nama lengkap tamu/peserta"
              required
            />
          </div>

          <div className="admin-field-grid">
            <div className="admin-field">
              <label className="admin-label" htmlFor="walkin-wa">Nomor WhatsApp</label>
              <input
                className="admin-input"
                id="walkin-wa"
                name="whatsappNumber"
                placeholder="08xxxxxxxxxx"
                required
                type="tel"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="walkin-birth-place">Tempat lahir</label>
              <input
                className="admin-input"
                id="walkin-birth-place"
                name="birthPlace"
                placeholder="Semarang"
                required
              />
            </div>
          </div>

          <div className="admin-field-grid">
            <div className="admin-field">
              <label className="admin-label" htmlFor="walkin-birth-date">Tanggal lahir</label>
              <input
                className="admin-input"
                id="walkin-birth-date"
                name="birthDate"
                required
                type="date"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="walkin-church">
                Stasi asal / gereja
              </label>
              <input
                className="admin-input"
                id="walkin-church"
                name="churchOrigin"
                placeholder="Contoh: Gereja Santo Fransiskus Asisi"
                required
              />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label" htmlFor="walkin-domicile">
              Alamat domisili
            </label>
            <input
              className="admin-input"
              id="walkin-domicile"
              name="domicile"
              placeholder="Jl. Melati No. 12, Semarang"
              required
            />
          </div>

          <div className="admin-field">
            <label className="admin-label" htmlFor="walkin-reason">
              Alasan penerimaan OTS (wajib untuk audit)
            </label>
            <textarea
              className="admin-textarea"
              id="walkin-reason"
              maxLength={500}
              name="reason"
              placeholder="Contoh: Tamu undangan hadir langsung tanpa tiket online, disetujui panitia."
              required
            />
          </div>

          <div className="admin-dialog-foot" style={{ padding: 0 }}>
            <button
              className="admin-btn admin-btn-primary"
              disabled={pending}
              type="submit"
            >
              <AdminIcon name="check" />
              {pending ? "Mendaftarkan & mengabsenkan…" : "Daftarkan & absenkan hadir"}
            </button>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
