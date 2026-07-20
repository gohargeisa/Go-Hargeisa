"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, ShieldCheck, ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { SignOutButton } from "@/components/shared/sign-out-button";

export function UserMenu({
  locale,
  name,
  isAdmin,
  avatarUrl,
}: {
  locale: Locale;
  name: string;
  isAdmin: boolean;
  avatarUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-ink/10 dark:border-white/15 py-1.5 pe-3 ps-1.5 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
      >
        {avatarUrl ? (
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
            <Image src={avatarUrl} alt="" fill sizes="28px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {initial}
          </span>
        )}
        <span className="max-w-[100px] truncate text-sm font-medium">{name}</span>
        <ChevronDown size={14} className="text-ink/40" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 mt-2 w-56 overflow-hidden rounded-xl2 border border-ink/10 dark:border-white/10 bg-white dark:bg-ink shadow-card z-50"
        >
          <Link
            href={`/${locale}/dashboard`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-ink/5 dark:hover:bg-white/10"
          >
            <LayoutDashboard size={15} /> My Dashboard
          </Link>
          {isAdmin && (
            <Link
              href={`/${locale}/admin`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-ink/5 dark:hover:bg-white/10"
            >
              <ShieldCheck size={15} /> Admin Dashboard
            </Link>
          )}
          <div className="border-t border-ink/8 dark:border-white/10 px-4 py-3">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
