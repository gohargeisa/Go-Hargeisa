import { Instagram, Facebook, Music2, Ghost, Twitter, Youtube, Globe, MessageCircle, Send, Mail, Phone, type LucideIcon } from "lucide-react";

/** Every platform the "Social Links" icon row supports — icons resolved
 * from this string key (not passed as a prop) so this stays safe to import
 * from both server and client components. lucide-react has no dedicated
 * TikTok/Snapchat/X marks; Music2/Ghost/Twitter are the closest stand-ins
 * without pulling in a new icon-library dependency. */
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

export const SOCIAL_ICON: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  snapchat: Ghost,
  x: Twitter,
  youtube: Youtube,
  website: Globe,
  whatsapp: MessageCircle,
  telegram: Send,
  email: Mail,
  phone: Phone,
};
