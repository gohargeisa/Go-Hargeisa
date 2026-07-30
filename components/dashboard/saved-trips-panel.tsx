"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Plus, Trash2, MapPin, ChevronDown, Loader2, Map } from "lucide-react";
import { createTrip, deleteTrip, removeTripItem } from "@/lib/actions/trips";
import { EmptyState } from "@/components/shared/empty-state";
import { PrimaryButton } from "@/components/shared/buttons";
import type { SavedTrip } from "@/lib/data/saved-trips";
import type { Locale } from "@/lib/i18n/config";

export function SavedTripsPanel({ locale, trips }: { locale: Locale; trips: SavedTrip[] }) {
  const t = useTranslations("dashboard");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [openTrip, setOpenTrip] = useState<string | null>(trips[0]?.id ?? null);

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTrip(locale, title, notes);
      if (result.ok) {
        setTitle("");
        setNotes("");
        setCreating(false);
        if (result.tripId) setOpenTrip(result.tripId);
      } else {
        setError(result.error ?? t("genericError"));
      }
    });
  }

  function onDeleteTrip(tripId: string) {
    if (!confirm(t("deleteTripConfirm"))) return;
    startTransition(async () => {
      await deleteTrip(locale, tripId);
    });
  }

  function onRemoveItem(itemId: string) {
    startTransition(async () => {
      await removeTripItem(locale, itemId);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("tripsEyebrow")}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{t("tripsTitle")}</h2>
        </div>
        <PrimaryButton onClick={() => setCreating((c) => !c)} size="sm">
          <Plus size={14} aria-hidden="true" /> {t("newTrip")}
        </PrimaryButton>
      </div>

      {creating && (
        <form onSubmit={onCreate} className="mb-6 space-y-3 rounded-xl2 border border-primary/15 bg-primary/[0.035] p-4 dark:bg-primary/[0.08]">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("tripNamePlaceholder")}
            className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            rows={2}
            className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <PrimaryButton type="submit" disabled={isPending} size="sm">
            {isPending && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
            {t("createTrip")}
          </PrimaryButton>
        </form>
      )}

      {trips.length === 0 && !creating ? (
        <EmptyState icon={Map} title={t("emptyTripsTitle")} description={t("emptyTripsDescription")} />
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const open = openTrip === trip.id;
            return (
              <div key={trip.id} className="overflow-hidden rounded-xl2 border border-ink/8 transition-shadow duration-300 ease-premium hover:shadow-soft dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenTrip(open ? null : trip.id)}
                  className="flex w-full items-center justify-between px-4 py-4 text-start"
                >
                  <div className="text-start">
                    <p className="text-sm font-semibold">{trip.title}</p>
                    <p className="text-xs text-ink/50 dark:text-sand/50">
                      {trip.items.length} {trip.items.length === 1 ? t("placesSingular") : t("placesPlural")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrip(trip.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteTrip(trip.id);
                      }}
                      aria-label={t("deleteTripAriaLabel", { title: trip.title })}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 hover:text-red-500 focus-visible:text-red-500"
                    >
                      <Trash2 size={14} />
                    </span>
                    <ChevronDown size={16} className={`text-ink/40 transition-transform ${open ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {open && (
                  <div className="border-t border-ink/8 dark:border-white/10 p-4">
                    {trip.notes && <p className="mb-3 text-sm text-ink/60 dark:text-sand/60">{trip.notes}</p>}
                    {trip.items.length === 0 ? (
                      <p className="text-sm text-ink/45 dark:text-sand/45">
                        {t("noPlacesSaved")}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {trip.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-ink/8 dark:border-white/10 p-2.5">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                              {item.image && <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />}
                            </div>
                            <Link href={`/${locale}${item.href}`} className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="flex items-center gap-1 text-xs text-ink/45 dark:text-sand/45 capitalize">
                                <MapPin size={10} /> {item.listingType}
                              </p>
                            </Link>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              aria-label={t("removeItemAriaLabel", { name: item.name })}
                              className="shrink-0 text-ink/40 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
