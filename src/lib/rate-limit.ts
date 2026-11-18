import { createHmac } from "node:crypto";
import { getPrismaClient } from "@/lib/prisma";

type RateLimitConfig = {
  limit: number;
  windowMilliseconds: number;
  blockMilliseconds: number;
};

function requestAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const address = forwardedFor?.split(",")[0]?.trim();
  return address || request.headers.get("x-real-ip") || "unknown";
}

export function rateLimitKey(scope: string, request: Request) {
  return hashRateLimitIdentity(`${scope}:${requestAddress(request)}`);
}

export function hashRateLimitIdentity(identity: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("ADMIN_SESSION_SECRET harus diatur dengan minimal 32 byte acak.");
  }
  return createHmac("sha256", secret).update(identity).digest("hex");
}

export async function consumeRateLimit(
  key: string,
  config: RateLimitConfig,
) {
  const prisma = getPrismaClient();
  await prisma.rateLimit.deleteMany({
    where: {
      updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });
  const rows = await prisma.$queryRaw<
    Array<{ blocked: boolean }>
  >`
    INSERT INTO "batas_permintaan" (
      "kunci",
      "percobaan",
      "mulai_jendela",
      "diblokir_sampai",
      "diperbarui_pada"
    )
    VALUES (${key}, 1, now(), NULL, now())
    ON CONFLICT ("kunci") DO UPDATE SET
      "percobaan" = CASE
        WHEN "batas_permintaan"."diblokir_sampai" > now()
          THEN "batas_permintaan"."percobaan"
        WHEN "batas_permintaan"."mulai_jendela"
          <= now() - (${config.windowMilliseconds} * interval '1 millisecond')
          THEN 1
        ELSE "batas_permintaan"."percobaan" + 1
      END,
      "mulai_jendela" = CASE
        WHEN "batas_permintaan"."diblokir_sampai" > now()
          THEN "batas_permintaan"."mulai_jendela"
        WHEN "batas_permintaan"."mulai_jendela"
          <= now() - (${config.windowMilliseconds} * interval '1 millisecond')
          THEN now()
        ELSE "batas_permintaan"."mulai_jendela"
      END,
      "diblokir_sampai" = CASE
        WHEN "batas_permintaan"."diblokir_sampai" > now()
          THEN "batas_permintaan"."diblokir_sampai"
        WHEN "batas_permintaan"."mulai_jendela"
          <= now() - (${config.windowMilliseconds} * interval '1 millisecond')
          THEN NULL
        WHEN "batas_permintaan"."percobaan" + 1 >= ${config.limit}
          THEN now() + (${config.blockMilliseconds} * interval '1 millisecond')
        ELSE NULL
      END,
      "diperbarui_pada" = now()
    RETURNING ("diblokir_sampai" > now()) AS blocked
  `;

  return rows[0]?.blocked === true;
}
