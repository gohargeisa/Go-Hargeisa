import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = Object.fromEntries(
  fs.readFileSync("C:/Projects/go-hargeisa/.env.local", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: service } = await supabase.from("city_services").select("id").eq("slug", "flormar-hargeisa").maybeSingle();
const { data: products } = await supabase
  .from("products")
  .select("id,name,image,gallery,sku,category")
  .eq("listing_type", "city_service")
  .eq("listing_id", service.id)
  .is("image", null);

console.log("products with image=null:", products.length);
for (const p of products) {
  console.log(`\n- "${p.name}" (sku=${p.sku}, category=${p.category})`);
  console.log("  gallery:", JSON.stringify(p.gallery));
  const { data: variants } = await supabase.from("product_variants").select("name,image").eq("product_id", p.id);
  const withImg = (variants ?? []).filter(v => v.image);
  console.log(`  variants: ${variants?.length ?? 0} total, ${withImg.length} with their own image`);
  if (withImg.length > 0) console.log("  sample variant image:", withImg[0].name, "->", withImg[0].image);
}
