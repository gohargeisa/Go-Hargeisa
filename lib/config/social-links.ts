import { Instagram, Facebook, Youtube, Globe, Mail, Phone } from "lucide-react";
import { WhatsAppIcon, XIcon, TikTokIcon, SnapchatIcon, TelegramIcon } from "@/components/shared/brand-icons";

/**
 * Every platform the "Social Links" icon row supports, and the SINGLE
 * reusable icon mapping for all of them — every consumer (site-footer.tsx,
 * share-button.tsx, and every listing detail page via
 * components/shared/social-links.tsx: Hotels/Restaurants/Cafes/Attractions/
 * Events/City Services, and any future listing type) reads icons from
 * SOCIAL_ICON below rather than importing or redefining its own mapping.
 * Facebook/Instagram/YouTube already have proper brand-shaped icons in
 * lucide-react; WhatsApp/X/TikTok/Snapchat/Telegram don't, so those five
 * come from components/shared/brand-icons.tsx (inline official-mark SVGs)
 * instead of lucide's generic stand-ins.
 */
export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "snapchat",
  "x",
  "youtube",
  "website",
  "whatsapp",
  "telegram",
  "email",
  "phone",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_ICON = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: TikTokIcon,
  snapchat: SnapchatIcon,
  x: XIcon,
  youtube: Youtube,
  website: Globe,
  whatsapp: WhatsAppIcon,
  telegram: TelegramIcon,
  email: Mail,
  phone: Phone,
} satisfies Record<SocialPlatform, unknown>;
