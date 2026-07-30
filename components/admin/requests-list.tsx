"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Loader2, ChevronDown, ChevronUp, Phone, Mail, MapPin, Globe, FileText,
  Check, X, MessageSquareWarning, Archive, ExternalLink,
} from "lucide-react";
import {
  setRequestStatus, addRequestNote, convertJoinRequest,
} from "@/lib/actions/business-requests";
import type { Locale } from "@/lib/i18n/config";
import type { BusinessRequestStatus, JoinRequestCategory } from "@/types";

export interface RequestNote {
  id: string;
  note: string;
  createdAt: string;
}

export interface RequestRow {
  id: string;
  category: JoinRequestCategory;
  businessName: string;
  ownerName: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  address: string;
  mapsUrl: string | null;
  description: string;
  logo: string | null;
  gallery: string[];
  menuPdfUrl: string | null;
  bookingUrl: string | null;
  website: string | null;
  status: BusinessRequestStatus;
  convertedListingType: JoinRequestCategory | null;
  convertedListingId: string | null;
  createdAt: string;
  notes: RequestNote[];
}

const STATUS_STYLE: Record<BusinessRequestStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  approved: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
  rejected: "bg-red-500/10 text-red-600",
  needs_info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  archived: "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-sand/60",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function RequestsList({ locale, rows }: { locale: Locale; rows: RequestRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertSlug, setConvertSlug] = useState("");
  const [convertLat, setConvertLat] = useState("");
  const [convertLng, setConvertLng] = useState("");

  function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setPendingId(id);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  function onSetStatus(row: RequestRow, status: BusinessRequestStatus) {
    run(row.id, () => setRequestStatus(locale, row.id, status));
  }

  function onAddNote(row: RequestRow) {
    if (!noteDraft.trim()) return;
    setPendingId(row.id);
    startTransition(async () => {
      const result = await addRequestNote(locale, row.id, noteDraft);
      if (result.ok) {
        router.refresh();
        setNoteDraft("");
      } else {
        alert(result.error ?? t("somethingWentWrong"));
      }
      setPendingId(null);
    });
  }

  function onStartConvert(row: RequestRow) {
    setConvertSlug(slugify(row.businessName));
    setConvertLat("");
    setConvertLng("");
    setConvertingId(row.id);
  }

  function onConvert(row: RequestRow, partnerStatus: "trial" | "official") {
    const lat = parseFloat(convertLat);
    const lng = parseFloat(convertLng);
    if (!convertSlug.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      alert(t("convertMissingFields"));
      return;
    }
    setPendingId(row.id);
    startTransition(async () => {
      const result = await convertJoinRequest(locale, row.id, partnerStatus, { slug: convertSlug.trim(), lat, lng });
      if (result.ok) {
        router.refresh();
        setConvertingId(null);
      } else {
        alert(result.error ?? t("somethingWentWrong"));
      }
      setPendingId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
        <p className="font-semibold">{t("requestsEmptyTitle")}</p>
        <p className="mt-1.5 text-sm text-ink/50 dark:text-sand/50">{t("requestsEmptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => {
        const busy = isPending && pendingId === row.id;
        const expanded = expandedId === row.id;
        const converting = convertingId === row.id;
        const alreadyConverted = !!row.convertedListingId;

        return (
          <div key={row.id} className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/10">
                  {row.logo && <Image src={row.logo} alt={row.businessName} fill sizes="48px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{row.businessName}</p>
                  <p className="text-xs capitalize text-ink/45 dark:text-sand/45">
                    {row.category} · {new Date(row.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[row.status]}`}>
                  {t(`requestStatus${row.status.charAt(0).toUpperCase()}${row.status.slice(1).replace(/_(.)/, (_, c) => c.toUpperCase())}` as
                    | "requestStatusPending"
                    | "requestStatusApproved"
                    | "requestStatusRejected"
                    | "requestStatusNeedsInfo"
                    | "requestStatusArchived")}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : row.id)}
                  className="flex h-8 items-center gap-1 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/15"
                >
                  {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {t("previewAction")}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {row.status !== "approved" && !alreadyConverted && (
                <button
                  type="button"
                  onClick={() => onSetStatus(row, "approved")}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-secondary-600 hover:text-secondary-700 disabled:opacity-60 dark:border-white/15"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {t("approveAction")}
                </button>
              )}
              {row.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => onSetStatus(row, "rejected")}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-500 disabled:opacity-60 dark:border-white/15"
                >
                  <X size={12} /> {t("rejectAction")}
                </button>
              )}
              {row.status !== "needs_info" && (
                <button
                  type="button"
                  onClick={() => onSetStatus(row, "needs_info")}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-sky-500 hover:text-sky-600 disabled:opacity-60 dark:border-white/15"
                >
                  <MessageSquareWarning size={12} /> {t("needsInfoAction")}
                </button>
              )}
              {row.status !== "archived" && (
                <button
                  type="button"
                  onClick={() => onSetStatus(row, "archived")}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-ink/40 disabled:opacity-60 dark:border-white/15"
                >
                  <Archive size={12} /> {t("archiveAction")}
                </button>
              )}

              {alreadyConverted ? (
                <span className="flex items-center gap-1.5 rounded-lg bg-secondary/10 px-2.5 py-1.5 text-xs font-semibold text-secondary-700 dark:text-sand/70">
                  <Check size={12} /> {t("convertedLabel")}
                  <Link
                    href={`/${locale}/admin/${row.convertedListingType === "hotel" ? "hotels" : row.convertedListingType === "restaurant" ? "restaurants" : "cafes"}/${row.convertedListingId}/edit`}
                    className="inline-flex items-center gap-0.5 underline hover:text-primary"
                  >
                    {t("viewListingLabel")} <ExternalLink size={11} />
                  </Link>
                </span>
              ) : !converting ? (
                <button
                  type="button"
                  onClick={() => onStartConvert(row)}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
                >
                  {t("convertAction")}
                </button>
              ) : null}
            </div>

            {converting && !alreadyConverted && (
              <div className="mt-3 flex flex-col gap-2.5 rounded-xl2 border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="mb-1 block text-xs font-semibold text-ink/55 dark:text-sand/55">{t("slugLabel")}</label>
                  <input
                    value={convertSlug}
                    onChange={(e) => setConvertSlug(e.target.value)}
                    className="h-8 w-full rounded-lg border border-ink/10 bg-transparent px-2 text-xs outline-none focus:border-primary dark:border-white/15"
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-semibold text-ink/55 dark:text-sand/55">{t("latitudeLabel")}</label>
                  <input
                    value={convertLat}
                    onChange={(e) => setConvertLat(e.target.value)}
                    placeholder="9.5624"
                    className="h-8 w-full rounded-lg border border-ink/10 bg-transparent px-2 text-xs outline-none focus:border-primary dark:border-white/15"
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-semibold text-ink/55 dark:text-sand/55">{t("longitudeLabel")}</label>
                  <input
                    value={convertLng}
                    onChange={(e) => setConvertLng(e.target.value)}
                    placeholder="44.0770"
                    className="h-8 w-full rounded-lg border border-ink/10 bg-transparent px-2 text-xs outline-none focus:border-primary dark:border-white/15"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onConvert(row, "trial")}
                    disabled={busy}
                    className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/15"
                  >
                    {t("convertToTrialAction")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onConvert(row, "official")}
                    disabled={busy}
                    className="h-8 rounded-lg bg-primary px-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                  >
                    {t("convertToOfficialAction")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertingId(null)}
                    disabled={busy}
                    className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold dark:border-white/15"
                  >
                    {t("extendCancel")}
                  </button>
                </div>
              </div>
            )}

            {expanded && (
              <div className="mt-4 flex flex-col gap-3 border-t border-ink/8 pt-4 text-sm dark:border-white/10">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-ink/70 dark:text-sand/70">
                    <span className="text-ink/40 dark:text-sand/40">{t("ownerNameLabel")}:</span> {row.ownerName}
                  </p>
                  <p className="flex items-center gap-2 text-ink/70 dark:text-sand/70">
                    <Phone size={13} className="text-ink/40 dark:text-sand/40" /> {row.phone}
                    {row.whatsapp && <span className="text-ink/40 dark:text-sand/40">· WA: {row.whatsapp}</span>}
                  </p>
                  <p className="flex items-center gap-2 text-ink/70 dark:text-sand/70">
                    <Mail size={13} className="text-ink/40 dark:text-sand/40" /> {row.email}
                  </p>
                  <p className="flex items-center gap-2 text-ink/70 dark:text-sand/70">
                    <MapPin size={13} className="shrink-0 text-ink/40 dark:text-sand/40" /> {row.address}
                    {row.mapsUrl && (
                      <a href={row.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {t("viewOnMapsLabel")}
                      </a>
                    )}
                  </p>
                </div>

                <p className="text-ink/70 dark:text-sand/70">{row.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {row.website && (
                    <a href={row.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary underline">
                      <Globe size={12} /> {t("websiteLabel")}
                    </a>
                  )}
                  {row.bookingUrl && (
                    <a href={row.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary underline">
                      <ExternalLink size={12} /> {t("bookingUrlLabel")}
                    </a>
                  )}
                  {row.menuPdfUrl && (
                    <a href={row.menuPdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary underline">
                      <FileText size={12} /> {t("menuPdfLabel")}
                    </a>
                  )}
                </div>

                {row.gallery.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {row.gallery.map((url) => (
                      <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/10">
                        <Image src={url} alt={row.businessName} fill sizes="64px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-1">
                  <p className="mb-2 text-xs font-semibold text-ink/55 dark:text-sand/55">{t("notesToggle")} ({row.notes.length})</p>
                  <div className="flex flex-col gap-2 border-s-2 border-ink/8 ps-3 dark:border-white/10">
                    {row.notes.length === 0 ? (
                      <p className="text-xs text-ink/40 dark:text-sand/40">{t("notesEmpty")}</p>
                    ) : (
                      row.notes.map((n) => (
                        <div key={n.id} className="text-xs">
                          <p className="text-ink/75 dark:text-sand/75">{n.note}</p>
                          <p className="mt-0.5 text-ink/35 dark:text-sand/35">
                            {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      ))
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder={t("addNotePlaceholder")}
                        className="h-8 flex-1 rounded-lg border border-ink/10 bg-transparent px-2.5 text-xs outline-none focus:border-primary dark:border-white/15"
                      />
                      <button
                        type="button"
                        onClick={() => onAddNote(row)}
                        disabled={busy || !noteDraft.trim()}
                        className="h-8 shrink-0 rounded-lg bg-primary px-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                      >
                        {t("addNoteButton")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
