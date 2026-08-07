"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MessageSquare, Mail, Phone } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { Locale } from "@/lib/i18n/config";
import type { OwnedListingMessage } from "@/lib/data/business";

export function MessagesPanel({
  locale,
  messages,
  hasBusinesses,
}: {
  locale: Locale;
  messages: OwnedListingMessage[];
  hasBusinesses: boolean;
}) {
  const t = useTranslations("dashboard");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("messagesEyebrow")}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{t("messagesTitle")}</h2>
        </div>
        <MessageSquare size={22} className="text-primary" />
      </div>

      {messages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={t("emptyMessagesTitle")}
          description={hasBusinesses ? t("emptyMessagesDescription") : t("emptyMessagesNoBusinessDescription")}
        />
      ) : (
        <>
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl2 border p-4 dark:border-white/10 ${
                  m.isRead ? "border-ink/8 bg-white dark:bg-white/[0.03]" : "border-primary/25 bg-primary/[0.04] dark:bg-primary/[0.08]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{m.senderName}</p>
                  <span className="text-xs text-ink/45 dark:text-sand/45">{m.listingName}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink/70 dark:text-sand/70">{m.message}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink/50 dark:text-sand/50">
                  {m.senderEmail && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={12} /> {m.senderEmail}
                    </span>
                  )}
                  {m.senderPhone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={12} /> {m.senderPhone}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Link href={`/${locale}/business/messages`} className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline">
            {t("viewAllInBusinessDashboard")}
          </Link>
        </>
      )}
    </div>
  );
}
