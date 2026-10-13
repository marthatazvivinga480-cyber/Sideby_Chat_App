import { redirect } from "next/navigation";
import { sessionUser } from "@/lib/firebase/session";
import { ProfileForm } from "@/components/profile-form";
export const runtime = "nodejs";
export default async function Page() {
  const user = await sessionUser();
  if (!user) redirect("/login");
  return (
    <main className="center">
      <div className="onboarding">
        <span className="brand">
          sideby<span>✳</span>
        </span>
        <h1>Set up your profile.</h1>
        <p className="muted">
          Your username helps people find you. Your email stays private.
        </p>
        <ProfileForm
          profile={{ id: user.uid, display_name: "", username: "", bio: "" }}
        />
      </div>
    </main>
  );
}
