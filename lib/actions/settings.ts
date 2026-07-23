"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activity";

export type SiteSettingsUpdate = {
  siteName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialYoutube?: string;
  socialTiktok?: string;
  footerText?: string;
  defaultLanguage?: string;
  defaultTheme?: string;
  mapCenterLat?: number;
  mapCenterLng?: number;
  mapZoom?: number;
  featuresReviewsEnabled?: boolean;
  featuresRatingsEnabled?: boolean;
  featuresFavoritesEnabled?: boolean;
  featuresTripsEnabled?: boolean;
  featuresNewsletterEnabled?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

export async function getSiteSettings() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    console.warn("Error fetching site settings:", err);
    return null;
  }
}

export async function updateSiteSettings(
  updates: SiteSettingsUpdate
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: "Not authenticated" };

    // Check if user is owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "owner") {
      return { ok: false, error: "Not authorized" };
    }

    // Map camelCase to snake_case
    const dbUpdate: Record<string, unknown> = {};
    if (updates.siteName !== undefined) dbUpdate.site_name = updates.siteName;
    if (updates.logoUrl !== undefined) dbUpdate.logo_url = updates.logoUrl;
    if (updates.faviconUrl !== undefined) dbUpdate.favicon_url = updates.faviconUrl;
    if (updates.contactEmail !== undefined) dbUpdate.contact_email = updates.contactEmail;
    if (updates.contactPhone !== undefined) dbUpdate.contact_phone = updates.contactPhone;
    if (updates.whatsappNumber !== undefined) dbUpdate.whatsapp_number = updates.whatsappNumber;
    if (updates.socialFacebook !== undefined) dbUpdate.social_facebook = updates.socialFacebook;
    if (updates.socialInstagram !== undefined) dbUpdate.social_instagram = updates.socialInstagram;
    if (updates.socialTwitter !== undefined) dbUpdate.social_twitter = updates.socialTwitter;
    if (updates.socialYoutube !== undefined) dbUpdate.social_youtube = updates.socialYoutube;
    if (updates.socialTiktok !== undefined) dbUpdate.social_tiktok = updates.socialTiktok;
    if (updates.footerText !== undefined) dbUpdate.footer_text = updates.footerText;
    if (updates.defaultLanguage !== undefined) dbUpdate.default_language = updates.defaultLanguage;
    if (updates.defaultTheme !== undefined) dbUpdate.default_theme = updates.defaultTheme;
    if (updates.mapCenterLat !== undefined) dbUpdate.map_center_lat = updates.mapCenterLat;
    if (updates.mapCenterLng !== undefined) dbUpdate.map_center_lng = updates.mapCenterLng;
    if (updates.mapZoom !== undefined) dbUpdate.map_zoom = updates.mapZoom;
    if (updates.featuresReviewsEnabled !== undefined)
      dbUpdate.features_reviews_enabled = updates.featuresReviewsEnabled;
    if (updates.featuresRatingsEnabled !== undefined)
      dbUpdate.features_ratings_enabled = updates.featuresRatingsEnabled;
    if (updates.featuresFavoritesEnabled !== undefined)
      dbUpdate.features_favorites_enabled = updates.featuresFavoritesEnabled;
    if (updates.featuresTripsEnabled !== undefined)
      dbUpdate.features_trips_enabled = updates.featuresTripsEnabled;
    if (updates.featuresNewsletterEnabled !== undefined)
      dbUpdate.features_newsletter_enabled = updates.featuresNewsletterEnabled;
    if (updates.seoTitle !== undefined) dbUpdate.seo_title = updates.seoTitle;
    if (updates.seoDescription !== undefined) dbUpdate.seo_description = updates.seoDescription;
    if (updates.seoKeywords !== undefined) dbUpdate.seo_keywords = updates.seoKeywords;

    dbUpdate.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("site_settings")
      .update(dbUpdate)
      .eq("id", "default");

    if (error) {
      return { ok: false, error: error.message };
    }

    // Log the activity
    await logActivity("settings_update", "settings", "default", updates);

    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
