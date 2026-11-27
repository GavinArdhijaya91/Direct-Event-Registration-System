"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import AdminIcon from "@/app/admin/admin-icons";

type VenueQrData = {
  status: "available";
  mode: "STATIC" | "DYNAMIC";
  payload: string;
  token: string;
  secondsRemaining: number | null;
  rotationSeconds: number | null;
};

type VenueQrModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  eventLocation: string;
};

function isVenueQrData(value: unknown): value is VenueQrData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;
  return (
    data.status === "available" &&
    (data.mode === "STATIC" || data.mode === "DYNAMIC") &&
    typeof data.payload === "string" &&
    typeof data.token === "string" &&
    (data.secondsRemaining === null ||
      typeof data.secondsRemaining === "number") &&
    (data.rotationSeconds === null ||
      typeof data.rotationSeconds === "number")
  );
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AdminVenueQrModal({
  isOpen,
  onClose,
  eventName,
  eventLocation,
}: VenueQrModalProps) {
  const [qrImage, setQrImage] = useState<{
    payload: string;
    src: string;
  } | null>(null);
  const [qrData, setQrData] = useState<VenueQrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(0);
  const [fetchedAt, setFetchedAt] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const loadVenueQr = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/venue-qr", {
        cache: "no-store",
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !isVenueQrData(body)) {
        const errorBody = body as { message?: unknown } | null;
        setError(
          errorBody &&
            typeof errorBody.message === "string" &&
            errorBody.message.trim()
            ? errorBody.message
            : "QR presensi tidak dapat dimuat.",
        );
        return;
      }
      setQrData(body);
      setFetchedAt(Date.now());
      setNow(Date.now());
      setError(null);
    } catch {
      setError("Koneksi ke layanan QR presensi gagal.");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let active = true;
    const load = async () => {
      if (active) {
        await loadVenueQr();
      }
    };

    void load();
    const refresh = window.setInterval(() => {
      void load();
    }, 15_000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      active = false;
      window.clearInterval(refresh);
      window.clearInterval(tick);
    };
  }, [isOpen, loadVenueQr]);

  useEffect(() => {
    let active = true;
    if (!isOpen || !qrData?.payload) {
      return;
    }

    // SVG dipilih agar QR tetap tajam saat diperbesar untuk cetak poster.
    // Hasilnya dipakai sebagai data URL gambar, bukan HTML mentah.
    QRCode.toString(qrData.payload, {
      type: "svg",
      margin: 2,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((svg) => {
        if (active && qrData.payload) {
          setQrImage({
            payload: qrData.payload,
            src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
          });
        }
      })
      .catch((caught) => console.error("Gagal membuat QR Code Lokasi:", caught));

    return () => {
      active = false;
    };
  }, [isOpen, qrData?.payload]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.fullscreenElement) {
        onCloseRef.current();
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!isOpen) return null;

  const currentQrSrc =
    qrData && qrImage?.payload === qrData.payload ? qrImage.src : null;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (caught) {
      console.warn("Fullscreen tidak didukung atau diblokir:", caught);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadQr = async () => {
    if (!qrData) return;
    try {
      // PNG dibuat hanya saat diunduh, dengan resolusi cetak yang cukup.
      const url = await QRCode.toDataURL(qrData.payload, {
        width: 2000,
        margin: 2,
        color: {
          dark: "#064e3b",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR-Presensi-${qrData.mode === "DYNAMIC" ? "Dinamis" : "Statis"}.png`;
      a.click();
    } catch (caught) {
      console.warn("Gagal mengunduh QR:", caught);
    }
  };

  const secondsRemaining =
    qrData?.secondsRemaining === null || qrData?.secondsRemaining === undefined
      ? null
      : Math.max(
          0,
          qrData.secondsRemaining - Math.floor(Math.max(now - fetchedAt, 0) / 1000),
        );
  const progressPercent =
    secondsRemaining !== null && qrData?.rotationSeconds
      ? Math.round((secondsRemaining / qrData.rotationSeconds) * 100)
      : null;

  return (
    <div className="admin-modal" role="presentation">
      <div
        ref={containerRef}
        aria-labelledby="venue-qr-title"
        aria-modal="true"
        className={`admin-dialog admin-dialog--wide flex flex-col items-center text-center transition-all ${
          isFullscreen
            ? "admin-dialog--fullscreen justify-center overflow-auto py-8"
            : ""
        }`}
        role="dialog"
      >
        {!isFullscreen && (
          <div className="admin-dialog-head no-print" style={{ width: "100%" }}>
            <div>
              <h2 className="admin-dialog-title" id="venue-qr-title">
                <AdminIcon name="monitor" /> QR presensi untuk proyektor
              </h2>
              <p className="admin-dialog-sub">
                Tayangkan layar ini di aula agar peserta memindai satu QR yang
                sama.
              </p>
            </div>
            <button
              aria-label="Tutup QR presensi"
              className="admin-close"
              onClick={onClose}
              type="button"
            >
              <AdminIcon name="close" />
            </button>
          </div>
        )}

        <div className="admin-dialog-body venue-qr-print" style={{ width: "100%" }}>
          {/* Hiasan poster: hanya terlihat pada hasil cetak. */}
          {/* eslint-disable @next/next/no-img-element */}
          <div aria-hidden="true" className="venue-poster-decor">
            <img alt="" className="venue-decor-corner venue-decor-corner--tl" loading="eager" src="/images/natal-holly-sprig.svg" />
            <img alt="" className="venue-decor-corner venue-decor-corner--tr" loading="eager" src="/images/natal-holly-sprig.svg" />
            <img alt="" className="venue-decor-corner venue-decor-corner--bl" loading="eager" src="/images/natal-holly-sprig.svg" />
            <img alt="" className="venue-decor-corner venue-decor-corner--br" loading="eager" src="/images/natal-holly-sprig.svg" />
          </div>
          {/* eslint-enable @next/next/no-img-element */}

          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              aria-hidden="true"
              className="venue-decor-star"
              loading="eager"
              src="/images/christmas/svg/star.svg"
            />
            <p className="admin-kicker" style={{ justifyContent: "center" }}>
              Presensi kehadiran terpusat
            </p>
            <h3
              className="admin-section-title"
              id={isFullscreen ? "venue-qr-title" : undefined}
            >
              {eventName || "Natal PWK 2026"}
            </h3>
            <p className="admin-section-note">
              <span className="venue-location-line">
                <AdminIcon name="pin" style={{ fontSize: "0.85em" }} />
                <span>{eventLocation || "L4, FEB UNNES"}</span>
              </span>
            </p>
            <p className="admin-section-note no-print" style={{ marginTop: "0.6rem" }}>
              Mode QR:{" "}
              <strong style={{ color: "#064e3b" }}>
                {qrData
                  ? qrData.mode === "DYNAMIC"
                    ? "Dinamis — berganti tiap 3 menit"
                    : "Statis — untuk cetak poster"
                  : "Memuat…"}
              </strong>
            </p>
          </div>

          <div className="venue-qr-main flex flex-col items-center" style={{ marginTop: "1.1rem" }}>
            {secondsRemaining !== null ? (
              <div
                className="admin-event-chip no-print"
                style={{ marginBottom: "0.8rem" }}
              >
                <span
                  aria-hidden="true"
                  className="admin-live-dot"
                />
                QR berganti dalam {formatTimer(secondsRemaining)}
                {progressPercent !== null ? ` (${progressPercent}%)` : ""}
              </div>
            ) : null}

            <div className="venue-qr-frame rounded-lg border border-[var(--a-line)] bg-white p-3">
              {currentQrSrc ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={`QR Presensi ${qrData?.payload ?? ""}`}
                  className="venue-qr-code h-56 w-56 sm:h-72 sm:w-72"
                  height={210}
                  src={currentQrSrc}
                  width={210}
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72">
                  <span className="admin-section-note">Menyiapkan QR presensi…</span>
                </div>
              )}
            </div>

            <p className="venue-qr-print-hint">
              Pindai QR ini saat tiba di lokasi acara.
            </p>

            {/* Kaki poster: logo penyelenggara dan tema acara. */}
            {/* eslint-disable @next/next/no-img-element */}
            <div aria-hidden="true" className="venue-poster-footer">
              <img alt="" height={72} loading="eager" src="/images/logos/logo-unnes.png" width={54} />
              <img alt="" height={72} loading="eager" src="/images/logos/logo-pwk.png" width={72} />
              <img alt="" height={72} loading="eager" src="/images/logos/logo-natal-pwk-2026.png" width={72} />
            </div>
            {/* eslint-enable @next/next/no-img-element */}
            <p className="venue-poster-theme">
              Terang Natal menuntun Civitas Akademika di tengah kegelapan
            </p>

            {error ? (
              <div
                className="admin-notice admin-notice--error no-print"
                role="alert"
                style={{ marginTop: "0.9rem", marginBottom: 0 }}
              >
                <AdminIcon name="alert" /> <span>{error}</span>
              </div>
            ) : null}

            <div
              className="venue-qr-guide admin-card no-print"
              style={{ marginTop: "1.1rem", maxWidth: "30rem", textAlign: "left" }}
            >
              <div className="admin-card-body">
                <p className="admin-label">Petunjuk untuk seluruh peserta</p>
                <ol className="admin-guide" style={{ marginTop: "0.4rem" }}>
                  <li>Buka halaman tiket di HP masing-masing.</li>
                  <li>Ketuk tombol hijau &ldquo;Scan QR Lokasi&rdquo;.</li>
                  <li>
                    Arahkan kamera ke QR di{" "}
                    {qrData?.mode === "STATIC"
                      ? "poster yang dipasang di lokasi"
                      : "layar proyektor ini"}
                    .
                  </li>
                </ol>
                <p className="admin-help" style={{ marginTop: "0.6rem" }}>
                  Panitia registrasi: buka QR ini di laptop atau HP masing-masing,
                  lalu tayangkan lewat proyektor atau tunjukkan langsung ke peserta.
                </p>
                {qrData?.mode === "STATIC" ? (
                  <p className="admin-help" style={{ marginTop: "0.6rem" }}>
                    Kamera bermasalah? Tunjukkan kode tiket EVT-XXXX peserta ke
                    panitia untuk dibantu check-in manual.
                  </p>
                ) : (
                  <>
                    <p className="admin-help" style={{ marginTop: "0.6rem" }}>
                      Kamera silau? Ketik 6 karakter token berikut di halaman tiket:
                    </p>
                    <code className="admin-mono" style={{ fontSize: "1rem", fontWeight: 800 }}>
                      {qrData?.token ?? "(Belum diatur)"}
                    </code>
                  </>
                )}
              </div>
            </div>

            <p
              className="venue-qr-tip admin-help no-print"
              style={{ marginTop: "1rem", maxWidth: "30rem", textAlign: "center" }}
            >
              Sebelum mencetak: pada dialog cetak, buka{" "}
              <strong>Setelan lanjutan</strong> lalu hapus centang{" "}
              <strong>Header dan footer</strong> supaya URL dan nomor halaman
              tidak ikut tercetak.
            </p>
          </div>
        </div>

        <div className="admin-dialog-foot no-print" style={{ justifyContent: "center" }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => void toggleFullscreen()}
            type="button"
          >
            <AdminIcon name="monitor" />
            {isFullscreen ? "Keluar layar penuh" : "Mode proyektor"}
          </button>
          <button
            className="admin-btn admin-btn-ghost"
            disabled={!currentQrSrc}
            onClick={() => void downloadQr()}
            type="button"
          >
            <AdminIcon name="download" /> Unduh QR
          </button>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={handlePrint}
            type="button"
          >
            <AdminIcon name="calendar" /> Cetak poster
          </button>
          {isFullscreen ? (
            <button
              className="admin-btn admin-btn-danger"
              onClick={() => void toggleFullscreen()}
              type="button"
            >
              <AdminIcon name="close" /> Tutup layar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
