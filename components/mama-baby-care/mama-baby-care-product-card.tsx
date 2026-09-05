"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star, Expand } from "lucide-react";
import { ProductImage } from "@/components/shared/product-image";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import { productCategoryLabel } from "@/lib/config/product-categories";
import { productLocalizedName } from "@/lib/utils/product-i18n";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { Product } from "@/types";

/**
 * Product tile for the Mama & Baby Care storefront — deliberately its own
 * component rather than the universal ProductCard: this brief calls for NO
 * price anywhere on this page (not even a "price on request" label), and a
 * single "Contact on WhatsApp" action for every product regardless of
 * availability/variants — simpler rules than the cart-integrated universal
 * card, which always renders some price-shaped text.
 *
 * Clicking the photo opens it full-size in the shared Lightbox (same
 * component the Gallery uses) — the one "product interaction" this brief
 * calls for beyond the WhatsApp CTA, without a cart/checkout modal.
 */
export function MamaBabyCareProductCard({
  product,
  whatsappNumber,
  storeName,
  locale,
  accentColor,
}: {
  product: Product;
  whatsappNumber?: string;
  storeName: string;
  locale: string;
  accentColor: string;
}) {
  const t = useTranslations("mamaBabyCareStorefront");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const name = productLocalizedName(product, locale);
  const categoryLabel = product.category ? productCategoryLabel(product.category, locale) : undefined;
  const whatsappHref = whatsappNumber ? toWhatsAppHref(whatsappNumber, t("productWhatsappMessage", { product: name })) : undefined;
  const slides: LightboxSlide[] = product.image ? [{ url: product.image, alt: name }] : [];

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-ink/8 bg-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => slides.length > 0 && setLightboxOpen(true)}
        aria-label={`${name} — ${t("viewLargerLabel")}`}
        className="relative block aspect-square w-full shrink-0 overflow-hidden text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ProductImage
          src={product.image}
          alt={name}
          sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
          className="object-contain transition-transform duration-500 group-hover:scale-[1.04]"
          fit="contain"
        />
        {product.isFeatured && (
          <span
            className="pointer-events-none absolute start-2.5 top-2.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <Star size={13} aria-hidden="true" fill="currentColor" />
          </span>
        )}
        {slides.length > 0 && (
          <span className="pointer-events-none absolute bottom-2 end-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink/55 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
            <Expand size={13} aria-hidden="true" />
          </span>
        )}
      </button>

      {lightboxOpen && slides.length > 0 && (
        <Lightbox slides={slides} index={0} onClose={() => setLightboxOpen(false)} onIndexChange={() => {}} />
      )}

      <div className="flex flex-1 flex-col p-3.5">
        <p dir="auto" className="line-clamp-2 text-sm font-semibold leading-snug">
          {name}
        </p>
        {categoryLabel && <p className="mt-0.5 text-xs text-ink/45 dark:text-sand/45">{categoryLabel}</p>}

        <div className="mt-auto pt-3">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#25D366] py-2 text-xs font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-[#1FB855] active:scale-95"
            >
              <WhatsAppIcon size={14} aria-hidden="true" />
              {t("contactWhatsappCta")}
            </a>
          ) : (
            <span className="block text-center text-xs text-ink/40 dark:text-sand/40">{storeName}</span>
          )}
        </div>
      </div>
    </div>
  );
}
