# K — High-Contrast Streetwear Storefront, 3D Fitting Lab & Hybrid Graph RAG

Full-stack streetwear e-commerce platform built with **React**, **Vite**, **Tailwind CSS**, **Three.js**, **Supabase (`pgvector` + RLS)**, and **Groq LPU** inference.

---

## Key Features

1. **Storefront Experience (`/`)**
   - Editorial high-contrast layout with **Night Mode** toggle and full **English / French / Arabic (`EN` / `FR` / `AR`)** intelligent localization (including RTL layout support).
   - **56** curated catalog items (**28 MEN** & **28 WOMEN**) with multi-currency display (`TND` primary), quick view, wishlist, search, cart drawer, and promo code checkout (`KRONOS15`, `BLACKFRIDAY35`, `TUNISVIP`).
   - **3D Virtual Fitting Lab** powered by Three.js with male/female animated `.glb` models, lighting, and garment sizing fit diagnostics.

2. **K Personal Stylist (Client Concierge)**
   - Client-facing styling assistant backed by hybrid **Supabase `pgvector` HNSW** semantic search + **2-hop Knowledge Graph** traversal.
   - Strict **Storefront Privacy Shield** (blocks internal revenue, total order volumes, stock counts, and admin-only queries) and strict **MEN / WOMEN** gender isolation.

3. **Independent Admin Studio (`/admin`)**
   - Protected by Supabase Auth + Row-Level Security (`RLS`).
   - Catalog & Pricing Master, Orders/Commandes manager, Supabase Media Vault, Promo Codes & FAQs, Newsletter Subscribers, Live Storefront CMS, and **AI Assistant & Graph RAG Studio** (interactive force-directed Knowledge Graph Explorer, 7-point diagnostics, conversation history, and cloud sync).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_GROQ_API_KEY in .env.local

# 3. Start local dev server (http://localhost:3000 & /admin)
npm run dev

# 4. Build for production
npm run build
```

---

## Supabase Database Setup

Run the SQL scripts in [`supabase/`](./supabase/) inside your Supabase SQL Editor in order:

1. `ALL_IN_ONE_SUPABASE_SETUP.sql` (base tables, RLS policies, storage buckets, and catalog seed)
2. `04_graph_rag.sql` (Graph RAG tables & telemetry)
3. `05_gender_outfits_and_rag_fix.sql` (`men_outfits`, `women_outfits`, and gender isolation rules)
4. `06_pgvector_hybrid_graph_rag.sql` (enables `vector` extension, `384`-dim embeddings with `hnsw` cosine index, `query_kronos_pgvector_graph_rag`, and `get_kronos_catalog_stats`)

Never commit `.env.local` or `SUPABASE_SERVICE_ROLE_KEY`.

---

## Project Structure

```
commerce/
├── index.html                  # Storefront entry point
├── admin.html                  # Independent Admin Studio entry point
├── .env.example                # Safe environment variable template
├── public/
│   ├── models/                 # 3D Fitting Lab rigged .glb models & animations
│   └── textures/               # 3D skin & surface textures
├── supabase/
│   ├── 01_schema.sql .. 06_pgvector_hybrid_graph_rag.sql
│   └── ALL_IN_ONE_SUPABASE_SETUP.sql
└── src/
    ├── App.jsx                 # Client storefront & /admin router
    ├── pages/AdminDashboard.jsx
    ├── components/
    │   ├── RawlineMasterEngine.jsx
    │   ├── Rawline3DFittingLab.jsx
    │   ├── RawlineAIChatbot.jsx
    │   ├── RichChatbotMessage.jsx
    │   └── admin/              # Admin Studio & Graph RAG Inspector tabs
    └── lib/
        ├── supabaseClient.js
        ├── kronosDataService.js
        ├── kronosGraphRag.js
        ├── semanticVectorEngine.js
        ├── enterpriseGraphEngine.js
        └── i18nEngine.js
```
