"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Lock } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { useToast, ToastViewport } from "@/components/shared/toast";
import { updateProfile, changePassword } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import type { Locale } from "@/lib/i18n/config";

const BIO_MAX_LENGTH = 280;

export function ProfilePanel({
  locale,
  userId,
  email,
  initialName,
  initialAvatar,
  initialPhone,
  initialBio,
  hasPassword,
}: {
  locale: Locale;
  userId: string;
  email: string;
  initialName: string;
  initialAvatar: string;
  initialPhone: string;
  initialBio: string;
  hasPassword: boolean;
}) {
  const t = useTranslations("dashboard");
  const [fullName, setFullName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [phone, setPhone] = useState(initialPhone);
  const [bio, setBio] = useState(initialBio);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast, showToast, dismiss } = useToast();
  useUnsavedChangesWarning(dirty);

  function markDirty<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setDirty(true);
    };
  }
  const updateFullName = markDirty(setFullName);
  const updateAvatarUrl = markDirty(setAvatarUrl);
  const updatePhone = markDirty(setPhone);
  const updateBio = markDirty(setBio);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(locale, { fullName, avatarUrl, phone, bio });
      if (!result.ok) {
        setError(result.error ?? t("genericError"));
        showToast("error", result.error ?? t("genericError"));
        return;
      }

      setDirty(false);
      showToast("success", t("profileSavedToast"));

      // profiles is the real source of truth (just written above) — this
      // just mirrors the new name/avatar into auth user_metadata so it
      // fires a USER_UPDATED event, which components/layout/use-header-
      // user.ts is already subscribed to. That's what makes the header's
      // avatar/name update everywhere immediately, with no page refresh.
      try {
        await createClient().auth.updateUser({ data: { full_name: fullName, avatar_url: avatarUrl || null } });
      } catch {
        // Non-fatal: the profile row already saved successfully above.
      }
    });
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold mb-4">{t("profileTitle")}</h2>
      <form onSubmit={onSubmit} className="max-w-lg space-y-5">
        <ImageUploader
          bucket="avatars"
          folder={userId}
          value={avatarUrl}
          onChange={updateAvatarUrl}
          label={t("profilePhotoLabel")}
          rounded="rounded-full"
        />

        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("fullNameLabel")}</label>
          <input
            required
            maxLength={100}
            value={fullName}
            onChange={(e) => updateFullName(e.target.value)}
            className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("emailLabel")}</label>
          <input
            disabled
            value={email}
            className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-ink/5 dark:bg-white/5 px-4 py-2.5 text-sm text-ink/50 dark:text-sand/50"
          />
          <p className="mt-1 text-xs text-ink/40 dark:text-sand/40">{t("emailHint")}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("phoneLabel")}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => updatePhone(e.target.value)}
            placeholder={t("phonePlaceholder")}
            className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-semibold">{t("bioLabel")}</label>
            <span className="text-xs text-ink/40 dark:text-sand/40">
              {bio.length}/{BIO_MAX_LENGTH}
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={BIO_MAX_LENGTH}
            value={bio}
            onChange={(e) => updateBio(e.target.value)}
            placeholder={t("bioPlaceholder")}
            className="w-full resize-none rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {isPending ? t("saving") : t("saveChanges")}
        </button>
      </form>

      <div className="mt-10 max-w-lg border-t border-ink/8 pt-8 dark:border-white/10">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Lock size={16} className="text-primary" /> {t("changePasswordTitle")}
        </h3>
        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <p className="mt-2 text-sm text-ink/55 dark:text-sand/60">{t("googleOnlyPasswordNote")}</p>
        )}
      </div>

      <ToastViewport toast={toast} onDismiss={dismiss} />
    </div>
  );
}

function ChangePasswordForm() {
  const t = useTranslations("dashboard");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(t("passwordMinLengthError"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatchError"));
      return;
    }

    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword);
      if (!result.ok) {
        setError(result.error ?? t("genericError"));
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <input
        required
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder={t("currentPasswordPlaceholder")}
        className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <input
        required
        type="password"
        autoComplete="new-password"
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder={t("newPasswordPlaceholder")}
        className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <input
        required
        type="password"
        autoComplete="new-password"
        minLength={8}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder={t("confirmNewPasswordPlaceholder")}
        className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
      />

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{t("passwordChangedSuccess")}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 dark:border-white/20 px-6 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {isPending ? t("saving") : t("changePasswordButton")}
      </button>
    </form>
  );
}
