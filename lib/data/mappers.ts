import type { Database } from "@/types/database";
import type { Hotel, HotelRoom, Restaurant, Cafe, Service, Attraction, EventItem, CityService, Article, GalleryImage, Review, BusinessOffer, MediaVideo, Notification, NotificationCategory, NotificationSeverity, Category, Product, Department, Doctor, Appointment, OpeningHoursGroup, RestaurantMenuItem, TableReservation, ProductOrder, OrderItem } from "@/types";

type HotelRow = Database["public"]["Tables"]["hotels"]["Row"];
type HotelRoomRow = Database["public"]["Tables"]["hotel_rooms"]["Row"];
type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"];
type CafeRow = Database["public"]["Tables"]["cafes"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type AttractionRow = Database["public"]["Tables"]["attractions"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type CityServiceRow = Database["public"]["Tables"]["city_services"]["Row"];
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type TableReservationRow = Database["public"]["Tables"]["table_reservations"]["Row"];
type ProductOrderRow = Database["public"]["Tables"]["product_orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

function toGallery(json: unknown): GalleryImage[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((g): g is { url: string; alt?: string; category?: string; caption?: string } => !!g && typeof g === "object" && "url" in g)
    .map((g) => ({
      url: g.url,
      alt: g.alt ?? "",
      category: (g.category as GalleryImage["category"]) ?? undefined,
      caption: g.caption || undefined,
    }));
}

function toVideos(json: unknown): MediaVideo[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((v): v is { url: string; caption?: string } => !!v && typeof v === "object" && "url" in v)
    .map((v) => ({ url: v.url, caption: v.caption || undefined }));
}

export function mapReview(row: ReviewRow, authorName = "Guest"): Review {
  return {
    id: row.id,
    authorName,
    rating: row.rating,
    comment: row.comment ?? "",
    title: row.title ?? undefined,
    visitDate: row.visit_date ?? undefined,
    createdAt: row.created_at,
    photos: toGallery((row as { photos?: unknown }).photos),
    ownerReply: row.owner_reply ?? undefined,
    ownerReplyAt: row.owner_reply_at ?? undefined,
    isReported: row.is_reported,
    helpfulCount: row.helpful_count ?? 0,
    status: row.status,
  };
}

export function mapHotelRoom(row: HotelRoomRow & { room_images?: unknown }): HotelRoom {
  return {
    id: row.id,
    name: row.name,
    image: row.image ?? undefined,
    images: toGallery(row.room_images),
    description: row.description ?? undefined,
    sizeSqm: row.size_sqm ?? undefined,
    maxGuests: row.max_guests,
    bedType: row.bed_type ?? undefined,
    bathrooms: row.bathrooms ?? 1,
    features: row.features ?? [],
    pricePerNight: row.price_per_night != null ? Number(row.price_per_night) : undefined,
    weekendPrice: row.weekend_price != null ? Number(row.weekend_price) : undefined,
    discountPrice: row.discount_price != null ? Number(row.discount_price) : undefined,
    totalRooms: row.total_rooms ?? 1,
    roomType: row.room_type ?? "standard",
    isAvailable: row.is_available ?? true,
  };
}

export function mapHotel(
  row: HotelRow,
  extras: { reviews?: Review[]; rooms?: HotelRoom[]; restaurant?: Restaurant | null; cafe?: Cafe | null } = {}
): Hotel {
  const { reviews = [], rooms = [], restaurant = null, cafe = null } = extras;
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as Hotel["openingHoursStructured"])
    : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    documentUrl: row.document_url ?? undefined,
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    socialTiktok: row.social_tiktok ?? undefined,
    socialSnapchat: row.social_snapchat ?? undefined,
    socialX: row.social_x ?? undefined,
    socialYoutube: row.social_youtube ?? undefined,
    socialTelegram: row.social_telegram ?? undefined,
    priceRange: row.price_range,
    amenities: row.amenities ?? [],
    amenitiesV2: row.amenities_v2 ?? [],
    favoriteCount: row.favorite_count ?? 0,
    nearbyAttractionIds: [],
    featured: row.featured,
    logo: row.logo_url ?? undefined,
    checkInTime: row.check_in_time ?? undefined,
    checkOutTime: row.check_out_time ?? undefined,
    openingHoursStructured,
    is24Hours: row.is_24_hours,
    temporarilyClosed: row.temporarily_closed,
    permanentlyClosed: row.permanently_closed,
    languages: row.languages ?? [],
    rooms,
    restaurant,
    cafe,
    bookingMode: row.booking_mode ?? "go_hargeisa",
    externalBookingOption: row.external_booking_option ?? undefined,
    externalBookingUrl: row.external_booking_url ?? undefined,
    bookingWhatsapp: row.booking_whatsapp ?? undefined,
    bookingComUrl: row.booking_com_url ?? undefined,
    partnerStatus: row.partner_status,
    isPartner: row.is_partner,
    hotelType: (row.hotel_type as Hotel["hotelType"]) ?? undefined,
    starRating: row.star_rating ?? undefined,
    numberOfFloors: row.number_of_floors ?? undefined,
    yearEstablished: row.year_established ?? undefined,
  };
}

export function mapRestaurant(row: RestaurantRow, reviews: Review[] = []): Restaurant {
  const menu = Array.isArray(row.menu) ? (row.menu as unknown as RestaurantMenuItem[]) : [];
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as Restaurant["openingHoursStructured"])
    : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    socialTiktok: row.social_tiktok ?? undefined,
    socialSnapchat: row.social_snapchat ?? undefined,
    socialX: row.social_x ?? undefined,
    socialYoutube: row.social_youtube ?? undefined,
    socialTelegram: row.social_telegram ?? undefined,
    cuisine: row.cuisine ?? [],
    priceRange: (row.price_range as "$" | "$$" | "$$$") ?? "$$",
    openingHours: row.opening_hours ?? "",
    openingHoursStructured,
    is24Hours: row.is_24_hours,
    temporarilyClosed: row.temporarily_closed,
    permanentlyClosed: row.permanently_closed,
    menuHighlights: menu,
    reservable: row.reservable,
    featured: row.featured,
    logo: row.logo_url ?? undefined,
    menuPdfUrl: row.menu_pdf_url ?? undefined,
    partnerStatus: row.partner_status,
    isPartner: row.is_partner,
    amenitiesV2: row.amenities_v2 ?? [],
    favoriteCount: row.favorite_count ?? 0,
    restaurantType: (row.restaurant_type as Restaurant["restaurantType"]) ?? undefined,
    seatingCapacity: row.seating_capacity ?? undefined,
    numberOfTables: row.number_of_tables ?? undefined,
    onlineOrderUrl: row.online_order_url ?? undefined,
    onlineOrderingEnabled: row.online_ordering_enabled,
    phoneOrderingEnabled: row.phone_ordering_enabled,
    languages: row.languages ?? [],
    catalogOrderingEnabled: row.ordering_enabled,
    productsDeliveryEnabled: row.products_delivery_enabled,
  };
}

export function mapCafe(row: CafeRow, reviews: Review[] = [], locale?: string): Cafe {
  const menu = Array.isArray(row.menu) ? (row.menu as unknown as RestaurantMenuItem[]) : [];
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as Cafe["openingHoursStructured"])
    : [];
  const description =
    (locale === "ar" && row.description_ar) || (locale === "so" && row.description_so) || row.description;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description,
    descriptionAr: row.description_ar ?? undefined,
    descriptionSo: row.description_so ?? undefined,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    socialTiktok: row.social_tiktok ?? undefined,
    socialSnapchat: row.social_snapchat ?? undefined,
    socialX: row.social_x ?? undefined,
    socialYoutube: row.social_youtube ?? undefined,
    socialTelegram: row.social_telegram ?? undefined,
    specialDrinks: row.special_drinks ?? [],
    wifi: row.wifi,
    workingSpace: row.working_space,
    openingHours: row.opening_hours ?? "",
    openingHoursStructured,
    is24Hours: row.is_24_hours,
    temporarilyClosed: row.temporarily_closed,
    permanentlyClosed: row.permanently_closed,
    priceRange: row.price_range,
    amenities: row.amenities ?? [],
    amenitiesV2: row.amenities_v2 ?? [],
    favoriteCount: row.favorite_count ?? 0,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    featured: row.featured,
    logo: row.logo_url ?? undefined,
    menuHighlights: menu,
    menuPdfUrl: row.menu_pdf_url ?? undefined,
    partnerStatus: row.partner_status,
    isPartner: row.is_partner,
    cafeType: (row.cafe_type as Cafe["cafeType"]) ?? undefined,
    seatingCapacity: row.seating_capacity ?? undefined,
    reservable: row.reservable,
    sellsFlowers: row.sells_flowers,
    flowerAddons: Array.isArray(row.flower_addons) ? (row.flower_addons as unknown as Cafe["flowerAddons"]) : [],
    productsDeliveryEnabled: row.products_delivery_enabled,
    orderingEnabled: row.ordering_enabled,
  };
}

export function mapTableReservation(row: TableReservationRow): TableReservation {
  return {
    id: row.id,
    listingType: row.listing_type as TableReservation["listingType"],
    listingId: row.listing_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    reservationDate: row.reservation_date,
    reservationTime: row.reservation_time,
    guestsCount: row.guests_count,
    notes: row.notes ?? undefined,
    status: row.status,
    reservationReference: row.reservation_reference,
    userId: row.user_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id ?? undefined,
    productName: row.product_name,
    productNameAr: row.product_name_ar ?? undefined,
    productNameSo: row.product_name_so ?? undefined,
    productImage: row.product_image ?? undefined,
    unitPrice: Number(row.unit_price),
    quantity: row.quantity,
    addons: Array.isArray(row.addons) ? (row.addons as unknown as OrderItem["addons"]) : [],
    addonsTotal: Number(row.addons_total),
    lineTotal: Number(row.line_total),
  };
}

/** `row.order_items` is present when the caller's .select() joined it (every
 * current caller does) — defaults to [] otherwise rather than throwing. */
export function mapProductOrder(row: ProductOrderRow & { order_items?: OrderItemRow[] }): ProductOrder {
  return {
    id: row.id,
    listingType: row.listing_type,
    listingId: row.listing_id,
    items: (row.order_items ?? []).map(mapOrderItem),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    subtotal: Number(row.subtotal),
    total: row.total != null ? Number(row.total) : undefined,
    fulfillmentType: row.fulfillment_type,
    deliveryAddress: row.delivery_address ?? undefined,
    preferredDate: row.preferred_date ?? undefined,
    recipientName: row.recipient_name ?? undefined,
    recipientPhone: row.recipient_phone ?? undefined,
    occasion: row.occasion ?? undefined,
    messageNote: row.message_note ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    orderReference: row.order_reference,
    userId: row.user_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.name_ar ?? undefined,
    nameSo: row.name_so ?? undefined,
    description: row.description ?? undefined,
    descriptionAr: row.description_ar ?? undefined,
    descriptionSo: row.description_so ?? undefined,
    icon: row.icon,
    color: row.color ?? undefined,
    imageUrl: row.image_url ?? undefined,
    targetTable: row.target_table,
    isActive: row.is_active,
    isPinned: row.is_pinned,
    sortOrder: row.sort_order,
    searchKeywords: row.search_keywords ?? [],
    customFieldsSchema: (row.custom_fields_schema as unknown as Category["customFieldsSchema"]) ?? [],
    supportsGallery: row.supports_gallery,
    supportsNewFeatures: row.supports_new_features,
    schemaOrgType: row.schema_org_type ?? undefined,
    supportsProducts: row.supports_products ?? false,
    supportsAppointments: row.supports_appointments ?? false,
    isStandaloneSection: row.target_table !== "city_services",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** `category` is the resolved `categories` row for this service's
 * `category_id` — undefined for a row a migration hasn't backfilled yet,
 * in which case the deprecated `category` enum column is the only fallback. */
export function mapService(row: ServiceRow, reviews: Review[] = [], category?: Category): Service {
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as Service["openingHoursStructured"])
    : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    documentUrl: row.document_url ?? undefined,
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    socialTiktok: row.social_tiktok ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    openingHoursStructured,
    services: row.services ?? [],
    category: row.category as Service["category"],
    categorySlug: category?.slug ?? row.category ?? "uncategorized",
    categoryLabel: category?.name ?? row.category ?? "Uncategorized",
    categoryIcon: category?.icon ?? "Building2",
    categoryColor: category?.color ?? "#64748B",
    customFields: (row.custom_fields as Record<string, string | number | boolean>) ?? {},
    featured: row.featured,
    logo: row.logo_url ?? undefined,
    isPartner: row.is_partner,
    travelAgencyType: (row.travel_agency_type as Service["travelAgencyType"]) ?? undefined,
    flightTicketing: row.flight_ticketing ?? undefined,
    hotelBooking: row.hotel_booking ?? undefined,
    visaAssistance: row.visa_assistance ?? undefined,
    tourPackages: row.tour_packages ?? undefined,
    airportTransfers: row.airport_transfers ?? undefined,
    carRentalAssistance: row.car_rental_assistance ?? undefined,
    hajjUmrahServices: row.hajj_umrah_services ?? undefined,
    localTours: row.local_tours ?? undefined,
    internationalTours: row.international_tours ?? undefined,
    groupTours: row.group_tours ?? undefined,
    travelInsuranceAssistance: row.travel_insurance_assistance ?? undefined,
    languages: row.languages ?? [],
    flowerShopType: (row.flower_shop_type as Service["flowerShopType"]) ?? undefined,
    flowerDeliveryAvailable: row.flower_delivery_available ?? undefined,
    sameDayDelivery: row.same_day_delivery ?? undefined,
    customBouquets: row.custom_bouquets ?? undefined,
    weddingArrangements: row.wedding_arrangements ?? undefined,
    eventDecorationService: row.event_decoration_service ?? undefined,
    giftWrapping: row.gift_wrapping ?? undefined,
    indoorPlants: row.indoor_plants ?? undefined,
    outdoorPlants: row.outdoor_plants ?? undefined,
    onlineOrderingAvailable: row.online_ordering_available ?? undefined,
    deliveryAreas: row.delivery_areas ?? [],
    apartmentType: (row.apartment_type as Service["apartmentType"]) ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    unitsCount: row.units_count ?? undefined,
    floorNumber: row.floor_number ?? undefined,
    buildingFloors: row.building_floors ?? undefined,
    furnished: row.furnished ?? undefined,
    monthlyRent: row.monthly_rent ?? undefined,
    dailyRent: row.daily_rent ?? undefined,
    securityDeposit: row.security_deposit ?? undefined,
    minStayNights: row.min_stay_nights ?? undefined,
    maxStayNights: row.max_stay_nights ?? undefined,
    parkingAvailable: row.parking_available ?? undefined,
    wifiAvailable: row.wifi_available ?? undefined,
    airConditioning: row.air_conditioning ?? undefined,
    kitchenAvailable: row.kitchen_available ?? undefined,
    electricityIncluded: row.electricity_included ?? undefined,
    waterIncluded: row.water_included ?? undefined,
    generatorAvailable: row.generator_available ?? undefined,
    securityAvailable: row.security_available ?? undefined,
    elevatorAvailable: row.elevator_available ?? undefined,
    swimmingPool: row.swimming_pool ?? undefined,
    laundryAvailable: row.laundry_available ?? undefined,
    familyFriendly: row.family_friendly ?? undefined,
    petPolicy: (row.pet_policy as Service["petPolicy"]) ?? undefined,
    propertyType: (row.property_type as Service["propertyType"]) ?? undefined,
    listingPurpose: (row.listing_purpose as Service["listingPurpose"]) ?? undefined,
    price: row.price ?? undefined,
    priceCurrency: (row.price_currency as Service["priceCurrency"]) ?? undefined,
    realEstateBedrooms: row.real_estate_bedrooms ?? undefined,
    realEstateBathrooms: row.real_estate_bathrooms ?? undefined,
    floorsCount: row.floors_count ?? undefined,
    yearBuilt: row.year_built ?? undefined,
    areaSqm: row.area_sqm ?? undefined,
    landAreaSqm: row.land_area_sqm ?? undefined,
    buildingAreaSqm: row.building_area_sqm ?? undefined,
    realEstateParkingAvailable: row.real_estate_parking_available ?? undefined,
    realEstateFurnished: row.real_estate_furnished ?? undefined,
    documentsAvailable: row.documents_available ?? undefined,
    viewingAvailable: row.viewing_available ?? undefined,
    propertyCondition: (row.property_condition as Service["propertyCondition"]) ?? undefined,
    ownershipStatus: (row.ownership_status as Service["ownershipStatus"]) ?? undefined,
    electronicsBusinessType: (row.electronics_business_type as Service["electronicsBusinessType"]) ?? undefined,
    brandsAvailable: row.brands_available ?? [],
    sellsNew: row.sells_new ?? undefined,
    sellsUsed: row.sells_used ?? undefined,
    warrantyAvailable: row.warranty_available ?? undefined,
    electronicsDeliveryAvailable: row.electronics_delivery_available ?? undefined,
    electronicsRepairAvailable: row.electronics_repair_available ?? undefined,
    installationAvailable: row.installation_available ?? undefined,
    paymentOptions: row.payment_options ?? [],
    transportationType: (row.transportation_type as Service["transportationType"]) ?? undefined,
    vehicleCount: row.vehicle_count ?? undefined,
    passengerCapacity: row.passenger_capacity ?? undefined,
    driverAvailable: row.driver_available ?? undefined,
    airportTransferAvailable: row.airport_transfer_available ?? undefined,
    cityTransfersAvailable: row.city_transfers_available ?? undefined,
    intercityTransportAvailable: row.intercity_transport_available ?? undefined,
    rentalAvailable: row.rental_available ?? undefined,
    dailyRentalAvailable: row.daily_rental_available ?? undefined,
    weeklyRentalAvailable: row.weekly_rental_available ?? undefined,
    monthlyRentalAvailable: row.monthly_rental_available ?? undefined,
    deliveryServiceAvailable: row.delivery_service_available ?? undefined,
    cargoServiceAvailable: row.cargo_service_available ?? undefined,
  };
}

export function mapAttraction(row: AttractionRow, reviews: Review[] = []): Attraction {
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as Attraction["openingHoursStructured"])
    : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    history: row.history ?? "",
    bestTimeToVisit: row.best_time_to_visit ?? "",
    entryFee: row.entry_fee,
    visitorTips: row.visitor_tips ?? [],
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    socialTiktok: row.social_tiktok ?? undefined,
    socialSnapchat: row.social_snapchat ?? undefined,
    socialX: row.social_x ?? undefined,
    socialYoutube: row.social_youtube ?? undefined,
    socialTelegram: row.social_telegram ?? undefined,
    nearbyRestaurantIds: [],
    nearbyHotelIds: [],
    category: row.category,
    featured: row.featured,
    amenitiesV2: row.amenities_v2 ?? [],
    favoriteCount: row.favorite_count ?? 0,
    openingHoursStructured,
    is24Hours: row.is_24_hours,
    temporarilyClosed: row.temporarily_closed,
    permanentlyClosed: row.permanently_closed,
  };
}

export function mapEvent(row: EventRow, reviews: Review[] = []): EventItem {
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as EventItem["openingHoursStructured"])
    : [];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    category: row.category,
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.location,
    coords: { lat: row.lat, lng: row.lng },
    ticketInfo: row.ticket_info ?? undefined,
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    favoriteCount: row.favorite_count ?? 0,
    amenitiesV2: row.amenities_v2 ?? [],
    openingHoursStructured,
    is24Hours: row.is_24_hours,
    temporarilyClosed: row.temporarily_closed,
    permanentlyClosed: row.permanently_closed,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    socialTiktok: row.social_tiktok ?? undefined,
    socialSnapchat: row.social_snapchat ?? undefined,
    socialX: row.social_x ?? undefined,
    socialYoutube: row.social_youtube ?? undefined,
    socialTelegram: row.social_telegram ?? undefined,
  };
}

/** locale: which of name/name_ar/name_so and description/description_ar/
 * description_so to resolve to, matching the pre-existing (pre-Phase-11)
 * behavior of this table's list-view mapper — kept here so both the list
 * grouping query and the new by-slug detail query share one mapper. */
export function mapCityService(row: CityServiceRow, reviews: Review[] = [], locale?: string): CityService {
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as CityService["openingHoursStructured"])
    : [];
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    categoryId: row.category_id,
    name: (locale === "ar" && row.name_ar) || (locale === "so" && row.name_so) || row.name,
    description: (locale === "ar" && row.description_ar) || (locale === "so" && row.description_so) || row.description,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    openingHours: row.opening_hours,
    mapsUrl: row.maps_url,
    website: row.website,
    image: row.image,
    logoUrl: row.logo_url ?? undefined,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    documentUrl: row.document_url ?? undefined,
    coords: { lat: row.lat, lng: row.lng },
    status: row.status,
    featured: row.featured,
    sortOrder: row.sort_order,
    isPartner: row.is_partner,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    favoriteCount: row.favorite_count ?? 0,
    amenitiesV2: row.amenities_v2 ?? [],
    serviceTags: row.service_tags ?? [],
    openingHoursStructured,
    is24Hours: row.is_24_hours,
    temporarilyClosed: row.temporarily_closed,
    permanentlyClosed: row.permanently_closed,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    socialTiktok: row.social_tiktok ?? undefined,
    socialSnapchat: row.social_snapchat ?? undefined,
    socialX: row.social_x ?? undefined,
    socialYoutube: row.social_youtube ?? undefined,
    socialTelegram: row.social_telegram ?? undefined,
    schoolType: (row.school_type as CityService["schoolType"]) ?? undefined,
    curriculum: (row.curriculum as CityService["curriculum"]) ?? undefined,
    educationLevels: row.education_levels ?? [],
    ageRangeGrades: row.age_range_grades ?? undefined,
    numberOfClassrooms: row.number_of_classrooms ?? undefined,
    universityType: (row.university_type as CityService["universityType"]) ?? undefined,
    degreeLevels: row.degree_levels ?? [],
    facultiesOffered: row.faculties_offered ?? [],
    numberOfBuildings: row.number_of_buildings ?? undefined,
    educationFacilities: row.education_facilities ?? [],
    numberOfStudents: row.number_of_students ?? undefined,
    numberOfTeachers: row.number_of_teachers ?? undefined,
    admissionsOpen: row.admissions_open,
    admissionPhone: row.admission_phone ?? undefined,
    admissionWhatsapp: row.admission_whatsapp ?? undefined,
    admissionUrl: row.admission_url ?? undefined,
    applicationUrl: row.application_url ?? undefined,
    numberOfFloors: row.number_of_floors ?? undefined,
    yearEstablished: row.year_established ?? undefined,
    languages: row.languages ?? [],
    salonType: (row.salon_type as CityService["salonType"]) ?? undefined,
    shopType: (row.shop_type as CityService["shopType"]) ?? undefined,
    staffCount: row.staff_count ?? undefined,
    walkInsAccepted: row.walk_ins_accepted ?? undefined,
    homeServiceAvailable: row.home_service_available ?? undefined,
    storeType: (row.store_type as CityService["storeType"]) ?? undefined,
    brands: row.brands ?? [],
    rentalType: (row.rental_type as CityService["rentalType"]) ?? undefined,
    vehicleTypes: row.vehicle_types ?? [],
    minimumRentalPeriod: row.minimum_rental_period ?? undefined,
    driversLicenseRequired: row.drivers_license_required ?? undefined,
    depositRequired: row.deposit_required ?? undefined,
    fleetSize: row.fleet_size ?? undefined,
    clinicType: (row.clinic_type as CityService["clinicType"]) ?? undefined,
    numberOfTreatmentRooms: row.number_of_treatment_rooms ?? undefined,
    insuranceAccepted: row.insurance_accepted ?? [],
    garageType: (row.garage_type as CityService["garageType"]) ?? undefined,
    gymType: (row.gym_type as CityService["gymType"]) ?? undefined,
    classesOffered: row.classes_offered ?? [],
    membershipOptions: row.membership_options ?? [],
    personalTrainingAvailable: row.personal_training_available ?? undefined,
    groupClassesAvailable: row.group_classes_available ?? undefined,
    gymFacilities: row.gym_facilities ?? [],
    trainersAvailable: row.trainers_available ?? undefined,
    femaleTrainersAvailable: row.female_trainers_available ?? undefined,
    maleTrainersAvailable: row.male_trainers_available ?? undefined,
    trialMembershipAvailable: row.trial_membership_available ?? undefined,
    hospitalType: (row.hospital_type as CityService["hospitalType"]) ?? undefined,
    bedsCount: row.beds_count ?? undefined,
    doctorsCount: row.doctors_count ?? undefined,
    nursesCount: row.nurses_count ?? undefined,
    departmentsCount: row.departments_count ?? undefined,
    operatingRoomsCount: row.operating_rooms_count ?? undefined,
    emergencyDepartment: row.emergency_department ?? undefined,
    icuAvailable: row.icu_available ?? undefined,
    pharmacyOnsite: row.pharmacy_onsite ?? undefined,
    laboratoryOnsite: row.laboratory_onsite ?? undefined,
    radiologyOnsite: row.radiology_onsite ?? undefined,
    ambulanceAvailable: row.ambulance_available ?? undefined,
    maternityDepartment: row.maternity_department ?? undefined,
    pediatricDepartment: row.pediatric_department ?? undefined,
    visitingHours: row.visiting_hours ?? undefined,
    pharmacyType: (row.pharmacy_type as CityService["pharmacyType"]) ?? undefined,
    pharmacyDeliveryAvailable: row.pharmacy_delivery_available ?? undefined,
    prescriptionRequired: row.prescription_required ?? undefined,
    homeDelivery: row.home_delivery ?? undefined,
    pharmacyEmergencyContact: row.pharmacy_emergency_contact ?? undefined,
  };
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    listingType: (row.listing_type as Product["listingType"]) ?? "city_service",
    listingId: row.listing_id,
    name: row.name,
    nameAr: row.name_ar ?? undefined,
    nameSo: row.name_so ?? undefined,
    description: row.description ?? undefined,
    descriptionAr: row.description_ar ?? undefined,
    descriptionSo: row.description_so ?? undefined,
    brand: row.brand ?? undefined,
    category: row.category ?? undefined,
    gender: row.gender ?? undefined,
    price: row.price != null ? Number(row.price) : undefined,
    currency: row.currency,
    image: row.image ?? undefined,
    gallery: toGallery(row.gallery),
    isAvailable: row.is_available,
    isFeatured: row.is_featured,
    isHidden: row.is_hidden,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    size: row.size ?? undefined,
  };
}

export function mapDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    cityServiceId: row.city_service_id,
    name: row.name,
    nameAr: row.name_ar ?? undefined,
    nameSo: row.name_so ?? undefined,
    sortOrder: row.sort_order,
  };
}

export function mapDoctor(row: DoctorRow): Doctor {
  return {
    id: row.id,
    cityServiceId: row.city_service_id,
    departmentId: row.department_id ?? undefined,
    name: row.name,
    photo: row.photo ?? undefined,
    specialty: row.specialty ?? undefined,
    specialtyAr: row.specialty_ar ?? undefined,
    specialtySo: row.specialty_so ?? undefined,
    bio: row.bio ?? undefined,
    bioAr: row.bio_ar ?? undefined,
    bioSo: row.bio_so ?? undefined,
    languages: row.languages ?? [],
    workingHours: Array.isArray(row.working_hours) ? (row.working_hours as unknown as OpeningHoursGroup[]) : [],
    appointmentDurationMinutes: row.appointment_duration_minutes,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    consultationFee: row.consultation_fee ?? undefined,
  };
}

export function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientEmail: row.patient_email ?? undefined,
    userId: row.user_id ?? undefined,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapArticle(row: ArticleRow, authorName = "Go Hargeisa Editorial"): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    author: authorName,
    publishedAt: row.published_at ?? row.created_at,
    readMinutes: row.read_minutes,
    category: row.category,
  };
}

type BusinessOfferRow = Database["public"]["Tables"]["business_offers"]["Row"];

export function mapBusinessOffer(row: BusinessOfferRow): BusinessOffer {
  return {
    id: row.id,
    listingType: row.listing_type,
    listingId: row.listing_id,
    title: row.title,
    description: row.description ?? undefined,
    discountType: row.discount_type,
    discountValue: row.discount_value ?? undefined,
    couponCode: row.coupon_code ?? undefined,
    coverImage: row.cover_image ?? undefined,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    isActive: row.is_active,
    approvalStatus: row.approval_status,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message ?? null,
    type: (row.type as NotificationSeverity) ?? "info",
    category: (row.category as NotificationCategory | null) ?? null,
    data: (row.data as Record<string, string | number | null>) ?? {},
    actionUrl: row.action_url ?? null,
    isRead: row.is_read,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
  };
}
