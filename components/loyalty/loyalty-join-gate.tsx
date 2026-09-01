"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Gift, Sparkles, TrendingUp, Star, Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyListingType } from "@/lib/loyalty/types";
import { joinLoyaltyProgramAction, recordLoyaltyEventAction } from "@/lib/actions/loyalty";

export function LoyaltyJoinGate({
  locale,
  slug,
  partnerName,
  partnerLogo,
  programId,
  programName,
  programDescription,
  listingType,
  listingId,
  welcomeBonus,
  tiers,
  isSignedIn,
  accentColor,
}: {
  locale: Locale;
  slug: string;
  partnerName: string;
  partnerLogo: string | null;
  programId: string;
  programName: string;
  programDescription: string | null;
  listingType: LoyaltyListingType;
  listingId: string;
  welcomeBonus: number;
  tiers: { id: string; name: string; minPoints: number; color: string | null }[];
  isSignedIn: boolean;
  accentColor: string | null;
}) {
  const t = useTranslations("loyalty");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    void recordLoyaltyEventAction(programId, "join_prompt_viewed");
  }, [programId]);

  const benefits = [
    { icon: TrendingUp, text: t("benefitEarn") },
    { icon: Gift, text: t("benefitRewards") },
    { icon: Sparkles, text: t("benefitOffers") },
    { icon: Star, text: t("benefitTrack") },
  ];

  function join() {
    setError(null);
    startTransition(async () => {
      const res = await joinLoyaltyProgramAction(listingType, listingId, locale, `/${locale}/rewards/${slug}`);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <section className="container-px mx-auto max-w-2xl pb-16 pt-[calc(env(safe-area-inset-top)+5.5rem)]">
      <div className="overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-card dark:border-white/10 dark:bg-white/[0.03]">
        <div className="relative bg-primary-800 px-6 py-10 text-center text-white sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background: accentColor
                ? `radial-gradient(120% 80% at 50% 0%, ${accentColor}55, transparent 70%)`
                : undefined,
            }}
          />
          {partnerLogo && (
            <span className="relative mx-auto mb-5 block h-12 w-32">
              <Image src={partnerLogo} alt={partnerName} fill sizes="128px" className="object-contain" />
            </span>
          )}
          <p className="relative text-xs font-bold uppercase tracking-[0.24em] text-white/70">{partnerName}</p>
          <h1 className="relative mt-2 font-display text-3xl font-bold sm:text-4xl">{programName}</h1>
          {programDescription && (
            <p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-white/80">{programDescription}</p>
          )}
        </div>

        <div className="px-6 py-8 sm:px-10">
          <h2 className="font-display text-lg font-semibold">{t("joinBenefitsTitle")}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 rounded-2xl border border-ink/8 p-3.5 dark:border-white/10">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="text-sm leading-5 text-ink/75 dark:text-sand/75">{text}</span>
              </li>
            ))}
          </ul>

          {welcomeBonus > 0 && (
            <p className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-primary/8 px-4 py-3 text-sm font-semibold text-primary-700 dark:text-primary-300">
              <Gift size={16} aria-hidden="true" />
              {t("welcomeBonus", { points: welcomeBonus.toLocaleString(locale) })}
            </p>
          )}

          {tiers.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                {t("tiersTitle")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tiers.map((tier) => (
                  <span
                    key={tier.id}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{
                      borderColor: (tier.color ?? accentColor ?? "#999") + "66",
                      color: tier.color ?? undefined,
                    }}
                  >
                    {tier.name}
                    <span className="text-ink/40 dark:text-sand/40">
                      {tier.minPoints === 0 ? t("tierStart") : `${tier.minPoints.toLocaleString(locale)}+`}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            {isSignedIn ? (
              <>
                <button
                  type="button"
                  onClick={join}
                  disabled={pending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-700 px-6 py-3.5 text-sm font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
                >
                  {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                  {t("joinNow")}
                </button>
                {error && <p className="mt-3 text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
              </>
            ) : (
              <Link
                href={`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/rewards/${slug}`)}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-700 px-6 py-3.5 text-sm font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 active:scale-95"
              >
                {t("signInToJoin")}
              </Link>
            )}
            <p className="mt-3 text-center text-xs text-ink/45 dark:text-sand/45">{t("joinFinePrint")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
