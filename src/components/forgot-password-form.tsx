"use client";
import Link from "next/link";
import { useState } from "react";
import { Asterisk, ArrowLeft } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import { z } from "zod";
import { clientAuth, configured } from "@/lib/firebase/client";

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || sent) return;
    const email = z.email().safeParse(String(new FormData(event.currentTarget).get("email") ?? "").trim());
    if (!email.success) { setError("Enter a valid email address."); return; }
    setBusy(true); setError("");
    try {
      await sendPasswordResetEmail(clientAuth(), email.data);
      setSent(true);
    } catch (error) {
      if (error instanceof FirebaseError && error.code === "auth/user-not-found") setSent(true);
      else if (error instanceof FirebaseError && error.code === "auth/too-many-requests") setError("Too many attempts. Please wait a little and try again.");
      else if (error instanceof FirebaseError && error.code === "auth/network-request-failed") setError("Check your internet connection and try again.");
      else setError("We couldn't send a reset link. Please try again shortly.");
    } finally { setBusy(false); }
  }
  return <main className="auth">
    <aside>
      <Link className="brand" href="/">sideby<span><Asterisk size={30} aria-hidden="true" /></span></Link>
      <h1>A fresh start.<br /><em>Same people.</em></h1>
      <p>Get back to the conversations that matter.</p>
      <div className="auth-flower" aria-hidden="true"><Asterisk size={96} strokeWidth={1.5} /></div>
    </aside>
    <section><div className="auth-box">
      <span className="eyebrow">LET'S GET YOU BACK</span>
      <h2>{sent ? "Check your inbox." : "Forgot your password?"}</h2>
      <p className="muted">{sent ? "If an account uses that email address, you'll receive a link to choose a new password. Check your spam folder too." : "Enter your account email and we'll send you a reset link."}</p>
      {!configured && <p className="notice">Password reset is available once accounts are configured.</p>}
      {sent ? <p className="notice" role="status">Open the link in your email, choose a new password, then return here to sign in.</p> : <form onSubmit={submit} aria-busy={busy}>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required disabled={busy} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={busy || !configured}>{busy ? "Sending..." : "Send reset link"}</button>
      </form>}
      <Link className="demo-link" href="/login"><ArrowLeft size={16} aria-hidden="true" /> Back to sign in</Link>
    </div></section>
  </main>;
}
