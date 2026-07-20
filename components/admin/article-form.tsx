"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import type { Locale } from "@/lib/i18n/config";

export interface ArticleFormInput {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  category: string;
  readMinutes: number;
}

const CATEGORY_SUGGESTIONS = ["Guides", "Food", "Culture", "Travel Tips", "History"];

export function ArticleForm({
  locale,
  mode,
  articleId,
  initial,
}: {
  locale: Locale;
  mode: "create" | "edit";
  articleId?: string;
  initial?: Partial<ArticleFormInput>;
}) {
  const [form, setForm] = useState<ArticleFormInput>({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    body: initial?.body ?? "",
    coverImage: initial?.coverImage ?? "",
    category: initial?.category ?? "Guides",
    readMinutes: initial?.readMinutes ?? 5,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ArticleFormInput>(key: K, value: ArticleFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.coverImage) {
      setError("Please upload a cover image.");
      return;
    }

    const payload = {
      slug: form.slug,
      title: form.title,
      excerpt: form.excerpt,
      body: form.body,
      cover_image: form.coverImage,
      category: form.category,
      read_minutes: form.readMinutes,
      published_at: new Date().toISOString(),
    };
    const revalidatePaths = [`/${locale}/admin/articles`, `/${locale}/blog`, `/${locale}`];
    const redirectTo = `/${locale}/admin/articles`;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecord("articles", payload, revalidatePaths, redirectTo)
          : await updateRecord("articles", articleId!, payload, revalidatePaths, redirectTo);
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="articles" value={form.coverImage} onChange={(url) => update("coverImage", url)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Article title">
          <input required value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} />
        </Field>
        <Field label="URL slug">
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="top-10-things-to-do-in-hargeisa" />
        </Field>
      </div>

      <Field label="Excerpt" hint="A one- or two-sentence summary shown on the blog index">
        <textarea required rows={2} value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} className={inputClass} />
      </Field>

      <Field label="Body" hint="Plain Markdown — paragraphs separated by a blank line">
        <textarea required rows={10} value={form.body} onChange={(e) => update("body", e.target.value)} className={`${inputClass} font-mono text-xs`} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <input
            required
            list="article-categories"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className={inputClass}
          />
          <datalist id="article-categories">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Read time (minutes)">
          <input
            required
            type="number"
            min={1}
            value={form.readMinutes}
            onChange={(e) => update("readMinutes", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? "Publish Article" : "Save Changes"}
      </button>
    </form>
  );
}
