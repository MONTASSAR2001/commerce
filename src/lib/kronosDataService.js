import { getSupabase } from './supabaseClient';
import { defaultKronosData } from '../data/defaultRawlineData';

export const STORE_DATA_KEY = 'kronos_store_data_v8_dynamic';
export const ORDERS_STORAGE_KEY = 'kronos_orders_v1';
export const MEDIA_STORAGE_KEY = 'kronos_media_assets_v1';
export const PROMOS_STORAGE_KEY = 'kronos_promo_codes_v1';
export const NEWSLETTER_STORAGE_KEY = 'kronos_newsletter_v1';

export const DEFAULT_PROMOS = [
  {
    id: 'promo-kronos15',
    code: 'KRONOS15',
    description: 'First order 15% architectural welcome privilege',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_tnd: 100,
    max_uses: 500,
    used_count: 0,
    is_active: true
  },
  {
    id: 'promo-bf35',
    code: 'BLACKFRIDAY35',
    description: 'Archive Drop Seasonal 35% Reduction',
    discount_type: 'percentage',
    discount_value: 35,
    min_order_tnd: 250,
    max_uses: 200,
    used_count: 0,
    is_active: true
  },
  {
    id: 'promo-vip50',
    code: 'TUNISVIP',
    description: 'Flat 50 DT VIP Studio Voucher',
    discount_type: 'fixed',
    discount_value: 50,
    min_order_tnd: 200,
    max_uses: 100,
    used_count: 0,
    is_active: true
  }
];

export const DEFAULT_MEDIA_ASSETS = [
  {
    id: 'seed-hero-img',
    title: 'Hero Campaign Key Visual',
    media_type: 'image',
    bucket_name: 'kronos-images',
    storage_path: 'hero/hero-key-visual.jpg',
    public_url: defaultKronosData.hero.bgImage,
    mime_type: 'image/jpeg',
    linked_entity_type: 'hero',
    linked_entity_id: 'main',
    notes: 'Primary landing hero photography',
    created_at: new Date().toISOString()
  },
  {
    id: 'seed-manifesto-img',
    title: 'About Manifesto Studio',
    media_type: 'image',
    bucket_name: 'kronos-images',
    storage_path: 'hero/manifesto-studio.webp',
    public_url: defaultKronosData.about.bgImage,
    mime_type: 'image/webp',
    linked_entity_type: 'about',
    linked_entity_id: 'main',
    notes: 'Manifesto full-bleed backdrop',
    created_at: new Date().toISOString()
  },
  {
    id: 'seed-lookbook-video',
    title: 'Runway Lookbook Film 2026',
    media_type: 'video',
    bucket_name: 'kronos-videos',
    storage_path: 'lookbook/kronos-runway-2026.mp4',
    public_url: defaultKronosData.lookbook.videoUrl,
    mime_type: 'video/mp4',
    linked_entity_type: 'lookbook',
    linked_entity_id: 'main',
    notes: 'Autoplay cinematic lookbook film',
    created_at: new Date().toISOString()
  },
  {
    id: 'seed-size-doc',
    title: 'KRONOS 2026 Sizing & Care Dossier (PDF)',
    media_type: 'document',
    bucket_name: 'kronos-documents',
    storage_path: 'docs/kronos-size-care-2026.pdf',
    public_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
    mime_type: 'application/pdf',
    linked_entity_type: 'document',
    linked_entity_id: 'size-guide',
    notes: 'Official lookbook sizing and garment care reference document',
    created_at: new Date().toISOString()
  }
];

export function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function safeWriteJson(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`[kronosDataService] Failed writing ${key}:`, err);
  }
}

export function mapDbProductToApp(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    gender: row.gender,
    price: Number(row.price ?? 0),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    discount: row.discount || undefined,
    badge: row.badge || undefined,
    img: row.img || (Array.isArray(row.images) && row.images[0]) || '',
    images: Array.isArray(row.images) ? row.images : [row.img].filter(Boolean),
    colorVariants: Array.isArray(row.color_variants) ? row.color_variants : [],
    colors: Array.isArray(row.colors) ? row.colors : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : ['S', 'M', 'L', 'XL'],
    description: row.description || '',
    modelHeight: row.model_height || 'Model height: 184 cm',
    composition: row.composition || '100% Cotton',
    garmentType: row.garment_type || 'top',
    fitScore: row.fit_score || '98% Anatomical Fit',
    stockQuantity: Number(row.stock_quantity ?? 50),
    isPublished: row.is_published !== false,
    sortOrder: Number(row.sort_order ?? 0)
  };
}

export function mapAppProductToDb(p, sortOrder = 0) {
  const slug =
    (p.slug || `${p.name || 'item'}-${p.id || Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const primaryImg = p.img || p.images?.[0] || p.colorVariants?.[0]?.images?.[0] || '';
  return {
    id: p.id,
    slug,
    name: p.name,
    category: p.category || 'Jackets',
    gender: ['MEN', 'WOMEN', 'UNISEX'].includes((p.gender || '').toUpperCase())
      ? p.gender.toUpperCase()
      : 'MEN',
    price: Number(p.price ?? 0),
    original_price: p.originalPrice != null && p.originalPrice !== '' ? Number(p.originalPrice) : null,
    discount: p.discount || null,
    badge: p.badge || null,
    img: primaryImg,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [primaryImg].filter(Boolean),
    color_variants: Array.isArray(p.colorVariants) ? p.colorVariants : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : ['S', 'M', 'L', 'XL'],
    description: p.description || '',
    model_height: p.modelHeight || 'Model height: 184 cm',
    composition: p.composition || '100% Cotton',
    garment_type: p.garmentType || 'top',
    fit_score: p.fitScore || '98% Anatomical Fit',
    stock_quantity: Number(p.stockQuantity ?? 50),
    is_published: p.isPublished !== false,
    sort_order: p.sortOrder ?? sortOrder
  };
}

export function loadLocalStoreData() {
  const saved = safeReadJson(STORE_DATA_KEY, null);
  if (!saved) return defaultKronosData;
  return {
    ...defaultKronosData,
    ...saved,
    brand: { ...defaultKronosData.brand, ...(saved.brand || {}) },
    theme: { ...defaultKronosData.theme, ...(saved.theme || {}) },
    currency: { ...defaultKronosData.currency, ...(saved.currency || {}) },
    navigation: { ...defaultKronosData.navigation, ...(saved.navigation || {}) },
    hero: { ...defaultKronosData.hero, ...(saved.hero || {}) },
    about: { ...defaultKronosData.about, ...(saved.about || {}) },
    manifesto: { ...defaultKronosData.manifesto, ...(saved.manifesto || {}) },
    lookbook: { ...defaultKronosData.lookbook, ...(saved.lookbook || {}) },
    giftCard: { ...defaultKronosData.giftCard, ...(saved.giftCard || {}) },
    drops: { ...defaultKronosData.drops, ...(saved.drops || {}) },
    featuresSection: { ...defaultKronosData.featuresSection, ...(saved.featuresSection || {}) },
    categoriesSection: { ...defaultKronosData.categoriesSection, ...(saved.categoriesSection || {}) },
    sectionHeaders: { ...defaultKronosData.sectionHeaders, ...(saved.sectionHeaders || {}) },
    footer: { ...defaultKronosData.footer, ...(saved.footer || {}) },
    stores: Array.isArray(saved.stores) && saved.stores.length > 0 ? saved.stores : defaultKronosData.stores,
    reviews: Array.isArray(saved.reviews) && saved.reviews.length > 0 ? saved.reviews : defaultKronosData.reviews,
    faqs: Array.isArray(saved.faqs) && saved.faqs.length > 0 ? saved.faqs : defaultKronosData.faqs,
    products: Array.isArray(saved.products) && saved.products.length > 0 ? saved.products : defaultKronosData.products
  };
}

export function saveLocalStoreData(data) {
  safeWriteJson(STORE_DATA_KEY, data);
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('kronos_store_sync');
      ch.postMessage({ type: 'STORE_UPDATED', ts: Date.now() });
      ch.close();
    }
  } catch {
    // ignore BroadcastChannel failures
  }
}

/**
 * Hydrates storefront/admin data from Supabase if configured and non-empty.
 */
export async function fetchStorefrontFromSupabase({ includeUnpublished = false } = {}) {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    let prodQuery = sb.from('products').select('*').order('sort_order', { ascending: true });
    if (!includeUnpublished) {
      prodQuery = prodQuery.eq('is_published', true);
    }

    const [{ data: productRows, error: prodErr }, { data: settingRows, error: setErr }] = await Promise.all([
      prodQuery,
      sb.from('site_settings').select('key, value')
    ]);

    if (prodErr) console.warn('[Supabase] products read:', prodErr.message);
    if (setErr) console.warn('[Supabase] site_settings read:', setErr.message);

    const patch = {};
    if (Array.isArray(settingRows) && settingRows.length > 0) {
      settingRows.forEach((row) => {
        if (row.key && row.value !== undefined) {
          patch[row.key] = row.value;
        }
      });
    }
    if (Array.isArray(productRows) && productRows.length > 0) {
      patch.products = productRows.map(mapDbProductToApp).filter(Boolean);
    }
    return Object.keys(patch).length > 0 ? patch : null;
  } catch (err) {
    console.warn('[Supabase] fetchStorefrontFromSupabase exception:', err);
    return null;
  }
}

async function getAuthenticatedSession(sb) {
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}

function emitAdminAuthEvent(eventName, detail) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  } catch {
    // ignore dispatch failures outside browser
  }
}

export async function upsertProductInSupabase(product, sortOrder = 0) {
  const sb = getSupabase();
  if (!sb) return { ok: false, localOnly: true };
  const session = await getAuthenticatedSession(sb);
  if (!session) {
    return {
      ok: false,
      authRequired: true,
      error: 'Sign in with montassarzarai0@gmail.com to save products to Supabase'
    };
  }
  try {
    const dbRow = mapAppProductToDb(product, sortOrder);
    const { error } = await sb.from('products').upsert(dbRow, { onConflict: 'id' });
    if (error) return { ok: false, rlsBlocked: /row-level security/i.test(error.message), error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function deleteProductInSupabase(productId) {
  const sb = getSupabase();
  if (!sb) return { ok: false, localOnly: true };
  const session = await getAuthenticatedSession(sb);
  if (!session) {
    return {
      ok: false,
      authRequired: true,
      error: 'Sign in with montassarzarai0@gmail.com to delete products from Supabase'
    };
  }
  try {
    const { error } = await sb.from('products').delete().eq('id', productId);
    if (error) return { ok: false, rlsBlocked: /row-level security/i.test(error.message), error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function saveSiteSettingInSupabase(key, section, value) {
  const sb = getSupabase();
  if (!sb) return { ok: false, localOnly: true };
  const session = await getAuthenticatedSession(sb);
  if (!session) {
    return {
      ok: false,
      authRequired: true,
      error: `Sign in with montassarzarai0@gmail.com to save ${key} to Supabase`
    };
  }
  try {
    const { error } = await sb
      .from('site_settings')
      .upsert({ key, section, value }, { onConflict: 'key' });
    if (error) return { ok: false, rlsBlocked: /row-level security/i.test(error.message), error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Push all local catalog products & site settings to Supabase in one action.
 */
export async function syncAllStorefrontToSupabase(storeData) {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Supabase is not configured yet.' };
  const session = await getAuthenticatedSession(sb);
  if (!session) {
    emitAdminAuthEvent(
      'kronos:require-admin-auth',
      'Sign in with montassarzarai0@gmail.com to sync catalog & storefront data to Supabase.'
    );
    return {
      ok: false,
      authRequired: true,
      error: 'Sign in with montassarzarai0@gmail.com first to sync to Supabase.'
    };
  }

  try {
    const settingMap = [
      ['brand', 'identity'],
      ['theme', 'appearance'],
      ['currency', 'commerce'],
      ['navigation', 'navigation'],
      ['hero', 'sections'],
      ['about', 'sections'],
      ['manifesto', 'sections'],
      ['featuresSection', 'sections'],
      ['categoriesSection', 'sections'],
      ['sectionHeaders', 'sections'],
      ['lookbook', 'media'],
      ['giftCard', 'commerce'],
      ['drops', 'sections'],
      ['reviews', 'social_proof'],
      ['stores', 'contact'],
      ['footer', 'contact'],
      ['faqs', 'support']
    ];

    const settingsPayload = settingMap.map(([key, section]) => ({
      key,
      section,
      value: storeData[key] ?? defaultKronosData[key]
    }));

    const { error: setErr } = await sb
      .from('site_settings')
      .upsert(settingsPayload, { onConflict: 'key' });
    if (setErr) return { ok: false, error: `site_settings sync failed: ${setErr.message}` };

    const productsPayload = (storeData.products || []).map((p, idx) => mapAppProductToDb(p, idx + 1));
    if (productsPayload.length > 0) {
      const { error: prodErr } = await sb
        .from('products')
        .upsert(productsPayload, { onConflict: 'id' });
      if (prodErr) return { ok: false, error: `products sync failed: ${prodErr.message}` };
    }

    return { ok: true, count: productsPayload.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/* ── Media Vault (Supabase Storage: Images, Videos, Documents) ─────────────── */

export function detectMediaBucket(mediaType, mimeType = '') {
  if (mediaType === 'video' || mimeType.startsWith('video/')) {
    return { mediaType: 'video', bucket: 'kronos-videos' };
  }
  if (
    mediaType === 'document' ||
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.startsWith('text/')
  ) {
    return { mediaType: 'document', bucket: 'kronos-documents' };
  }
  return { mediaType: 'image', bucket: 'kronos-images' };
}

export function getLocalMediaAssets() {
  const list = safeReadJson(MEDIA_STORAGE_KEY, null);
  return Array.isArray(list) && list.length > 0 ? list : DEFAULT_MEDIA_ASSETS;
}

export function saveLocalMediaAssets(list) {
  safeWriteJson(MEDIA_STORAGE_KEY, list);
}

export async function fetchMediaAssets() {
  const local = getLocalMediaAssets();
  const sb = getSupabase();
  if (!sb) return local;

  try {
    const { data, error } = await sb
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      saveLocalMediaAssets(data);
      return data;
    }
  } catch (err) {
    console.warn('[Supabase] media_assets fetch failed:', err);
  }
  return local;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadMediaAsset(file, options = {}) {
  const { mediaType: requestedType, title, linkedEntityType = 'general', linkedEntityId = '', notes = '' } = options;
  const { mediaType, bucket } = detectMediaBucket(requestedType, file.type);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const storagePath = `${mediaType}s/${Date.now()}-${safeName}`;

  const sb = getSupabase();
  let cloudError = '';
  let authRequired = false;
  if (sb) {
    const session = await getAuthenticatedSession(sb);
    if (!session) {
      authRequired = true;
      cloudError = 'Sign in with montassarzarai0@gmail.com to upload files to Supabase Storage';
      emitAdminAuthEvent('kronos:require-admin-auth', cloudError);
    } else {
      try {
        const { error: uploadErr } = await sb.storage
          .from(bucket)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || undefined
          });

        if (!uploadErr) {
          const { data: pub } = sb.storage.from(bucket).getPublicUrl(storagePath);
          const publicUrl = pub?.publicUrl;

          const record = {
            title: title || file.name,
            media_type: mediaType,
            bucket_name: bucket,
            storage_path: storagePath,
            public_url: publicUrl,
            mime_type: file.type || 'application/octet-stream',
            file_size_bytes: file.size || 0,
            linked_entity_type: linkedEntityType,
            linked_entity_id: linkedEntityId,
            notes
          };

          const { data: inserted, error: regErr } = await sb
            .from('media_assets')
            .insert(record)
            .select('*')
            .single();

          if (!regErr && inserted) {
            const prev = getLocalMediaAssets();
            saveLocalMediaAssets([inserted, ...prev]);
            return { ok: true, cloud: true, publicUrl, asset: inserted };
          }
          // Even if registry insert wasn't permitted, return Storage public URL
          const fallbackAsset = { id: `tmp-${Date.now()}`, ...record, created_at: new Date().toISOString() };
          const prev = getLocalMediaAssets();
          saveLocalMediaAssets([fallbackAsset, ...prev]);
          return { ok: true, cloud: true, publicUrl, asset: fallbackAsset };
        }
        cloudError = uploadErr.message || 'Row-level security policy blocked Storage upload';
        console.warn('[Supabase Storage] upload fallback to local:', cloudError);
        if (/row-level security|permission/i.test(cloudError)) {
          emitAdminAuthEvent('kronos:require-admin-profile-sql', cloudError);
        }
      } catch (err) {
        cloudError = err?.message || 'Storage exception';
        console.warn('[Supabase Storage] upload exception, falling back local:', err);
      }
    }
  }

  // Local browser preview fallback (capped reasonably for localStorage safety)
  let previewUrl = '';
  if (file.size <= 2 * 1024 * 1024) {
    previewUrl = await fileToDataUrl(file);
  } else {
    previewUrl = URL.createObjectURL(file);
  }

  const localAsset = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: title || file.name,
    media_type: mediaType,
    bucket_name: bucket,
    storage_path: storagePath,
    public_url: previewUrl,
    mime_type: file.type || 'application/octet-stream',
    file_size_bytes: file.size || 0,
    linked_entity_type: linkedEntityType,
    linked_entity_id: linkedEntityId,
    notes: notes ? `${notes} (local draft)` : 'Local session preview (connect Supabase Storage to host permanently)',
    created_at: new Date().toISOString()
  };

  const current = getLocalMediaAssets();
  saveLocalMediaAssets([localAsset, ...current.slice(0, 60)]);
  return { ok: true, cloud: false, authRequired, cloudError, publicUrl: previewUrl, asset: localAsset };
}

export async function deleteMediaAssetItem(asset) {
  const current = getLocalMediaAssets().filter((a) => a.id !== asset.id);
  saveLocalMediaAssets(current);

  const sb = getSupabase();
  if (sb && asset?.id && !String(asset.id).startsWith('local-') && !String(asset.id).startsWith('seed-')) {
    const session = await getAuthenticatedSession(sb);
    if (!session) return current;
    try {
      if (asset.bucket_name && asset.storage_path) {
        await sb.storage.from(asset.bucket_name).remove([asset.storage_path]);
      }
      await sb.from('media_assets').delete().eq('id', asset.id);
    } catch (err) {
      console.warn('[Supabase] delete media error:', err);
    }
  }
  return current;
}

/* ── Orders (Commandes) Engine ─────────────────────────────────────────────── */

export function getLocalOrders() {
  const saved = safeReadJson(ORDERS_STORAGE_KEY, null);
  if (Array.isArray(saved) && saved.length > 0) return saved;

  // Initial starter order so admin immediately sees structured commande layout
  const seedOrders = [
    {
      id: 'ord-seed-1',
      order_number: 'KRN-261113-8F2A1C',
      customer_name: 'Youssef Ben Ali',
      customer_email: 'youssef.benali@example.tn',
      customer_phone: '+216 55 240 819',
      shipping_address: '18 Avenue Habib Bourguiba, Apt 4',
      city: 'Tunis',
      postal_code: '1000',
      country: 'Tunisia',
      notes: 'Deliver between 14:00 and 18:00 please.',
      items: [
        {
          id: 'zara-m1',
          name: 'TEXTURED CHECK CROPPED FIT JACKET',
          size: 'L',
          color: 'red/navy',
          quantity: 1,
          price: 299.0,
          img: defaultKronosData.products[1]?.img || ''
        }
      ],
      subtotal_tnd: 299.0,
      discount_tnd: 0,
      shipping_tnd: 8.0,
      total_tnd: 307.0,
      currency_code: 'TND',
      promo_code: null,
      payment_method: 'cash_on_delivery',
      status: 'confirmed',
      created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
    }
  ];
  safeWriteJson(ORDERS_STORAGE_KEY, seedOrders);
  return seedOrders;
}

export function saveLocalOrders(orders) {
  safeWriteJson(ORDERS_STORAGE_KEY, orders);
}

export async function fetchOrders() {
  const local = getLocalOrders();
  const sb = getSupabase();
  if (!sb) return local;
  const session = await getAuthenticatedSession(sb);
  if (!session) return local;

  try {
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        saveLocalOrders(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('[Supabase] fetchOrders error:', err);
  }
  return local;
}

export async function submitCustomerOrder(payload) {
  const orderNumber =
    'KRN-' +
    new Date().toISOString().slice(2, 10).replace(/-/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const localOrder = {
    id: `ord-${Date.now()}`,
    order_number: orderNumber,
    customer_name: payload.customer_name,
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone,
    shipping_address: payload.shipping_address,
    city: payload.city || 'Tunis',
    postal_code: payload.postal_code || '',
    country: payload.country || 'Tunisia',
    notes: payload.notes || '',
    items: payload.items || [],
    subtotal_tnd: Number(payload.subtotal_tnd || 0),
    discount_tnd: Number(payload.discount_tnd || 0),
    shipping_tnd: Number(payload.shipping_tnd || 0),
    total_tnd: Number(payload.total_tnd || 0),
    currency_code: payload.currency_code || 'TND',
    promo_code: payload.promo_code || null,
    payment_method: payload.payment_method || 'cash_on_delivery',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // Always save locally immediately so admin Commandes reflects it right away
  const existing = getLocalOrders();
  saveLocalOrders([localOrder, ...existing]);

  const sb = getSupabase();
  if (sb) {
    try {
      const { data: rpcRes, error: rpcErr } = await sb.rpc('submit_kronos_order', {
        p_customer_name: localOrder.customer_name,
        p_customer_email: localOrder.customer_email,
        p_customer_phone: localOrder.customer_phone,
        p_shipping_address: localOrder.shipping_address,
        p_city: localOrder.city,
        p_postal_code: localOrder.postal_code,
        p_country: localOrder.country,
        p_notes: localOrder.notes,
        p_items: localOrder.items,
        p_subtotal_tnd: localOrder.subtotal_tnd,
        p_discount_tnd: localOrder.discount_tnd,
        p_shipping_tnd: localOrder.shipping_tnd,
        p_total_tnd: localOrder.total_tnd,
        p_currency_code: localOrder.currency_code,
        p_promo_code: localOrder.promo_code,
        p_payment_method: localOrder.payment_method
      });

      if (!rpcErr && Array.isArray(rpcRes) && rpcRes[0]) {
        const dbOrd = { ...localOrder, id: rpcRes[0].id, order_number: rpcRes[0].order_number };
        saveLocalOrders([dbOrd, ...existing]);
        return { ok: true, cloud: true, order: dbOrd };
      }
    } catch (err) {
      console.warn('[Supabase] submit_kronos_order fallback to local:', err);
    }
  }

  return { ok: true, cloud: false, order: localOrder };
}

export async function updateOrderStatus(orderId, newStatus) {
  const orders = getLocalOrders().map((o) =>
    o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
  );
  saveLocalOrders(orders);

  const sb = getSupabase();
  if (sb && !String(orderId).startsWith('ord-')) {
    const session = await getAuthenticatedSession(sb);
    if (session) {
      try {
        await sb.from('orders').update({ status: newStatus }).eq('id', orderId);
      } catch (err) {
        console.warn('[Supabase] updateOrderStatus error:', err);
      }
    }
  }
  return orders;
}

export async function deleteOrderItem(orderId) {
  const orders = getLocalOrders().filter((o) => o.id !== orderId);
  saveLocalOrders(orders);

  const sb = getSupabase();
  if (sb && !String(orderId).startsWith('ord-')) {
    const session = await getAuthenticatedSession(sb);
    if (session) {
      try {
        await sb.from('orders').delete().eq('id', orderId);
      } catch (err) {
        console.warn('[Supabase] deleteOrderItem error:', err);
      }
    }
  }
  return orders;
}

/* ── Promo Codes & Newsletter ──────────────────────────────────────────────── */

export function getLocalPromoCodes() {
  const saved = safeReadJson(PROMOS_STORAGE_KEY, null);
  return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_PROMOS;
}

export function saveLocalPromoCodes(codes) {
  safeWriteJson(PROMOS_STORAGE_KEY, codes);
}

export async function fetchPromoCodes() {
  const local = getLocalPromoCodes();
  const sb = getSupabase();
  if (!sb) return local;
  try {
    const { data, error } = await sb
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      saveLocalPromoCodes(data);
      return data;
    }
  } catch (err) {
    console.warn('[Supabase] fetchPromoCodes error:', err);
  }
  return local;
}

export async function upsertPromoCode(promo) {
  const normalized = {
    ...promo,
    id: promo.id || `promo-${Date.now()}`,
    code: String(promo.code || '').trim().toUpperCase(),
    discount_value: Number(promo.discount_value || 0),
    min_order_tnd: Number(promo.min_order_tnd || 0),
    max_uses: promo.max_uses ? Number(promo.max_uses) : null,
    is_active: promo.is_active !== false
  };

  const current = getLocalPromoCodes();
  const exists = current.some((c) => c.id === normalized.id || c.code === normalized.code);
  const next = exists
    ? current.map((c) => (c.id === normalized.id || c.code === normalized.code ? { ...c, ...normalized } : c))
    : [normalized, ...current];
  saveLocalPromoCodes(next);

  const sb = getSupabase();
  if (sb) {
    const session = await getAuthenticatedSession(sb);
    if (!session) {
      emitAdminAuthEvent(
        'kronos:require-admin-auth',
        'Sign in with montassarzarai0@gmail.com to save promo codes to Supabase.'
      );
      return next;
    }
    try {
      const dbRow = {
        code: normalized.code,
        description: normalized.description || '',
        discount_type: normalized.discount_type || 'percentage',
        discount_value: normalized.discount_value,
        min_order_tnd: normalized.min_order_tnd,
        max_uses: normalized.max_uses,
        is_active: normalized.is_active
      };
      await sb.from('promo_codes').upsert(dbRow, { onConflict: 'code' });
    } catch (err) {
      console.warn('[Supabase] upsertPromoCode error:', err);
    }
  }
  return next;
}

export async function deletePromoCodeItem(promo) {
  const next = getLocalPromoCodes().filter((p) => p.id !== promo.id && p.code !== promo.code);
  saveLocalPromoCodes(next);

  const sb = getSupabase();
  if (sb && promo?.code) {
    const session = await getAuthenticatedSession(sb);
    if (!session) return next;
    try {
      await sb.from('promo_codes').delete().eq('code', promo.code);
    } catch (err) {
      console.warn('[Supabase] deletePromoCodeItem error:', err);
    }
  }
  return next;
}

export async function validatePromoCode(codeInput, subtotalTnd = 0) {
  const code = String(codeInput || '').trim().toUpperCase();
  if (!code) return null;

  const sb = getSupabase();
  if (sb) {
    try {
      const { data } = await sb.rpc('validate_promo_code', { p_code: code });
      if (Array.isArray(data) && data[0]) {
        const p = data[0];
        if (subtotalTnd >= Number(p.min_order_tnd || 0)) {
          return p;
        }
        return { error: `Minimum order of ${p.min_order_tnd} DT required for ${p.code}` };
      }
    } catch {
      // fallback to local list
    }
  }

  const found = getLocalPromoCodes().find(
    (p) => p.code.toUpperCase() === code && p.is_active !== false
  );
  if (!found) return { error: 'Invalid or expired promo code' };
  if (subtotalTnd < Number(found.min_order_tnd || 0)) {
    return { error: `Minimum order of ${found.min_order_tnd} DT required for ${found.code}` };
  }
  return found;
}

export function getLocalNewsletterSubscribers() {
  const saved = safeReadJson(NEWSLETTER_STORAGE_KEY, null);
  return Array.isArray(saved) ? saved : [];
}

export async function subscribeNewsletter(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return { ok: false, error: 'Invalid email' };

  const current = getLocalNewsletterSubscribers();
  if (!current.some((s) => s.email === cleanEmail)) {
    safeWriteJson(NEWSLETTER_STORAGE_KEY, [
      { id: `sub-${Date.now()}`, email: cleanEmail, source: 'footer', created_at: new Date().toISOString() },
      ...current
    ]);
  }

  const sb = getSupabase();
  if (sb) {
    try {
      await sb
        .from('newsletter_subscribers')
        .upsert({ email: cleanEmail, source: 'footer', is_subscribed: true }, { onConflict: 'email' });
    } catch (err) {
      console.warn('[Supabase] subscribeNewsletter error:', err);
    }
  }
  return { ok: true };
}

export async function fetchNewsletterSubscribers() {
  const local = getLocalNewsletterSubscribers();
  const sb = getSupabase();
  if (!sb) return local;
  const session = await getAuthenticatedSession(sb);
  if (!session) return local;
  try {
    const { data, error } = await sb
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      safeWriteJson(NEWSLETTER_STORAGE_KEY, data);
      return data;
    }
  } catch (err) {
    console.warn('[Supabase] fetchNewsletterSubscribers error:', err);
  }
  return local;
}

