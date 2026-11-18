"use client";

import { useEffect, useId, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

export default function AdminQrScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const regionId = `admin-qr-${useId().replaceAll(":", "")}`;
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let disposed = false;
    let scanner: Html5Qrcode | null = null;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (disposed) return;
        scanner = new Html5Qrcode(regionId);
        const qrboxFunction = (w: number, h: number) => {
          const min = Math.min(w, h);
          return {
            width: Math.floor(min * 0.72),
            height: Math.floor(min * 0.72),
          };
        };
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: qrboxFunction },
          async (decodedText) => {
            if (disposed || processing) return;
            setProcessing(true);
            setLastResult(decodedText);
            await onScan(decodedText);
            setTimeout(() => setProcessing(false), 2000);
          },
          () => {},
        );
      } catch (err) {
        if (!disposed) {
          setError(
            err instanceof Error
              ? `Kamera gagal dibuka: ${err.message}`
              : "Kamera tidak dapat diakses. Periksa izin kamera browser.",
          );
        }
      }
    }

    void startScanner();
    return () => {
      disposed = true;
      if (scanner?.isScanning) {
        void scanner.stop().catch(() => {});
      }
    };
  }, [onScan, processing, regionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--ink)]">
            📷 Pemindai QR Tiket Peserta
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
            type="button"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Arahkan kamera ke QR tiket peserta di smartphone atau cetakan tiket.
        </p>

        <div
          className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-black"
          id={regionId}
        />

        {lastResult ? (
          <p className="mt-3 text-center font-mono text-xs font-semibold text-[var(--forest)]">
            Terbaca: {lastResult} {processing ? "(Memproses…)" : ""}
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-lg bg-[var(--rose)] p-2.5 text-xs text-[var(--red)]">
            {error}
          </p>
        ) : null}

        <button
          onClick={onClose}
          className="mt-4 min-h-11 w-full rounded-full border border-[var(--line)] bg-gray-50 text-sm font-semibold hover:bg-gray-100"
          type="button"
        >
          Selesai / Tutup Scanner
        </button>
      </div>
    </div>
  );
}
