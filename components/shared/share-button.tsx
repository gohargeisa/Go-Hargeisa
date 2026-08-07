"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Share2 } from "lucide-react";
import { SOCIAL_ICON } from "@/lib/config/social-links";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";

export function ShareButton({
  title,
  text,
  className,
}: {
  title: string;
  text?: string;
  className?: string;
}) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function getUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  async function onShareClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: getUrl() });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }
    setOpen((o) => !o);
  }

  async function copyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setOpen(false);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const url = getUrl();
  const shareLinks = [
    { key: "whatsapp", icon: SOCIAL_ICON.whatsapp, href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { key: "facebook", icon: SOCIAL_ICON.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { key: "x", icon: SOCIAL_ICON.x, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { key: "telegram", icon: SOCIAL_ICON.telegram, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { key: "email", icon: SOCIAL_ICON.email, href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}` },
  ] as const;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onShareClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={copied ? t("linkCopied") : t("shareAriaLabel", { title })}
        className={
          className ??
          "inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        }
      >
        {copied ? <Check size={15} aria-hidden="true" /> : <Share2 size={15} aria-hidden="true" />}
        {copied ? t("linkCopied") : t("share")}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-overlay bg-ink/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute start-0 top-full z-overlay mt-2 w-52 overflow-hidden rounded-xl2 border border-ink/10 bg-white shadow-card dark:border-white/10 dark:bg-ink"
          >
          {shareLinks.map(({ key, icon: Icon, href }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-ink/5 dark:hover:bg-white/10"
            >
              <Icon size={15} aria-hidden="true" />
              {t(key)}
            </a>
          ))}
          <button
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-2.5 border-t border-ink/8 px-4 py-3 text-start text-sm hover:bg-ink/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            <Copy size={15} aria-hidden="true" />
            {t("copyLink")}
          </button>
          </div>
        </>
      )}
    </div>
  );
}
