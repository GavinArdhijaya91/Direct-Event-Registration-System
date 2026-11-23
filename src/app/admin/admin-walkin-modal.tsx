"use client";

import { useState, useTransition, type FormEvent } from "react";
import { UNNES_FACULTIES } from "@/lib/registration";

export default function AdminWalkinModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [participantType, setParticipantType] = useState<"MAHASISWA_ALUMNI" | "UMUM">("MAHASISWA_ALUMNI");
  const [academicStatus, setAcademicStatus] = useState<"MAHASISWA" | "ALUMNI">("MAHASISWA");
  const [campusType, setCampusType] = useState<"UNNES" | "LUAR_UNNES">("UNNES");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <h3 className="text-lg font-bold text-[var(--ink)]">
              🆘 Pendaftaran OTS / Walk-In (Penyelamat)
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Gunakan saat tamu datang namun kuota online penuh. Peserta langsung tercatat HADIR.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
            type="button"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-[var(--red)] bg-[var(--rose)] p-3 text-xs text-[var(--red)]">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-4 space-y-3.5">
          {/* Tipe Peserta */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
              Kategori Pendaftar
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="participantType"
                  value="MAHASISWA_ALUMNI"
                  checked={participantType === "MAHASISWA_ALUMNI"}
                  onChange={() => setParticipantType("MAHASISWA_ALUMNI")}
                  className="accent-[var(--forest)]"
                />
                Mahasiswa / Alumni
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="participantType"
                  value="UMUM"
                  checked={participantType === "UMUM"}
                  onChange={() => setParticipantType("UMUM")}
                  className="accent-[var(--forest)]"
                />
                Umum / Tamu Undangan
              </label>
            </div>
          </div>

          {/* Form Khusus Mahasiswa / Alumni */}
          {participantType === "MAHASISWA_ALUMNI" ? (
            <div className="rounded-xl border border-[var(--line)] bg-gray-50 p-3 space-y-2.5">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="academicStatus"
                    value="MAHASISWA"
                    checked={academicStatus === "MAHASISWA"}
                    onChange={() => setAcademicStatus("MAHASISWA")}
                    className="accent-[var(--forest)]"
                  />
                  Mahasiswa
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="academicStatus"
                    value="ALUMNI"
                    checked={academicStatus === "ALUMNI"}
                    onChange={() => setAcademicStatus("ALUMNI")}
                    className="accent-[var(--forest)]"
                  />
                  Alumni
                </label>
              </div>

              {academicStatus === "ALUMNI" ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-grad-year">
                    Alumni Tahun Berapa?
                  </label>
                  <input
                    id="walkin-grad-year"
                    name="graduationYear"
                    pattern="\d{4}"
                    maxLength={4}
                    required
                    placeholder="Contoh: 2022"
                    className="min-h-9 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-xs"
                  />
                </div>
              ) : null}

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="campusType"
                    value="UNNES"
                    checked={campusType === "UNNES"}
                    onChange={() => setCampusType("UNNES")}
                    className="accent-[var(--forest)]"
                  />
                  UNNES
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="campusType"
                    value="LUAR_UNNES"
                    checked={campusType === "LUAR_UNNES"}
                    onChange={() => setCampusType("LUAR_UNNES")}
                    className="accent-[var(--forest)]"
                  />
                  Luar UNNES
                </label>
              </div>

              {campusType === "UNNES" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-fac">
                      Fakultas
                    </label>
                    <select
                      id="walkin-fac"
                      name="faculty"
                      required
                      defaultValue=""
                      className="min-h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-xs"
                    >
                      <option value="" disabled>Pilih Fakultas</option>
                      {UNNES_FACULTIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-prodi">
                      Prodi
                    </label>
                    <input
                      id="walkin-prodi"
                      name="studyProgram"
                      required
                      placeholder="Teknik Informatika"
                      className="min-h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-camp-name">
                      Nama Kampus / Univ
                    </label>
                    <input
                      id="walkin-camp-name"
                      name="campusName"
                      required
                      placeholder="Contoh: UNDIP"
                      className="min-h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-fac-other">
                        Fakultas
                      </label>
                      <input
                        id="walkin-fac-other"
                        name="faculty"
                        required
                        placeholder="Fakultas Teknik"
                        className="min-h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-prodi-other">
                        Prodi
                      </label>
                      <input
                        id="walkin-prodi-other"
                        name="studyProgram"
                        required
                        placeholder="Teknik Sipil"
                        className="min-h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Data Diri Umum */}
          <div>
            <label
              className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              htmlFor="walkin-name"
            >
              Nama Lengkap Peserta
            </label>
            <input
              id="walkin-name"
              name="fullName"
              required
              maxLength={120}
              className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
              placeholder="Nama lengkap tamu/peserta"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              htmlFor="walkin-wa"
            >
              Nomor WhatsApp
            </label>
            <input
              id="walkin-wa"
              name="whatsappNumber"
              required
              type="tel"
              className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-birth-place">
                Tempat Lahir
              </label>
              <input
                id="walkin-birth-place"
                name="birthPlace"
                required
                placeholder="Semarang"
                className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-birth-date">
                Tanggal Lahir
              </label>
              <input
                id="walkin-birth-date"
                name="birthDate"
                type="date"
                required
                className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-church">
              Stasi Asal / Identitas Gereja
            </label>
            <input
              id="walkin-church"
              name="churchOrigin"
              required
              placeholder="Contoh: Gereja Santo Fransiskus Asisi, Batam"
              className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" htmlFor="walkin-domicile">
              Alamat Domisili / Tempat Tinggal
            </label>
            <input
              id="walkin-domicile"
              name="domicile"
              required
              placeholder="Contoh: Jl. Melati Blok B No. 12, Kel. Sekaran, Kec. Gunungpati, Kota Semarang, Jawa Tengah"
              className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              htmlFor="walkin-reason"
            >
              Alasan Penerimaan OTS (Wajib untuk Audit)
            </label>
            <textarea
              id="walkin-reason"
              name="reason"
              required
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
              placeholder="Contoh: Tamu undangan hadir langsung tanpa tiket online, disetujui panitia."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 flex-1 rounded-full bg-[var(--forest)] px-4 text-sm font-semibold text-white hover:bg-[var(--forest-deep)] disabled:opacity-50"
            >
              {pending
                ? "Mendaftarkan & Absenkan…"
                : "✓ Daftarkan & Langsung Hadirkan"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm font-semibold hover:bg-gray-100"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
