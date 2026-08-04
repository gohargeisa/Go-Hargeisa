"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearOfflineFavorites } from "@/lib/offline/favorites-store";
import type { Locale } from "@/lib/i18n/config";

export function SignOutButton({ locale, className }: { locale: Locale; className?: string }) {
  const t = useTranslations("nav");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      // Prevents the next person on a shared device from reading this
      // user's saved businesses via the offline favorites sheet.
      await clearOfflineFavorites();
      router.push(`/${locale}`);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={className ?? "flex items-center gap-2 text-sm font-medium text-ink/70 dark:text-sand/70 hover:text-red-500"}
    >
      {isPending ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
      {t("signOut")}
    </button>
  );
}
