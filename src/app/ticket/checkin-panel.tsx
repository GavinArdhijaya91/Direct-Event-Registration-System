"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { Html5Qrcode } from "html5-qrcode";

export default function CheckinPanel({
  ticketToken,
  opensAt,
  closesAt,
}: {
  ticketToken: string;
  opensAt: string | null;
  closesAt: string | null;
}) {
  const router = useRouter();
  const regionId = `qr-reader-${useId().replaceAll(":", "")}`;
  const [now, setNow] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualCodeInput, setShowManualCodeInput] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const submitLocationCode = useCallback(async (rawLocationCode: string) => {
    let code = rawLocationCode.trim();
    // Jika peserta scan URL berformat ?code=... atau ?locationCode=...
    try {
      if (code.startsWith("http://") || code.startsWith("https://")) {
        const url = new URL(code);
        const extracted = url.searchParams.get("code") || url.searchParams.get("locationCode");
        if (extracted) {
          code = extracted.trim();
        }
      }
    } catch {
      // fallback ke raw string
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketToken, locationCode: code }),
      });
      const body: unknown = await response.json();
      if (
        typeof body !== "object" ||
        body === null ||
        !("message" in body) ||
        typeof body.message !== "string"
      ) {
        setError("Respons check-in tidak dapat dipahami. Silakan coba lagi.");
        return;
      }

      if (
        response.ok ||
        (response.status === 409 &&
          "status" in body &&
          body.status === "already-checked-in")
      ) {
        setMessage(body.message);
        router.refresh();
      } else {
        setError(body.message);
      }
    } catch {
      setError("Check-in gagal dikirim. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }, [router, ticketToken]);

  useEffect(() => {
    const initialTick = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!scanning) {
      return;
    }

    let disposed = false;
    let scanner: Html5Qrcode | null = null;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (disposed) {
          return;
        }
        const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.max(Math.floor(minEdge * 0.72), 160);
          return { width: qrboxSize, height: qrboxSize };
        };

        scanner = new Html5Qrcode(regionId);
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: qrboxFunction },
          (code) => {
            if (!disposed) {
              setScanning(false);
              void submitLocationCode(code);
            }
          },
          () => {},
        );
        if (disposed && scanner.isScanning) {
          await scanner.stop();
        }
      } catch (caught) {
        if (!disposed) {
          setError(
            caught instanceof Error
              ? `Kamera tidak dapat dibuka: ${caught.message}`
              : "Kamera tidak dapat dibuka. Periksa izin kamera browser.",
          );
          setScanning(false);
        }
      }
    }

    void startScanner();
    return () => {
      disposed = true;
      if (scanner?.isScanning) {
        void scanner.stop().catch((caught: unknown) => {
          console.error("Pemindai QR gagal dihentikan dengan normal.", caught);
        });
      }
    };
  }, [regionId, scanning, submitLocationCode]);

  const canCheckIn =
    now >= (opensAt ? new Date(opensAt).getTime() : Number.POSITIVE_INFINITY) &&
    now <= (closesAt ? new Date(closesAt).getTime() : Number.NEGATIVE_INFINITY);

  return (
    <section className="mt-8 border-t border-[var(--line)] pt-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--moss)] text-[var(--forest)] shrink-0">
          <svg className="w-4 h-4 text-[var(--forest)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <h2 className="text-lg font-semibold text-[var(--forest-deep)]">
          Presensi Mandiri di Lokasi
        </h2>
      </div>

      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {opensAt && closesAt
          ? `Check-in dibuka mulai pukul ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(opensAt))} sampai dengan ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(closesAt))} WIB.`
          : "Jadwal check-in belum dikonfigurasi oleh panitia."}
      </p>

      <div className="mt-4 rounded-2xl bg-[var(--cream)] p-4 sm:p-5 border border-[var(--line)] text-xs sm:text-sm text-[var(--ink)]">
        <div className="flex items-center gap-2 font-semibold text-[var(--forest)]">
          <svg className="w-4 h-4 text-[var(--forest)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <p className="font-semibold text-[var(--forest)]">
            Petunjuk Presensi Mandiri
          </p>
        </div>
        <p className="mt-1.5 text-[var(--muted)] leading-relaxed">
          Tekan tombol di bawah untuk membuka pemindai kamera HP, kemudian arahkan kamera ke <strong>QR Code Presensi</strong> yang ditampilkan panitia di layar proyektor panggung atau banner pintu masuk aula.
        </p>
      </div>

      <button
        className="mt-4 min-h-12 w-full rounded-full bg-[var(--forest)] px-6 py-3.5 font-semibold text-white shadow-md hover:bg-[var(--forest-deep)] active:scale-[0.99] transition disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center gap-2 text-sm"
        disabled={!canCheckIn || busy}
        onClick={() => {
          setError(null);
          setMessage(null);
          setScanning(true);
        }}
        type="button"
      >
        {busy ? (
          <span>Memproses presensi…</span>
        ) : scanning ? (
          <span>Kamera aktif, silakan arahkan ke QR proyektor</span>
        ) : (
          <>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Scan QR Presensi di Layar Proyektor / Banner</span>
          </>
        )}
      </button>

      {scanning ? (
        <div className="mt-4">
          <div
            aria-label="Kamera pemindai QR"
            className="overflow-hidden rounded-2xl border-2 border-[var(--forest)] shadow-inner"
            id={regionId}
          />
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Arahkan kamera ke QR Code di layar proyektor atau banner depan ruangan. Jika dibuka dari browser bawaan WhatsApp, ketuk titik tiga lalu pilih &ldquo;Buka di Chrome/Safari&rdquo;.
          </p>
          <button
            className="mt-3 min-h-11 w-full rounded-full border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--cream)] transition"
            onClick={() => setScanning(false)}
            type="button"
          >
            Tutup pemindai kamera
          </button>
        </div>
      ) : null}

      {/* Alternatif Input Kode Manual jika Kamera Silau / Rusak */}
      <div className="mt-4 pt-3 border-t border-[var(--line)]/50 text-center">
        <button
          type="button"
          onClick={() => setShowManualCodeInput(!showManualCodeInput)}
          className="text-xs sm:text-sm font-semibold text-[var(--forest)] underline hover:text-[var(--forest-deep)]"
        >
          {showManualCodeInput
            ? "Tutup input kode manual"
            : "Kamera silau? Ketik kode presensi manual"}
        </button>

        {showManualCodeInput && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) {
                void submitLocationCode(manualCode);
              }
            }}
            className="mt-3 flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ketik kode di layar proyektor"
              className="min-h-11 flex-1 rounded-xl border border-[#d2ccc0] bg-white px-3.5 text-sm font-mono uppercase text-stone-900 placeholder:text-stone-400 hover:border-stone-400 focus:border-[var(--forest)] focus:outline-none focus:ring-4 focus:ring-[var(--forest)]/15 shadow-2xs transition-all"
              disabled={!canCheckIn || busy}
            />
            <button
              type="submit"
              disabled={!canCheckIn || busy || !manualCode.trim()}
              className="min-h-11 rounded-xl bg-gradient-to-r from-[var(--emeral)] to-[var(--forest)] px-5 text-sm font-semibold !text-white shadow-sm hover:from-[var(--forest)] hover:to-[var(--forest-deep)] hover:!text-white hover:shadow active:scale-95 disabled:opacity-50 transition-all"
            >
              Kirim Presensi
            </button>
          </form>
        )}
      </div>

      {message ? (
        <div aria-live="polite" className="mt-4 rounded-xl bg-[var(--moss)] px-4 py-3 text-sm font-semibold text-[var(--forest-deep)] shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--forest)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{message}</span>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-xl bg-[var(--rose)] px-4 py-3 text-sm leading-6 text-[var(--red)] border border-[var(--red)]/20" role="alert">
          <p className="font-semibold">{error}</p>
          <p className="mt-1 text-xs">
            Jika kendala berlanjut, silakan dekati petugas di meja pendaftaran untuk dibantu presensi manual.
          </p>
        </div>
      ) : null}
      {!canCheckIn ? (
        <p className="mt-3 text-xs text-[var(--muted)] text-center">
          Tombol scan presensi hanya aktif pada rentang waktu yang dibuka oleh panitia.
        </p>
      ) : null}
    </section>
  );
}
