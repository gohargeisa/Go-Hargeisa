/**
 * Locale-aware product name/description resolution. Source: the web app's
 * `lib/utils/product-i18n.ts` (type-only imports). The native catalog +
 * product-detail screens use these so a shade/product renders its
 * `name_ar` / `name_so` exactly as the website does.
 */
export {
  productLocalizedName,
  productLocalizedDescription,
  variantLocalizedName,
} from "../../../lib/utils/product-i18n";
