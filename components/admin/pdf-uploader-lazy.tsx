"use client";

import dynamic from "next/dynamic";

/** Code-split wrapper — see gallery-manager-lazy.tsx for why. */
export const PdfUploader = dynamic(() => import("./pdf-uploader").then((m) => m.PdfUploader), {
  ssr: false,
  loading: () => <div className="h-14 animate-pulse rounded-xl2 bg-ink/5 dark:bg-white/5" aria-hidden="true" />,
});
