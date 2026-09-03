import type { CategoryDTO } from "@gohargeisa/api";
import { getVisibleCategoriesWithCounts } from "@/lib/data/categories";
import { corsPreflight, handle, jsonOk } from "../_lib/http";
import { toCategoryDTO } from "../_lib/dto";

// Public, cacheable — the same visible-category list + counts the website's
// navbar and homepage grid render.

export function OPTIONS() {
  return corsPreflight();
}

export const GET = handle(async (_req, { locale }) => {
  const categories = await getVisibleCategoriesWithCounts();
  const body: CategoryDTO[] = categories.map((c) => toCategoryDTO(c, locale));
  return jsonOk(body);
});
