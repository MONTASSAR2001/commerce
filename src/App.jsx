import React, { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react';
import { sanitizeSafeExternalUrl } from './lib/urlSafety';
export { sanitizeSafeExternalUrl };
import { defaultKronosData } from './data/defaultRawlineData';
import { getSupabase, isSupabaseConfigured } from './lib/supabaseClient';
import {
  loadLocalStoreData,
  saveLocalStoreData,
  fetchStorefrontFromSupabase,
  subscribeStorefrontRealtime,
  upsertProductInSupabase,
  deleteProductInSupabase,
  saveSiteSettingInSupabase,
  uploadMediaAsset
} from './lib/kronosDataService';

const RawlineMasterEngine = lazy(() => import('./components/RawlineMasterEngine'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const RAW_APP_MODE = (import.meta.env.VITE_APP_MODE || 'all').toLowerCase().trim();
const APP_MODE = RAW_APP_MODE === 'store' || RAW_APP_MODE === 'admin' ? RAW_APP_MODE : 'all';
const STOREFRONT_URL = sanitizeSafeExternalUrl(import.meta.env.VITE_STOREFRONT_URL);
const ADMIN_URL = sanitizeSafeExternalUrl(import.meta.env.VITE_ADMIN_URL);

function isAdminPath(pathname = '', hash = '') {
  const cleanPath = (pathname || '').replace(/\/+$/, '');
  return (
    cleanPath === '/admin' ||
    cleanPath === '/admin.html' ||
    cleanPath === '/admin-kronos-2026' ||
    cleanPath === '/dashboard' ||
    hash === '#admin'
  );
}

function resolveIsAdminRoute(pathname = '', hash = '') {
  if (APP_MODE === 'admin') return true;
  if (APP_MODE === 'store') return false;
  return isAdminPath(pathname, hash);
}

const SETTING_SECTIONS = {
  brand: 'identity',
  theme: 'appearance',
  currency: 'commerce',
  navigation: 'navigation',
  hero: 'sections',
  about: 'sections',
  manifesto: 'sections',
  featuresSection: 'sections',
  categoriesSection: 'sections',
  sectionHeaders: 'sections',
  lookbook: 'media',
  giftCard: 'commerce',
  drops: 'sections',
  reviews: 'social_proof',
  stores: 'contact',
  footer: 'contact',
  faqs: 'support'
};

export default function App() {
  const [isFittingLabOpen, setIsFittingLabOpen] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() =>
    typeof window !== 'undefined'
      ? resolveIsAdminRoute(window.location.pathname, window.location.hash)
      : APP_MODE === 'admin'
  );

  // Load persisted storefront + admin edits (falls back to defaultKronosData)
  const [data, setData] = useState(() => loadLocalStoreData());
  const dataRef = useRef(data);
  dataRef.current = data;
  const lastSyncRef = useRef(0);

  // Listen to browser navigation & navigate cleanly between storefront and independent Admin Studio
  useEffect(() => {
    const syncRoute = () => {
      setIsAdminRoute(resolveIsAdminRoute(window.location.pathname, window.location.hash));
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const navigateTo = useCallback((targetPath = '/') => {
    const wantsAdmin = isAdminPath(targetPath, '');
    if (APP_MODE === 'admin' && !wantsAdmin) {
      if (STOREFRONT_URL) {
        const dest = `${STOREFRONT_URL}${targetPath === '/' ? '' : targetPath}`;
        window.open(dest, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    if (APP_MODE === 'store' && wantsAdmin) {
      if (ADMIN_URL) {
        window.open(ADMIN_URL, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    try {
      window.history.pushState({}, '', targetPath);
    } catch {
      // ignore sandbox history errors
    }
    setIsAdminRoute(resolveIsAdminRoute(targetPath, ''));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Hydrate from Supabase if configured + keep synced via Realtime, Auth changes & tab focus
  useEffect(() => {
    let active = true;

    const refreshFromCloud = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastSyncRef.current < 2000) return;
      lastSyncRef.current = now;
      const patch = await fetchStorefrontFromSupabase({ includeUnpublished: isAdminRoute });
      if (active && patch) {
        setData((prev) => {
          const merged = { ...prev, ...patch };
          saveLocalStoreData(merged);
          return merged;
        });
      }
    };

    refreshFromCloud(true);

    const unsubscribeRealtime = subscribeStorefrontRealtime(() => refreshFromCloud(true));

    const sb = getSupabase();
    let authSub = null;
    if (sb && isAdminRoute) {
      const { data: sub } = sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          refreshFromCloud(true);
        }
      });
      authSub = sub?.subscription || null;
    }

    const onFocus = () => refreshFromCloud(false);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshFromCloud(false);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      unsubscribeRealtime?.();
      authSub?.unsubscribe?.();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAdminRoute]);

  // Persist to localStorage on change & broadcast to other open tabs (Storefront <-> Admin)
  useEffect(() => {
    saveLocalStoreData(data);
    const activeBrand = data?.brand?.name || 'K';
    document.title = isAdminRoute
      ? `${activeBrand} — Independent Admin Studio`
      : `${activeBrand} — Unfiltered, High-Contrast Streetwear`;
  }, [data, isAdminRoute]);

  useEffect(() => {
    const syncFromLocal = () => {
      setData(loadLocalStoreData());
    };
    const onStorage = (e) => {
      if (!e.key || e.key === 'kronos_store_data_v8_dynamic') {
        syncFromLocal();
      }
    };
    window.addEventListener('storage', onStorage);
    let ch = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        ch = new BroadcastChannel('kronos_store_sync');
        ch.onmessage = () => syncFromLocal();
      }
    } catch {
      // ignore BroadcastChannel failures
    }
    return () => {
      window.removeEventListener('storage', onStorage);
      ch?.close();
    };
  }, []);

  const notifySyncError = (res, label) => {
    if (!res || res.ok !== false || res.localOnly) return;
    if (res.authRequired) {
      window.dispatchEvent(
        new CustomEvent('kronos:require-admin-auth', {
          detail: `${label}: ${res.error || 'Sign in with montassarzarai0@gmail.com'}`
        })
      );
      return;
    }
    if (res.rlsBlocked || /row-level security/i.test(res.error || '')) {
      window.dispatchEvent(
        new CustomEvent('kronos:require-admin-profile-sql', {
          detail: `${label}: ${res.error}`
        })
      );
    }
    if (res.error) {
      window.dispatchEvent(
        new CustomEvent('kronos:supabase-sync-error', {
          detail: `${label}: ${res.error}`
        })
      );
    }
  };

  // Update specific field helper (supports top-level key like 'footer' or nested path like 'hero.bgImage')
  const handleUpdateField = useCallback((fieldPath, value) => {
    setData((prev) => {
      const updated = { ...prev };
      const keys = fieldPath.split('.');
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...(current[key] || {}) };
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;

      const rootKey = keys[0];
      if (SETTING_SECTIONS[rootKey]) {
        saveSiteSettingInSupabase(rootKey, SETTING_SECTIONS[rootKey], updated[rootKey]).then((res) =>
          notifySyncError(res, `Settings (${rootKey})`)
        );
      }
      return updated;
    });
  }, []);

  // Add Product (awaited against Supabase when configured so Admin stays 100% synced)
  const handleAddProduct = useCallback(async (newProduct) => {
    const created = {
      id: `prod-${Date.now()}`,
      name: 'NEW STREETWEAR PIECE',
      price: 180,
      category: 'Jackets',
      gender: 'MEN',
      stockQuantity: 50,
      availabilityStatus: 'in_stock',
      inStock: true,
      isPublished: true,
      ...newProduct
    };
    if (isSupabaseConfigured()) {
      const res = await upsertProductInSupabase(created, 0);
      if (!res?.ok) {
        notifySyncError(res, 'Supabase Product Save');
        return res;
      }
    }
    setData((prev) => ({ ...prev, products: [created, ...(prev.products || [])] }));
    return { ok: true, product: created };
  }, []);

  // Update Product (awaited against Supabase when configured so Admin stays 100% synced)
  const handleUpdateProduct = useCallback(async (id, updates) => {
    const currentList = dataRef.current?.products || [];
    const idx = currentList.findIndex((p) => p.id === id);
    if (idx === -1) return { ok: false, error: 'Product not found' };
    const updatedProd = { ...currentList[idx], ...updates };
    if (isSupabaseConfigured()) {
      const res = await upsertProductInSupabase(updatedProd, idx + 1);
      if (!res?.ok) {
        notifySyncError(res, 'Supabase Product Save');
        return res;
      }
    }
    setData((prev) => ({
      ...prev,
      products: (prev.products || []).map((p) => (p.id === id ? { ...p, ...updates } : p))
    }));
    return { ok: true, product: updatedProd };
  }, []);

  // Delete Product (verified in Supabase first so deleted items never ghost on main storefront)
  const handleDeleteProduct = useCallback(async (id) => {
    if (isSupabaseConfigured()) {
      const res = await deleteProductInSupabase(id);
      if (!res?.ok) {
        notifySyncError(res, 'Supabase Product Delete');
        return res;
      }
    }
    setData((prev) => ({
      ...prev,
      products: (prev.products || []).filter((p) => p.id !== id)
    }));
    return { ok: true, deletedId: id };
  }, []);

  // Hydrate or Reset Defaults
  const handleHydrateData = useCallback((patch) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setData(defaultKronosData);
    saveLocalStoreData(defaultKronosData);
  }, []);

  // Image upload helper (uses Supabase Storage when connected, data URL fallback otherwise)
  const handleUploadImage = useCallback(async (file) => {
    const res = await uploadMediaAsset(file, {
      mediaType: 'image',
      linkedEntityType: 'storefront'
    });
    return res?.publicUrl;
  }, []);

  const handleOpenAdminAction =
    APP_MODE === 'store'
      ? ADMIN_URL
        ? () => window.open(ADMIN_URL, '_blank', 'noopener,noreferrer')
        : null
      : () => navigateTo('/admin-kronos-2026');

  const loaderFallback = (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] text-[#FFFFE3] font-mono text-xs tracking-widest uppercase">
      Loading K...
    </div>
  );

  if (isAdminRoute) {
    return (
      <Suspense fallback={loaderFallback}>
        <AdminDashboard
          data={data}
          onUpdateField={handleUpdateField}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onHydrateData={handleHydrateData}
          onResetDefaults={handleResetDefaults}
          onNavigateStore={navigateTo}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFE3] font-sans selection:bg-[#EA301F] selection:text-white">
      <Suspense fallback={loaderFallback}>
        <RawlineMasterEngine
          data={data}
          onUpdateField={handleUpdateField}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          uploadImage={handleUploadImage}
          isStore={true}
          hasTopNav={false}
          externalFittingLabOpen={isFittingLabOpen}
          onCloseFittingLab={() => setIsFittingLabOpen(false)}
          onOpenAdmin={handleOpenAdminAction}
        />
      </Suspense>
    </div>
  );
}
