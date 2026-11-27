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
    url: string;
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

    QRCode.toDataURL(qrData.payload, {
      width: 480,
      margin: 2,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        if (active && qrData.payload) {
          setQrImage({ payload: qrData.payload, url });
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

  const currentQrUrl =
    qrData && qrImage?.payload === qrData.payload ? qrImage.url : null;

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

  const downloadQr = () => {
    if (!currentQrUrl || !qrData) return;
    const a = document.createElement("a");
    a.href = currentQrUrl;
    a.download = `QR-Presensi-${qrData.mode === "DYNAMIC" ? "Dinamis" : "Statis"}.png`;
    a.click();
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
          <div>
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
              <AdminIcon name="pin" style={{ width: 13, height: 13, verticalAlign: -2 }} />{" "}
              {eventLocation || "L4, FEB UNNES"}
            </p>
            <p className="admin-section-note no-print" style={{ marginTop: "0.6rem" }}>
              Mode QR:{" "}
              <strong style={{ color: "#064e3b" }}>
                {qrData
                  ? qrData.mode === "DYNAMIC"
                    ? "Dinamis — berganti tiap 3 menit"
                    : "Statis — untuk banner/cetak"
                  : "Memuat…"}
              </strong>
            </p>
          </div>

          <div className="flex flex-col items-center" style={{ marginTop: "1.1rem" }}>
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

            <div
              className="rounded-lg border border-[var(--a-line)] bg-white p-3"
            >
              {currentQrUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={`QR Presensi ${qrData?.payload ?? ""}`}
                  className="h-56 w-56 object-contain sm:h-72 sm:w-72"
                  height={384}
                  src={currentQrUrl}
                  width={384}
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
              className="admin-card no-print"
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
                      ? "poster/banner yang dipasang di lokasi"
                      : "layar proyektor ini"}
                    .
                  </li>
                </ol>
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
          </div>
        </div>

        <div className="admin-dialog-foot no-print" style={{ justifyContent: "center" }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => void toggleFullscreen()}
            type="button"
          >
            <AdminIcon name="monitor" />
            {isFullscreen ? "Keluar fullscreen" : "Mode proyektor"}
          </button>
          <button
            className="admin-btn admin-btn-ghost"
            disabled={!currentQrUrl}
            onClick={downloadQr}
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
