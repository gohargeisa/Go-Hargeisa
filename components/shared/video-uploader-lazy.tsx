"use client";

import dynamic from "next/dynamic";

/** Code-split wrapper — see gallery-manager-lazy.tsx for why. */
export const VideoUploader = dynamic(() => import("./video-uploader").then((m) => m.VideoUploader), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse rounded-xl2 bg-ink/5 dark:bg-white/5" aria-hidden="true" />,
});
