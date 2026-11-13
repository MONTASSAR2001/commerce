-- ============================================================================
-- K STREETWEAR — 05_gender_outfits_and_rag_fix.sql
-- 1. Dedicated MEN & WOMEN Outfits Tables (Zero Cross-Gender Mixing)
-- 2. Strict Gender-Aware Graph RAG SQL Function (p_gender isolation)
-- 3. Sync Brand Name to 'K' in site_settings + rag_nodes
-- Safe to re-run (idempotent). Run in Supabase SQL Editor.
-- ============================================================================

-- 1. Update Remote Brand Setting to 'K' & Update Graph Brand Anchor
UPDATE public.site_settings
SET value = jsonb_set(
  jsonb_set(value, '{name}', '"K"'::jsonb),
  '{metaTitle}',
  '"K — Streetwear & Collabs"'::jsonb
)
WHERE key = 'brand';

UPDATE public.rag_nodes
SET label = 'K Streetwear Tunisia',
    search_text = 'k kronos streetwear tunisia tunis sousse sfax cash on delivery 3d lab'
WHERE id = 'brand:kronos';

-- 2. Dedicated MEN Outfits Table
CREATE TABLE IF NOT EXISTS public.men_outfits (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  style_vibe text DEFAULT 'Architectural Men Capsule',
  top_product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  bottom_product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_price_tnd numeric(10,2) NOT NULL DEFAULT 0,
  recommended_promo_code text DEFAULT 'KRONOS15',
  fit_notes text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Dedicated WOMEN Outfits Table
CREATE TABLE IF NOT EXISTS public.women_outfits (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  style_vibe text DEFAULT 'Architectural Women Capsule',
  top_product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  bottom_product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_price_tnd numeric(10,2) NOT NULL DEFAULT 0,
  recommended_promo_code text DEFAULT 'KRONOS15',
  fit_notes text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Permissions + Strict RLS (Public Read for Chatbot & Storefront, Admin-Only Write)
GRANT SELECT ON public.men_outfits, public.women_outfits TO anon, authenticated;
GRANT ALL ON public.men_outfits, public.women_outfits TO authenticated;

ALTER TABLE public.men_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.women_outfits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS men_outfits_public_select ON public.men_outfits;
CREATE POLICY men_outfits_public_select ON public.men_outfits
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS men_outfits_admin_all ON public.men_outfits;
CREATE POLICY men_outfits_admin_all ON public.men_outfits
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true));

DROP POLICY IF EXISTS women_outfits_public_select ON public.women_outfits;
CREATE POLICY women_outfits_public_select ON public.women_outfits
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS women_outfits_admin_all ON public.women_outfits;
CREATE POLICY women_outfits_admin_all ON public.women_outfits
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true));

-- 5. Seed Curated MEN Outfits strictly from gender = 'MEN' products
WITH men_tops AS (
  SELECT id, name, price, row_number() OVER (ORDER BY sort_order, id) AS rn
  FROM public.products
  WHERE upper(gender) = 'MEN' AND is_published = true AND category IN ('Jackets', 'Overshirts', 'Blazers', 'Coats', 'Hoodies')
),
men_bottoms AS (
  SELECT id, name, price, row_number() OVER (ORDER BY sort_order, id) AS rn
  FROM public.products
  WHERE upper(gender) = 'MEN' AND is_published = true AND category IN ('Jeans', 'Trousers')
),
men_pairs AS (
  SELECT
    t.rn,
    t.id AS top_id,
    t.name AS top_name,
    b.id AS bot_id,
    b.name AS bot_name,
    (coalesce(t.price, 0) + coalesce(b.price, 0)) AS total_price
  FROM men_tops t
  JOIN men_bottoms b ON b.rn = ((t.rn - 1) % GREATEST((SELECT count(*) FROM men_bottoms), 1)) + 1
  WHERE t.rn <= 6
)
INSERT INTO public.men_outfits (id, slug, title, style_vibe, top_product_id, bottom_product_id, product_ids, total_price_tnd, recommended_promo_code, fit_notes)
SELECT
  'men-outfit-' || rn,
  'men-look-' || rn,
  'MEN Look #' || rn || ': ' || top_name || ' + ' || bot_name,
  CASE WHEN total_price >= 300 THEN 'Free Shipping Architectural MEN Look' ELSE 'Clean Streetwear MEN Set' END,
  top_id,
  bot_id,
  jsonb_build_array(top_id, bot_id),
  total_price,
  CASE WHEN total_price >= 400 THEN 'BLACKFRIDAY35' ELSE 'KRONOS15' END,
  'Strictly MEN silhouettes calibrated for 3D Fitting Lab.'
FROM men_pairs
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  top_product_id = EXCLUDED.top_product_id,
  bottom_product_id = EXCLUDED.bottom_product_id,
  product_ids = EXCLUDED.product_ids,
  total_price_tnd = EXCLUDED.total_price_tnd,
  recommended_promo_code = EXCLUDED.recommended_promo_code;

-- 6. Seed Curated WOMEN Outfits strictly from gender = 'WOMEN' products
WITH women_tops AS (
  SELECT id, name, price, row_number() OVER (ORDER BY sort_order, id) AS rn
  FROM public.products
  WHERE upper(gender) = 'WOMEN' AND is_published = true AND category IN ('Jackets', 'Blazers', 'Leather', 'Knitwear', 'Tops', 'Overshirts')
),
women_bottoms AS (
  SELECT id, name, price, row_number() OVER (ORDER BY sort_order, id) AS rn
  FROM public.products
  WHERE upper(gender) = 'WOMEN' AND is_published = true AND category IN ('Jeans', 'Trousers')
),
women_pairs AS (
  SELECT
    t.rn,
    t.id AS top_id,
    t.name AS top_name,
    b.id AS bot_id,
    b.name AS bot_name,
    (coalesce(t.price, 0) + coalesce(b.price, 0)) AS total_price
  FROM women_tops t
  JOIN women_bottoms b ON b.rn = ((t.rn - 1) % GREATEST((SELECT count(*) FROM women_bottoms), 1)) + 1
  WHERE t.rn <= 6
)
INSERT INTO public.women_outfits (id, slug, title, style_vibe, top_product_id, bottom_product_id, product_ids, total_price_tnd, recommended_promo_code, fit_notes)
SELECT
  'women-outfit-' || rn,
  'women-look-' || rn,
  'WOMEN Look #' || rn || ': ' || top_name || ' + ' || bot_name,
  CASE WHEN total_price >= 300 THEN 'Free Shipping Architectural WOMEN Look' ELSE 'Elevated WOMEN Capsule' END,
  top_id,
  bot_id,
  jsonb_build_array(top_id, bot_id),
  total_price,
  CASE WHEN total_price >= 400 THEN 'BLACKFRIDAY35' ELSE 'KRONOS15' END,
  'Strictly WOMEN tailored drape calibrated for 3D Fitting Lab.'
FROM women_pairs
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  top_product_id = EXCLUDED.top_product_id,
  bottom_product_id = EXCLUDED.bottom_product_id,
  product_ids = EXCLUDED.product_ids,
  total_price_tnd = EXCLUDED.total_price_tnd,
  recommended_promo_code = EXCLUDED.recommended_promo_code;

-- 7. Gender-Isolated SQL Multi-Hop Graph RAG RPC
-- Ensures MEN queries NEVER traverse through shared material/color hubs into WOMEN nodes (and vice versa).
DROP FUNCTION IF EXISTS public.query_kronos_graph_rag(text, integer);
DROP FUNCTION IF EXISTS public.query_kronos_graph_rag(text, integer, text);

CREATE OR REPLACE FUNCTION public.query_kronos_graph_rag(
  p_query text,
  p_limit integer DEFAULT 12,
  p_gender text DEFAULT NULL
)
RETURNS TABLE (
  node_id text,
  label text,
  node_type text,
  summary text,
  hop_distance integer,
  graph_score numeric,
  via_path text,
  properties jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
DECLARE
  v_terms text[];
  v_gender text := NULLIF(upper(trim(coalesce(p_gender, ''))), '');
BEGIN
  SELECT array_agg(DISTINCT w)
  INTO v_terms
  FROM unnest(regexp_split_to_array(lower(coalesce(p_query, '')), '[^a-z0-9]+')) AS w
  WHERE length(w) >= 2;

  RETURN QUERY
  WITH seeds AS (
    SELECT
      n.id AS sid,
      n.label AS n_label,
      n.node_type AS n_type,
      n.summary AS n_summary,
      n.properties AS n_props,
      (
        n.weight
        + CASE WHEN lower(n.label) LIKE '%' || lower(trim(coalesce(p_query, ''))) || '%' THEN 5.0 ELSE 0 END
        + COALESCE((
            SELECT sum(
              CASE
                WHEN lower(n.label) LIKE '%' || t || '%' THEN 2.6
                WHEN lower(n.search_text || ' ' || n.summary) LIKE '%' || t || '%' THEN 1.3
                ELSE 0
              END
            )
            FROM unnest(coalesce(v_terms, ARRAY[]::text[])) AS t
          ), 0)
        + CASE
            WHEN v_gender IS NOT NULL AND n.node_type = 'product' AND upper(coalesce(n.properties->>'gender', '')) = v_gender THEN 4.5
            ELSE 0
          END
      )::numeric AS base_score
    FROM public.rag_nodes n
    WHERE n.is_active = true
      AND (
        v_gender IS NULL
        OR n.node_type <> 'product'
        OR upper(coalesce(n.properties->>'gender', '')) = v_gender
      )
      AND (
        v_gender IS NULL
        OR n.node_type <> 'collection'
        OR upper(coalesce(n.properties->>'gender', '')) = ''
        OR upper(coalesce(n.properties->>'gender', '')) = v_gender
      )
      AND (
        array_length(v_terms, 1) IS NULL
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(v_terms, ARRAY[]::text[])) AS t
          WHERE lower(n.search_text || ' ' || n.label || ' ' || n.summary) LIKE '%' || t || '%'
        )
      )
    ORDER BY base_score DESC
    LIMIT 6
  ),
  hop1 AS (
    SELECT
      nb.id AS nid,
      nb.label AS n_label,
      nb.node_type AS n_type,
      nb.summary AS n_summary,
      nb.properties AS n_props,
      1 AS hop,
      (s.base_score * 0.68 * e.weight)::numeric AS gscore,
      (s.n_label || ' --[' || e.relation || ']--> ' || nb.label) AS vpath
    FROM seeds s
    JOIN public.rag_edges e ON (e.source_id = s.sid OR e.target_id = s.sid) AND e.is_active = true
    JOIN public.rag_nodes nb ON nb.id = CASE WHEN e.source_id = s.sid THEN e.target_id ELSE e.source_id END
    WHERE nb.is_active = true
      AND nb.id <> s.sid
      AND (
        v_gender IS NULL
        OR nb.node_type <> 'product'
        OR upper(coalesce(nb.properties->>'gender', '')) = v_gender
      )
  ),
  combined AS (
    SELECT sid AS nid, n_label, n_type, n_summary, n_props, 0 AS hop, base_score AS gscore, n_label AS vpath FROM seeds
    UNION ALL
    SELECT nid, n_label, n_type, n_summary, n_props, hop, gscore, vpath FROM hop1
  ),
  deduped AS (
    SELECT DISTINCT ON (nid)
      nid, n_label, n_type, n_summary, n_props, hop, gscore, vpath
    FROM combined
    ORDER BY nid, gscore DESC, hop ASC
  )
  SELECT
    d.nid AS node_id,
    d.n_label AS label,
    d.n_type AS node_type,
    d.n_summary AS summary,
    d.hop AS hop_distance,
    round(d.gscore, 3) AS graph_score,
    d.vpath AS via_path,
    d.n_props AS properties
  FROM deduped d
  ORDER BY d.gscore DESC
  LIMIT GREATEST(1, LEAST(coalesce(p_limit, 12), 40));
END;
$$;

REVOKE ALL ON FUNCTION public.query_kronos_graph_rag(text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.query_kronos_graph_rag(text, integer, text) TO anon, authenticated;
