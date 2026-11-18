import { NextResponse } from "next/server";
import { z } from "zod";
import { checkInWithTicketToken } from "@/lib/checkin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkinSchema = z.object({
  ticketToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  locationCode: z.string().trim().min(1).max(100),
});

function formatWib(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "invalid", message: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalid", message: "Data check-in tidak valid." },
      { status: 400 },
    );
  }

  const result = await checkInWithTicketToken(
    parsed.data.ticketToken,
    parsed.data.locationCode,
  );

  if (result.status === "checked-in") {
    return NextResponse.json(
      {
        status: "checked-in",
        checkedInAt: result.checkedInAt.toISOString(),
        message: `Check-in berhasil pada ${formatWib(result.checkedInAt)} WIB.`,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (result.status === "already-checked-in") {
    return NextResponse.json(
      {
        status: "already-checked-in",
        checkedInAt: result.checkedInAt.toISOString(),
        message: `Tiket ini sudah digunakan pada ${formatWib(result.checkedInAt)} WIB.`,
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  const messages = {
    "invalid-ticket": "Tiket tidak valid.",
    "invalid-location": "QR lokasi tidak cocok dengan lokasi acara yang aktif.",
    "not-configured": "Jadwal check-in atau kode lokasi belum dikonfigurasi.",
    "not-open": "Check-in belum dibuka.",
    closed: "Waktu check-in sudah berakhir.",
  } as const;
  const status =
    result.status === "not-configured"
      ? 503
      : result.status === "invalid-ticket"
        ? 404
        : 409;

  return NextResponse.json(
    { status: result.status, message: messages[result.status] },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
