import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  hasSameOrigin,
  revokeAdminSession,
} from "@/lib/admin-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { status: "forbidden", message: "Permintaan tidak diizinkan." },
      { status: 403 },
    );
  }

  await revokeAdminSession(request);

  const response = NextResponse.json({ status: "logged-out" });
  clearAdminSessionCookie(response);
  return response;
}
