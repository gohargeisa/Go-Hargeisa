import { ExternalLink, Play } from "lucide-react";
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
 */
export function VideoGallery({ videos, watchOnLabel }: { videos: MediaVideo[]; watchOnLabel: (provider: string) => string }) {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {videos.map((video, i) => {
        const { provider, embedUrl } = parseVideoUrl(video.url);
        return (
          <div key={`${video.url}-${i}`} className="overflow-hidden rounded-xl2 border border-ink/8 dark:border-white/10">
            {provider === "mp4" && (
              <video src={video.url} controls preload="metadata" className="aspect-video w-full bg-black" />
            )}
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
                  {watchOnLabel(provider === "youtube" ? "YouTube" : provider === "instagram" ? "Instagram" : "TikTok")}
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
