"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail, MailOpen } from "lucide-react";
import { markMessageRead } from "@/lib/actions/business";
import type { BusinessListingType, BusinessMessage } from "@/types";

export function MessagesInbox({
  listingType,
  listingId,
  messages,
  revalidatePath,
}: {
  listingType: BusinessListingType;
  listingId: string;
  messages: BusinessMessage[];
  revalidatePath: string;
}) {
  const t = useTranslations("businessDashboard");
  const [localMessages, setLocalMessages] = useState(messages);
  const [, startTransition] = useTransition();

  function onOpen(message: BusinessMessage) {
    if (message.isRead) return;
    setLocalMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m)));
    startTransition(() => {
      void markMessageRead(message.id, listingType, listingId, [revalidatePath]);
    });
  }

  if (localMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 p-12 text-center dark:border-white/15">
        <Mail size={26} className="text-ink/25" aria-hidden="true" />
        <p className="font-medium text-ink/60 dark:text-sand/60">{t("noMessagesYet")}</p>
        <p className="max-w-xs text-sm text-ink/40 dark:text-sand/40">{t("noMessagesYetDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {localMessages.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onOpen(m)}
          className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition-colors ${
            m.isRead
              ? "border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.03]"
              : "border-primary/30 bg-primary/[0.04] dark:bg-primary/[0.08]"
          }`}
        >
          <span className={`mt-0.5 shrink-0 ${m.isRead ? "text-ink/30" : "text-primary"}`}>
            {m.isRead ? <MailOpen size={17} aria-hidden="true" /> : <Mail size={17} aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={`truncate text-sm ${m.isRead ? "font-medium" : "font-bold"}`}>{m.senderName}</p>
              <span className="shrink-0 text-xs text-ink/40 dark:text-sand/40">
                {new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink/65 dark:text-sand/65">{m.message}</p>
            {(m.senderEmail || m.senderPhone) && (
              <p className="mt-1.5 text-xs text-ink/40 dark:text-sand/40">{m.senderEmail || m.senderPhone}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
