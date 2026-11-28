import { timingSafeEqual } from "node:crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { createTicketToken, hashCredential } from "@/lib/ticket-credentials";

const fakeRecoveryCodeHash = hashCredential("invalid-recovery-code");

function credentialsMatch(expectedHash: string, recoveryCode: string) {
  const providedHash = Buffer.from(hashCredential(recoveryCode), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return timingSafeEqual(expected, providedHash);
}

export async function recoverTicket(
  whatsappNumber: string,
  recoveryCode: string,
  prisma: PrismaClient = getPrismaClient(),
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const ticketToken = createTicketToken();

    try {
      const result = await prisma.$transaction(
        async (transaction) => {
          const attendee = await transaction.attendee.findUnique({
            where: { whatsappNumber },
            select: {
              id: true,
              ticketCode: true,
              ticketTokenHash: true,
              recoveryCodeHash: true,
            },
          });

          const expectedHash = attendee?.recoveryCodeHash ?? fakeRecoveryCodeHash;
          const matches = credentialsMatch(expectedHash, recoveryCode);
          if (!attendee || !matches) {
            return false;
          }

          const updated = await transaction.attendee.updateMany({
            where: {
              id: attendee.id,
              ticketTokenHash: attendee.ticketTokenHash,
              recoveryCodeHash: attendee.recoveryCodeHash,
            },
            data: {
              ticketTokenHash: hashCredential(ticketToken),
            },
          });

          if (updated.count !== 1) {
            return false;
          }

          await transaction.adminAuditLog.create({
            data: {
              actor: "peserta",
              action: "ticket-recovered",
              details: { ticketCode: attendee.ticketCode },
            },
          });

          return true;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if (result) {
        return {
          recovered: true as const,
          ticketToken,
        };
      }

      return { recovered: false as const };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        return { recovered: false as const };
      }

      throw error;
    }
  }

  throw new Error("Tidak dapat menerbitkan token tiket baru.");
}
