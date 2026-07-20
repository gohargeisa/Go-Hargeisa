"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import type { Locale } from "@/lib/i18n/config";

export interface EventFormInput {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  category: "cultural" | "national" | "business" | "sports" | "concert";
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  location: string;
  ticketInfo?: string;
}

export function EventForm({
  locale,
  mode,
  eventId,
  initial,
}: {
  locale: Locale;
  mode: "create" | "edit";
  eventId?: string;
  initial?: Partial<EventFormInput>;
}) {
  const [form, setForm] = useState<EventFormInput>({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    coverImage: initial?.coverImage ?? "",
    category: initial?.category ?? "cultural",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    location: initial?.location ?? "",
    ticketInfo: initial?.ticketInfo ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof EventFormInput>(key: K, value: EventFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.coverImage) {
      setError("Please upload a cover image.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Please set a start and end date.");
      return;
    }

    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description,
      cover_image: form.coverImage,
      category: form.category,
      start_date: new Date(form.startDate).toISOString(),
      end_date: new Date(form.endDate).toISOString(),
      location: form.location,
      ticket_info: form.ticketInfo || null,
    };
    const revalidatePaths = [`/${locale}/admin/events`, `/${locale}/events`, `/${locale}`];
    const redirectTo = `/${locale}/admin/events`;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecord("events", payload, revalidatePaths, redirectTo)
          : await updateRecord("events", eventId!, payload, revalidatePaths, redirectTo);
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="events" value={form.coverImage} onChange={(url) => update("coverImage", url)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event title">
          <input required value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} />
        </Field>
        <Field label="URL slug">
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="hargeisa-book-fair" />
        </Field>
      </div>

      <Field label="Description">
        <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <input required type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className={inputClass} />
        </Field>
        <Field label="End date">
          <input required type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location">
          <input required value={form.location} onChange={(e) => update("location", e.target.value)} className={inputClass} placeholder="Freedom Park" />
        </Field>
        <Field label="Category">
          <select value={form.category} onChange={(e) => update("category", e.target.value as EventFormInput["category"])} className={inputClass}>
            <option value="cultural">Cultural</option>
            <option value="national">National</option>
            <option value="business">Business</option>
            <option value="sports">Sports</option>
            <option value="concert">Concert</option>
          </select>
        </Field>
      </div>

      <Field label="Ticket info" hint="Optional — price, link, or 'Free entry'">
        <input value={form.ticketInfo} onChange={(e) => update("ticketInfo", e.target.value)} className={inputClass} />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? "Publish Event" : "Save Changes"}
      </button>
    </form>
  );
}
