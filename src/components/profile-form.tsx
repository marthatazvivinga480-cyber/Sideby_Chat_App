"use client";
import { useState } from "react";
import { saveProfile } from "@/lib/firebase/chat";
import { profileSchema, readableError } from "@/lib/validation";
import type { Profile } from "@/lib/types";
export function ProfileForm({
  profile,
  onSave,
  onCancel,
}: {
  profile: Profile;
  onSave?: (p: Profile) => void;
  onCancel?: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = profileSchema.parse(
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      const next = { ...profile, ...values };
      if (profile.id !== "demo-me") {
        await saveProfile(next);
      }
      if (onSave) onSave(next);
      else location.assign("/chat");
    } catch (e) {
      setError(readableError(e, "Could not save profile"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="profile-form" onSubmit={submit} aria-busy={busy}>
      <label>
        Your name
        <input
          name="display_name"
          defaultValue={profile.display_name}
          required
          minLength={2}
          maxLength={60}
        />
      </label>
      <label>
        Username
        <input
          name="username"
          defaultValue={profile.username.toLowerCase()}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => { event.currentTarget.value = event.currentTarget.value.toLowerCase(); }}
          required
          pattern="[a-z0-9_]{3,24}"
          minLength={3}
          maxLength={24}
        />
        <small>3-24 characters: lowercase letters, numbers and underscores.</small>
      </label>
      <label>
        A little about you <span className="optional-label">(optional)</span>
        <textarea name="bio" defaultValue={profile.bio} maxLength={160} placeholder="Share an interest or a little about yourself." rows={3} />
        <small>Up to 160 characters.</small>
      </label>
      <p role="alert" className="error">
        {error}
      </p>
      <div className="profile-actions">
        <button disabled={busy}>{busy ? "Saving..." : "Save profile"}</button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
