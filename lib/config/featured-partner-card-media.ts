/**
 * Homepage "Featured Partners" card artwork overrides.
 *
 * A handful of partners get a purpose-composed card image (their real brand
 * logo integrated into on-brand photography — see
 * scripts/generate-featured-partner-cards.mjs) instead of the automatic
 * `city_services.image ?? logo_url` fallback:
 *
 *  - al-hikma-hijama-wellness-centre — its city_services row has no `image`
 *    or `logo_url` at all, so the card was rendering a bare placeholder.
 *  - flormar-hargeisa — so the card reads as one designed brand campaign
 *    rather than a photo with a white-box logo badge pasted over it.
 *
 * When a slug is listed here, `logoBaked: true` also tells FeaturedPartnerCard
 * to skip its separate circular logo badge (the logo is already in the image).
 * The moment either partner uploads real card art through Admin the override
 * can simply be deleted — nothing else changes.
 */
export interface FeaturedPartnerCardMedia {
  image: string;
  /** The brand logo is composited into `image`; suppress the card's own badge. */
  logoBaked: boolean;
}

const FEATURED_PARTNER_CARD_MEDIA: Record<string, FeaturedPartnerCardMedia> = {
  "al-hikma-hijama-wellness-centre": {
    image: "/images/partners/al-hikma/featured-card.jpg",
    logoBaked: true,
  },
  "flormar-hargeisa": {
    image: "/images/partners/flormar/featured-card.jpg",
    logoBaked: true,
  },
};

export function getFeaturedPartnerCardMedia(slug: string | null | undefined): FeaturedPartnerCardMedia | null {
  if (!slug) return null;
  return FEATURED_PARTNER_CARD_MEDIA[slug] ?? null;
}
