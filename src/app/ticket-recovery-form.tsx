"use client";

import { useState, useTransition, type FormEvent } from "react";
import { validateRecoveryInput } from "@/lib/ticket-recovery-input";

type RecoveryResponse = {
  status: string;
  ticketPath?: string;
  message?: string;
};

function isRecoveryResponse(value: unknown): value is RecoveryResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("status" in value) ||
    typeof value.status !== "string"
  ) {
    return false;
  }
  return (
    value.status !== "recovered" ||
    ("ticketPath" in value &&
      typeof value.ticketPath === "string" &&
      /^\/ticket\/[A-Za-z0-9_-]{43}$/.test(value.ticketPath))
  );
}

export default function TicketRecoveryForm() {
  const [pending, startTransition] = useTransition();
  const [ticketPath, setTicketPath] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTicketPath(null);
    setMessage(null);

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const input = validateRecoveryInput({
      whatsappNumber: String(payload.whatsappNumber ?? ""),
      recoveryCode: String(payload.recoveryCode ?? ""),
    });

    if (!input.valid) {
      setMessage(input.message);
      return;
    }

    startTransition(async () => {
      let response: Response;
      try {
        response = await fetch("/api/tickets/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            whatsappNumber: input.whatsappNumber,
            recoveryCode: input.recoveryCode,
          }),
        });
      } catch {
        setMessage("Koneksi gagal. Periksa jaringan lalu coba lagi.");
        return;
      }

      if (response.status === 429) {
        setMessage(
          "Terlalu banyak percobaan pemulihan. Tunggu sekitar 15 menit sebelum mencoba lagi.",
        );
        return;
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        setMessage("Layanan pemulihan belum dapat memproses permintaan.");
        return;
      }

      if (!isRecoveryResponse(body)) {
        setMessage("Respons layanan tidak dapat dipahami. Silakan coba lagi.");
        return;
      }

      if (body.status === "recovered" && body.ticketPath) {
        setTicketPath(body.ticketPath);
        form.reset();
        return;
      }

      setMessage(
        body.message ??
          "Data tidak cocok atau pemulihan belum dapat diproses. Periksa nomor dan kode, lalu coba lagi.",
      );
    });
  }

  return (
    <div>
      {ticketPath ? (
        <div aria-live="polite" className="space-y-4">
          <p className="rounded-xl bg-[var(--moss)] px-4 py-3 text-sm leading-6 text-[var(--forest-deep)]">
            Tiket berhasil dipulihkan. Tautan tiket sebelumnya sudah tidak
            berlaku.
          </p>
          <p className="text-sm leading-6 text-[var(--ink)]">
            Kode pemulihan yang Anda masukkan masih berlaku dan tidak perlu
            disimpan ulang. Simpan tautan baru ini; kalau hilang lagi, cukup
            gunakan nomor WhatsApp dan kode pemulihan yang sama.
          </p>
          <a
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--forest)] px-5 font-semibold text-white hover:bg-[var(--forest-deep)] hover:text-white"
            href={ticketPath}
          >
            Buka tiket
          </a>
        </div>
      ) : (
        <form className="space-y-4" noValidate onSubmit={submit}>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--cream)] px-4 py-3 text-sm leading-6 text-[var(--ink)]">
            <p className="font-semibold">Bedakan dua kode ini</p>
            <p className="text-[var(--muted)]">
              Kode tiket <code className="font-mono">EVT-XXXX</code> hanya untuk
              check-in manual. Pemulihan memakai{" "}
              <strong>kode pemulihan 32 karakter</strong> yang muncul sekali
              setelah pendaftaran atau dikirim lewat tombol “Simpan ke WA Saya”.
            </p>
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              htmlFor="recovery-whatsapp"
            >
              Nomor WhatsApp pendaftaran
            </label>
            <input
              autoComplete="tel"
              className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs"
              id="recovery-whatsapp"
              inputMode="tel"
              name="whatsappNumber"
              placeholder="08xxxxxxxxxx"
              required
              type="tel"
            />
            <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
              Pakai nomor yang diisi saat daftar. Boleh diawali 08 atau +62.
            </p>
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              htmlFor="recovery-code"
            >
              Kode pemulihan (32 karakter)
            </label>
            <input
              aria-describedby="recovery-code-help"
              autoCapitalize="characters"
              autoComplete="off"
              className="min-h-12 w-full rounded-xl border border-[#d2ccc0] bg-white px-4 font-mono text-base uppercase tracking-wider text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 transition-all shadow-2xs text-center sm:text-left"
              id="recovery-code"
              maxLength={32}
              name="recoveryCode"
              placeholder="A1B2C3D4E5F60718293A4B5C6D7E8F90"
              required
              spellCheck={false}
            />
            <p
              className="mt-1.5 text-xs leading-5 text-[var(--muted)]"
              id="recovery-code-help"
            >
              Huruf A–F dan angka 0–9, bukan kode EVT-XXXX. Kode ini tetap
              berlaku setelah pemulihan.
            </p>
          </div>
          {message ? (
            <p aria-live="polite" className="text-sm leading-6 text-[var(--red)] font-medium" role="alert">
              {message}
            </p>
          ) : null}
          <button
            className="group min-h-12 w-full rounded-full bg-gradient-to-r from-[var(--emeral)] to-[var(--forest)] px-6 text-base font-semibold !text-white shadow-md hover:from-[var(--forest)] hover:to-[var(--forest-deep)] hover:!text-white hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <span className="inline-flex items-center justify-center gap-2 !text-white">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="!text-white">Memeriksa data…</span>
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 !text-white">
                <span className="!text-white">Pulihkan tiket</span>
                <span aria-hidden="true" className="!text-white transition-transform duration-150 group-hover:translate-x-1">→</span>
              </span>
            )}
          </button>
          <p className="text-xs leading-5 text-[#526358]">
            Nomor WhatsApp saja tidak cukup. Bila kode pemulihan ikut hilang,
            tidak ada pemulihan otomatis — hubungi panitia untuk dibantu.
            Untuk melindungi data peserta, pesan kegagalan tidak membedakan
            nomor atau kode yang tidak cocok. Pemulihan akan menerbitkan
            tautan baru dan mencabut tautan yang sebelumnya. Kode pemulihan
            tidak berubah.
          </p>
        </form>
      )}
    </div>
  );
}
