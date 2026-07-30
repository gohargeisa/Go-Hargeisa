"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { placeholderImage } from "@/lib/placeholder-image";

export function FloatingPhoneMockup({
  hotelName,
  location,
  bookNowLabel,
}: {
  hotelName: string;
  location: string;
  bookNowLabel: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      animate={reduceMotion ? undefined : { y: [0, -14, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="relative mx-auto w-[250px]"
    >
      <div className="pointer-events-none absolute inset-x-6 -bottom-6 h-10 rounded-full bg-black/35 blur-2xl" aria-hidden="true" />

      <div className="relative rounded-[2.75rem] border-[10px] border-navy-900 bg-navy-900 shadow-[0_40px_80px_rgba(5,15,30,0.55)]">
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-navy-900" aria-hidden="true" />
        <div className="overflow-hidden rounded-[2rem] bg-white dark:bg-ink">
          <div className="relative h-40 w-full">
            <Image
              src={placeholderImage(hotelName, { tone: "primary", width: 560, height: 440 })}
              alt=""
              fill
              sizes="250px"
              className="object-cover"
            />
            <div className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-ink shadow-sm">
              <Star size={10} fill="currentColor" className="text-primary" aria-hidden="true" />
              4.9
            </div>
          </div>
          <div className="p-4">
            <p className="font-display text-base font-bold text-ink dark:text-white">{hotelName}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink/55 dark:text-sand/55">
              <MapPin size={11} className="text-primary" aria-hidden="true" />
              {location}
            </p>
            <div className="mt-3.5 flex items-center gap-2">
              <span className="h-8 flex-1 rounded-full bg-ink/8 dark:bg-white/10" />
              <span className="flex h-8 shrink-0 items-center rounded-full bg-primary px-3 text-[11px] font-semibold text-white">
                {bookNowLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}
