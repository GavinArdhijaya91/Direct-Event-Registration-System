import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { getCheckinWindowStatus } from "@/lib/checkin-window";
import { DEFAULT_INFORMATION_SOURCE } from "@/lib/information-source";
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
  ParticipantType,
  AcademicStatus,
  CampusType,
} from "@/generated/prisma/client";

export type WalkinInput = {
  fullName: string;
  whatsappNumber: string;
  birthPlace: string;
  birthDate: string;
  churchOrigin: string;
  domicile: string;
  participantType: ParticipantType;
  academicStatus?: AcademicStatus | null;
  graduationYear?: string | null;
  campusType?: CampusType | null;
  campusName?: string | null;
  faculty?: string | null;
  studyProgram?: string | null;
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
  | {
      status: "not-configured" | "not-open" | "outside-window";
      message: string;
    }
  | { status: "unavailable"; message: string };

function windowRejection(
  status: Exclude<ReturnType<typeof getCheckinWindowStatus>, "open">,
): Extract<WalkinOutcome, { status: "not-configured" | "not-open" | "outside-window" }> {
  if (status === "not-configured") {
    return {
      status: "not-configured",
      message: "Jadwal check-in belum dikonfigurasi.",
    };
  }
  if (status === "not-open") {
    return { status: "not-open", message: "Check-in belum dibuka." };
  }
  return {
    status: "outside-window",
    message: "Waktu check-in sudah berakhir.",
  };
}

type ExistingAttendee = {
  id: string;
  ticketCode: string;
  fullName: string;
  status: "TERDAFTAR" | "HADIR";
};

async function checkInExistingAttendee(
  existing: ExistingAttendee,
  reason: string,
  now: Date,
  prisma: PrismaClient,
): Promise<WalkinOutcome> {
  if (existing.status === "HADIR") {
    return {
      status: "already-present",
      message: `Peserta atas nama ${existing.fullName} (${existing.ticketCode}) sudah berstatus HADIR.`,
    };
  }

  const checkedIn = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.attendee.updateMany({
      where: { id: existing.id, status: "TERDAFTAR" },
      data: {
        status: "HADIR",
        checkedInAt: now,
        checkinMethod: "MANUAL_ADMIN",
      },
    });

    if (updated.count === 0) {
      return false;
    }

    await transaction.adminAuditLog.create({
      data: {
        action: "walkin-checkin-existing",
        reason,
        details: { ticketCode: existing.ticketCode },
      },
    });

    return true;
  });

  if (!checkedIn) {
    return {
      status: "already-present",
      message: `Peserta (${existing.ticketCode}) sudah berstatus HADIR.`,
    };
  }

  return {
    status: "checked-in-existing",
    message: `Peserta (${existing.ticketCode}) sebelumnya sudah terdaftar dan kini berhasil diabsenkan HADIR.`,
  };
}

export async function registerWalkinAttendee(
  input: WalkinInput,
  prisma: PrismaClient = getPrismaClient(),
  now = new Date(),
): Promise<WalkinOutcome> {
  // OTS setara check-in: jendela tetap diverifikasi server agar tamu tidak
  // ditandai HADIR di luar jadwal yang disetujui.
  const windowSettings = await prisma.eventSettings.findUnique({
    where: { id: 1 },
    select: { checkinOpensAt: true, checkinClosesAt: true },
  });
  const windowStatus = getCheckinWindowStatus(
    now,
    windowSettings?.checkinOpensAt ?? null,
    windowSettings?.checkinClosesAt ?? null,
  );
  if (windowStatus !== "open") {
    return windowRejection(windowStatus);
  }

  const existing = await prisma.attendee.findUnique({
    where: { whatsappNumber: input.whatsappNumber },
    select: {
      id: true,
      ticketCode: true,
      fullName: true,
      status: true,
    },
  });

  if (existing) {
    return checkInExistingAttendee(existing, input.reason, now, prisma);
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const ticketToken = createTicketToken();
    const recoveryCode = createRecoveryCode();
    const ticketCode = createTicketCode();

    try {
      return await prisma.$transaction(async (transaction) => {
        const settings = await transaction.eventSettings.findUnique({
          where: { id: 1 },
          select: {
            id: true,
            registeredCount: true,
            maxCapacity: true,
            checkinOpensAt: true,
            checkinClosesAt: true,
          },
        });

        if (!settings) {
          return {
            status: "unavailable",
            message: "Konfigurasi acara belum tersedia.",
          };
        }

        const txWindowStatus = getCheckinWindowStatus(
          now,
          settings.checkinOpensAt,
          settings.checkinClosesAt,
        );
        if (txWindowStatus !== "open") {
          return windowRejection(txWindowStatus);
        }

        const updatedSettings = await transaction.eventSettings.update({
          where: { id: 1 },
          data: { registeredCount: { increment: 1 } },
          select: { registeredCount: true },
        });

        await transaction.attendee.create({
          data: {
            ticketCode,
            ticketTokenHash: hashCredential(ticketToken),
            recoveryCodeHash: hashCredential(recoveryCode),
            fullName: input.fullName,
            whatsappNumber: input.whatsappNumber,
            birthPlace: input.birthPlace,
            birthDate: input.birthDate,
            churchOrigin: input.churchOrigin,
            domicile: input.domicile,
            participantType: input.participantType,
            academicStatus: input.academicStatus ?? null,
            graduationYear: input.graduationYear ?? null,
            campusType: input.campusType ?? null,
            campusName: input.campusName ?? null,
            faculty: input.faculty ?? null,
            studyProgram: input.studyProgram ?? null,
            category: input.category,
            institution: input.institution,
            informationSource: input.informationSource ?? DEFAULT_INFORMATION_SOURCE,
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
              registeredCountBefore: settings.registeredCount,
              registeredCountAfter: updatedSettings.registeredCount,
              maxCapacity: settings.maxCapacity,
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
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.map(String)
          : [String(error.meta?.target ?? "")];
        const targetString = target.join(",");

        if (
          targetString.includes("whatsappNumber") ||
          targetString.includes("nomor_wa")
        ) {
          const rechecked = await prisma.attendee.findUnique({
            where: { whatsappNumber: input.whatsappNumber },
            select: {
              id: true,
              ticketCode: true,
              fullName: true,
              status: true,
            },
          });
          if (rechecked) {
            return checkInExistingAttendee(rechecked, input.reason, now, prisma);
          }
        }

        if (
          targetString.includes("ticketCode") ||
          targetString.includes("kode_tiket")
        ) {
          continue;
        }
      }

      throw error;
    }
  }

  return {
    status: "unavailable",
    message: "Gagal membuat kode tiket unik untuk peserta OTS.",
  };
}
