"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Trash2, MapPin, ChevronDown, Loader2, Map } from "lucide-react";
import { createTrip, deleteTrip, removeTripItem } from "@/lib/actions/trips";
import type { SavedTrip } from "@/lib/data/saved-trips";
import type { Locale } from "@/lib/i18n/config";

export function SavedTripsPanel({ locale, trips }: { locale: Locale; trips: SavedTrip[] }) {
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
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  function onDeleteTrip(tripId: string) {
    if (!confirm("Delete this trip and all its saved places?")) return;
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Plan ahead</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Saved trips</h2>
        </div>
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-700"
        >
          <Plus size={14} /> New Trip
        </button>
      </div>

      {creating && (
        <form onSubmit={onCreate} className="mb-6 space-y-3 rounded-2xl border border-primary/15 bg-primary/[0.035] p-4 dark:bg-primary/[0.08]">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Trip name — e.g. 'Weekend in Hargeisa'"
            className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Create Trip
          </button>
        </form>
      )}

      {trips.length === 0 && !creating ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/[0.035] px-6 text-center dark:bg-primary/[0.08]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-ink"><Map size={22} /></span><h3 className="mt-4 font-display text-xl font-semibold">Plan your next day out</h3><p className="mt-2 max-w-sm text-sm leading-6 text-ink/55 dark:text-sand/60">Create a trip, then add places from hotel, restaurant, cafe, and attraction pages.</p></div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const open = openTrip === trip.id;
            return (
              <div key={trip.id} className="overflow-hidden rounded-2xl border border-ink/8 transition-shadow hover:shadow-sm dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenTrip(open ? null : trip.id)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left"
                >
                  <div className="text-start">
                    <p className="text-sm font-semibold">{trip.title}</p>
                    <p className="text-xs text-ink/50 dark:text-sand/50">
                      {trip.items.length} {trip.items.length === 1 ? "place" : "places"}
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
                      aria-label={`Delete ${trip.title}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 hover:text-red-500"
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
                        No places saved yet — look for "Add to trip" on any listing page.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {trip.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-ink/8 dark:border-white/10 p-2.5">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                              {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
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
                              aria-label={`Remove ${item.name} from trip`}
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
