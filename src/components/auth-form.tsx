"use client";
import Link from "next/link";
import { Asterisk, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { clientAuth, configured } from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { api } from "@/lib/firebase/api";
import { authSchema, readableError } from "@/lib/validation";
export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const values = authSchema.parse({
        email: f.get("email"),
        password: f.get("password"),
      });
      const auth = clientAuth();
      if (signup) {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password,
        );
        await sendEmailVerification(user, { url: location.origin + "/login" });
        await signOut(auth);
        setNotice("Check your email to verify your account, then sign in.");
      } else {
        const { user } = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password,
        );
        if (!user.emailVerified) {
          await sendEmailVerification(user, {
            url: location.origin + "/login",
          });
          await signOut(auth);
          throw new Error(
            "Verify your email first. We sent you another verification link.",
          );
        }
        await api("session", "POST", { idToken: await user.getIdToken(true) });
        location.assign("/chat");
      }
    } catch (e) {
      setError(readableError(e, "Please try again"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth">
      <aside>
        <Link className="brand" href="/">
          sideby<span><Asterisk size={30} aria-hidden="true" /></span>
        </Link>
        <h1>
          Your people.
          <br />
          Your pace.
          <br />
          <em>Your space.</em>
        </h1>
        <p>
          Good conversations don't need a big stage.
          <br />
          Just a little room to grow.
        </p>
        <div className="auth-flower" aria-hidden="true"><Asterisk size={96} strokeWidth={1.5} /></div>
      </aside>
      <section>
        <div className="auth-box">
          <span className="eyebrow">A LITTLE CLOSER</span>
          <h2>{signup ? "Make yourself at home." : "Welcome back."}</h2>
          <p className="muted">
            {signup
              ? "Create your account and start a conversation."
              : "Pick up right where you left off."}
          </p>
          {!configured && (
            <p className="notice">
              Firebase setup is needed for accounts. The demo is ready to
              explore.
            </p>
          )}
          <form onSubmit={submit}>
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </label>
            <label htmlFor="auth-password">Password</label>
            <div className="auth-password">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                maxLength={128}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
                required
              />
              <button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} aria-controls="auth-password" onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {!signup && <Link className="forgot-link" href="/forgot-password">Forgot password?</Link>}
            <p className="error" role="alert">
              {error}
            </p>
            <p role="status">{notice}</p>
            <button disabled={busy || !configured}>
              {busy ? "One moment..." : signup ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="muted">
            {signup ? "Already have an account?" : "New around here?"}{" "}
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create account"}
            </Link>
          </p>
          <Link className="demo-link" href="/demo">
            Explore the demo <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
