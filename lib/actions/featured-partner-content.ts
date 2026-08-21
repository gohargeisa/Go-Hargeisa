"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PolymorphicListingType } from "@/types";

export interface FeaturedPartnerContentInput {
  promoText: string;
  promoTextAr: string;
  promoTextSo: string;
  ctaLabel: string;
  ctaLabelAr: string;
  ctaLabelSo: string;
  ctaHref: string;
}

const EMPTY_INPUT: FeaturedPartnerContentInput = {
  promoText: "",
  promoTextAr: "",
  promoTextSo: "",
  ctaLabel: "",
  ctaLabelAr: "",
  ctaLabelSo: "",
  ctaHref: "",
};

/** Same "manual, admin-only" door as is_partner itself — a business owner
 * never self-writes their own Featured Partner promotional copy. */
async function assertOwnerRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role?: string } | null)?.role !== "owner") throw new Error("Not authorized.");

  return supabase;
}

/** Optional custom override for one partner's homepage promo card — see
 * supabase/migrations/20260902000001_featured_partner_content.sql (NOT YET
 * APPLIED). Returns the empty-string shape (never null) so the admin form
 * can bind it directly without extra null-guards; an all-empty result just
 * means no override is saved, which the public-facing
 * getFeaturedPartnerShowcase already treats as "use the category template". */
export async function getFeaturedPartnerContent(
  listingType: PolymorphicListingType,
  listingId: string
): Promise<FeaturedPartnerContentInput> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("featured_partner_content" as any)
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error || !data) return EMPTY_INPUT;

  const row = data as any;
  return {
    promoText: row.promo_text ?? "",
    promoTextAr: row.promo_text_ar ?? "",
    promoTextSo: row.promo_text_so ?? "",
    ctaLabel: row.cta_label ?? "",
    ctaLabelAr: row.cta_label_ar ?? "",
    ctaLabelSo: row.cta_label_so ?? "",
    ctaHref: row.cta_href ?? "",
  };
}

/** Upserts on (listing_type, listing_id) — an all-blank submission is
 * saved as all-null, which is exactly "no override" to the read side,
 * rather than leaving a stale row with lingering values. */
export async function saveFeaturedPartnerContent(
  listingType: PolymorphicListingType,
  listingId: string,
  input: FeaturedPartnerContentInput,
  revalidatePathTarget: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwnerRole();

  const { error } = await supabase.from("featured_partner_content" as any).upsert(
    {
      listing_type: listingType,
      listing_id: listingId,
      promo_text: input.promoText.trim() || null,
      promo_text_ar: input.promoTextAr.trim() || null,
      promo_text_so: input.promoTextSo.trim() || null,
      cta_label: input.ctaLabel.trim() || null,
      cta_label_ar: input.ctaLabelAr.trim() || null,
      cta_label_so: input.ctaLabelSo.trim() || null,
      cta_href: input.ctaHref.trim() || null,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "listing_type,listing_id" }
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(revalidatePathTarget);
  revalidatePath("/", "layout");
  return { ok: true };
}
