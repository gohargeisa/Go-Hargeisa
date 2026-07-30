"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { submitJoinRequest } from "@/lib/actions/business-requests";
import { ImageUploader } from "@/components/shared/image-uploader";
import type { JoinRequestCategory } from "@/types";

const MAX_GALLERY = 6;

export function JoinRequestForm() {
  const t = useTranslations("joinRequest");
  const [category, setCategory] = useState<JoinRequestCategory>("hotel");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [menuPdfUrl, setMenuPdfUrl] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function addGallerySlot() {
    if (gallery.length < MAX_GALLERY) setGallery((g) => [...g, ""]);
  }
  function updateGallerySlot(i: number, url: string) {
    setGallery((g) => g.map((v, idx) => (idx === i ? url : v)));
  }
  function removeGallerySlot(i: number) {
    setGallery((g) => g.filter((_, idx) => idx !== i));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitJoinRequest({
        category,
        businessName,
        ownerName,
        phone,
        whatsapp: whatsapp || undefined,
        email,
        address,
        mapsUrl: mapsUrl || undefined,
        description,
        logo: logo || undefined,
        gallery: gallery.filter(Boolean),
        menuPdfUrl: menuPdfUrl || undefined,
        bookingUrl: bookingUrl || undefined,
        website: website || undefined,
      });

      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-secondary/25 bg-secondary/5 p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-secondary-700">
          <Check size={26} />
        </span>
        <p className="font-display text-xl font-bold">{t("successTitle")}</p>
        <p className="max-w-md text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t("successDescription")}</p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-2xl border border-ink/12 bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-white/15";
  const labelClass = "mb-2 block text-sm font-semibold text-ink/85 dark:text-sand/85";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>{t("categoryLabel")}</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as JoinRequestCategory)}
          className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat pe-10 rtl:bg-[position:left_1rem_center]`}
        >
          <option value="hotel">{t("categoryHotel")}</option>
          <option value="restaurant">{t("categoryRestaurant")}</option>
          <option value="cafe">{t("categoryCafe")}</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t("businessNameLabel")}</label>
          <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t("ownerNameLabel")}</label>
          <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className={labelClass}>{t("phoneLabel")}</label>
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </div>
        <div>
          <label className={labelClass}>{t("whatsappLabel")}</label>
          <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </div>
        <div>
          <label className={labelClass}>{t("emailLabel")}</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("addressLabel")}</label>
        <input required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>{t("mapsUrlLabel")}</label>
        <input type="url" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} className={inputClass} placeholder="https://maps.google.com/…" />
      </div>

      <div>
        <label className={labelClass}>{t("descriptionLabel")}</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} resize-none leading-relaxed`}
        />
      </div>

      <ImageUploader folder="join-requests" value={logo} onChange={setLogo} label={t("logoLabel")} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-semibold text-ink/85 dark:text-sand/85">{t("galleryLabel")}</label>
          {gallery.length < MAX_GALLERY && (
            <button
              type="button"
              onClick={addGallerySlot}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <Plus size={13} /> {t("addPhotoLabel")}
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {gallery.map((url, i) => (
            <div key={i} className="relative">
              <ImageUploader folder="join-requests" value={url} onChange={(u) => updateGallerySlot(i, u)} label={`${t("galleryLabel")} ${i + 1}`} />
              <button
                type="button"
                onClick={() => removeGallerySlot(i)}
                aria-label={t("removePhotoLabel")}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {category !== "hotel" && (
        <ImageUploader folder="join-requests" value={menuPdfUrl} onChange={setMenuPdfUrl} label={t("menuPdfLabel")} />
      )}

      {category === "hotel" && (
        <div>
          <label className={labelClass}>{t("bookingUrlLabel")}</label>
          <input type="url" value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} className={inputClass} placeholder="https://…" />
        </div>
      )}

      <div>
        <label className={labelClass}>{t("websiteLabel")}</label>
        <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://…" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/15 dark:text-red-300">
          <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(245,158,11,0.3)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_14px_30px_rgba(245,158,11,0.4)] disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none sm:w-auto"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />} {t("submitButton")}
      </button>
    </form>
  );
}
