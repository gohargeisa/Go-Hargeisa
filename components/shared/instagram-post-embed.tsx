import { Instagram } from "lucide-react";

/**
 * Instagram's own official public post/reel embed (instagram.com/{p,reel}/
 * {shortcode}/embed) — an iframe Instagram serves itself, not media we
 * download and re-host. This is the only way this project shows a
 * partner's real Instagram content: we don't have distribution rights to
 * scrape and republish social photos ourselves (see partner-theme-system
 * docs). Reusable across any partner with a verified public post, not
 * specific to one restaurant.
 *
 * Requires "https://www.instagram.com" in next.config.mjs's frame-src.
 */
export function InstagramPostEmbed({ url, caption }: { url: string; caption?: string }) {
  const embedSrc = `${url.replace(/\/$/, "")}/embed`;

  return (
    <figure className="overflow-hidden rounded-xl2 border border-ink/10 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <iframe
        src={embedSrc}
        title="Instagram post"
        loading="lazy"
        allowFullScreen
        className="aspect-[4/5] w-full border-0 sm:aspect-square"
      />
      <figcaption className="flex items-center gap-2 border-t border-ink/8 px-4 py-3 text-xs text-ink/55 dark:border-white/10 dark:text-sand/55">
        <Instagram size={13} aria-hidden="true" className="shrink-0" />
        <span>{caption ?? "Real post from Instagram"}</span>
      </figcaption>
    </figure>
  );
}
