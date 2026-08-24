import type { ElementType } from "react";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import type { PartnerTheme } from "@/lib/config/partner-themes";

/**
 * Reusable branded closing CTA for any Premium Partner page — a full-bleed
 * gradient panel in the partner's own theme colors with a badge, heading,
 * subtitle, and up to two action buttons. First built for Lavender Flowers'
 * inline "Explore Flowers" CTA block, extracted here so any current or
 * future Premium Partner (see lib/config/partner-themes.ts) gets the same
 * premium closing-CTA treatment in their own brand colors instead of a
 * one-off block hardcoded to one partner.
 *
 * Every string/href is a prop resolved by the caller (real page anchors,
 * real WhatsApp links, real translated copy) — this component invents
 * nothing and adds no localization surface of its own.
 */
export function PremiumPartnerCTA({
  theme,
  icon: Icon,
  badgeLabel,
  title,
  subtitle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  secondaryIcon: SecondaryIcon,
  secondaryExternal,
}: {
  theme: PartnerTheme;
  icon: ElementType;
  badgeLabel: string;
  title: string;
  subtitle: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  secondaryIcon?: ElementType;
  secondaryExternal?: boolean;
}) {
  return (
    <Reveal>
      <section className="container-px mx-auto pb-4">
        <div
          className="relative overflow-hidden rounded-xl3 px-6 py-12 text-center text-white sm:px-10 sm:py-16"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryDeep} 0%, ${theme.primary} 60%, ${theme.primaryMid} 100%)`,
          }}
        >
          {/* Restrained decorative accents — soft radial blooms in the
              theme's own colors, not a generic stock gradient. */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.28)` }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: `rgba(${theme.primaryMidRgb}, 0.35)` }}
            aria-hidden="true"
          />

          <div className="relative">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide backdrop-blur-md"
              style={{ backgroundColor: "rgba(255,255,255,0.14)", border: `1px solid rgba(${theme.accentRgb}, 0.6)` }}
            >
              <Icon size={12} aria-hidden="true" />
              {badgeLabel}
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">{subtitle}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton href={primaryHref} size="lg" className="!bg-white !text-primary-800 hover:!bg-white/90">
                {primaryLabel}
              </PrimaryButton>
              {secondaryHref && secondaryLabel && (
                <SecondaryButton
                  href={secondaryHref}
                  external={secondaryExternal}
                  size="lg"
                  className="!border-white/40 !text-white hover:!border-white hover:!text-white"
                >
                  {SecondaryIcon && <SecondaryIcon size={16} aria-hidden="true" />}
                  {secondaryLabel}
                </SecondaryButton>
              )}
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
