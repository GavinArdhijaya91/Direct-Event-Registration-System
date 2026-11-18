import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession, hasSameOrigin } from "@/lib/admin-session";
import { getCheckinWindowStatus } from "@/lib/checkin-window";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";

const manualCheckinSchema = z.object({
  ticketCode: z
    .string()
    .trim()
    .transform((val) => {
      const upper = val.toUpperCase();
      const match = upper.match(/EVT-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}/);
      return match ? match[0] : upper;
    })
    .pipe(z.string().regex(/^EVT-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/, "Format kode tiket harus EVT-XXXX")),
});

export async function POST(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json(
      { status: "unauthorized", message: "Silakan masuk sebagai admin." },
      { status: 401 },
    );
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { status: "forbidden", message: "Permintaan tidak diizinkan." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "invalid", message: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = manualCheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalid", message: "Kode tiket tidak valid." },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();
  const result = await prisma.$transaction(async (transaction) => {
    const now = new Date();
    const settings = await transaction.eventSettings.findUnique({
      where: { id: 1 },
      select: { checkinOpensAt: true, checkinClosesAt: true },
    });
    const windowStatus = getCheckinWindowStatus(
      now,
      settings?.checkinOpensAt ?? null,
      settings?.checkinClosesAt ?? null,
    );
    if (windowStatus !== "open") {
      return {
        status:
          windowStatus === "not-configured"
            ? ("not-configured" as const)
            : windowStatus === "not-open"
              ? ("not-open" as const)
            : ("outside-window" as const),
      };
    }

    const attendee = await transaction.attendee.findUnique({
      where: { ticketCode: parsed.data.ticketCode },
      select: { id: true, status: true, checkedInAt: true },
    });
    if (!attendee) {
      return { status: "not-found" as const };
    }

    if (attendee.status === "HADIR" && attendee.checkedInAt) {
      await transaction.adminAuditLog.create({
        data: {
          action: "manual-checkin-already-present",
          details: { ticketCode: parsed.data.ticketCode },
        },
      });
      return {
        status: "already-checked-in" as const,
        checkedInAt: attendee.checkedInAt,
      };
    }

    const updated = await transaction.attendee.updateMany({
      where: { id: attendee.id, status: "TERDAFTAR" },
      data: {
        status: "HADIR",
        checkedInAt: now,
        checkinMethod: "MANUAL_ADMIN",
      },
    });

    if (updated.count !== 1) {
      const latest = await transaction.attendee.findUnique({
        where: { id: attendee.id },
        select: { status: true, checkedInAt: true },
      });
      if (latest?.status === "HADIR" && latest.checkedInAt) {
        await transaction.adminAuditLog.create({
          data: {
            action: "manual-checkin-already-present",
            details: { ticketCode: parsed.data.ticketCode },
          },
        });
        return {
          status: "already-checked-in" as const,
          checkedInAt: latest.checkedInAt,
        };
      }
      return { status: "conflict" as const };
    }

    await transaction.adminAuditLog.create({
      data: {
        action: "manual-checkin",
        details: { ticketCode: parsed.data.ticketCode },
      },
    });

    return { status: "checked-in" as const, checkedInAt: now };
  });

  if (result.status === "outside-window" || result.status === "not-open") {
    return NextResponse.json(
      {
        status: result.status,
        message:
          result.status === "not-open"
            ? "Check-in belum dibuka."
            : "Waktu check-in sudah berakhir.",
      },
      { status: 409 },
    );
  }
  if (result.status === "not-configured") {
    return NextResponse.json(
      { status: result.status, message: "Jadwal check-in belum dikonfigurasi." },
      { status: 503 },
    );
  }
  if (result.status === "not-found") {
    return NextResponse.json(
      { status: result.status, message: "Kode tiket tidak ditemukan." },
      { status: 404 },
    );
  }
  if (result.status === "conflict") {
    return NextResponse.json(
      { status: result.status, message: "Status peserta berubah. Muat ulang dashboard." },
      { status: 409 },
    );
  }
  if (!("checkedInAt" in result) || !result.checkedInAt) {
    return NextResponse.json(
      { status: "unavailable", message: "Hasil check-in tidak lengkap." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      status: result.status,
      checkedInAt: result.checkedInAt.toISOString(),
      message:
        result.status === "checked-in"
          ? "Check-in manual berhasil."
          : "Peserta sudah check-in sebelumnya.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
