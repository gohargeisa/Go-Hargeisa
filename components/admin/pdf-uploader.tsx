"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";

/** Small uploader for a menu PDF — separate from ImageUploader/GalleryManager since PDFs skip compression entirely. */
export function PdfUploader({
  folder,
  value,
  onChange,
  label = "PDF menu",
}: {
  folder: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `pdf-upload-${folder}`;

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file, { bucket: "listing-images", folder });
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-ink/10 px-3 py-2 text-sm font-medium text-ink hover:border-primary hover:text-primary dark:border-white/15 dark:text-white"
          >
            <FileText size={16} className="text-primary" aria-hidden="true" /> View current PDF
          </a>
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/10 text-ink/30 dark:border-white/15">
            <FileText size={18} aria-hidden="true" />
          </span>
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={onFileSelected}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading…" : value ? "Replace PDF" : "Upload PDF"}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="ms-2 inline-flex items-center gap-1 text-xs text-ink/50 hover:text-red-500"
            >
              <X size={12} /> Remove
            </button>
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
