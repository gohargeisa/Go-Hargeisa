"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Play, VideoOff } from "lucide-react";
import { parseVideoUrl } from "@/lib/utils/video-embed";
import type { MediaVideo } from "@/types";

/**
 * Optional video section — renders nothing when `videos` is empty
 * (satisfies "show video section only when videos exist"). Provider is
 * inferred from the URL itself (lib/utils/video-embed.ts), not a stored
 * column, so this stays correct even if an admin pastes a differently-
 * shaped link later. YouTube embeds inline; Instagram/TikTok open in a new
 * tab since embedding those requires their own oEmbed scripts, which this
 * app doesn't pull in as a new dependency; uploaded MP4s play inline.
 *
 * Resolves its own "Watch on {platform}" label via the client-side
 * `useTranslations` hook rather than receiving one as a function prop —
 * a Server Component can't pass a plain function to a Client Component
 * (Next.js can't serialize it across the RSC boundary; every caller that
 * did this was one video away from crashing with "Functions cannot be
 * passed directly to Client Components").
 */
export function VideoGallery({ videos }: { videos: MediaVideo[] }) {
  const td = useTranslations("detail");
  if (!videos || videos.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {videos.map((video, i) => {
        const { provider, embedUrl } = parseVideoUrl(video.url);
        return (
          <div key={`${video.url}-${i}`} className="overflow-hidden rounded-xl2 border border-ink/8 dark:border-white/10">
            {provider === "mp4" && <Mp4Video src={video.url} />}
            {provider === "youtube" && embedUrl && (
              <iframe
                src={embedUrl}
                title={video.caption || `Video ${i + 1}`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full"
              />
            )}
            {(provider === "instagram" || provider === "tiktok" || (provider === "youtube" && !embedUrl)) && (
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-ink/5 text-ink/60 transition-colors hover:text-primary dark:bg-white/5 dark:text-sand/60"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Play size={20} fill="currentColor" aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  {td("watchOn", { platform: provider === "youtube" ? "YouTube" : provider === "instagram" ? "Instagram" : "TikTok" })}
                  <ExternalLink size={13} aria-hidden="true" />
                </span>
              </a>
            )}
            {video.caption && (
              <p className="px-3 py-2.5 text-sm text-ink/70 dark:text-sand/70">{video.caption}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Isolated per-video so one broken/404 upload can't take the whole gallery
 * down — was previously a bare `<video>` with no error handling at all, so
 * a failed load just sat there as a permanent black box. `playsInline`
 * stops iOS Safari from hijacking the whole screen into native fullscreen
 * playback the instant the user taps play (it was missing before, which is
 * the actual mechanism behind "video doesn't work correctly on mobile").
 * No `poster` prop exists yet — `MediaVideo` (types/index.ts) only stores
 * `{ url, caption }`, no per-video thumbnail — so this shows a themed
 * loading placeholder (matching the existing `.skeleton` shimmer used
 * elsewhere in the app) until the browser has fetched enough of the file to
 * paint its first frame, rather than a blank black rectangle.
 */
function Mp4Video({ src }: { src: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  if (state === "error") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-ink/5 text-ink/40 dark:bg-white/5 dark:text-sand/40">
        <VideoOff size={22} aria-hidden="true" />
        <span className="text-xs font-medium">Video unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-ink/5 dark:bg-white/5">
      {state === "loading" && <div className="skeleton absolute inset-0" aria-hidden="true" />}
      <video
        src={src}
        controls
        preload="metadata"
        playsInline
        className={`absolute inset-0 h-full w-full bg-black transition-opacity duration-300 ${state === "ready" ? "opacity-100" : "opacity-0"}`}
        onLoadedData={() => setState("ready")}
        onError={() => setState("error")}
      />
    </div>
  );
}
