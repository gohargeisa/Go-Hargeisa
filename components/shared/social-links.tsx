import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { SOCIAL_PLATFORMS, SOCIAL_ICON, type SocialPlatform } from "@/lib/config/social-links";

export interface SocialLinksProps {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  snapchat?: string;
  x?: string;
  youtube?: string;
  website?: string;
  whatsapp?: string;
  telegram?: string;
  email?: string;
  phone?: string;
  /** aria-label per platform, e.g. { instagram: "Follow on Instagram" } —
   * caller-supplied so each detail page can use its own translation
   * namespace, matching the label-prop convention every other shared
   * form/editor component in this app already follows. */
  labels: Partial<Record<SocialPlatform, string>>;
  className?: string;
}

const EXTERNAL_URL_PLATFORMS = new Set<SocialPlatform>(["instagram", "facebook", "tiktok", "snapchat", "x", "youtube", "website", "telegram"]);

function resolveHref(platform: SocialPlatform, value: string): string {
  if (platform === "whatsapp") return toWhatsAppHref(value);
  if (platform === "email") return `mailto:${value}`;
  if (platform === "phone") return `tel:${value}`;
  if (EXTERNAL_URL_PLATFORMS.has(platform)) return normalizeExternalUrl(value);
  return value;
}

/**
 * Icon-only social/contact link row — renders one circular icon per
 * platform prop that's actually set, renders nothing at all when none are
 * (satisfies "hide section entirely when data doesn't exist"). Replaces the
 * bespoke Instagram/Facebook icon row previously inlined in the cafe detail
 * page — same visual style, now shared and extended to every platform.
 */
export function SocialLinks({ labels, className, ...values }: SocialLinksProps) {
  const entries = SOCIAL_PLATFORMS.map((platform) => ({ platform, value: values[platform] })).filter(
    (e): e is { platform: SocialPlatform; value: string } => !!e.value
  );

  if (entries.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ""}`}>
      {entries.map(({ platform, value }) => {
        const Icon = SOCIAL_ICON[platform];
        const external = EXTERNAL_URL_PLATFORMS.has(platform);
        return (
          <a
            key={platform}
            href={resolveHref(platform, value)}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            aria-label={labels[platform] ?? platform}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-sand/60"
          >
            <Icon size={17} aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}
