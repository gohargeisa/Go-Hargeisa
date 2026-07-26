"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { updateUserRole } from "@/lib/actions/users";
import type { Locale } from "@/lib/i18n/config";

export function RoleSelect({
  locale,
  userId,
  role,
}: {
  locale: Locale;
  userId: string;
  role: "user" | "business_owner" | "owner";
}) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as "user" | "business_owner" | "owner";
    startTransition(async () => {
      const result = await updateUserRole(locale, userId, next);
      if (!result.ok) alert(result.error ?? t("couldNotUpdateRole"));
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={onChange}
        disabled={isPending}
        className="rounded-lg border border-ink/12 dark:border-white/15 bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-primary"
      >
        <option value="user">{t("roleUser")}</option>
        <option value="business_owner">{t("roleBusinessOwner")}</option>
        <option value="owner">{t("roleOwner")}</option>
      </select>
      {isPending && <Loader2 size={13} className="animate-spin text-ink/40" />}
    </div>
  );
}
