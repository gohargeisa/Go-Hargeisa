"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { updateProfile } from "@/lib/actions/profile";
import type { Locale } from "@/lib/i18n/config";

export function ProfilePanel({
  locale,
  userId,
  email,
  initialName,
  initialAvatar,
}: {
  locale: Locale;
  userId: string;
  email: string;
  initialName: string;
  initialAvatar: string;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfile(locale, { fullName, avatarUrl });
      if (result.ok) {
        setSaved(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold mb-4">Profile</h2>
      <form onSubmit={onSubmit} className="max-w-sm space-y-5">
        <ImageUploader
          bucket="avatars"
          folder={userId}
          value={avatarUrl}
          onChange={setAvatarUrl}
          label="Profile photo"
          rounded="rounded-full"
        />

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Email</label>
          <input
            disabled
            value={email}
            className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-ink/5 dark:bg-white/5 px-4 py-2.5 text-sm text-ink/50 dark:text-sand/50"
          />
          <p className="mt-1 text-xs text-ink/40 dark:text-sand/40">
            Contact support to change your account email.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {isPending ? "Saving…" : saved ? "Saved" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
