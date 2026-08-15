import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { CityServiceForm } from "@/components/admin/city-service-form";
import { getCityServiceCategories, getCategoryById } from "@/lib/data/categories";
import { getUserDisplayInfo } from "@/lib/actions/claims";
import { ProductsManager, type ProductManagerRow } from "@/components/business/products-manager";
import { DepartmentsManager, type DepartmentManagerRow } from "@/components/business/departments-manager";
import { DoctorsManager, type DoctorManagerRow } from "@/components/business/doctors-manager";
import { mapProduct, mapDepartment, mapDoctor } from "@/lib/data/mappers";
import type { OpeningHoursGroup } from "@/types";

export const metadata: Metadata = { title: "Edit City Service — Admin" };

export default async function EditCityServicePage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  const access = await requireListingsAccess(locale, `/${locale}/admin/city-services/${id}/edit`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();
  const { data, error } = await supabase.from("city_services").select("*").eq("id", id).single();

  if (error || !data) notFound();

  const service = data as unknown as Database["public"]["Tables"]["city_services"]["Row"];

  // Business owners may only edit city services assigned to them — RLS
  // enforces this on the actual write, but block the read here too so they
  // can't view another owner's listing details in the form (same as
  // app/[locale]/admin/hotels/[id]/edit/page.tsx).
  if (access?.role === "business_owner" && service.owner_id !== access.userId) {
    notFound();
  }

  const categories = await getCityServiceCategories();

  // Only a site admin may see/change the Assigned Owner field —
  // getUserDisplayInfo is itself admin-gated (assertOwner), so this only
  // ever runs for role='owner'.
  const canAssignOwner = access?.role === "owner";
  const initialOwner = canAssignOwner && service.owner_id ? await getUserDisplayInfo(service.owner_id) : null;

  // Phase 4 — only Perfume & Cosmetics shops (categories.supports_products)
  // get the Products manager embedded here, same gating as /business/products.
  const category = await getCategoryById(service.category_id);
  const productRows: ProductManagerRow[] = [];
  if (category?.supportsProducts) {
    const { data: productData } = await supabase
      .from("products")
      .select("*")
      .eq("listing_type", "city_service")
      .eq("listing_id", service.id)
      .order("sort_order", { ascending: true });
    for (const row of productData ?? []) {
      const p = mapProduct(row);
      productRows.push({
        id: p.id, name: p.name, nameAr: p.nameAr, nameSo: p.nameSo,
        description: p.description, descriptionAr: p.descriptionAr, descriptionSo: p.descriptionSo,
        brand: p.brand, category: p.category, gender: p.gender, price: p.price, currency: p.currency,
        image: p.image, gallery: p.gallery, isAvailable: p.isAvailable, isFeatured: p.isFeatured,
        isHidden: p.isHidden, sortOrder: p.sortOrder,
      });
    }
  }

  // Phase 4 — only Hospitals/Clinics/Dental Clinics (categories.supports_appointments)
  // get Departments/Doctors managers embedded here, same gating as
  // /business/departments and /business/doctors.
  const departmentRows: DepartmentManagerRow[] = [];
  const doctorRows: DoctorManagerRow[] = [];
  if (category?.supportsAppointments) {
    const [{ data: departmentData }, { data: doctorData }] = await Promise.all([
      supabase.from("departments").select("*").eq("city_service_id", service.id).order("sort_order", { ascending: true }),
      supabase.from("doctors").select("*").eq("city_service_id", service.id).order("sort_order", { ascending: true }),
    ]);
    for (const row of departmentData ?? []) {
      const d = mapDepartment(row);
      departmentRows.push({ id: d.id, name: d.name, nameAr: d.nameAr, nameSo: d.nameSo, sortOrder: d.sortOrder });
    }
    for (const row of doctorData ?? []) {
      const doc = mapDoctor(row);
      doctorRows.push({
        id: doc.id, name: doc.name, photo: doc.photo,
        specialty: doc.specialty, specialtyAr: doc.specialtyAr, specialtySo: doc.specialtySo,
        bio: doc.bio, bioAr: doc.bioAr, bioSo: doc.bioSo,
        languages: doc.languages, workingHours: doc.workingHours,
        appointmentDurationMinutes: doc.appointmentDurationMinutes, isActive: doc.isActive,
        departmentId: doc.departmentId, sortOrder: doc.sortOrder,
      });
    }
  }

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("editCityServiceTitle")}</h1>
      <CityServiceForm
        locale={locale}
        mode="edit"
        serviceId={service.id}
        categories={categories}
        canAssignOwner={canAssignOwner}
        initialOwner={initialOwner ? { id: initialOwner.id, name: initialOwner.fullName, email: initialOwner.email } : null}
        initial={{
          categoryId: service.category_id,
          name: service.name,
          nameAr: service.name_ar ?? "",
          nameSo: service.name_so ?? "",
          description: service.description ?? "",
          descriptionAr: service.description_ar ?? "",
          descriptionSo: service.description_so ?? "",
          phone: service.phone ?? "",
          whatsapp: service.whatsapp ?? "",
          email: service.email ?? "",
          openingHours: service.opening_hours ?? "",
          mapsUrl: service.maps_url ?? "",
          website: service.website ?? "",
          image: service.image ?? "",
          logoUrl: service.logo_url ?? "",
          gallery: Array.isArray(service.gallery) ? (service.gallery as unknown as { url: string; alt?: string; category?: string }[]) : [],
          videos: Array.isArray(service.videos) ? (service.videos as unknown as { url: string; caption?: string }[]) : [],
          documentUrl: service.document_url ?? "",
          lat: service.lat,
          lng: service.lng,
          amenitiesV2: service.amenities_v2 ?? [],
          openingHoursStructured: Array.isArray(service.opening_hours_structured)
            ? (service.opening_hours_structured as unknown as OpeningHoursGroup[])
            : [],
          is24Hours: service.is_24_hours,
          temporarilyClosed: service.temporarily_closed,
          permanentlyClosed: service.permanently_closed,
          socialInstagram: service.social_instagram ?? "",
          socialFacebook: service.social_facebook ?? "",
          socialTiktok: service.social_tiktok ?? "",
          socialSnapchat: service.social_snapchat ?? "",
          socialX: service.social_x ?? "",
          socialYoutube: service.social_youtube ?? "",
          socialTelegram: service.social_telegram ?? "",
          status: service.status === "archived" ? "draft" : service.status,
          featured: service.featured,
          isPartner: service.is_partner,
        }}
      />

      {category?.supportsProducts && (
        <div className="mt-8">
          <ProductsManager
            listingId={service.id}
            initialProducts={productRows}
            revalidatePaths={[`/${locale}/admin/city-services/${service.id}/edit`]}
            locale={locale}
          />
        </div>
      )}

      {category?.supportsAppointments && (
        <div className="mt-8 space-y-6">
          <DepartmentsManager
            cityServiceId={service.id}
            initialDepartments={departmentRows}
            revalidatePaths={[`/${locale}/admin/city-services/${service.id}/edit`]}
          />
          <DoctorsManager
            cityServiceId={service.id}
            initialDoctors={doctorRows}
            departments={departmentRows}
            revalidatePaths={[`/${locale}/admin/city-services/${service.id}/edit`]}
          />
        </div>
      )}
    </section>
  );
}
