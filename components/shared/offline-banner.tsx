"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { WifiOff, X } from "lucide-react";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";

/**
 * Slim, non-blocking "you're offline" strip — fixed just below SiteHeader
 * (which is itself `fixed top-0 h-20 z-50`, unmodified by this feature) so
 * it never overlaps or requires any change to the header. Session-only
 * dismiss (plain state, not persisted) since "offline" is a transient
 * condition, unlike AnnouncementBanner's per-announcement localStorage
 * dismissal — it reappears if connectivity drops again later, and
 * auto-clears the instant connectivity returns either way.
 */
export function OfflineBanner() {
  const t = useTranslations("offline");
  const { isOnline } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) setDismissed(false);
  }, [isOnline]);

  if (isOnline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-chrome flex items-center gap-2.5 bg-navy/95 px-4 py-2.5 text-sm text-white shadow-soft backdrop-blur-md sm:justify-center"
      style={{ top: "calc(5rem + env(safe-area-inset-top))" }}
    >
      <WifiOff size={16} className="shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 truncate font-medium sm:flex-none">{t("bannerMessage")}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("bannerDismissLabel")}
        className="shrink-0 rounded-full p-1 transition-colors duration-150 hover:bg-white/15 active:bg-white/25"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
