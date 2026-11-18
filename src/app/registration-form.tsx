"use client";

import { useState, useTransition, type FormEvent } from "react";

type FieldErrors = Partial<
  Record<
    "fullName" | "whatsappNumber" | "category" | "institution" | "informationSource",
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
  // Langkah konfirmasi kode pemulihan: harus salin atau akui dulu sebelum buka tiket
  const [codeSaved, setCodeSaved] = useState(false);
  const [category, setCategory] = useState("");

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
        setCategory("");
      }
    });
  }

  async function copyRecoveryCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyError(false);
      // Setelah salin berhasil, tandai bahwa kode sudah disimpan
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

  // Kirim kode pemulihan + link tiket ke chat WA pribadi sendiri
  function sendRecoveryToWA(ticketPath: string, recoveryCode: string) {
    const ticketUrl = new URL(ticketPath, window.location.origin).toString();
    const shareUrl = new URL("https://wa.me/");
    shareUrl.searchParams.set(
      "text",
      `🎄 Tiket Natal PWK 2026\n\nLink tiket: ${ticketUrl}\nKode pemulihan: ${recoveryCode}\n\nSimpan pesan ini. Jika link tiket hilang, gunakan nomor WA dan kode pemulihan ini di halaman pendaftaran.`,
    );
    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
    // Mengirim ke WA pribadi juga dianggap sudah menyimpan
    setCodeSaved(true);
  }

  if (response?.status === "registered") {
    return (
      <div aria-live="polite" className="space-y-5">
        {/* Kotak kode pemulihan — harus interaksi dulu */}
        <div className="rounded-2xl border-2 border-dashed border-[var(--red)] bg-[var(--rose)] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--red)]">
            ⚠️ Simpan kode ini sebelum lanjut — hanya tampil sekali
          </p>
          <h3 className="mt-2 font-semibold text-[var(--red)]">
            Kode pemulihan tiket
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            Jika tautan tiket hilang atau berganti perangkat, gunakan nomor
            WhatsApp dan kode ini untuk memulihkan tiket Anda.
          </p>
          <p className="mt-4 break-all rounded-lg bg-white px-3 py-3 font-mono text-lg font-bold tracking-wide text-[var(--ink)]">
            {response.recoveryCode}
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <button
              className="min-h-11 w-full sm:w-auto rounded-full bg-[var(--forest)] px-5 text-sm font-semibold text-white hover:bg-[var(--forest-deep)] hover:text-white transition"
              onClick={() => void copyRecoveryCode(response.recoveryCode)}
              type="button"
            >
              {copied ? "✓ Kode tersalin" : "Salin kode pemulihan"}
            </button>
            <button
              className="min-h-11 w-full sm:w-auto rounded-full border border-[var(--forest)] bg-white px-5 text-sm font-semibold text-[var(--forest)] hover:bg-[var(--moss)] hover:text-[var(--forest-deep)] transition"
              onClick={() => sendRecoveryToWA(response.ticketPath, response.recoveryCode)}
              type="button"
            >
              💬 Simpan ke WA pribadi saya
            </button>
          </div>

          {copyError ? (
            <p className="mt-2 text-sm text-[var(--red)]">
              Kode tidak dapat disalin otomatis. Salin secara manual kode yang tampil di atas.
            </p>
          ) : null}

          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            <strong>Cara simpan ke WA pribadi:</strong> Tekan tombol di atas
            → WhatsApp terbuka dengan link tiket dan kode pemulihan →
            kirim ke chat <em>Pesan ke Diri Sendiri</em> (Saved Messages) →
            buka kapan saja saat hari-H untuk scan QR lokasi.
          </p>
        </div>

        {/* Konfirmasi sudah simpan → buka tiket */}
        {!codeSaved ? (
          <div className="rounded-xl border border-[var(--line)] bg-white px-4 py-4">
            <p className="text-sm text-[var(--muted)]">
              Setelah menyimpan kode di atas, Anda dapat membuka halaman tiket.
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-3 p-1.5 -ml-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition">
              <input
                checked={codeSaved}
                className="mt-0.5 h-5 w-5 flex-shrink-0 accent-[var(--forest)]"
                onChange={(e) => setCodeSaved(e.target.checked)}
                type="checkbox"
              />
              <span className="text-sm font-semibold text-[var(--ink)] select-none">
                Saya sudah menyimpan kode pemulihan ini dengan aman
              </span>
            </label>
          </div>
        ) : null}

        {/* Kotak sukses + tombol buka tiket — muncul setelah kode disimpan */}
        <div
          className={`rounded-2xl bg-[var(--moss)] p-5 text-[var(--forest-deep)] transition-opacity duration-300 ${
            codeSaved ? "opacity-100" : "opacity-50"
          }`}
        >
          <p className="font-semibold">Pendaftaran berhasil 🎉</p>
          <p className="mt-2 text-sm leading-6">
            Kode tiket:{" "}
            <span className="font-mono font-bold">{response.ticketCode}</span>
          </p>
          <p className="mt-1 text-sm leading-6">
            Buka halaman tiket untuk melihat detail dan melakukan check-in pada
            hari acara dengan scan QR lokasi yang disediakan panitia.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <a
              className={`inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-full bg-[var(--forest)] px-5 font-semibold text-white hover:bg-[var(--forest-deep)] hover:text-white transition ${!codeSaved ? "pointer-events-none opacity-50" : ""}`}
              href={codeSaved ? response.ticketPath : undefined}
              tabIndex={codeSaved ? 0 : -1}
              aria-disabled={!codeSaved}
            >
              Buka tiket saya
            </a>
            <button
              className="min-h-11 w-full sm:w-auto rounded-full border border-[var(--forest)] bg-white px-5 font-semibold text-[var(--forest)] hover:bg-white hover:text-[var(--forest-deep)] disabled:opacity-50 transition"
              disabled={!codeSaved}
              onClick={() => shareTicket(response.ticketPath)}
              type="button"
            >
              Bagikan tautan lewat WhatsApp
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--muted)]">
          Untuk membuka tiket di lain waktu, gunakan tautan yang sudah Anda simpan atau
          pulihkan dengan kode di atas melalui bagian{" "}
          <a className="underline" href="#pemulihan">
            Pulihkan Tiket
          </a>{" "}
          di halaman ini.
        </p>
      </div>
    );
  }

  const fieldErrors =
    response?.status === "invalid" ? response.fieldErrors : undefined;
  const statusMessage =
    response && response.status !== "invalid"
      ? response.message ??
        (response.status === "duplicate"
          ? "Nomor WhatsApp ini sudah terdaftar. Gunakan nomor tersebut bersama kode pemulihan untuk membuka tiket."
          : response.status === "full"
            ? "Kuota pendaftaran telah terpenuhi."
            : response.status === "closed"
              ? "Pendaftaran sedang ditutup."
              : "Layanan pendaftaran belum tersedia.")
      : null;

  return (
    <form className="space-y-4" onSubmit={submitRegistration}>
      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="fullName">
          Nama lengkap
        </label>
        <input
          autoComplete="name"
          className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base"
          id="fullName"
          maxLength={120}
          name="fullName"
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
          className="mb-1.5 block text-sm font-semibold"
          htmlFor="whatsappNumber"
        >
          Nomor WhatsApp
        </label>
        <input
          autoComplete="tel"
          className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base"
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

      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="category">
          Kategori peserta
        </label>
        <select
          className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base"
          id="category"
          name="category"
          onChange={(e) => setCategory(e.target.value)}
          required
          value={category}
        >
          <option disabled value="">
            Pilih kategori
          </option>
          <option value="MAHASISWA">Mahasiswa</option>
          <option value="ALUMNI">Alumni</option>
          <option value="TAMU_UNDANGAN">Tamu undangan</option>
        </select>
        {fieldErrors?.category?.[0] ? (
          <p className="mt-1 text-sm text-[var(--red)]">
            {fieldErrors.category[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-semibold"
          htmlFor="institution"
        >
          Asal atau instansi
        </label>
        <input
          autoComplete="organization"
          className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base"
          id="institution"
          maxLength={120}
          name="institution"
          placeholder={
            category === "MAHASISWA"
              ? "Contoh: FMIPA - Teknik Informatika UNNES"
              : category === "ALUMNI"
                ? "Contoh: Angkatan 2020, Teknik Informatika UNNES"
                : category === "TAMU_UNDANGAN"
                  ? "Contoh: Gereja Bethel, GKI Semarang"
                  : "Nama kampus, gereja/PMK, atau instansi"
          }
          required
        />
        {fieldErrors?.institution?.[0] ? (
          <p className="mt-1 text-sm text-[var(--red)]">
            {fieldErrors.institution[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-semibold"
          htmlFor="informationSource"
        >
          Tahu acara ini dari mana?
        </label>
        <select
          className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base"
          defaultValue=""
          id="informationSource"
          name="informationSource"
          required
        >
          <option disabled value="">
            Pilih sumber informasi
          </option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="GRUP_WA">Grup WhatsApp</option>
          <option value="TEMAN_KATING">Teman/kakak tingkat</option>
          <option value="POSTER_KAMPUS">Poster kampus</option>
          <option value="GEREJA_PMK">Gereja/PMK</option>
        </select>
        {fieldErrors?.informationSource?.[0] ? (
          <p className="mt-1 text-sm text-[var(--red)]">
            {fieldErrors.informationSource[0]}
          </p>
        ) : null}
      </div>

      {requestError || statusMessage ? (
        <div
          aria-live="polite"
          className="rounded-xl bg-[var(--rose)] px-4 py-3 text-sm leading-6 text-[var(--red)]"
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

      <div className="w-full">
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
        <p className="mt-1.5 text-center text-[11px] text-[var(--muted)]">
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
