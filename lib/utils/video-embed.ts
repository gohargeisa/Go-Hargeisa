export type VideoProvider = "youtube" | "instagram" | "tiktok" | "mp4";

export interface ParsedVideo {
  provider: VideoProvider;
  /** Only set for youtube — a ready-to-embed iframe src. Instagram/TikTok
   * require their own oEmbed/script-based embeds we don't pull in as a new
   * dependency, so those open in a new tab instead of embedding inline. */
  embedUrl?: string;
}

/**
 * Infers the video source from the URL alone — no separate "provider"
 * column needed (avoids a value that can drift from the actual URL). Falls
 * back to "mp4" for anything that isn't a recognized YouTube/Instagram/
 * TikTok link, which covers our own Supabase-storage-hosted uploads.
 */
export function parseVideoUrl(url: string): ParsedVideo {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return { provider: "mp4" };
  }

  if (host === "youtu.be") {
    const id = new URL(url).pathname.slice(1);
    return { provider: "youtube", embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : undefined };
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const parsed = new URL(url);
    const id = parsed.searchParams.get("v") ?? (parsed.pathname.startsWith("/shorts/") ? parsed.pathname.split("/")[2] : undefined);
    return { provider: "youtube", embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : undefined };
  }
  if (host === "instagram.com") return { provider: "instagram" };
  if (host === "tiktok.com" || host === "vm.tiktok.com") return { provider: "tiktok" };

  return { provider: "mp4" };
}
