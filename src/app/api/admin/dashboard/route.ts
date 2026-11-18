import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-session";
import { isBulkDeletionWindowOpen } from "@/lib/data-deletion";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json(
      { status: "unauthorized", message: "Silakan masuk sebagai admin." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const prisma = getPrismaClient();
  const [settings, attendees, auditLogs] = await Promise.all([
    prisma.eventSettings.findUnique({ where: { id: 1 } }),
    prisma.attendee.findMany({
      orderBy: { registeredAt: "desc" },
      select: {
        ticketCode: true,
        fullName: true,
        whatsappNumber: true,
        category: true,
        institution: true,
        informationSource: true,
        status: true,
        registeredAt: true,
        checkedInAt: true,
        checkinMethod: true,
      },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        actor: true,
        action: true,
        reason: true,
        details: true,
        createdAt: true,
      },
    }),
  ]);

  if (!settings) {
    return NextResponse.json(
      { status: "unavailable", message: "Konfigurasi acara belum tersedia." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const checkedInCount = attendees.reduce(
    (count, attendee) => count + Number(attendee.status === "HADIR"),
    0,
  );

  return NextResponse.json(
    {
      status: "available",
      settings,
      auditLogs,
      bulkDeletionAllowed: isBulkDeletionWindowOpen(new Date()),
      stats: {
        totalRegistered: settings.registeredCount,
        totalCheckedIn: checkedInCount,
        capacityRemaining: settings.maxCapacity - settings.registeredCount,
      },
      attendees,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
