"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapIcon, Plus, Check, Loader2 } from "lucide-react";
import { addToTrip, getMyTripOptions } from "@/lib/actions/trips";
import type { Locale } from "@/lib/i18n/config";

type ListingType = "hotel" | "restaurant" | "cafe" | "attraction";

export function AddToTripButton({
  locale,
  listingType,
  listingId,
}: {
  locale: Locale;
  listingType: ListingType;
  listingId: string;
}) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<{ id: string; title: string }[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function openMenu() {
    setOpen(true);
    setError(null);
    if (trips === null) {
      const options = await getMyTripOptions();
      setTrips(options);
    }
  }

  function submit(tripId?: string) {
    setError(null);
    startTransition(async () => {
      const result = await addToTrip({
        locale,
        tripId,
        newTripTitle: tripId ? undefined : newTitle || "My Trip",
        listingType,
        listingId,
      });
      if (result.ok) {
        setAdded(true);
        setOpen(false);
        setNewTitle("");
        setTrips(null);
      } else if (result.error === "Not signed in.") {
        router.push(`/${locale}/auth/login`);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 dark:border-white/20 py-3 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
      >
        {added ? <Check size={15} className="text-secondary" /> : <MapIcon size={15} />}
        {added ? "Added to trip" : "Add to Trip"}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl2 border border-ink/10 dark:border-white/10 bg-white dark:bg-ink shadow-card p-3">
          {trips === null ? (
            <p className="flex items-center gap-2 px-2 py-2 text-sm text-ink/50">
              <Loader2 size={13} className="animate-spin" /> Loading your trips…
            </p>
          ) : (
            <>
              {trips.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => submit(t.id)}
                  className="block w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-ink/5 dark:hover:bg-white/10"
                >
                  {t.title}
                </button>
              ))}
              <div className="mt-2 flex gap-2 border-t border-ink/8 dark:border-white/10 pt-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New trip name"
                  className="min-w-0 flex-1 rounded-lg border border-ink/12 dark:border-white/15 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={isPending || !newTitle}
                  onClick={() => submit(undefined)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </>
          )}
          {error && <p className="mt-2 px-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
