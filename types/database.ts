// Generated-style Supabase types reflecting supabase/schema.sql. Keep this in
// source control so the app can be type-checked without a linked project.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ListingBase = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  name_so: string | null;
  short_description: string;
  description: string;
  cover_image: string;
  gallery: Json;
  address: string;
  lat: number;
  lng: number;
  google_maps_url: string | null;
  rating: number;
  review_count: number;
  amenities_v2: string[];
  favorite_count: number;
  featured: boolean;
  is_pinned: boolean;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

type PartnerStatusDb = "trial" | "official";

/** The 5 social platforms added in the Phase 4 migration (Instagram/
 * Facebook already existed per-table before this) — spread into every
 * listing row type that has them. */
type SocialExtra = {
  social_tiktok: string | null; social_snapchat: string | null; social_x: string | null;
  social_youtube: string | null; social_telegram: string | null;
};

type HotelRow = ListingBase & SocialExtra & {
  description_ar: string | null; description_so: string | null; phone: string | null;
  website: string | null; price_range: "$" | "$$" | "$$$" | "$$$$"; amenities: string[]; owner_id: string | null;
  logo_url: string | null; check_in_time: string | null; check_out_time: string | null; languages: string[];
  restaurant_id: string | null; cafe_id: string | null; videos: Json;
  social_instagram: string | null; social_facebook: string | null; whatsapp: string | null; email: string | null;
  booking_mode: "go_hargeisa" | "external";
  external_booking_option: "website" | "booking_com" | "whatsapp" | "custom_url" | null;
  external_booking_url: string | null; booking_whatsapp: string | null; booking_com_url: string | null;
  partner_status: PartnerStatusDb; trial_expires_at: string | null; is_partner: boolean;
  opening_hours_structured: Json; is_24_hours: boolean; temporarily_closed: boolean; permanently_closed: boolean;
  hotel_type: string | null; star_rating: number | null;
  number_of_floors: number | null; year_established: number | null;
  document_url: string | null;
  is_suspended: boolean;
};

type RoomTypeDb = "standard" | "deluxe" | "twin" | "family" | "executive_suite";

type HotelRoomRow = {
  id: string; hotel_id: string; name: string; image: string | null; size_sqm: number | null;
  max_guests: number; bed_type: string | null; features: string[]; price_per_night: number | null;
  sort_order: number; room_type: RoomTypeDb; is_available: boolean; created_at: string; updated_at: string;
  description: string | null; bathrooms: number; weekend_price: number | null; discount_price: number | null;
  total_rooms: number;
};

type RoomImageRow = {
  id: string; room_id: string; url: string; alt: string | null; sort_order: number; created_at: string;
};

type RoomAvailabilityRow = {
  id: string; room_id: string; date: string; is_available: boolean; note: string | null; created_at: string;
};
type RestaurantRow = ListingBase & SocialExtra & {
  phone: string | null; website: string | null; cuisine: string[]; price_range: "$" | "$$" | "$$$" | "$$$$";
  opening_hours: string | null; opening_hours_structured: Json; menu: Json; reservable: boolean; owner_id: string | null;
  logo_url: string | null; menu_pdf_url: string | null; videos: Json;
  social_instagram: string | null; social_facebook: string | null; whatsapp: string | null; email: string | null;
  partner_status: PartnerStatusDb; trial_expires_at: string | null; is_partner: boolean;
  is_24_hours: boolean; temporarily_closed: boolean; permanently_closed: boolean;
  restaurant_type: string | null; seating_capacity: number | null; number_of_tables: number | null;
  online_order_url: string | null; languages: string[];
  online_ordering_enabled: boolean; phone_ordering_enabled: boolean;
  ordering_enabled: boolean; products_delivery_enabled: boolean;
  is_suspended: boolean;
};
type CafeRow = ListingBase & SocialExtra & {
  description_ar: string | null; description_so: string | null;
  phone: string | null; special_drinks: string[]; wifi: boolean; working_space: boolean;
  opening_hours: string | null; opening_hours_structured: Json; owner_id: string | null;
  price_range: "$" | "$$" | "$$$" | "$$$$"; amenities: string[]; videos: Json; website: string | null;
  social_instagram: string | null; social_facebook: string | null; whatsapp: string | null; email: string | null;
  logo_url: string | null; menu: Json; menu_pdf_url: string | null; reservable: boolean;
  partner_status: PartnerStatusDb; trial_expires_at: string | null; is_partner: boolean;
  is_24_hours: boolean; temporarily_closed: boolean; permanently_closed: boolean;
  cafe_type: string | null; seating_capacity: number | null;
  sells_flowers: boolean; flower_addons: Json; products_delivery_enabled: boolean;
  ordering_enabled: boolean;
  is_suspended: boolean;
};

type BusinessOfferRow = {
  id: string; listing_type: "hotel" | "restaurant" | "cafe"; listing_id: string;
  title: string; description: string | null;
  discount_type: "percentage" | "fixed"; discount_value: number | null; coupon_code: string | null;
  cover_image: string | null;
  starts_at: string | null; ends_at: string | null; is_active: boolean;
  approval_status: "pending" | "approved" | "rejected"; featured: boolean;
  created_at: string; updated_at: string;
};

type CityServiceCategoryDb =
  | "hospital" | "bank" | "supermarket" | "pharmacy" | "mosque" | "gas_station"
  | "park_playground" | "kids_family" | "taxi_service" | "police_station" | "fire_station"
  | "electricity_service" | "water_service" | "post_office" | "school" | "university"
  | "sports_club" | "gym" | "car_rental" | "car_wash" | "ev_charging" | "government_office"
  | "visa_immigration" | "internet_telecom";

type CityServiceRow = {
  id: string; slug: string; category: CityServiceCategoryDb; category_id: string; owner_id: string | null; name: string; name_ar: string | null; name_so: string | null;
  description: string | null; description_ar: string | null; description_so: string | null;
  phone: string | null; whatsapp: string | null; email: string | null;
  opening_hours: string | null; maps_url: string | null; website: string | null; image: string | null; logo_url: string | null; gallery: Json;
  videos: Json; lat: number; lng: number;
  amenities_v2: string[]; rating: number; review_count: number; favorite_count: number;
  opening_hours_structured: Json; is_24_hours: boolean; temporarily_closed: boolean; permanently_closed: boolean;
  social_instagram: string | null; social_facebook: string | null; social_tiktok: string | null; social_snapchat: string | null;
  social_x: string | null; social_youtube: string | null; social_telegram: string | null;
  service_tags: string[];
  status: "draft" | "published" | "archived"; featured: boolean; sort_order: number; is_partner: boolean;
  created_at: string; updated_at: string;
  // Schools + Universities
  school_type: string | null; curriculum: string | null; education_levels: string[];
  age_range_grades: string | null; number_of_classrooms: number | null;
  university_type: string | null; degree_levels: string[]; faculties_offered: string[];
  number_of_buildings: number | null;
  education_facilities: string[]; number_of_students: number | null; number_of_teachers: number | null;
  admissions_open: boolean; admission_phone: string | null; admission_whatsapp: string | null;
  admission_url: string | null; application_url: string | null;
  number_of_floors: number | null; year_established: number | null; languages: string[];
  // Women's Beauty Salons + Men's Barbershops
  salon_type: string | null; shop_type: string | null;
  staff_count: number | null; walk_ins_accepted: boolean | null; home_service_available: boolean | null;
  // Cosmetics & Women's Beauty + Perfumes
  store_type: string | null; brands: string[];
  // Car Rental
  rental_type: string | null; vehicle_types: string[]; minimum_rental_period: string | null;
  drivers_license_required: boolean | null; deposit_required: boolean | null; fleet_size: number | null;
  // Dental Clinics (clinic-level fields only; doctors/departments/appointments unaffected)
  clinic_type: string | null; number_of_treatment_rooms: number | null; insurance_accepted: string[];
  // Auto Repair & Car Services
  garage_type: string | null;
  // Gym / Fitness Center
  gym_type: string | null; classes_offered: string[]; membership_options: string[];
  personal_training_available: boolean | null; group_classes_available: boolean | null;
  gym_facilities: string[]; trainers_available: boolean | null;
  female_trainers_available: boolean | null; male_trainers_available: boolean | null;
  trial_membership_available: boolean | null;
  // Hospital
  hospital_type: string | null; beds_count: number | null; doctors_count: number | null;
  nurses_count: number | null; departments_count: number | null; operating_rooms_count: number | null;
  emergency_department: boolean | null; icu_available: boolean | null; pharmacy_onsite: boolean | null;
  laboratory_onsite: boolean | null; radiology_onsite: boolean | null; ambulance_available: boolean | null;
  maternity_department: boolean | null; pediatric_department: boolean | null; visiting_hours: string | null;
  // Pharmacy
  pharmacy_type: string | null; pharmacy_delivery_available: boolean | null; prescription_required: boolean | null;
  home_delivery: boolean | null; pharmacy_emergency_contact: string | null;
  document_url: string | null; products_delivery_enabled: boolean;
  is_suspended: boolean;
};
type AttractionRow = ListingBase & SocialExtra & {
  history: string | null; best_time_to_visit: string | null; entry_fee: string; visitor_tips: string[];
  category: "landmark" | "museum" | "market" | "nature" | "religious";
  opening_hours_structured: Json; is_24_hours: boolean; temporarily_closed: boolean; permanently_closed: boolean;
  phone: string | null; whatsapp: string | null; email: string | null; website: string | null;
  social_instagram: string | null; social_facebook: string | null; videos: Json;
};

type ServiceCategoryDb =
  | "hospital" | "pharmacy" | "dental_clinic" | "bank" | "atm" | "currency_exchange" | "gas_station" | "car_rental"
  | "mosque" | "school" | "university" | "gym" | "tour_company" | "apartment"
  | "supermarket" | "clinic" | "government_office";

type ServiceRow = ListingBase & {
  phone: string | null; website: string | null; opening_hours: string | null; services: string[];
  category: ServiceCategoryDb | null; category_id: string | null; owner_id: string | null;
  custom_fields: Json; is_partner: boolean;
  logo_url: string | null; videos: Json; whatsapp: string | null; email: string | null;
  social_instagram: string | null; social_facebook: string | null; social_tiktok: string | null; opening_hours_structured: Json;
  products_delivery_enabled: boolean;
  // Travel Agency / Travel Office (slug 'tour-companies')
  travel_agency_type: string | null; flight_ticketing: boolean | null; hotel_booking: boolean | null;
  visa_assistance: boolean | null; tour_packages: boolean | null; airport_transfers: boolean | null;
  car_rental_assistance: boolean | null; hajj_umrah_services: boolean | null; local_tours: boolean | null;
  international_tours: boolean | null; group_tours: boolean | null; travel_insurance_assistance: boolean | null;
  languages: string[];
  // Flower Shop (slug 'flower-shops')
  flower_shop_type: string | null; flower_delivery_available: boolean | null; same_day_delivery: boolean | null;
  custom_bouquets: boolean | null; wedding_arrangements: boolean | null; event_decoration_service: boolean | null;
  gift_wrapping: boolean | null; indoor_plants: boolean | null; outdoor_plants: boolean | null;
  online_ordering_available: boolean | null; delivery_areas: string[];
  // Apartments (slug 'apartments')
  apartment_type: string | null; bedrooms: number | null; bathrooms: number | null;
  units_count: number | null; floor_number: number | null; building_floors: number | null;
  furnished: boolean | null; monthly_rent: number | null; daily_rent: number | null;
  security_deposit: number | null; min_stay_nights: number | null; max_stay_nights: number | null;
  parking_available: boolean | null; wifi_available: boolean | null; air_conditioning: boolean | null;
  kitchen_available: boolean | null; electricity_included: boolean | null; water_included: boolean | null;
  generator_available: boolean | null; security_available: boolean | null; elevator_available: boolean | null;
  swimming_pool: boolean | null; laundry_available: boolean | null; family_friendly: boolean | null;
  pet_policy: string | null;
  // Real Estate (slug 'real-estate')
  property_type: string | null; listing_purpose: string | null; price: number | null;
  price_currency: string | null; real_estate_bedrooms: number | null; real_estate_bathrooms: number | null;
  floors_count: number | null; year_built: number | null; area_sqm: number | null;
  land_area_sqm: number | null; building_area_sqm: number | null; real_estate_parking_available: boolean | null;
  real_estate_furnished: boolean | null; documents_available: boolean | null; viewing_available: boolean | null;
  property_condition: string | null; ownership_status: string | null;
  // Electronics (slug 'electronics')
  electronics_business_type: string | null; brands_available: string[]; sells_new: boolean | null;
  sells_used: boolean | null; warranty_available: boolean | null; electronics_delivery_available: boolean | null;
  electronics_repair_available: boolean | null; installation_available: boolean | null; payment_options: string[];
  // Transportation (slug 'transportation')
  transportation_type: string | null; vehicle_count: number | null; passenger_capacity: number | null;
  driver_available: boolean | null; airport_transfer_available: boolean | null; city_transfers_available: boolean | null;
  intercity_transport_available: boolean | null; rental_available: boolean | null; daily_rental_available: boolean | null;
  weekly_rental_available: boolean | null; monthly_rental_available: boolean | null;
  delivery_service_available: boolean | null; cargo_service_available: boolean | null;
  document_url: string | null;
  is_suspended: boolean;
};

/** The `categories` table — single source of truth for every business
 * category (see supabase/migrations/20260806000001_add_categories_system.sql). */
type CategoryRow = {
  id: string; slug: string; name: string; name_ar: string | null; name_so: string | null;
  description: string | null; description_ar: string | null; description_so: string | null;
  icon: string; color: string | null;
  target_table: "hotels" | "restaurants" | "cafes" | "attractions" | "events" | "services" | "city_services";
  is_active: boolean; is_pinned: boolean; sort_order: number; search_keywords: string[];
  custom_fields_schema: Json;
  supports_gallery: boolean; supports_new_features: boolean; schema_org_type: string | null;
  supports_products: boolean; supports_appointments: boolean;
  supports_purchase_requests: boolean; supports_event_requests: boolean;
  image_url: string | null;
  created_at: string; updated_at: string;
};

type BusinessListingType = "hotel" | "restaurant" | "cafe" | "service" | "city_service";

type BookingRow = {
  id: string; hotel_id: string; room_id: string | null; guest_name: string; guest_phone: string | null;
  guest_email: string | null; guests_count: number; check_in: string; check_out: string;
  status: "pending" | "confirmed" | "cancelled" | "completed"; notes: string | null;
  adults: number; children: number; rooms_count: number; booking_reference: string | null;
  payment_status: "unpaid" | "pending" | "paid" | "refunded"; payment_method: string | null;
  user_id: string | null; guest_country: string | null;
  created_at: string; updated_at: string;
};

type BookingStatusHistoryRow = {
  id: string; booking_id: string;
  old_status: "pending" | "confirmed" | "cancelled" | "completed" | null;
  new_status: "pending" | "confirmed" | "cancelled" | "completed";
  changed_by: string | null; created_at: string;
};

type TableReservationRow = {
  id: string; listing_type: "hotel" | "restaurant" | "cafe" | "service"; listing_id: string;
  customer_name: string; customer_phone: string;
  reservation_date: string; reservation_time: string; guests_count: number;
  notes: string | null; status: "pending" | "confirmed" | "cancelled" | "completed";
  reservation_reference: string; user_id: string | null;
  created_at: string; updated_at: string;
};

type PurchaseRequestStatus =
  | "pending" | "reviewing" | "quote_ready" | "approved" | "declined"
  | "ordered" | "shipped" | "in_transit" | "ready_for_delivery" | "completed"
  | "cancelled" | "rejected";

type PurchaseRequestRow = {
  id: string; listing_type: string; listing_id: string; user_id: string;
  customer_name: string; customer_phone: string;
  product_name: string; product_url: string | null;
  platform: "shein" | "amazon" | "noon" | "iherb" | "alibaba" | "other";
  quantity: number; size: string | null; color: string | null; variant: string | null;
  delivery_location: string; notes: string | null; image_url: string | null;
  status: PurchaseRequestStatus;
  quoted_product_cost: number | null; quoted_shipping_cost: number | null;
  quoted_customs_fee: number | null; quoted_service_fee: number | null;
  quoted_total: number | null; quote_expires_at: string | null;
  partner_notes_customer: string | null; partner_notes_internal: string | null;
  created_at: string; updated_at: string;
};

type PurchaseRequestStatusHistoryRow = {
  id: string; request_id: string;
  old_status: PurchaseRequestStatus | null; new_status: PurchaseRequestStatus;
  changed_by: string | null; note: string | null; created_at: string;
};

type EventRequestStatus = "new" | "reviewing" | "proposal_sent" | "approved" | "declined" | "planning" | "completed" | "cancelled";

type EventRequestRow = {
  id: string; listing_type: string; listing_id: string; user_id: string;
  customer_name: string; customer_phone: string;
  event_type: "family" | "school" | "festival" | "entertainment" | "social" | "other";
  event_date: string | null; event_location: string | null; guest_count: number | null;
  budget_range: string | null; services_required: string | null; notes: string | null; image_url: string | null;
  status: EventRequestStatus;
  proposal_details: string | null; proposal_cost: number | null;
  created_at: string; updated_at: string;
};

type EventRequestStatusHistoryRow = {
  id: string; request_id: string;
  old_status: EventRequestStatus | null; new_status: EventRequestStatus;
  changed_by: string | null; note: string | null; created_at: string;
};

type ProductOrderRow = {
  id: string; listing_type: "city_service" | "service" | "cafe" | "restaurant"; listing_id: string;
  customer_name: string; customer_phone: string;
  subtotal: number; total: number | null;
  fulfillment_type: "delivery" | "pickup"; delivery_address: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  recipient_name: string | null; recipient_phone: string | null;
  occasion: string | null; message_note: string | null; notes: string | null;
  status: "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "cancelled" | "completed";
  order_reference: string; user_id: string | null;
  created_at: string; updated_at: string;
  taxable_subtotal: number; tax_rate: number; tax_amount: number;
  tax_is_inclusive: boolean; tax_policy_label: string | null;
  fulfillment_city: string | null;
};

type OrderItemRow = {
  id: string; order_id: string; product_id: string | null;
  product_name: string; product_name_ar: string | null; product_name_so: string | null;
  product_image: string | null;
  unit_price: number; quantity: number;
  addons: Json; addons_total: number; line_total: number;
  variant_id: string | null; variant_name: string | null; variant_sku: string | null;
  selected_options: Json | null;
  created_at: string;
  is_tax_exempt: boolean;
};

type ProductRow = {
  id: string; listing_type: string; listing_id: string;
  name: string; name_ar: string | null; name_so: string | null;
  description: string | null; description_ar: string | null; description_so: string | null;
  brand: string | null;
  category: string | null;
  gender: "men" | "women" | "unisex" | "kids" | null;
  price: number | null; currency: string;
  image: string | null; gallery: Json;
  is_available: boolean; is_featured: boolean; is_hidden: boolean;
  sort_order: number; created_at: string; updated_at: string;
  size: string | null;
  sku: string | null; stock_quantity: number | null;
};

type ProductVariantRow = {
  id: string; product_id: string;
  name: string; name_ar: string | null; name_so: string | null;
  shade_name: string | null; shade_code: string | null; hex_color: string | null;
  finish: string | null; size: string | null;
  image: string | null; sku: string | null; price: number | null;
  is_available: boolean; sort_order: number; created_at: string;
};

type ProductOptionRow = {
  id: string; product_id: string;
  key: string; label: string; label_ar: string | null; label_so: string | null;
  type: "select" | "multiselect" | "boolean" | "text" | "number";
  required: boolean; price_delta: number; choices: Json;
  placeholder: string | null; placeholder_ar: string | null; placeholder_so: string | null;
  max_length: number | null; sort_order: number; created_at: string;
};

type ProductAddonRow = {
  id: string; product_id: string | null; group_id: string | null;
  name: string; name_ar: string | null; name_so: string | null;
  price: number; is_taxable: boolean; is_active: boolean;
  sort_order: number; created_at: string; updated_at: string;
};

type AddonGroupRow = {
  id: string; listing_type: string; listing_id: string;
  name: string; name_ar: string | null; name_so: string | null;
  min_select: number; max_select: number | null;
  sort_order: number; created_at: string; updated_at: string;
};

type ProductAddonGroupRow = {
  product_id: string; group_id: string; created_at: string;
};

type TaxPolicyScope = "global" | "category" | "business" | "product";

type TaxPolicyRow = {
  id: string; scope: TaxPolicyScope;
  category: string | null; listing_type: string | null; listing_id: string | null; product_id: string | null;
  rate: number; is_exempt: boolean; is_inclusive: boolean; is_enabled: boolean;
  label: string | null; effective_from: string; effective_until: string | null;
  created_by: string | null; created_at: string; updated_at: string;
};

type DepartmentRow = {
  id: string; city_service_id: string;
  name: string; name_ar: string | null; name_so: string | null;
  sort_order: number; created_at: string;
};

type DoctorRow = {
  id: string; city_service_id: string; department_id: string | null;
  name: string; photo: string | null;
  specialty: string | null; specialty_ar: string | null; specialty_so: string | null;
  bio: string | null; bio_ar: string | null; bio_so: string | null;
  languages: string[]; working_hours: Json;
  appointment_duration_minutes: number; is_active: boolean; sort_order: number;
  consultation_fee: number | null;
  created_at: string; updated_at: string;
};

type AppointmentStatusDb = "pending" | "confirmed" | "completed" | "cancelled" | "rejected" | "no_show";

type AppointmentRow = {
  id: string; doctor_id: string;
  patient_name: string; patient_phone: string; patient_email: string | null;
  user_id: string | null;
  appointment_date: string; appointment_time: string;
  status: AppointmentStatusDb;
  notes: string | null; created_at: string; updated_at: string;
};

type AppointmentStatusHistoryRow = {
  id: string; appointment_id: string;
  old_status: AppointmentStatusDb | null;
  new_status: AppointmentStatusDb;
  changed_by: string | null; created_at: string;
};

type BusinessMetricEventRow = {
  id: string; listing_type: BusinessListingType; listing_id: string;
  event_type: "view" | "website_click" | "call_click" | "whatsapp_click"; created_at: string;
};

type BusinessSubscriptionRow = {
  id: string; listing_type: BusinessListingType; listing_id: string;
  plan_tier: "basic" | "silver" | "gold"; status: "active" | "paused" | "cancelled";
  renews_at: string | null; custom_price_usd: number | null; created_at: string; updated_at: string;
};

type BusinessSubscriptionNoteRow = {
  id: string; subscription_id: string; note: string; created_by: string | null; created_at: string;
};

type BusinessRequestStatusDb = "pending" | "approved" | "rejected" | "needs_info" | "archived";

type PartnerRequestCategoryDb =
  | "hotel" | "restaurant" | "cafe" | "tour_company" | "travel_agency" | "car_rental"
  | "apartment" | "shopping_mall" | "hospital" | "pharmacy" | "gym" | "beauty_salon" | "other";

type BusinessJoinRequestRow = {
  id: string; category: PartnerRequestCategoryDb; business_name: string; owner_name: string | null;
  phone: string; whatsapp: string | null; email: string; address: string; maps_url: string | null;
  description: string; logo: string | null; gallery: Json; menu_pdf_url: string | null;
  booking_url: string | null; website: string | null; status: BusinessRequestStatusDb;
  instagram: string | null; facebook: string | null; city: string; district: string | null;
  lat: number | null; lng: number | null; cover_image: string | null;
  opening_hours: Json; amenities: string[]; price_range: "$" | "$$" | "$$$" | "$$$$" | null;
  converted_listing_type: "hotel" | "restaurant" | "cafe" | "service" | "city_service" | null; converted_listing_id: string | null;
  converted_at: string | null;
  videos: Json; documents: Json;
  category_id: string | null; custom_fields: Json; service_tags: string[];
  booking_whatsapp: string | null; booking_com_url: string | null;
  check_in_time: string | null; check_out_time: string | null;
  hotel_type: string | null; star_rating: number | null;
  estimated_room_count: number | null; room_types_offered: string[];
  number_of_floors: number | null; year_established: number | null; languages: string[];
  // Restaurants
  restaurant_type: string | null; cuisine: string[]; number_of_tables: number | null;
  online_order_url: string | null; is_24_hours: boolean;
  // Restaurants + Cafes
  seating_capacity: number | null;
  // Cafes
  cafe_type: string | null;
  // Schools + Universities
  school_type: string | null; curriculum: string | null; education_levels: string[];
  age_range_grades: string | null; number_of_classrooms: number | null;
  university_type: string | null; degree_levels: string[]; faculties_offered: string[];
  number_of_buildings: number | null;
  education_facilities: string[]; number_of_students: number | null; number_of_teachers: number | null;
  admissions_open: boolean; admission_phone: string | null; admission_whatsapp: string | null;
  admission_url: string | null; application_url: string | null;
  // Women's Beauty Salons + Men's Barbershops
  salon_type: string | null; shop_type: string | null;
  staff_count: number | null; walk_ins_accepted: boolean | null; home_service_available: boolean | null;
  // Cosmetics & Women's Beauty + Perfumes
  store_type: string | null; brands: string[];
  // Car Rental
  rental_type: string | null; vehicle_types: string[]; minimum_rental_period: string | null;
  drivers_license_required: boolean | null; deposit_required: boolean | null; fleet_size: number | null;
  // Clinics / Medical Clinics (Dental Clinic is now one clinic_type value)
  clinic_type: string | null; number_of_treatment_rooms: number | null; insurance_accepted: string[];
  // Auto Repair & Car Services
  garage_type: string | null;
  // Gym / Fitness Center
  gym_type: string | null; classes_offered: string[]; membership_options: string[];
  personal_training_available: boolean | null; group_classes_available: boolean | null;
  gym_facilities: string[]; trainers_available: boolean | null;
  female_trainers_available: boolean | null; male_trainers_available: boolean | null;
  trial_membership_available: boolean | null;
  // Travel Agency / Travel Office
  travel_agency_type: string | null; flight_ticketing: boolean | null; hotel_booking: boolean | null;
  visa_assistance: boolean | null; tour_packages: boolean | null; airport_transfers: boolean | null;
  car_rental_assistance: boolean | null; hajj_umrah_services: boolean | null; local_tours: boolean | null;
  international_tours: boolean | null; group_tours: boolean | null; travel_insurance_assistance: boolean | null;
  // Flower Shop
  flower_shop_type: string | null; flower_delivery_available: boolean | null; same_day_delivery: boolean | null;
  custom_bouquets: boolean | null; wedding_arrangements: boolean | null; event_decoration_service: boolean | null;
  gift_wrapping: boolean | null; indoor_plants: boolean | null; outdoor_plants: boolean | null;
  online_ordering_available: boolean | null; delivery_areas: string[];
  services_offered: string[];
  // Apartments
  apartment_type: string | null; bedrooms: number | null; bathrooms: number | null;
  units_count: number | null; floor_number: number | null; building_floors: number | null;
  furnished: boolean | null; monthly_rent: number | null; daily_rent: number | null;
  security_deposit: number | null; min_stay_nights: number | null; max_stay_nights: number | null;
  parking_available: boolean | null; wifi_available: boolean | null; air_conditioning: boolean | null;
  kitchen_available: boolean | null; electricity_included: boolean | null; water_included: boolean | null;
  generator_available: boolean | null; security_available: boolean | null; elevator_available: boolean | null;
  swimming_pool: boolean | null; laundry_available: boolean | null; family_friendly: boolean | null;
  pet_policy: string | null;
  // Real Estate
  property_type: string | null; listing_purpose: string | null; price: number | null;
  price_currency: string | null; real_estate_bedrooms: number | null; real_estate_bathrooms: number | null;
  floors_count: number | null; year_built: number | null; area_sqm: number | null;
  land_area_sqm: number | null; building_area_sqm: number | null; real_estate_parking_available: boolean | null;
  real_estate_furnished: boolean | null; documents_available: boolean | null; viewing_available: boolean | null;
  property_condition: string | null; ownership_status: string | null;
  // Electronics
  electronics_business_type: string | null; brands_available: string[]; sells_new: boolean | null;
  sells_used: boolean | null; warranty_available: boolean | null; electronics_delivery_available: boolean | null;
  electronics_repair_available: boolean | null; installation_available: boolean | null; payment_options: string[];
  // Transportation
  transportation_type: string | null; vehicle_count: number | null; passenger_capacity: number | null;
  driver_available: boolean | null; airport_transfer_available: boolean | null; city_transfers_available: boolean | null;
  intercity_transport_available: boolean | null; rental_available: boolean | null; daily_rental_available: boolean | null;
  weekly_rental_available: boolean | null; monthly_rental_available: boolean | null;
  delivery_service_available: boolean | null; cargo_service_available: boolean | null;
  // Hospital
  hospital_type: string | null; beds_count: number | null; doctors_count: number | null;
  nurses_count: number | null; departments_count: number | null; operating_rooms_count: number | null;
  emergency_department: boolean | null; icu_available: boolean | null; pharmacy_onsite: boolean | null;
  laboratory_onsite: boolean | null; radiology_onsite: boolean | null; ambulance_available: boolean | null;
  maternity_department: boolean | null; pediatric_department: boolean | null; visiting_hours: string | null;
  // Pharmacy
  pharmacy_type: string | null; pharmacy_delivery_available: boolean | null; prescription_required: boolean | null;
  home_delivery: boolean | null; pharmacy_emergency_contact: string | null;
  created_at: string; updated_at: string;
};

type BusinessJoinRequestNoteRow = {
  id: string; request_id: string; note: string; created_by: string | null; created_at: string;
};

type SiteAnnouncementRow = {
  id: string; title: string; message: string; link_url: string | null; link_label: string | null;
  status: "draft" | "published" | "archived"; created_at: string; updated_at: string;
};

type BusinessMessageRow = {
  id: string; listing_type: BusinessListingType; listing_id: string; sender_name: string;
  sender_email: string | null; sender_phone: string | null; message: string; is_read: boolean; created_at: string;
};

type BusinessAccessGrantRow = {
  id: string; user_id: string; listing_type: BusinessListingType; listing_id: string;
  permissions: Json; is_active: boolean; granted_by: string | null;
  created_at: string; updated_at: string;
};

type TeamPlatformPermissionsRow = {
  id: string; user_id: string; permissions: Json; is_active: boolean; granted_by: string | null;
  created_at: string; updated_at: string;
};

type HonoraryMemberRow = {
  id: string; user_id: string; title_en: string; title_ar: string | null; title_so: string | null;
  is_public: boolean; created_by: string | null; created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; full_name: string | null; avatar_url: string | null; role: "user" | "business_owner" | "owner"; phone: string | null; bio: string | null; notify_activity: boolean; notify_marketing: boolean; notify_in_app: boolean; notify_categories: Record<string, boolean>; created_at: string; updated_at: string }>;
      hotels: Table<HotelRow>;
      restaurants: Table<RestaurantRow>;
      cafes: Table<CafeRow>;
      attractions: Table<AttractionRow>;
      services: Table<ServiceRow>;
      city_services: Table<CityServiceRow>;
      categories: Table<CategoryRow>;
      events: Table<{
        id: string; slug: string; title: string; title_ar: string | null; title_so: string | null; description: string; cover_image: string;
        category: "cultural" | "national" | "business" | "sports" | "concert"; start_date: string; end_date: string; location: string;
        lat: number; lng: number; gallery: Json; videos: Json; google_maps_url: string | null;
        opening_hours_structured: Json; is_24_hours: boolean; temporarily_closed: boolean; permanently_closed: boolean;
        phone: string | null; whatsapp: string | null; email: string | null; website: string | null;
        social_instagram: string | null; social_facebook: string | null; social_tiktok: string | null; social_snapchat: string | null;
        social_x: string | null; social_youtube: string | null; social_telegram: string | null;
        favorite_count: number;
        ticket_info: string | null; amenities_v2: string[]; rating: number; review_count: number;
        status: "draft" | "published" | "archived"; created_by: string | null; created_at: string;
      }>;
      articles: Table<{ id: string; slug: string; title: string; title_ar: string | null; title_so: string | null; excerpt: string; body: string; cover_image: string; category: string; author_id: string | null; read_minutes: number; status: "draft" | "published" | "archived"; published_at: string | null; created_at: string }>;
      destinations: Table<{ id: string; slug: string; name: string; description: string; image: string; place_count: number; created_at: string }>;
      map_points: Table<{ id: string; name: string; category: string; lat: number; lng: number; created_at: string }>;
      reviews: Table<{ id: string; listing_type: "hotel" | "restaurant" | "cafe" | "attraction" | "service" | "event" | "city_service"; listing_id: string; user_id: string | null; rating: number; comment: string | null; title: string | null; visit_date: string | null; status: "published" | "hidden"; helpful_count: number; photos: Json; owner_reply: string | null; owner_reply_at: string | null; is_reported: boolean; created_at: string }>;
      review_helpful_votes: Table<{ id: string; review_id: string; user_id: string | null; created_at: string }>;
      hotel_rooms: Table<HotelRoomRow>;
      room_images: Table<RoomImageRow>;
      room_availability: Table<RoomAvailabilityRow>;
      bookings: Table<BookingRow>;
      booking_status_history: Table<BookingStatusHistoryRow>;
      table_reservations: Table<TableReservationRow>;
      purchase_requests: Table<PurchaseRequestRow>;
      purchase_request_status_history: Table<PurchaseRequestStatusHistoryRow>;
      event_requests: Table<EventRequestRow>;
      event_request_status_history: Table<EventRequestStatusHistoryRow>;
      product_orders: Table<ProductOrderRow>;
      order_items: Table<OrderItemRow>;
      business_metric_events: Table<BusinessMetricEventRow>;
      business_subscriptions: Table<BusinessSubscriptionRow>;
      business_subscription_notes: Table<BusinessSubscriptionNoteRow>;
      business_join_requests: Table<BusinessJoinRequestRow>;
      business_join_request_notes: Table<BusinessJoinRequestNoteRow>;
      site_announcements: Table<SiteAnnouncementRow>;
      business_messages: Table<BusinessMessageRow>;
      business_offers: Table<BusinessOfferRow>;
      favorites: Table<{ id: string; user_id: string | null; listing_type: "hotel" | "restaurant" | "cafe" | "attraction" | "service"; listing_id: string; created_at: string }>;
      saved_trips: Table<{ id: string; user_id: string | null; title: string; notes: string | null; created_at: string }>;
      saved_trip_items: Table<{ id: string; trip_id: string | null; listing_type: "hotel" | "restaurant" | "cafe" | "attraction" | "service"; listing_id: string; day_number: number | null; sort_order: number | null }>;
      newsletter_subscribers: Table<{ id: string; email: string; locale: string | null; subscribed_at: string }, { id?: string; email: string; locale?: string | null; subscribed_at?: string }>;
      contact_messages: Table<{ id: string; name: string; email: string; subject: string | null; message: string; created_at: string }, { id?: string; name: string; email: string; subject?: string | null; message: string; created_at?: string }>;
      attraction_nearby_restaurants: Table<{ attraction_id: string; restaurant_id: string }>;
      attraction_nearby_hotels: Table<{ attraction_id: string; hotel_id: string }>;
      hotel_nearby_attractions: Table<{ hotel_id: string; attraction_id: string }>;
      activity_logs: Table<{ id: string; user_id: string | null; action: string; entity_type: string; entity_id: string | null; details: Json | null; ip_address: string | null; user_agent: string | null; created_at: string }>;
      site_settings: Table<{ id: string; site_name: string; logo_url: string | null; favicon_url: string | null; contact_email: string | null; contact_phone: string | null; whatsapp_number: string | null; social_facebook: string | null; social_instagram: string | null; social_twitter: string | null; social_youtube: string | null; social_tiktok: string | null; footer_text: string | null; default_language: string; default_theme: string; map_center_lat: number | null; map_center_lng: number | null; map_zoom: number | null; features_reviews_enabled: boolean; features_ratings_enabled: boolean; features_favorites_enabled: boolean; features_trips_enabled: boolean; features_newsletter_enabled: boolean; seo_title: string | null; seo_description: string | null; seo_keywords: string | null; created_at: string; updated_at: string }>;
      notifications: Table<{ id: string; user_id: string | null; title: string; message: string | null; type: string; action_url: string | null; category: string | null; data: Json; is_read: boolean; created_at: string; read_at: string | null }>;
      business_hours: Table<{ id: string; entity_type: string; entity_id: string; day_of_week: number; opens_at: string | null; closes_at: string | null; is_closed: boolean; special_note: string | null; created_at: string; updated_at: string }>;
      amenity_categories: Table<{ id: string; name: string; icon: string | null; sort_order: number; created_at: string }>;
      products: Table<ProductRow>;
      product_variants: Table<ProductVariantRow>;
      product_options: Table<ProductOptionRow>;
      product_addons: Table<ProductAddonRow>;
      addon_groups: Table<AddonGroupRow>;
      product_addon_groups: Table<ProductAddonGroupRow>;
      tax_policies: Table<TaxPolicyRow>;
      departments: Table<DepartmentRow>;
      doctors: Table<DoctorRow>;
      appointments: Table<AppointmentRow>;
      appointment_status_history: Table<AppointmentStatusHistoryRow>;
      business_access_grants: Table<BusinessAccessGrantRow>;
      team_platform_permissions: Table<TeamPlatformPermissionsRow>;
      honorary_members: Table<HonoraryMemberRow>;
    } & Record<string, Table<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>>;
    Views: Record<string, never>;
    Functions: {
      submit_booking_request: {
        Args: {
          p_hotel_id: string;
          p_room_id: string | null;
          p_guest_name: string;
          p_guest_phone: string;
          p_guest_email: string | null;
          p_adults: number;
          p_children: number;
          p_rooms_count: number;
          p_check_in: string;
          p_check_out: string;
          p_notes: string | null;
          p_guest_country: string | null;
        };
        Returns: string;
      };
      room_capacity_available: {
        Args: {
          p_room_id: string | null;
          p_check_in: string;
          p_check_out: string;
          p_rooms_count: number;
          p_exclude_booking_id?: string | null;
        };
        Returns: boolean;
      };
      submit_appointment_request: {
        Args: {
          p_doctor_id: string;
          p_patient_name: string;
          p_patient_phone: string;
          p_patient_email: string | null;
          p_appointment_date: string;
          p_appointment_time: string;
          p_notes: string | null;
        };
        Returns: string;
      };
    };
    Enums: { user_role: "user" | "business_owner" | "owner"; price_range: "$" | "$$" | "$$$" | "$$$$"; attraction_category: "landmark" | "museum" | "market" | "nature" | "religious"; event_category: "cultural" | "national" | "business" | "sports" | "concert"; content_status: "draft" | "published" | "archived"; listing_type: "hotel" | "restaurant" | "cafe" | "attraction" | "service"; service_category: ServiceCategoryDb; subscription_tier: "basic" | "silver" | "gold"; subscription_status: "active" | "paused" | "cancelled"; partner_status: PartnerStatusDb; business_request_status: BusinessRequestStatusDb; city_service_category: CityServiceCategoryDb; };
    CompositeTypes: Record<string, never>;
  };
};
