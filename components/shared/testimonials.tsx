import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { ScrollRow } from "./scroll-row";

export interface Testimonial {
  quote: string;
  name: string;
  role?: string;
  avatar?: string;
  rating?: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * Horizontal-scroll testimonial cards — reuses scroll-row.tsx (the same
 * mechanism ListingRowSection already uses) as the carousel. No prior art
 * for this content type existed in the codebase, so this is new; pages
 * adopting it should pass genuine quotes/reviewers only.
 */
export function Testimonials({ items, className = "" }: { items: Testimonial[]; className?: string }) {
  return (
    <div className={className}>
      <ScrollRow>
        {items.map((item) => (
          <div
            key={item.name}
            className="flex min-w-[288px] flex-col rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft transition-shadow duration-300 ease-premium hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
          >
            <Quote size={22} className="text-primary/30" aria-hidden="true" />

            {item.rating !== undefined && (
              <div className="mt-3 flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill={i < item.rating! ? "currentColor" : "none"} aria-hidden="true" />
                ))}
              </div>
            )}

            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/75 dark:text-sand/75">&ldquo;{item.quote}&rdquo;</p>

            <div className="mt-5 flex items-center gap-3 border-t border-ink/8 pt-4 dark:border-white/10">
              {item.avatar ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  <Image src={item.avatar} alt={item.name} fill sizes="40px" className="object-cover" />
                </div>
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initials(item.name)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink dark:text-white">{item.name}</p>
                {item.role && <p className="truncate text-xs text-ink/50 dark:text-sand/50">{item.role}</p>}
              </div>
            </div>
          </div>
        ))}
      </ScrollRow>
    </div>
  );
}
