import { NextResponse, type NextRequest } from "next/server";
// Optimistic gate. Server pages and every API mutation verify the signed session.
export function proxy(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    !request.cookies.get("sideby_session")?.value
  )
    return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/chat/:path*", "/onboarding/:path*"] };
