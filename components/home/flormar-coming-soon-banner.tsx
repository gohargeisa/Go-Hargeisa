import Image from "next/image";
import { Reveal } from "@/components/home/reveal";

/**
 * Homepage teaser for Flormar Hargeisa — the business owner's own supplied
 * banner graphic (public/images/banners/flormar-coming-soon.png, copied
 * byte-identical from the source file, 1717×916), not a recreation: every
 * pixel (copy, palette, product photography, "STAY TUNED" CTA) is already
 * baked into the image itself, so this component's only job is to place it
 * responsively — no text/gradient/CSS reproduction of what the image
 * already says, unlike components/home/flormar-promo-banner.tsx (a
 * different, HTML/CSS-built promo card design, still deliberately unmounted
 * pending publication approval — this is a separate, simpler "teaser image"
 * slot, not a replacement for that one).
 *
 * Deliberately NOT a link: Flormar Hargeisa's real listing is still
 * `status: 'archived'` (see lib/config/partner-themes.ts's FLORMAR_THEME
 * comment) — there is no approved public destination to send a homepage
 * visitor to yet, so this stays a plain, non-interactive teaser rather than
 * implying the storefront is already live.
 */
export function FlormarComingSoonBanner() {
  return (
    <section className="container-px mx-auto pb-6 pt-6 sm:pt-8">
      <Reveal>
        <div className="overflow-hidden rounded-xl3 shadow-card">
          <Image
            src="/images/banners/flormar-coming-soon.png"
            alt="Flormar Hargeisa — coming very soon to Go Hargeisa. A new beauty experience is coming to Hargeisa."
            width={1717}
            height={916}
            className="h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority={false}
          />
        </div>
      </Reveal>
    </section>
  );
}
