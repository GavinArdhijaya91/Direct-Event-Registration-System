"use client";

import { useState, useTransition, type FormEvent } from "react";
import { UNNES_FACULTIES } from "@/lib/registration";

type FieldErrors = Partial<
  Record<
    | "fullName"
    | "whatsappNumber"
    | "birthPlace"
    | "birthDate"
    | "churchOrigin"
    | "domicile"
    | "participantType"
    | "academicStatus"
    | "graduationYear"
    | "campusType"
    | "campusName"
    | "faculty"
    | "studyProgram"
    | "institution"
    | "informationSource",
    string[]
  >
>;

type RegistrationResponse =
  | {
      status: "registered";
      ticketCode: string;
      ticketPath: string;
      recoveryCode: string;
    }
  | {
      status: "invalid";
      message: string;
      fieldErrors?: FieldErrors;
    }
  | {
      status: "duplicate" | "closed" | "full" | "unavailable";
      message?: string;
    };

function isTicketPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\/ticket\/[A-Za-z0-9_-]{43}$/.test(value)
  );
}

function isRegistrationResponse(value: unknown): value is RegistrationResponse {
  if (typeof value !== "object" || value === null || !("status" in value)) {
    return false;
  }

  const response = value as Record<string, unknown>;
  if (response.status === "registered") {
    return (
      typeof response.ticketCode === "string" &&
      isTicketPath(response.ticketPath) &&
      typeof response.recoveryCode === "string"
    );
  }

  return ["invalid", "duplicate", "closed", "full", "unavailable"].includes(
    String(response.status),
  );
}

export default function RegistrationForm({
  canRegister,
}: {
  canRegister: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<RegistrationResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeSaved, setCodeSaved] = useState(false);

  // Form states untuk percabangan input dinamis
  const [participantType, setParticipantType] = useState<"MAHASISWA_ALUMNI" | "UMUM">("MAHASISWA_ALUMNI");
  const [academicStatus, setAcademicStatus] = useState<"MAHASISWA" | "ALUMNI">("MAHASISWA");
  const [campusType, setCampusType] = useState<"UNNES" | "LUAR_UNNES">("UNNES");

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResponse(null);
    setRequestError(null);
    setCopyError(false);
    setCopied(false);
    setCodeSaved(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    startTransition(async () => {
      let result: Response;

      try {
        result = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        setRequestError(
          "Koneksi terputus sebelum layanan dapat dihubungi. Periksa koneksi lalu coba lagi.",
        );
        return;
      }

      let body: unknown;
      try {
        body = await result.json();
      } catch {
        setRequestError(
          "Layanan pendaftaran tidak dapat memproses permintaan sekarang.",
        );
        return;
      }

      if (!isRegistrationResponse(body)) {
        setRequestError(
          "Respons layanan tidak dapat dipahami. Silakan coba lagi.",
        );
        return;
      }

      if (body.status === "registered" && !result.ok) {
        setRequestError(
          "Layanan tidak mengonfirmasi pendaftaran. Periksa kembali sebelum mengirim ulang.",
        );
        return;
      }

      setResponse(body);
      if (body.status === "registered") {
        form.reset();
      }
    });
  }

  async function copyRecoveryCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyError(false);
      setCodeSaved(true);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  function shareTicket(ticketPath: string) {
    const ticketUrl = new URL(ticketPath, window.location.origin).toString();
    const shareUrl = new URL("https://wa.me/");
    shareUrl.searchParams.set(
      "text",
      `Tiket Natal PWK 2026 saya: ${ticketUrl}`,
    );
    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
  }

  function sendRecoveryToWA(ticketPath: string, recoveryCode: string) {
    const ticketUrl = new URL(ticketPath, window.location.origin).toString();
    const shareUrl = new URL("https://wa.me/");
    shareUrl.searchParams.set(
      "text",
      `🎄 Tiket Natal PWK 2026\n\nLink tiket: ${ticketUrl}\nKode pemulihan: ${recoveryCode}\n\nSimpan pesan ini. Jika link tiket hilang, gunakan nomor WA dan kode pemulihan ini di halaman pendaftaran.`,
    );
    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
  }

  const fieldErrors =
    response?.status === "invalid" ? response.fieldErrors : undefined;

  const statusMessage =
    response?.status === "duplicate"
      ? "Nomor WhatsApp ini sudah terdaftar. Silakan pulihkan tiket menggunakan kode pemulihan rahasia di bawah."
      : response?.status === "closed"
        ? "Pendaftaran ditutup oleh panitia."
        : response?.status === "full"
          ? "Kuota peserta sudah penuh."
          : response?.status === "unavailable"
            ? "Layanan pendaftaran sedang tidak tersedia."
            : response?.status === "invalid"
              ? response.message
              : null;

  if (response?.status === "registered") {
    return (
      <section
        aria-live="polite"
        className="rounded-2xl border border-[var(--mint)] bg-[var(--moss)] p-5 sm:p-6 text-[var(--forest-deep)] shadow-lg transition-all"
      >
        <p className="text-xs font-semibold tracking-wider text-[var(--forest)] uppercase">
          Pendaftaran Berhasil!
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          Selamat, tiket Anda sudah aktif
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Harap simpan kode pemulihan Anda sebelum membuka halaman tiket.
        </p>

        <div className="mt-5 rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted)]">KODE TIKET</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--ink)]">
            {response.ticketCode}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--gold)] bg-[var(--candle)] p-4 text-[var(--ink)]">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--gold)] uppercase tracking-wide">
            <span>⚠️</span>
            <span>Wajib Disimpan — Kode Pemulihan Rahasia</span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Jika tautan tiket hilang atau Anda ganti perangkat, Anda hanya bisa
            membuka tiket dengan kode ini.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-white/90 px-3 py-2 font-mono text-xs sm:text-sm font-semibold tracking-wide select-all border border-[var(--line)]">
              {response.recoveryCode}
            </code>
            <button
              className="min-h-11 rounded-lg bg-[var(--forest)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--forest-deep)] active:scale-95 transition inline-flex items-center gap-1.5"
              onClick={() => copyRecoveryCode(response.recoveryCode)}
              type="button"
            >
              {copied ? (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Salin Kode</span>
                </>
              )}
            </button>
            <button
              className="min-h-11 rounded-lg border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--cream)] active:scale-95 transition flex items-center gap-1.5"
              onClick={() =>
                sendRecoveryToWA(response.ticketPath, response.recoveryCode)
              }
              type="button"
              title="Kirim kode dan link tiket ke nomor WA pribadi sendiri sebagai backup"
            >
              <svg
                className="h-3.5 w-3.5 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Simpan ke WA Saya</span>
            </button>
          </div>
          {copyError ? (
            <p className="mt-2 text-xs text-[var(--red)]">
              Tidak dapat menyalin otomatis. Silakan pilih dan salin kode di atas secara manual.
            </p>
          ) : null}
          {copied ? (
            <p className="mt-2 text-xs text-[var(--forest)] font-semibold flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Kode pemulihan tersalin ke papan klip! Simpan di catatan atau kirim ke diri sendiri.</span>
            </p>
          ) : null}
        </div>

        {!codeSaved ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--gold)] bg-[var(--candle)] p-3.5 text-xs text-[var(--ink)]">
            <input
              id="confirm-saved"
              type="checkbox"
              checked={codeSaved}
              onChange={(e) => setCodeSaved(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-[var(--forest)] cursor-pointer"
            />
            <label htmlFor="confirm-saved" className="cursor-pointer select-none leading-relaxed">
              <strong>Saya sudah menyalin / menyimpan kode pemulihan di atas.</strong>
              {" "}Saya mengerti bahwa kode ini tidak akan ditampilkan lagi setelah halaman ditutup.
            </label>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <a
            className={`flex-1 min-h-12 inline-flex items-center justify-center rounded-full px-5 text-sm font-semibold text-white shadow-sm transition active:scale-95 text-center ${
              codeSaved
                ? "bg-[var(--forest)] hover:bg-[var(--forest-deep)]"
                : "bg-gray-400 hover:bg-gray-500 opacity-80"
            }`}
            href={response.ticketPath}
            onClick={(e) => {
              if (!codeSaved) {
                const confirmed = window.confirm(
                  "Anda belum menyalin kode pemulihan! Jika tautan tiket hilang, Anda tidak dapat membukanya kembali tanpa kode pemulihan.\n\nYakin ingin langsung membuka tiket?",
                );
                if (!confirmed) {
                  e.preventDefault();
                }
              }
            }}
          >
            Buka Halaman Tiket →
          </a>
          <button
            className="min-h-12 rounded-full border border-[var(--line)] bg-white px-5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--cream)] transition active:scale-95 text-center"
            onClick={() => shareTicket(response.ticketPath)}
            type="button"
          >
            Bagi Tautan via WA
          </button>
        </div>
      </section>
    );
  }

  return (
    <form className="space-y-6" onSubmit={submitRegistration}>
      {/* 1. Kategori Profil Pendaftar */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--moss)]/30 p-4 sm:p-5">
        <label className="mb-2 block text-sm font-bold text-[var(--ink)]">
          1. Kategori Profil Pendaftar
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition active:scale-[0.99] ${
              participantType === "MAHASISWA_ALUMNI"
                ? "border-[var(--forest)] bg-white shadow-sm ring-2 ring-[var(--forest)]/20"
                : "border-[var(--line)] bg-white/70 hover:bg-white"
            }`}
          >
            <input
              type="radio"
              name="participantType"
              value="MAHASISWA_ALUMNI"
              checked={participantType === "MAHASISWA_ALUMNI"}
              onChange={() => setParticipantType("MAHASISWA_ALUMNI")}
              className="mt-1 h-4 w-4 accent-[var(--forest)] cursor-pointer"
            />
            <div className="select-none">
              <span className="block text-sm font-bold text-[var(--ink)]">
                Mahasiswa / Alumni
              </span>
              <span className="block mt-0.5 text-xs text-[var(--muted)] leading-relaxed">
                Untuk mahasiswa aktif atau alumni (baik dari UNNES maupun luar UNNES).
              </span>
            </div>
          </label>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition active:scale-[0.99] ${
              participantType === "UMUM"
                ? "border-[var(--forest)] bg-white shadow-sm ring-2 ring-[var(--forest)]/20"
                : "border-[var(--line)] bg-white/70 hover:bg-white"
            }`}
          >
            <input
              type="radio"
              name="participantType"
              value="UMUM"
              checked={participantType === "UMUM"}
              onChange={() => setParticipantType("UMUM")}
              className="mt-1 h-4 w-4 accent-[var(--forest)] cursor-pointer"
            />
            <div className="select-none">
              <span className="block text-sm font-bold text-[var(--ink)]">
                Umum / Tamu Undangan
              </span>
              <span className="block mt-0.5 text-xs text-[var(--muted)] leading-relaxed">
                Untuk masyarakat umum, keluarga, jemaat gereja, atau undangan luar kampus.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* 2. Percabangan Khusus Mahasiswa / Alumni */}
      {participantType === "MAHASISWA_ALUMNI" ? (
        <div className="space-y-4 rounded-2xl border border-[var(--forest)]/20 bg-emerald-50/50 p-4 sm:p-5">
          {/* Status Akademik */}
          <div className="border-b border-emerald-900/10 pb-3.5">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
              Status Akademik
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs sm:text-sm font-semibold transition active:scale-[0.98] ${
                  academicStatus === "MAHASISWA"
                    ? "border-[var(--forest)] bg-white text-[var(--forest)] shadow-sm font-bold"
                    : "border-transparent bg-white/60 text-gray-700 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="academicStatus"
                  value="MAHASISWA"
                  checked={academicStatus === "MAHASISWA"}
                  onChange={() => setAcademicStatus("MAHASISWA")}
                  className="accent-[var(--forest)]"
                />
                Masih Mahasiswa
              </label>
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs sm:text-sm font-semibold transition active:scale-[0.98] ${
                  academicStatus === "ALUMNI"
                    ? "border-[var(--forest)] bg-white text-[var(--forest)] shadow-sm font-bold"
                    : "border-transparent bg-white/60 text-gray-700 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="academicStatus"
                  value="ALUMNI"
                  checked={academicStatus === "ALUMNI"}
                  onChange={() => setAcademicStatus("ALUMNI")}
                  className="accent-[var(--forest)]"
                />
                Sudah Alumni
              </label>
            </div>
          </div>

          {/* Khusus Alumni: Input Tahun Kelulusan */}
          {academicStatus === "ALUMNI" ? (
            <div>
              <label
                className="mb-1 block text-sm font-semibold text-[var(--ink)]"
                htmlFor="graduationYear"
              >
                Alumni Tahun Berapa? <span className="text-[var(--red)]">*</span>
              </label>
              <input
                id="graduationYear"
                name="graduationYear"
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required={academicStatus === "ALUMNI"}
                placeholder="Contoh: 2022"
                className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                💡 Masukkan tahun kelulusan Anda (4 digit angka) untuk pendataan jejaring alumni.
              </p>
              {fieldErrors?.graduationYear?.[0] ? (
                <p className="mt-1 text-sm text-[var(--red)]">
                  {fieldErrors.graduationYear[0]}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Asal Kampus: UNNES vs Luar UNNES */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
              Asal Perguruan Tinggi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-xl border py-2.5 px-3 text-xs sm:text-sm font-semibold transition active:scale-[0.98] ${
                  campusType === "UNNES"
                    ? "border-[var(--forest)] bg-white text-[var(--forest)] shadow-sm font-bold"
                    : "border-transparent bg-white/60 text-gray-700 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="campusType"
                  value="UNNES"
                  checked={campusType === "UNNES"}
                  onChange={() => setCampusType("UNNES")}
                  className="accent-[var(--forest)]"
                />
                UNNES (Univ. Negeri Semarang)
              </label>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-xl border py-2.5 px-3 text-xs sm:text-sm font-semibold transition active:scale-[0.98] ${
                  campusType === "LUAR_UNNES"
                    ? "border-[var(--forest)] bg-white text-[var(--forest)] shadow-sm font-bold"
                    : "border-transparent bg-white/60 text-gray-700 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="campusType"
                  value="LUAR_UNNES"
                  checked={campusType === "LUAR_UNNES"}
                  onChange={() => setCampusType("LUAR_UNNES")}
                  className="accent-[var(--forest)]"
                />
                Di Luar UNNES
              </label>
            </div>
          </div>

          {/* Form Bidang UNNES vs Luar UNNES */}
          {campusType === "UNNES" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-semibold text-[var(--ink)]"
                  htmlFor="faculty"
                >
                  Fakultas di UNNES <span className="text-[var(--red)]">*</span>
                </label>
                <select
                  id="faculty"
                  name="faculty"
                  required
                  defaultValue=""
                  className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
                >
                  <option value="" disabled>
                    Pilih Fakultas
                  </option>
                  {UNNES_FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                {fieldErrors?.faculty?.[0] ? (
                  <p className="mt-1 text-sm text-[var(--red)]">
                    {fieldErrors.faculty[0]}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-semibold text-[var(--ink)]"
                  htmlFor="studyProgram"
                >
                  Program Studi (Prodi) <span className="text-[var(--red)]">*</span>
                </label>
                <input
                  id="studyProgram"
                  name="studyProgram"
                  required
                  maxLength={100}
                  placeholder="Contoh: Teknik Informatika"
                  className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
                />
                {fieldErrors?.studyProgram?.[0] ? (
                  <p className="mt-1 text-sm text-[var(--red)]">
                    {fieldErrors.studyProgram[0]}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  className="mb-1 block text-sm font-semibold text-[var(--ink)]"
                  htmlFor="campusName"
                >
                  Nama Universitas / Kampus <span className="text-[var(--red)]">*</span>
                </label>
                <input
                  id="campusName"
                  name="campusName"
                  required
                  maxLength={120}
                  placeholder="Contoh: Universitas Diponegoro (UNDIP)"
                  className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
                />
                {fieldErrors?.campusName?.[0] ? (
                  <p className="mt-1 text-sm text-[var(--red)]">
                    {fieldErrors.campusName[0]}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-1 block text-sm font-semibold text-[var(--ink)]"
                    htmlFor="faculty"
                  >
                    Fakultas <span className="text-[var(--red)]">*</span>
                  </label>
                  <input
                    id="faculty"
                    name="faculty"
                    required
                    maxLength={100}
                    placeholder="Contoh: Fakultas Teknik"
                    className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
                  />
                  {fieldErrors?.faculty?.[0] ? (
                    <p className="mt-1 text-sm text-[var(--red)]">
                      {fieldErrors.faculty[0]}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-semibold text-[var(--ink)]"
                    htmlFor="studyProgram"
                  >
                    Program Studi (Prodi) <span className="text-[var(--red)]">*</span>
                  </label>
                  <input
                    id="studyProgram"
                    name="studyProgram"
                    required
                    maxLength={100}
                    placeholder="Contoh: Teknik Sipil"
                    className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
                  />
                  {fieldErrors?.studyProgram?.[0] ? (
                    <p className="mt-1 text-sm text-[var(--red)]">
                      {fieldErrors.studyProgram[0]}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* 3. Data Pribadi, Kelahiran, dan Komunitas (Semua Peserta Wajib) */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--ink)]" htmlFor="fullName">
            Nama Lengkap <span className="text-[var(--red)]">*</span>
          </label>
          <input
            autoComplete="name"
            className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
            id="fullName"
            maxLength={120}
            name="fullName"
            placeholder="Masukkan nama lengkap Anda"
            required
          />
          {fieldErrors?.fullName?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)]">
              {fieldErrors.fullName[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
            htmlFor="whatsappNumber"
          >
            Nomor WhatsApp <span className="text-[var(--red)]">*</span>
          </label>
          <input
            autoComplete="tel"
            className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
            id="whatsappNumber"
            inputMode="tel"
            name="whatsappNumber"
            placeholder="08xxxxxxxxxx"
            required
            type="tel"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Nomor dinormalisasi otomatis ke format Indonesia. Setiap nomor hanya
            untuk satu peserta.
          </p>
          {fieldErrors?.whatsappNumber?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)]">
              {fieldErrors.whatsappNumber[0]}
            </p>
          ) : null}
        </div>

        {/* Tempat & Tanggal Lahir (Kombinasi HTML Date Input yang Interaktif) */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              htmlFor="birthPlace"
            >
              Tempat Lahir (Kota/Kabupaten) <span className="text-[var(--red)]">*</span>
            </label>
            <input
              id="birthPlace"
              name="birthPlace"
              required
              maxLength={100}
              placeholder="Contoh: Semarang, Batam, Medan"
              className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
            />
            {fieldErrors?.birthPlace?.[0] ? (
              <p className="mt-1 text-sm text-[var(--red)]">
                {fieldErrors.birthPlace[0]}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              htmlFor="birthDate"
            >
              Tanggal Lahir <span className="text-[var(--red)]">*</span>
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              required
              max="2026-12-31"
              min="1940-01-01"
              className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
            />
            {fieldErrors?.birthDate?.[0] ? (
              <p className="mt-1 text-sm text-[var(--red)]">
                {fieldErrors.birthDate[0]}
              </p>
            ) : null}
          </div>
        </div>

        {/* Stasi Asal / Identitas Gereja */}
        <div>
          <label
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
            htmlFor="churchOrigin"
          >
            Stasi Asal / Identitas Gereja <span className="text-[var(--red)]">*</span>
          </label>
          <input
            id="churchOrigin"
            name="churchOrigin"
            required
            maxLength={150}
            placeholder="Contoh: Gereja Santo Fransiskus Asisi, Batam / GKJ Semarang"
            className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
          />
          <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
            Informasi ini digunakan untuk mempererat tali silaturahmi serta membangun hubungan persaudaraan jangka panjang bagi keluarga besar Kristiani dan Katolik.
          </p>
          {fieldErrors?.churchOrigin?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)]">
              {fieldErrors.churchOrigin[0]}
            </p>
          ) : null}
        </div>

        {/* Domisili / Tempat Tinggal Sekarang */}
        <div>
          <label
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
            htmlFor="domicile"
          >
            Alamat Domisili / Tempat Tinggal <span className="text-[var(--red)]">*</span>
          </label>
          <input
            id="domicile"
            name="domicile"
            required
            maxLength={255}
            placeholder="Contoh: Jl. Melati Blok B No. 12, Kel. Sekaran, Kec. Gunungpati, Kota Semarang, Jawa Tengah"
            className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
          />
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Bagi Bapak/Ibu/Saudara yang tinggal di rumah pribadi, mohon cantumkan alamat lengkap mencakup blok/nomor rumah, kelurahan, kecamatan, kota/kabupaten, dan provinsi. Apabila tinggal di kost atau kontrakan, Anda cukup menuliskan nama kost serta daerah sekitarnya.
          </p>
          {fieldErrors?.domicile?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)]">
              {fieldErrors.domicile[0]}
            </p>
          ) : null}
        </div>

        {/* Sumber Informasi */}
        <div>
          <label
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
            htmlFor="informationSource"
          >
            Tahu acara ini dari mana? <span className="text-[var(--red)]">*</span>
          </label>
          <select
            className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base focus:border-[var(--forest)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20"
            defaultValue=""
            id="informationSource"
            name="informationSource"
            required
          >
            <option disabled value="">
              Pilih sumber informasi
            </option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TEMAN_GRUP_GEREJA">Teman / Grup WA / Komunitas Gereja</option>
            <option value="POSTER_KAMPUS">Poster Kampus</option>
          </select>
          {fieldErrors?.informationSource?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)]">
              {fieldErrors.informationSource[0]}
            </p>
          ) : null}
        </div>
      </div>

      {requestError || statusMessage ? (
        <div
          aria-live="polite"
          className="rounded-xl bg-[var(--rose)] px-4 py-3 text-sm leading-6 text-[var(--red)] shadow-sm"
          role="alert"
        >
          <p>{requestError ?? statusMessage}</p>
          {response?.status === "duplicate" ? (
            <a className="mt-2 inline-block font-semibold underline" href="#pemulihan">
              Ke pemulihan tiket
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="w-full pt-2">
        <button
          className="group min-h-12 w-full rounded-full bg-gradient-to-r from-[var(--emeral)] to-[var(--forest)] px-6 text-base font-semibold !text-white shadow-md hover:from-[var(--forest)] hover:to-[var(--forest-deep)] hover:!text-white hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canRegister || isPending}
          type="submit"
          title="Kirim pendaftaran dan dapatkan tiket acara"
        >
          {isPending ? (
            <span className="inline-flex items-center justify-center gap-2 !text-white">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="!text-white">Memproses pendaftaran…</span>
            </span>
          ) : !canRegister ? (
            <span className="!text-white">Pendaftaran tidak tersedia</span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2 !text-white">
              <span className="!text-white font-semibold">Daftar Sekarang</span>
              <span aria-hidden="true" className="!text-white transition-transform duration-150 group-hover:translate-x-1">→</span>
            </span>
          )}
        </button>
        <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
          Tiket dan kode pemulihan akan langsung diterbitkan setelah Anda menekan tombol ini.
        </p>
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">
        Nomor WhatsApp tidak diverifikasi. Tiket dan kode pemulihan ditampilkan
        setelah pendaftaran berhasil; simpan keduanya dengan aman.
      </p>
    </form>
  );
}
