import { getTranslations } from "next-intl/server";
import { SERVICE_TAG_ICON, toServiceTagCodes } from "@/lib/config/service-tags";

/**
 * Reusable "Services Offered" section for City Services detail pages whose
 * category has a services-offered vocabulary (Beauty Salons, Men's
 * Barbershops, Auto Repair & Services) — the service-tags equivalent of
 * components/shared/amenities-section.tsx. Renders nothing when there are
 * no known codes; callers should gate the section heading/wrapper on
 * hasServiceTags themselves first, same convention as AmenitiesSection.
 */
export async function ServiceTagsSection({ tags }: { tags: string[] | null | undefined }) {
  const codes = toServiceTagCodes(tags);
  if (codes.length === 0) return null;

  const t = await getTranslations("serviceTags");

  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {codes.map((code) => {
        const Icon = SERVICE_TAG_ICON[code];
        return (
          <li
            key={code}
            className="flex items-center gap-3 rounded-xl2 border border-ink/8 bg-white px-4 py-3.5 text-sm font-medium text-ink transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.03] dark:text-sand"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon size={17} className="text-primary" aria-hidden="true" />
            </span>
            <span className="truncate">{t(code)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Cheap sync check for callers that need to decide whether to render the
 * section heading/wrapper before this (async) component resolves. */
export function hasServiceTags(tags: string[] | null | undefined): boolean {
  return toServiceTagCodes(tags).length > 0;
}
