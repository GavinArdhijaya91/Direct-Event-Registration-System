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
      `🎄 Tiket Natal PWK 2026\n\nLink tiket saya: ${ticketUrl}\n\n📌 Simpan pesan ini. Saat hari acara, buka link ini lalu tekan "Scan QR lokasi" untuk check-in di venue.`,
    );
    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-5 space-y-3">
      <button
        className="min-h-12 w-full rounded-full border border-[var(--forest)] bg-white px-5 font-semibold text-[var(--forest)] shadow-sm hover:bg-[var(--moss)] hover:text-[var(--forest-deep)] active:scale-[0.99] transition sm:w-auto"
        onClick={share}
        type="button"
      >
        💬 Simpan tautan tiket ke WA pribadi
      </button>
      <div className="rounded-xl bg-[var(--blush)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">📌 Cara check-in saat hari-H:</p>
        <ol className="mt-2 list-decimal pl-4 space-y-1">
          <li>Simpan tautan tiket ini ke pesan WA pribadi Anda (tekan tombol di atas).</li>
          <li>Saat tiba di venue, buka kembali pesan WA tersebut dan tekan link tiket.</li>
          <li>Di halaman tiket, tekan <strong>Scan QR lokasi</strong> dan arahkan kamera ke QR yang dipasang panitia.</li>
          <li>
            Jika kamera bermasalah, tunjukkan kode tiket{" "}
            <strong className="font-mono text-[var(--ink)]">
              {ticketCode ?? "EVT-XXXX"}
            </strong>{" "}
            kepada petugas helpdesk untuk check-in manual.
          </li>
        </ol>
        <p className="mt-2 text-xs">
          Tautan ini bersifat pribadi — jangan bagikan ke orang lain karena siapa pun
          yang memilikinya dapat membuka tiket Anda.
        </p>
      </div>
    </div>
  );
}
