-- ============================================================================
-- KRONOS STREETWEAR — 01_schema.sql
-- PostgreSQL Schema, Constraints, Indexes & Updated-At Triggers for Supabase
-- Safe to run multiple times (idempotent DDL).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Shared Updated-At Trigger Function (search_path hardened) ────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- ── 1. Admin Profiles (Linked to Supabase Auth Users) ────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT 'KRONOS Admin',
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'editor')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_profiles_email_idx ON public.admin_profiles (email);
CREATE INDEX IF NOT EXISTS admin_profiles_active_idx ON public.admin_profiles (id) WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. Dynamic Product Catalog (Prices, Discounts, Pictures, Variants, Sizes) ─
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  gender text NOT NULL DEFAULT 'MEN' CHECK (gender IN ('MEN', 'WOMEN', 'UNISEX')),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  original_price numeric(10, 2) CHECK (original_price IS NULL OR original_price >= 0),
  discount text,
  badge text,
  img text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  color_variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  sizes jsonb NOT NULL DEFAULT '["S","M","L","XL"]'::jsonb,
  description text,
  model_height text DEFAULT 'Model height: 184 cm',
  composition text DEFAULT '100% Cotton',
  garment_type text DEFAULT 'top',
  fit_score text DEFAULT '98% Anatomical Fit',
  stock_quantity integer NOT NULL DEFAULT 50 CHECK (stock_quantity >= 0),
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_gender_idx ON public.products (gender);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS products_published_sort_idx ON public.products (is_published, sort_order);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. Supabase Storage Media Vault Registry (Images, Videos, Documents) ─────
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
  bucket_name text NOT NULL CHECK (bucket_name IN ('kronos-images', 'kronos-videos', 'kronos-documents')),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  linked_entity_type text, -- e.g., 'product', 'hero', 'lookbook', 'store', 'document'
  linked_entity_id text,
  notes text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_type_idx ON public.media_assets (media_type, created_at DESC);
CREATE INDEX IF NOT EXISTS media_assets_bucket_idx ON public.media_assets (bucket_name);
CREATE INDEX IF NOT EXISTS media_assets_entity_idx ON public.media_assets (linked_entity_type, linked_entity_id);

DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. Dynamic Storefront Settings (Brand, Hero, Videos, Contact Email/Phone, Stores, Theme) ─
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  section text NOT NULL DEFAULT 'general',
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_settings_section_idx ON public.site_settings (section);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5. Promo Codes Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_tnd numeric(10, 2) NOT NULL DEFAULT 0 CHECK (min_order_tnd >= 0),
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_codes_active_code_idx ON public.promo_codes (code) WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER trg_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. Customer Commandes (Orders) Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL CHECK (length(trim(customer_name)) >= 2),
  customer_email text NOT NULL CHECK (position('@' IN customer_email) > 1),
  customer_phone text NOT NULL CHECK (length(trim(customer_phone)) >= 6),
  shipping_address text NOT NULL CHECK (length(trim(shipping_address)) >= 3),
  city text NOT NULL DEFAULT 'Tunis',
  postal_code text DEFAULT '',
  country text NOT NULL DEFAULT 'Tunisia',
  notes text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal_tnd numeric(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal_tnd >= 0),
  discount_tnd numeric(10, 2) NOT NULL DEFAULT 0 CHECK (discount_tnd >= 0),
  shipping_tnd numeric(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_tnd >= 0),
  total_tnd numeric(10, 2) NOT NULL DEFAULT 0 CHECK (total_tnd >= 0),
  currency_code text NOT NULL DEFAULT 'TND',
  promo_code text,
  payment_method text NOT NULL DEFAULT 'cash_on_delivery',
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_status_created_idx ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON public.orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON public.orders (customer_phone);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 7. Newsletter Subscribers (Footer Email Capture) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (position('@' IN email) > 1),
  source text NOT NULL DEFAULT 'footer',
  is_subscribed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_created_idx ON public.newsletter_subscribers (created_at DESC);

-- ── 8. Admin Audit Logs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity_table text NOT NULL,
  entity_id text,
  summary text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_idx ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx ON public.admin_audit_logs (actor_id);

-- ── 9. Storefront Safe RPCs (Zero PII Leak for Anon Checkout) ────────────────
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code text)
RETURNS TABLE (
  code text,
  discount_type text,
  discount_value numeric,
  min_order_tnd numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT pc.code, pc.discount_type, pc.discount_value, pc.min_order_tnd
  FROM public.promo_codes pc
  WHERE upper(pc.code) = upper(trim(p_code))
    AND pc.is_active = true
    AND (pc.expires_at IS NULL OR pc.expires_at > pg_catalog.now())
    AND (pc.max_uses IS NULL OR pc.used_count < pc.max_uses)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_promo_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_kronos_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_city text,
  p_postal_code text DEFAULT '',
  p_country text DEFAULT 'Tunisia',
  p_notes text DEFAULT '',
  p_items jsonb DEFAULT '[]'::jsonb,
  p_subtotal_tnd numeric DEFAULT 0,
  p_discount_tnd numeric DEFAULT 0,
  p_shipping_tnd numeric DEFAULT 0,
  p_total_tnd numeric DEFAULT 0,
  p_currency_code text DEFAULT 'TND',
  p_promo_code text DEFAULT NULL,
  p_payment_method text DEFAULT 'cash_on_delivery'
)
RETURNS TABLE (
  id uuid,
  order_number text,
  status text,
  total_tnd numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_num text;
  v_row public.orders%ROWTYPE;
BEGIN
  IF length(trim(coalesce(p_customer_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Customer full name is required';
  END IF;
  IF position('@' IN coalesce(p_customer_email, '')) <= 1 THEN
    RAISE EXCEPTION 'Valid customer email is required';
  END IF;
  IF length(trim(coalesce(p_customer_phone, ''))) < 6 THEN
    RAISE EXCEPTION 'Valid customer phone number is required';
  END IF;
  IF jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' OR jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  v_order_num := 'KRN-' || to_char(pg_catalog.now(), 'YYMMDD') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO public.orders (
    order_number, customer_name, customer_email, customer_phone,
    shipping_address, city, postal_code, country, notes,
    items, subtotal_tnd, discount_tnd, shipping_tnd, total_tnd,
    currency_code, promo_code, payment_method, status
  )
  VALUES (
    v_order_num, trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone),
    trim(p_shipping_address), coalesce(nullif(trim(p_city), ''), 'Tunis'), coalesce(p_postal_code, ''), coalesce(nullif(trim(p_country), ''), 'Tunisia'), coalesce(p_notes, ''),
    p_items, greatest(p_subtotal_tnd, 0), greatest(p_discount_tnd, 0), greatest(p_shipping_tnd, 0), greatest(p_total_tnd, 0),
    coalesce(nullif(trim(p_currency_code), ''), 'TND'), nullif(upper(trim(coalesce(p_promo_code, ''))), ''), coalesce(nullif(trim(p_payment_method), ''), 'cash_on_delivery'), 'pending'
  )
  RETURNING * INTO v_row;

  IF v_row.promo_code IS NOT NULL THEN
    UPDATE public.promo_codes
    SET used_count = used_count + 1
    WHERE upper(code) = v_row.promo_code AND is_active = true;
  END IF;

  RETURN QUERY SELECT v_row.id, v_row.order_number, v_row.status, v_row.total_tnd, v_row.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_kronos_order(text, text, text, text, text, text, text, text, jsonb, numeric, numeric, numeric, numeric, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_kronos_order(text, text, text, text, text, text, text, text, jsonb, numeric, numeric, numeric, numeric, text, text, text) TO anon, authenticated;

