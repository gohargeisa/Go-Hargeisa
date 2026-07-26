"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { RestaurantBookingCard } from "@/components/shared/restaurant-booking-card";

export function RestaurantMobileBookingBar({
  restaurantId,
  name,
  priceRange,
  priceLabel,
  openingHours,
  hoursLabel,
  reservable,
  reserveLabel,
  phone,
  website,
  locale,
}: {
  restaurantId: string;
  name: string;
  priceRange?: string;
  priceLabel: string;
  openingHours?: string;
  hoursLabel: string;
  reservable?: boolean;
  reserveLabel: string;
  phone?: string;
  website?: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-ink/10 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(20,30,45,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-ink/95 lg:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
            {priceLabel}
          </p>
          <p className="truncate font-display text-lg font-bold text-primary">{priceRange || "—"}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          {reserveLabel}
          <ChevronUp size={16} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`${reserveLabel} — ${name}`}
              initial={reduceMotion ? undefined : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduceMotion ? undefined : { y: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-[60] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-ink lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-lg font-semibold">{name}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close reservation panel"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <RestaurantBookingCard
                restaurantId={restaurantId}
                name={name}
                priceRange={priceRange}
                priceLabel={priceLabel}
                openingHours={openingHours}
                hoursLabel={hoursLabel}
                reservable={reservable}
                reserveLabel={reserveLabel}
                phone={phone}
                website={website}
                locale={locale}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
