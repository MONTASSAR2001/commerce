# KRONOS Streetwear — Supabase Database & Storage Setup

This folder contains everything needed to power the **KRONOS Storefront** and the **Independent Admin Studio (`/admin`)** with real PostgreSQL data, Storage uploads (images, videos, documents), customer commandes (orders), emails, phone numbers, and dynamic pricing.

## Files Included

1. **`01_schema.sql`** — All tables (`products`, `orders`, `media_assets`, `site_settings`, `promo_codes`, `newsletter_subscribers`, `admin_profiles`, `admin_audit_logs`), indexes, updated-at triggers, and safe checkout RPCs (`validate_promo_code`, `submit_kronos_order`).
2. **`02_storage_and_rls.sql`** — Enables Row Level Security (RLS) across every table, configures strict role-scoped policies, and creates 3 Supabase Storage buckets:
   - `kronos-images` (Product photography, Hero backgrounds, Store photos)
   - `kronos-videos` (Lookbook MP4/WebM reels)
   - `kronos-documents` (Lookbook PDFs, Size Guides, Invoices, Terms)
3. **`03_seed_data.sql`** — Seeds all 56 default MEN & WOMEN catalog items, contact email/phone, store locations, hero/lookbook/manifesto/drops settings, promo codes, sample media entries, and currency options.
4. **`04_graph_rag.sql`** — High-Level **Graph RAG + Groq Telemetry** layer: `rag_nodes`, `rag_edges`, `rag_documents`, `rag_qa_logs`, strict RLS policies, server-side 2-hop graph traversal RPC (`query_kronos_graph_rag`), Q&A logging RPC (`log_rag_interaction`), and feedback RPC (`submit_rag_feedback`).
5. **`ALL_IN_ONE_SUPABASE_SETUP.sql`** — Single combined file (`01` + `02` + `03` + `04`) for one-shot paste into Supabase SQL Editor.

## Step-by-Step Setup

### 1. Run the SQL in Supabase Dashboard
1. Open your Supabase project -> **SQL Editor** -> **New Query**.
2. Paste `ALL_IN_ONE_SUPABASE_SETUP.sql` (or run `01_schema.sql` -> `02_storage_and_rls.sql` -> `03_seed_data.sql` -> `04_graph_rag.sql` in order).
   - If you already ran `01`–`03` earlier, you can simply run `04_graph_rag.sql` on its own!
3. Click **Run**.

### 2. Create & Promote Your Admin User
1. In Supabase Dashboard -> **Authentication** -> **Users** -> **Add User** (create your admin email & password, e.g. `montassarzarai0@gmail.com`).
2. Run this in the SQL Editor (already included at the end of `02_storage_and_rls.sql` / `ALL_IN_ONE_SUPABASE_SETUP.sql` for `montassarzarai0@gmail.com`):

```sql
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
  role = 'superadmin',
  is_active = true;
```

### 3. Configure Frontend Environment Variables
Copy `.env.example` to `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 4. Open the Independent Admin Dashboard
Navigate to:
- `http://localhost:3000/admin` (or `/admin-kronos-2026`)
Sign in with your Supabase Admin email/password in the Passport Card / Auth bar, and all price updates, uploaded Storage images/videos/documents, storefront texts/contacts, and live customer orders (`commandes`) will sync directly with Supabase.

