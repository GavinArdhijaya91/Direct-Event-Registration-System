import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-session";
import { isBulkDeletionWindowOpen } from "@/lib/data-deletion";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await hasAdminSession(request))) {
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
        birthPlace: true,
        birthDate: true,
        churchOrigin: true,
        domicile: true,
        participantType: true,
        academicStatus: true,
        graduationYear: true,
        campusType: true,
        campusName: true,
        faculty: true,
        studyProgram: true,
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
      { status: "unavailable", message: "Pengaturan acara belum tersedia." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const totalRegistered = attendees.length;
  const totalCheckedIn = attendees.filter(
    (attendee) => attendee.status === "HADIR",
  ).length;
  const capacityRemaining = Math.max(
    0,
    settings.maxCapacity - settings.registeredCount,
  );

  return NextResponse.json(
    {
      settings: {
        eventName: settings.eventName,
        eventDate: settings.eventDate.toISOString(),
        eventLocation: settings.eventLocation,
        maxCapacity: settings.maxCapacity,
        registeredCount: settings.registeredCount,
        registrationOpen: settings.registrationOpen,
        locationCode: settings.locationCode,
        qrMode: settings.qrMode,
        checkinOpensAt: settings.checkinOpensAt?.toISOString() ?? null,
        checkinClosesAt: settings.checkinClosesAt?.toISOString() ?? null,
      },
      stats: {
        totalRegistered,
        totalCheckedIn,
        capacityRemaining,
      },
      bulkDeletionAllowed: isBulkDeletionWindowOpen(new Date()),
      attendees: attendees.map((attendee) => ({
        ticketCode: attendee.ticketCode,
        fullName: attendee.fullName,
        whatsappNumber: attendee.whatsappNumber,
        birthPlace: attendee.birthPlace,
        birthDate: attendee.birthDate,
        churchOrigin: attendee.churchOrigin,
        domicile: attendee.domicile,
        participantType: attendee.participantType,
        academicStatus: attendee.academicStatus,
        graduationYear: attendee.graduationYear,
        campusType: attendee.campusType,
        campusName: attendee.campusName,
        faculty: attendee.faculty,
        studyProgram: attendee.studyProgram,
        category: attendee.category,
        institution: attendee.institution,
        informationSource: attendee.informationSource,
        status: attendee.status,
        registeredAt: attendee.registeredAt.toISOString(),
        checkedInAt: attendee.checkedInAt?.toISOString() ?? null,
        checkinMethod: attendee.checkinMethod,
      })),
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        actor: log.actor,
        action: log.action,
        reason: log.reason,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
