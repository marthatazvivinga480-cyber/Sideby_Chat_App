import { redirect } from "next/navigation";
import { sessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { ChatWorkspace } from "@/components/chat-workspace";
import type { Profile } from "@/lib/types";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function Page() {
  const user = await sessionUser();
  if (!user) redirect("/login");
  const doc = await adminDb().doc(`profiles/${user.uid}`).get();
  if (!doc.exists) redirect("/onboarding");
  return <ChatWorkspace initialProfile={doc.data() as Profile} />;
}
