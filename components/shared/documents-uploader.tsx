"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";
import type { BusinessDocument } from "@/types";

/**
 * Multi-file uploader for verification documents (business license,
 * registration, ID, etc.) — unlike PdfUploader (single menu PDF), this
 * keeps a growing list, each independently removable, and accepts both
 * PDFs and photos of physical documents.
 */
export function DocumentsUploader({
  folder,
  value,
  onChange,
  label,
  hint,
}: {
  folder: string;
  value: BusinessDocument[];
  onChange: (documents: BusinessDocument[]) => void;
  label: string;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `documents-upload-${folder}`;

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file, { bucket: "listing-images", folder });
      onChange([...value, { url, name: file.name }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      {hint && <p className="mb-2.5 text-xs text-ink/50 dark:text-sand/50">{hint}</p>}

      {value.length > 0 && (
        <ul className="mb-3 space-y-2">
          {value.map((doc, index) => (
            <li
              key={`${doc.url}-${index}`}
              className="flex items-center gap-2.5 rounded-xl border border-ink/10 px-3.5 py-2.5 dark:border-white/15"
            >
              <FileText size={16} className="shrink-0 text-primary" aria-hidden="true" />
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary">
                {doc.name}
              </a>
              <button
                type="button"
                onClick={() => remove(index)}
                className="shrink-0 text-ink/40 hover:text-red-500"
                aria-label={`Remove ${doc.name}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input ref={inputRef} type="file" accept="application/pdf,image/*" onChange={onFileSelected} className="hidden" id={inputId} />
      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? "Uploading…" : "Upload document"}
      </label>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
