-- Go Hargeisa — explicit, independent restaurant ordering capabilities.
--
-- Order Now previously had no real capability flag of its own: it was
-- inferred from `restaurant_type` (only fast_food/bakery_restaurant could
-- ever get it) with online_order_url or phone as the destination. That
-- meant a business owner had no way to actually turn ordering on/off
-- themselves, and a fine-dining restaurant with a real online_order_url set
-- would silently never show Order Now. These two columns make "does this
-- restaurant take online orders" and "does it take phone-in orders" their
-- own explicit, owner-controlled booleans — independent of both each other
-- and of Table Reservations (`reservable`, unchanged) and restaurant_type.
alter table restaurants add column if not exists online_ordering_enabled boolean not null default false;
alter table restaurants add column if not exists phone_ordering_enabled boolean not null default false;

-- Backfill so existing restaurants that already relied on the old
-- type-inferred behavior keep their currently-working Order Now button
-- after this migration makes the explicit flags authoritative, instead of
-- it silently disappearing.
update restaurants set online_ordering_enabled = true
where online_order_url is not null and online_order_url <> '';

update restaurants set phone_ordering_enabled = true
where restaurant_type in ('fast_food', 'bakery_restaurant')
  and phone is not null and phone <> ''
  and (online_order_url is null or online_order_url = '');
