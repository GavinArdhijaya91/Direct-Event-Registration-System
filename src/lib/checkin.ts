import { getPrismaClient } from "@/lib/prisma";
import { getCheckinWindowStatus } from "@/lib/checkin-window";
import { hashCredential } from "@/lib/ticket-credentials";
import { verifyLocationCodeForMode } from "@/lib/dynamic-qr";
import { getQrSigningSecret } from "@/lib/qr-secret";

type CheckinResult =
  | { status: "checked-in"; checkedInAt: Date }
  | { status: "already-checked-in"; checkedInAt: Date }
  | { status: "invalid-ticket" | "invalid-location" | "not-configured" | "not-open" | "closed" };

export async function checkInWithTicketToken(
  ticketToken: string,
  locationCode: string,
  now = new Date(),
): Promise<CheckinResult> {
  const prisma = getPrismaClient();

  return prisma.$transaction(
    async (transaction) => {
      const settings = await transaction.eventSettings.findUnique({
        where: { id: 1 },
        select: {
          locationCode: true,
          qrMode: true,
          checkinOpensAt: true,
          checkinClosesAt: true,
        },
      });

      if (!settings?.locationCode) {
        return { status: "not-configured" };
      }

      const windowStatus = getCheckinWindowStatus(
        now,
        settings.checkinOpensAt,
        settings.checkinClosesAt,
      );
      if (windowStatus !== "open") {
        return { status: windowStatus };
      }

      const signingSecret =
        settings.qrMode === "DYNAMIC" ? getQrSigningSecret() : null;
      if (
        !verifyLocationCodeForMode(
          locationCode,
          settings.locationCode,
          settings.qrMode,
          signingSecret,
          now.getTime(),
        )
      ) {
        return { status: "invalid-location" };
      }

      const ticketTokenHash = hashCredential(ticketToken);
      const attendee = await transaction.attendee.findUnique({
        where: { ticketTokenHash },
        select: { id: true, status: true, checkedInAt: true },
      });

      if (!attendee) {
        return { status: "invalid-ticket" };
      }

      if (attendee.status === "HADIR" && attendee.checkedInAt) {
        return {
          status: "already-checked-in",
          checkedInAt: attendee.checkedInAt,
        };
      }

      const checkedInAt = now;
      const updated = await transaction.attendee.updateMany({
        where: { id: attendee.id, status: "TERDAFTAR" },
        data: {
          status: "HADIR",
          checkedInAt,
          checkinMethod: "SCAN_MANDIRI",
        },
      });

      if (updated.count === 1) {
        return { status: "checked-in", checkedInAt };
      }

      const latest = await transaction.attendee.findUnique({
        where: { id: attendee.id },
        select: { status: true, checkedInAt: true },
      });

      if (latest?.status === "HADIR" && latest.checkedInAt) {
        return {
          status: "already-checked-in",
          checkedInAt: latest.checkedInAt,
        };
      }

      return { status: "invalid-ticket" };
    },
  );
}
