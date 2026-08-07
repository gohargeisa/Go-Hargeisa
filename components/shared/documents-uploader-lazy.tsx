"use client";

import dynamic from "next/dynamic";

/** Code-split wrapper — see components/admin/gallery-manager-lazy.tsx for why. */
export const DocumentsUploader = dynamic(() => import("./documents-uploader").then((m) => m.DocumentsUploader), {
  ssr: false,
  loading: () => <div className="h-14 animate-pulse rounded-xl2 bg-ink/5 dark:bg-white/5" aria-hidden="true" />,
});
