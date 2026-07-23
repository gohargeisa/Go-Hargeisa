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
};
type RestaurantRow = ListingBase & {
  phone: string | null; website: string | null; cuisine: string[]; price_range: "$" | "$$" | "$$$" | "$$$$";
  opening_hours: string | null; menu: Json; reservable: boolean; owner_id: string | null;
};
type CafeRow = ListingBase & {
  phone: string | null; special_drinks: string[]; wifi: boolean; working_space: boolean;
  opening_hours: string | null; owner_id: string | null;
};
type AttractionRow = ListingBase & {
  history: string | null; best_time_to_visit: string | null; entry_fee: string; visitor_tips: string[];
  category: "landmark" | "museum" | "market" | "nature" | "religious";
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; full_name: string | null; avatar_url: string | null; role: "user" | "business_owner" | "owner"; phone: string | null; created_at: string; updated_at: string }>;
      hotels: Table<HotelRow>;
      restaurants: Table<RestaurantRow>;
      cafes: Table<CafeRow>;
      attractions: Table<AttractionRow>;
      events: Table<{ id: string; slug: string; title: string; title_ar: string | null; title_so: string | null; description: string; cover_image: string; category: "cultural" | "national" | "business" | "sports" | "concert"; start_date: string; end_date: string; location: string; ticket_info: string | null; status: "draft" | "published" | "archived"; created_by: string | null; created_at: string }>;
      articles: Table<{ id: string; slug: string; title: string; title_ar: string | null; title_so: string | null; excerpt: string; body: string; cover_image: string; category: string; author_id: string | null; read_minutes: number; status: "draft" | "published" | "archived"; published_at: string | null; created_at: string }>;
      destinations: Table<{ id: string; slug: string; name: string; description: string; image: string; place_count: number; created_at: string }>;
      map_points: Table<{ id: string; name: string; category: string; lat: number; lng: number; created_at: string }>;
      reviews: Table<{ id: string; listing_type: "hotel" | "restaurant" | "cafe" | "attraction"; listing_id: string; user_id: string | null; rating: number; comment: string | null; created_at: string }>;
      favorites: Table<{ id: string; user_id: string | null; listing_type: "hotel" | "restaurant" | "cafe" | "attraction"; listing_id: string; created_at: string }>;
      saved_trips: Table<{ id: string; user_id: string | null; title: string; notes: string | null; created_at: string }>;
      saved_trip_items: Table<{ id: string; trip_id: string | null; listing_type: "hotel" | "restaurant" | "cafe" | "attraction"; listing_id: string; day_number: number | null; sort_order: number | null }>;
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
    Functions: Record<string, never>;
    Enums: { user_role: "user" | "business_owner" | "owner"; price_range: "$" | "$$" | "$$$" | "$$$$"; attraction_category: "landmark" | "museum" | "market" | "nature" | "religious"; event_category: "cultural" | "national" | "business" | "sports" | "concert"; content_status: "draft" | "published" | "archived"; listing_type: "hotel" | "restaurant" | "cafe" | "attraction"; };
    CompositeTypes: Record<string, never>;
  };
};
