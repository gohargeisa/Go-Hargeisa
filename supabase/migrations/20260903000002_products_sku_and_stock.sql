-- ============================================================================
-- Go Hargeisa — products.sku / products.stock_quantity
--
-- Generic, partner-agnostic additions (not Flormar-specific) — every current
-- and future partner whose catalog originates from an external inventory
-- system (Odoo, a POS export, a supplier spreadsheet) needs a stable way to
-- reconcile "the row already in our DB" against "the row in the latest
-- source export" without relying on `name` (which can legitimately change)
-- or `price` (ditto). `sku` is that stable key when the source system has
-- one; `stock_quantity` is the same source's on-hand count, surfaced only
-- for a future "Availability"/low-stock signal — never a customer-facing
-- inventory guarantee. Both nullable: every existing product (none of which
-- came from a SKU-bearing source) is unaffected, and a partner whose
-- catalog has no such concept simply never sets them.
-- ============================================================================

alter table products add column if not exists sku text;
alter table products add column if not exists stock_quantity integer;

comment on column products.sku is 'Optional external inventory reference (e.g. an Odoo Internal Reference / product code) — used to reconcile this row against a future re-import from the same source, never shown to customers as-is unless a partner chooses to.';
comment on column products.stock_quantity is 'Optional on-hand count from the source inventory system, if any — informational only, not a live stock guarantee.';

create index if not exists idx_products_sku on products (listing_type, listing_id, sku) where sku is not null;
