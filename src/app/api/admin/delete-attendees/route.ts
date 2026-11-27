import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { hasAdminSession, hasSameOrigin } from "@/lib/admin-session";
import { isBulkDeletionWindowOpen } from "@/lib/data-deletion";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deleteAttendeesSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  confirmation: z.literal("HAPUS SEMUA PESERTA"),
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
  if (!isBulkDeletionWindowOpen(new Date())) {
    return NextResponse.json(
      {
        status: "outside-window",
        message:
          "Penghapusan massal hanya tersedia pada 20 Februari–15 Maret 2027 WIB.",
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
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

  const parsed = deleteAttendeesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "invalid",
        message:
          "Alasan wajib diisi dan konfirmasi harus tepat: HAPUS SEMUA PESERTA.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const prisma = getPrismaClient();
  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const settings = await transaction.eventSettings.findUnique({
          where: { id: 1 },
          select: { id: true },
        });
        if (!settings) {
          return { status: "unavailable" as const };
        }

        const attendeeCount = await transaction.attendee.count();
        if (attendeeCount === 0) {
          return { status: "empty" as const };
        }

        await transaction.eventSettings.update({
          where: { id: 1 },
          data: { registeredCount: 0 },
        });
        const deleted = await transaction.attendee.deleteMany();
        if (deleted.count !== attendeeCount) {
          throw new Error("Jumlah peserta berubah saat penghapusan berlangsung.");
        }

        await transaction.adminAuditLog.create({
          data: {
            action: "attendees-bulk-deleted",
            reason: parsed.data.reason,
            details: { deletedCount: deleted.count },
          },
        });

        return { status: "deleted" as const, count: deleted.count };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (result.status === "unavailable") {
      return NextResponse.json(
        {
          status: result.status,
          message: "Konfigurasi acara belum tersedia.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (result.status === "empty") {
      return NextResponse.json(
        { status: result.status, message: "Tidak ada data peserta untuk dihapus." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        status: "deleted",
        deletedCount: result.count,
        message: `${result.count} data peserta berhasil dihapus.`,
      },
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
