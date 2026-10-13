import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/lib/firebase/session";
import { z } from "zod";
import { readJson, isSameOrigin } from "@/lib/firebase/request";
export const runtime = "nodejs";
function sameOrigin(request: NextRequest) {
  return isSameOrigin(request.headers.get("origin"), request.url);
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  try {
    const { idToken } = z
      .object({ idToken: z.string().min(10).max(10000) })
      .parse(await readJson(request, 14000));
    const auth = adminAuth();
    const user = await auth.verifyIdToken(idToken, true);
    if (!user.email_verified)
      return NextResponse.json(
        { error: "Verify your email before signing in." },
        { status: 403 },
      );
    if (Date.now() / 1000 - user.auth_time > 300)
      return NextResponse.json(
        { error: "Sign in again to start a fresh session." },
        { status: 401 },
      );
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const session = await auth.createSessionCookie(idToken, { expiresIn });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return response;
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message.startsWith("Add Firebase")
            ? e.message
            : "Could not start the session. Check Firebase Admin configuration and sign in again.",
      },
      { status: 401 },
    );
  }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
