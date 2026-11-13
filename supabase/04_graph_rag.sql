-- ============================================================================
-- KRONOS STREETWEAR — 04_graph_rag.sql
-- High-Level Knowledge Graph RAG Tables, Indexes, RLS Policies & SQL RPCs
-- Safe to run multiple times (idempotent DDL + seed upserts).
-- ============================================================================

-- ── 1. Knowledge Graph Nodes (Entities across Catalog, Drops, Policies, Stores) ──
CREATE TABLE IF NOT EXISTS public.rag_nodes (
  id text PRIMARY KEY,
  label text NOT NULL,
  node_type text NOT NULL CHECK (
    node_type IN (
      'product',
      'category',
      'collection',
      'colorway',
      'material',
      'store',
      'faq',
      'promo',
      'brand',
      'policy',
      'custom_doc'
    )
  ),
  summary text NOT NULL DEFAULT '',
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_text text NOT NULL DEFAULT '',
  weight numeric(6, 3) NOT NULL DEFAULT 1.000,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rag_nodes_type_active_idx
  ON public.rag_nodes (node_type, is_active);

CREATE INDEX IF NOT EXISTS rag_nodes_fts_idx
  ON public.rag_nodes
  USING gin (to_tsvector('english', coalesce(label, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(search_text, '')));

DROP TRIGGER IF EXISTS trg_rag_nodes_updated_at ON public.rag_nodes;
CREATE TRIGGER trg_rag_nodes_updated_at
  BEFORE UPDATE ON public.rag_nodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. Knowledge Graph Edges (Typed Semantic & Styling Relationships) ───────
CREATE TABLE IF NOT EXISTS public.rag_edges (
  id text PRIMARY KEY,
  source_id text NOT NULL REFERENCES public.rag_nodes(id) ON DELETE CASCADE,
  target_id text NOT NULL REFERENCES public.rag_nodes(id) ON DELETE CASCADE,
  relation text NOT NULL,
  weight numeric(6, 3) NOT NULL DEFAULT 1.000,
  evidence text NOT NULL DEFAULT '',
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rag_edges_source_idx ON public.rag_edges (source_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS rag_edges_target_idx ON public.rag_edges (target_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS rag_edges_relation_idx ON public.rag_edges (relation);

-- ── 3. Custom Knowledge Documents (Brand Playbooks, Policies, Lookbook Notes) ─
CREATE TABLE IF NOT EXISTS public.rag_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'knowledge' CHECK (
    doc_type IN ('knowledge', 'policy', 'styling_guide', 'brand_story', 'sizing_guide', 'faq')
  ),
  content text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  linked_node_id text REFERENCES public.rag_nodes(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rag_documents_active_idx ON public.rag_documents (is_active, created_at DESC);

DROP TRIGGER IF EXISTS trg_rag_documents_updated_at ON public.rag_documents;
CREATE TRIGGER trg_rag_documents_updated_at
  BEFORE UPDATE ON public.rag_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. Persistent Question-Answering & Graph Reasoning Telemetry Logs ───────
CREATE TABLE IF NOT EXISTS public.rag_qa_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT 'anon-session',
  channel text NOT NULL DEFAULT 'storefront' CHECK (channel IN ('storefront', 'admin_studio')),
  user_question text NOT NULL CHECK (length(trim(user_question)) >= 1),
  assistant_answer text NOT NULL DEFAULT '',
  groq_model text NOT NULL DEFAULT 'openai/gpt-oss-120b',
  engine_mode text NOT NULL DEFAULT 'groq+graph-rag',
  matched_node_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  traversal_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  reasoning_trace text DEFAULT '',
  latency_ms integer NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
  prompt_tokens integer NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens integer NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  feedback_rating smallint NOT NULL DEFAULT 0 CHECK (feedback_rating IN (-1, 0, 1)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rag_qa_logs_created_idx ON public.rag_qa_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS rag_qa_logs_channel_idx ON public.rag_qa_logs (channel, created_at DESC);

-- ── 5. Row Level Security Policies ──────────────────────────────────────────
ALTER TABLE public.rag_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_qa_logs ENABLE ROW LEVEL SECURITY;

-- Graph nodes, edges, and active docs: public read for storefront AI; admin-only writes
DROP POLICY IF EXISTS rag_nodes_public_select ON public.rag_nodes;
CREATE POLICY rag_nodes_public_select ON public.rag_nodes
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS rag_nodes_admin_all ON public.rag_nodes;
CREATE POLICY rag_nodes_admin_all ON public.rag_nodes
  FOR ALL
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

DROP POLICY IF EXISTS rag_edges_public_select ON public.rag_edges;
CREATE POLICY rag_edges_public_select ON public.rag_edges
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS rag_edges_admin_all ON public.rag_edges;
CREATE POLICY rag_edges_admin_all ON public.rag_edges
  FOR ALL
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

DROP POLICY IF EXISTS rag_documents_public_select ON public.rag_documents;
CREATE POLICY rag_documents_public_select ON public.rag_documents
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS rag_documents_admin_all ON public.rag_documents;
CREATE POLICY rag_documents_admin_all ON public.rag_documents
  FOR ALL
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

-- Q&A telemetry logs: only authenticated superadmins/admins can read/delete chat history
DROP POLICY IF EXISTS rag_qa_logs_admin_select ON public.rag_qa_logs;
CREATE POLICY rag_qa_logs_admin_select ON public.rag_qa_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

DROP POLICY IF EXISTS rag_qa_logs_admin_delete ON public.rag_qa_logs;
CREATE POLICY rag_qa_logs_admin_delete ON public.rag_qa_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = (SELECT auth.uid()) AND ap.is_active = true
    )
  );

-- ── 6. Safe Graph RAG Server-Side Traversal & Telemetry Logging RPCs ────────

-- 6A. Multi-hop SQL Knowledge Graph Retrieval RPC (Seed Match + 2-Hop Expansion)
CREATE OR REPLACE FUNCTION public.query_kronos_graph_rag(
  p_query text,
  p_limit integer DEFAULT 16
)
RETURNS TABLE (
  node_id text,
  label text,
  node_type text,
  summary text,
  properties jsonb,
  hop_distance integer,
  graph_score numeric,
  via_path text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH terms AS (
    SELECT lower(trim(coalesce(p_query, ''))) AS q
  ),
  seeds AS (
    SELECT
      n.id AS node_id,
      n.label,
      n.node_type,
      n.summary,
      n.properties,
      0 AS hop_distance,
      (
        CASE WHEN lower(n.label) = t.q THEN 6.0 ELSE 0.0 END
        + CASE WHEN position(t.q IN lower(n.label || ' ' || n.search_text)) > 0 THEN 3.0 ELSE 0.0 END
        + ts_rank_cd(
            to_tsvector('english', coalesce(n.label, '') || ' ' || coalesce(n.summary, '') || ' ' || coalesce(n.search_text, '')),
            plainto_tsquery('english', t.q)
          ) * 4.0
        + coalesce(n.weight, 1.0)
      )::numeric AS graph_score,
      n.label AS via_path
    FROM public.rag_nodes n, terms t
    WHERE n.is_active = true
      AND t.q <> ''
      AND (
        lower(n.label || ' ' || n.summary || ' ' || n.search_text) LIKE '%' || t.q || '%'
        OR to_tsvector('english', coalesce(n.label, '') || ' ' || coalesce(n.summary, '') || ' ' || coalesce(n.search_text, ''))
           @@ websearch_to_tsquery('english', t.q)
      )
    ORDER BY graph_score DESC
    LIMIT 8
  ),
  hop1 AS (
    SELECT
      nb.id AS node_id,
      nb.label,
      nb.node_type,
      nb.summary,
      nb.properties,
      1 AS hop_distance,
      (s.graph_score * 0.65 * coalesce(e.weight, 1.0))::numeric AS graph_score,
      (s.via_path || ' --[' || e.relation || ']--> ' || nb.label) AS via_path
    FROM seeds s
    JOIN public.rag_edges e
      ON e.is_active = true
      AND (e.source_id = s.node_id OR e.target_id = s.node_id)
    JOIN public.rag_nodes nb
      ON nb.id = CASE WHEN e.source_id = s.node_id THEN e.target_id ELSE e.source_id END
      AND nb.is_active = true
  ),
  hop2 AS (
    SELECT
      nb2.id AS node_id,
      nb2.label,
      nb2.node_type,
      nb2.summary,
      nb2.properties,
      2 AS hop_distance,
      (h1.graph_score * 0.50 * coalesce(e2.weight, 1.0))::numeric AS graph_score,
      (h1.via_path || ' --[' || e2.relation || ']--> ' || nb2.label) AS via_path
    FROM hop1 h1
    JOIN public.rag_edges e2
      ON e2.is_active = true
      AND (e2.source_id = h1.node_id OR e2.target_id = h1.node_id)
    JOIN public.rag_nodes nb2
      ON nb2.id = CASE WHEN e2.source_id = h1.node_id THEN e2.target_id ELSE e2.source_id END
      AND nb2.is_active = true
    LIMIT 24
  ),
  combined AS (
    SELECT * FROM seeds
    UNION ALL
    SELECT * FROM hop1
    UNION ALL
    SELECT * FROM hop2
  ),
  ranked AS (
    SELECT DISTINCT ON (c.node_id)
      c.node_id,
      c.label,
      c.node_type,
      c.summary,
      c.properties,
      c.hop_distance,
      c.graph_score,
      c.via_path
    FROM combined c
    ORDER BY c.node_id, c.graph_score DESC, c.hop_distance ASC
  )
  SELECT *
  FROM ranked
  ORDER BY graph_score DESC
  LIMIT greatest(1, least(coalesce(p_limit, 16), 40));
$$;

REVOKE ALL ON FUNCTION public.query_kronos_graph_rag(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.query_kronos_graph_rag(text, integer) TO anon, authenticated;

-- 6B. Safe Telemetry Logger for Every Question Answered (Storefront & Admin)
CREATE OR REPLACE FUNCTION public.log_rag_interaction(
  p_session_id text,
  p_channel text,
  p_user_question text,
  p_assistant_answer text,
  p_groq_model text DEFAULT 'openai/gpt-oss-120b',
  p_engine_mode text DEFAULT 'groq+graph-rag',
  p_matched_node_ids jsonb DEFAULT '[]'::jsonb,
  p_traversal_paths jsonb DEFAULT '[]'::jsonb,
  p_recommended_product_ids jsonb DEFAULT '[]'::jsonb,
  p_reasoning_trace text DEFAULT '',
  p_latency_ms integer DEFAULT 0,
  p_prompt_tokens integer DEFAULT 0,
  p_completion_tokens integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.rag_qa_logs%ROWTYPE;
BEGIN
  IF length(trim(coalesce(p_user_question, ''))) = 0 THEN
    RAISE EXCEPTION 'Question text is required';
  END IF;

  INSERT INTO public.rag_qa_logs (
    session_id,
    channel,
    user_question,
    assistant_answer,
    groq_model,
    engine_mode,
    matched_node_ids,
    traversal_paths,
    recommended_product_ids,
    reasoning_trace,
    latency_ms,
    prompt_tokens,
    completion_tokens
  )
  VALUES (
    coalesce(nullif(trim(p_session_id), ''), 'anon-session'),
    CASE WHEN p_channel IN ('storefront', 'admin_studio') THEN p_channel ELSE 'storefront' END,
    left(trim(p_user_question), 4000),
    left(coalesce(p_assistant_answer, ''), 16000),
    coalesce(nullif(trim(p_groq_model), ''), 'openai/gpt-oss-120b'),
    coalesce(nullif(trim(p_engine_mode), ''), 'groq+graph-rag'),
    coalesce(p_matched_node_ids, '[]'::jsonb),
    coalesce(p_traversal_paths, '[]'::jsonb),
    coalesce(p_recommended_product_ids, '[]'::jsonb),
    left(coalesce(p_reasoning_trace, ''), 8000),
    greatest(coalesce(p_latency_ms, 0), 0),
    greatest(coalesce(p_prompt_tokens, 0), 0),
    greatest(coalesce(p_completion_tokens, 0), 0)
  )
  RETURNING * INTO v_row;

  RETURN QUERY SELECT v_row.id, v_row.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.log_rag_interaction(text, text, text, text, text, text, jsonb, jsonb, jsonb, text, integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_rag_interaction(text, text, text, text, text, text, jsonb, jsonb, jsonb, text, integer, integer, integer) TO anon, authenticated;

-- 6C. Thumbs Up/Down Feedback Mutation RPC
CREATE OR REPLACE FUNCTION public.submit_rag_feedback(
  p_log_id uuid,
  p_rating smallint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.rag_qa_logs
  SET feedback_rating = CASE WHEN p_rating > 0 THEN 1 WHEN p_rating < 0 THEN -1 ELSE 0 END
  WHERE id = p_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_rag_feedback(uuid, smallint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_rag_feedback(uuid, smallint) TO anon, authenticated;

-- ── 7. Starter Brand & Policy Knowledge Graph Seed ──────────────────────────
INSERT INTO public.rag_nodes (id, label, node_type, summary, search_text, weight, is_active)
VALUES
  ('brand:kronos', 'K Streetwear Tunisia', 'brand', 'Architectural technical streetwear house operating in Tunisia (Tunis, Sousse, Sfax) with Cash on Delivery and 3D Fitting Lab.', 'k kronos streetwear tunisia tunis sousse sfax cash on delivery 3d lab', 2.0, true),
  ('policy:shipping', 'Tunisia Express Shipping Policy', 'policy', '24-48h express courier across Tunis, Ariana, Sousse, Sfax and all governorates. 8 DT flat shipping, FREE over 300 DT.', 'shipping delivery livraison tunis sousse sfax free 300 dt 8 dt 24h 48h', 1.8, true),
  ('policy:returns', '30-Day Hassle-Free Returns & Exchange', 'policy', '30-day size exchange or return guarantee on unworn garments with original tags.', 'return refund exchange 30 day size swap policy tags', 1.6, true),
  ('policy:3d-lab', 'K 3D Anatomical Fitting Lab', 'policy', 'Interactive WebGL 3D avatar try-on calibrating garment drape across XS-XL & EU 32-46 sizing.', '3d fitting lab virtual try on avatar chest waist height fit score', 1.5, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  summary = EXCLUDED.summary,
  search_text = EXCLUDED.search_text,
  weight = EXCLUDED.weight,
  is_active = true;

INSERT INTO public.rag_edges (id, source_id, target_id, relation, weight, evidence)
VALUES
  ('edge:kronos-shipping', 'brand:kronos', 'policy:shipping', 'PROVIDES_SHIPPING', 1.5, 'Free Tunisia delivery over 300 DT; 8 DT standard courier.'),
  ('edge:kronos-returns', 'brand:kronos', 'policy:returns', 'GUARANTEES_RETURNS', 1.3, '30-day unworn exchange guarantee.'),
  ('edge:kronos-3dlab', 'brand:kronos', 'policy:3d-lab', 'POWERS_TRYON', 1.4, 'Interactive 3D Virtual Fitting Lab on every product.')
ON CONFLICT (id) DO UPDATE SET
  weight = EXCLUDED.weight,
  evidence = EXCLUDED.evidence,
  is_active = true;

INSERT INTO public.rag_documents (title, doc_type, content, tags, linked_node_id, is_active)
SELECT
  'KRONOS Tunisia Delivery & Sizing Playbook',
  'sizing_guide',
  'Orders across Grand Tunis, Sousse, and Sfax ship within 24 to 48 hours via Cash on Delivery or online checkout. Shipping is 8 DT flat and automatically FREE for orders above 300 DT. Denim follows EU 32-46 measurements while outerwear, knitwear, and tees follow XS-XL studio tailoring. Customers can test exact fit on our 3D Virtual Fitting Lab before ordering.',
  '["shipping", "sizing", "tunisia", "3d-lab"]'::jsonb,
  'brand:kronos',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.rag_documents WHERE title = 'KRONOS Tunisia Delivery & Sizing Playbook'
);

