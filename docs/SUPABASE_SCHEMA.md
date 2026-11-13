# Supabase PostgreSQL & `pgvector` Database Schema

Target database runtime: **Supabase PostgreSQL 15+** with **`vector 0.8.2`**, **`pgcrypto 1.3`**, and **`uuid-ossp 1.1`**.

---

## 1. Migration Execution Order

Run the SQL scripts located in [`../supabase/`](../supabase/) inside the Supabase SQL Editor in order:

| Step | Script | Responsibility |
| :--- | :--- | :--- |
| 1 | `ALL_IN_ONE_SUPABASE_SETUP.sql` (or `01` → `03`) | Core catalog, commandes, media metadata, promos, subscribers, RLS policies, storage buckets, and 56-item seed data |
| 2 | `04_graph_rag.sql` | `rag_nodes`, `rag_edges`, `rag_documents`, `rag_qa_logs` telemetry tables, FTS indexes, and initial Graph RPC |
| 3 | `05_gender_outfits_and_rag_fix.sql` | Dedicated `men_outfits` (6) & `women_outfits` (6) tables, strict gender constraints, and RAG edge seeding |
| 4 | `06_pgvector_hybrid_graph_rag.sql` | Enables `extensions.vector`, adds `vector(384)` column + HNSW cosine index, SQL `kronos_semantic_embed()`, triggers, backfills all 100 nodes, fixes `42702` ambiguity, and creates `query_kronos_pgvector_graph_rag` + `get_kronos_catalog_stats` |

---

## 2. Database Tables & Row-Level Security (14 Tables — All RLS Enabled)

| Table | Purpose | Public (`anon`) Access | Admin (`authenticated`) Access |
| :--- | :--- | :--- | :--- |
| `products` | Storefront catalog (56 live items: 28 MEN, 28 WOMEN) | `SELECT` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |
| `men_outfits` | Curated complete MEN outfit pairings (6 ensembles) | `SELECT` | `ALL` |
| `women_outfits` | Curated complete WOMEN outfit pairings (6 ensembles) | `SELECT` | `ALL` |
| `orders` | Customer commandes & TND totals (`KRN-...`) | `INSERT` only (checkout) | `SELECT`, `UPDATE`, `DELETE` |
| `promo_codes` | Active promo codes (`KRONOS15`, `BLACKFRIDAY35`, `TUNISVIP`) | `SELECT` | `INSERT`, `UPDATE`, `DELETE` |
| `site_settings` | Storefront copy, contacts, theme & CMS sections | `SELECT` | `INSERT`, `UPDATE`, `DELETE` |
| `media_assets` | Tracked files stored across 3 Storage buckets | `SELECT` | `INSERT`, `UPDATE`, `DELETE` |
| `newsletter_subscribers` | Customer email capture | `INSERT` only | `SELECT`, `DELETE` |
| `admin_profiles` | Authorized superadmin registry checked by RLS helpers | None | Self `SELECT`, `UPDATE` |
| `admin_audit_logs` | Security & admin action audit trail | None | `SELECT`, `INSERT` |
| `rag_nodes` | Vectorized Knowledge Graph entities (`vector(384)`) | `SELECT` | `ALL` |
| `rag_edges` | Typed directed relations (`IN_CATEGORY`, `OUTFIT_INCLUDES`, `PAIRS_WELL_WITH`, etc.) | `SELECT` | `ALL` |
| `rag_documents` | Custom admin knowledge playbooks & brand policies | `SELECT` | `ALL` |
| `rag_qa_logs` | Storefront & Admin Q&A telemetry, latency, and feedback ratings | Controlled via RPC | `SELECT`, `UPDATE` |

---

## 3. Indexes & Vector Configuration

- **`rag_nodes_embedding_hnsw_idx`**: `CREATE INDEX ... ON public.rag_nodes USING hnsw (embedding vector_cosine_ops)` for sub-millisecond approximate nearest neighbor search over 384-dim semantic vectors.
- **`rag_nodes_fts_idx`**: `GIN` full-text search index over `rag_nodes` searchable text.
- **`rag_edges_source_idx`, `rag_edges_target_idx`, `rag_edges_relation_idx`**: Fast 1-hop and 2-hop graph neighbor expansion.
- **`products_gender_idx`, `products_category_idx`, `products_published_sort_idx`**: Instant storefront filtering across gender (`MEN`/`WOMEN`), categories, and publication order.

---

## 4. Triggers & RPC API Surface

### Automated Triggers
- `trg_fn_rag_nodes_embed`: Automatically recomputes the 384-dim `embedding` column whenever a `rag_nodes` row is inserted or updated.
- `trg_fn_products_sync_rag`: Automatically synchronizes product inserts/updates into `rag_nodes` and `rag_edges`.
- `set_updated_at`: Maintains consistent `updated_at` timestamps across tables.

### Key PostgreSQL RPCs
- `query_kronos_pgvector_graph_rag(p_query text, p_query_embedding extensions.vector, p_limit integer, p_gender text)`: Combines `pgvector` HNSW cosine similarity + `tsvector` full-text score + 2-hop `rag_edges` expansion with strict `p_gender` enforcement (`MEN`, `WOMEN`, or `NULL`).
- `query_kronos_graph_rag(p_query text, p_limit integer, p_gender text)`: Lexical + graph RPC fallback.
- `get_kronos_catalog_stats()`: Returns live authoritative counts (`total_products`, `men_count`, `women_count`, `on_sale_count`, `min_price_tnd`, `max_price_tnd`, `men_categories`, `women_categories`).
- `log_rag_interaction(...)` & `submit_rag_feedback(...)`: Persists Q&A telemetry and thumbs-up/down ratings cleanly under RLS.
- `validate_promo_code(...)` & `submit_kronos_order(...)`: Atomic checkout validation and order recording.
