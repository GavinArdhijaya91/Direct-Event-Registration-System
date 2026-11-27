"use client";

export default function ShareTicketButton({
  ticketCode,
}: {
  ticketCode?: string;
}) {
  function share() {
    const ticketUrl = window.location.href;
    const shareUrl = new URL("https://wa.me/");
    shareUrl.searchParams.set(
      "text",
      `Tiket Natal PWK 2026\n\nLink tiket saya: ${ticketUrl}\n\nSimpan pesan ini. Saat hari acara, buka link ini lalu tekan tombol Scan QR lokasi untuk presensi di venue.`,
    );
    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="py-1">
        <button
          className="min-h-12 w-full rounded-full border-2 border-[var(--forest)] bg-white px-6 py-3.5 text-xs sm:text-sm font-semibold text-[var(--forest)] shadow-sm hover:bg-[var(--moss)] hover:text-[var(--forest-deep)] active:scale-[0.99] transition inline-flex items-center justify-center gap-2.5 text-center leading-normal"
          onClick={share}
          type="button"
        >
          <svg
            className="w-4 h-4 text-emerald-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>Simpan tautan tiket ke WA pribadi</span>
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--candle)]/35 p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-[var(--ink)]">
        <div className="flex items-center gap-2 font-semibold text-[var(--forest-deep)]">
          <svg
            className="w-4 h-4 text-[var(--forest)] shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="font-semibold text-[var(--forest-deep)]">Cara check-in saat hari acara:</p>
        </div>
        <ol className="mt-2.5 list-decimal pl-4 space-y-1.5 text-[var(--muted)]">
          <li>Simpan tautan tiket ini ke pesan WA pribadi Anda dengan menekan tombol di atas.</li>
          <li>Saat tiba di venue acara, buka kembali pesan WA tersebut dan buka link tiket.</li>
          <li>Di halaman tiket, tekan tombol <strong>Scan QR Presensi</strong> dan arahkan kamera ke QR yang ditampilkan panitia.</li>
          <li>
            Jika kamera Anda mengalami kendala, tunjukkan kode tiket{" "}
            <strong className="font-mono text-[var(--forest-deep)] font-bold">
              {ticketCode ?? "EVT-XXXX"}
            </strong>{" "}
            kepada panitia meja bantuan untuk dibantu presensi secara manual.
          </li>
        </ol>
        <p className="mt-3 border-t border-[var(--line)] pt-2.5 text-[11px] text-[var(--muted)]">
          Tautan ini bersifat pribadi dan jangan dibagikan ke orang lain karena siapa pun
          yang memilikinya dapat mengakses tiket Anda.
        </p>
      </div>
    </div>
  );
}
