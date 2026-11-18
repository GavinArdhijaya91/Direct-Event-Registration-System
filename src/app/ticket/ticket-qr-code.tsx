"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function TicketQrCode({
  ticketCode,
}: {
  ticketCode: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(ticketCode, {
      width: 200,
      margin: 1.5,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error("Gagal membuat QR tiket:", err));
  }, [ticketCode]);

  if (!dataUrl) {
    return (
      <div className="my-4 flex h-36 w-36 items-center justify-center rounded-2xl border border-[var(--line)] bg-gray-50">
        <span className="text-xs text-[var(--muted)]">Memuat QR…</span>
      </div>
    );
  }

  return (
    <div className="my-4 flex flex-col items-center text-center">
      <div className="rounded-2xl border-2 border-[var(--line)] bg-white p-2.5 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`QR Code Tiket ${ticketCode}`}
          className="h-36 w-36 sm:h-40 sm:w-40 object-contain"
          height={160}
          src={dataUrl}
          width={160}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--muted)] max-w-xs">
        Barcode identifikasi tiket (tunjukkan kepada petugas meja bantuan jika Anda memerlukan verifikasi darurat).
      </p>
    </div>
  );
}
