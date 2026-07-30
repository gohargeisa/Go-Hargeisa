"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Plus, X } from "lucide-react";
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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary-700">
          <Check size={22} />
        </span>
        <p className="font-display text-lg font-bold">{t("successTitle")}</p>
        <p className="max-w-md text-sm text-ink/60 dark:text-sand/60">{t("successDescription")}</p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("categoryLabel")}</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as JoinRequestCategory)} className={inputClass}>
          <option value="hotel">{t("categoryHotel")}</option>
          <option value="restaurant">{t("categoryRestaurant")}</option>
          <option value="cafe">{t("categoryCafe")}</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("businessNameLabel")}</label>
          <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("ownerNameLabel")}</label>
          <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("phoneLabel")}</label>
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("whatsappLabel")}</label>
          <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("emailLabel")}</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("addressLabel")}</label>
        <input required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("mapsUrlLabel")}</label>
        <input type="url" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} className={inputClass} placeholder="https://maps.google.com/…" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("descriptionLabel")}</label>
        <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </div>

      <ImageUploader folder="join-requests" value={logo} onChange={setLogo} label={t("logoLabel")} />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-semibold">{t("galleryLabel")}</label>
          {gallery.length < MAX_GALLERY && (
            <button type="button" onClick={addGallerySlot} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
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
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
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
          <label className="mb-1.5 block text-sm font-semibold">{t("bookingUrlLabel")}</label>
          <input type="url" value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} className={inputClass} placeholder="https://…" />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("websiteLabel")}</label>
        <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://…" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />} {t("submitButton")}
      </button>
    </form>
  );
}
