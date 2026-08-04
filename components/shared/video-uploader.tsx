"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, Link2, Loader2, Repeat, Video as VideoIcon, X } from "lucide-react";
import { uploadVideo } from "@/lib/supabase/storage";
import { parseVideoUrl } from "@/lib/utils/video-embed";
import type { MediaVideo } from "@/types";

/**
 * Optional short-video gallery — the Media Manager's one genuinely new media
 * type. Mirrors GalleryManager's drag & drop, multi-file upload, drag-to-
 * reorder, and per-clip replace, just without categories (a video either
 * belongs or it doesn't, and a caption is the only per-clip detail worth
 * editing).
 */
export function VideoUploader({
  folder,
  value,
  onChange,
  label,
  addLabel,
  hint,
  captionPlaceholder,
  removeAriaLabel,
  replaceAriaLabel,
  moveEarlierAriaLabel,
  moveLaterAriaLabel,
  pasteUrlPlaceholder,
  addUrlLabel,
}: {
  folder: string;
  value: MediaVideo[];
  onChange: (value: MediaVideo[]) => void;
  label: string;
  addLabel: string;
  hint: string;
  captionPlaceholder: string;
  removeAriaLabel: string;
  replaceAriaLabel: string;
  moveEarlierAriaLabel: string;
  moveLaterAriaLabel: string;
  /** Optional — when both are provided, a URL-paste field for YouTube/
   * Instagram/TikTok links is shown alongside the file uploader. Omitted
   * entirely (not just hidden) when unset, so callers that don't pass
   * translated labels don't need to think about this feature. */
  pasteUrlPlaceholder?: string;
  addUrlLabel?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [pastedUrl, setPastedUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  function addUrl() {
    const url = pastedUrl.trim();
    if (!url) return;
    onChange([...value, { url }]);
    setPastedUrl("");
  }

  async function addFiles(files: File[]) {
    const videoFiles = files.filter((f) => f.type.startsWith("video/"));
    if (videoFiles.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await Promise.all(videoFiles.map((f) => uploadVideo(f, { folder })));
      onChange([...value, ...uploaded.map((url) => ({ url }))]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    await addFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    void addFiles(Array.from(e.dataTransfer.files ?? []));
  }

  async function onReplaceSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const i = replacingIndex;
    if (!file || i === null) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadVideo(file, { folder });
      updateAt(i, { url, caption: value[i]?.caption });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setReplacingIndex(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  }

  function updateAt(i: number, patch: Partial<MediaVideo>) {
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function reorderTo(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  const iconButtonClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink/45 transition-colors hover:bg-ink/5 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent dark:text-sand/45 dark:hover:bg-white/10";

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>

      {value.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {value.map((v, i) => {
            const { provider } = parseVideoUrl(v.url);
            return (
            <div
              key={`${v.url}-${i}`}
              draggable
              onDragStart={() => setDraggedIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null) reorderTo(draggedIndex, i);
                setDraggedIndex(null);
              }}
              onDragEnd={() => setDraggedIndex(null)}
              className={`rounded-xl border border-ink/10 p-2.5 dark:border-white/15 ${draggedIndex === i ? "opacity-40" : ""}`}
            >
              <div className="relative mb-2">
                {provider === "mp4" ? (
                  <video src={v.url} controls preload="metadata" className="aspect-video w-full rounded-lg bg-black" />
                ) : (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-ink/5 text-ink/50 transition-colors hover:text-primary dark:bg-white/5 dark:text-sand/50"
                  >
                    <ExternalLink size={20} aria-hidden="true" />
                    <span className="text-xs font-semibold capitalize">{provider}</span>
                  </a>
                )}
                <span
                  className="absolute start-1.5 top-1.5 flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-lg bg-black/50 text-white active:cursor-grabbing"
                  aria-hidden="true"
                >
                  <GripVertical size={15} />
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  value={v.caption ?? ""}
                  onChange={(e) => updateAt(i, { caption: e.target.value })}
                  placeholder={captionPlaceholder}
                  className="min-w-0 flex-1 basis-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-primary dark:border-white/15 sm:basis-auto"
                />
                <div className="ms-auto flex items-center gap-0.5">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={moveEarlierAriaLabel} className={iconButtonClass}>
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label={moveLaterAriaLabel}
                    className={iconButtonClass}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingIndex(i);
                      replaceInputRef.current?.click();
                    }}
                    aria-label={replaceAriaLabel}
                    className={iconButtonClass}
                  >
                    <Repeat size={16} />
                  </button>
                  <button type="button" onClick={() => removeAt(i)} aria-label={removeAriaLabel} className={`${iconButtonClass} hover:text-red-500`}>
                    <X size={17} />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <input ref={replaceInputRef} type="file" accept="video/*" onChange={onReplaceSelected} className="hidden" />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`rounded-xl2 border-2 border-dashed p-4 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-ink/15 dark:border-white/15"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={onFilesSelected}
          className="hidden"
          id={`video-upload-${folder}`}
        />
        <label
          htmlFor={`video-upload-${folder}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <VideoIcon size={14} />}
          {uploading ? "Uploading…" : addLabel}
        </label>
        <p className="mt-1.5 text-xs text-ink/45 dark:text-sand/45">{hint}</p>
      </div>

      {pasteUrlPlaceholder && addUrlLabel && (
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={pastedUrl}
            onChange={(e) => setPastedUrl(e.target.value)}
            placeholder={pasteUrlPlaceholder}
            className="min-w-0 flex-1 rounded-lg border border-ink/12 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!pastedUrl.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-50 dark:border-white/20"
          >
            <Link2 size={14} aria-hidden="true" />
            {addUrlLabel}
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
