"use client";

import { useState, useTransition, type FormEvent } from "react";

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

    startTransition(async () => {
      let response: Response;
      try {
        response = await fetch("/api/tickets/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        setMessage("Koneksi gagal. Periksa jaringan lalu coba lagi.");
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
          <a
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--forest)] px-5 font-semibold text-white hover:bg-[var(--forest-deep)] hover:text-white"
            href={ticketPath}
          >
            Buka tiket
          </a>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label
              className="mb-1.5 block text-sm font-semibold"
              htmlFor="recovery-whatsapp"
            >
              Nomor WhatsApp pendaftaran
            </label>
            <input
              autoComplete="tel"
              className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base"
              id="recovery-whatsapp"
              inputMode="tel"
              name="whatsappNumber"
              placeholder="08xxxxxxxxxx"
              required
              type="tel"
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-semibold"
              htmlFor="recovery-code"
            >
              Kode pemulihan
            </label>
            <input
              autoCapitalize="characters"
              autoComplete="off"
              className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 font-mono text-base uppercase tracking-wider text-center sm:text-left"
              id="recovery-code"
              maxLength={32}
              minLength={32}
              name="recoveryCode"
              pattern="[A-Fa-f0-9]{32}"
              placeholder="Contoh: a1b2c3d4..."
              required
              spellCheck={false}
            />
          </div>
          {message ? (
            <p aria-live="polite" className="text-sm leading-6 text-[var(--red)]" role="alert">
              {message}
            </p>
          ) : null}
          <button
            className="group min-h-12 w-full rounded-full bg-gradient-to-r from-[var(--emeral)] to-[var(--forest)] px-6 text-base font-semibold !text-white shadow-md hover:from-[var(--forest)] hover:to-[var(--forest-deep)] hover:!text-white hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Memeriksa data…</span>
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                <span>Pulihkan tiket</span>
                <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-1">→</span>
              </span>
            )}
          </button>
          <p className="text-xs leading-5 text-[var(--muted)]">
            Untuk melindungi data peserta, pesan kegagalan tidak membedakan
            nomor atau kode yang tidak cocok. Pemulihan akan menerbitkan
            tautan baru dan mencabut tautan sebelumnya.
          </p>
        </form>
      )}
    </div>
  );
}
