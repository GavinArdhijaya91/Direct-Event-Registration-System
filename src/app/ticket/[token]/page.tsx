import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import { hashCredential } from "@/lib/ticket-credentials";
import CheckinPanel from "@/app/ticket/checkin-panel";
import WibClock from "@/app/ticket/wib-clock";
import ShareTicketButton from "@/app/ticket/share-ticket-button";
import TicketQrCode from "@/app/ticket/ticket-qr-code";
import RevealObserver from "@/app/reveal-observer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tiket Natal PWK 2026",
  robots: { index: false, follow: false },
};

const categoryLabels = {
  MAHASISWA: "Mahasiswa",
  ALUMNI: "Alumni",
  TAMU_UNDANGAN: "Tamu undangan",
};

type TicketPageProps = {
  params: Promise<{ token: string }>;
};

export default async function TicketPage({ params }: TicketPageProps) {
  const { token } = await params;

  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    notFound();
  }

  const prisma = getPrismaClient();
  const [attendee, settings] = await Promise.all([
    prisma.attendee.findUnique({
      where: { ticketTokenHash: hashCredential(token) },
      select: {
        ticketCode: true,
        fullName: true,
        category: true,
        status: true,
        registeredAt: true,
        checkedInAt: true,
      },
    }),
    prisma.eventSettings.findUnique({
      where: { id: 1 },
      select: {
        eventName: true,
        eventDate: true,
        eventLocation: true,
        checkinOpensAt: true,
        checkinClosesAt: true,
      },
    }),
  ]);

  if (!attendee) {
    notFound();
  }

  const registeredAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(attendee.registeredAt);

  return (
    <main className="ticket-page" data-reveal-root>
      <RevealObserver />
      <div className="mb-3 w-full max-w-[42rem]" data-reveal>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--cream)] hover:text-[var(--forest)] active:scale-[0.98] transition"
        >
          <svg className="w-4 h-4 shrink-0 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
      <article className="ticket-card" data-reveal>
        <div className="border-b border-[var(--line)] pb-5">
          <p className="ticket-event-name">
            {settings?.eventName ?? "Natal PWK 2026"}
          </p>
          <h1 className="ticket-title mt-2">Tiket Peserta</h1>
        </div>
        <div className="ticket-details mt-6 border-y border-[var(--line)] py-6">
          {settings ? (
            <div className="mb-6 grid gap-3 border-b border-[var(--line)] pb-5 text-sm sm:grid-cols-2">
              <div>
                <p className="ticket-label">Tanggal acara</p>
                <p className="ticket-value">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "long",
                    timeZone: "Asia/Jakarta",
                  }).format(settings.eventDate)}
                </p>
              </div>
              <div>
                <p className="ticket-label">Lokasi</p>
                <p className="ticket-value">{settings.eventLocation}</p>
              </div>
            </div>
          ) : null}
          <div>
            <p className="ticket-label">Nama peserta</p>
            <p className="ticket-value mt-1 text-xl">{attendee.fullName}</p>
          </div>
          <div className="mt-5">
            <p className="ticket-label">Kode tiket</p>
            <p className="ticket-code mt-2 font-mono text-2xl sm:text-3xl font-bold tracking-[0.12em] break-all">
              {attendee.ticketCode}
            </p>
          </div>
          <TicketQrCode ticketCode={attendee.ticketCode} />
          <div>
            <p className="ticket-label">Kategori</p>
            <p className="ticket-value">{categoryLabels[attendee.category]}</p>
          </div>
        </div>
        <div
          className={`ticket-status mt-6 rounded-xl border border-[var(--line)] px-4 py-3.5 ${
            attendee.status === "HADIR"
              ? "bg-[var(--moss)] text-[var(--forest-deep)]"
              : "bg-[var(--rose)] text-[var(--red)]"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-80">
            Status kehadiran
          </p>
          <p className="mt-1 font-semibold leading-6">
            {attendee.status === "HADIR"
              ? `Sudah check-in${attendee.checkedInAt ? ` pada ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(attendee.checkedInAt)} WIB.` : "."}`
              : "Belum check-in. Gunakan tombol presensi di bawah saat tiba di lokasi."}
          </p>
        </div>
        {attendee.status === "HADIR" ? (
          <div className="mt-4 rounded-xl bg-[var(--moss)] px-4 py-4 text-[var(--forest-deep)]">
            <p className="font-bold tracking-wide">SUDAH HADIR</p>
            <WibClock />
            <p className="mt-2 text-xs">
              Jam berjalan hanya indikator visual; status dan waktu check-in
              ditetapkan server.
            </p>
          </div>
        ) : null}
        <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
          Tautan ini bersifat pribadi. Siapa pun yang memilikinya dapat membuka
          tiket, jadi simpan dan jangan bagikan ke orang lain.
        </p>
        {attendee.status === "TERDAFTAR" ? (
          <ShareTicketButton ticketCode={attendee.ticketCode} />
        ) : null}
        <p className="mt-3 text-xs text-[var(--muted)]">
          Pendaftaran tercatat pada {registeredAt} WIB.
        </p>
        {attendee.status === "TERDAFTAR" ? (
          <CheckinPanel
            closesAt={settings?.checkinClosesAt?.toISOString() ?? null}
            opensAt={settings?.checkinOpensAt?.toISOString() ?? null}
            ticketToken={token}
          />
        ) : null}
      </article>
    </main>
  );
}
