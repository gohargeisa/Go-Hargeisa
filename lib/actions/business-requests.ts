"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { placeholderImage } from "@/lib/placeholder-image";
import { logActivity } from "./activity";
import { isConvertibleCategory } from "@/lib/utils/partner-categories";
import { getCategoryById } from "@/lib/data/categories";
import { weeklyHoursToGroups } from "@/lib/utils/weekly-hours";
import { CUISINE_LABELS, type CuisineCode } from "@/lib/config/restaurant-attributes";
import type { JoinRequestCategory, BusinessRequestStatus, GalleryImage, MediaVideo, BusinessDocument, WeeklyHoursDay } from "@/types";

async function assertOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") throw new Error("Not authorized.");

  return supabase;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export interface JoinRequestInput {
  category: JoinRequestCategory;
  /** Required, and must reference an active category with target_table
   * 'services', when category === "other". Ignored for hotel/restaurant/cafe. */
  categoryId?: string;
  /** Values for the referenced category's customFieldsSchema. Ignored unless categoryId is set. */
  customFields?: Record<string, string | number | boolean>;
  /** Selected codes from the referenced category's subcategory vocabulary —
   * either the services-offered vocabulary (Beauty Salons/Men's
   * Barbershops/Auto Repair & Services, see lib/config/service-tags.ts) or,
   * for Cosmetics & Women's Beauty, a curated subset of product categories
   * (see COSMETICS_SPECIALTY_CATEGORIES in lib/config/product-categories.ts).
   * Ignored unless categoryId is set. */
  serviceTags?: string[];
  businessName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  address: string;
  city: string;
  district?: string;
  lat?: number;
  lng?: number;
  mapsUrl?: string;
  description: string;
  logo?: string;
  coverImage?: string;
  gallery?: GalleryImage[];
  videos?: MediaVideo[];
  documents?: BusinessDocument[];
  menuPdfUrl?: string;
  bookingUrl?: string;
  /** Hotel-only intake fields — ignored for every other category. Mirror
   * real hotels columns/concepts 1:1 (see lib/config/hotel-attributes.ts,
   * lib/utils/room-type.ts) so conversion can map them directly; carried
   * only on business_join_requests until then — the real per-room-type
   * rows still get created properly via HotelRoomsManager after approval,
   * this is just an admin-review hint of what the owner intends to offer. */
  bookingWhatsapp?: string;
  bookingComUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  hotelType?: string;
  starRating?: number;
  estimatedRoomCount?: number;
  roomTypesOffered?: string[];
  numberOfFloors?: number;
  yearEstablished?: number;
  languagesSpoken?: string[];
  openingHours?: WeeklyHoursDay[];
  amenities?: string[];
  priceRange?: "$" | "$$" | "$$$" | "$$$$";
  /** Restaurant-only intake fields — ignored for every other category. */
  restaurantType?: string;
  cuisine?: string[];
  numberOfTables?: number;
  onlineOrderUrl?: string;
  is24Hours?: boolean;
  /** Shared by Restaurant + Cafe (both map to a single `seating_capacity`
   * column, gated by whichever of the two is actually selected). */
  seatingCapacity?: number;
  /** Cafe-only intake field. */
  cafeType?: string;
  /** School-only intake fields — set only when category === "other" and the
   * resolved category slug is "school". */
  schoolType?: string;
  curriculum?: string;
  educationLevels?: string[];
  ageRangeGrades?: string;
  numberOfClassrooms?: number;
  /** University-only intake fields — set only when the resolved category
   * slug is "university". */
  universityType?: string;
  degreeLevels?: string[];
  facultiesOffered?: string[];
  numberOfBuildings?: number;
  /** Shared by School + University. */
  educationFacilities?: string[];
  numberOfStudents?: number;
  numberOfTeachers?: number;
  admissionsOpen?: boolean;
  admissionPhone?: string;
  admissionWhatsapp?: string;
  admissionUrl?: string;
  applicationUrl?: string;
  /** Women's Beauty Salon-only intake field (women-only category). */
  salonType?: string;
  /** Men's Barbershop-only intake field (men-only category). */
  shopType?: string;
  /** Shared by Salon + Barbershop + Auto Repair. */
  staffCount?: number;
  walkInsAccepted?: boolean;
  homeServiceAvailable?: boolean;
  /** Shared by Cosmetics & Women's Beauty + Perfumes + Auto Repair. */
  storeType?: string;
  brands?: string[];
  /** Car Rental-only intake fields. */
  rentalType?: string;
  vehicleTypes?: string[];
  minimumRentalPeriod?: string;
  driversLicenseRequired?: boolean;
  depositRequired?: boolean;
  fleetSize?: number;
  /** Clinics / Medical Clinics-only intake fields (clinic-level; the
   * per-doctor Medical Appointment Engine is untouched). Dental Clinic is
   * now one clinicType value within this category, not a separate one. */
  clinicType?: string;
  numberOfTreatmentRooms?: number;
  insuranceAccepted?: string[];
  /** Auto Repair-only intake field. */
  garageType?: string;
  /** Gym / Fitness Center-only intake fields. */
  gymType?: string;
  classesOffered?: string[];
  membershipOptions?: string[];
  personalTrainingAvailable?: boolean;
  groupClassesAvailable?: boolean;
  gymFacilities?: string[];
  trainersAvailable?: boolean;
  femaleTrainersAvailable?: boolean;
  maleTrainersAvailable?: boolean;
  trialMembershipAvailable?: boolean;
  /** Travel Agency / Travel Office-only intake fields (target_table
   * 'services', not 'city_services'). */
  travelAgencyType?: string;
  flightTicketing?: boolean;
  hotelBooking?: boolean;
  visaAssistance?: boolean;
  tourPackages?: boolean;
  airportTransfers?: boolean;
  carRentalAssistance?: boolean;
  hajjUmrahServices?: boolean;
  localTours?: boolean;
  internationalTours?: boolean;
  groupTours?: boolean;
  travelInsuranceAssistance?: boolean;
  /** Flower Shop-only intake fields (target_table 'services'). */
  flowerShopType?: string;
  flowerDeliveryAvailable?: boolean;
  sameDayDelivery?: boolean;
  customBouquets?: boolean;
  weddingArrangements?: boolean;
  eventDecorationService?: boolean;
  giftWrapping?: boolean;
  indoorPlants?: boolean;
  outdoorPlants?: boolean;
  onlineOrderingAvailable?: boolean;
  deliveryAreas?: string[];
  /** "Services offered" chips picked at intake for Apartments/Real Estate/
   * Electronics/Transportation — carried onto `services.services` at
   * conversion (previously that column was only ever set to [categoryName]). */
  servicesOffered?: string[];
  /** Apartments-only intake fields (target_table 'services'). */
  apartmentType?: string;
  bedrooms?: number;
  bathrooms?: number;
  unitsCount?: number;
  floorNumber?: number;
  buildingFloors?: number;
  furnished?: boolean;
  monthlyRent?: number;
  dailyRent?: number;
  securityDeposit?: number;
  minStayNights?: number;
  maxStayNights?: number;
  parkingAvailable?: boolean;
  wifiAvailable?: boolean;
  airConditioning?: boolean;
  kitchenAvailable?: boolean;
  electricityIncluded?: boolean;
  waterIncluded?: boolean;
  generatorAvailable?: boolean;
  securityAvailable?: boolean;
  elevatorAvailable?: boolean;
  swimmingPool?: boolean;
  laundryAvailable?: boolean;
  familyFriendly?: boolean;
  petPolicy?: string;
  /** Real Estate-only intake fields (target_table 'services'). */
  propertyType?: string;
  listingPurpose?: string;
  price?: number;
  priceCurrency?: string;
  realEstateBedrooms?: number;
  realEstateBathrooms?: number;
  floorsCount?: number;
  yearBuilt?: number;
  areaSqm?: number;
  landAreaSqm?: number;
  buildingAreaSqm?: number;
  realEstateParkingAvailable?: boolean;
  realEstateFurnished?: boolean;
  documentsAvailable?: boolean;
  viewingAvailable?: boolean;
  propertyCondition?: string;
  ownershipStatus?: string;
  /** Electronics-only intake fields (target_table 'services'). */
  electronicsBusinessType?: string;
  brandsAvailable?: string[];
  sellsNew?: boolean;
  sellsUsed?: boolean;
  warrantyAvailable?: boolean;
  electronicsDeliveryAvailable?: boolean;
  electronicsRepairAvailable?: boolean;
  installationAvailable?: boolean;
  paymentOptions?: string[];
  /** Transportation-only intake fields (target_table 'services'). */
  transportationType?: string;
  vehicleCount?: number;
  passengerCapacity?: number;
  driverAvailable?: boolean;
  airportTransferAvailable?: boolean;
  cityTransfersAvailable?: boolean;
  intercityTransportAvailable?: boolean;
  rentalAvailable?: boolean;
  dailyRentalAvailable?: boolean;
  weeklyRentalAvailable?: boolean;
  monthlyRentalAvailable?: boolean;
  deliveryServiceAvailable?: boolean;
  cargoServiceAvailable?: boolean;
  /** Hospital-only intake fields (target_table 'city_services'). */
  hospitalType?: string;
  bedsCount?: number;
  doctorsCount?: number;
  nursesCount?: number;
  departmentsCount?: number;
  operatingRoomsCount?: number;
  emergencyDepartment?: boolean;
  icuAvailable?: boolean;
  pharmacyOnsite?: boolean;
  laboratoryOnsite?: boolean;
  radiologyOnsite?: boolean;
  ambulanceAvailable?: boolean;
  maternityDepartment?: boolean;
  pediatricDepartment?: boolean;
  visitingHours?: string;
  /** Pharmacy-only intake fields (target_table 'city_services'). */
  pharmacyType?: string;
  pharmacyDeliveryAvailable?: boolean;
  prescriptionRequired?: boolean;
  homeDelivery?: boolean;
  pharmacyEmergencyContact?: string;
}

/**
 * Public — no auth required, matches the anon-insert shape already proven
 * safe for business_claims/contact_messages. Full server-side validation
 * since this is the only real gate (the public form's own validation is
 * just UX, not a security boundary).
 */
export async function submitJoinRequest(input: JoinRequestInput): Promise<{ ok: boolean; error?: string }> {
  const businessName = input.businessName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const address = input.address.trim();
  const city = input.city.trim();
  const description = input.description.trim();

  if (!businessName || !phone || !email || !address || !city || !description) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (digitsOnly(phone).length < 7) {
    return { ok: false, error: "Please enter a valid phone number." };
  }
  const isFixedCategory = input.category === "hotel" || input.category === "restaurant" || input.category === "cafe";
  if (!isFixedCategory && input.category !== "other") {
    return { ok: false, error: "Invalid category." };
  }
  if (input.category === "other" && !input.categoryId) {
    return { ok: false, error: "Please choose a business category." };
  }
  if (input.lat !== undefined && (input.lat < -90 || input.lat > 90)) {
    return { ok: false, error: "Invalid location." };
  }
  if (input.lng !== undefined && (input.lng < -180 || input.lng > 180)) {
    return { ok: false, error: "Invalid location." };
  }

  // Public client — this table's RLS grants anonymous INSERT, but every
  // other query here (the duplicate check, the category check below) should
  // use the same unauthenticated path rather than assuming a signed-in
  // session exists.
  const supabase = createPublicClient();

  // Resolved once here and reused below to gate School/University/Salon/
  // Barbershop-specific columns server-side — mirrors how category==="hotel"
  // already gates hotel-only columns, so these new fields get the same
  // real (not just client-side) validation.
  let resolvedOtherSlug: string | null = null;

  if (input.category === "other" && input.categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id, slug, target_table, is_active")
      .eq("id", input.categoryId)
      .maybeSingle();
    // City Services categories (Hospitals & Clinics, Pharmacies, ...) are
    // valid "other" selections — the same dynamic category source the
    // /join form's dropdown reads from (see app/[locale]/join/page.tsx).
    // The generic `services` vertical (target_table='services': Travel
    // Agencies, Apartments, Real Estate, Electronics, Transportation) has
    // been retired — its categories are no longer offered by the join form
    // and are rejected here too, in case of a direct/bypassed submission.
    if (!cat || !cat.is_active || cat.target_table !== "city_services") {
      return { ok: false, error: "Invalid category." };
    }
    resolvedOtherSlug = cat.slug;
  }

  const isSchool = resolvedOtherSlug === "school";
  const isUniversity = resolvedOtherSlug === "university";
  const isSalon = resolvedOtherSlug === "beauty-salon";
  const isBarbershop = resolvedOtherSlug === "men-barbershop";
  const isCosmetics = resolvedOtherSlug === "cosmetics-beauty";
  const isPerfume = resolvedOtherSlug === "perfume-shop";
  const isCarRental = resolvedOtherSlug === "car-rental";
  // Clinics / Medical Clinics — Dental Clinic is now one clinicType value
  // within this category (slug "clinic"), not a separate category. The
  // dental-clinic slug itself is deactivated (categories.is_active=false)
  // and can no longer be resolved here at all.
  const isClinic = resolvedOtherSlug === "clinic";
  const isAutoRepair = resolvedOtherSlug === "auto-repair";
  const isGym = resolvedOtherSlug === "gym";
  const isTravelAgency = resolvedOtherSlug === "tour-companies";
  const isFlowerShop = resolvedOtherSlug === "flower-shops";
  const isApartments = resolvedOtherSlug === "apartments";
  const isRealEstate = resolvedOtherSlug === "real-estate";
  const isElectronics = resolvedOtherSlug === "electronics";
  const isTransportation = resolvedOtherSlug === "transportation";
  const isHospital = resolvedOtherSlug === "hospital";
  const isPharmacy = resolvedOtherSlug === "pharmacy";

  const { data: existing } = await supabase
    .from("business_join_requests")
    .select("id")
    .ilike("email", email)
    .ilike("business_name", businessName)
    .in("status", ["pending", "needs_info"])
    .limit(1);

  if (existing && existing.length > 0) {
    return { ok: false, error: "A request for this business is already pending review." };
  }

  const { error } = await supabase.from("business_join_requests").insert({
    category: input.category,
    category_id: input.category === "other" ? (input.categoryId ?? null) : null,
    custom_fields: input.category === "other" ? (input.customFields ?? {}) : {},
    service_tags: input.category === "other" ? (input.serviceTags ?? []) : [],
    business_name: businessName,
    phone,
    whatsapp: input.whatsapp?.trim() || null,
    email,
    website: input.website?.trim() || null,
    instagram: input.instagram?.trim() || null,
    facebook: input.facebook?.trim() || null,
    address,
    city,
    district: input.district?.trim() || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    maps_url: input.mapsUrl?.trim() || null,
    description,
    logo: input.logo || null,
    cover_image: input.coverImage || null,
    gallery: input.gallery ?? [],
    videos: input.videos ?? [],
    documents: input.documents ?? [],
    menu_pdf_url: input.menuPdfUrl || null,
    booking_url: input.bookingUrl?.trim() || null,
    booking_whatsapp: input.category === "hotel" ? input.bookingWhatsapp?.trim() || null : null,
    booking_com_url: input.category === "hotel" ? input.bookingComUrl?.trim() || null : null,
    check_in_time: input.category === "hotel" ? input.checkInTime?.trim() || null : null,
    check_out_time: input.category === "hotel" ? input.checkOutTime?.trim() || null : null,
    hotel_type: input.category === "hotel" ? input.hotelType || null : null,
    star_rating: input.category === "hotel" ? input.starRating ?? null : null,
    estimated_room_count: input.category === "hotel" ? input.estimatedRoomCount ?? null : null,
    room_types_offered: input.category === "hotel" ? input.roomTypesOffered ?? [] : [],
    number_of_floors: input.category === "hotel" || isSchool || isUniversity ? input.numberOfFloors ?? null : null,
    year_established: input.category === "hotel" || isSchool || isUniversity ? input.yearEstablished ?? null : null,
    languages: input.category === "hotel" || input.category === "restaurant" || isSchool || isUniversity || isClinic || isTravelAgency || isHospital ? input.languagesSpoken ?? [] : [],
    opening_hours: input.openingHours ?? [],
    amenities: input.amenities ?? [],
    price_range: input.priceRange ?? null,
    // Restaurant
    restaurant_type: input.category === "restaurant" ? input.restaurantType || null : null,
    cuisine: input.category === "restaurant" ? input.cuisine ?? [] : [],
    number_of_tables: input.category === "restaurant" ? input.numberOfTables ?? null : null,
    online_order_url: input.category === "restaurant" ? input.onlineOrderUrl?.trim() || null : null,
    is_24_hours: input.category === "restaurant" || isPharmacy ? input.is24Hours ?? false : false,
    // Restaurant + Cafe
    seating_capacity: input.category === "restaurant" || input.category === "cafe" ? input.seatingCapacity ?? null : null,
    // Cafe
    cafe_type: input.category === "cafe" ? input.cafeType || null : null,
    // School
    school_type: isSchool ? input.schoolType || null : null,
    curriculum: isSchool ? input.curriculum || null : null,
    education_levels: isSchool ? input.educationLevels ?? [] : [],
    age_range_grades: isSchool ? input.ageRangeGrades?.trim() || null : null,
    number_of_classrooms: isSchool ? input.numberOfClassrooms ?? null : null,
    // University
    university_type: isUniversity ? input.universityType || null : null,
    degree_levels: isUniversity ? input.degreeLevels ?? [] : [],
    faculties_offered: isUniversity ? input.facultiesOffered ?? [] : [],
    number_of_buildings: isUniversity ? input.numberOfBuildings ?? null : null,
    // School + University
    education_facilities: isSchool || isUniversity ? input.educationFacilities ?? [] : [],
    number_of_students: isSchool || isUniversity ? input.numberOfStudents ?? null : null,
    number_of_teachers: isSchool || isUniversity ? input.numberOfTeachers ?? null : null,
    admissions_open: isSchool || isUniversity ? input.admissionsOpen ?? true : true,
    admission_phone: isSchool || isUniversity ? input.admissionPhone?.trim() || null : null,
    admission_whatsapp: isSchool || isUniversity ? input.admissionWhatsapp?.trim() || null : null,
    admission_url: isSchool || isUniversity ? input.admissionUrl?.trim() || null : null,
    application_url: isSchool || isUniversity ? input.applicationUrl?.trim() || null : null,
    // Women's Beauty Salon (women-only)
    salon_type: isSalon ? input.salonType || null : null,
    // Men's Barbershop (men-only)
    shop_type: isBarbershop ? input.shopType || null : null,
    // Salon + Barbershop + Auto Repair
    staff_count: isSalon || isBarbershop || isAutoRepair ? input.staffCount ?? null : null,
    walk_ins_accepted: isSalon || isBarbershop || isAutoRepair ? input.walkInsAccepted ?? null : null,
    home_service_available: isSalon || isBarbershop || isAutoRepair ? input.homeServiceAvailable ?? null : null,
    // Cosmetics + Perfumes + Auto Repair
    store_type: isCosmetics || isPerfume ? input.storeType || null : null,
    brands: isCosmetics || isPerfume || isAutoRepair ? input.brands ?? [] : [],
    // Car Rental
    rental_type: isCarRental ? input.rentalType || null : null,
    vehicle_types: isCarRental ? input.vehicleTypes ?? [] : [],
    minimum_rental_period: isCarRental ? input.minimumRentalPeriod?.trim() || null : null,
    drivers_license_required: isCarRental ? input.driversLicenseRequired ?? null : null,
    deposit_required: isCarRental ? input.depositRequired ?? null : null,
    fleet_size: isCarRental ? input.fleetSize ?? null : null,
    // Clinics / Medical Clinics (Dental Clinic is now one clinicType value)
    clinic_type: isClinic ? input.clinicType || null : null,
    number_of_treatment_rooms: isClinic ? input.numberOfTreatmentRooms ?? null : null,
    insurance_accepted: isClinic || isHospital || isPharmacy ? input.insuranceAccepted ?? [] : [],
    // Auto Repair
    garage_type: isAutoRepair ? input.garageType || null : null,
    // Gym / Fitness Center
    gym_type: isGym ? input.gymType || null : null,
    classes_offered: isGym ? input.classesOffered ?? [] : [],
    membership_options: isGym ? input.membershipOptions ?? [] : [],
    personal_training_available: isGym ? input.personalTrainingAvailable ?? null : null,
    group_classes_available: isGym ? input.groupClassesAvailable ?? null : null,
    gym_facilities: isGym ? input.gymFacilities ?? [] : [],
    trainers_available: isGym ? input.trainersAvailable ?? null : null,
    female_trainers_available: isGym ? input.femaleTrainersAvailable ?? null : null,
    male_trainers_available: isGym ? input.maleTrainersAvailable ?? null : null,
    trial_membership_available: isGym ? input.trialMembershipAvailable ?? null : null,
    // Travel Agency / Travel Office
    travel_agency_type: isTravelAgency ? input.travelAgencyType || null : null,
    flight_ticketing: isTravelAgency ? input.flightTicketing ?? null : null,
    hotel_booking: isTravelAgency ? input.hotelBooking ?? null : null,
    visa_assistance: isTravelAgency ? input.visaAssistance ?? null : null,
    tour_packages: isTravelAgency ? input.tourPackages ?? null : null,
    airport_transfers: isTravelAgency ? input.airportTransfers ?? null : null,
    car_rental_assistance: isTravelAgency ? input.carRentalAssistance ?? null : null,
    hajj_umrah_services: isTravelAgency ? input.hajjUmrahServices ?? null : null,
    local_tours: isTravelAgency ? input.localTours ?? null : null,
    international_tours: isTravelAgency ? input.internationalTours ?? null : null,
    group_tours: isTravelAgency ? input.groupTours ?? null : null,
    travel_insurance_assistance: isTravelAgency ? input.travelInsuranceAssistance ?? null : null,
    // Flower Shop
    flower_shop_type: isFlowerShop ? input.flowerShopType || null : null,
    flower_delivery_available: isFlowerShop ? input.flowerDeliveryAvailable ?? null : null,
    same_day_delivery: isFlowerShop ? input.sameDayDelivery ?? null : null,
    custom_bouquets: isFlowerShop ? input.customBouquets ?? null : null,
    wedding_arrangements: isFlowerShop ? input.weddingArrangements ?? null : null,
    event_decoration_service: isFlowerShop ? input.eventDecorationService ?? null : null,
    gift_wrapping: isFlowerShop ? input.giftWrapping ?? null : null,
    indoor_plants: isFlowerShop ? input.indoorPlants ?? null : null,
    outdoor_plants: isFlowerShop ? input.outdoorPlants ?? null : null,
    online_ordering_available: isFlowerShop ? input.onlineOrderingAvailable ?? null : null,
    delivery_areas: isFlowerShop ? input.deliveryAreas ?? [] : [],
    // Apartments
    apartment_type: isApartments ? input.apartmentType || null : null,
    bedrooms: isApartments ? input.bedrooms ?? null : null,
    bathrooms: isApartments ? input.bathrooms ?? null : null,
    units_count: isApartments ? input.unitsCount ?? null : null,
    floor_number: isApartments ? input.floorNumber ?? null : null,
    building_floors: isApartments ? input.buildingFloors ?? null : null,
    furnished: isApartments ? input.furnished ?? null : null,
    monthly_rent: isApartments ? input.monthlyRent ?? null : null,
    daily_rent: isApartments ? input.dailyRent ?? null : null,
    security_deposit: isApartments ? input.securityDeposit ?? null : null,
    min_stay_nights: isApartments ? input.minStayNights ?? null : null,
    max_stay_nights: isApartments ? input.maxStayNights ?? null : null,
    parking_available: isApartments ? input.parkingAvailable ?? null : null,
    wifi_available: isApartments ? input.wifiAvailable ?? null : null,
    air_conditioning: isApartments ? input.airConditioning ?? null : null,
    kitchen_available: isApartments ? input.kitchenAvailable ?? null : null,
    electricity_included: isApartments ? input.electricityIncluded ?? null : null,
    water_included: isApartments ? input.waterIncluded ?? null : null,
    generator_available: isApartments ? input.generatorAvailable ?? null : null,
    security_available: isApartments ? input.securityAvailable ?? null : null,
    elevator_available: isApartments ? input.elevatorAvailable ?? null : null,
    swimming_pool: isApartments ? input.swimmingPool ?? null : null,
    laundry_available: isApartments ? input.laundryAvailable ?? null : null,
    family_friendly: isApartments ? input.familyFriendly ?? null : null,
    pet_policy: isApartments ? input.petPolicy || null : null,
    // Real Estate
    property_type: isRealEstate ? input.propertyType || null : null,
    listing_purpose: isRealEstate ? input.listingPurpose || null : null,
    price: isRealEstate ? input.price ?? null : null,
    price_currency: isRealEstate ? input.priceCurrency || null : null,
    real_estate_bedrooms: isRealEstate ? input.realEstateBedrooms ?? null : null,
    real_estate_bathrooms: isRealEstate ? input.realEstateBathrooms ?? null : null,
    floors_count: isRealEstate ? input.floorsCount ?? null : null,
    year_built: isRealEstate ? input.yearBuilt ?? null : null,
    area_sqm: isRealEstate ? input.areaSqm ?? null : null,
    land_area_sqm: isRealEstate ? input.landAreaSqm ?? null : null,
    building_area_sqm: isRealEstate ? input.buildingAreaSqm ?? null : null,
    real_estate_parking_available: isRealEstate ? input.realEstateParkingAvailable ?? null : null,
    real_estate_furnished: isRealEstate ? input.realEstateFurnished ?? null : null,
    documents_available: isRealEstate ? input.documentsAvailable ?? null : null,
    viewing_available: isRealEstate ? input.viewingAvailable ?? null : null,
    property_condition: isRealEstate ? input.propertyCondition || null : null,
    ownership_status: isRealEstate ? input.ownershipStatus || null : null,
    // Electronics
    electronics_business_type: isElectronics ? input.electronicsBusinessType || null : null,
    brands_available: isElectronics ? input.brandsAvailable ?? [] : [],
    sells_new: isElectronics ? input.sellsNew ?? null : null,
    sells_used: isElectronics ? input.sellsUsed ?? null : null,
    warranty_available: isElectronics ? input.warrantyAvailable ?? null : null,
    electronics_delivery_available: isElectronics ? input.electronicsDeliveryAvailable ?? null : null,
    electronics_repair_available: isElectronics ? input.electronicsRepairAvailable ?? null : null,
    installation_available: isElectronics ? input.installationAvailable ?? null : null,
    payment_options: isElectronics ? input.paymentOptions ?? [] : [],
    // Transportation
    transportation_type: isTransportation ? input.transportationType || null : null,
    vehicle_count: isTransportation ? input.vehicleCount ?? null : null,
    passenger_capacity: isTransportation ? input.passengerCapacity ?? null : null,
    driver_available: isTransportation ? input.driverAvailable ?? null : null,
    airport_transfer_available: isTransportation ? input.airportTransferAvailable ?? null : null,
    city_transfers_available: isTransportation ? input.cityTransfersAvailable ?? null : null,
    intercity_transport_available: isTransportation ? input.intercityTransportAvailable ?? null : null,
    rental_available: isTransportation ? input.rentalAvailable ?? null : null,
    daily_rental_available: isTransportation ? input.dailyRentalAvailable ?? null : null,
    weekly_rental_available: isTransportation ? input.weeklyRentalAvailable ?? null : null,
    monthly_rental_available: isTransportation ? input.monthlyRentalAvailable ?? null : null,
    delivery_service_available: isTransportation ? input.deliveryServiceAvailable ?? null : null,
    cargo_service_available: isTransportation ? input.cargoServiceAvailable ?? null : null,
    // Hospital
    hospital_type: isHospital ? input.hospitalType || null : null,
    beds_count: isHospital ? input.bedsCount ?? null : null,
    doctors_count: isHospital ? input.doctorsCount ?? null : null,
    nurses_count: isHospital ? input.nursesCount ?? null : null,
    departments_count: isHospital ? input.departmentsCount ?? null : null,
    operating_rooms_count: isHospital ? input.operatingRoomsCount ?? null : null,
    emergency_department: isHospital ? input.emergencyDepartment ?? null : null,
    icu_available: isHospital ? input.icuAvailable ?? null : null,
    pharmacy_onsite: isHospital ? input.pharmacyOnsite ?? null : null,
    laboratory_onsite: isHospital ? input.laboratoryOnsite ?? null : null,
    radiology_onsite: isHospital ? input.radiologyOnsite ?? null : null,
    ambulance_available: isHospital ? input.ambulanceAvailable ?? null : null,
    maternity_department: isHospital ? input.maternityDepartment ?? null : null,
    pediatric_department: isHospital ? input.pediatricDepartment ?? null : null,
    visiting_hours: isHospital ? input.visitingHours?.trim() || null : null,
    // Pharmacy
    pharmacy_type: isPharmacy ? input.pharmacyType || null : null,
    pharmacy_delivery_available: isPharmacy ? input.pharmacyDeliveryAvailable ?? null : null,
    prescription_required: isPharmacy ? input.prescriptionRequired ?? null : null,
    home_delivery: isPharmacy ? input.homeDelivery ?? null : null,
    pharmacy_emergency_contact: isPharmacy ? input.pharmacyEmergencyContact?.trim() || null : null,
    services_offered: isApartments || isRealEstate || isElectronics || isTransportation ? input.servicesOffered ?? [] : [],
  } as never);

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function setRequestStatus(
  locale: string,
  id: string,
  status: BusinessRequestStatus
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase
    .from("business_join_requests")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "business_join_request", id, { status });
  revalidatePath(`/${locale}/admin/requests`);
  return { ok: true };
}

export async function addRequestNote(locale: string, requestId: string, note: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = note.trim();
  if (!trimmed) return { ok: false, error: "Note can't be empty." };

  const supabase = await assertOwner();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("business_join_request_notes")
    .insert({ request_id: requestId, note: trimmed, created_by: user?.id ?? null } as never);

  if (error) return { ok: false, error: error.message };

  await logActivity("create", "business_join_request_note", requestId);
  revalidatePath(`/${locale}/admin/requests`);
  return { ok: true };
}

export interface ConvertCompletion {
  slug: string;
  lat: number;
  lng: number;
}

/**
 * Converts an approved request into a real listing. Only lat/lng/slug are
 * required here despite the listing tables having several other NOT NULL
 * columns (short_description, cover_image, price_range, booking_mode, ...)
 * — every one of those either has a sensible DB default (price_range
 * '$$', booking_mode 'go_hargeisa', status 'published') or can be derived
 * from the request itself (short_description from description, cover_image
 * from the first gallery photo/logo/a placeholder). lat/lng are the only
 * fields the join form never collects and that have no default, so they're
 * the only ones that must be confirmed by hand before the listing can
 * exist at all.
 */
export async function convertJoinRequest(
  locale: string,
  requestId: string,
  targetPartnerStatus: "trial" | "official",
  completion: ConvertCompletion
): Promise<{ ok: boolean; error?: string; listingId?: string; table?: string }> {
  const supabase = await assertOwner();

  const slug = completion.slug.trim();
  if (!slug) return { ok: false, error: "Slug is required." };
  if (!Number.isFinite(completion.lat) || completion.lat < -90 || completion.lat > 90) {
    return { ok: false, error: "Latitude must be between -90 and 90." };
  }
  if (!Number.isFinite(completion.lng) || completion.lng < -180 || completion.lng > 180) {
    return { ok: false, error: "Longitude must be between -180 and 180." };
  }

  const { data: request, error: fetchError } = await supabase
    .from("business_join_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) return { ok: false, error: "Request not found." };
  if (request.converted_listing_id) return { ok: false, error: "This request was already converted." };

  // Resolved once, up front, so both the convertibility check and (for
  // "other" requests) the actual insert branch below share the same
  // category lookup instead of duplicating it.
  const resolvedCategory = request.category_id ? await getCategoryById(request.category_id) : null;

  // Dynamic categories convert into the City Services table. The generic
  // `services` vertical has been retired — a request nominally categorized
  // under it (a stale pending request from before the retirement, or a
  // direct/bypassed submission) is rejected below, same as any other
  // non-convertible category.
  const isDynamicCategory =
    request.category === "other" &&
    Boolean(request.category_id) &&
    resolvedCategory?.targetTable === "city_services";

  if (
    !isDynamicCategory &&
    !isConvertibleCategory(
      request.category,
      request.category_id,
      resolvedCategory?.targetTable
    )
  ) {
    return {
      ok: false,
      error: "This business type has no matching listing table to convert into.",
    };
  }

  const gallery =
    (request.gallery as { url: string; alt?: string; category?: string }[] | null) ?? [];
  const coverImage =
    request.cover_image ||
    gallery[0]?.url ||
    request.logo ||
    placeholderImage(request.business_name);
  const shortDescription =
    request.description.length > 160
      ? `${request.description.slice(0, 157)}...`
      : request.description;

  // ---------------------------------------------------------------------------
  // DYNAMIC "OTHER" CATEGORIES
  //
  // Categories submitted from the join form carry:
  //   category    = "other"
  //   category_id = the selected category UUID
  //   custom_fields = values entered for that category
  //
  // The selected category decides where the listing belongs:
  //   target_table = "services"      -> services
  //   target_table = "city_services" -> city_services
  //
  // This is important for categories such as Perfumes, which are currently
  // stored in categories.target_table = "city_services".
  // ---------------------------------------------------------------------------
  if (request.category === "other") {
    if (!request.category_id || !resolvedCategory?.targetTable) {
      return {
        ok: false,
        error: "This business category cannot be converted into a listing.",
      };
    }

    const targetTable = resolvedCategory.targetTable;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const categoryName =
      typeof (resolvedCategory as { name?: unknown } | null)?.name === "string"
        ? (resolvedCategory as { name: string }).name
        : null;

    if (targetTable === "city_services") {
      // city_services has its own narrower schema (see
      // lib/actions/city-services.ts's createCityService, the admin-form
      // insert path) — no address/owner_id/custom_fields columns exist on
      // this table (it predates the owner-claims model), and its image
      // column is named `image`, not `cover_image`. The legacy
      // `category` enum column is still NOT NULL (owner-dashboard.ts's
      // City Coverage KPI reads it directly) and must be derived from the
      // resolved category's slug, same as createCityService does.
      const { data: slugTaken } = await supabase
        .from("city_services")
        .select("id, name, category_id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugTaken) {
        // Same slug + same business name + same category is the exact
        // fingerprint of THIS request's own earlier attempt having already
        // created the listing but failed to link back to it (see below —
        // the listing_type_business enum write) rather than a genuinely
        // different business independently choosing the same slug. Link
        // the existing row instead of erroring or creating a duplicate.
        // Any other match (different name/category) is a real collision —
        // never silently attach an unrelated business to someone else's
        // listing.
        const sameBusiness = slugTaken.name === request.business_name && slugTaken.category_id === request.category_id;

        if (!sameBusiness) {
          return {
            ok: false,
            error: "That slug is already in use — please choose another.",
          };
        }

        const { error: linkError } = await supabase
          .from("business_join_requests")
          .update({
            status: "approved",
            converted_listing_id: slugTaken.id,
            converted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", requestId);

        if (linkError) {
          return { ok: false, error: linkError.message };
        }

        revalidatePath(`/${locale}/admin/requests`);
        revalidatePath(`/${locale}/admin/city-services`);
        revalidatePath(`/${locale}/city-services`);
        revalidatePath(`/${locale}/services`);

        return { ok: true, listingId: slugTaken.id, table: "city_services" };
      }

      const legacyCategoryEnum = resolvedCategory.slug.replace(/-/g, "_");

      const requestWeeklyHours = (request.opening_hours as WeeklyHoursDay[] | null) ?? [];

      const cityServicePayload: Record<string, unknown> = {
        slug,
        name: request.business_name,
        category_id: request.category_id,
        category: legacyCategoryEnum,
        description: request.description,
        lat: completion.lat,
        lng: completion.lng,
        phone: request.phone,
        website: request.website ?? null,
        image: coverImage,
        gallery,
        service_tags: request.service_tags ?? [],
        opening_hours_structured: weeklyHoursToGroups(requestWeeklyHours),
      };

      // School + University — shared column shape, one mapping block.
      if (resolvedCategory.slug === "school" || resolvedCategory.slug === "university") {
        if (request.number_of_floors) cityServicePayload.number_of_floors = request.number_of_floors;
        if (request.year_established) cityServicePayload.year_established = request.year_established;
        if (request.languages && request.languages.length > 0) cityServicePayload.languages = request.languages;
        if (request.education_facilities && request.education_facilities.length > 0) {
          cityServicePayload.education_facilities = request.education_facilities;
        }
        if (request.number_of_students) cityServicePayload.number_of_students = request.number_of_students;
        if (request.number_of_teachers) cityServicePayload.number_of_teachers = request.number_of_teachers;
        cityServicePayload.admissions_open = request.admissions_open ?? true;
        if (request.admission_phone) cityServicePayload.admission_phone = request.admission_phone;
        if (request.admission_whatsapp) cityServicePayload.admission_whatsapp = request.admission_whatsapp;
        if (request.admission_url) cityServicePayload.admission_url = request.admission_url;
        if (request.application_url) cityServicePayload.application_url = request.application_url;
      }
      if (resolvedCategory.slug === "school") {
        if (request.school_type) cityServicePayload.school_type = request.school_type;
        if (request.curriculum) cityServicePayload.curriculum = request.curriculum;
        if (request.education_levels && request.education_levels.length > 0) {
          cityServicePayload.education_levels = request.education_levels;
        }
        if (request.age_range_grades) cityServicePayload.age_range_grades = request.age_range_grades;
        if (request.number_of_classrooms) cityServicePayload.number_of_classrooms = request.number_of_classrooms;
      }
      if (resolvedCategory.slug === "university") {
        if (request.university_type) cityServicePayload.university_type = request.university_type;
        if (request.degree_levels && request.degree_levels.length > 0) cityServicePayload.degree_levels = request.degree_levels;
        if (request.faculties_offered && request.faculties_offered.length > 0) {
          cityServicePayload.faculties_offered = request.faculties_offered;
        }
        if (request.number_of_buildings) cityServicePayload.number_of_buildings = request.number_of_buildings;
      }

      // Women's Beauty Salon (women-only) + Men's Barbershop (men-only) —
      // shared columns, one mapping block; salon_type/shop_type stay
      // category-specific since their vocabularies never overlap.
      if (resolvedCategory.slug === "beauty-salon" || resolvedCategory.slug === "men-barbershop") {
        if (request.staff_count) cityServicePayload.staff_count = request.staff_count;
        if (request.walk_ins_accepted !== null) cityServicePayload.walk_ins_accepted = request.walk_ins_accepted;
        if (request.home_service_available !== null) cityServicePayload.home_service_available = request.home_service_available;
      }
      if (resolvedCategory.slug === "beauty-salon" && request.salon_type) {
        cityServicePayload.salon_type = request.salon_type;
      }
      if (resolvedCategory.slug === "men-barbershop" && request.shop_type) {
        cityServicePayload.shop_type = request.shop_type;
      }

      // Cosmetics & Women's Beauty + Perfumes — shared retail fields.
      if (resolvedCategory.slug === "cosmetics-beauty" || resolvedCategory.slug === "perfume-shop") {
        if (request.store_type) cityServicePayload.store_type = request.store_type;
      }
      // Cosmetics + Perfumes + Auto Repair share the same `brands` column
      // (declared "brands carried"/"brands serviced" — same shape, different label per category).
      if (
        resolvedCategory.slug === "cosmetics-beauty" ||
        resolvedCategory.slug === "perfume-shop" ||
        resolvedCategory.slug === "auto-repair"
      ) {
        if (request.brands && request.brands.length > 0) cityServicePayload.brands = request.brands;
      }

      // Car Rental
      if (resolvedCategory.slug === "car-rental") {
        if (request.rental_type) cityServicePayload.rental_type = request.rental_type;
        if (request.vehicle_types && request.vehicle_types.length > 0) cityServicePayload.vehicle_types = request.vehicle_types;
        if (request.minimum_rental_period) cityServicePayload.minimum_rental_period = request.minimum_rental_period;
        if (request.drivers_license_required !== null) cityServicePayload.drivers_license_required = request.drivers_license_required;
        if (request.deposit_required !== null) cityServicePayload.deposit_required = request.deposit_required;
        if (request.fleet_size) cityServicePayload.fleet_size = request.fleet_size;
      }

      // Clinics / Medical Clinics — clinic-level fields only; doctors/
      // departments/appointments are managed separately and untouched by
      // conversion. Dental Clinic is now one clinic_type value ("dental")
      // within this category (slug "clinic") rather than a separate one.
      if (resolvedCategory.slug === "clinic") {
        if (request.clinic_type) cityServicePayload.clinic_type = request.clinic_type;
        if (request.number_of_treatment_rooms) cityServicePayload.number_of_treatment_rooms = request.number_of_treatment_rooms;
        if (request.insurance_accepted && request.insurance_accepted.length > 0) {
          cityServicePayload.insurance_accepted = request.insurance_accepted;
        }
        if (request.languages && request.languages.length > 0) cityServicePayload.languages = request.languages;
      }

      // Auto Repair & Car Services
      if (resolvedCategory.slug === "auto-repair" && request.garage_type) {
        cityServicePayload.garage_type = request.garage_type;
      }

      // Gym / Fitness Center
      if (resolvedCategory.slug === "gym") {
        if (request.gym_type) cityServicePayload.gym_type = request.gym_type;
        if (request.classes_offered && request.classes_offered.length > 0) cityServicePayload.classes_offered = request.classes_offered;
        if (request.membership_options && request.membership_options.length > 0) cityServicePayload.membership_options = request.membership_options;
        if (request.personal_training_available !== null) cityServicePayload.personal_training_available = request.personal_training_available;
        if (request.group_classes_available !== null) cityServicePayload.group_classes_available = request.group_classes_available;
        if (request.gym_facilities && request.gym_facilities.length > 0) cityServicePayload.gym_facilities = request.gym_facilities;
        if (request.trainers_available !== null) cityServicePayload.trainers_available = request.trainers_available;
        if (request.female_trainers_available !== null) cityServicePayload.female_trainers_available = request.female_trainers_available;
        if (request.male_trainers_available !== null) cityServicePayload.male_trainers_available = request.male_trainers_available;
        if (request.trial_membership_available !== null) cityServicePayload.trial_membership_available = request.trial_membership_available;
      }

      // Hospital (doctors/departments/appointments are managed separately
      // and untouched by conversion, same as Clinics above)
      if (resolvedCategory.slug === "hospital") {
        if (request.hospital_type) cityServicePayload.hospital_type = request.hospital_type;
        if (request.beds_count) cityServicePayload.beds_count = request.beds_count;
        if (request.doctors_count) cityServicePayload.doctors_count = request.doctors_count;
        if (request.nurses_count) cityServicePayload.nurses_count = request.nurses_count;
        if (request.departments_count) cityServicePayload.departments_count = request.departments_count;
        if (request.operating_rooms_count) cityServicePayload.operating_rooms_count = request.operating_rooms_count;
        if (request.emergency_department !== null) cityServicePayload.emergency_department = request.emergency_department;
        if (request.icu_available !== null) cityServicePayload.icu_available = request.icu_available;
        if (request.pharmacy_onsite !== null) cityServicePayload.pharmacy_onsite = request.pharmacy_onsite;
        if (request.laboratory_onsite !== null) cityServicePayload.laboratory_onsite = request.laboratory_onsite;
        if (request.radiology_onsite !== null) cityServicePayload.radiology_onsite = request.radiology_onsite;
        if (request.ambulance_available !== null) cityServicePayload.ambulance_available = request.ambulance_available;
        if (request.maternity_department !== null) cityServicePayload.maternity_department = request.maternity_department;
        if (request.pediatric_department !== null) cityServicePayload.pediatric_department = request.pediatric_department;
        if (request.visiting_hours) cityServicePayload.visiting_hours = request.visiting_hours;
        if (request.languages && request.languages.length > 0) cityServicePayload.languages = request.languages;
        if (request.insurance_accepted && request.insurance_accepted.length > 0) {
          cityServicePayload.insurance_accepted = request.insurance_accepted;
        }
      }

      // Pharmacy
      if (resolvedCategory.slug === "pharmacy") {
        if (request.pharmacy_type) cityServicePayload.pharmacy_type = request.pharmacy_type;
        if (request.pharmacy_delivery_available !== null) cityServicePayload.pharmacy_delivery_available = request.pharmacy_delivery_available;
        if (request.prescription_required !== null) cityServicePayload.prescription_required = request.prescription_required;
        if (request.home_delivery !== null) cityServicePayload.home_delivery = request.home_delivery;
        if (request.pharmacy_emergency_contact) cityServicePayload.pharmacy_emergency_contact = request.pharmacy_emergency_contact;
        if (request.is_24_hours) cityServicePayload.is_24_hours = request.is_24_hours;
        if (request.insurance_accepted && request.insurance_accepted.length > 0) {
          cityServicePayload.insurance_accepted = request.insurance_accepted;
        }
      }

      const { data: created, error: insertError } = await supabase
        .from("city_services")
        .insert(cityServicePayload as never)
        .select("id")
        .single();

      if (insertError || !created) {
        return {
          ok: false,
          error:
            insertError?.message ??
            "Could not create the City Services listing.",
        };
      }

      // converted_listing_type is deliberately NOT set to "city_service"
      // here: the listing_type_business Postgres enum was never extended
      // with that value (a migration for it exists but is not yet
      // applied), so writing it fails outright — confirmed by a real
      // production incident where this exact insert succeeded but this
      // update then failed, leaving the request's converted_listing_id
      // NULL despite the listing existing (the slugTaken branch above
      // exists specifically to self-heal that state on a retry). Leaving
      // converted_listing_type NULL lets converted_listing_id — the one
      // idempotency actually depends on — get set successfully today,
      // at the cost of the admin requests list not being able to build a
      // direct "View listing" link for city_service rows until that
      // migration lands (the listing itself remains fully manageable via
      // /admin/city-services in the meantime).
      const { error: updateError } = await supabase
        .from("business_join_requests")
        .update({
          status: "approved",
          converted_listing_id: created.id,
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", requestId);

      if (updateError) {
        // Keep the two tables consistent — an unlinked listing is exactly
        // the broken state this whole branch exists to avoid, and leaving
        // it in place would only surface as a confusing slug collision on
        // the next retry.
        await supabase.from("city_services").delete().eq("id", created.id);
        return { ok: false, error: updateError.message };
      }

      await logActivity("create", "city_services", created.id, {
        fromJoinRequest: requestId,
        categoryId: request.category_id,
        categoryName,
        partnerStatus: targetPartnerStatus,
      });

      revalidatePath(`/${locale}/admin/requests`);
      revalidatePath(`/${locale}/admin/partners`);
      revalidatePath(`/${locale}/admin/city-services`);
      revalidatePath(`/${locale}/city-services`);

      return {
        ok: true,
        listingId: created.id,
        table: "city_services",
      };
    }

    // The generic `services` vertical (target_table='services': Travel
    // Agencies, Apartments, Real Estate, Electronics, Transportation, Flower
    // Shops) has been retired — there is no public route or data layer left
    // to show a listing created here. Unreachable in practice today (the
    // outer isConvertibleCategory/isDynamicCategory gate above already
    // rejects any non-city_services "other" category before this point),
    // kept only as an explicit, honest fallback rather than a silent
    // fall-through.
    return {
      ok: false,
      error: "This business category is no longer available for conversion.",
    };
  }

  // ---------------------------------------------------------------------------
  // FIXED CATEGORIES: HOTEL / RESTAURANT / CAFE
  // ---------------------------------------------------------------------------

  let table: "hotels" | "restaurants" | "cafes";

  if (request.category === "hotel") {
    table = "hotels";
  } else if (request.category === "restaurant") {
    table = "restaurants";
  } else {
    table = "cafes";
  }

  const { data: slugTaken } = await supabase
    .from(table)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugTaken) {
    return {
      ok: false,
      error: "That slug is already in use — please choose another.",
    };
  }

  const basePayload: Record<string, unknown> = {
    slug,
    name: request.business_name,
    short_description: shortDescription,
    description: request.description,
    cover_image: coverImage,
    gallery,
    videos: request.videos ?? [],
    address: request.address,
    lat: completion.lat,
    lng: completion.lng,
    phone: request.phone,
    logo_url: request.logo,
    partner_status: targetPartnerStatus,
    // Previously collected at intake and then silently discarded on
    // conversion — the created listing started with empty hours and the
    // admin had to retype the whole week by hand. Now carried through for
    // all 3 of these core tables (approved fix).
    opening_hours_structured: weeklyHoursToGroups((request.opening_hours as WeeklyHoursDay[] | null) ?? []),
  };

  if (request.price_range) {
    basePayload.price_range = request.price_range;
  }

  // Only hotels has a free-form amenities column that matches the join
  // form's vocabulary 1:1. Restaurants/cafes use their own fixed fields.
  if (
    table === "hotels" &&
    request.amenities &&
    request.amenities.length > 0
  ) {
    basePayload.amenities = request.amenities;
  }

  if (table === "hotels") {
    basePayload.website = request.website;

    // Priority mirrors the join form's field order (custom URL first, since
    // it's the original/most specific option) — a business owner who filled
    // in more than one gets whichever is highest priority as the default
    // guest-facing option; admin can change this later in the real edit form.
    if (request.booking_url) {
      basePayload.booking_mode = "external";
      basePayload.external_booking_option = "custom_url";
      basePayload.external_booking_url = request.booking_url;
    } else if (request.booking_com_url) {
      basePayload.booking_mode = "external";
      basePayload.external_booking_option = "booking_com";
      basePayload.booking_com_url = request.booking_com_url;
    } else if (request.booking_whatsapp) {
      basePayload.booking_mode = "external";
      basePayload.external_booking_option = "whatsapp";
      basePayload.booking_whatsapp = request.booking_whatsapp;
    }
    // Any additionally-provided contact fields are still carried onto the
    // real row even when not the chosen default option, so the admin can
    // switch between them later without re-entering data.
    if (request.booking_com_url) basePayload.booking_com_url = request.booking_com_url;
    if (request.booking_whatsapp) basePayload.booking_whatsapp = request.booking_whatsapp;

    if (request.check_in_time) basePayload.check_in_time = request.check_in_time;
    if (request.check_out_time) basePayload.check_out_time = request.check_out_time;
    if (request.hotel_type) basePayload.hotel_type = request.hotel_type;
    if (request.star_rating) basePayload.star_rating = request.star_rating;
    if (request.number_of_floors) basePayload.number_of_floors = request.number_of_floors;
    if (request.year_established) basePayload.year_established = request.year_established;
    if (request.languages && request.languages.length > 0) basePayload.languages = request.languages;
  } else if (table === "restaurants") {
    basePayload.website = request.website;
    basePayload.menu_pdf_url = request.menu_pdf_url;

    if (request.restaurant_type) basePayload.restaurant_type = request.restaurant_type;
    if (request.seating_capacity) basePayload.seating_capacity = request.seating_capacity;
    if (request.number_of_tables) basePayload.number_of_tables = request.number_of_tables;
    if (request.online_order_url) {
      basePayload.online_order_url = request.online_order_url;
      // A real ordering link at signup is itself the capability signal —
      // online_ordering_enabled starts on so Order Now isn't silently dark
      // until the new owner finds the dashboard toggle. phone_ordering_enabled
      // stays off by default: opting in to call-in orders is a deliberate
      // operational choice, not something to infer.
      basePayload.online_ordering_enabled = true;
    }
    if (request.is_24_hours) basePayload.is_24_hours = request.is_24_hours;
    if (request.languages && request.languages.length > 0) basePayload.languages = request.languages;
    // Restaurant facilities use the rich amenities_v2 vocabulary directly
    // (unlike Hotel, which still uses the small legacy `amenities` column —
    // restaurants has no such legacy column to preserve).
    if (request.amenities && request.amenities.length > 0) basePayload.amenities_v2 = request.amenities;
    // Cuisine codes are converted to their English label text so this
    // column stays consistent with its existing free-text display
    // convention (the admin form's cuisine field is a plain tag input,
    // e.g. "Somali", "Grill" — not lowercase codes).
    if (request.cuisine && request.cuisine.length > 0) {
      basePayload.cuisine = request.cuisine.map(
        (code: string) => CUISINE_LABELS[code as CuisineCode]?.en ?? code
      );
    }
  } else {
    basePayload.menu_pdf_url = request.menu_pdf_url;

    if (request.seating_capacity) basePayload.seating_capacity = request.seating_capacity;
    if (request.cafe_type) basePayload.cafe_type = request.cafe_type;
    if (request.amenities && request.amenities.length > 0) basePayload.amenities_v2 = request.amenities;
  }

  const { data: created, error: insertError } = await supabase
    .from(table)
    .insert(basePayload as never)
    .select("id")
    .single();

  if (insertError || !created) {
    return {
      ok: false,
      error:
        insertError?.message ??
        "Could not create the listing.",
    };
  }

  await supabase
    .from("business_join_requests")
    .update({
      status: "approved",
      converted_listing_type: request.category,
      converted_listing_id: created.id,
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", requestId);

  await logActivity("create", table, created.id, {
    fromJoinRequest: requestId,
    partnerStatus: targetPartnerStatus,
  });

  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin/partners`);
  revalidatePath(`/${locale}/admin/${table}`);
  revalidatePath(`/${locale}/${table}`);

  return {
    ok: true,
    listingId: created.id,
    table,
  };
}

export interface JoinRequestEditInput {
  businessName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  address: string;
  city: string;
  district?: string;
  description: string;
}

/** Admin quick-edit — corrects a typo'd phone number, tidies up the
 * description, etc. before approving/converting. Doesn't touch
 * images/hours/amenities/location — those came from the applicant's own
 * upload/picker and are left as submitted. */
export async function updateJoinRequest(
  locale: string,
  requestId: string,
  input: JoinRequestEditInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const businessName = input.businessName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const address = input.address.trim();
  const city = input.city.trim();
  const description = input.description.trim();

  if (!businessName || !phone || !email || !address || !city || !description) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const { error } = await supabase
    .from("business_join_requests")
    .update({
      business_name: businessName,
      phone,
      whatsapp: input.whatsapp?.trim() || null,
      email,
      website: input.website?.trim() || null,
      instagram: input.instagram?.trim() || null,
      facebook: input.facebook?.trim() || null,
      address,
      city,
      district: input.district?.trim() || null,
      description,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", requestId);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "business_join_request", requestId, { edited: true });
  revalidatePath(`/${locale}/admin/requests`);
  return { ok: true };
}