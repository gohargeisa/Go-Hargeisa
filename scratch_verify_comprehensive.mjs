import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = readFileSync("C:/Projects/go-hargeisa/.env.local", "utf8");
const get = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
const supabase = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"));

const { data: cats } = await supabase.from("categories").select("*").eq("target_table", "city_services").order("sort_order");
console.log("=== city_services categories after migration ===");
for (const c of cats ?? []) console.log(`${c.is_active ? "ACTIVE  " : "inactive"} | ${c.slug.padEnd(18)} | ${c.name.padEnd(25)} | ${c.name_ar} | ${c.name_so}`);

// confirm hospital listing still attached
const hospitalCat = cats.find((c) => c.slug === "hospital");
const { data: hospListings } = await supabase.from("city_services").select("name").eq("category_id", hospitalCat.id);
console.log("\nHospitals category listings:", hospListings);

// confirm mosque listing still exists in DB (just hidden from UI)
const mosqueCat = cats.find((c) => c.slug === "mosque");
const { data: mosqueListings } = await supabase.from("city_services").select("name, status").eq("category_id", mosqueCat.id);
console.log("Mosque category listings (still in DB):", mosqueListings);

// real insert+delete test for the 3 new categories
for (const slug of ["clinic", "beauty-salon", "men-barbershop"]) {
  const cat = cats.find((c) => c.slug === slug);
  const enumVal = slug.replace(/-/g, "_");
  const { data: ins, error } = await supabase
    .from("city_services")
    .insert({ slug: "test-" + slug + "-" + Date.now(), category_id: cat.id, category: enumVal, name: "Test (verification)", lat: 9.5624, lng: 44.065, status: "draft" })
    .select("id")
    .single();
  if (error) console.error(slug, "INSERT FAILED:", error.message);
  else {
    console.log(slug, "insert succeeded");
    await supabase.from("city_services").delete().eq("id", ins.id);
  }
}

// confirm old services-vertical dupes deactivated
const { data: oldDupes } = await supabase.from("categories").select("slug, is_active").in("slug", ["beauty-salons", "clinics"]).eq("target_table", "services");
console.log("\nold services-vertical dupes:", oldDupes);
