import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { hasAdminSession, hasSameOrigin } from "@/lib/admin-session";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deleteAttendeeSchema = z.object({
  ticketCode: z.string().regex(/^EVT-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/),
  reason: z.string().trim().min(1).max(500),
});

export async function POST(request: Request) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json(
      { status: "unauthorized", message: "Silakan masuk sebagai admin." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { status: "forbidden", message: "Permintaan tidak diizinkan." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "invalid", message: "Format permintaan tidak valid." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = deleteAttendeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalid", message: "Kode tiket dan alasan wajib diisi." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const prisma = getPrismaClient();
  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const attendee = await transaction.attendee.findUnique({
          where: { ticketCode: parsed.data.ticketCode },
          select: { id: true },
        });
        if (!attendee) {
          return { status: "not-found" as const };
        }

        const updatedSettings = await transaction.eventSettings.updateMany({
          where: { id: 1, registeredCount: { gt: 0 } },
          data: { registeredCount: { decrement: 1 } },
        });
        if (updatedSettings.count !== 1) {
          return { status: "unavailable" as const };
        }

        const deleted = await transaction.attendee.deleteMany({
          where: { id: attendee.id },
        });
        if (deleted.count !== 1) {
          throw new Error("Peserta berubah saat penghapusan berlangsung.");
        }

        await transaction.adminAuditLog.create({
          data: {
            action: "attendee-deleted",
            reason: parsed.data.reason,
            details: { ticketCode: parsed.data.ticketCode },
          },
        });

        return { status: "deleted" as const };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (result.status === "not-found") {
      return NextResponse.json(
        { status: result.status, message: "Peserta tidak ditemukan." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (result.status === "unavailable") {
      return NextResponse.json(
        {
          status: result.status,
          message: "Kuota peserta tidak dapat diperbarui.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { status: "deleted", message: "Data peserta berhasil dihapus." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          status: "conflict",
          message: "Data berubah bersamaan. Refresh dashboard lalu coba lagi.",
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw error;
  }
}
