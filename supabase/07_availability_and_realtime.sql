-- ============================================================================
-- KRONOS STREETWEAR — 07_availability_and_realtime.sql
-- Adds dynamic per-product availability status ('in_stock', 'out_of_stock', 'arrivage'),
-- optional arrival note, and enables Supabase Realtime across Storefront & Admin.
-- Safe to run multiple times (idempotent DDL).
-- ============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'in_stock'
    CHECK (availability_status IN ('in_stock', 'out_of_stock', 'arrivage')),
  ADD COLUMN IF NOT EXISTS arrival_note text DEFAULT '';

UPDATE public.products
SET availability_status = 'out_of_stock'
WHERE stock_quantity = 0 AND availability_status = 'in_stock';

CREATE INDEX IF NOT EXISTS products_availability_idx
  ON public.products (availability_status)
  WHERE is_published = true;

-- Enable live Realtime replication for Storefront <-> Admin cross-domain sync
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.promo_codes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

