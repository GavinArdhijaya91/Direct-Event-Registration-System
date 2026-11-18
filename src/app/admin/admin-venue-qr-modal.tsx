"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  buildDynamicQrPayload,
  getDynamicQrToken,
  QR_ROTATION_INTERVAL_SECONDS,
} from "@/lib/dynamic-qr";

type VenueQrModalProps = {
  isOpen: boolean;
  onClose: () => void;
  locationCode: string;
  eventName: string;
  eventLocation: string;
};

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AdminVenueQrModal({
  isOpen,
  onClose,
  locationCode,
  eventName,
  eventLocation,
}: VenueQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDynamic, setIsDynamic] = useState(true);
  const [now, setNow] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Timer 1 detik untuk hitung mundur rotasi 3 menit
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const initialTick = window.setTimeout(() => setNow(Date.now()), 0);
    if (!isDynamic) {
      return () => window.clearTimeout(initialTick);
    }
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, [isOpen, isDynamic]);

  const activeTimestamp = now || 1;
  const { token, secondsRemaining } = getDynamicQrToken(
    locationCode || "EVENT",
    activeTimestamp,
  );

  const activePayload = isDynamic
    ? buildDynamicQrPayload(locationCode || "EVENT", activeTimestamp)
    : locationCode || "EVENT";

  // Re-generate QR setiap ada perubahan payload / step
  useEffect(() => {
    let active = true;
    if (isOpen && activePayload) {
      QRCode.toDataURL(activePayload, {
        width: 480,
        margin: 2,
        color: {
          dark: "#064e3b",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => {
          if (active) {
            setQrDataUrl(url);
          }
        })
        .catch((err) => console.error("Gagal membuat QR Code Lokasi:", err));
    }
    return () => {
      active = false;
    };
  }, [isOpen, activePayload]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!isOpen) return null;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen tidak didukung atau diblokir:", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR-Presensi-${isDynamic ? "Dinamis" : "Statis"}-${locationCode}.png`;
    a.click();
  };

  const progressPercent = Math.round(
    (secondsRemaining / QR_ROTATION_INTERVAL_SECONDS) * 100,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-qr-title"
    >
      <div
        ref={containerRef}
        className={`relative flex w-full flex-col items-center justify-between rounded-3xl bg-white p-6 sm:p-10 text-center shadow-2xl transition-all ${
          isFullscreen
            ? "h-screen w-screen max-w-none rounded-none justify-center overflow-auto py-8"
            : "max-w-2xl"
        }`}
      >
        {/* Tombol Tutup (sembunyi saat fullscreen mode proyektor) */}
        {!isFullscreen && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--cream)] text-sm font-semibold text-[var(--ink)] hover:bg-white"
            type="button"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        )}

        {/* Header Acara */}
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--moss)] px-3.5 py-1 text-xs font-semibold tracking-wide text-[var(--forest-deep)] uppercase">
            <span>✨</span> Presensi Kehadiran Terpusat
          </div>
          <h2
            id="venue-qr-title"
            className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--forest-deep)]"
          >
            {eventName || "Natal PWK 2026"}
          </h2>
          <p className="mt-1 text-sm sm:text-base font-medium text-[var(--muted)]">
            📍 {eventLocation || "Gedung B6 FBS UNNES"}
          </p>

          {/* Saklar Mode Dinamis vs Statis */}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--cream)] px-3 py-1 text-xs">
            <span className="font-medium text-[var(--muted)]">Rotasi QR (3 Menit):</span>
            <button
              type="button"
              onClick={() => setIsDynamic(!isDynamic)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition ${
                isDynamic
                  ? "bg-[var(--forest)] text-white shadow-xs"
                  : "bg-white text-[var(--ink)] border border-[var(--line)]"
              }`}
            >
              {isDynamic ? "Aktif (Anti Titip Absen)" : "Statis (Banner/Cetak)"}
            </button>
          </div>
        </div>

        {/* Kotak QR Code Proyektor */}
        <div className="my-5 flex flex-col items-center">
          {isDynamic && (
            <div className="mb-3 flex items-center gap-2 rounded-full bg-[var(--moss)] px-4 py-1.5 text-xs font-bold text-[var(--forest-deep)]">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>QR berganti dalam: {formatTimer(secondsRemaining)}</span>
              <span className="text-[10px] opacity-75 font-mono">({progressPercent}%)</span>
            </div>
          )}

          <div className="rounded-3xl border-4 border-[var(--forest)] bg-white p-4 sm:p-6 shadow-xl">
            {qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt={`QR Presensi ${activePayload}`}
                className="h-56 w-56 sm:h-80 sm:w-80 md:h-96 md:w-96 object-contain"
                height={384}
                width={384}
              />
            ) : (
              <div className="flex h-56 w-56 sm:h-80 sm:w-80 items-center justify-center">
                <span className="text-sm text-[var(--muted)] animate-pulse">
                  Menyiapkan QR Presensi…
                </span>
              </div>
            )}
          </div>

          {/* Teks Petunjuk untuk Mahasiswa / Peserta */}
          <div className="mt-4 max-w-md rounded-2xl bg-[var(--cream)] px-4 py-3 border border-[var(--line)]">
            <p className="text-xs sm:text-sm font-semibold text-[var(--ink)]">
              📱 Petunjuk untuk Seluruh Peserta:
            </p>
            <ol className="mt-1.5 text-left text-xs sm:text-sm text-[var(--muted)] space-y-1 list-decimal list-inside">
              <li>Buka halaman tiket di HP Anda masing-masing.</li>
              <li>Klik tombol hijau <strong>&ldquo;Scan QR Lokasi&rdquo;</strong>.</li>
              <li>Arahkan kamera HP ke QR Code di layar proyektor ini.</li>
            </ol>
          </div>

          {/* Kode Alternatif jika kamera peserta silau/buram */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-[var(--muted)]">
            <span>Kamera silau? Cukup ketik kode token di HP:</span>
            <code className="rounded-lg bg-[var(--cream)] px-3 py-1 font-mono font-extrabold text-base text-[var(--forest)] border border-[var(--line)] tracking-wider">
              {isDynamic ? token : locationCode || "(Belum diatur)"}
            </code>
          </div>
        </div>

        {/* Toolbar Kontrol Panitia */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full pt-2">
          <button
            onClick={toggleFullscreen}
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--forest)] px-5 text-xs sm:text-sm font-semibold text-white hover:bg-[var(--forest-deep)] transition shadow-sm active:scale-95"
          >
            <span>{isFullscreen ? "🗗 Keluar Fullscreen" : "🖥️ Mode Proyektor (Fullscreen)"}</span>
          </button>

          <button
            onClick={downloadQr}
            type="button"
            disabled={!qrDataUrl}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-xs sm:text-sm font-semibold text-[var(--ink)] hover:bg-[var(--cream)] transition shadow-sm disabled:opacity-50"
          >
            <span>💾 Unduh Gambar QR</span>
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-xs sm:text-sm font-semibold text-[var(--ink)] hover:bg-[var(--cream)] transition shadow-sm"
          >
            <span>🖨️ Cetak Poster</span>
          </button>

          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-xs sm:text-sm font-semibold text-[var(--red)] hover:bg-[var(--rose)] transition shadow-sm"
            >
              <span>✕ Tutup Layar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
