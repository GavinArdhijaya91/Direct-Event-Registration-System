import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession, hasSameOrigin } from "@/lib/admin-session";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  eventName: z.string().trim().min(1).max(120),
  eventDate: z.string().date(),
  eventLocation: z.string().trim().min(1).max(120),
  maxCapacity: z.number().int().min(1).max(2_147_483_647),
  registrationOpen: z.boolean(),
  locationCode: z.string().trim().max(100).nullable(),
  checkinOpensAt: z.string().datetime({ offset: true }).nullable(),
  checkinClosesAt: z.string().datetime({ offset: true }).nullable(),
  capacityOverrideReason: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json(
      { status: "unauthorized", message: "Silakan masuk sebagai admin." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
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

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalid", message: "Periksa kembali pengaturan acara." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const eventDate = new Date(`${data.eventDate}T00:00:00.000Z`);
  const opensAt = data.checkinOpensAt ? new Date(data.checkinOpensAt) : null;
  const closesAt = data.checkinClosesAt ? new Date(data.checkinClosesAt) : null;
  if (
    (opensAt === null) !== (closesAt === null) ||
    (opensAt && closesAt && opensAt >= closesAt) ||
    (opensAt && !data.locationCode)
  ) {
    return NextResponse.json(
      {
        status: "invalid",
        message:
          "Atur waktu buka dan tutup check-in secara berpasangan dan pastikan kode lokasi tersedia.",
      },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();
  const result = await prisma.$transaction(async (transaction) => {
    const current = await transaction.eventSettings.findUnique({
      where: { id: 1 },
    });
    if (!current) {
      return { status: "missing" as const };
    }

    if (
      data.maxCapacity !== current.maxCapacity &&
      !data.capacityOverrideReason?.trim()
    ) {
      return { status: "reason-required" as const };
    }

    const updated = await transaction.eventSettings.update({
      where: { id: 1 },
      data: {
        eventName: data.eventName,
        eventDate,
        eventLocation: data.eventLocation,
        maxCapacity: data.maxCapacity,
        registrationOpen: data.registrationOpen,
        locationCode: data.locationCode || null,
        checkinOpensAt: opensAt,
        checkinClosesAt: closesAt,
      },
    });

    await transaction.adminAuditLog.create({
      data: {
        action: "settings-updated",
        reason: data.capacityOverrideReason?.trim() || null,
        details: {
          before: {
            eventName: current.eventName,
            eventDate: current.eventDate.toISOString(),
            eventLocation: current.eventLocation,
            maxCapacity: current.maxCapacity,
            registrationOpen: current.registrationOpen,
            locationCode: current.locationCode,
            checkinOpensAt: current.checkinOpensAt?.toISOString() ?? null,
            checkinClosesAt: current.checkinClosesAt?.toISOString() ?? null,
          },
          after: {
            eventName: updated.eventName,
            eventDate: updated.eventDate.toISOString(),
            eventLocation: updated.eventLocation,
            maxCapacity: updated.maxCapacity,
            registrationOpen: updated.registrationOpen,
            locationCode: updated.locationCode,
            checkinOpensAt: updated.checkinOpensAt?.toISOString() ?? null,
            checkinClosesAt: updated.checkinClosesAt?.toISOString() ?? null,
          },
        },
      },
    });

    return { status: "updated" as const, settings: updated };
  });

  if (result.status === "missing") {
    return NextResponse.json(
      { status: "unavailable", message: "Konfigurasi acara belum tersedia." },
      { status: 503 },
    );
  }
  if (result.status === "reason-required") {
    return NextResponse.json(
      {
        status: "reason-required",
        message: "Alasan wajib diisi setiap kali nilai kuota berubah.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { status: "updated", settings: result.settings },
    { headers: { "Cache-Control": "no-store" } },
  );
}
