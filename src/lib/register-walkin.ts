import { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import {
  createRecoveryCode,
  createTicketCode,
  createTicketToken,
  hashCredential,
} from "@/lib/ticket-credentials";
import type {
  RegistrationCategory,
  InformationSource,
} from "@/generated/prisma/client";

export type WalkinInput = {
  fullName: string;
  whatsappNumber: string;
  category: RegistrationCategory;
  institution: string;
  informationSource?: InformationSource;
  reason: string;
};

export type WalkinOutcome =
  | {
      status: "registered";
      attendee: {
        ticketCode: string;
        fullName: string;
        status: "HADIR";
        checkedInAt: Date;
      };
    }
  | { status: "already-present"; message: string }
  | { status: "checked-in-existing"; message: string }
  | { status: "unavailable"; message: string };

export async function registerWalkinAttendee(
  input: WalkinInput,
): Promise<WalkinOutcome> {
  const prisma = getPrismaClient();

  const existing = await prisma.attendee.findUnique({
    where: { whatsappNumber: input.whatsappNumber },
    select: {
      id: true,
      ticketCode: true,
      fullName: true,
      status: true,
      checkedInAt: true,
    },
  });

  if (existing) {
    if (existing.status === "HADIR") {
      return {
        status: "already-present",
        message: `Peserta atas nama ${existing.fullName} (${existing.ticketCode}) sudah berstatus HADIR.`,
      };
    }

    const now = new Date();
    await prisma.$transaction(async (transaction) => {
      await transaction.attendee.update({
        where: { id: existing.id },
        data: {
          status: "HADIR",
          checkedInAt: now,
          checkinMethod: "MANUAL_ADMIN",
        },
      });

      await transaction.adminAuditLog.create({
        data: {
          action: "walkin-checkin-existing",
          reason: input.reason,
          details: {
            ticketCode: existing.ticketCode,
            fullName: existing.fullName,
            whatsappNumber: input.whatsappNumber,
          },
        },
      });
    });

    return {
      status: "checked-in-existing",
      message: `Peserta (${existing.ticketCode}) sebelumnya sudah terdaftar dan kini berhasil diabsenkan HADIR.`,
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const ticketToken = createTicketToken();
    const recoveryCode = createRecoveryCode();
    const ticketCode = createTicketCode();
    const now = new Date();

    try {
      return await prisma.$transaction(async (transaction) => {
        const settings = await transaction.eventSettings.findUnique({
          where: { id: 1 },
          select: { id: true, registeredCount: true, maxCapacity: true },
        });

        if (!settings) {
          return {
            status: "unavailable",
            message: "Konfigurasi acara belum tersedia.",
          };
        }

        await transaction.eventSettings.update({
          where: { id: 1 },
          data: { registeredCount: { increment: 1 } },
        });

        await transaction.attendee.create({
          data: {
            ticketCode,
            ticketTokenHash: hashCredential(ticketToken),
            recoveryCodeHash: hashCredential(recoveryCode),
            fullName: input.fullName,
            whatsappNumber: input.whatsappNumber,
            category: input.category,
            institution: input.institution,
            informationSource: input.informationSource ?? "TEMAN_KATING",
            status: "HADIR",
            checkedInAt: now,
            checkinMethod: "MANUAL_ADMIN",
          },
        });

        await transaction.adminAuditLog.create({
          data: {
            action: "walkin-registration-override",
            reason: input.reason,
            details: {
              ticketCode,
              fullName: input.fullName,
              whatsappNumber: input.whatsappNumber,
              category: input.category,
              institution: input.institution,
            },
          },
        });

        return {
          status: "registered",
          attendee: {
            ticketCode,
            fullName: input.fullName,
            status: "HADIR",
            checkedInAt: now,
          },
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Gagal membuat peserta OTS setelah beberapa percobaan.");
}
