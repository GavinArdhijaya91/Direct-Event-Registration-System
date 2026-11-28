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
      status: "duplicate" | "closed" | "full" | "unavailable" | "rate-limited";
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

  return ["invalid", "duplicate", "closed", "full", "unavailable", "rate-limited"].includes(
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
  const [waShared, setWaShared] = useState(false);
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
    setWaShared(false);
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
          result.status >= 500
            ? `Layanan pendaftaran sedang terganggu (HTTP ${result.status}). Coba lagi beberapa saat.`
            : result.status === 429
              ? "Terlalu banyak percobaan. Coba lagi nanti atau gunakan jaringan lain."
              : `Respons layanan tidak dapat dibaca (HTTP ${result.status}). Coba lagi; bila berulang, hubungi panitia.`,
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
    setWaShared(true);
    setCodeSaved(true);
  }

  function sendRecoveryToWA(ticketPath: string, recoveryCode: string) {
    const ticketUrl = new URL(ticketPath, window.location.origin).toString();
    const shareUrl = new URL("https://wa.me/");
    shareUrl.searchParams.set(
      "text",
      `Tiket Natal PWK 2026\n\nLink tiket: ${ticketUrl}\nKode pemulihan: ${recoveryCode}\n\nSimpan pesan ini. Jika link tiket hilang, gunakan nomor WA dan kode pemulihan ini di halaman pendaftaran.`,
    );
    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
    setWaShared(true);
    setCodeSaved(true);
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
          : response?.status === "rate-limited"
            ? "Terlalu banyak percobaan pendaftaran. Coba lagi nanti."
            : response?.status === "unavailable"
              ? "Layanan pendaftaran sedang tidak tersedia."
              : response?.status === "invalid"
                ? response.message
                : null;

  if (response?.status === "registered") {
    return (
      <section
        aria-live="polite"
        className="rounded-3xl border border-[#dcd6c8] bg-white p-5 sm:p-7 shadow-xl transition-all text-[var(--ink)]"
      >
        {/* Header Konfirmasi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-5 border-b border-[#ece7dc]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800 tracking-wider uppercase">
              <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Pendaftaran Berhasil</span>
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--forest-deep)]">
              Tiket Anda Sudah Aktif
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[var(--muted)]">
              Simpan kode tiket dan kode pemulihan Anda sebelum membuka halaman tiket.
            </p>
          </div>
        </div>

        {/* Voucher Pass / Kartu Tiket */}
        <div className="mt-5 rounded-2xl border border-[#e5dfd3] bg-[#fbf9f4] p-4 sm:p-5 relative overflow-hidden">
          {/* Bagian Atas: Kode Tiket */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[var(--muted)] uppercase">
                Kode Tiket Resmi
              </p>
              <p className="mt-1 font-mono text-3xl font-extrabold text-[var(--forest-deep)] tracking-wider">
                {response.ticketCode}
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Kode tampilan untuk check-in manual — bukan kode pemulihan.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block rounded-lg bg-emerald-100/80 px-2.5 py-1 text-[11px] font-semibold text-[var(--forest-deep)]">
                Natal PWK UNNES 2026
              </span>
            </div>
          </div>

          {/* Garis Perforasi / Tiket Perforated Line */}
          <div className="my-5 border-t-2 border-dashed border-[#ded7c8] relative">
            <div className="absolute -left-7 -top-2.5 h-5 w-5 rounded-full bg-white border border-[#dcd6c8]" />
            <div className="absolute -right-7 -top-2.5 h-5 w-5 rounded-full bg-white border border-[#dcd6c8]" />
          </div>

          {/* Bagian Bawah: Kode Pemulihan Rahasia */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 tracking-wide uppercase">
              <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Kode Pemulihan Cadangan</span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
              32 karakter (A–F, 0–9), berbeda dengan kode tiket EVT-XXXX di atas. Gunakan nomor WhatsApp & kode ini jika link tiket hilang atau ingin membuka tiket dari perangkat lain.
            </p>

            <div className="mt-3.5 flex min-w-0 flex-wrap items-center gap-2">
              <code className="max-w-full break-all rounded-xl bg-white px-3.5 py-2 font-mono text-sm font-bold tracking-wide select-all border border-[#dcd6c8] text-stone-900 shadow-2xs">
                {response.recoveryCode}
              </code>
              <button
                className="inline-flex w-full min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--forest)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--forest-deep)] active:scale-95 transition shadow-2xs cursor-pointer sm:w-auto"
                onClick={() => copyRecoveryCode(response.recoveryCode)}
                type="button"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
              <button
                className="inline-flex w-full min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#dcd6c8] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--cream)] active:scale-95 transition shadow-2xs cursor-pointer sm:w-auto"
                onClick={() => sendRecoveryToWA(response.ticketPath, response.recoveryCode)}
                type="button"
                title="Kirim kode dan link tiket ke nomor WA pribadi sebagai backup"
              >
                <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>Simpan ke WA Saya</span>
              </button>
            </div>

            {copyError ? (
              <p className="mt-2.5 text-xs text-[var(--red)]">
                Tidak dapat menyalin otomatis. Silakan salin kode di atas secara manual.
              </p>
            ) : null}
            {copied ? (
              <p className="mt-2.5 text-xs text-[var(--forest)] font-semibold flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Kode pemulihan tersalin ke papan klip! Simpan di catatan atau kirim ke diri sendiri.</span>
              </p>
            ) : null}
            {waShared ? (
              <p className="mt-2.5 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Tautan dan kode tiket telah dibuka untuk disimpan ke WhatsApp.</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Konfirmasi Simpan & Tombol Aksi */}
        {!codeSaved ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-stone-800">
            <input
              id="confirm-saved"
              type="checkbox"
              checked={codeSaved}
              onChange={(e) => setCodeSaved(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-[var(--forest)] cursor-pointer"
            />
            <label htmlFor="confirm-saved" className="cursor-pointer select-none leading-relaxed">
              <strong>Saya sudah menyalin atau menyimpan kode pemulihan di atas.</strong>
              {" "}Saya mengerti bahwa kode ini diperlukan jika ingin membuka tiket dari perangkat lain.
            </label>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <a
            className={`flex-1 min-h-12 inline-flex items-center justify-center rounded-xl px-5 text-sm font-semibold !text-white visited:!text-white hover:!text-white focus:!text-white shadow-sm transition active:scale-95 text-center ${
              codeSaved
                ? "bg-[var(--forest)] hover:bg-[var(--forest-deep)] cursor-pointer"
                : "bg-stone-400 hover:bg-stone-500 opacity-80 cursor-pointer"
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
            <span>Buka Halaman Tiket →</span>
          </a>
          <button
            className="min-h-12 rounded-xl border border-[#dcd6c8] bg-white px-5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--cream)] transition active:scale-95 text-center cursor-pointer"
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
      <div className="rounded-2xl border border-[#ded8cb] bg-emerald-50/25 p-4 sm:p-5">
        <label className="mb-2.5 block text-sm font-bold text-[var(--ink)]">
          1. Kategori Profil Pendaftar
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition active:scale-[0.99] ${
              participantType === "MAHASISWA_ALUMNI"
                ? "border-[var(--forest)] bg-white shadow-sm ring-2 ring-[var(--forest)]/20"
                : "border-[#d8d3c8] bg-white/80 hover:bg-white hover:border-[#b8b0a2]"
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
              <span className="block mt-0.5 text-xs text-[#526358] leading-relaxed">
                Untuk mahasiswa aktif atau alumni (baik dari UNNES maupun luar UNNES).
              </span>
            </div>
          </label>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition active:scale-[0.99] ${
              participantType === "UMUM"
                ? "border-[var(--forest)] bg-white shadow-sm ring-2 ring-[var(--forest)]/20"
                : "border-[#d8d3c8] bg-white/80 hover:bg-white hover:border-[#b8b0a2]"
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
              <span className="block mt-0.5 text-xs text-[#526358] leading-relaxed">
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
                className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
              />
              <p className="mt-1.5 text-xs text-[#526358] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Masukkan tahun kelulusan Anda (4 digit angka) untuk pendataan jejaring alumni.</span>
              </p>
              {fieldErrors?.graduationYear?.[0] ? (
                <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
                    ? "border-[var(--forest)] bg-white text-[var(--forest)] shadow-sm font-bold ring-2 ring-[var(--forest)]/15"
                    : "border-[#d8d3c8] bg-white/70 text-gray-700 hover:bg-white hover:border-[#b8b0a2]"
                }`}
              >
                <input
                  type="radio"
                  name="campusType"
                  value="UNNES"
                  checked={campusType === "UNNES"}
                  onChange={() => setCampusType("UNNES")}
                  className="accent-[var(--forest)] cursor-pointer"
                />
                UNNES (Univ. Negeri Semarang)
              </label>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-xl border py-2.5 px-3 text-xs sm:text-sm font-semibold transition active:scale-[0.98] ${
                  campusType === "LUAR_UNNES"
                    ? "border-[var(--forest)] bg-white text-[var(--forest)] shadow-sm font-bold ring-2 ring-[var(--forest)]/15"
                    : "border-[#d8d3c8] bg-white/70 text-gray-700 hover:bg-white hover:border-[#b8b0a2]"
                }`}
              >
                <input
                  type="radio"
                  name="campusType"
                  value="LUAR_UNNES"
                  checked={campusType === "LUAR_UNNES"}
                  onChange={() => setCampusType("LUAR_UNNES")}
                  className="accent-[var(--forest)] cursor-pointer"
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
                  className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
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
                  <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
                  className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
                />
                {fieldErrors?.studyProgram?.[0] ? (
                  <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
                  className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
                />
                {fieldErrors?.campusName?.[0] ? (
                  <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
                    className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
                  />
                  {fieldErrors?.faculty?.[0] ? (
                    <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
                    className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
                  />
                  {fieldErrors?.studyProgram?.[0] ? (
                    <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
            className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
            id="fullName"
            maxLength={120}
            name="fullName"
            placeholder="Masukkan nama lengkap Anda"
            required
          />
          {fieldErrors?.fullName?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
            className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
            id="whatsappNumber"
            inputMode="tel"
            name="whatsappNumber"
            placeholder="08xxxxxxxxxx"
            required
            type="tel"
          />
          <p className="mt-1.5 text-xs text-[#526358]">
            Nomor dinormalisasi otomatis ke format Indonesia. Setiap nomor hanya
            untuk satu peserta.
          </p>
          {fieldErrors?.whatsappNumber?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
              className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
            />
            {fieldErrors?.birthPlace?.[0] ? (
              <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
              className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs appearance-none"
            />
            {fieldErrors?.birthDate?.[0] ? (
              <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
            className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
          />
          <p className="mt-1.5 text-xs text-[#526358] leading-relaxed">
            Informasi ini digunakan untuk mempererat tali silaturahmi serta membangun hubungan persaudaraan jangka panjang bagi keluarga besar Kristiani dan Katolik.
          </p>
          {fieldErrors?.churchOrigin?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
            className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
          />
          <p className="mt-1.5 text-xs text-[#526358] leading-relaxed">
            Bagi Bapak/Ibu/Saudara yang tinggal di rumah pribadi, mohon cantumkan alamat lengkap mencakup blok/nomor rumah, kelurahan, kecamatan, kota/kabupaten, dan provinsi. Apabila tinggal di kost atau kontrakan, Anda cukup menuliskan nama kost serta daerah sekitarnya.
          </p>
          {fieldErrors?.domicile?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
            className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
            defaultValue=""
            id="informationSource"
            name="informationSource"
            required
          >
            <option disabled value="">
              Pilih sumber informasi
            </option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="TEMAN_KOMUNITAS_GEREJA">Teman / Komunitas Gereja</option>
          </select>
          {fieldErrors?.informationSource?.[0] ? (
            <p className="mt-1 text-sm text-[var(--red)] font-medium">
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
