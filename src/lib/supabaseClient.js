import { createClient } from '@supabase/supabase-js';

const RUNTIME_CFG_KEY = 'kronos_supabase_runtime_cfg_v1';

let cachedClient = null;
let cachedSignature = '';

export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

  let rtUrl = '';
  let rtKey = '';
  try {
    const raw = localStorage.getItem(RUNTIME_CFG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      rtUrl = (parsed?.url || '').trim();
      rtKey = (parsed?.anonKey || '').trim();
    }
  } catch {
    // ignore invalid local config
  }

  const url = (rtUrl || envUrl).replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  const anonKey = rtKey || envKey;
  const source = rtUrl && rtKey ? 'runtime-admin' : envUrl && envKey ? 'env' : 'unconfigured';

  return {
    url,
    anonKey,
    source,
    configured: Boolean(
      url &&
      anonKey &&
      !url.includes('YOUR_PROJECT_REF') &&
      !anonKey.includes('YOUR_SUPABASE')
    )
  };
}

export function isSupabaseConfigured() {
  return getSupabaseCredentials().configured;
}

export function getSupabase() {
  const { url, anonKey, configured } = getSupabaseCredentials();
  if (!configured) return null;

  const sig = `${url}::${anonKey}`;
  if (cachedClient && cachedSignature === sig) {
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  cachedSignature = sig;
  return cachedClient;
}

export function saveRuntimeSupabaseConfig(url, anonKey) {
  const cleanUrl = (url || '').trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  const cleanKey = (anonKey || '').trim();
  localStorage.setItem(RUNTIME_CFG_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
  cachedClient = null;
  cachedSignature = '';
}

export function clearRuntimeSupabaseConfig() {
  localStorage.removeItem(RUNTIME_CFG_KEY);
  cachedClient = null;
  cachedSignature = '';
}

