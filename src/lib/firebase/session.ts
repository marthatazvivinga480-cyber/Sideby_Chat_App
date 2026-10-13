import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "./admin";
export const SESSION_COOKIE = "sideby_session";
export async function sessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const user = await adminAuth().verifySessionCookie(token, true);
    return user.email_verified ? user : null;
  } catch {
    return null;
  }
}
