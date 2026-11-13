-- ============================================================================
-- KRONOS STREETWEAR — 02_storage_and_rls.sql
-- Row Level Security (RLS), Role Grants, and Supabase Storage Buckets
-- Follows Supabase & Postgres Security Best Practices:
--   • (SELECT auth.uid()) caching in policies
--   • Explicit TO anon / TO authenticated targets (never deprecated auth.role())
--   • Both USING and WITH CHECK on UPDATE policies
--   • Storage INSERT + SELECT + UPDATE granted on admin-managed buckets for upserts
-- ============================================================================

-- ── 1. Schema & Table Privileges ─────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;

GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.site_settings TO authenticated;

GRANT SELECT ON TABLE public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.media_assets TO authenticated;

GRANT SELECT ON TABLE public.promo_codes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.promo_codes TO authenticated;

-- Orders: storefront customers (anon/authenticated) place orders via INSERT or submit_kronos_order RPC;
-- SELECT / UPDATE / DELETE on orders is strictly restricted to admins (never expose customer emails/phones).
GRANT INSERT ON TABLE public.orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.orders TO authenticated;

GRANT INSERT ON TABLE public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.newsletter_subscribers TO authenticated;

GRANT SELECT, INSERT ON TABLE public.admin_audit_logs TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.admin_profiles TO authenticated;

-- ── 2. Enable Row Level Security Across All Tables ───────────────────────────
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ── 3. Admin Profiles Policies (Own Row Lookup Avoids RLS Recursion) ─────────
DROP POLICY IF EXISTS admin_profiles_self_select ON public.admin_profiles;
CREATE POLICY admin_profiles_self_select ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS admin_profiles_self_update ON public.admin_profiles;
CREATE POLICY admin_profiles_self_update ON public.admin_profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- ── 4. Products Policies (Public Read Published, Admin Full CRUD) ─────────────
DROP POLICY IF EXISTS products_public_read ON public.products;
CREATE POLICY products_public_read ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS products_admin_insert ON public.products;
CREATE POLICY products_admin_insert ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS products_admin_update ON public.products;
CREATE POLICY products_admin_update ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS products_admin_delete ON public.products;
CREATE POLICY products_admin_delete ON public.products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

-- ── 5. Site Settings Policies (Public Read Store Config, Admin Full Write) ───
DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS site_settings_admin_insert ON public.site_settings;
CREATE POLICY site_settings_admin_insert ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS site_settings_admin_update ON public.site_settings;
CREATE POLICY site_settings_admin_update ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS site_settings_admin_delete ON public.site_settings;
CREATE POLICY site_settings_admin_delete ON public.site_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

-- ── 6. Media Assets Registry Policies ────────────────────────────────────────
DROP POLICY IF EXISTS media_assets_public_read ON public.media_assets;
CREATE POLICY media_assets_public_read ON public.media_assets
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS media_assets_admin_insert ON public.media_assets;
CREATE POLICY media_assets_admin_insert ON public.media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS media_assets_admin_update ON public.media_assets;
CREATE POLICY media_assets_admin_update ON public.media_assets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS media_assets_admin_delete ON public.media_assets;
CREATE POLICY media_assets_admin_delete ON public.media_assets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

-- ── 7. Promo Codes Policies ──────────────────────────────────────────────────
DROP POLICY IF EXISTS promo_codes_read ON public.promo_codes;
CREATE POLICY promo_codes_read ON public.promo_codes
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS promo_codes_admin_insert ON public.promo_codes;
CREATE POLICY promo_codes_admin_insert ON public.promo_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS promo_codes_admin_update ON public.promo_codes;
CREATE POLICY promo_codes_admin_update ON public.promo_codes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS promo_codes_admin_delete ON public.promo_codes;
CREATE POLICY promo_codes_admin_delete ON public.promo_codes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

-- ── 8. Customer Commandes (Orders) Policies ──────────────────────────────────
-- Storefront customers can insert new pending orders; only admins can view/update/delete orders.
DROP POLICY IF EXISTS orders_customer_insert ON public.orders;
CREATE POLICY orders_customer_insert ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND total_tnd >= 0
    AND length(trim(customer_name)) >= 2
    AND position('@' IN customer_email) > 1
    AND length(trim(customer_phone)) >= 6
  );

DROP POLICY IF EXISTS orders_admin_select ON public.orders;
CREATE POLICY orders_admin_select ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS orders_admin_update ON public.orders;
CREATE POLICY orders_admin_update ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS orders_admin_delete ON public.orders;
CREATE POLICY orders_admin_delete ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

-- ── 9. Newsletter Subscribers & Audit Logs Policies ──────────────────────────
DROP POLICY IF EXISTS newsletter_public_insert ON public.newsletter_subscribers;
CREATE POLICY newsletter_public_insert ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (position('@' IN email) > 1);

DROP POLICY IF EXISTS newsletter_admin_select ON public.newsletter_subscribers;
CREATE POLICY newsletter_admin_select ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS newsletter_admin_delete ON public.newsletter_subscribers;
CREATE POLICY newsletter_admin_delete ON public.newsletter_subscribers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS audit_logs_admin_select ON public.admin_audit_logs;
CREATE POLICY audit_logs_admin_select ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS audit_logs_admin_insert ON public.admin_audit_logs;
CREATE POLICY audit_logs_admin_insert ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

-- ── 10. Supabase Storage Buckets (Images, Videos, Documents) ─────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'kronos-images',
    'kronos-images',
    true,
    15728640, -- 15 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml']
  ),
  (
    'kronos-videos',
    'kronos-videos',
    true,
    104857600, -- 100 MB
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
  ),
  (
    'kronos-documents',
    'kronos-documents',
    true,
    26214400, -- 25 MB
    ARRAY['application/pdf', 'text/plain', 'text/csv', 'application/json', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Object RLS: Public Read for Storefront Media; Admin Full CRUD (including SELECT+UPDATE for upsert)
DROP POLICY IF EXISTS kronos_storage_public_read ON storage.objects;
CREATE POLICY kronos_storage_public_read ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('kronos-images', 'kronos-videos', 'kronos-documents'));

DROP POLICY IF EXISTS kronos_storage_admin_insert ON storage.objects;
CREATE POLICY kronos_storage_admin_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('kronos-images', 'kronos-videos', 'kronos-documents')
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS kronos_storage_admin_update ON storage.objects;
CREATE POLICY kronos_storage_admin_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('kronos-images', 'kronos-videos', 'kronos-documents')
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  )
  WITH CHECK (
    bucket_id IN ('kronos-images', 'kronos-videos', 'kronos-documents')
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS kronos_storage_admin_delete ON storage.objects;
CREATE POLICY kronos_storage_admin_delete ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('kronos-images', 'kronos-videos', 'kronos-documents')
    AND EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

-- ── 12. Auto-Promote Designated Superadmin Account (if registered in auth.users) ─
INSERT INTO public.admin_profiles (id, email, full_name, role, is_active)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Montassar Zarai'),
  'superadmin',
  true
FROM auth.users
WHERE lower(email) = lower('montassarzarai0@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = 'superadmin',
  is_active = true;

