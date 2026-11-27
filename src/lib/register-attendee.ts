import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { toDbInformationSource } from "@/lib/information-source";
import { getPrismaClient } from "@/lib/prisma";
import {
  createRecoveryCode,
  createTicketCode,
  createTicketToken,
  hashCredential,
} from "@/lib/ticket-credentials";
import type { RegistrationInput } from "@/lib/registration";

type RegistrationOutcome =
  | { status: "registered"; ticketCode: string; ticketToken: string; recoveryCode: string }
  | { status: "duplicate" }
  | { status: "closed" }
  | { status: "full" }
  | { status: "unavailable" };

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function uniqueConstraintTarget(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;
  return Array.isArray(target) ? target.map(String) : [String(target ?? "")];
}

export async function registerAttendee(
  input: RegistrationInput,
  prisma: PrismaClient = getPrismaClient(),
): Promise<RegistrationOutcome> {
  const existing = await prisma.attendee.findUnique({
    where: { whatsappNumber: input.whatsappNumber },
    select: { id: true },
  });
  if (existing) {
    return { status: "duplicate" };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const ticketToken = createTicketToken();
    const recoveryCode = createRecoveryCode();
    const ticketCode = createTicketCode();

    try {
      return await prisma.$transaction(async (transaction) => {
        const reservation = await transaction.eventSettings.updateMany({
          where: {
            id: 1,
            registrationOpen: true,
            registeredCount: {
              lt: transaction.eventSettings.fields.maxCapacity,
            },
          },
          data: { registeredCount: { increment: 1 } },
        });

        if (reservation.count === 0) {
          const existing = await transaction.attendee.findUnique({
            where: { whatsappNumber: input.whatsappNumber },
            select: { id: true },
          });
          if (existing) {
            return { status: "duplicate" };
          }

          const settings = await transaction.eventSettings.findUnique({
            where: { id: 1 },
            select: { registrationOpen: true, registeredCount: true, maxCapacity: true },
          });

          if (!settings) {
            return { status: "unavailable" };
          }

          if (!settings.registrationOpen) {
            return { status: "closed" };
          }

          return { status: "full" };
        }

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
            informationSource: toDbInformationSource(input.informationSource),
          },
        });

        return {
          status: "registered",
          ticketCode,
          ticketToken,
          recoveryCode,
        };
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const target = uniqueConstraintTarget(error).join(",");
      if (target.includes("whatsappNumber") || target.includes("nomor_wa")) {
        return { status: "duplicate" };
      }

      if (target.includes("ticketCode") || target.includes("kode_tiket")) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Tidak dapat membuat kode tiket unik setelah beberapa percobaan.");
}
