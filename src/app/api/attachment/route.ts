import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminBucket } from "@/lib/firebase/admin";
import { sessionUser } from "@/lib/firebase/session";
import { requireMember, RequestError } from "@/lib/firebase/authorization";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const user = await sessionUser();
    if (!user) throw new RequestError("Sign in again.", 401);
    const path = request.nextUrl.searchParams.get("path") ?? "";
    if (
      !/^conversations\/[a-f0-9]{64}\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}$/.test(path)
    )
      throw new RequestError("Invalid file path.");
    const room = path.split("/")[1];
    requireMember(
      (await adminDb().doc(`conversations/${room}`).get()).data(),
      user.uid,
    );
    const [url] = await adminBucket()
      .file(path)
      .getSignedUrl({
        action: "read",
        expires: Date.now() + 60000,
        responseDisposition: "attachment",
      });
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof RequestError
            ? e.message
            : "Could not download this file.",
      },
      { status: e instanceof RequestError ? e.status : 500 },
    );
  }
}
