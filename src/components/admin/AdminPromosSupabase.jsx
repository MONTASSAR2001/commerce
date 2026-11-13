import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Users,
  Mail,
  Phone,
  Database,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  RotateCcw,
  Lock,
  LogOut,
  FileCode2,
  KeyRound,
  Download
} from 'lucide-react';
import {
  getSupabase,
  getSupabaseCredentials,
  saveRuntimeSupabaseConfig,
  clearRuntimeSupabaseConfig
} from '../../lib/supabaseClient';
import {
  syncAllStorefrontToSupabase,
  upsertPromoCode,
  deletePromoCodeItem
} from '../../lib/kronosDataService';

/* ── 5. PROMO CODES, SOCIAL WALL REVIEWS & FAQS MANAGER ─────────────────────── */
export function PromoReviewsTab({
  promos = [],
  onPromosChange,
  faqs = [],
  reviews = [],
  onUpdateField,
  onNotify
}) {
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('20');
  const [minOrder, setMinOrder] = useState('100');
  const [desc, setDesc] = useState('');

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    const next = await upsertPromoCode({
      code: newCode,
      discount_type: discountType,
      discount_value: Number(discountValue || 10),
      min_order_tnd: Number(minOrder || 0),
      description: desc || 'Custom KRONOS VIP Voucher',
      is_active: true
    });
    onPromosChange(next);
    setNewCode('');
    setDesc('');
    onNotify?.(`Created promo code ${newCode.toUpperCase()}`);
  };

  return (
    <div className="space-y-6 font-geist text-xs">
      {/* Create Promo Form */}
      <form
        onSubmit={handleCreatePromo}
        className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-[#f7efe9] space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
              create checkout promo code
            </h4>
            <p className="text-[#171717]/70">
              Validated live in customer Cart Checkout & tracked in Supabase `promo_codes`.
            </p>
          </div>
          <span className="superr-tag bg-white">{promos.filter((p) => p.is_active).length} active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="font-bold block mb-1">Code *</label>
            <input
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="TUNIS20"
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white font-mono font-bold uppercase"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (DT)</option>
            </select>
          </div>
          <div>
            <label className="font-bold block mb-1">
              Value ({discountType === 'percentage' ? '%' : 'DT'})
            </label>
            <input
              type="number"
              min="1"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white font-mono font-bold"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Min Order (DT)</label>
            <input
              type="number"
              min="0"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white font-mono"
            />
          </div>
          <button type="submit" className="superr-pill-btn-primary py-2.5 justify-center">
            <Plus className="w-4 h-4" />
            <span>Create Code</span>
          </button>
        </div>
      </form>

      {/* Promos Table */}
      <div className="overflow-x-auto rounded-[12px] border-[1.5px] border-[#171717] bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-[1.5px] border-[#171717] bg-[#f7efe9] text-[10px] font-mono uppercase">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-3">Discount</th>
              <th className="py-3 px-3">Min Spend</th>
              <th className="py-3 px-3">Uses</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171717]/15">
            {promos.map((p) => (
              <tr key={p.id || p.code}>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border border-[#171717] bg-[#fdfbf9] font-mono font-extrabold">
                    <Tag className="w-3 h-3 text-[#ff6f1e]" />
                    {p.code}
                  </span>
                  {p.description && (
                    <p className="text-[11px] text-[#171717]/65 mt-1">{p.description}</p>
                  )}
                </td>
                <td className="py-3 px-3 font-mono font-bold text-[#c2410c]">
                  {p.discount_type === 'percentage'
                    ? `${p.discount_value}% OFF`
                    : `${p.discount_value} DT OFF`}
                </td>
                <td className="py-3 px-3 font-mono">{Number(p.min_order_tnd || 0)} DT</td>
                <td className="py-3 px-3 font-mono">{p.used_count || 0}</td>
                <td className="py-3 px-3">
                  <button
                    onClick={async () => {
                      const next = await upsertPromoCode({ ...p, is_active: !p.is_active });
                      onPromosChange(next);
                      onNotify?.(`${p.code} -> ${!p.is_active ? 'active' : 'paused'}`);
                    }}
                    className={`px-2.5 py-1 rounded-[14px] border border-[#171717] text-[10px] font-bold cursor-pointer ${
                      p.is_active ? 'bg-[#22c55e]/20 text-emerald-900' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {p.is_active ? 'ACTIVE' : 'PAUSED'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={async () => {
                      const next = await deletePromoCodeItem(p);
                      onPromosChange(next);
                      onNotify?.(`Deleted code ${p.code}`);
                    }}
                    className="p-1.5 rounded-[10px] border border-[#171717] bg-white hover:bg-red-50 text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQs Editor */}
      <div className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
            storefront faqs editor ({faqs.length})
          </h4>
          <button
            onClick={() => {
              onUpdateField('faqs', [
                ...faqs,
                { q: 'New Question?', a: 'Detailed answer shown on the KRONOS storefront.' }
              ]);
              onNotify?.('Added FAQ entry');
            }}
            className="superr-pill-btn py-1.5 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add FAQ
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-3 rounded-[10px] border border-[#171717] bg-[#fdfbf9] space-y-2">
              <input
                value={faq.q}
                onChange={(e) => {
                  const next = [...faqs];
                  next[idx] = { ...faq, q: e.target.value };
                  onUpdateField('faqs', next);
                }}
                className="w-full px-2.5 py-1.5 rounded border border-[#171717] bg-white font-bold"
              />
              <textarea
                rows={2}
                value={faq.a}
                onChange={(e) => {
                  const next = [...faqs];
                  next[idx] = { ...faq, a: e.target.value };
                  onUpdateField('faqs', next);
                }}
                className="w-full px-2.5 py-1.5 rounded border border-[#171717] bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Social Wall & Customer Reviews Editor */}
      <div className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
              social wall photos & customer quotes ({reviews.length})
            </h4>
            <p className="text-[#171717]/65">
              Powers every quote tile, portrait card, and outbound social link in the storefront Social Wall.
            </p>
          </div>
          <button
            onClick={() => {
              onUpdateField('reviews', [
                ...reviews,
                {
                  id: `rev-${Date.now()}`,
                  author: '@NEW_MEMBER',
                  platform: 'Instagram',
                  socialUrl: 'https://instagram.com',
                  image: 'https://framerusercontent.com/images/4JyNJK5h7DVDfgID8lBKhy3M.jpg?width=640&height=960',
                  quote: 'Sharp heavyweight silhouette and fast delivery from the KRONOS studio.',
                  rating: 5,
                  date: 'TODAY'
                }
              ]);
              onNotify?.('Added Social Wall card');
            }}
            className="superr-pill-btn py-1.5 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Social Post
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reviews.map((rev, idx) => (
            <div key={rev.id || idx} className="p-3.5 rounded-[10px] border border-[#171717] bg-[#fdfbf9] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={rev.author || ''}
                  onChange={(e) => {
                    const next = [...reviews];
                    next[idx] = { ...rev, author: e.target.value };
                    onUpdateField('reviews', next);
                  }}
                  placeholder="@HANDLE"
                  className="px-2.5 py-1.5 rounded border border-[#171717] bg-white font-mono font-bold"
                />
                <input
                  value={rev.platform || ''}
                  onChange={(e) => {
                    const next = [...reviews];
                    next[idx] = { ...rev, platform: e.target.value };
                    onUpdateField('reviews', next);
                  }}
                  placeholder="Instagram / X / Facebook"
                  className="px-2.5 py-1.5 rounded border border-[#171717] bg-white"
                />
              </div>
              <textarea
                rows={2}
                value={rev.quote || ''}
                onChange={(e) => {
                  const next = [...reviews];
                  next[idx] = { ...rev, quote: e.target.value };
                  onUpdateField('reviews', next);
                }}
                placeholder="Customer quote"
                className="w-full px-2.5 py-1.5 rounded border border-[#171717] bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={rev.image || ''}
                  onChange={(e) => {
                    const next = [...reviews];
                    next[idx] = { ...rev, image: e.target.value };
                    onUpdateField('reviews', next);
                  }}
                  placeholder="Photo URL"
                  className="px-2.5 py-1.5 rounded border border-[#171717] bg-white font-mono text-[10px]"
                />
                <input
                  value={rev.socialUrl || ''}
                  onChange={(e) => {
                    const next = [...reviews];
                    next[idx] = { ...rev, socialUrl: e.target.value };
                    onUpdateField('reviews', next);
                  }}
                  placeholder="Social Post Link (https://...)"
                  className="px-2.5 py-1.5 rounded border border-[#171717] bg-white font-mono text-[10px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 6. CUSTOMERS CRM & NEWSLETTER SUBSCRIBERS ─────────────────────────────── */
export function CustomersNewsletterTab({ orders = [], subscribers = [] }) {
  const customers = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const email = (o.customer_email || '').toLowerCase().trim();
      if (!email) return;
      const existing = map.get(email) || {
        name: o.customer_name,
        email,
        phone: o.customer_phone,
        city: o.city,
        ordersCount: 0,
        totalSpent: 0,
        lastOrderAt: o.created_at
      };
      existing.ordersCount += 1;
      existing.totalSpent += Number(o.total_tnd || 0);
      if (new Date(o.created_at) > new Date(existing.lastOrderAt)) {
        existing.lastOrderAt = o.created_at;
        existing.phone = o.customer_phone || existing.phone;
      }
      map.set(email, existing);
    });
    return Array.from(map.values());
  }, [orders]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-geist text-xs">
      {/* Customers CRM */}
      <div className="lg:col-span-2 rounded-[14px] border-[1.5px] border-[#171717] bg-white overflow-hidden">
        <div className="p-4 bg-[#f7efe9] border-b-[1.5px] border-[#171717] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#ff6f1e]" />
            <h4 className="font-gelica font-bold text-base text-[#2b1a07] lowercase">
              customer directory ({customers.length})
            </h4>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#171717]/70">
            emails & phone numbers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#171717]/20 bg-[#fdfbf9] text-[10px] font-mono uppercase">
                <th className="py-2.5 px-3.5">Client</th>
                <th className="py-2.5 px-3">Email & Phone</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3">Orders</th>
                <th className="py-2.5 px-3.5 text-right">Lifetime (DT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/15">
              {customers.map((c) => (
                <tr key={c.email}>
                  <td className="py-3 px-3.5 font-bold text-[#2b1a07]">{c.name}</td>
                  <td className="py-3 px-3 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-[#ff6f1e]" /> {c.email}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-emerald-700" /> {c.phone}
                    </div>
                  </td>
                  <td className="py-3 px-3">{c.city}</td>
                  <td className="py-3 px-3 font-mono font-bold">{c.ordersCount}</td>
                  <td className="py-3 px-3.5 text-right font-mono font-extrabold">
                    {c.totalSpent.toFixed(2)} DT
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Newsletter Subscribers */}
      <div className="rounded-[14px] border-[1.5px] border-[#171717] bg-white overflow-hidden">
        <div className="p-4 bg-[#f7efe9] border-b-[1.5px] border-[#171717] flex items-center justify-between">
          <h4 className="font-gelica font-bold text-base text-[#2b1a07] lowercase">
            newsletter emails ({subscribers.length})
          </h4>
        </div>
        <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
          {subscribers.length === 0 ? (
            <p className="text-center py-8 text-[#171717]/60">
              Footer newsletter signups appear here automatically.
            </p>
          ) : (
            subscribers.map((sub, i) => (
              <div
                key={sub.id || i}
                className="p-2.5 rounded-[10px] border border-[#171717] bg-[#fdfbf9] flex items-center justify-between"
              >
                <span className="font-mono text-[11px] font-bold truncate">{sub.email}</span>
                <span className="text-[9px] font-mono text-emerald-700 font-bold">SUBSCRIBED</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 7. SUPABASE CONNECTION, ADMIN AUTH & SQL ENGINE TAB ───────────────────── */
export function SupabaseEngineTab({
  storeData,
  sessionUser,
  onSessionChange,
  onPullFromSupabase,
  onResetDefaults,
  onNotify
}) {
  const creds = getSupabaseCredentials();
  const [urlInput, setUrlInput] = useState(creds.url);
  const [anonInput, setAnonInput] = useState(creds.anonKey);
  const [authEmail, setAuthEmail] = useState(
    import.meta.env.VITE_KRONOS_ADMIN_EMAIL || 'montassarzarai0@gmail.com'
  );
  const [authPassword, setAuthPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    saveRuntimeSupabaseConfig(urlInput, anonInput);
    onNotify?.('Saved Supabase project URL & Anon Key!');
  };

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      onNotify?.('Configure Supabase URL & Anon Key first.');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword
      });
      if (error) {
        onNotify?.(`Auth failed: ${error.message}`);
      } else {
        const user = data.user || null;
        onSessionChange?.(user);
        if (user) {
          const { data: prof } = await sb
            .from('admin_profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (!prof) {
            onNotify?.(
              `Signed in (${user.email}), but NOT in admin_profiles yet — run the SQL promote query below!`
            );
            return;
          }
        }
        onNotify?.(`Authenticated Supabase Admin: ${user?.email}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSyncAllUp = async () => {
    setBusy(true);
    try {
      const res = await syncAllStorefrontToSupabase(storeData);
      if (res.ok) {
        onNotify?.(`Synced all ${res.count} products + site settings to Supabase!`);
      } else {
        onNotify?.(res.error || 'Sync requires authenticated admin user in admin_profiles.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 font-geist text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runtime Supabase Config */}
        <form
          onSubmit={handleSaveCredentials}
          className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-white space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase flex items-center gap-2">
              <Database className="w-4 h-4 text-[#ff6f1e]" />
              supabase project credentials
            </h4>
            <span
              className={`superr-tag ${
                creds.configured ? 'bg-[#22c55e]/20 text-emerald-900' : 'bg-[#f7efe9]'
              }`}
            >
              {creds.configured ? 'CONNECTED' : 'LOCAL FALLBACK'}
            </span>
          </div>
          <p className="text-[#171717]/70">
            Reads <code className="font-mono font-bold">VITE_SUPABASE_URL</code> +{' '}
            <code className="font-mono font-bold">VITE_SUPABASE_ANON_KEY</code> from{' '}
            <code className="font-mono">.env.local</code>, or bind here temporarily. Never enter a
            service_role key.
          </p>

          <div>
            <label className="font-bold block mb-1">Supabase Project URL</label>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9] font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Supabase Anon / Publishable Key</label>
            <input
              type="password"
              value={anonInput}
              onChange={(e) => setAnonInput(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9] font-mono text-[11px]"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" className="superr-pill-btn-primary py-2 px-4">
              <CheckCircle2 className="w-3.5 h-3.5" /> Save Connection
            </button>
            <button
              type="button"
              onClick={() => {
                clearRuntimeSupabaseConfig();
                setUrlInput('');
                setAnonInput('');
                onNotify?.('Cleared runtime Supabase credentials');
              }}
              className="superr-pill-btn py-2 px-3"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Admin Auth Session */}
        <div className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-[#f7efe9] space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#ff6f1e]" />
              admin rls authentication
            </h4>
            {sessionUser && (
              <span className="superr-tag bg-[#22c55e]/20 text-emerald-900">AUTHENTICATED</span>
            )}
          </div>

          {sessionUser ? (
            <div className="p-3.5 rounded-[10px] border-[1.5px] border-[#171717] bg-white space-y-2">
              <p className="font-bold text-[#2b1a07]">Signed in as {sessionUser.email}</p>
              <p className="font-mono text-[10px] text-[#171717]/65">UID: {sessionUser.id}</p>
              <button
                onClick={async () => {
                  const sb = getSupabase();
                  if (sb) await sb.auth.signOut();
                  onSessionChange?.(null);
                  onNotify?.('Signed out of Supabase Auth');
                }}
                className="superr-pill-btn py-1.5 px-3 text-red-600"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out Supabase
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminSignIn} className="space-y-3">
              <p className="text-[#171717]/75">
                Sign in with your Supabase Auth Admin email/password to enable direct cloud writes &
                Storage bucket uploads protected by Row Level Security.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="montassarzarai0@gmail.com"
                  className="px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password"
                  className="px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                />
              </div>
              <button type="submit" disabled={busy} className="superr-pill-btn-primary py-2 px-4">
                <KeyRound className="w-3.5 h-3.5" />
                <span>{busy ? 'Authenticating...' : 'Authenticate Admin Session'}</span>
              </button>
              <div className="p-2.5 rounded-[8px] border border-[#171717]/25 bg-white text-[10px] font-mono space-y-1">
                <p className="font-bold text-[#9a3412]">
                  Step 1: Authentication -&gt; Users -&gt; Add User in Supabase Dashboard. Step 2: Run in SQL Editor:
                </p>
                <p className="select-all text-[#171717]/80 break-all">
                  INSERT INTO public.admin_profiles (id, email, full_name, role, is_active) SELECT id, email, &apos;Montassar Zarai&apos;, &apos;superadmin&apos;, true FROM auth.users WHERE lower(email) = lower(&apos;{authEmail || 'montassarzarai0@gmail.com'}&apos;) ON CONFLICT (id) DO UPDATE SET role = &apos;superadmin&apos;, is_active = true;
                </p>
              </div>
            </form>
          )}

          {/* Sync Actions */}
          <div className="pt-2 border-t border-[#171717]/15 flex flex-wrap gap-2">
            <button onClick={handleSyncAllUp} disabled={busy} className="superr-pill-btn py-2 px-3.5">
              <UploadCloud className="w-3.5 h-3.5 text-[#ff6f1e]" />
              <span>Push 56 Items & Settings -&gt; Supabase</span>
            </button>
            <button onClick={onPullFromSupabase} disabled={busy} className="superr-pill-btn py-2 px-3.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Pull From Supabase</span>
            </button>
            <button
              onClick={onResetDefaults}
              className="superr-pill-btn py-2 px-3.5 text-red-600"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Local Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* SQL Files Guide Card */}
      <div className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-[#ff6f1e]" />
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
              supabase sql setup suite (ready in /supabase folder)
            </h4>
          </div>
          <span className="superr-tag bg-[#f7efe9]">PostgreSQL + 3 Storage Buckets</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            {
              file: 'supabase/01_schema.sql',
              desc: 'Tables: products, orders, media_assets, site_settings, promo_codes, newsletter_subscribers, admin_profiles + RPCs.'
            },
            {
              file: 'supabase/02_storage_and_rls.sql',
              desc: 'Strict RLS policies + Storage buckets: kronos-images, kronos-videos, kronos-documents.'
            },
            {
              file: 'supabase/03_seed_data.sql',
              desc: 'Seeds all 56 MEN/WOMEN garments, stores, emails/phones, lookbook video, & promos.'
            },
            {
              file: 'supabase/ALL_IN_ONE_SUPABASE_SETUP.sql',
              desc: 'Combined single script to paste directly into Supabase SQL Editor -> Run.'
            }
          ].map((item) => (
            <div key={item.file} className="p-3 rounded-[10px] border border-[#171717] bg-[#fdfbf9]">
              <p className="font-mono font-bold text-[11px] text-[#c2410c] flex items-center gap-1">
                <Download className="w-3 h-3" /> {item.file}
              </p>
              <p className="text-[11px] text-[#171717]/75 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

