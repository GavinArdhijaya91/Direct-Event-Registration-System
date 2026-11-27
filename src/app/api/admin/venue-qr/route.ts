import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-session";
import {
  buildDynamicQrPayload,
  getDynamicQrToken,
  QR_ROTATION_INTERVAL_SECONDS,
} from "@/lib/dynamic-qr";
import { getPrismaClient } from "@/lib/prisma";
import { getQrSigningSecret } from "@/lib/qr-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json(
      { status: "unauthorized", message: "Silakan masuk sebagai admin." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const settings = await getPrismaClient().eventSettings.findUnique({
    where: { id: 1 },
    select: { locationCode: true, qrMode: true },
  });

  if (!settings?.locationCode) {
    return NextResponse.json(
      {
        status: "not-configured",
        message: "Kode lokasi QR belum dikonfigurasi.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const now = Date.now();

  if (settings.qrMode === "DYNAMIC") {
    const secret = getQrSigningSecret();
    const { token, step, secondsRemaining } = getDynamicQrToken(
      secret,
      settings.locationCode,
      now,
    );
    return NextResponse.json(
      {
        status: "available",
        mode: settings.qrMode,
        payload: buildDynamicQrPayload(
          secret,
          settings.locationCode,
          now,
        ),
        token,
        step,
        secondsRemaining,
        rotationSeconds: QR_ROTATION_INTERVAL_SECONDS,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      status: "available",
      mode: settings.qrMode,
      payload: settings.locationCode,
      token: settings.locationCode,
      step: null,
      secondsRemaining: null,
      rotationSeconds: null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
