-- ============================================================================
-- Go Hargeisa — Additional Infrastructure Tables
-- Add this migration after the main schema.sql is set up
-- ============================================================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON hotels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);
CREATE INDEX IF NOT EXISTS idx_hotels_featured ON hotels(featured);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_featured ON restaurants(featured);
CREATE INDEX IF NOT EXISTS idx_cafes_owner_id ON cafes(owner_id);
CREATE INDEX IF NOT EXISTS idx_cafes_status ON cafes(status);
CREATE INDEX IF NOT EXISTS idx_cafes_featured ON cafes(featured);
CREATE INDEX IF NOT EXISTS idx_attractions_status ON attractions(status);
CREATE INDEX IF NOT EXISTS idx_attractions_featured ON attractions(featured);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_type, listing_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_type, listing_id);
CREATE INDEX IF NOT EXISTS idx_saved_trips_user_id ON saved_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================================
-- ACTIVITY LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null, -- 'hotel', 'restaurant', 'cafe', 'attraction', 'event', 'article', 'user', 'settings'
  entity_id text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- ============================================================================
-- SITE SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id text primary key,
  site_name text not null default 'Go Hargeisa',
  logo_url text,
  favicon_url text,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  social_facebook text,
  social_instagram text,
  social_twitter text,
  social_youtube text,
  social_tiktok text,
  footer_text text,
  default_language text not null default 'en',
  default_theme text not null default 'light', -- 'light' or 'dark'
  map_center_lat double precision default 9.560,
  map_center_lng double precision default 44.405,
  map_zoom integer default 12,
  features_reviews_enabled boolean not null default true,
  features_ratings_enabled boolean not null default true,
  features_favorites_enabled boolean not null default true,
  features_trips_enabled boolean not null default true,
  features_newsletter_enabled boolean not null default true,
  seo_title text,
  seo_description text,
  seo_keywords text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default settings
INSERT INTO site_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  message text,
  type text not null, -- 'success', 'error', 'warning', 'info'
  action_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- BUSINESS HOURS (for restaurants, cafes, attractions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null, -- 'hotel', 'restaurant', 'cafe', 'attraction'
  entity_id uuid not null,
  day_of_week integer not null, -- 0 = Sunday, 6 = Saturday
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  special_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_business_hours_entity ON business_hours(entity_type, entity_id);

-- ============================================================================
-- AMENITY CATEGORIES (predefined amenities for listings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS amenity_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Predefined amenities
INSERT INTO amenity_categories (name, icon, sort_order) VALUES
('WiFi', 'wifi', 1),
('Parking', 'parking', 2),
('Air Conditioning', 'thermometer', 3),
('Swimming Pool', 'droplet', 4),
('Restaurant', 'utensils', 5),
('Bar', 'beer', 6),
('Pet Friendly', 'paw-print', 7),
('Wheelchair Access', 'wheelchair', 8),
('Gym', 'activity', 9),
('Meeting Rooms', 'briefcase', 10),
('Room Service', 'bell', 11),
('Concierge', 'user-check', 12),
('Garden', 'leaf', 13),
('Outdoor Seating', 'umbrella', 14),
('Kids Menu', 'baby', 15)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ENABLE RLS POLICIES (BASIC)
-- ============================================================================

-- Activity logs: Only owners/admins can read
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select_owner" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- Site settings: Anyone can read, only owners can update
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_select_all" ON site_settings
  FOR SELECT
  USING (true);

CREATE POLICY "site_settings_update_owner" ON site_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- Notifications: Users can only read their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Business hours: Anyone can read
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_hours_select_all" ON business_hours
  FOR SELECT
  USING (true);

-- Amenity categories: Anyone can read
ALTER TABLE amenity_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "amenity_categories_select_all" ON amenity_categories
  FOR SELECT
  USING (true);
