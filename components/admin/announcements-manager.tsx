"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Eye, EyeOff, Trash2 } from "lucide-react";
import { createAnnouncement, setAnnouncementStatus, deleteAnnouncement } from "@/lib/actions/announcements";
import type { Locale } from "@/lib/i18n/config";
import type { SiteAnnouncement } from "@/types";

const STATUS_STYLE: Record<SiteAnnouncement["status"], string> = {
  draft: "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-sand/60",
  published: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
  archived: "bg-ink/10 text-ink/45 dark:bg-white/10 dark:text-sand/45",
};

export function AnnouncementsManager({ locale, announcements }: { locale: Locale; announcements: SiteAnnouncement[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createAnnouncement(locale, { title, message, linkUrl: linkUrl || undefined, linkLabel: linkLabel || undefined });
      if (result.ok) {
        setTitle("");
        setMessage("");
        setLinkUrl("");
        setLinkLabel("");
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  function onSetStatus(row: SiteAnnouncement, status: "draft" | "published" | "archived") {
    setPendingId(row.id);
    startTransition(async () => {
      const result = await setAnnouncementStatus(locale, row.id, status);
      if (!result.ok) alert(result.error ?? t("somethingWentWrong"));
      router.refresh();
      setPendingId(null);
    });
  }

  function onDelete(row: SiteAnnouncement) {
    if (confirmDeleteId !== row.id) {
      setConfirmDeleteId(row.id);
      return;
    }
    setPendingId(row.id);
    startTransition(async () => {
      const result = await deleteAnnouncement(locale, row.id);
      if (!result.ok) alert(result.error ?? t("somethingWentWrong"));
      router.refresh();
      setPendingId(null);
      setConfirmDeleteId(null);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onCreate} className="max-w-2xl space-y-4 rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("announcementTitleLabel")}</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("announcementMessageLabel")}</label>
          <textarea required rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("announcementLinkUrlLabel")}</label>
            <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={inputClass} placeholder="https://…" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("announcementLinkLabelLabel")}</label>
            <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className={inputClass} placeholder="Learn more" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />} {t("announcementCreateButton")}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {announcements.length === 0 ? (
          <p className="rounded-xl2 border border-dashed border-ink/15 p-8 text-center text-sm text-ink/50 dark:border-white/15 dark:text-sand/50">
            {t("announcementsEmpty")}
          </p>
        ) : (
          announcements.map((row) => {
            const busy = isPending && pendingId === row.id;
            return (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-xl2 border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{row.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[row.status]}`}>
                      {t(`requestStatus${row.status === "published" ? "Approved" : row.status === "archived" ? "Archived" : "Pending"}` as
                        | "requestStatusApproved"
                        | "requestStatusArchived"
                        | "requestStatusPending")}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-ink/50 dark:text-sand/50">{row.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSetStatus(row, row.status === "published" ? "draft" : "published")}
                    disabled={busy}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 dark:border-white/15 hover:border-amber-500 hover:text-amber-600 disabled:opacity-60"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : row.status === "published" ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    onBlur={() => setConfirmDeleteId(null)}
                    disabled={busy}
                    className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      confirmDeleteId === row.id
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-ink/10 dark:border-white/15 hover:border-red-500 hover:text-red-500"
                    }`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
