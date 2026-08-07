"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Lock, Loader2, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { SettingsSection } from "@/components/dashboard/settings-section";
import { SecondaryButton } from "@/components/shared/buttons";
import { useToast, ToastViewport } from "@/components/shared/toast";
import { changePassword } from "@/lib/actions/profile";
import { deleteAccount } from "@/lib/actions/account-settings";
import { createClient } from "@/lib/supabase/client";
import { clearOfflineFavorites } from "@/lib/offline/favorites-store";
import type { Locale } from "@/lib/i18n/config";

/** Everything account-security-related, consolidated from what used to be
 * split across ProfilePanel (password) and SettingsPanel (sign-out-all /
 * delete account) — no new backend, just a clearer home for it. */
export function SecurityPanel({ locale, hasPassword }: { locale: Locale; hasPassword: boolean }) {
  const t = useTranslations("dashboard");
  const { toast, showToast, dismiss } = useToast();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold">{t("securityTitle")}</h2>
        <p className="mt-1 text-sm text-ink/55 dark:text-sand/60">{t("securitySubtitle")}</p>
      </div>

      <SettingsSection icon={Lock} title={t("changePasswordTitle")}>
        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <p className="text-sm text-ink/55 dark:text-sand/60">{t("googleOnlyPasswordNote")}</p>
        )}
      </SettingsSection>

      <SettingsSection icon={ShieldCheck} title={t("activeSessionsTitle")}>
        <p className="text-sm leading-relaxed text-ink/60 dark:text-sand/65">{t("activeSessionsHint")}</p>
        <div className="mt-4">
          <SignOutAllDevicesButton locale={locale} />
        </div>
      </SettingsSection>

      <SettingsSection icon={AlertTriangle} title={t("dangerZoneTitle")} tone="danger">
        <DeleteAccountSection locale={locale} showToast={showToast} />
      </SettingsSection>

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
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
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

      <SecondaryButton type="submit" disabled={isPending}>
        {isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        {isPending ? t("saving") : t("changePasswordButton")}
      </SecondaryButton>
    </form>
  );
}

function SignOutAllDevicesButton({ locale }: { locale: Locale }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      // scope: "global" revokes every refresh token for this user, not just
      // the current browser's session — the "sign out all devices" case
      // regular sign-out (scope: "local", the default) doesn't cover.
      await createClient().auth.signOut({ scope: "global" });
      await clearOfflineFavorites();
      router.push(`/${locale}`);
      router.refresh();
    });
  }

  return (
    <SecondaryButton onClick={onClick} disabled={isPending}>
      {isPending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <LogOut size={14} aria-hidden="true" />}
      {t("signOutAllDevices")}
    </SecondaryButton>
  );
}

function DeleteAccountSection({
  locale,
  showToast,
}: {
  locale: Locale;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(confirmationText);
      if (!result.ok) {
        setError(result.error ?? t("genericError"));
        return;
      }
      showToast("success", t("accountDeletedToast"));
      await createClient().auth.signOut();
      await clearOfflineFavorites();
      router.push(`/${locale}`);
      router.refresh();
    });
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-ink/70 dark:text-sand/70">{t("deleteAccountWarning")}</p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/40 px-5 py-2.5 text-sm font-semibold text-red-600 transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-red-500/10 dark:text-red-400"
        >
          <Trash2 size={15} aria-hidden="true" /> {t("deleteAccountButton")}
        </button>
      ) : (
        <div className="mt-4 space-y-3 rounded-xl2 border border-red-500/25 bg-white p-4 dark:bg-ink">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{t("deleteAccountConfirmPrompt")}</p>
          <input
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="DELETE"
            className="w-full max-w-xs rounded-xl border border-ink/12 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-red-500 dark:border-white/15"
          />
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending || confirmationText.trim().toUpperCase() !== "DELETE"}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {t("deleteAccountConfirmButton")}
            </button>
            <SecondaryButton
              onClick={() => {
                setConfirming(false);
                setConfirmationText("");
                setError(null);
              }}
            >
              {t("cancel")}
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
