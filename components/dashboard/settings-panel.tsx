"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  Globe,
  LogOut,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { locales, localeConfig, type Locale } from "@/lib/i18n/config";
import { FlagIcon } from "@/components/shared/flag-icon";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { useToast, ToastViewport } from "@/components/shared/toast";
import { updateNotificationPreferences, deleteAccount } from "@/lib/actions/account-settings";
import { createClient } from "@/lib/supabase/client";

export function SettingsPanel({
  locale,
  email,
  memberSince,
  hasPassword,
  initialNotifyActivity,
  initialNotifyMarketing,
}: {
  locale: Locale;
  email: string;
  memberSince: string;
  hasPassword: boolean;
  initialNotifyActivity: boolean;
  initialNotifyMarketing: boolean;
}) {
  const t = useTranslations("dashboard");
  const { toast, showToast, dismiss } = useToast();

  const memberSinceLabel = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(
    new Date(memberSince)
  );

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-lg font-semibold">{t("settingsTitle")}</h2>
        <p className="mt-1 text-sm text-ink/55 dark:text-sand/60">{t("settingsSubtitle")}</p>
      </div>

      <SettingsSection icon={Mail} title={t("accountSettingsTitle")}>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
              {t("emailLabel")}
            </dt>
            <dd className="mt-1 text-sm">{email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
              {t("signInMethodLabel")}
            </dt>
            <dd className="mt-1 text-sm">{hasPassword ? t("signInMethodEmail") : t("signInMethodGoogle")}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
              {t("memberSinceLabel")}
            </dt>
            <dd className="mt-1 text-sm">{memberSinceLabel}</dd>
          </div>
        </dl>
      </SettingsSection>

      <SettingsSection icon={Globe} title={t("languagePreferencesTitle")}>
        <LanguageOptions locale={locale} />
      </SettingsSection>

      <SettingsSection icon={Check} title={t("notificationPreferencesTitle")}>
        <NotificationToggles
          locale={locale}
          initialNotifyActivity={initialNotifyActivity}
          initialNotifyMarketing={initialNotifyMarketing}
          showToast={showToast}
        />
      </SettingsSection>

      <SettingsSection icon={ShieldCheck} title={t("privacySecurityTitle")}>
        <p className="text-sm leading-relaxed text-ink/60 dark:text-sand/65">
          {hasPassword ? t("privacySecurityPasswordHint") : t("privacySecurityGoogleHint")}
        </p>
        {hasPassword && (
          <Link
            href={`/${locale}/dashboard?tab=profile`}
            className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            {t("goToProfileForPassword")}
          </Link>
        )}
        <p className="mt-3 text-sm leading-relaxed text-ink/60 dark:text-sand/65">
          {t("privacyPolicyHint")}{" "}
          <Link href={`/${locale}/privacy`} className="font-semibold text-primary hover:underline">
            {t("privacyPolicyLink")}
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <SignOutButton locale={locale} className="inline-flex items-center gap-2 rounded-full border border-ink/15 dark:border-white/20 px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary transition-colors" />
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

function SettingsSection({
  icon: Icon,
  title,
  tone = "default",
  children,
}: {
  icon: typeof Mail;
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${
        tone === "danger"
          ? "border-red-500/25 bg-red-500/[0.03] dark:bg-red-500/[0.06]"
          : "border-ink/8 dark:border-white/10"
      }`}
    >
      <h3
        className={`flex items-center gap-2 font-display text-base font-semibold ${
          tone === "danger" ? "text-red-600 dark:text-red-400" : ""
        }`}
      >
        <Icon size={16} className={tone === "danger" ? "text-red-600 dark:text-red-400" : "text-primary"} />
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function LanguageOptions({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || "/");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={l === locale}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            l === locale
              ? "border-primary bg-primary/10 text-primary"
              : "border-ink/12 dark:border-white/15 hover:border-primary/40"
          }`}
        >
          <FlagIcon locale={l} size={16} />
          {localeConfig[l].label}
          {l === locale && <Check size={14} />}
        </button>
      ))}
    </div>
  );
}

function NotificationToggles({
  locale,
  initialNotifyActivity,
  initialNotifyMarketing,
  showToast,
}: {
  locale: Locale;
  initialNotifyActivity: boolean;
  initialNotifyMarketing: boolean;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const t = useTranslations("dashboard");
  const [notifyActivity, setNotifyActivity] = useState(initialNotifyActivity);
  const [notifyMarketing, setNotifyMarketing] = useState(initialNotifyMarketing);
  const [isPending, startTransition] = useTransition();

  function toggle(key: "notifyActivity" | "notifyMarketing", value: boolean) {
    const next = {
      notifyActivity: key === "notifyActivity" ? value : notifyActivity,
      notifyMarketing: key === "notifyMarketing" ? value : notifyMarketing,
    };
    if (key === "notifyActivity") setNotifyActivity(value);
    else setNotifyMarketing(value);

    startTransition(async () => {
      const result = await updateNotificationPreferences(locale, next);
      if (!result.ok) {
        // Revert on failure — never let the UI claim a preference stuck
        // that wasn't actually saved.
        if (key === "notifyActivity") setNotifyActivity(!value);
        else setNotifyMarketing(!value);
        showToast("error", result.error ?? t("genericError"));
        return;
      }
      showToast("success", t("preferencesSavedToast"));
    });
  }

  return (
    <div className="space-y-4">
      <ToggleRow
        label={t("notifyActivityLabel")}
        description={t("notifyActivityDescription")}
        checked={notifyActivity}
        disabled={isPending}
        onChange={(v) => toggle("notifyActivity", v)}
      />
      <ToggleRow
        label={t("notifyMarketingLabel")}
        description={t("notifyMarketingDescription")}
        checked={notifyMarketing}
        disabled={isPending}
        onChange={(v) => toggle("notifyMarketing", v)}
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-ink/50 dark:text-sand/55">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          checked ? "bg-primary" : "bg-ink/15 dark:bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
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
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/40 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 transition-colors dark:text-red-400"
        >
          <Trash2 size={15} /> {t("deleteAccountButton")}
        </button>
      ) : (
        <div className="mt-4 space-y-3 rounded-xl border border-red-500/25 bg-white p-4 dark:bg-ink">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{t("deleteAccountConfirmPrompt")}</p>
          <input
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="DELETE"
            className="w-full max-w-xs rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-red-500"
          />
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending || confirmationText.trim().toUpperCase() !== "DELETE"}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {t("deleteAccountConfirmButton")}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setConfirmationText("");
                setError(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 dark:border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-ink/5 dark:hover:bg-white/5 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
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
      router.push(`/${locale}`);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-full border border-ink/15 dark:border-white/20 px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary transition-colors disabled:opacity-70"
    >
      {isPending ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
      {t("signOutAllDevices")}
    </button>
  );
}
