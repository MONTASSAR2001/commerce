import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  FolderOpen,
  Sliders,
  Tag,
  Users,
  Database,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  TrendingUp,
  CheckCircle2,
  Check,
  Copy,
  Activity,
  RefreshCw,
  RotateCcw,
  ExternalLink,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Package,
  Lock,
  AlertTriangle,
  KeyRound,
  Network
} from 'lucide-react';
import { isSupabaseConfigured, getSupabase } from '../lib/supabaseClient';
import {
  fetchOrders,
  updateOrderStatus,
  deleteOrderItem,
  submitCustomerOrder,
  fetchMediaAssets,
  fetchPromoCodes,
  fetchNewsletterSubscribers,
  fetchStorefrontFromSupabase
} from '../lib/kronosDataService';
import { CatalogManagerTab, CommandesManagerTab } from '../components/admin/AdminCatalogOrders';
import { MediaVaultTab, StorefrontContentTab } from '../components/admin/AdminMediaStorefront';
import {
  PromoReviewsTab,
  CustomersNewsletterTab,
  SupabaseEngineTab
} from '../components/admin/AdminPromosSupabase';
import AdminGraphRagStudio from '../components/admin/AdminGraphRagStudio';

/* ── Hand-drawn Curved Arrow SVG (Matches Pic 1) ───────────────────────────── */
function CurvedArrow({ className = 'w-10 h-7', color = '#ff6f1e' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 10 C 22 3, 44 12, 50 28" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M43 25 L 50 30 L 53 22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Geometric KRONOS Crest Badge ──────────────────────────────────────────── */
function KronosBrandMarkIcon({ className = 'w-8 h-8' }) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-[9px] overflow-hidden bg-[#111111] border-[1.5px] border-[#171717] shadow-[1px_1px_0px_#171717] ${className}`}
    >
      <span className="font-azeret font-black text-sm tracking-tight text-white">
        K<span className="text-[#EA301F]">.</span>
      </span>
    </div>
  );
}

/* ── 4 Tactile Corner Stickers (Exact Match to Pic 1) ──────────────────────── */
function LightningSticker({ className = 'w-7 h-7', rot = '-14deg' }) {
  return (
    <div
      className={`superr-sticker bg-[#3b82f6] text-white p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.2)] ${className}`}
      style={{ transform: `rotate(${rot})` }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="#171717" strokeWidth="1.8" className="w-full h-full">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function HeartSticker({ className = 'w-7 h-7', rot = '12deg' }) {
  return (
    <div
      className={`superr-sticker bg-[#ff66cf] p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.2)] ${className}`}
      style={{ transform: `rotate(${rot})` }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="#171717" strokeWidth="1.8" className="w-full h-full text-white">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        <circle cx="9" cy="9.5" r="1.2" fill="#171717" />
        <circle cx="15" cy="9.5" r="1.2" fill="#171717" />
      </svg>
    </div>
  );
}

function StarSticker({ className = 'w-7 h-7', rot = '-8deg' }) {
  return (
    <div
      className={`superr-sticker bg-[#22c55e] text-white p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.2)] ${className}`}
      style={{ transform: `rotate(${rot})` }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="#171717" strokeWidth="1.8" className="w-full h-full">
        <path d="M12 2l2.4 6.6L21 11l-5.6 4.4L17 22l-5-4-5 4 1.6-6.6L3 11l6.6-2.4L12 2z" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function MarkerTipSticker({ className = 'w-7 h-7', rot = '18deg' }) {
  return (
    <div
      className={`superr-sticker bg-[#ff6f1e] text-white p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.2)] ${className}`}
      style={{ transform: `rotate(${rot})` }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2" className="w-full h-full">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="#fdfbf9" />
        <path d="M15 5l4 4" />
      </svg>
    </div>
  );
}

/* ── Physical Tactile Leather Notebook Dossier (Pic 1) ────────────────────── */
function TactileAdminNotebookObject({
  adminName = 'Montassar Zarai',
  productsCount = 56,
  ordersCount = 0,
  userId = '715c4b94'
}) {
  const shortId = userId ? `#${userId.slice(0, 8)}` : '#KRONOS01';

  return (
    <div className="relative w-full max-w-[330px] aspect-[4/3] mx-auto select-none">
      <div className="absolute -top-4 -left-3 z-20">
        <LightningSticker className="w-8 h-8" rot="-14deg" />
      </div>
      <div className="absolute -top-3 -right-2 z-20">
        <HeartSticker className="w-8 h-8" rot="12deg" />
      </div>
      <div className="absolute -bottom-3 -right-3 z-20">
        <StarSticker className="w-8 h-8" rot="-8deg" />
      </div>
      <div className="absolute -bottom-4 left-6 z-20">
        <MarkerTipSticker className="w-8 h-8" rot="18deg" />
      </div>

      <div className="w-full h-full rounded-[14px] bg-[#3a2211] border-[2px] border-[#171717] p-3 shadow-[4px_6px_0px_#171717,0_8px_20px_rgba(0,0,0,0.15)] relative transform rotate-[3deg] transition-transform duration-300 hover:rotate-[0deg]">
        <div className="w-full h-full rounded-[10px] border-[1.5px] border-dashed border-[#ff6f1e]/40 p-3 flex flex-col justify-between bg-gradient-to-br from-[#4d301b] to-[#2c170a]">
          <div className="absolute left-2 top-3 bottom-3 w-1.5 bg-[#9a3412] rounded-full opacity-60" />

          <div className="flex items-center justify-between pl-3">
            <span className="text-[10px] font-mono tracking-widest text-[#fdfbf9]/60 font-bold uppercase">
              SuperrBook • N° 01
            </span>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ff6f1e] border border-[#171717]" />
              <span className="w-2 h-2 rounded-full bg-[#3b82f6] border border-[#171717]" />
              <span className="w-2 h-2 rounded-full bg-[#22c55e] border border-[#171717]" />
            </div>
          </div>

          <div className="bg-[#fdfbf9] border-[1.5px] border-[#171717] rounded-[8px] p-3 sm:p-3.5 shadow-[2px_2px_0px_#171717] mx-1 my-auto">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b-[1.2px] border-[#171717]/20">
              <span className="text-[9px] font-bold text-[#171717]/60 tracking-wider font-geist uppercase">
                KRONOS Commerce Dossier
              </span>
              <span className="text-[9px] font-mono font-bold text-[#9a3412]">★ RLS 100%</span>
            </div>

            <div className="space-y-1 font-geist text-xs text-[#171717]">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-[#171717]/60 w-12 shrink-0">NAME:</span>
                <span className="font-superr-script text-base text-[#2b1a07] font-bold leading-none truncate">
                  {adminName}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-[#171717]/60 w-12 shrink-0">CLASS:</span>
                <span className="text-[11px] font-semibold text-[#171717] truncate leading-none">
                  SUPERADMIN • Store Ops
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-[#171717]/60 w-12 shrink-0">ID:</span>
                <span className="text-[10px] font-mono font-bold text-[#1b7a42] leading-none">
                  {shortId} • SECURED
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-[#171717]/60 w-12 shrink-0">STATUS:</span>
                <span className="text-[11px] font-mono font-bold text-[#9a3412] leading-none">
                  {productsCount} Items • {ordersCount} Orders
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pl-3 text-[10px] text-[#fdfbf9]/70 font-geist">
            <span>kronos studio engine</span>
            <span className="font-superr-script text-[#ff6f1e] text-sm font-bold">uncapped! ✎</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Independent Admin Dashboard ──────────────────────────────────────── */
export default function AdminDashboard({
  data,
  onUpdateField,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onHydrateData,
  onResetDefaults,
  onNavigateStore
}) {
  const [activeTab, setActiveTab] = useState('catalog');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Dynamic Supabase/Local Admin Records
  const [orders, setOrders] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [promos, setPromos] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [sessionUser, setSessionUser] = useState(null);
  const [adminProfileActive, setAdminProfileActive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickEmail, setQuickEmail] = useState(
    import.meta.env.VITE_KRONOS_ADMIN_EMAIL || 'montassarzarai0@gmail.com'
  );
  const [quickPass, setQuickPass] = useState('');
  const [quickBusy, setQuickBusy] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin'); // 'signin' | 'sql_needed'
  const [authReason, setAuthReason] = useState('');
  const [authError, setAuthError] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  const adminPromoteSql = `INSERT INTO public.admin_profiles (id, email, full_name, role, is_active)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Montassar Zarai'), 'superadmin', true
FROM auth.users
WHERE lower(email) = lower('${(quickEmail || 'montassarzarai0@gmail.com').trim()}')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'superadmin', is_active = true;`;

  const notify = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? '' : prev));
    }, 3600);
  }, []);

  const checkAdminProfile = useCallback(async (sb, user) => {
    if (!sb || !user?.id) {
      setAdminProfileActive(false);
      return false;
    }
    try {
      const { data: prof } = await sb
        .from('admin_profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle();
      const ok = Boolean(prof && prof.is_active !== false);
      setAdminProfileActive(ok);
      return ok;
    } catch {
      setAdminProfileActive(false);
      return false;
    }
  }, []);

  const loadAllAdminCollections = useCallback(async () => {
    setRefreshing(true);
    try {
      const sb = getSupabase();
      if (sb) {
        const { data: uData } = await sb.auth.getUser();
        const u = uData?.user || null;
        setSessionUser(u);
        if (u) {
          await checkAdminProfile(sb, u);
        }
      }
      const [ordList, mediaList, promoList, subList, storePatch] = await Promise.all([
        fetchOrders(),
        fetchMediaAssets(),
        fetchPromoCodes(),
        fetchNewsletterSubscribers(),
        fetchStorefrontFromSupabase({ includeUnpublished: true })
      ]);
      setOrders(ordList);
      setMediaAssets(mediaList);
      setPromos(promoList);
      setSubscribers(subList);
      if (storePatch) {
        onHydrateData?.(storePatch);
      }
    } finally {
      setRefreshing(false);
    }
  }, [checkAdminProfile, onHydrateData]);

  useEffect(() => {
    loadAllAdminCollections();
    const sb = getSupabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null;
      setSessionUser(u);
      if (u) {
        await checkAdminProfile(sb, u);
      } else {
        setAdminProfileActive(false);
      }
    });
    return () => {
      sub?.subscription?.unsubscribe?.();
    };
  }, [loadAllAdminCollections, checkAdminProfile]);

  useEffect(() => {
    const onSyncErr = (e) => {
      if (e?.detail) {
        notify(`Cloud write blocked (${e.detail})`);
      }
    };
    const onRequireAuth = (e) => {
      const msg =
        e?.detail ||
        'Sign in with montassarzarai0@gmail.com to apply changes live to Supabase & the main website.';
      setAuthModalMode('signin');
      setAuthReason(msg);
      setAuthError('');
      setAuthModalOpen(true);
      notify(msg);
    };
    const onRequireSql = (e) => {
      setAuthModalMode('sql_needed');
      setAuthReason(e?.detail || 'Your Supabase account needs superadmin permission in public.admin_profiles.');
      setAuthError('');
      setAuthModalOpen(true);
    };
    window.addEventListener('kronos:supabase-sync-error', onSyncErr);
    window.addEventListener('kronos:require-admin-auth', onRequireAuth);
    window.addEventListener('kronos:require-admin-profile-sql', onRequireSql);
    return () => {
      window.removeEventListener('kronos:supabase-sync-error', onSyncErr);
      window.removeEventListener('kronos:require-admin-auth', onRequireAuth);
      window.removeEventListener('kronos:require-admin-profile-sql', onRequireSql);
    };
  }, [notify]);

  const handleSupabaseQuickSignIn = async (e) => {
    e?.preventDefault?.();
    const sb = getSupabase();
    if (!sb || !quickEmail.trim() || !quickPass) return;
    setQuickBusy(true);
    setAuthError('');
    try {
      const { data: authRes, error } = await sb.auth.signInWithPassword({
        email: quickEmail.trim(),
        password: quickPass
      });
      if (error) {
        setAuthError(error.message);
        notify(`Sign-in failed: ${error.message}`);
        return;
      }
      const u = authRes?.user || null;
      setSessionUser(u);
      setQuickPass('');
      const hasAdminRow = await checkAdminProfile(sb, u);
      if (!hasAdminRow) {
        setAuthModalMode('sql_needed');
        setAuthReason('Signed in! One final SQL step is needed to promote your UID in public.admin_profiles.');
        setAuthModalOpen(true);
        notify(`Signed in as ${u?.email} — run the 1-click SQL snippet to unlock uploads!`);
      } else {
        setAuthModalOpen(false);
        notify(`Authenticated Supabase Admin (${u?.email}) — Cloud uploads unlocked!`);
        await loadAllAdminCollections();
      }
    } finally {
      setQuickBusy(false);
    }
  };

  const handleSendPasswordReset = async () => {
    const sb = getSupabase();
    const targetEmail = quickEmail.trim();
    if (!sb || !targetEmail) return;
    setQuickBusy(true);
    setAuthError('');
    try {
      const { error } = await sb.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/admin`
      });
      if (error) {
        setAuthError(error.message);
      } else {
        notify(`Password reset link sent to ${targetEmail}`);
        setAuthReason(`Check ${targetEmail} inbox for your password setup / reset link.`);
      }
    } finally {
      setQuickBusy(false);
    }
  };

  const handleCopyPromoteSql = () => {
    navigator.clipboard.writeText(adminPromoteSql);
    setSqlCopied(true);
    notify('Copied Admin Promote SQL — paste & Run in Supabase SQL Editor!');
    setTimeout(() => setSqlCopied(false), 2500);
  };

  const handlePullFromSupabase = async () => {
    setRefreshing(true);
    try {
      const patch = await fetchStorefrontFromSupabase({ includeUnpublished: true });
      if (patch) {
        onHydrateData?.(patch);
        notify('Pulled live products & settings from Supabase!');
      } else {
        notify('No remote Supabase rows found or connection unconfigured.');
      }
      await loadAllAdminCollections();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSampleOrder = async () => {
    const sampleItem = data.products?.[0] || {
      id: 'zara-w1',
      name: 'TRF MID-WAIST BAGGY FOLDED JEANS',
      price: 219,
      img: ''
    };
    const res = await submitCustomerOrder({
      customer_name: 'Amine Trabelsi',
      customer_email: 'amine.trabelsi@example.tn',
      customer_phone: '+216 22 910 345',
      shipping_address: 'Residence Les Jasmins, Ennasr 2',
      city: 'Ariana',
      country: 'Tunisia',
      notes: 'Call on arrival.',
      items: [
        {
          id: sampleItem.id,
          name: sampleItem.name,
          size: 'L',
          color: sampleItem.colors?.[0] || 'Standard',
          quantity: 1,
          price: sampleItem.price,
          img: sampleItem.img
        }
      ],
      subtotal_tnd: sampleItem.price,
      discount_tnd: 0,
      shipping_tnd: 8,
      total_tnd: Number(sampleItem.price) + 8,
      currency_code: 'TND',
      payment_method: 'cash_on_delivery'
    });
    if (res?.order) {
      setOrders((prev) => [res.order, ...prev]);
      notify(`Created commande ${res.order.order_number}`);
    }
  };

  // Profile Display
  const brandName = (data?.brand?.name || 'K').trim();
  const adminName =
    sessionUser?.user_metadata?.full_name ||
    import.meta.env.VITE_KRONOS_ADMIN_NAME ||
    'Montassar Zarai';
  const adminEmail =
    sessionUser?.email ||
    import.meta.env.VITE_KRONOS_ADMIN_EMAIL ||
    'montassarzarai0@gmail.com';
  const userId = sessionUser?.id || 'kronos715c4b94';
  const shortUserId = `#${userId.slice(0, 8)}`;

  // Derived Stats
  const productsCount = (data.products || []).length;
  const publishedCount = (data.products || []).filter((p) => p.isPublished !== false).length;
  const ordersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const totalRevenueTnd = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_tnd || 0), 0),
    [orders]
  );

  const navItems = [
    { id: 'catalog', label: 'catalog & pricing master', icon: LayoutGrid },
    { id: 'commandes', label: `commandes (${ordersCount})`, icon: ShoppingBag },
    { id: 'graphrag', label: 'ai assistant & graph rag', icon: Network },
    { id: 'media', label: 'supabase media vault', icon: FolderOpen },
    { id: 'storefront', label: 'storefront, contact & video', icon: Sliders },
    { id: 'promos', label: 'promo codes & faqs', icon: Tag },
    { id: 'customers', label: 'customers & newsletter', icon: Users },
    { id: 'supabase', label: 'supabase & sql engine', icon: Database }
  ];

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(userId);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf9] text-[#171717] font-geist selection:bg-[#ff6f1e]/20 selection:text-[#2b1a07] relative w-full overflow-x-hidden">
      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-[20px] border-[1.5px] border-[#171717] bg-[#171717] text-white text-xs font-bold shadow-[3px_3px_0px_#ff6f1e] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Mobile & Tablet Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ── DESKTOP & MOBILE SIDEBAR (Persistent on lg+ 1024px, slide-over drawer below) ── */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#fdfbf9] border-r-[1.5px] border-[#171717] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 lg:pointer-events-auto lg:visible ${
          mobileNavOpen
            ? 'translate-x-0 pointer-events-auto visible'
            : '-translate-x-full pointer-events-none invisible'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b-[1.5px] border-[#171717]">
          <button
            onClick={() => onNavigateStore('/')}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <KronosBrandMarkIcon className="w-8 h-8 shrink-0" />
            <div className="leading-tight">
              <span className="font-gelica font-bold text-xl text-[#2b1a07] tracking-tight group-hover:text-[#ff6f1e] transition-colors">
                {brandName}
              </span>
              <span className="text-[10px] font-superr-script text-[#c2410c] block -mt-1 font-bold">
                notebook studio
              </span>
            </div>
          </button>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1.5 rounded-[8px] border border-[#171717] cursor-pointer"
            aria-label="Close navigation drawer"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Account Passport Card */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="p-4">
              <div className="superr-name-label relative overflow-hidden">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b-[1.2px] border-[#171717]/15">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#171717]/60">
                    Account Passport
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-[12px] border border-[#171717] text-[9px] font-mono font-bold ${
                      !isSupabaseConfigured()
                        ? 'LOCAL MODE'
                        : sessionUser && adminProfileActive
                          ? 'bg-[#f59e0b]/20 text-[#9a3412]'
                          : isSupabaseConfigured()
                            ? 'bg-[#ffedd5] text-[#c2410c]'
                            : 'bg-[#22c55e]/15 text-[#1b7a42]'
                    }`}
                  >
                    {!isSupabaseConfigured()
                      ? 'LOCAL MODE'
                      : sessionUser && adminProfileActive
                        ? 'SUPERADMIN'
                        : sessionUser
                          ? 'SQL PENDING'
                          : 'READ ONLY'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <span className="text-[9px] font-bold text-[#171717]/60 block">NAME</span>
                    <p className="font-superr-script text-[16px] font-bold text-[#2b1a07] truncate leading-tight">
                      {adminName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#171717]/60 block">EMAIL</span>
                    <p className="text-[11px] font-medium text-[#171717] truncate">{adminEmail}</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-dashed border-[#171717]/15">
                    <span className="text-[#171717]/60 font-bold">USER ID:</span>
                    <button
                      onClick={handleCopyUserId}
                      className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold hover:underline cursor-pointer ${
                        sessionUser ? 'text-emerald-700' : 'text-[#1b7a42]'
                      }`}
                    >
                      <span>{sessionUser ? shortUserId : shortUserId}</span>
                      {idCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-60" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#171717]/60 font-bold">DOSSIER:</span>
                    <span className="font-mono font-bold text-[#9a3412]">OPEN • RLS CLOUD</span>
                  </div>
                  {isSupabaseConfigured() ? (
                    sessionUser && adminProfileActive ? (
                      <div className="flex items-center gap-1 text-[9px] font-mono text-[#1b7a42] pt-1">
                        <ShieldCheck className="w-3 h-3 text-[#22c55e] shrink-0" />
                        <span>Supabase Storage + RLS Unlocked</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode(sessionUser ? 'sql_needed' : 'signin');
                          setAuthReason('Sign in with montassarzarai0@gmail.com to unlock live edits & deletes on the storefront.');
                          setAuthModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-[9px] font-mono text-[#c2410c] font-bold pt-1 hover:underline cursor-pointer text-left"
                      >
                        <Lock className="w-3 h-3 text-[#c2410c] shrink-0" />
                        <span>{sessionUser ? 'Run Admin SQL · Sync Locked' : 'Sign In Required · Cloud Read Only'}</span>
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-1 text-[9px] font-mono text-[#1b7a42] pt-1">
                      <ShieldCheck className="w-3 h-3 text-[#22c55e]" />
                      <span>Local Studio (SQL Ready)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="px-4 py-1 space-y-1.5">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[20px] text-xs font-semibold transition-all duration-150 lowercase cursor-pointer ${
                    activeTab === id
                      ? 'bg-[#f7efe9] text-[#171717] border-[1.5px] border-[#171717] shadow-[1px_1px_0px_#171717]'
                      : 'text-[#171717]/80 border-[1.5px] border-transparent hover:border-[#171717] hover:bg-[#f7efe9]/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#171717]" />
                  <span className="flex-1 font-gelica font-medium text-[13px] text-left truncate">
                    {label}
                  </span>
                  {activeTab === id && <span className="w-1.5 h-1.5 rounded-full bg-[#ff6f1e]" />}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t-[1.5px] border-[#171717]">
            <button
              onClick={() => onNavigateStore('/')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[20px] border-[1.5px] border-[#171717] bg-[#fdfbf9] hover:bg-red-50 text-xs font-semibold text-[#171717] hover:text-red-600 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.2)] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="font-gelica">exit to store</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="w-full min-w-0 lg:ml-64 lg:w-[calc(100%-16rem)] flex flex-col min-h-screen bg-[#fdfbf9]">
        {/* Mobile & Tablet Header (< lg 1024px) */}
        <header className="lg:hidden min-h-14 py-2 bg-[#fdfbf9] border-b-[1.5px] border-[#171717] flex items-center justify-between gap-2 px-3 sm:px-5 sticky top-0 z-30">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-[10px] border-[1.5px] border-[#171717] bg-white shrink-0 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4 shrink-0" />
          </button>
          <span className="font-gelica font-bold text-sm sm:text-base truncate">{brandName} admin</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {!sessionUser && isSupabaseConfigured() && (
              <button
                onClick={() => {
                  setAuthModalMode('signin');
                  setAuthReason('Sign in with montassarzarai0@gmail.com to save directly to Supabase.');
                  setAuthModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-[16px] border-[1.5px] border-[#171717] bg-[#ff6f1e] text-white text-[11px] font-bold cursor-pointer shrink-0"
              >
                sign in
              </button>
            )}
            <button
              onClick={() => onNavigateStore('/')}
              className="superr-pill-btn py-1 px-2.5 sm:px-3 text-[11px] shrink-0"
            >
              ◂ store
            </button>
          </div>
        </header>

        {/* Desktop Sticky Top Header (lg+ 1024px) */}
        <header className="hidden lg:flex min-h-16 py-2 bg-[#fdfbf9] border-b-[1.5px] border-[#171717] items-center justify-between gap-3 px-6 xl:px-8 sticky top-0 z-30">
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-gelica font-bold text-[#2b1a07] lowercase truncate">
                {navItems.find((n) => n.id === activeTab)?.label || 'catalog & pricing master'}
              </h1>
              <span className="inline-flex px-2.5 py-0.5 rounded-[20px] text-[10px] font-bold border-[1.2px] border-[#171717] bg-[#f7efe9]">
                notebook v2.6
              </span>
              <button
                onClick={() => {
                  if (getSupabase() && !sessionUser) {
                    setAuthModalMode('signin');
                    setAuthReason('Sign in to authenticate your Supabase Admin session.');
                    setAuthModalOpen(true);
                  } else {
                    handleCopyUserId();
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[20px] border text-[10px] font-mono font-bold cursor-pointer ${
                  sessionUser && adminProfileActive
                    ? 'border-[#171717]/40 bg-[#22c55e]/10 text-[#1b7a42] hover:bg-[#22c55e]/20'
                    : isSupabaseConfigured()
                      ? 'border-[#c2410c]/50 bg-[#ffedd5] text-[#9a3412] hover:bg-[#fed7aa]'
                      : 'border-[#171717]/40 bg-[#22c55e]/10 text-[#1b7a42] hover:bg-[#22c55e]/20'
                }`}
              >
                {sessionUser && adminProfileActive ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[#22c55e]" />
                    <span>{shortUserId}</span>
                    {idCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-60" />}
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-[#c2410c]" />
                    <span>{sessionUser ? 'run admin sql' : isSupabaseConfigured() ? 'sign in to sync' : 'open studio'}</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#171717]/60 font-geist">
              master profile workspace • {brandName.toUpperCase()} COMMERCE + SUPABASE STORAGE OPS
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('supabase')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[20px] border-[1.5px] border-[#171717] bg-[#ff6f1e]/10 text-[#9a3412] text-xs font-bold shadow-[0_1px_2px_rgba(0,0,0,0.15)] cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse text-[#ff6f1e]" />
              <span className="font-gelica">
                {isSupabaseConfigured() ? 'supabase: online' : 'engine: local + sql ready'}
              </span>
            </button>

            <button
              onClick={loadAllAdminCollections}
              className="p-2 rounded-[16px] border-[1.5px] border-[#171717] bg-white hover:bg-[#f7efe9] cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => onNavigateStore('/')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[20px] border-[1.5px] border-[#171717] bg-[#fdfbf9] hover:bg-[#f7efe9] text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.15)] cursor-pointer"
            >
              <span className="font-gelica">◂ landing page</span>
            </button>

            {sessionUser ? (
              <button
                onClick={async () => {
                  const sb = getSupabase();
                  if (sb) await sb.auth.signOut();
                  setSessionUser(null);
                  setAdminProfileActive(false);
                  notify('Signed out of Supabase Admin session');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[20px] border-[1.5px] border-[#171717] bg-[#fdfbf9] hover:bg-red-50 text-xs font-semibold text-red-600 shadow-[0_1px_2px_rgba(0,0,0,0.15)] cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span className="font-gelica">sign out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('signin');
                  setAuthReason('Sign in with montassarzarai0@gmail.com to save directly to Supabase.');
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[20px] border-[1.5px] border-[#171717] bg-[#ff6f1e] text-white text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.15)] cursor-pointer hover:bg-[#e55d0f]"
              >
                <KeyRound className="w-3 h-3" />
                <span className="font-gelica">admin sign in</span>
              </button>
            )}
          </div>
        </header>

        {/* ── MAIN SCROLLABLE DASHBOARD BODY ── */}
        <div className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* 1. HERO MASTER NOTEBOOK WELCOME BANNER (Exact Match Pic 1) */}
          <section className="superr-card-tint p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 superr-notebook-grid opacity-30 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="superr-tag bg-[#fdfbf9]">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] border border-[#171717] animate-pulse" />
                    <span>
                      active studio • {publishedCount} live products · {pendingOrdersCount} pending
                      orders
                    </span>
                  </span>
                  <span className="font-superr-script text-base sm:text-lg text-[#c2410c] font-bold rotate-[-2deg] hidden sm:inline">
                    dossiers synced! ✎
                  </span>
                </div>

                <h2 className="font-gelica text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#2b1a07] lowercase leading-[1.1] tracking-tight">
                  welcome back, <span className="text-[#c2410c] font-extrabold">{adminName.toLowerCase()}</span>
                </h2>

                <p className="font-geist text-sm sm:text-base text-[#171717]/80 leading-relaxed max-w-xl">
                  Your command dossier controls{' '}
                  <span className="text-[#9a3412] font-bold">{productsCount} architectural garments</span>,{' '}
                  <span className="text-[#9a3412] font-bold">
                    {ordersCount} customer commandes ({totalRevenueTnd.toFixed(0)} DT)
                  </span>
                  , and Supabase Storage buckets for images, runway videos &amp; documents.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className={activeTab === 'catalog' ? 'superr-pill-btn-primary' : 'superr-pill-btn'}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Catalog &amp; Prices ({productsCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('commandes')}
                    className={
                      activeTab === 'commandes' ? 'superr-pill-btn-primary' : 'superr-pill-btn'
                    }
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Commandes ({ordersCount})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActiveTab('graphrag')}
                    className={
                      activeTab === 'graphrag' ? 'superr-pill-btn-primary' : 'superr-pill-btn'
                    }
                  >
                    <Network className="w-4 h-4" />
                    <span>AI Assistant &amp; Graph RAG</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('media')}
                    className={activeTab === 'media' ? 'superr-pill-btn-primary' : 'superr-pill-btn'}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Media Vault ({mediaAssets.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('storefront')}
                    className={
                      activeTab === 'storefront' ? 'superr-pill-btn-primary' : 'superr-pill-btn'
                    }
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Contact &amp; Videos</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('promos')}
                    className={activeTab === 'promos' ? 'superr-pill-btn-primary' : 'superr-pill-btn'}
                  >
                    <Tag className="w-4 h-4" />
                    <span>Promos ({promos.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('supabase')}
                    className={
                      activeTab === 'supabase' ? 'superr-pill-btn-primary' : 'superr-pill-btn'
                    }
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Supabase &amp; SQL</span>
                  </button>
                </div>

                <div className="pt-1 flex items-center gap-2 text-xs text-[#2b1a07]/70 font-geist">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>
                    Deterministic pricing, instant storefront sync &amp; Supabase Storage RLS armed.
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <TactileAdminNotebookObject
                  adminName={adminName}
                  productsCount={productsCount}
                  ordersCount={ordersCount}
                  userId={userId}
                />
              </div>
            </div>
          </section>

          {/* One-click Brand 'K' Sync notice if remote Supabase still holds legacy KRONOS name */}
          {brandName.toUpperCase() === 'KRONOS' && (
            <div className="p-3.5 rounded-[14px] border-[1.5px] border-[#171717] bg-[#fff8e6] shadow-[3px_3px_0px_#171717] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-[#9a3412]">
                  Supabase <code>site_settings.brand</code> still stores legacy name <strong>KRONOS</strong>.
                </p>
                <p className="text-[#171717]/75">
                  Click the button on the right to save <strong>&quot;K&quot;</strong> directly to Supabase so the storefront header, footer, and AI chatbots show <strong>K</strong> live.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onUpdateField?.('brand.name', 'K');
                  await onUpdateField?.('brand.metaTitle', 'K — Streetwear & Collabs');
                  notify('Updated Supabase brand name to "K" — refreshing storefront & AI!');
                }}
                className="superr-pill-btn py-1.5 px-3.5 text-xs bg-[#171717] text-[#FFE082] hover:bg-[#2a2a2a] shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Set Brand to &quot;K&quot; Now</span>
              </button>
            </div>
          )}

          {/* 2. DYNAMIC WORKSPACE STATS ROW (Exact 4-Card Layout Pic 1) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
                  workspace stats
                </h3>
                <span className="text-xs font-superr-script text-[#c2410c] font-bold">
                  (synced with cloud ✨)
                </span>
              </div>
              <CurvedArrow className="w-8 h-5 text-[#ff6f1e] hidden sm:block" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Stat 1 */}
              <div
                onClick={() => setActiveTab('catalog')}
                className="superr-card p-5 hover:translate-y-[-2px] flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-[10px] border-[1.5px] border-[#171717] bg-[#22c55e] flex items-center justify-center shadow-[1px_1px_0px_#171717]">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[20px] border border-[#171717] bg-[#f7efe9]">
                    {publishedCount} live
                  </span>
                </div>
                <div>
                  <p className="font-gelica text-3xl sm:text-4xl font-extrabold text-[#2b1a07] leading-none">
                    {productsCount}
                  </p>
                  <p className="font-geist text-xs font-bold text-[#171717]/80 mt-2">
                    Catalog Products
                  </p>
                  <p className="font-superr-script text-xs text-[#c2410c] font-bold mt-1">
                    editable prices &amp; photos
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div
                onClick={() => setActiveTab('commandes')}
                className="superr-card p-5 hover:translate-y-[-2px] flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-[10px] border-[1.5px] border-[#171717] bg-[#3b82f6] flex items-center justify-center shadow-[1px_1px_0px_#171717]">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[20px] border border-[#171717] bg-[#f7efe9]">
                    {pendingOrdersCount} pending
                  </span>
                </div>
                <div>
                  <p className="font-gelica text-3xl sm:text-4xl font-extrabold text-[#2b1a07] leading-none">
                    {ordersCount}
                  </p>
                  <p className="font-geist text-xs font-bold text-[#171717]/80 mt-2">
                    Live Commandes
                  </p>
                  <p className="font-superr-script text-xs text-[#c2410c] font-bold mt-1">
                    emails &amp; phones tracked
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div
                onClick={() => setActiveTab('commandes')}
                className="superr-card p-5 hover:translate-y-[-2px] flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-[10px] border-[1.5px] border-[#171717] bg-[#ff6f1e] flex items-center justify-center shadow-[1px_1px_0px_#171717]">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[20px] border border-[#171717] bg-[#f7efe9]">
                    {data.currency?.active || 'TND'}
                  </span>
                </div>
                <div>
                  <p className="font-gelica text-3xl sm:text-4xl font-extrabold text-[#2b1a07] leading-none">
                    {totalRevenueTnd.toFixed(0)} <span className="text-lg">DT</span>
                  </p>
                  <p className="font-geist text-xs font-bold text-[#171717]/80 mt-2">
                    Gross Merchandise Volume
                  </p>
                  <p className="font-superr-script text-xs text-[#c2410c] font-bold mt-1">
                    live checkout total
                  </p>
                </div>
              </div>

              {/* Stat 4 */}
              <div
                onClick={() => setActiveTab('media')}
                className="superr-card p-5 hover:translate-y-[-2px] flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-[10px] border-[1.5px] border-[#171717] bg-[#ff66cf] flex items-center justify-center shadow-[1px_1px_0px_#171717]">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[20px] border border-[#171717] bg-[#f7efe9]">
                    3 buckets
                  </span>
                </div>
                <div>
                  <p className="font-gelica text-3xl sm:text-4xl font-extrabold text-[#2b1a07] leading-none">
                    {mediaAssets.length}
                  </p>
                  <p className="font-geist text-xs font-bold text-[#171717]/80 mt-2">
                    Media Vault Files
                  </p>
                  <p className="font-superr-script text-xs text-[#c2410c] font-bold mt-1">
                    img · video · docs ✨
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. BOTTOM INTERACTIVE MASTER DOCK CARD (Matches Pic 1 Bottom Section) */}
          <section className="superr-card p-4 sm:p-6 space-y-5">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b-[1.5px] border-[#171717]">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-[10px] border-[1.5px] border-[#171717] bg-[#ff6f1e] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#171717]">
                  <LayoutGrid className="w-4 h-4 shrink-0 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase leading-tight">
                    {navItems.find((n) => n.id === activeTab)?.label} dock
                  </h3>
                  <p className="text-xs text-[#171717]/65 font-geist mt-0.5">
                    Change prices, customize pictures, upload videos/documents, review customer
                    commandes, and sync live with Supabase.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigateStore('/')}
                  className="superr-pill-btn py-1.5 px-3 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>view as client</span>
                </button>
                <button
                  onClick={loadAllAdminCollections}
                  className="superr-pill-btn py-1.5 px-3 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>refresh</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Reset all local storefront customizations back to factory KRONOS defaults?')) {
                      onResetDefaults?.();
                      notify('Restored KRONOS factory defaults');
                    }
                  }}
                  className="superr-pill-btn py-1.5 px-3 text-xs text-red-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>reset defaults</span>
                </button>
              </div>
            </div>

            {/* Active Workspace Tab Body */}
            {activeTab === 'catalog' && (
              <CatalogManagerTab
                products={data.products || []}
                onUpdateProduct={onUpdateProduct}
                onAddProduct={onAddProduct}
                onDeleteProduct={onDeleteProduct}
                onNotify={notify}
              />
            )}

            {activeTab === 'commandes' && (
              <CommandesManagerTab
                orders={orders}
                onUpdateStatus={async (id, status) => {
                  const next = await updateOrderStatus(id, status);
                  setOrders(next);
                }}
                onDeleteOrder={async (id) => {
                  const next = await deleteOrderItem(id);
                  setOrders(next);
                }}
                onCreateSampleOrder={handleCreateSampleOrder}
                onNotify={notify}
              />
            )}

            {activeTab === 'graphrag' && (
              <AdminGraphRagStudio
                storeData={data}
                promos={promos}
                orders={orders}
                mediaAssets={mediaAssets}
                subscribers={subscribers}
                sessionUser={sessionUser}
                onNotify={notify}
              />
            )}

            {activeTab === 'media' && (
              <MediaVaultTab
                assets={mediaAssets}
                onAssetsChange={setMediaAssets}
                onUpdateField={onUpdateField}
                onNotify={notify}
              />
            )}

            {activeTab === 'storefront' && (
              <StorefrontContentTab
                data={data}
                onUpdateField={onUpdateField}
                onNotify={notify}
              />
            )}

            {activeTab === 'promos' && (
              <PromoReviewsTab
                promos={promos}
                onPromosChange={setPromos}
                faqs={data.faqs || []}
                reviews={data.reviews || []}
                onUpdateField={onUpdateField}
                onNotify={notify}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersNewsletterTab orders={orders} subscribers={subscribers} />
            )}

            {activeTab === 'supabase' && (
              <SupabaseEngineTab
                storeData={data}
                sessionUser={sessionUser}
                onSessionChange={setSessionUser}
                onPullFromSupabase={handlePullFromSupabase}
                onResetDefaults={() => {
                  onResetDefaults?.();
                  notify('Restored KRONOS factory defaults');
                }}
                onNotify={notify}
              />
            )}
          </section>
        </div>
      </main>

      {/* Supabase Admin Authentication & RLS Promote Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[16px] border-[1.5px] border-[#171717] bg-[#fdfbf9] shadow-[6px_6px_0px_#171717] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b-[1.5px] border-[#171717] bg-[#fff3e6]">
              <div className="flex items-center gap-2">
                {authModalMode === 'sql_needed' ? (
                  <AlertTriangle className="w-4 h-4 text-[#c2410c]" />
                ) : (
                  <Lock className="w-4 h-4 text-[#c2410c]" />
                )}
                <h3 className="font-gelica font-bold text-base text-[#2b1a07]">
                  {authModalMode === 'sql_needed'
                    ? 'activate superadmin in supabase'
                    : 'supabase admin authentication'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="p-1 rounded-[8px] border border-[#171717] bg-white hover:bg-[#f7efe9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {authReason && (
                <p className="p-2.5 rounded-[10px] border border-[#171717]/20 bg-white text-[#171717]/80 font-medium">
                  {authReason}
                </p>
              )}

              {authError && (
                <p className="p-2.5 rounded-[10px] border border-red-400 bg-red-50 text-red-700 font-bold">
                  {authError}
                </p>
              )}

              {authModalMode === 'signin' && (
                <form onSubmit={handleSupabaseQuickSignIn} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#171717]/70 mb-1">
                      Supabase Auth Email
                    </label>
                    <input
                      type="email"
                      required
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-[10px] border-[1.5px] border-[#171717] bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#171717]/70 mb-1">
                      Supabase User Password
                    </label>
                    <input
                      type="password"
                      required
                      autoFocus
                      value={quickPass}
                      onChange={(e) => setQuickPass(e.target.value)}
                      placeholder="Password you set for montassarzarai0@gmail.com"
                      className="w-full px-3 py-2 rounded-[10px] border-[1.5px] border-[#171717] bg-white text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={quickBusy}
                      onClick={handleSendPasswordReset}
                      className="text-[11px] font-bold text-[#9a3412] underline hover:text-[#ff6f1e] cursor-pointer"
                    >
                      Forgot password? Send email reset link
                    </button>
                    <button
                      type="submit"
                      disabled={quickBusy}
                      className="superr-pill-btn-primary py-2 px-5 text-xs"
                    >
                      {quickBusy ? 'Signing in...' : 'Sign In & Unlock Cloud'}
                    </button>
                  </div>
                </form>
              )}

              {(authModalMode === 'sql_needed' || sessionUser) && (
                <div className="space-y-2.5 pt-2 border-t border-dashed border-[#171717]/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#9a3412]">
                      1-Click Admin Promote SQL (Supabase SQL Editor)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPromoteSql}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[#171717] bg-white hover:bg-[#f7efe9] font-mono text-[10px] font-bold cursor-pointer"
                    >
                      {sqlCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{sqlCopied ? 'Copied!' : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-[10px] border border-[#171717] bg-[#171717] text-[#fdfbf9] font-mono text-[10px] overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {adminPromoteSql}
                  </pre>
                  {sessionUser && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          const sb = getSupabase();
                          const ok = await checkAdminProfile(sb, sessionUser);
                          if (ok) {
                            setAuthModalOpen(false);
                            notify('Superadmin verified! Supabase uploads & database writes unlocked.');
                            await loadAllAdminCollections();
                          } else {
                            setAuthError('Still not active in admin_profiles — paste the SQL above in Supabase SQL Editor and click Run.');
                          }
                        }}
                        className="superr-pill-btn-primary py-1.5 px-4 text-xs"
                      >
                        Re-check Admin Permission
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

