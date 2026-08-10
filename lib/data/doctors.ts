import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapDoctor, mapDepartment } from "./mappers";
import type { Doctor, Department } from "@/types";

/** Active doctors for a Hospital/Clinic/Dental Clinic listing — public read,
 * same createPublicClient pattern as getProductsForListing/getCityServiceBySlug. */
async function _getDoctorsForListing(cityServiceId: string): Promise<Doctor[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("city_service_id", cityServiceId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getDoctorsForListing:", error.message);
    return [];
  }
  return (data ?? []).map(mapDoctor);
}

export const getDoctorsForListing = cache(_getDoctorsForListing);

async function _getDepartmentsForListing(cityServiceId: string): Promise<Department[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("city_service_id", cityServiceId)
    .order("sort_order", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getDepartmentsForListing:", error.message);
    return [];
  }
  return (data ?? []).map(mapDepartment);
}

export const getDepartmentsForListing = cache(_getDepartmentsForListing);
