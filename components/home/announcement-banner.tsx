"use client";

import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
import type { SiteAnnouncement } from "@/types";

const DISMISS_KEY_PREFIX = "gh-announcement-dismissed-";

export function AnnouncementBanner({ announcement }: { announcement: SiteAnnouncement }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = window.localStorage.getItem(`${DISMISS_KEY_PREFIX}${announcement.id}`) === "1";
    setDismissed(wasDismissed);
  }, [announcement.id]);

  function dismiss() {
    window.localStorage.setItem(`${DISMISS_KEY_PREFIX}${announcement.id}`, "1");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="relative flex items-center gap-3 bg-primary px-5 py-3 text-sm text-white sm:justify-center">
      <Megaphone size={16} className="shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 truncate sm:flex-none">
        <span className="font-semibold">{announcement.title}</span>
        <span className="ms-1.5 text-white/85">{announcement.message}</span>
      </p>
      {announcement.linkUrl && (
        <a href={announcement.linkUrl} className="shrink-0 font-semibold underline underline-offset-2">
          {announcement.linkLabel || announcement.linkUrl}
        </a>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute end-3 top-1/2 -translate-y-1/2 shrink-0 rounded-full p-1 hover:bg-white/15 sm:static sm:translate-y-0"
      >
        <X size={15} />
      </button>
    </div>
  );
}
