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
  rating: number;
  review_count: number;
  featured: boolean;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

type HotelRow = ListingBase & {
  description_ar: string | null; description_so: string | null; phone: string | null;
  website: string | null; price_range: "$" | "$$" | "$$$" | "$$$$"; amenities: string[]; owner_id: string | null;
  logo_url: string | null; check_in_time: string | null; check_out_time: string | null; languages: string[];
  restaurant_id: string | null; cafe_id: string | null;
  booking_mode: "go_hargeisa" | "external";
  external_booking_option: "website" | "booking_com" | "whatsapp" | "custom_url" | null;
  external_booking_url: string | null; booking_whatsapp: string | null; booking_com_url: string | null;
};

type RoomTypeDb = "standard" | "deluxe" | "twin" | "family" | "executive_suite";

type HotelRoomRow = {
  id: string; hotel_id: string; name: string; image: string | null; size_sqm: number | null;
  max_guests: number; bed_type: string | null; features: string[]; price_per_night: number | null;
  sort_order: number; room_type: RoomTypeDb; is_available: boolean; created_at: string; updated_at: string;
};

type RoomAvailabilityRow = {
  id: string; room_id: string; date: string; is_available: boolean; note: string | null; created_at: string;
};
type RestaurantRow = ListingBase & {
  phone: string | null; website: string | null; cuisine: string[]; price_range: "$" | "$$" | "$$$" | "$$$$";
  opening_hours: string | null; menu: Json; reservable: boolean; owner_id: string | null;
  logo_url: string | null; menu_pdf_url: string | null;
};
type CafeRow = ListingBase & {
  phone: string | null; special_drinks: string[]; wifi: boolean; working_space: boolean;
  opening_hours: string | null; owner_id: string | null;
  logo_url: string | null; menu: Json; menu_pdf_url: string | null;
};
type AttractionRow = ListingBase & {
  history: string | null; best_time_to_visit: string | null; entry_fee: string; visitor_tips: string[];
  category: "landmark" | "museum" | "market" | "nature" | "religious";
};

type ServiceCategoryDb = "hospital" | "pharmacy" | "dental_clinic" | "bank" | "atm" | "currency_exchange" | "gas_station" | "car_rental";

type ServiceRow = ListingBase & {
  phone: string | null; website: string | null; opening_hours: string | null; services: string[];
  category: ServiceCategoryDb; owner_id: string | null;
};

type BusinessListingType = "hotel" | "restaurant" | "cafe" | "service";

type BookingRow = {
  id: string; hotel_id: string; room_id: string | null; guest_name: string; guest_phone: string | null;
  guest_email: string | null; guests_count: number; check_in: string; check_out: string;
  status: "pending" | "confirmed" | "cancelled" | "completed"; notes: string | null;
  adults: number; children: number; rooms_count: number; booking_reference: string | null;
  payment_status: "unpaid" | "pending" | "paid" | "refunded"; payment_method: string | null;
  user_id: string | null;
  created_at: string; updated_at: string;
};

type BookingStatusHistoryRow = {
  id: string; booking_id: string;
  old_status: "pending" | "confirmed" | "cancelled" | "completed" | null;
  new_status: "pending" | "confirmed" | "cancelled" | "completed";
  changed_by: string | null; created_at: string;
};

type BusinessMetricEventRow = {
  id: string; listing_type: BusinessListingType; listing_id: string;
  event_type: "view" | "website_click" | "call_click" | "whatsapp_click"; created_at: string;
};

type BusinessSubscriptionRow = {
  id: string; listing_type: BusinessListingType; listing_id: string;
  plan_tier: "standard" | "premium"; renews_at: string | null; created_at: string; updated_at: string;
};

type BusinessMessageRow = {
  id: string; listing_type: BusinessListingType; listing_id: string; sender_name: string;
  sender_email: string | null; sender_phone: string | null; message: string; is_read: boolean; created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; full_name: string | null; avatar_url: string | null; role: "user" | "business_owner" | "owner"; phone: string | null; bio: string | null; notify_activity: boolean; notify_marketing: boolean; created_at: string; updated_at: string }>;
      hotels: Table<HotelRow>;
      restaurants: Table<RestaurantRow>;
      cafes: Table<CafeRow>;
      attractions: Table<AttractionRow>;
      services: Table<ServiceRow>;
      events: Table<{ id: string; slug: string; title: string; title_ar: string | null; title_so: string | null; description: string; cover_image: string; category: "cultural" | "national" | "business" | "sports" | "concert"; start_date: string; end_date: string; location: string; ticket_info: string | null; status: "draft" | "published" | "archived"; created_by: string | null; created_at: string }>;
      articles: Table<{ id: string; slug: string; title: string; title_ar: string | null; title_so: string | null; excerpt: string; body: string; cover_image: string; category: string; author_id: string | null; read_minutes: number; status: "draft" | "published" | "archived"; published_at: string | null; created_at: string }>;
      destinations: Table<{ id: string; slug: string; name: string; description: string; image: string; place_count: number; created_at: string }>;
      map_points: Table<{ id: string; name: string; category: string; lat: number; lng: number; created_at: string }>;
      reviews: Table<{ id: string; listing_type: "hotel" | "restaurant" | "cafe" | "attraction" | "service"; listing_id: string; user_id: string | null; rating: number; comment: string | null; photos: Json; owner_reply: string | null; owner_reply_at: string | null; is_reported: boolean; created_at: string }>;
      hotel_rooms: Table<HotelRoomRow>;
      room_availability: Table<RoomAvailabilityRow>;
      bookings: Table<BookingRow>;
      booking_status_history: Table<BookingStatusHistoryRow>;
      business_metric_events: Table<BusinessMetricEventRow>;
      business_subscriptions: Table<BusinessSubscriptionRow>;
      business_messages: Table<BusinessMessageRow>;
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
      notifications: Table<{ id: string; user_id: string | null; title: string; message: string | null; type: string; action_url: string | null; is_read: boolean; created_at: string; read_at: string | null }>;
      business_hours: Table<{ id: string; entity_type: string; entity_id: string; day_of_week: number; opens_at: string | null; closes_at: string | null; is_closed: boolean; special_note: string | null; created_at: string; updated_at: string }>;
      amenity_categories: Table<{ id: string; name: string; icon: string | null; sort_order: number; created_at: string }>;
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
        };
        Returns: string;
      };
    };
    Enums: { user_role: "user" | "business_owner" | "owner"; price_range: "$" | "$$" | "$$$" | "$$$$"; attraction_category: "landmark" | "museum" | "market" | "nature" | "religious"; event_category: "cultural" | "national" | "business" | "sports" | "concert"; content_status: "draft" | "published" | "archived"; listing_type: "hotel" | "restaurant" | "cafe" | "attraction" | "service"; service_category: ServiceCategoryDb; };
    CompositeTypes: Record<string, never>;
  };
};
