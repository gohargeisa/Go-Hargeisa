import { Compass } from "lucide-react";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";

/**
 * Root-level fallback — app/[locale]/not-found.tsx only ever renders for a
 * `notFound()` call from *within* a matched [locale] route (e.g. a hotel
 * slug that doesn't exist). A URL that doesn't match any route pattern at
 * all (a typo'd path, a broken external link, no/garbage locale prefix)
 * never enters the [locale] segment in the first place, so without this
 * file Next.js falls back to its bare, unbranded default 404 — no header,
 * no footer, no way back into the site. This can't know the visitor's
 * intended locale (there's no NextIntlClientProvider out here), so it
 * defaults to English rather than guessing.
 */
export default function RootNotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream dark:bg-ink">
      <AnimatedBackground variant="light" />

      <div className="container-px relative mx-auto flex justify-center">
        <div className="flex flex-col items-center rounded-xl3 border border-ink/8 bg-white/80 px-8 py-10 text-center shadow-premium-lg backdrop-blur-xl dark:border-white/10 dark:bg-ink/70 sm:px-14 sm:py-14">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft">
            <Compass size={32} aria-hidden="true" />
          </span>

          <h1 className="mt-6 font-display text-3xl font-semibold text-ink dark:text-sand sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-3 max-w-sm text-ink/60 dark:text-sand/60">
            The page you're looking for doesn't exist or may have moved.
          </p>

          <PrimaryButton href="/en" size="lg" className="mt-8">
            Back to homepage
          </PrimaryButton>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <SecondaryButton href="/en/hotels" size="sm">
              Hotels
            </SecondaryButton>
            <SecondaryButton href="/en/explore" size="sm">
              Explore
            </SecondaryButton>
            <SecondaryButton href="/en/contact" size="sm">
              Contact
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
