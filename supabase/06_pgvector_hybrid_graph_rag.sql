-- ============================================================================
-- K STREETWEAR — 06_pgvector_hybrid_graph_rag.sql
-- Production Supabase pgvector (HNSW) + Full-Text + 2-Hop Graph RAG Upgrade
-- Fixes RPC column ambiguity (42702), seeds ALL catalog products/outfits/promos/
-- stores/FAQs into rag_nodes + rag_edges with 384-dim vectors, and exposes
-- query_kronos_pgvector_graph_rag + get_kronos_catalog_stats.
-- Safe to run multiple times (100% idempotent). Run in Supabase SQL Editor.
-- ============================================================================

-- 1. Enable pgvector in the standard Supabase extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Add 384-dim pgvector column & HNSW cosine index to public.rag_nodes
ALTER TABLE public.rag_nodes
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(384);

CREATE INDEX IF NOT EXISTS rag_nodes_embedding_hnsw_idx
  ON public.rag_nodes
  USING hnsw (embedding extensions.vector_cosine_ops);

-- 3. Deterministic 384-dim Multilingual Semantic + Subword Hash Embedder
-- Mirrored bit-for-bit in src/lib/semanticVectorEngine.js (computeSemanticEmbedding384).
CREATE OR REPLACE FUNCTION public.kronos_stable_hash(p_text text)
RETURNS bigint
LANGUAGE plpgsql
IMMUTABLE STRICT
SET search_path = public
AS $$
DECLARE
  v_hash bigint := 5381;
  v_len integer := char_length(p_text);
  v_i integer := 1;
BEGIN
  WHILE v_i <= v_len LOOP
    v_hash := (v_hash * 33 + ascii(substr(p_text, v_i, 1))) % 2147483647;
    v_i := v_i + 1;
  END LOOP;
  RETURN v_hash;
END;
$$;

CREATE OR REPLACE FUNCTION public.kronos_semantic_embed(p_text text)
RETURNS extensions.vector(384)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, extensions
AS $$
DECLARE
  v_raw text := lower(trim(coalesce(p_text, '')));
  v_arr double precision[] := array_fill(0.0::double precision, ARRAY[384]);
  v_words text[];
  v_w text;
  v_tri text;
  v_h bigint;
  v_bucket integer;
  v_sign double precision;
  v_norm double precision := 0.0;
  v_i integer;
  v_j integer;
  v_c_regex text[] := ARRAY[
    '\m(jacket|jackets|bomber|coat|trench|blazer|blouson|veste|manteau|parka)\M|(جاكيت|سترة|معطف|بليزر)',
    '\m(leather|suede|faux|nappa|cuir|daim)\M|(جلد|شامواه)',
    '\m(jeans|denim|baggy|wide|slim|flared|relaxed|straight|cargo|trousers|pants|pantalon)\M|(جينز|دجينز|بنطلون|سروال|كارجو)',
    '\m(overshirt|shirt|tee|top|blouse|chemise|surchemise|tshirt)\M|(قميص|بلوزة|تيشيرت)',
    '\m(knit|knitwear|jumper|sweater|cardigan|pull|maille|hoodie|sweat|sweatshirt|fleece)\M|(كنزة|صوف|هودي|تريكو)',
    '\m(shoe|shoes|boot|boots|loafer|loafers|flats|ballet|sneaker|chaussure|mocassin|bottes)\M|(حذاء|أحذية|بوت)',
    '\m(bag|bags|handbag|crossbody|tote|backpack|wallet|accessory|sac|sacoche|pochette)\M|(حقيبة|شنطة|اكسسوار)',
    '\m(men|mens|man|male|homme|hommes|guy|guys)\M|(رجال|رجالي|رجالية|رجل)',
    '\m(women|womens|woman|female|femme|femmes|lady|ladies)\M|(نساء|نسائي|نسائية|امرأة)',
    '\m(outfit|outfits|look|looks|styling|pair|pairing|combo|ensemble|tenue|assortir)\M|(إطلالة|طقم|تنسيق|ملابس)',
    '\m(promo|discount|code|coupon|sale|offer|off|réduction|reduction|soldes)\M|(خصم|تخفيض|كود)',
    '\m(ship|shipping|deliver|delivery|express|courier|free|livraison|gratuite|offerte)\M|(شحن|توصيل|مجاني|سريع)',
    '\m(tunis|tunisia|sousse|sfax|tunisie|store|stores|shop|address|hours|boutique)\M|(تونس|سوسة|صفاقس|متجر|فرع|عنوان)',
    '\m(3d|fit|fitting|size|sizing|virtual|mannequin|try|measurements|taille|coupe|essayage|mesure)\M|(قياس|مقاس|مختبر)',
    '\m(return|returns|refund|exchange|warranty|authenticity|nfc|retour|échange|remboursement)\M|(استرجاع|استبدال|إرجاع|أصلي)',
    '\m(black|noir|dark|charcoal|ebony)\M|أسود|داكن',
    '\m(white|cream|ivory|ecru|beige|tan|khaki|sand|camel)\M|أبيض|بيج|كريمي|جملي',
    '\m(blue|navy|indigo|sky|cobalt)\M|أزرق|كحلي',
    '\m(brown|chocolate|espresso|rust|burgundy|olive|green)\M|بني|أخضر|زيتي',
    '\m(cotton|wool|denim|nylon|viscose|fabric|material|matière|coton|laine)\M|(قطن|قماش|خامة)',
    '\m(drop|capsule|nova|vero|luna|limited|edition|new|collection|nouveauté)\M|(إصدار|مجموعة|جديد)',
    '\m(how many|count|total|all|catalog|catalogue|items|pieces|clothes|combien|nombre|tout)\M|(كم|عدد|إجمالي|كل|قطع)',
    '\m(price|cost|budget|cheap|affordable|under|below|expensive|lux|prix|coût|moins de|dt|tnd)\M|(سعر|ثمن|تكلفة|أرخص|دينار)',
    '\m(order|orders|track|tracking|status|krn|commande|suivi)\M|(طلب|تتبع|شحنة)'
  ];
  v_c_weights double precision[] := ARRAY[
    2.2, 2.2, 2.2, 2.0, 2.0, 2.1, 2.0, 2.6, 2.6, 2.0, 2.2, 2.2,
    2.1, 2.1, 2.0, 1.7, 1.7, 1.7, 1.7, 1.7, 1.8, 2.1, 1.9, 2.0
  ];
BEGIN
  IF v_raw = '' THEN
    v_arr[1] := 1.0;
    RETURN v_arr::extensions.vector(384);
  END IF;

  -- Band 1 (dims 1..48 in 1-indexed Postgres array): Concept alignment
  FOR v_i IN 1..24 LOOP
    IF v_raw ~* v_c_regex[v_i] THEN
      v_arr[v_i] := v_arr[v_i] + v_c_weights[v_i];
      v_arr[v_i + 24] := v_arr[v_i + 24] + v_c_weights[v_i] * 0.65;
    END IF;
  END LOOP;

  -- Band 2 (dims 65..384): Token & trigram feature hashing
  v_words := regexp_split_to_array(regexp_replace(v_raw, '[^a-z0-9\u0600-\u06FF\s-]+', ' ', 'g'), '\s+');
  IF coalesce(array_length(v_words, 1), 0) > 0 THEN
    FOR v_i IN 1..array_length(v_words, 1) LOOP
      v_w := v_words[v_i];
      IF length(v_w) >= 2 THEN
        v_h := public.kronos_stable_hash('w:' || v_w);
        v_bucket := 65 + (v_h % 320)::integer;
        v_sign := CASE WHEN (v_h % 2) = 0 THEN 1.0 ELSE -1.0 END;
        v_arr[v_bucket] := v_arr[v_bucket] + v_sign * (CASE WHEN length(v_w) >= 5 THEN 1.2 ELSE 0.85 END);

        IF length(v_w) >= 4 THEN
          FOR v_j IN 1..(length(v_w) - 2) LOOP
            v_tri := substr(v_w, v_j, 3);
            v_h := public.kronos_stable_hash('g:' || v_tri);
            v_bucket := 65 + (v_h % 320)::integer;
            v_sign := CASE WHEN (v_h % 2) = 0 THEN 1.0 ELSE -1.0 END;
            v_arr[v_bucket] := v_arr[v_bucket] + v_sign * 0.35;
          END LOOP;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- L2 Normalize
  FOR v_i IN 1..384 LOOP
    v_norm := v_norm + (v_arr[v_i] * v_arr[v_i]);
  END LOOP;
  v_norm := sqrt(v_norm);
  IF v_norm <= 0.0 THEN
    v_arr[1] := 1.0;
    RETURN v_arr::extensions.vector(384);
  END IF;
  FOR v_i IN 1..384 LOOP
    v_arr[v_i] := round((v_arr[v_i] / v_norm)::numeric, 6)::double precision;
  END LOOP;

  RETURN v_arr::extensions.vector(384);
END;
$$;

-- 4. Auto-embed trigger on public.rag_nodes whenever a node is inserted or updated without an explicit vector
CREATE OR REPLACE FUNCTION public.trg_fn_rag_nodes_embed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.embedding IS NULL
     OR (TG_OP = 'UPDATE' AND (NEW.label IS DISTINCT FROM OLD.label OR NEW.summary IS DISTINCT FROM OLD.summary OR NEW.search_text IS DISTINCT FROM OLD.search_text) AND NEW.embedding IS NOT DISTINCT FROM OLD.embedding)
  THEN
    NEW.embedding := public.kronos_semantic_embed(
      coalesce(NEW.label, '') || ' ' || coalesce(NEW.summary, '') || ' ' || coalesce(NEW.search_text, '')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rag_nodes_auto_embed ON public.rag_nodes;
CREATE TRIGGER trg_rag_nodes_auto_embed
  BEFORE INSERT OR UPDATE ON public.rag_nodes
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_rag_nodes_embed();

-- 5. Backfill ALL live Catalog Products, Outfits, Categories, Promos, Stores, FAQs & Drops into rag_nodes + rag_edges + pgvector embeddings
-- Upsert Brand Anchor
INSERT INTO public.rag_nodes (id, label, node_type, summary, search_text, weight, is_active)
VALUES (
  'brand:kronos',
  'K Streetwear Tunisia',
  'brand',
  'K — Unfiltered Architectural Streetwear Tunisia. 24-48h Delivery, Cash on Delivery, 3D Anatomical Fitting Lab, MEN & WOMEN collections.',
  'k kronos streetwear tunisia tunis sousse sfax cash on delivery 3d fitting lab men women clothing',
  2.0,
  true
)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  summary = EXCLUDED.summary,
  search_text = EXCLUDED.search_text,
  weight = EXCLUDED.weight,
  is_active = true;

-- Upsert All Published Products as rag_nodes
INSERT INTO public.rag_nodes (id, label, node_type, summary, properties, search_text, weight, is_active)
SELECT
  'product:' || p.id,
  p.name,
  'product',
  p.name || ' (' || upper(p.gender) || ' ' || p.category || ') — ' || p.price || ' DT'
    || CASE WHEN p.original_price IS NOT NULL AND p.original_price > p.price THEN ' (was ' || p.original_price || ' DT, ' || coalesce(p.discount, 'SALE') || ')' ELSE '' END
    || '. Fabric: ' || coalesce(p.composition, '100% Cotton') || '. ' || coalesce(p.description, ''),
  jsonb_build_object(
    'productId', p.id,
    'slug', p.slug,
    'price', p.price,
    'originalPrice', p.original_price,
    'gender', upper(p.gender),
    'category', p.category,
    'img', p.img,
    'colors', p.colors,
    'sizes', p.sizes
  ),
  lower(p.name || ' ' || p.category || ' ' || p.gender || ' ' || coalesce(p.colors::text, '') || ' ' || coalesce(p.composition, '') || ' ' || coalesce(p.description, '') || ' ' || p.price || ' dt clothes garment'),
  CASE WHEN p.badge IS NOT NULL AND p.badge <> '' THEN 1.45 ELSE 1.15 END,
  true
FROM public.products p
WHERE p.is_published = true
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  summary = EXCLUDED.summary,
  properties = EXCLUDED.properties,
  search_text = EXCLUDED.search_text,
  weight = EXCLUDED.weight,
  is_active = true;

-- Upsert Category Nodes
INSERT INTO public.rag_nodes (id, label, node_type, summary, search_text, weight, is_active)
SELECT DISTINCT ON (cat_id)
  cat_id,
  p_cat || ' Category',
  'category',
  p_cat || ' garments available across MEN and WOMEN collections at K Tunisia.',
  lower(p_cat || ' category garments clothes items men women'),
  1.30,
  true
FROM (
  SELECT DISTINCT
    'cat:' || lower(regexp_replace(category, '[^a-z0-9]+', '-', 'gi')) AS cat_id,
    category AS p_cat
  FROM public.products
  WHERE is_published = true
) cats
ON CONFLICT (id) DO UPDATE SET
  summary = EXCLUDED.summary,
  search_text = EXCLUDED.search_text,
  is_active = true;

-- Upsert Promo Code Nodes
INSERT INTO public.rag_nodes (id, label, node_type, summary, properties, search_text, weight, is_active)
SELECT
  'promo:' || lower(regexp_replace(pc.code, '[^a-z0-9]+', '-', 'gi')),
  'Promo ' || pc.code || ' (' || CASE WHEN pc.discount_type = 'percentage' THEN pc.discount_value::text || '% OFF' ELSE pc.discount_value::text || ' DT OFF' END || ')',
  'promo',
  'Active promo code ' || pc.code || ': ' || CASE WHEN pc.discount_type = 'percentage' THEN pc.discount_value::text || '% OFF' ELSE pc.discount_value::text || ' DT OFF' END || '. ' || coalesce(pc.description, '') || ' Min order: ' || pc.min_order_tnd || ' DT.',
  jsonb_build_object('code', pc.code, 'discountType', pc.discount_type, 'discountValue', pc.discount_value, 'minOrderTnd', pc.min_order_tnd),
  lower('promo code discount coupon sale ' || pc.code || ' ' || coalesce(pc.description, '')),
  1.65,
  pc.is_active
FROM public.promo_codes pc
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  summary = EXCLUDED.summary,
  properties = EXCLUDED.properties,
  search_text = EXCLUDED.search_text,
  is_active = EXCLUDED.is_active;

-- Upsert MEN Outfits & WOMEN Outfits Nodes
INSERT INTO public.rag_nodes (id, label, node_type, summary, properties, search_text, weight, is_active)
SELECT
  'outfit:' || mo.id,
  mo.title,
  'collection',
  mo.title || ' — Complete MEN 2-piece capsule (' || mo.total_price_tnd || ' DT, Promo ' || coalesce(mo.recommended_promo_code, 'KRONOS15') || '). ' || coalesce(mo.fit_notes, ''),
  jsonb_build_object('gender', 'MEN', 'isOutfit', true, 'productIds', mo.product_ids, 'totalPrice', mo.total_price_tnd),
  lower('men outfit look ensemble ' || mo.title || ' ' || coalesce(mo.style_vibe, '')),
  1.55,
  mo.is_active
FROM public.men_outfits mo
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  summary = EXCLUDED.summary,
  properties = EXCLUDED.properties,
  search_text = EXCLUDED.search_text,
  is_active = EXCLUDED.is_active;

INSERT INTO public.rag_nodes (id, label, node_type, summary, properties, search_text, weight, is_active)
SELECT
  'outfit:' || wo.id,
  wo.title,
  'collection',
  wo.title || ' — Complete WOMEN 2-piece capsule (' || wo.total_price_tnd || ' DT, Promo ' || coalesce(wo.recommended_promo_code, 'KRONOS15') || '). ' || coalesce(wo.fit_notes, ''),
  jsonb_build_object('gender', 'WOMEN', 'isOutfit', true, 'productIds', wo.product_ids, 'totalPrice', wo.total_price_tnd),
  lower('women outfit look ensemble ' || wo.title || ' ' || coalesce(wo.style_vibe, '')),
  1.55,
  wo.is_active
FROM public.women_outfits wo
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  summary = EXCLUDED.summary,
  properties = EXCLUDED.properties,
  search_text = EXCLUDED.search_text,
  is_active = EXCLUDED.is_active;

-- Upsert Store Locations & FAQs stored inside public.site_settings
INSERT INTO public.rag_nodes (id, label, node_type, summary, properties, search_text, weight, is_active)
SELECT DISTINCT ON (st_id)
  st_id,
  st_label,
  'store',
  st_summary,
  st_props,
  st_search,
  1.45,
  true
FROM (
  SELECT
    'store:' || lower(regexp_replace(coalesce(st->>'id', st->>'city', substr(md5(st::text), 1, 8)), '[^a-z0-9]+', '-', 'gi')) AS st_id,
    coalesce(st->>'name', 'K Store') || ' (' || coalesce(st->>'city', 'Tunisia') || ')' AS st_label,
    coalesce(st->>'name', 'K Store') || ' in ' || coalesce(st->>'city', 'Tunisia') || ': ' || coalesce(st->>'address', '') || '. Hours: ' || coalesce(st->>'hours', '') || '. Phone: ' || coalesce(st->>'phone', '') AS st_summary,
    st AS st_props,
    lower(coalesce(st->>'name', '') || ' ' || coalesce(st->>'city', '') || ' ' || coalesce(st->>'address', '') || ' boutique store location tunisia') AS st_search
  FROM public.site_settings ss,
    jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(ss.value) = 'array' THEN ss.value
        WHEN jsonb_typeof(ss.value->'items') = 'array' THEN ss.value->'items'
        ELSE '[]'::jsonb
      END
    ) AS st
  WHERE ss.key = 'stores'
) stores_sub
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  summary = EXCLUDED.summary,
  properties = EXCLUDED.properties,
  search_text = EXCLUDED.search_text,
  is_active = true;

INSERT INTO public.rag_nodes (id, label, node_type, summary, search_text, weight, is_active)
SELECT DISTINCT ON (fq_id)
  fq_id,
  fq_label,
  'faq',
  fq_summary,
  fq_search,
  1.35,
  true
FROM (
  SELECT
    'faq:' || coalesce(nullif(lower(regexp_replace(coalesce(fq->>'id', ''), '[^a-z0-9]+', '-', 'gi')), ''), substr(md5(fq::text), 1, 12)) AS fq_id,
    coalesce(fq->>'q', fq->>'question', 'Customer FAQ') AS fq_label,
    coalesce(fq->>'a', fq->>'answer', '') AS fq_summary,
    lower(coalesce(fq->>'q', fq->>'question', '') || ' ' || coalesce(fq->>'a', fq->>'answer', '')) AS fq_search
  FROM public.site_settings ss,
    jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(ss.value) = 'array' THEN ss.value
        WHEN jsonb_typeof(ss.value->'items') = 'array' THEN ss.value->'items'
        ELSE '[]'::jsonb
      END
    ) AS fq
  WHERE ss.key = 'faqs'
) faqs_sub
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  summary = EXCLUDED.summary,
  search_text = EXCLUDED.search_text,
  is_active = true;

-- Build Knowledge Graph Edges in Postgres (Products -> Categories, Outfits -> Products, Promos -> Brand)
INSERT INTO public.rag_edges (id, source_id, target_id, relation, weight, evidence, is_active)
SELECT
  'product:' || p.id || '__IN_CATEGORY__cat:' || lower(regexp_replace(p.category, '[^a-z0-9]+', '-', 'gi')),
  'product:' || p.id,
  'cat:' || lower(regexp_replace(p.category, '[^a-z0-9]+', '-', 'gi')),
  'IN_CATEGORY',
  1.3,
  p.category,
  true
FROM public.products p
WHERE p.is_published = true
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.rag_edges (id, source_id, target_id, relation, weight, evidence, is_active)
SELECT
  'outfit:' || o.id || '__OUTFIT_INCLUDES__product:' || pid,
  'outfit:' || o.id,
  'product:' || pid,
  'OUTFIT_INCLUDES',
  1.5,
  o.title,
  true
FROM (
  SELECT id, title, top_product_id AS pid FROM public.men_outfits WHERE top_product_id IS NOT NULL
  UNION ALL
  SELECT id, title, bottom_product_id AS pid FROM public.men_outfits WHERE bottom_product_id IS NOT NULL
  UNION ALL
  SELECT id, title, top_product_id AS pid FROM public.women_outfits WHERE top_product_id IS NOT NULL
  UNION ALL
  SELECT id, title, bottom_product_id AS pid FROM public.women_outfits WHERE bottom_product_id IS NOT NULL
) o
WHERE EXISTS (SELECT 1 FROM public.rag_nodes rn WHERE rn.id = 'product:' || o.pid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.rag_edges (id, source_id, target_id, relation, weight, evidence, is_active)
SELECT
  'product:' || mo.top_product_id || '__PAIRS_WELL_WITH__product:' || mo.bottom_product_id,
  'product:' || mo.top_product_id,
  'product:' || mo.bottom_product_id,
  'PAIRS_WELL_WITH',
  1.35,
  'Curated MEN capsule pairing',
  true
FROM public.men_outfits mo
WHERE mo.top_product_id IS NOT NULL
  AND mo.bottom_product_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.rag_nodes WHERE id = 'product:' || mo.top_product_id)
  AND EXISTS (SELECT 1 FROM public.rag_nodes WHERE id = 'product:' || mo.bottom_product_id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.rag_edges (id, source_id, target_id, relation, weight, evidence, is_active)
SELECT
  'product:' || wo.top_product_id || '__PAIRS_WELL_WITH__product:' || wo.bottom_product_id,
  'product:' || wo.top_product_id,
  'product:' || wo.bottom_product_id,
  'PAIRS_WELL_WITH',
  1.35,
  'Curated WOMEN capsule pairing',
  true
FROM public.women_outfits wo
WHERE wo.top_product_id IS NOT NULL
  AND wo.bottom_product_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.rag_nodes WHERE id = 'product:' || wo.top_product_id)
  AND EXISTS (SELECT 1 FROM public.rag_nodes WHERE id = 'product:' || wo.bottom_product_id)
ON CONFLICT (id) DO NOTHING;

-- Backfill vector(384) embeddings on ALL active rag_nodes
UPDATE public.rag_nodes
SET embedding = public.kronos_semantic_embed(
  coalesce(label, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(search_text, '')
)
WHERE is_active = true;

-- 6. Keep public.rag_nodes automatically in sync whenever Admin inserts/updates/deletes products
CREATE OR REPLACE FUNCTION public.trg_fn_products_sync_rag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.rag_nodes WHERE id = 'product:' || OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.rag_nodes (id, label, node_type, summary, properties, search_text, weight, is_active)
  VALUES (
    'product:' || NEW.id,
    NEW.name,
    'product',
    NEW.name || ' (' || upper(NEW.gender) || ' ' || NEW.category || ') — ' || NEW.price || ' DT. Fabric: ' || coalesce(NEW.composition, '100% Cotton') || '. ' || coalesce(NEW.description, ''),
    jsonb_build_object(
      'productId', NEW.id,
      'slug', NEW.slug,
      'price', NEW.price,
      'originalPrice', NEW.original_price,
      'gender', upper(NEW.gender),
      'category', NEW.category,
      'img', NEW.img,
      'colors', NEW.colors,
      'sizes', NEW.sizes
    ),
    lower(NEW.name || ' ' || NEW.category || ' ' || NEW.gender || ' ' || coalesce(NEW.colors::text, '') || ' ' || coalesce(NEW.composition, '') || ' ' || coalesce(NEW.description, '') || ' ' || NEW.price || ' dt clothes garment'),
    CASE WHEN NEW.badge IS NOT NULL AND NEW.badge <> '' THEN 1.45 ELSE 1.15 END,
    NEW.is_published
  )
  ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    summary = EXCLUDED.summary,
    properties = EXCLUDED.properties,
    search_text = EXCLUDED.search_text,
    weight = EXCLUDED.weight,
    is_active = EXCLUDED.is_active,
    embedding = public.kronos_semantic_embed(
      EXCLUDED.label || ' ' || EXCLUDED.summary || ' ' || EXCLUDED.search_text
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_sync_rag_node ON public.products;
CREATE TRIGGER trg_products_sync_rag_node
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_products_sync_rag();

-- 7. Live Public Catalog Statistics RPC (Always gives exact MEN / WOMEN / Total / Category / Price facts)
CREATE OR REPLACE FUNCTION public.get_kronos_catalog_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH pub AS (
    SELECT id, upper(gender) AS g, category, price, original_price
    FROM public.products
    WHERE is_published = true
  ),
  men_cats AS (
    SELECT jsonb_object_agg(category, cnt) AS obj
    FROM (SELECT category, count(*)::int AS cnt FROM pub WHERE g = 'MEN' GROUP BY category ORDER BY cnt DESC, category) s
  ),
  women_cats AS (
    SELECT jsonb_object_agg(category, cnt) AS obj
    FROM (SELECT category, count(*)::int AS cnt FROM pub WHERE g = 'WOMEN' GROUP BY category ORDER BY cnt DESC, category) s
  )
  SELECT jsonb_build_object(
    'total_products', (SELECT count(*)::int FROM pub),
    'men_count', (SELECT count(*)::int FROM pub WHERE g = 'MEN'),
    'women_count', (SELECT count(*)::int FROM pub WHERE g = 'WOMEN'),
    'on_sale_count', (SELECT count(*)::int FROM pub WHERE original_price IS NOT NULL AND original_price > price),
    'min_price_tnd', coalesce((SELECT min(price) FROM pub), 0),
    'max_price_tnd', coalesce((SELECT max(price) FROM pub), 0),
    'men_categories', coalesce((SELECT obj FROM men_cats), '{}'::jsonb),
    'women_categories', coalesce((SELECT obj FROM women_cats), '{}'::jsonb)
  );
$$;

-- 8. Hybrid pgvector Cosine HNSW + FTS + 2-Hop Graph RAG Retrieval RPC
DROP FUNCTION IF EXISTS public.query_kronos_graph_rag(text, integer);
DROP FUNCTION IF EXISTS public.query_kronos_graph_rag(text, integer, text);
DROP FUNCTION IF EXISTS public.query_kronos_pgvector_graph_rag(text, extensions.vector, integer, text);

CREATE OR REPLACE FUNCTION public.query_kronos_pgvector_graph_rag(
  p_query text,
  p_query_embedding extensions.vector(384) DEFAULT NULL,
  p_limit integer DEFAULT 16,
  p_gender text DEFAULT NULL
)
RETURNS TABLE (
  node_id text,
  node_label text,
  node_type text,
  node_summary text,
  hop_distance integer,
  vector_score numeric,
  graph_score numeric,
  via_path text,
  node_properties jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH params AS (
    SELECT
      NULLIF(upper(trim(coalesce(p_gender, ''))), '') AS target_gender,
      coalesce(p_query_embedding, public.kronos_semantic_embed(p_query)) AS qvec,
      websearch_to_tsquery('english', coalesce(nullif(trim(p_query), ''), 'kronos')) AS ts_q,
      lower(trim(coalesce(p_query, ''))) AS q_lower
  ),
  vec_ranked AS (
    SELECT
      rn.id,
      GREATEST(0.0, 1.0 - (rn.embedding <=> p.qvec)) AS cos_sim,
      row_number() OVER (ORDER BY rn.embedding <=> p.qvec ASC) AS r_vec
    FROM public.rag_nodes rn
    CROSS JOIN params p
    WHERE rn.is_active = true
      AND rn.embedding IS NOT NULL
      AND (
        p.target_gender IS NULL
        OR rn.node_type <> 'product'
        OR upper(coalesce(rn.properties->>'gender', '')) = p.target_gender
      )
      AND (
        p.target_gender IS NULL
        OR rn.node_type <> 'collection'
        OR coalesce(rn.properties->>'gender', '') = ''
        OR upper(coalesce(rn.properties->>'gender', '')) = p.target_gender
      )
    ORDER BY rn.embedding <=> p.qvec ASC
    LIMIT 36
  ),
  fts_ranked AS (
    SELECT
      rn.id,
      ts_rank_cd(
        to_tsvector('english', coalesce(rn.label, '') || ' ' || coalesce(rn.summary, '') || ' ' || coalesce(rn.search_text, '')),
        p.ts_q
      ) AS fts_val,
      row_number() OVER (
        ORDER BY ts_rank_cd(
          to_tsvector('english', coalesce(rn.label, '') || ' ' || coalesce(rn.summary, '') || ' ' || coalesce(rn.search_text, '')),
          p.ts_q
        ) DESC
      ) AS r_fts
    FROM public.rag_nodes rn
    CROSS JOIN params p
    WHERE rn.is_active = true
      AND (
        p.target_gender IS NULL
        OR rn.node_type <> 'product'
        OR upper(coalesce(rn.properties->>'gender', '')) = p.target_gender
      )
      AND (
        to_tsvector('english', coalesce(rn.label, '') || ' ' || coalesce(rn.summary, '') || ' ' || coalesce(rn.search_text, '')) @@ p.ts_q
        OR (length(p.q_lower) >= 3 AND lower(rn.label || ' ' || rn.search_text) LIKE '%' || p.q_lower || '%')
      )
    LIMIT 36
  ),
  seeds AS (
    SELECT
      rn.id AS sid,
      rn.label AS s_label,
      rn.node_type AS s_type,
      rn.summary AS s_summary,
      rn.properties AS s_props,
      coalesce(vr.cos_sim, 0.0)::numeric AS vec_sim,
      (
        (coalesce(1.0 / (60.0 + vr.r_vec), 0.0) * 180.0)
        + (coalesce(1.0 / (60.0 + fr.r_fts), 0.0) * 140.0)
        + (coalesce(vr.cos_sim, 0.0) * 8.0)
        + rn.weight
        + CASE
            WHEN p.target_gender IS NOT NULL
              AND rn.node_type = 'product'
              AND upper(coalesce(rn.properties->>'gender', '')) = p.target_gender
            THEN 4.0 ELSE 0.0
          END
      )::numeric AS base_score
    FROM public.rag_nodes rn
    CROSS JOIN params p
    LEFT JOIN vec_ranked vr ON vr.id = rn.id
    LEFT JOIN fts_ranked fr ON fr.id = rn.id
    WHERE rn.is_active = true
      AND (vr.id IS NOT NULL OR fr.id IS NOT NULL)
    ORDER BY base_score DESC
    LIMIT 8
  ),
  hop1 AS (
    SELECT
      nb.id AS nid,
      nb.label AS n_label,
      nb.node_type AS n_type,
      nb.summary AS n_summary,
      nb.properties AS n_props,
      1 AS hop,
      coalesce(GREATEST(0.0, 1.0 - (nb.embedding <=> p.qvec)), 0.0)::numeric AS vec_sim,
      (s.base_score * 0.68 * e.weight)::numeric AS gscore,
      (s.s_label || ' --[' || e.relation || ']--> ' || nb.label) AS vpath
    FROM seeds s
    CROSS JOIN params p
    JOIN public.rag_edges e ON (e.source_id = s.sid OR e.target_id = s.sid) AND e.is_active = true
    JOIN public.rag_nodes nb ON nb.id = CASE WHEN e.source_id = s.sid THEN e.target_id ELSE e.source_id END
    WHERE nb.is_active = true
      AND nb.id <> s.sid
      AND (
        p.target_gender IS NULL
        OR nb.node_type <> 'product'
        OR upper(coalesce(nb.properties->>'gender', '')) = p.target_gender
      )
      AND (
        p.target_gender IS NULL
        OR nb.node_type <> 'collection'
        OR coalesce(nb.properties->>'gender', '') = ''
        OR upper(coalesce(nb.properties->>'gender', '')) = p.target_gender
      )
  ),
  combined AS (
    SELECT sid AS nid, s_label AS n_label, s_type AS n_type, s_summary AS n_summary, s_props AS n_props, 0 AS hop, vec_sim, base_score AS gscore, s_label AS vpath
    FROM seeds
    UNION ALL
    SELECT nid, n_label, n_type, n_summary, n_props, hop, vec_sim, gscore, vpath
    FROM hop1
  ),
  deduped AS (
    SELECT DISTINCT ON (nid)
      nid, n_label, n_type, n_summary, n_props, hop, vec_sim, gscore, vpath
    FROM combined
    ORDER BY nid, gscore DESC, hop ASC
  )
  SELECT
    d.nid AS node_id,
    d.n_label AS node_label,
    d.n_type AS node_type,
    d.n_summary AS node_summary,
    d.hop AS hop_distance,
    round(d.vec_sim, 4) AS vector_score,
    round(d.gscore, 3) AS graph_score,
    d.vpath AS via_path,
    d.n_props AS node_properties
  FROM deduped d
  ORDER BY d.gscore DESC
  LIMIT GREATEST(1, LEAST(coalesce(p_limit, 16), 40));
$$;

-- Note: Create query_kronos_graph_rag AFTER query_kronos_pgvector_graph_rag exists in dependency order!
CREATE OR REPLACE FUNCTION public.query_kronos_graph_rag(
  p_query text,
  p_limit integer DEFAULT 14,
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
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    r.node_id,
    r.node_label AS label,
    r.node_type,
    r.node_summary AS summary,
    r.hop_distance,
    r.graph_score,
    r.via_path,
    r.node_properties AS properties
  FROM public.query_kronos_pgvector_graph_rag(p_query, NULL, p_limit, p_gender) r;
$$;

REVOKE ALL ON FUNCTION public.kronos_stable_hash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kronos_stable_hash(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.kronos_semantic_embed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kronos_semantic_embed(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_kronos_catalog_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_kronos_catalog_stats() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.query_kronos_pgvector_graph_rag(text, extensions.vector, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.query_kronos_pgvector_graph_rag(text, extensions.vector, integer, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.query_kronos_graph_rag(text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.query_kronos_graph_rag(text, integer, text) TO anon, authenticated;
