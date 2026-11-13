# K — System Architecture & AI Retrieval Blueprint

This document describes the production architecture of **K** (KRONOS Tunisia): a multi-entry React 19 + Vite 6 storefront, Three.js 3D Virtual Fitting Lab, Supabase (`pgvector` HNSW + RLS) persistence engine, and dual-channel Hybrid Graph RAG intelligence stack.

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Applications (Vite Multi-Entry Build)"]
        SF["Storefront (/) & PDP (/product/:slug)\nRawlineMasterEngine · ZaraProductDetailPage\nEN / FR / AR RTL + Day / Night Mode"]
        LAB["3D Virtual Fitting Lab (#3d-fitting-lab)\nThree.js WebGL · Rigged .glb Avatars\nSize Fit & Tension Diagnostics"]
        CS["Client Personal Stylist\nRawlineAIChatbot (mode: storefront)\nStrict Privacy Shield + Gender Lock"]
        AD["Independent Admin Studio (/admin)\nAdminDashboard · Catalog · Commandes · Media Vault\nAdminGraphRagStudio · EnterpriseGraphCanvas"]
    end

    subgraph Retrieval["Hybrid Intelligence Layer (src/lib/)"]
        VEC["semanticVectorEngine.js\n384-Dim L2 Multilingual Vectorizer\n(24 Fashion Concept Dims + 320 Hash Dims)"]
        RAG["kronosGraphRag.js\n2-Hop BFS Graph Traversal + 4-Signal RRF\nStrict Privacy Shield & Gender Filter"]
        i18n["i18nEngine.js\nEN / FR / AR Dictionary + Dynamic RTL"]
    end

    subgraph Cloud["Supabase PostgreSQL 15+ & Storage (gegzguzllfvjpmqwkloc)"]
        PG["PostgreSQL + pgvector 0.8.2\n14 RLS-Protected Tables\nrag_nodes_embedding_hnsw_idx (HNSW)\nrag_nodes_fts_idx (GIN)"]
        RPC["Postgres RPCs\nquery_kronos_pgvector_graph_rag()\nquery_kronos_graph_rag()\nget_kronos_catalog_stats()\nlog_rag_interaction() · submit_kronos_order()"]
        ST["Storage Buckets\nkronos-images · kronos-videos · kronos-documents"]
    end

    subgraph Inference["LLM Failover Chain (Groq OpenAI-Compatible API)"]
        G1["1. openai/gpt-oss-120b"]
        G2["2. qwen/qwen3.8-27b"]
        G3["3. openai/gpt-oss-20b"]
        G4["4. allam-2-7b (Arabic specialist)"]
        G5["5. Localized Deterministic Fallback"]
        G1 --> G2 --> G3 --> G4 --> G5
    end

    SF --> i18n
    SF --> LAB
    SF --> CS
    CS --> RAG
    AD --> RAG
    RAG --> VEC
    RAG --> RPC
    RPC --> PG
    AD --> ST
    RAG --> G1
```

---

## 2. Multi-Entry Application Routing

Configured in [`vite.config.js`](../vite.config.js) and [`src/App.jsx`](../src/App.jsx):

| Route / Entry | HTML Shell | Primary Component | Access Control |
| :--- | :--- | :--- | :--- |
| `/` | `index.html` | [`RawlineMasterEngine.jsx`](../src/components/RawlineMasterEngine.jsx) | Public read (`anon` + `authenticated`) |
| `/product/:slug` | `index.html` | [`ZaraProductDetailPage.jsx`](../src/components/ZaraProductDetailPage.jsx) | Public read |
| `/#3d-fitting-lab` | `index.html` | [`Rawline3DFittingLab.jsx`](../src/components/Rawline3DFittingLab.jsx) | Public read (client-side Three.js WebGL) |
| `/admin`, `/admin-kronos-2026` | `admin.html` | [`AdminDashboard.jsx`](../src/pages/AdminDashboard.jsx) | Public preview read; cloud writes & PII gated by Supabase Auth + `admin_profiles` RLS |

---

## 3. Hybrid `pgvector` HNSW + 2-Hop Graph RAG Pipeline

Unlike standard vector-only RAG pipelines that miss multi-item outfit pairings or hallucinate inventory counts, `askKronosGraphRag()` in [`src/lib/kronosGraphRag.js`](../src/lib/kronosGraphRag.js) fuses four independent retrieval signals:

```mermaid
flowchart LR
    Q["User Query (EN / FR / AR)"] --> GL["Gender & Intent Classifier\ndetectTargetGender · isCatalogOverviewQuery\nisStorefrontRestrictedQuery"]
    Q --> EMB["384-Dim Query Vector\ncomputeSemanticEmbedding384()"]

    GL -->|Blocked in Storefront| SHIELD["Privacy Shield Response\n(Zero Financial/Order/Stock Leak)"]
    GL -->|Allowed| PAR["Parallel Cloud + Local Retrieval"]

    EMB --> RPC1["Supabase RPC: query_kronos_pgvector_graph_rag\nHNSW Cosine + tsvector FTS + 2-Hop Edges"]
    GL --> RPC2["Supabase RPC: get_kronos_catalog_stats\nLive Authoritative Store Totals"]
    GL --> OUTFIT["Gender-Isolated Queries\nmen_outfits OR women_outfits"]
    EMB --> LOCAL["In-Memory Graph Engine\nBM25 Lexical + Cosine 384 + 2-Hop BFS"]

    RPC1 & LOCAL --> RRF["Reciprocal Rank Fusion (RRF)\nStrict MEN/WOMEN Filter"]
    RPC2 & OUTFIT & RRF --> CTX["Grounded Editorial Context + Groq Prompt"]
    CTX --> LLM["Groq LPU Failover Chain -> Final Answer + Product Cards"]
```

### Aligned Client–Server Embedding Math (`semanticVectorEngine.js` ↔ `kronos_semantic_embed`)
- Both TypeScript/JS ([`src/lib/semanticVectorEngine.js`](../src/lib/semanticVectorEngine.js)) and PostgreSQL PL/pgSQL ([`supabase/06_pgvector_hybrid_graph_rag.sql`](../supabase/06_pgvector_hybrid_graph_rag.sql)) compute bit-aligned **384-dimensional L2-normalized vectors**:
  - **Concept Dimensions**: 24 curated multilingual fashion & commerce synonym buckets bridging English, French, and Arabic (`leather`/`cuir`/`جلد`, `jacket`/`blouson`/`جاكيت`, `trousers`/`pantalon`/`بنطلون`, `shipping`/`livraison`/`توصيل`, etc.).
  - **Subword/Token Hash Dimensions**: Deterministic trigram + token feature hashing across the remaining dimensions.
- Benefit: Queries embed locally in **&lt;1 ms** with **zero external embedding API latency or cost**, while `rag_nodes.embedding` supports native Postgres HNSW cosine search (`rag_nodes_embedding_hnsw_idx`).

---

## 4. Security & Channel Isolation Model

1. **Storefront Client Privacy Shield (`channel: 'storefront'`)**:
   - `isStorefrontRestrictedQuery()` intercepts storefront probes asking for revenue, funds, total customer orders (`commandes`), subscriber counts, internal stock units, or admin credentials.
   - `buildKronosKnowledgeGraph(..., { includeInternalStock: false })` strips internal stock quantities and admin KPIs from every storefront node before prompt assembly.
   - `sanitizeStorefrontAnswer()` removes technical framework terms (`Groq`, `Supabase`, `Graph RAG`, `Strategy:`, `Knowledge Graph`, `nodes`) from client replies so shoppers experience a clean boutique advisor.
2. **Strict `MEN` / `WOMEN` Gender Isolation**:
   - `detectTargetGender()` detects EN, FR, and AR gender intent and enforces `p_gender` inside `query_kronos_pgvector_graph_rag`, selects exclusively from `men_outfits` or `women_outfits`, and filters ranked recommendation cards.
3. **Admin Studio Full-Project Dossier (`channel: 'admin_studio'`)**:
   - Injects `ADMIN FULL PROJECT DOSSIER` (GMV in DT, status & city breakdown, low-stock items, promos, media buckets, subscriber count, Graph topology telemetry, and platform stack) exclusively inside `/admin`.
   - Write operations against `products`, `promo_codes`, `site_settings`, `orders`, `rag_nodes`, `rag_edges`, and Storage buckets are enforced at the database layer via Supabase Row-Level Security (`RLS`).

---

## 5. Multilingual (`EN` / `FR` / `AR`) & Day/Night UI

- **Localization ([`src/lib/i18nEngine.js`](../src/lib/i18nEngine.js))**: Reactive `EN` / `FR` / `AR` translation engine covering navigation, catalog badges, checkout, drawers, and Chatbot quick actions, automatically toggling `dir="rtl"` for Arabic.
- **3D Fitting Lab ([`src/components/Rawline3DFittingLab.jsx`](../src/components/Rawline3DFittingLab.jsx))**: Real-time Three.js WebGL renderer loading rigged `man.glb` (184 cm), `woman.glb` (175 cm), and `animations.glb`, supporting multi-angle presets (`FRONT`, `3/4`, `SIDE`, `BACK`), skin tone shaders, studio lighting presets, and live garment fitting swaps.
- **Interactive Knowledge Graph ([`src/components/admin/EnterpriseGraphCanvas.jsx`](../src/components/admin/EnterpriseGraphCanvas.jsx))**: Computes PageRank (`d = 0.85`), Betweenness Centrality, Union-Find clusters, and renders both **2D Concentric Ring** and **3D WebGL** interactive inspection views inside `/admin`.
