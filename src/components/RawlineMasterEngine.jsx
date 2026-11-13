/**
 * RawlineMasterEngine.jsx
 * 100% Exact 1:1 Pixel, Dimension, Color, Animation & Video Replica of
 * RAWLINE — Unfiltered High-Contrast Streetwear (https://rawline.framer.website/)
 *
 * Typography:
 *   - Azeret Mono (Heavy industrial monospace for headings, buttons, and prices)
 *   - Source Serif 4 (Italic script font intertwined with bold industrial titles)
 *   - Inter (Clean geometric body text)
 *
 * Color Palette:
 *   - Obsidian Deep Black: #111111
 *   - Crimson Flame: #EA301F
 *   - Bone / Chalk White: #FFFFE3
 *   - Slate Steel / Muted: #787878 / #8E8E93
 *
 * Sections:
 *   0. Floating Island Navbar (600px x 72px, fixed top-5, slide-down appear, Folded Ribbon logo, cart badge)
 *   1. Hero Viewport (100vh): 70.5% Left Editorial (WEAR THE HYPE "RAW" 96px) + 29.5% Right 5px Red Framed Ticker + 90px SHOP NOW (48px)
 *   2. About Us / Manifesto (ABusUT) with smooth scroll scale zoom (1 -> 1.35)
 *   3. Ongoing Drops (latest DROPS: Nova, Vero, Luna with tilted LIMITED STOCK badge & hover progressive blur)
 *   4. On Sale (black friday SALE: 4-col product grid with serrated jagged ticket discount badges)
 *   5. Features (why RAWLINE?: 4 stair-step columns with 0, 150px, 300px, 450px spacers & scroll entrance)
 *   6. Categories (CATEGORIES: Asymmetric high-fashion editorial collage with 48px centered titles)
 *   7. Holy Grails (GRholyLS: 6 grail pieces with superimposed title)
 *   8. Video Lookbook Banner (Rawline / clothing: Pexels cinematic 4K video background)
 *   9. New Arrivals (new ARRIVALS: MEN & WOMEN filter pills, 8-item catalog)
 *   10. Social Wall (Social wall: 4x2 mosaic with quote cards & editorial photography)
 *   11. Gift Card (Rawline / gift card: curly hair guy with scroll-driven scale zoom 1 -> 1.35)
 *   12. Walk-in Stores (walk-in STORES: London Canary Wharf & New York City Manhattan)
 *   13. Footer (Logo, contact info, newsletter with red line, pill links, socials, copyright)
 *   14. Modals: Smart Currency Country Selector, Product Quick View, Search, Wishlist Drawer, Cart Drawer
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Heart,
  Search,
  ShoppingBag,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sliders,
  Check,
  Plus,
  Minus,
  Sparkles,
  Moon,
  Sun
} from 'lucide-react';
import Rawline3DFittingLab from './Rawline3DFittingLab';
import RawlineAIChatbot, { KronosLogo } from './RawlineAIChatbot';
import ZaraProductDetailPage from './ZaraProductDetailPage';
import {
  SUPPORTED_LANGUAGES,
  createTranslator,
  getLanguageMeta,
  localizeProductName,
  localizeCategory,
  localizeGender,
  localizeColor,
  translateEditorialCopy
} from '../lib/i18nEngine';
import { sanitizeSafeExternalUrl } from '../lib/urlSafety';
import {
  submitCustomerOrder,
  validatePromoCode,
  subscribeNewsletter
} from '../lib/kronosDataService';

// Custom hook to calculate scroll progress of an element in viewport (0 to 1)
function useElementScrollProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        // 0 when top of element enters viewport bottom, 1 when element is centered/fully visible
        const totalDistance = windowHeight + rect.height;
        const currentDistance = windowHeight - rect.top;
        const rawProgress = Math.max(0, Math.min(1, currentDistance / totalDistance));
        setProgress(rawProgress);
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ref]);

  return progress;
}

// Color Name to Hex Palette Mapper for Streetwear Swatches
export const getColorHex = (colorName = '') => {
  const lower = colorName.toLowerCase();
  if (lower.includes('black') || lower.includes('obsidian') || lower.includes('onyx') || lower.includes('pitch')) return '#111111';
  if (lower.includes('white') || lower.includes('snow') || lower.includes('bone') || lower.includes('chalk') || lower.includes('alabaster')) return '#F5F5ED';
  if (lower.includes('crimson') || lower.includes('red') || lower.includes('oxblood')) return '#EA301F';
  if (lower.includes('blue') || lower.includes('horizon') || lower.includes('cobalt') || lower.includes('indigo') || lower.includes('navy')) return '#2563EB';
  if (lower.includes('green') || lower.includes('olive') || lower.includes('sage') || lower.includes('forest') || lower.includes('jade') || lower.includes('emerald') || lower.includes('ivy')) return '#2E7D32';
  if (lower.includes('grey') || lower.includes('gray') || lower.includes('charcoal') || lower.includes('graphite') || lower.includes('smoke') || lower.includes('ash') || lower.includes('slate')) return '#666666';
  if (lower.includes('terracotta') || lower.includes('orange') || lower.includes('rust')) return '#D9531E';
  if (lower.includes('tan') || lower.includes('sand') || lower.includes('camel') || lower.includes('ochre') || lower.includes('taupe') || lower.includes('earthy')) return '#C2A375';
  if (lower.includes('lavender') || lower.includes('plum') || lower.includes('purple')) return '#A78BFA';
  if (lower.includes('silver') || lower.includes('chrome') || lower.includes('metallic') || lower.includes('gunmetal')) return '#C0C0C0';
  if (lower.includes('lime')) return '#84CC16';
  if (lower.includes('gold')) return '#EAB308';
  return '#333333';
};

// Zara-Style Studio Editorial Product Card with Multi-Angle Carousel, Color Swatch Photo Switching & Quick Size Picker
function ZaraProductCard({
  prod,
  wishlist = [],
  toggleWishlist,
  formatPrice,
  onSelectProduct,
  onQuickAddToCart,
  onOpenFittingLab,
  compact = false,
  language = 'en',
  t = (k, fb) => fb || k
}) {
  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [quickSizeOpen, setQuickSizeOpen] = useState(false);

  const variants = useMemo(() => {
    if (Array.isArray(prod.colorVariants) && prod.colorVariants.length > 0) {
      return prod.colorVariants;
    }
    return (prod.colors || ['Standard']).map((c) => ({
      name: c,
      hex: getColorHex(c),
      images: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : [prod.img]
    }));
  }, [prod]);

  const activeVariant = variants[activeColorIdx] || variants[0];
  const gallery = (activeVariant?.images && activeVariant.images.length > 0)
    ? activeVariant.images
    : [prod.img];
  const currentImg = gallery[activeImgIdx] || gallery[0] || prod.img;

  const nextImg = (e) => {
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev + 1) % gallery.length);
  };

  const prevImg = (e) => {
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  return (
    <div
      onClick={() => onSelectProduct(prod, activeColorIdx)}
      className="kronos-product-card group relative bg-[#111111] hover:bg-[#151519] flex flex-col justify-between cursor-pointer transition-all duration-300 border border-[#222228] hover:border-[#363642]"
    >
      {/* Top Studio 2:3 Portrait Photography Frame (Exact Zara Style) */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#ECECE9]">
        <img
          src={currentImg}
          alt={`${prod.name} - ${activeVariant?.name || ''}`}
          loading="lazy"
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
        />

        {/* Top-Left: Wishlist & Gender Tag */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(prod.id);
              }}
              className="w-7 h-7 rounded-full bg-black/55 backdrop-blur-md text-white hover:text-[#EA301F] flex items-center justify-center transition-colors cursor-pointer"
              title="Save to Wishlist"
            >
              <Heart className={`w-3.5 h-3.5 ${wishlist.includes(prod.id) ? 'fill-[#EA301F] text-[#EA301F]' : ''}`} />
            </button>
            <span className={`text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded backdrop-blur-md ${
              prod.gender === 'WOMEN'
                ? 'bg-[#EA301F]/85 text-white'
                : 'bg-black/75 text-[#FFFFE3]'
            }`}>
              {localizeGender(prod.gender, language)}
            </span>
          </div>

          {prod.discount ? (
            <span className="bg-[#EA301F] text-white text-[10px] font-azeret font-bold px-2 py-0.5 uppercase tracking-wider shadow">
              {prod.discount}
            </span>
          ) : prod.badge ? (
            <span className="bg-black/65 backdrop-blur-md text-[#FFFFE3] text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
              {prod.badge}
            </span>
          ) : null}
        </div>

        {/* Multi-Angle Studio Navigation Arrows on Hover */}
        {gallery.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="opacity-0 group-hover:opacity-100 absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all z-10 cursor-pointer"
              title="Previous angle"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImg}
              className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all z-10 cursor-pointer"
              title="Next angle"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Bottom Overlay Bar: Angle Dots & Zara '+' Quick Size Trigger */}
        {!quickSizeOpen && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            <div className="flex items-center gap-1 bg-black/45 backdrop-blur-sm px-2 py-1 rounded-full">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIdx(i);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === activeImgIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/80'
                  }`}
                  title={`View ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuickSizeOpen(true);
              }}
              className="w-7 h-7 rounded-full bg-white/90 hover:bg-[#EA301F] text-[#111111] hover:text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
              title="Quick Add Size"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Zara Quick Size Overlay Drawer */}
        {quickSizeOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 bg-[#111111]/95 backdrop-blur-md border-t border-[#2E2E38] p-2.5 z-20 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-widest">
                QUICK ADD • {activeVariant?.name}
              </span>
              <button
                onClick={() => setQuickSizeOpen(false)}
                className="text-[#8E8E93] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(prod.sizes || ['XS', 'S', 'M', 'L', 'XL']).map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    onQuickAddToCart(
                      { ...prod, img: currentImg, image: currentImg },
                      sz,
                      activeVariant?.name || 'Standard',
                      1
                    );
                    setQuickSizeOpen(false);
                  }}
                  className="min-w-[28px] px-2 py-1 text-[10px] font-azeret font-bold bg-[#1C1C24] hover:bg-[#EA301F] text-white border border-[#2F2F3B] hover:border-[#EA301F] transition-colors cursor-pointer"
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Info (Clean Zara Metadata + Real Color Swatches) */}
      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#7E7E8A]">
              {localizeCategory(prod.category, language)}
            </span>
            {prod.sizes && prod.sizes.length > 0 && (
              <span className="text-[9px] font-mono text-[#7E7E8A] truncate">
                {prod.sizes[0]}–{prod.sizes[prod.sizes.length - 1]}
              </span>
            )}
          </div>

          <h3 className="font-azeret font-bold text-[12px] uppercase tracking-tight text-[#FFFFE3] group-hover:text-[#EA301F] transition-colors line-clamp-2 min-h-[34px]">
            {localizeProductName(prod.name, language)}
          </h3>

          <div className="flex items-baseline gap-2 font-azeret mt-1.5">
            <span className="font-bold text-base text-[#FFFFE3]">
              {formatPrice(prod.price)}
            </span>
            {prod.oldPrice && (
              <span className="text-xs text-[#787878] line-through font-medium">
                {formatPrice(prod.oldPrice)}
              </span>
            )}
          </div>

          {/* Interactive Square Zara Color Swatches — Switches Product Photo Immediately! */}
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {variants.slice(0, 6).map((v, vIdx) => {
              const isSelected = vIdx === activeColorIdx;
              return (
                <button
                  key={`${v.name}-${vIdx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveColorIdx(vIdx);
                    setActiveImgIdx(0);
                  }}
                  className={`w-3.5 h-3.5 rounded-[2px] border transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'border-white ring-1 ring-[#EA301F] ring-offset-1 ring-offset-[#111111] scale-110'
                      : 'border-white/30 hover:border-white/80'
                  }`}
                  style={{ backgroundColor: v.hex || getColorHex(v.name) }}
                  title={v.name}
                />
              );
            })}
            <span className="text-[10px] font-mono text-[#8E8E93] ml-1 truncate max-w-[115px]">
              {localizeColor(activeVariant?.name, language)}
            </span>
          </div>
        </div>

        {!compact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenFittingLab({ ...prod, img: currentImg, image: currentImg });
            }}
            className="kronos-surface-pill w-full mt-3 py-2 px-3 bg-[#18181E] hover:bg-[#EA301F] text-[#A1A1AA] hover:text-white border border-[#282834] hover:border-[#EA301F] font-mono text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title={t('product.tryOn3d')}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EA301F] group-hover:text-white" />
            <span>{t('product.tryOn3d')}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function RawlineMasterEngine({
  data = {},
  onUpdateField,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  uploadImage,
  onOpenCustomizer,
  isStore = true,
  hasTopNav = false,
  externalFittingLabOpen = false,
  onCloseFittingLab,
  onOpenAdmin
}) {
  // ── Currency State: Default to Tunisian Dinar (TND / DT) ──
  const [activeCurrencyCode, setActiveCurrencyCode] = useState(data?.currency?.active || 'TND');
  useEffect(() => {
    if (data?.currency?.active) {
      setActiveCurrencyCode(data.currency.active);
    }
  }, [data?.currency?.active]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);

  // ── Night / Day Theme Mode & Intelligent Trilingual Language State (EN / FR / AR) ──
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = window.localStorage.getItem('kronos_store_theme');
      return saved === 'day' || saved === 'night' ? saved : 'night';
    } catch {
      return 'night';
    }
  });
  const [language, setLanguage] = useState(() => {
    try {
      const saved = window.localStorage.getItem('kronos_store_lang');
      return saved === 'fr' || saved === 'ar' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('kronos_store_theme', themeMode);
    } catch {}
  }, [themeMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem('kronos_store_lang', language);
      document.documentElement.lang = language;
    } catch {}
  }, [language]);

  const t = useMemo(() => createTranslator(language), [language]);
  const langMeta = useMemo(() => getLanguageMeta(language), [language]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  // Route-driven Product Detail Page (/product/:slug?color=idx)
  const parseProductRoute = () => {
    if (typeof window === 'undefined') return { slug: null, colorIdx: 0 };
    const m = window.location.pathname.match(/^\/product\/([^/?#]+)/);
    const params = new URLSearchParams(window.location.search);
    const parsedColor = parseInt(params.get('color') || '0', 10);
    return {
      slug: m ? decodeURIComponent(m[1]) : null,
      colorIdx: Number.isFinite(parsedColor) && parsedColor >= 0 ? parsedColor : 0
    };
  };
  const [routeState, setRouteState] = useState(parseProductRoute);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColorIdx, setSelectedColorIdx] = useState(() => parseProductRoute().colorIdx);
  const [modalImgIdx, setModalImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    const onPopState = () => {
      const next = parseProductRoute();
      setRouteState(next);
      setSelectedColorIdx(next.colorIdx);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const [activeNewArrivalsTab, setActiveNewArrivalsTab] = useState('MEN');
  const [saleGenderFilter, setSaleGenderFilter] = useState('ALL'); // 'ALL' | 'MEN' | 'WOMEN'
  const [saleCategoryFilter, setSaleCategoryFilter] = useState('ALL');
  const [showAllSale, setShowAllSale] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Real Customer Checkout Drawer State
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'form' | 'success'
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    city: 'Tunis',
    notes: '',
    payment_method: 'cash_on_delivery'
  });
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [navVisible, setNavVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFittingLab, setShowFittingLab] = useState(false);
  const [fittingLabProduct, setFittingLabProduct] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);

  const handleOpenFittingLab = (prodToFit = null) => {
    setFittingLabProduct(prodToFit || null);
    setShowFittingLab(true);
  };

  // Cart & Wishlist state
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState(['zara-w1', 'zara-m1']);

  // Trigger nav appear animation after 1.1s (exact Framer appear timing)
  useEffect(() => {
    const timer = setTimeout(() => setNavVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Section Refs for scroll-driven animations
  const aboutRef = useRef(null);
  const aboutProgress = useElementScrollProgress(aboutRef);

  const giftRef = useRef(null);
  const giftProgress = useElementScrollProgress(giftRef);

  const featuresRef = useRef(null);
  const featuresProgress = useElementScrollProgress(featuresRef);

  // Currency Options - Defaulting to Tunisian Dinar (DT / TND) as Base 1.0
  const currencies = [
    { code: 'TND', symbol: 'DT', rate: 1.0, flag: '🇹🇳', name: 'Tunisian Dinar (DT)' },
    { code: 'USD', symbol: '$', rate: 0.32, flag: '🇺🇸', name: 'United States Dollar' },
    { code: 'EUR', symbol: '€', rate: 0.30, flag: '🇪🇺', name: 'Eurozone EUR' },
    { code: 'GBP', symbol: '£', rate: 0.25, flag: '🇬🇧', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', rate: 49.5, flag: '🇯🇵', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'CA$', rate: 0.44, flag: '🇨🇦', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'AU$', rate: 0.49, flag: '🇦🇺', name: 'Australian Dollar' }
  ];

  const currentCurrency = useMemo(() => {
    return currencies.find(c => c.code === activeCurrencyCode) || currencies[0];
  }, [activeCurrencyCode]);

  const formatPrice = (tnd) => {
    if (typeof tnd !== 'number') return '0.00 DT';
    const converted = tnd * currentCurrency.rate;
    if (activeCurrencyCode === 'TND') {
      return `${converted.toFixed(2)} DT`;
    }
    if (activeCurrencyCode === 'JPY') {
      return `${currentCurrency.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${currentCurrency.symbol}${converted.toFixed(2)}`;
  };

  const toggleWishlist = (id) => {
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectProduct = (prod, colorIdx = 0) => {
    if (!prod) return;
    const safeIdx = (prod.colorVariants && prod.colorVariants[colorIdx]) ? colorIdx : 0;
    const targetSlug = prod.slug || prod.id;
    const nextUrl = `/product/${encodeURIComponent(targetSlug)}?color=${safeIdx}`;
    try {
      window.history.pushState({ slug: targetSlug, colorIdx: safeIdx }, '', nextUrl);
    } catch (e) {
      // ignore sandbox history errors
    }
    setRouteState({ slug: targetSlug, colorIdx: safeIdx });
    setSelectedProduct(prod);
    setSelectedColorIdx(safeIdx);
    setModalImgIdx(0);
    setSelectedSize(prod.sizes?.[0] || 'M');
    const chosenName = prod.colorVariants?.[safeIdx]?.name || prod.colors?.[safeIdx] || prod.colors?.[0] || 'Standard';
    setSelectedColor(chosenName);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectColorIdxOnPage = (nextIdx) => {
    const activeProd = selectedProduct || products.find((p) => p.slug === routeState.slug || p.id === routeState.slug);
    if (!activeProd) return;
    const safeIdx = (activeProd.colorVariants && activeProd.colorVariants[nextIdx]) ? nextIdx : 0;
    setSelectedColorIdx(safeIdx);
    const chosenName = activeProd.colorVariants?.[safeIdx]?.name || activeProd.colors?.[safeIdx] || 'Standard';
    setSelectedColor(chosenName);
    try {
      const targetSlug = activeProd.slug || activeProd.id;
      window.history.replaceState(
        { slug: targetSlug, colorIdx: safeIdx },
        '',
        `/product/${encodeURIComponent(targetSlug)}?color=${safeIdx}`
      );
    } catch (e) {
      // ignore
    }
  };

  const navigateToHome = (hash = '#sale', genderOverride = null) => {
    if (genderOverride) {
      setSaleGenderFilter(genderOverride);
      setSaleCategoryFilter('ALL');
    }
    const cleanHash = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
    try {
      window.history.pushState({}, '', `/${cleanHash}`);
    } catch (e) {
      // ignore
    }
    setRouteState({ slug: null, colorIdx: 0 });
    setSelectedProduct(null);
    setTimeout(() => {
      if (cleanHash) {
        const el = document.querySelector(cleanHash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 60);
  };

  const addToCart = (product, size = 'M', color = '', qty = 1) => {
    const chosenColor = color || product.colors?.[0] || 'Standard';
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.size === size && i.color === chosenColor);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && i.size === size && i.color === chosenColor
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { product, size, color: chosenColor, quantity: qty }];
    });
    setShowCartDrawer(true);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Fallback Master Products Catalog
  const fallbackProducts = [
      {
          "id": "zara-w1",
          "slug": "trf-mid-waist-baggy-folded-fit-jeans-zara-w1",
          "name": "TRF MID-WAIST BAGGY FOLDED JEANS",
          "category": "Jeans",
          "gender": "WOMEN",
          "price": 219.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1934/235",
          "image": "https://static.zara.net/assets/public/e42a/1dff/b4d140a79012/a5bc68158d8d/01934235400-p/01934235400-p.jpg?ts=1787562773125&w=850",
          "images": [
              "https://static.zara.net/assets/public/e42a/1dff/b4d140a79012/a5bc68158d8d/01934235400-p/01934235400-p.jpg?ts=1787562773125&w=850",
              "https://static.zara.net/assets/public/0e7c/20be/0b4f4eec88b5/3d462397ea93/01934235400-a1/01934235400-a1.jpg?ts=1787562772712&w=850",
              "https://static.zara.net/assets/public/7d9a/1f29/ad444fddaab2/1ec21889019c/01934235400-a2/01934235400-a2.jpg?ts=1787562773246&w=850",
              "https://static.zara.net/assets/public/7b0f/e7bf/75ef4494a7d7/093de50dfeba/01934235400-a3/01934235400-a3.jpg?ts=1787562773832&w=850",
              "https://static.zara.net/assets/public/3408/02dd/e1d641ac8f48/caa7bc88089a/01934235400-a4/01934235400-a4.jpg?ts=1787562774430&w=850",
              "https://static.zara.net/assets/public/9ddf/faec/f27d4dca9e9a/83b1a4d7de61/01934235400-e1/01934235400-e1.jpg?ts=1787570745825&w=850",
              "https://static.zara.net/assets/public/056c/d010/b9f842e9afce/c2ca0e2b0992/01934235400-e2/01934235400-e2.jpg?ts=1787570744907&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Blue",
                  "hex": "#253241",
                  "reference": "1934/235",
                  "images": [
                      "https://static.zara.net/assets/public/e42a/1dff/b4d140a79012/a5bc68158d8d/01934235400-p/01934235400-p.jpg?ts=1787562773125&w=850",
                      "https://static.zara.net/assets/public/0e7c/20be/0b4f4eec88b5/3d462397ea93/01934235400-a1/01934235400-a1.jpg?ts=1787562772712&w=850",
                      "https://static.zara.net/assets/public/7d9a/1f29/ad444fddaab2/1ec21889019c/01934235400-a2/01934235400-a2.jpg?ts=1787562773246&w=850",
                      "https://static.zara.net/assets/public/7b0f/e7bf/75ef4494a7d7/093de50dfeba/01934235400-a3/01934235400-a3.jpg?ts=1787562773832&w=850",
                      "https://static.zara.net/assets/public/3408/02dd/e1d641ac8f48/caa7bc88089a/01934235400-a4/01934235400-a4.jpg?ts=1787562774430&w=850",
                      "https://static.zara.net/assets/public/9ddf/faec/f27d4dca9e9a/83b1a4d7de61/01934235400-e1/01934235400-e1.jpg?ts=1787570745825&w=850",
                      "https://static.zara.net/assets/public/056c/d010/b9f842e9afce/c2ca0e2b0992/01934235400-e2/01934235400-e2.jpg?ts=1787570744907&w=850"
                  ]
              },
              {
                  "name": "Navy blue",
                  "hex": "#30404A",
                  "reference": "1934/235",
                  "images": [
                      "https://static.zara.net/assets/public/cccd/c5df/ec2f460190ff/44097904dd4a/00159212401-p/00159212401-p.jpg?ts=1793205879389&w=850",
                      "https://static.zara.net/assets/public/f93e/b950/b3cd42c7beac/a9078296f03a/00159212401-a1/00159212401-a1.jpg?ts=1793205879162&w=850",
                      "https://static.zara.net/assets/public/3e01/5caa/4d6c49bcb53e/34f638254c89/00159212401-a2/00159212401-a2.jpg?ts=1793205879333&w=850",
                      "https://static.zara.net/assets/public/1fc2/79bb/0802448f9b73/aab5112b43f6/00159212401-a3/00159212401-a3.jpg?ts=1793205879424&w=850",
                      "https://static.zara.net/assets/public/e28a/8860/89784cacaeb3/72d4134fc87c/00159212401-a4/00159212401-a4.jpg?ts=1793205878846&w=850",
                      "https://static.zara.net/assets/public/ad9b/053b/53ba4374877f/8a617d374f14/00159212401-a5/00159212401-a5.jpg?ts=1793205880056&w=850",
                      "https://static.zara.net/assets/public/415c/a24f/1a9a4cf1b28e/5ef18dc8b6ca/00159212401-e1/00159212401-e1.jpg?ts=1792135148830&w=850",
                      "https://static.zara.net/assets/public/7d7e/a89c/df0c45cd8876/746defad2f65/00159212401-e2/00159212401-e2.jpg?ts=1792218819601&w=850"
                  ]
              },
              {
                  "name": "Light blue",
                  "hex": "#798798",
                  "reference": "1934/235",
                  "images": [
                      "https://static.zara.net/assets/public/0735/ec1f/7b6b448fadbc/8a7b01dda7f7/04592235406-p/04592235406-p.jpg?ts=1789719349389&w=850",
                      "https://static.zara.net/assets/public/e352/b982/de3c42aea471/c484a6377ff0/04592235406-a1/04592235406-a1.jpg?ts=1789719349586&w=850",
                      "https://static.zara.net/assets/public/eefb/10ab/fc374ef9ab5a/246fe9bcddef/04592235406-a2/04592235406-a2.jpg?ts=1789719349120&w=850",
                      "https://static.zara.net/assets/public/9470/a0e5/da084c2d8583/337123f631f2/04592235406-a3/04592235406-a3.jpg?ts=1789719349489&w=850",
                      "https://static.zara.net/assets/public/f599/b826/439441b0aeff/a8f3d9bac633/04592235406-a4/04592235406-a4.jpg?ts=1789719349608&w=850",
                      "https://static.zara.net/assets/public/6522/542a/a2d2475497eb/1936dd07f159/04592235406-a5/04592235406-a5.jpg?ts=1789719350296&w=850",
                      "https://static.zara.net/assets/public/fe25/2e2e/289f4387be18/6e416734ba8e/04592235406-a6/04592235406-a6.jpg?ts=1789719349280&w=850",
                      "https://static.zara.net/assets/public/4a91/51eb/5851450b90db/5321121b7667/04592235406-a7/04592235406-a7.jpg?ts=1789719348624&w=850"
                  ]
              },
              {
                  "name": "Ecru",
                  "hex": "#E7E5DC",
                  "reference": "1934/235",
                  "images": [
                      "https://static.zara.net/assets/public/4cb8/b35c/0bfd4f6a88e2/049f672a801a/06136235712-p/06136235712-p.jpg?ts=1787652333354&w=850",
                      "https://static.zara.net/assets/public/a679/4709/068f4599b38e/7953dbdc8d89/06136235712-a1/06136235712-a1.jpg?ts=1787652333452&w=850",
                      "https://static.zara.net/assets/public/fa4c/9c5d/38f4496bb172/a85a7f19f285/06136235712-a2/06136235712-a2.jpg?ts=1787652333429&w=850",
                      "https://static.zara.net/assets/public/8fb6/c6b4/18c1443eb61f/38f3f6808cdf/06136235712-a3/06136235712-a3.jpg?ts=1787652333889&w=850",
                      "https://static.zara.net/assets/public/33ea/623f/29e144d5b2d8/2e01878c951f/06136235712-a4/06136235712-a4.jpg?ts=1787652332848&w=850",
                      "https://static.zara.net/assets/public/fc92/2994/85ca4ec997fd/584ac797ee05/06136235712-a5/06136235712-a5.jpg?ts=1787652333996&w=850",
                      "https://static.zara.net/assets/public/60a9/68fc/e2e746aaa1f3/2b17ef4da779/06136235712-e1/06136235712-e1.jpg?ts=1787570571227&w=850",
                      "https://static.zara.net/assets/public/1acb/8291/c4464b5da1d9/d3977da7848d/06136235712-e2/06136235712-e2.jpg?ts=1787570571894&w=850"
                  ]
              },
              {
                  "name": "Brown / Taupe",
                  "hex": "#827466",
                  "reference": "1934/235",
                  "images": [
                      "https://static.zara.net/assets/public/ce40/ce3b/df7c48249e9d/eef3c3adca53/08727236737-p/08727236737-p.jpg?ts=1787562772601&w=850",
                      "https://static.zara.net/assets/public/43af/5122/d5e6415292f1/3ab0dd0b2178/08727236737-a1/08727236737-a1.jpg?ts=1787562773453&w=850",
                      "https://static.zara.net/assets/public/7f9c/bad7/a2454de9965c/aac3a8883c7b/08727236737-a2/08727236737-a2.jpg?ts=1787562773418&w=850",
                      "https://static.zara.net/assets/public/1f4d/2734/4a754a808a0d/23578753e0ab/08727236737-a3/08727236737-a3.jpg?ts=1787562773916&w=850",
                      "https://static.zara.net/assets/public/6b36/971b/77344073be26/2bdff9338ab0/08727236737-a4/08727236737-a4.jpg?ts=1787562773780&w=850",
                      "https://static.zara.net/assets/public/59e2/61d4/41ff4e799693/ff3e430de294/08727236737-e1/08727236737-e1.jpg?ts=1787570571517&w=850",
                      "https://static.zara.net/assets/public/dbc7/3291/badf49ebb294/84edd0ed0753/08727236737-e2/08727236737-e2.jpg?ts=1787570571277&w=850",
                      "https://static.zara.net/assets/public/94fa/4cd6/edc94f56af52/5f848c888e27/08727236737-e3/08727236737-e3.jpg?ts=1787570572605&w=850"
                  ]
              },
              {
                  "name": "Faded black",
                  "hex": "#0A0A0A",
                  "reference": "1934/235",
                  "images": [
                      "https://static.zara.net/assets/public/ce8e/e225/998645aca803/3231769934ea/01934235833-000-p/01934235833-000-p.jpg?ts=1789984694283&w=850",
                      "https://static.zara.net/assets/public/3c36/858b/da18433ab665/2712d000e754/08727236833-a1/08727236833-a1.jpg?ts=1789455587506&w=850",
                      "https://static.zara.net/assets/public/33dd/742d/cc764b3ab72e/d2b362f7b584/01934235833-000-a2/01934235833-000-a2.jpg?ts=1790005487672&w=850",
                      "https://static.zara.net/assets/public/5353/afb3/b42a4ec7acba/610514d23606/08727236833-a3/08727236833-a3.jpg?ts=1789455586809&w=850",
                      "https://static.zara.net/assets/public/9a50/528a/feab432fad07/17afb2f233af/08727236833-a4/08727236833-a4.jpg?ts=1789455588685&w=850",
                      "https://static.zara.net/assets/public/e504/1588/2a734f8cbbfb/e94018c1defe/08727236833-a5/08727236833-a5.jpg?ts=1789455587522&w=850",
                      "https://static.zara.net/assets/public/8a2e/6916/84aa43d9b06f/7d9c546236f5/08727236833-a6/08727236833-a6.jpg?ts=1789455587623&w=850",
                      "https://static.zara.net/assets/public/f31e/2535/cb334e63a4cb/13582b48879f/08727236833-e1/08727236833-e1.jpg?ts=1789645425791&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "32",
              "34",
              "36",
              "38",
              "40",
              "42",
              "44",
              "46"
          ],
          "colors": [
              "Blue",
              "Navy blue",
              "Light blue",
              "Ecru",
              "Brown / Taupe",
              "Faded black"
          ],
          "description": "Model height: 180 cm\n\nMID-WAIST - BAGGY FOLDED. Mid-waist jeans with a five-pocket design. Featuring a contrasting turn-up hem. Front zip fly and metal top button fastening.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-m1",
          "slug": "textured-check-cropped-fit-jacket-zara-m1",
          "name": "TEXTURED CHECK CROPPED FIT JACKET",
          "category": "Jackets",
          "gender": "MEN",
          "price": 299.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1437/388",
          "image": "https://static.zara.net/assets/public/7885/679c/95ba446d93fa/8fb1b0121dcd/01437388076-p/01437388076-p.jpg?ts=1794212222104&w=850",
          "images": [
              "https://static.zara.net/assets/public/7885/679c/95ba446d93fa/8fb1b0121dcd/01437388076-p/01437388076-p.jpg?ts=1794212222104&w=850",
              "https://static.zara.net/assets/public/ddca/3733/4b0a4e1ca594/a7c030c214b8/01437388076-a1/01437388076-a1.jpg?ts=1794212223368&w=850",
              "https://static.zara.net/assets/public/52ed/d1ee/998941b29f6c/1d114a4b8cc9/01437388076-a2/01437388076-a2.jpg?ts=1794212224269&w=850",
              "https://static.zara.net/assets/public/14b1/aeac/ad3c4a679b9d/79b542e61ebc/01437388076-a3/01437388076-a3.jpg?ts=1794212221928&w=850",
              "https://static.zara.net/assets/public/05e3/1b55/31b8437c9903/8773ee5360cb/01437388076-a4/01437388076-a4.jpg?ts=1794212222242&w=850",
              "https://static.zara.net/assets/public/19da/e795/e45841b2b1e4/ebccdfc1a2ec/01437388076-a5/01437388076-a5.jpg?ts=1794212224527&w=850",
              "https://static.zara.net/assets/public/8eee/4611/1bf44be89902/287226480087/01437388076-e1/01437388076-e1.jpg?ts=1792654505828&w=850",
              "https://static.zara.net/assets/public/e121/801c/11c34c43b9de/be05b6251e8a/01437388076-e2/01437388076-e2.jpg?ts=1792654504518&w=850"
          ],
          "colorVariants": [
              {
                  "name": "red/navy",
                  "hex": "#3D2E2D",
                  "reference": "1437/388",
                  "images": [
                      "https://static.zara.net/assets/public/7885/679c/95ba446d93fa/8fb1b0121dcd/01437388076-p/01437388076-p.jpg?ts=1794212222104&w=850",
                      "https://static.zara.net/assets/public/ddca/3733/4b0a4e1ca594/a7c030c214b8/01437388076-a1/01437388076-a1.jpg?ts=1794212223368&w=850",
                      "https://static.zara.net/assets/public/52ed/d1ee/998941b29f6c/1d114a4b8cc9/01437388076-a2/01437388076-a2.jpg?ts=1794212224269&w=850",
                      "https://static.zara.net/assets/public/14b1/aeac/ad3c4a679b9d/79b542e61ebc/01437388076-a3/01437388076-a3.jpg?ts=1794212221928&w=850",
                      "https://static.zara.net/assets/public/05e3/1b55/31b8437c9903/8773ee5360cb/01437388076-a4/01437388076-a4.jpg?ts=1794212222242&w=850",
                      "https://static.zara.net/assets/public/19da/e795/e45841b2b1e4/ebccdfc1a2ec/01437388076-a5/01437388076-a5.jpg?ts=1794212224527&w=850",
                      "https://static.zara.net/assets/public/8eee/4611/1bf44be89902/287226480087/01437388076-e1/01437388076-e1.jpg?ts=1792654505828&w=850",
                      "https://static.zara.net/assets/public/e121/801c/11c34c43b9de/be05b6251e8a/01437388076-e2/01437388076-e2.jpg?ts=1792654504518&w=850"
                  ]
              },
              {
                  "name": "Blue",
                  "hex": "#363E4F",
                  "reference": "1437/388",
                  "images": [
                      "https://static.zara.net/assets/public/dc56/7a7c/1afe4226a2a5/8ea67e0f16d5/01437388400-p/01437388400-p.jpg?ts=1794327540571&w=850",
                      "https://static.zara.net/assets/public/a7e5/0db1/9b5e4b8d91ff/396b0e551585/01437388400-a1/01437388400-a1.jpg?ts=1794327539356&w=850",
                      "https://static.zara.net/assets/public/84de/41f2/24a642638697/3efd09c192fe/01437388400-a2/01437388400-a2.jpg?ts=1794327541914&w=850",
                      "https://static.zara.net/assets/public/3b90/2ab7/4f234712a9fe/6eccd524ed25/01437388400-a3/01437388400-a3.jpg?ts=1794327541378&w=850",
                      "https://static.zara.net/assets/public/2dc4/b6e2/bd4b421abd35/42067e027fbe/01437388400-a4/01437388400-a4.jpg?ts=1794327541102&w=850",
                      "https://static.zara.net/assets/public/7f25/4869/cfa844a6adf8/d979fd1334ed/01437388400-a5/01437388400-a5.jpg?ts=1794327574881&w=850",
                      "https://static.zara.net/assets/public/3cb3/1e3e/e92148e18c0f/004e26488bae/01437388400-e1/01437388400-e1.jpg?ts=1792654507069&w=850",
                      "https://static.zara.net/assets/public/2224/ce7b/32af45488fe8/08d968155fd3/01437388400-e2/01437388400-e2.jpg?ts=1792654505731&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "red/navy",
              "Blue"
          ],
          "description": "Cropped fit jacket made of textured fabric. Collar with a hoodie and long sleeve. Front kangaroo pockets. Elastic trims. Zip-up front.",
          "materialCare": [
              "OUTER SHELL: 90% polyester, 10% wool"
          ]
      },
      {
          "id": "zara-w2",
          "slug": "z1975-high-waist-regular-long-length-jeans-zara-w2",
          "name": "Z1975 HIGH-WAIST REGULAR LONG LENGTH JEANS",
          "category": "Jeans",
          "gender": "WOMEN",
          "price": 169.0,
          "oldPrice": null,
          "discount": null,
          "reference": "8228/021",
          "image": "https://static.zara.net/assets/public/a208/48b2/064b4fe19e17/2f4d660dcb1d/08228021250-p/08228021250-p.jpg?ts=1770295384219&w=850",
          "images": [
              "https://static.zara.net/assets/public/a208/48b2/064b4fe19e17/2f4d660dcb1d/08228021250-p/08228021250-p.jpg?ts=1770295384219&w=850",
              "https://static.zara.net/assets/public/79fb/0e88/70214c6da016/3086feadab99/08228021250-a1/08228021250-a1.jpg?ts=1770295384403&w=850",
              "https://static.zara.net/assets/public/ac46/7018/e65f4af2a290/c3ea296c8c73/08228021250-a2/08228021250-a2.jpg?ts=1770295384473&w=850",
              "https://static.zara.net/assets/public/d455/3d6b/faf141deaa4c/0e8198bccbaa/08228021250-a3/08228021250-a3.jpg?ts=1770295384184&w=850",
              "https://static.zara.net/assets/public/6145/1ad0/b2cb4701b6d1/16ba95a0c097/08228021250-a4/08228021250-a4.jpg?ts=1770295384061&w=850",
              "https://static.zara.net/assets/public/0af2/2c83/8be34adfab96/c4d052f19908/08228021250-e1/08228021250-e1.jpg?ts=1784107614350&w=850",
              "https://static.zara.net/assets/public/0125/5312/4600466ca8d0/52e0d9b54884/08228021250-e2/08228021250-e2.jpg?ts=1784107614460&w=850",
              "https://static.zara.net/assets/public/ab47/940f/b9b949c48b87/77c361b43e8d/08228021250-e3/08228021250-e3.jpg?ts=1784107614846&w=850"
          ],
          "colorVariants": [
              {
                  "name": "White",
                  "hex": "#E6E6DF",
                  "reference": "8228/021",
                  "images": [
                      "https://static.zara.net/assets/public/a208/48b2/064b4fe19e17/2f4d660dcb1d/08228021250-p/08228021250-p.jpg?ts=1770295384219&w=850",
                      "https://static.zara.net/assets/public/79fb/0e88/70214c6da016/3086feadab99/08228021250-a1/08228021250-a1.jpg?ts=1770295384403&w=850",
                      "https://static.zara.net/assets/public/ac46/7018/e65f4af2a290/c3ea296c8c73/08228021250-a2/08228021250-a2.jpg?ts=1770295384473&w=850",
                      "https://static.zara.net/assets/public/d455/3d6b/faf141deaa4c/0e8198bccbaa/08228021250-a3/08228021250-a3.jpg?ts=1770295384184&w=850",
                      "https://static.zara.net/assets/public/6145/1ad0/b2cb4701b6d1/16ba95a0c097/08228021250-a4/08228021250-a4.jpg?ts=1770295384061&w=850",
                      "https://static.zara.net/assets/public/0af2/2c83/8be34adfab96/c4d052f19908/08228021250-e1/08228021250-e1.jpg?ts=1784107614350&w=850",
                      "https://static.zara.net/assets/public/0125/5312/4600466ca8d0/52e0d9b54884/08228021250-e2/08228021250-e2.jpg?ts=1784107614460&w=850",
                      "https://static.zara.net/assets/public/ab47/940f/b9b949c48b87/77c361b43e8d/08228021250-e3/08228021250-e3.jpg?ts=1784107614846&w=850"
                  ]
              },
              {
                  "name": "Light blue",
                  "hex": "#c0cfec",
                  "reference": "8228/021",
                  "images": [
                      "https://static.zara.net/assets/public/b8f6/c631/9fcc4244b849/328646e45ad6/08228121406-p/08228121406-p.jpg?ts=1793796027573&w=850",
                      "https://static.zara.net/assets/public/987d/b9b5/48234ae5b373/06269e110b30/08228121406-a1/08228121406-a1.jpg?ts=1793796026782&w=850",
                      "https://static.zara.net/assets/public/ef54/f62e/9ae3480d8620/cb754f30da7d/08228121406-a2/08228121406-a2.jpg?ts=1793796026772&w=850",
                      "https://static.zara.net/assets/public/f41e/f5fe/fb874c0c997a/421f5e0500f3/08228121406-a3/08228121406-a3.jpg?ts=1793796027611&w=850",
                      "https://static.zara.net/assets/public/8a2f/67a1/9cd845c6a4e9/7baa09e200fb/08228121406-a4/08228121406-a4.jpg?ts=1793796027702&w=850",
                      "https://static.zara.net/assets/public/bb37/8257/06124796bd5e/7191e42b5c4b/08228121406-a5/08228121406-a5.jpg?ts=1793796028253&w=850",
                      "https://static.zara.net/assets/public/51fc/3b64/167e49c6b752/f374b9fb4f52/08228121406-a6/08228121406-a6.jpg?ts=1793796027464&w=850",
                      "https://static.zara.net/assets/public/f6be/76e2/449647ba9587/895f05bb8526/08228021406-e1/08228021406-e1.jpg?ts=1784107652268&w=850"
                  ]
              },
              {
                  "name": "Blue",
                  "hex": "#192438",
                  "reference": "8228/021",
                  "images": [
                      "https://static.zara.net/assets/public/9e42/fc86/041944bd9106/fb768af45f48/08228236407-p/08228236407-p.jpg?ts=1793792945582&w=850",
                      "https://static.zara.net/assets/public/b6a0/150b/e39d467bbc9c/eaf757208c06/08228236407-a1/08228236407-a1.jpg?ts=1793792947201&w=850",
                      "https://static.zara.net/assets/public/fa8a/3637/21b049e487d2/4fbbae5258fd/08228236407-a2/08228236407-a2.jpg?ts=1793792944603&w=850",
                      "https://static.zara.net/assets/public/ca8f/46ac/7c244fbba682/04df7ee97888/08228236407-a3/08228236407-a3.jpg?ts=1793792952626&w=850",
                      "https://static.zara.net/assets/public/ccfa/552e/076b44debf25/20c1c5b9ffb8/08228236407-a4/08228236407-a4.jpg?ts=1793792946420&w=850",
                      "https://static.zara.net/assets/public/0c64/25d1/4c1e446ead0c/8fd2561db2f5/08228236407-a5/08228236407-a5.jpg?ts=1793792944543&w=850",
                      "https://static.zara.net/assets/public/fab3/b087/488c4dce91bd/63c040f5e21b/08228236407-a6/08228236407-a6.jpg?ts=1793792946841&w=850",
                      "https://static.zara.net/assets/public/6550/3e54/811f42438f22/729ee802bed8/08228236407-a7/08228236407-a7.jpg?ts=1793792946000&w=850"
                  ]
              },
              {
                  "name": "Mid-blue",
                  "hex": "#556386",
                  "reference": "8228/021",
                  "images": [
                      "https://static.zara.net/assets/public/e5df/ed34/96614d9aba7b/24be712ff5e2/08228236427-p/08228236427-p.jpg?ts=1793792947225&w=850",
                      "https://static.zara.net/assets/public/3bdf/92ad/cfdd4be28785/ff8966981caf/08228236427-a1/08228236427-a1.jpg?ts=1793792948516&w=850",
                      "https://static.zara.net/assets/public/3838/3f07/8b154f97aefe/203bb5df7014/08228236427-a2/08228236427-a2.jpg?ts=1793792944249&w=850",
                      "https://static.zara.net/assets/public/9630/95f9/c1524feb8ec9/27766ce979bc/08228236427-a3/08228236427-a3.jpg?ts=1793792945568&w=850",
                      "https://static.zara.net/assets/public/0291/b053/cd8649f1a36c/50aaadef595d/08228236427-a4/08228236427-a4.jpg?ts=1793792947124&w=850",
                      "https://static.zara.net/assets/public/c8d8/69f7/eefa4e31a4f7/dc17c356ad86/08228236427-a5/08228236427-a5.jpg?ts=1793792948229&w=850",
                      "https://static.zara.net/assets/public/a378/01ea/cda5414a93c1/b7bb3e8504ec/08228236427-a6/08228236427-a6.jpg?ts=1793792948216&w=850",
                      "https://static.zara.net/assets/public/6d98/e125/26d749a4a1af/ebfb9735349e/0822802142715-e1/0822802142715-e1.jpg?ts=1784107703479&w=850"
                  ]
              },
              {
                  "name": "Light mint green",
                  "hex": "#D1EBDF",
                  "reference": "8228/021",
                  "images": [
                      "https://static.zara.net/assets/public/47f0/b503/d0a94a1b8a8a/e71219f66da8/07949131551-p/07949131551-p.jpg?ts=1785916789715&w=850",
                      "https://static.zara.net/assets/public/1ceb/490c/a2ad459c9f99/35f34078e282/07949131551-a1/07949131551-a1.jpg?ts=1785916788039&w=850",
                      "https://static.zara.net/assets/public/691b/2e6a/f6d643f9bc91/b1bd5c9b5846/07949131551-a2/07949131551-a2.jpg?ts=1785916788821&w=850",
                      "https://static.zara.net/assets/public/f5d9/84fc/b0aa407f884b/d423a5cf78d5/07949131551-a3/07949131551-a3.jpg?ts=1785916790399&w=850",
                      "https://static.zara.net/assets/public/1dee/2aa5/128742048fc4/8c3bc13b24e6/07949131551-a4/07949131551-a4.jpg?ts=1785916790341&w=850",
                      "https://static.zara.net/assets/public/d655/38d7/19f0416eacd0/d89824e99458/07949131551-a5/07949131551-a5.jpg?ts=1785916790059&w=850",
                      "https://static.zara.net/assets/public/d9b5/dae5/448749c184b8/b339dd5e36d2/07949131551-a6/07949131551-a6.jpg?ts=1785916789980&w=850",
                      "https://static.zara.net/assets/public/41df/dd8c/3e8049e1ab3e/ab583d1819ba/07949131551-e1/07949131551-e1.jpg?ts=1785419232123&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#242524",
                  "reference": "8228/021",
                  "images": [
                      "https://static.zara.net/assets/public/510a/8b5e/9b6a41b9a239/488006f70dd8/08228226800-p/08228226800-p.jpg?ts=1787650604080&w=850",
                      "https://static.zara.net/assets/public/99ed/3170/49a548f7b7f6/31aad66dea0b/08228226800-a1/08228226800-a1.jpg?ts=1787650601996&w=850",
                      "https://static.zara.net/assets/public/9ed5/1eb5/13224c86a1cb/8184703db869/08228226800-a2/08228226800-a2.jpg?ts=1787650602904&w=850",
                      "https://static.zara.net/assets/public/be87/bb37/5660451e970c/5a91672f1429/08228226800-a3/08228226800-a3.jpg?ts=1787650602317&w=850",
                      "https://static.zara.net/assets/public/3c4a/b6c0/74f34f05b57c/d31c1c77e3c5/08228226800-a4/08228226800-a4.jpg?ts=1787650602567&w=850",
                      "https://static.zara.net/assets/public/3fcc/eeac/b1504aa0a136/008e565b43df/08228226800-e1/08228226800-e1.jpg?ts=1784124093284&w=850",
                      "https://static.zara.net/assets/public/111e/a7ec/7d0a4fc2bfc3/504b34e14327/08228226800-e2/08228226800-e2.jpg?ts=1784124093491&w=850",
                      "https://static.zara.net/assets/public/51af/7efa/b24a47849c53/b1d517df9413/08228226800-e3/08228226800-e3.jpg?ts=1784124094158&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "32",
              "34",
              "36",
              "38",
              "40",
              "42",
              "44",
              "46"
          ],
          "colors": [
              "White",
              "Light blue",
              "Blue",
              "Mid-blue",
              "Light mint green",
              "Black"
          ],
          "description": "HIGH-WAIST - REGULAR LEG - LONG LENGTH - RIGID\n\nHigh-waist jeans with a five-pocket design. Straight, long leg. Front zip fly and button fastening.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-m2",
          "slug": "regular-fit-suede-leather-jacket-zara-m2",
          "name": "REGULAR FIT SUEDE LEATHER JACKET",
          "category": "Jackets",
          "gender": "MEN",
          "price": 759.0,
          "oldPrice": null,
          "discount": null,
          "reference": "3833/430",
          "image": "https://static.zara.net/assets/public/d612/b057/48304fcba6a1/a39e93def418/03833430401-p/03833430401-p.jpg?ts=1794404542576&w=850",
          "images": [
              "https://static.zara.net/assets/public/d612/b057/48304fcba6a1/a39e93def418/03833430401-p/03833430401-p.jpg?ts=1794404542576&w=850",
              "https://static.zara.net/assets/public/b7fd/00de/5c9046e58924/58b659f016ba/03833430401-a1/03833430401-a1.jpg?ts=1794404542733&w=850",
              "https://static.zara.net/assets/public/7599/812f/1cc343cfaa49/3a9c7c3d23da/03833430401-a2/03833430401-a2.jpg?ts=1794404543229&w=850",
              "https://static.zara.net/assets/public/003c/0a3d/b5a54df2bbd7/6b90743cc0f9/03833430401-a3/03833430401-a3.jpg?ts=1794404542375&w=850",
              "https://static.zara.net/assets/public/9cb6/92b0/52954a6abe08/dae9a7e7468c/03833430401-a4/03833430401-a4.jpg?ts=1794404542366&w=850",
              "https://static.zara.net/assets/public/49e7/c046/364d4f88bc18/328cf014ae88/03833430401-a5/03833430401-a5.jpg?ts=1794404543305&w=850",
              "https://static.zara.net/assets/public/dbce/dea6/09324cd9a0a3/57d6654f60ed/03833430401-a6/03833430401-a6.jpg?ts=1794404542653&w=850",
              "https://static.zara.net/assets/public/2ebe/1fa0/4a944db1bd20/d91e8cb291cd/03833430401-e1/03833430401-e1.jpg?ts=1786351604148&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Navy blue",
                  "hex": "#191821",
                  "reference": "3833/430",
                  "images": [
                      "https://static.zara.net/assets/public/d612/b057/48304fcba6a1/a39e93def418/03833430401-p/03833430401-p.jpg?ts=1794404542576&w=850",
                      "https://static.zara.net/assets/public/b7fd/00de/5c9046e58924/58b659f016ba/03833430401-a1/03833430401-a1.jpg?ts=1794404542733&w=850",
                      "https://static.zara.net/assets/public/7599/812f/1cc343cfaa49/3a9c7c3d23da/03833430401-a2/03833430401-a2.jpg?ts=1794404543229&w=850",
                      "https://static.zara.net/assets/public/003c/0a3d/b5a54df2bbd7/6b90743cc0f9/03833430401-a3/03833430401-a3.jpg?ts=1794404542375&w=850",
                      "https://static.zara.net/assets/public/9cb6/92b0/52954a6abe08/dae9a7e7468c/03833430401-a4/03833430401-a4.jpg?ts=1794404542366&w=850",
                      "https://static.zara.net/assets/public/49e7/c046/364d4f88bc18/328cf014ae88/03833430401-a5/03833430401-a5.jpg?ts=1794404543305&w=850",
                      "https://static.zara.net/assets/public/dbce/dea6/09324cd9a0a3/57d6654f60ed/03833430401-a6/03833430401-a6.jpg?ts=1794404542653&w=850",
                      "https://static.zara.net/assets/public/2ebe/1fa0/4a944db1bd20/d91e8cb291cd/03833430401-e1/03833430401-e1.jpg?ts=1786351604148&w=850"
                  ]
              },
              {
                  "name": "camel",
                  "hex": "#5F4731",
                  "reference": "3833/430",
                  "images": [
                      "https://static.zara.net/assets/public/4dfc/5c2d/4a9d4233befc/a02db8cf154f/03833430707-p/03833430707-p.jpg?ts=1786376617905&w=850",
                      "https://static.zara.net/assets/public/4bb3/23e0/bda24b1d8aa6/38de79b7b238/03833430707-a1/03833430707-a1.jpg?ts=1786376617018&w=850",
                      "https://static.zara.net/assets/public/56c6/9ed6/64524da497b3/352a2d6f60e6/03833430707-a2/03833430707-a2.jpg?ts=1786376618031&w=850",
                      "https://static.zara.net/assets/public/5b86/6a00/9b1a450eab6d/f9d6aeb601c9/03833430707-a3/03833430707-a3.jpg?ts=1786376617772&w=850",
                      "https://static.zara.net/assets/public/33c8/b70a/2b5f46e7b18f/431668b31f51/03833430707-a4/03833430707-a4.jpg?ts=1786376617907&w=850",
                      "https://static.zara.net/assets/public/b12e/8c7b/afea49aab701/d15425f26a32/03833430707-a5/03833430707-a5.jpg?ts=1786376618174&w=850",
                      "https://static.zara.net/assets/public/602d/fbec/d52b4538a5c5/0f46fbe5ec24/03833430707-e1/03833430707-e1.jpg?ts=1786351603393&w=850",
                      "https://static.zara.net/assets/public/5e62/9c03/a56e4ca7be90/2652b340087f/03833430707-e2/03833430707-e2.jpg?ts=1786351604146&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Navy blue",
              "camel"
          ],
          "description": "Regular fit jacket made of leather with a suede finish. Featuring a regular collar and long sleeve with buttoned cuffs. Welt pockets and an inner pocket detail. Elastic hem and front zip fastening.",
          "materialCare": [
              "OUTER SHELL: 100% pig leather"
          ]
      },
      {
          "id": "zara-w3",
          "slug": "hooded-bomber-jacket-zara-w3",
          "name": "HOODED BOMBER JACKET",
          "category": "Jackets",
          "gender": "WOMEN",
          "price": 159.0,
          "oldPrice": null,
          "discount": null,
          "reference": "8372/241",
          "image": "https://static.zara.net/assets/public/c44e/0abc/fc734967b31b/dd7c0dcff0b4/08372241712-p/08372241712-p.jpg?ts=1793189428428&w=850",
          "images": [
              "https://static.zara.net/assets/public/c44e/0abc/fc734967b31b/dd7c0dcff0b4/08372241712-p/08372241712-p.jpg?ts=1793189428428&w=850",
              "https://static.zara.net/assets/public/2d3d/d983/5cf94dc681ea/8bc9f693112d/08372241712-a1/08372241712-a1.jpg?ts=1793189426462&w=850",
              "https://static.zara.net/assets/public/d949/2f76/24c44ab59b3e/79a50cf24315/08372241712-a2/08372241712-a2.jpg?ts=1793189427928&w=850",
              "https://static.zara.net/assets/public/8be4/4ad7/ee23467cac8e/ac8b636f5bbd/08372241712-a3/08372241712-a3.jpg?ts=1793189428326&w=850",
              "https://static.zara.net/assets/public/42fa/e852/7a164555a594/61237c547911/08372241712-e1/08372241712-e1.jpg?ts=1786092945401&w=850",
              "https://static.zara.net/assets/public/4189/6657/7b134d1c8700/08218ca9480e/08372241712-e2/08372241712-e2.jpg?ts=1786092945372&w=850",
              "https://static.zara.net/assets/public/4730/5804/b76f417cb546/6f9d1f16c685/08372241712-e3/08372241712-e3.jpg?ts=1786092945539&w=850",
              "https://static.zara.net/assets/public/a70f/dbea/9681442789e9/a0e9bbfc9677/08372241712-e4/08372241712-e4.jpg?ts=1786092945857&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Ecru",
                  "hex": "#E6E6DF",
                  "reference": "8372/241",
                  "images": [
                      "https://static.zara.net/assets/public/c44e/0abc/fc734967b31b/dd7c0dcff0b4/08372241712-p/08372241712-p.jpg?ts=1793189428428&w=850",
                      "https://static.zara.net/assets/public/2d3d/d983/5cf94dc681ea/8bc9f693112d/08372241712-a1/08372241712-a1.jpg?ts=1793189426462&w=850",
                      "https://static.zara.net/assets/public/d949/2f76/24c44ab59b3e/79a50cf24315/08372241712-a2/08372241712-a2.jpg?ts=1793189427928&w=850",
                      "https://static.zara.net/assets/public/8be4/4ad7/ee23467cac8e/ac8b636f5bbd/08372241712-a3/08372241712-a3.jpg?ts=1793189428326&w=850",
                      "https://static.zara.net/assets/public/42fa/e852/7a164555a594/61237c547911/08372241712-e1/08372241712-e1.jpg?ts=1786092945401&w=850",
                      "https://static.zara.net/assets/public/4189/6657/7b134d1c8700/08218ca9480e/08372241712-e2/08372241712-e2.jpg?ts=1786092945372&w=850",
                      "https://static.zara.net/assets/public/4730/5804/b76f417cb546/6f9d1f16c685/08372241712-e3/08372241712-e3.jpg?ts=1786092945539&w=850",
                      "https://static.zara.net/assets/public/a70f/dbea/9681442789e9/a0e9bbfc9677/08372241712-e4/08372241712-e4.jpg?ts=1786092945857&w=850"
                  ]
              },
              {
                  "name": "Light camel",
                  "hex": "#A59277",
                  "reference": "8372/241",
                  "images": [
                      "https://static.zara.net/assets/public/7df9/d5ec/2ff54517a513/ef16ef62760c/08372241743-p/08372241743-p.jpg?ts=1793189428144&w=850",
                      "https://static.zara.net/assets/public/f9b2/ff37/f3614216a600/c82eb26dbf6c/08372241743-a1/08372241743-a1.jpg?ts=1793189427435&w=850",
                      "https://static.zara.net/assets/public/3452/1177/acbd432f8b50/7efd9b3f1afa/08372241743-a2/08372241743-a2.jpg?ts=1793189424655&w=850",
                      "https://static.zara.net/assets/public/4bf5/74af/07184d73b1a0/931e25e70087/08372241743-a3/08372241743-a3.jpg?ts=1793189428737&w=850",
                      "https://static.zara.net/assets/public/bf33/8602/6c3f43e199c6/96bed5dcccd2/08372241743-e1/08372241743-e1.jpg?ts=1786092114468&w=850",
                      "https://static.zara.net/assets/public/c3dc/1767/74074c9e947f/15fafa5e7071/08372241743-e2/08372241743-e2.jpg?ts=1786092113788&w=850",
                      "https://static.zara.net/assets/public/8833/0927/eff44a79838d/3baf37c17442/08372241743-e3/08372241743-e3.jpg?ts=1786092114188&w=850",
                      "https://static.zara.net/assets/public/5207/a700/2ab240ff9a6c/6e630c28aeba/08372241743-e4/08372241743-e4.jpg?ts=1786092114985&w=850"
                  ]
              },
              {
                  "name": "Anthracite grey",
                  "hex": "#242524",
                  "reference": "8372/241",
                  "images": [
                      "https://static.zara.net/assets/public/815c/cff4/bd6d4af48d4a/03b7e856d856/08372241807-p/08372241807-p.jpg?ts=1793189422967&w=850",
                      "https://static.zara.net/assets/public/0d10/87e1/98004d2b8e0c/b9c0b7862d39/08372241807-a1/08372241807-a1.jpg?ts=1793189424661&w=850",
                      "https://static.zara.net/assets/public/397a/a721/eb854bc4b328/6c172398ce5e/08372241807-a2/08372241807-a2.jpg?ts=1793189424160&w=850",
                      "https://static.zara.net/assets/public/6a0e/82b3/624e49199806/23ce0e18f839/08372241807-a3/08372241807-a3.jpg?ts=1793189427432&w=850",
                      "https://static.zara.net/assets/public/fbb7/9a81/6f444c01a023/d81aa96f7ae0/08372241807-e1/08372241807-e1.jpg?ts=1786712248258&w=850",
                      "https://static.zara.net/assets/public/2305/55e3/4a8a4d09b53c/07b5e9203045/08372241807-e2/08372241807-e2.jpg?ts=1786712247554&w=850",
                      "https://static.zara.net/assets/public/1272/1774/cee6403ea847/14035147a5de/08372241807-e3/08372241807-e3.jpg?ts=1786712248462&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Ecru",
              "Light camel",
              "Anthracite grey"
          ],
          "description": "Bomber-style jacket featuring a hood with adjustable drawstrings, long sleeves with cuffs, front pockets and front zip fastening.",
          "materialCare": [
              "OUTER SHELL: 97% polyester, 3% elastane",
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-m3",
          "slug": "water-repellent-relaxed-fit-jacket-zara-m3",
          "name": "RELAXED FIT WATER-REPELLENT JACKET",
          "category": "Jackets",
          "gender": "MEN",
          "price": 349.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1554/014",
          "image": "https://static.zara.net/assets/public/56db/46a9/465240f8a0e2/9776012b3626/00155401406-p/00155401406-p.jpg?ts=1793620757141&w=850",
          "images": [
              "https://static.zara.net/assets/public/56db/46a9/465240f8a0e2/9776012b3626/00155401406-p/00155401406-p.jpg?ts=1793620757141&w=850",
              "https://static.zara.net/assets/public/85f3/5881/2a91486da0cb/b95a4c9e9129/00155401406-a1/00155401406-a1.jpg?ts=1793620756153&w=850",
              "https://static.zara.net/assets/public/568a/5921/b4e347b8bbe5/705245e3d265/00155401406-a2/00155401406-a2.jpg?ts=1793620756580&w=850",
              "https://static.zara.net/assets/public/7a83/40a6/522b4a85a052/6ae42d31fb91/00155401406-a3/00155401406-a3.jpg?ts=1793620756397&w=850",
              "https://static.zara.net/assets/public/e9c2/1ef2/9a08488882c1/5e742691a233/00155401406-a4/00155401406-a4.jpg?ts=1793620756881&w=850",
              "https://static.zara.net/assets/public/ae3d/1c8c/ecd1473c9ff6/ba80578ece3c/00155401406-a5/00155401406-a5.jpg?ts=1793620756620&w=850",
              "https://static.zara.net/assets/public/b36f/8be0/11484f20b73f/cc99e6faaf5a/00155401406-a6/00155401406-a6.jpg?ts=1793620756015&w=850",
              "https://static.zara.net/assets/public/b892/1859/9461431390cd/5de7f02705b7/00155401406-e1/00155401406-e1.jpg?ts=1786530502501&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Light blue",
                  "hex": "#B1C7E0",
                  "reference": "1554/014",
                  "images": [
                      "https://static.zara.net/assets/public/56db/46a9/465240f8a0e2/9776012b3626/00155401406-p/00155401406-p.jpg?ts=1793620757141&w=850",
                      "https://static.zara.net/assets/public/85f3/5881/2a91486da0cb/b95a4c9e9129/00155401406-a1/00155401406-a1.jpg?ts=1793620756153&w=850",
                      "https://static.zara.net/assets/public/568a/5921/b4e347b8bbe5/705245e3d265/00155401406-a2/00155401406-a2.jpg?ts=1793620756580&w=850",
                      "https://static.zara.net/assets/public/7a83/40a6/522b4a85a052/6ae42d31fb91/00155401406-a3/00155401406-a3.jpg?ts=1793620756397&w=850",
                      "https://static.zara.net/assets/public/e9c2/1ef2/9a08488882c1/5e742691a233/00155401406-a4/00155401406-a4.jpg?ts=1793620756881&w=850",
                      "https://static.zara.net/assets/public/ae3d/1c8c/ecd1473c9ff6/ba80578ece3c/00155401406-a5/00155401406-a5.jpg?ts=1793620756620&w=850",
                      "https://static.zara.net/assets/public/b36f/8be0/11484f20b73f/cc99e6faaf5a/00155401406-a6/00155401406-a6.jpg?ts=1793620756015&w=850",
                      "https://static.zara.net/assets/public/b892/1859/9461431390cd/5de7f02705b7/00155401406-e1/00155401406-e1.jpg?ts=1786530502501&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#313131",
                  "reference": "1554/018",
                  "images": [
                      "https://static.zara.net/assets/public/da29/1974/852e4343b39d/1ee3c0bf41ad/00155401800-p/00155401800-p.jpg?ts=1793620756606&w=850",
                      "https://static.zara.net/assets/public/d86e/ee48/9cdb45cfa04c/e331745bf676/00155401800-a1/00155401800-a1.jpg?ts=1793620756891&w=850",
                      "https://static.zara.net/assets/public/c249/aa77/760446af98a7/700e33fdb36d/00155401800-a2/00155401800-a2.jpg?ts=1793620757133&w=850",
                      "https://static.zara.net/assets/public/22ee/38c9/70ab42a59dc4/de3ede735774/00155401800-a3/00155401800-a3.jpg?ts=1793620757312&w=850",
                      "https://static.zara.net/assets/public/64b0/7042/1e9d43d39320/bdf5aecf9f4c/00155401800-a4/00155401800-a4.jpg?ts=1793620757265&w=850",
                      "https://static.zara.net/assets/public/ed61/27d4/dc7d439787c0/9ec4d01f26ba/00155401800-e1/00155401800-e1.jpg?ts=1786530502107&w=850",
                      "https://static.zara.net/assets/public/7024/5ac1/ef84417cb587/2d970caccc57/00155401800-e2/00155401800-e2.jpg?ts=1786530500646&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Light blue",
              "Black"
          ],
          "description": "Relaxed fit jacket in a lightweight, water-repellent technical fabric. The material helps keep you dry during short periods of exposure to light rain.\n\nHigh neck with an adjustable hood and long raglan sleeves with elasticated cuffs. Features front patch pockets with flaps, an adjustable hem with elastic at the sides and a front zip fastening concealed by a placket with snap buttons.",
          "materialCare": [
              "OUTER SHELL: 100% polyamide"
          ]
      },
      {
          "id": "zara-w4",
          "slug": "bomber-jacket-with-wide-collar-zara-w4",
          "name": "BOMBER JACKET WITH WIDE COLLAR",
          "category": "Jackets",
          "gender": "WOMEN",
          "price": 299.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4344/652",
          "image": "https://static.zara.net/assets/public/da06/92ee/f0c44e04a52e/30ea3c27a48d/04344652700-p/04344652700-p.jpg?ts=1789715380932&w=850",
          "images": [
              "https://static.zara.net/assets/public/da06/92ee/f0c44e04a52e/30ea3c27a48d/04344652700-p/04344652700-p.jpg?ts=1789715380932&w=850",
              "https://static.zara.net/assets/public/5e20/85af/9e8e4524a5db/29ae390de1cb/04344652700-a2/04344652700-a2.jpg?ts=1789715374889&w=850",
              "https://static.zara.net/assets/public/ad6a/6a17/5b2242109a8b/115c771837e6/04344652700-a3/04344652700-a3.jpg?ts=1789715375579&w=850",
              "https://static.zara.net/assets/public/eb71/d227/039d4dfdbd2f/b25e9478068f/04344652700-a1/04344652700-a1.jpg?ts=1789715374984&w=850",
              "https://static.zara.net/assets/public/9083/0fd6/eabc480785f6/8b5061e5987f/04344652700-a4/04344652700-a4.jpg?ts=1789715376841&w=850",
              "https://static.zara.net/assets/public/fac1/eb16/0d504944ba20/2005e9295819/04344652700-a5/04344652700-a5.jpg?ts=1789715376691&w=850",
              "https://static.zara.net/assets/public/22cc/fac1/399c4b3faad1/55008918400d/04344652700-a6/04344652700-a6.jpg?ts=1789715377590&w=850",
              "https://static.zara.net/assets/public/1c0f/1191/5913495097de/477fd2be6ba8/04344652700-e1/04344652700-e1.jpg?ts=1789395597804&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Brown",
                  "hex": "#302217",
                  "reference": "4344/652",
                  "images": [
                      "https://static.zara.net/assets/public/da06/92ee/f0c44e04a52e/30ea3c27a48d/04344652700-p/04344652700-p.jpg?ts=1789715380932&w=850",
                      "https://static.zara.net/assets/public/5e20/85af/9e8e4524a5db/29ae390de1cb/04344652700-a2/04344652700-a2.jpg?ts=1789715374889&w=850",
                      "https://static.zara.net/assets/public/ad6a/6a17/5b2242109a8b/115c771837e6/04344652700-a3/04344652700-a3.jpg?ts=1789715375579&w=850",
                      "https://static.zara.net/assets/public/eb71/d227/039d4dfdbd2f/b25e9478068f/04344652700-a1/04344652700-a1.jpg?ts=1789715374984&w=850",
                      "https://static.zara.net/assets/public/9083/0fd6/eabc480785f6/8b5061e5987f/04344652700-a4/04344652700-a4.jpg?ts=1789715376841&w=850",
                      "https://static.zara.net/assets/public/fac1/eb16/0d504944ba20/2005e9295819/04344652700-a5/04344652700-a5.jpg?ts=1789715376691&w=850",
                      "https://static.zara.net/assets/public/22cc/fac1/399c4b3faad1/55008918400d/04344652700-a6/04344652700-a6.jpg?ts=1789715377590&w=850",
                      "https://static.zara.net/assets/public/1c0f/1191/5913495097de/477fd2be6ba8/04344652700-e1/04344652700-e1.jpg?ts=1789395597804&w=850"
                  ]
              },
              {
                  "name": "Light beige",
                  "hex": "#A59277",
                  "reference": "4344/652",
                  "images": [
                      "https://static.zara.net/assets/public/7fab/7072/47724d2b97b1/2b86fcf49a83/04344652746-a1/04344652746-a1.jpg?ts=1790179412274&w=850",
                      "https://static.zara.net/assets/public/02c5/2fda/1c814f2f892d/24038294b6e5/04344652746-a2/04344652746-a2.jpg?ts=1790179413703&w=850",
                      "https://static.zara.net/assets/public/e689/ba0e/ce954846aece/08c9b592788f/04344652746-e1/04344652746-e1.jpg?ts=1789632507908&w=850",
                      "https://static.zara.net/assets/public/6ea7/0ab3/f0df4916a674/1b314f4baeaf/04344652746-e2/04344652746-e2.jpg?ts=1789632507075&w=850",
                      "https://static.zara.net/assets/public/e869/8d31/71da4a15aadd/40cf8a7d0e6b/04344652746-e3/04344652746-e3.jpg?ts=1789632508303&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L"
          ],
          "colors": [
              "Brown",
              "Light beige"
          ],
          "description": "Model height: 183 cm\n\nJacket with a wide regular collar and long sleeve. Front pockets. Metal zip fastening at the front.",
          "materialCare": [
              "OUTER SHELL: 93% polyester, 7% elastane",
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-m4",
          "slug": "cropped-fit-padded-jacket-zara-m4",
          "name": "CROPPED FIT PADDED JACKET",
          "category": "Jackets",
          "gender": "MEN",
          "price": 399.0,
          "oldPrice": null,
          "discount": null,
          "reference": "6318/311",
          "image": "https://static.zara.net/assets/public/2724/1ac5/b4bd474b9f3a/a8fdd8a21a56/06318311660-p/06318311660-p.jpg?ts=1793891113047&w=850",
          "images": [
              "https://static.zara.net/assets/public/2724/1ac5/b4bd474b9f3a/a8fdd8a21a56/06318311660-p/06318311660-p.jpg?ts=1793891113047&w=850",
              "https://static.zara.net/assets/public/6f14/5818/5dfb430893ab/5fcad1fa81e8/06318311660-a1/06318311660-a1.jpg?ts=1793891114053&w=850",
              "https://static.zara.net/assets/public/b967/802c/d8c84623a2de/0d64eef3a70a/06318311660-a2/06318311660-a2.jpg?ts=1793891114064&w=850",
              "https://static.zara.net/assets/public/4ee6/6923/29db4efa8579/522245276a21/06318311660-a3/06318311660-a3.jpg?ts=1793891113509&w=850",
              "https://static.zara.net/assets/public/7227/23dd/9c8e4588a237/c85dfc3930ba/06318311660-a4/06318311660-a4.jpg?ts=1793891114181&w=850",
              "https://static.zara.net/assets/public/9263/a87e/23bc40c68cfc/306fd471c5f1/06318311660-a5/06318311660-a5.jpg?ts=1793893705824&w=850",
              "https://static.zara.net/assets/public/cc12/41ce/677140ffa9b7/1cf8df741046/06318311660-e1/06318311660-e1.jpg?ts=1793870276753&w=850",
              "https://static.zara.net/assets/public/76cc/27a9/83ce40ce9883/3fafdbe7c07d/06318311660-e2/06318311660-e2.jpg?ts=1793870275594&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Wine",
                  "hex": "#9b3a4f",
                  "reference": "6318/311",
                  "images": [
                      "https://static.zara.net/assets/public/2724/1ac5/b4bd474b9f3a/a8fdd8a21a56/06318311660-p/06318311660-p.jpg?ts=1793891113047&w=850",
                      "https://static.zara.net/assets/public/6f14/5818/5dfb430893ab/5fcad1fa81e8/06318311660-a1/06318311660-a1.jpg?ts=1793891114053&w=850",
                      "https://static.zara.net/assets/public/b967/802c/d8c84623a2de/0d64eef3a70a/06318311660-a2/06318311660-a2.jpg?ts=1793891114064&w=850",
                      "https://static.zara.net/assets/public/4ee6/6923/29db4efa8579/522245276a21/06318311660-a3/06318311660-a3.jpg?ts=1793891113509&w=850",
                      "https://static.zara.net/assets/public/7227/23dd/9c8e4588a237/c85dfc3930ba/06318311660-a4/06318311660-a4.jpg?ts=1793891114181&w=850",
                      "https://static.zara.net/assets/public/9263/a87e/23bc40c68cfc/306fd471c5f1/06318311660-a5/06318311660-a5.jpg?ts=1793893705824&w=850",
                      "https://static.zara.net/assets/public/cc12/41ce/677140ffa9b7/1cf8df741046/06318311660-e1/06318311660-e1.jpg?ts=1793870276753&w=850",
                      "https://static.zara.net/assets/public/76cc/27a9/83ce40ce9883/3fafdbe7c07d/06318311660-e2/06318311660-e2.jpg?ts=1793870275594&w=850"
                  ]
              },
              {
                  "name": "Dark grey",
                  "hex": "#191a1c",
                  "reference": "6318/311",
                  "images": [
                      "https://static.zara.net/assets/public/1964/bcd5/048a4006ac00/075495b68dc1/06318311922-p/06318311922-p.jpg?ts=1793880027287&w=850",
                      "https://static.zara.net/assets/public/25d1/16b1/6ea84ded87ba/a8df94617dbf/06318311922-a1/06318311922-a1.jpg?ts=1793880026680&w=850",
                      "https://static.zara.net/assets/public/a436/f408/a84d49a4ba65/e77642a68027/06318311922-a2/06318311922-a2.jpg?ts=1793880028038&w=850",
                      "https://static.zara.net/assets/public/61f8/17b0/5ece4452b270/8e75b2a7758b/06318311922-a3/06318311922-a3.jpg?ts=1793880027828&w=850",
                      "https://static.zara.net/assets/public/722c/c21d/8d0340108a17/ea257d4835b0/06318311922-a4/06318311922-a4.jpg?ts=1793880026213&w=850",
                      "https://static.zara.net/assets/public/5e6b/3433/7a1c4ef8b437/1ea4cd2f9ec4/06318311922-a5/06318311922-a5.jpg?ts=1793880027265&w=850",
                      "https://static.zara.net/assets/public/83db/59a1/0cbd4d4fb7cb/0f73e0f843fb/06318311922-a6/06318311922-a6.jpg?ts=1793880026545&w=850",
                      "https://static.zara.net/assets/public/30f7/bb87/ae6347beaed8/f35ecbad1d85/06318311922-e1/06318311922-e1.jpg?ts=1793870280889&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Wine",
              "Dark grey"
          ],
          "description": "Model height: 189 cm\n\nCropped fit jacket made of soft-touch fabric with light internal padding. High collar and long sleeve with elasticated cuffs. Patch pocket at the hip and inside pocket detail. Contrast topstitching throughout the garment. Elasticated hem. Two-way zip-up front.",
          "materialCare": [
              "LINING: 100% polyester",
              "FILLING: 100% polyester"
          ]
      },
      {
          "id": "zara-w5",
          "slug": "adjustable-waist-leather-effect-jacket-zara-w5",
          "name": "LEATHER EFFECT JACKET WITH ADJUSTABLE WAIST",
          "category": "Jackets",
          "gender": "WOMEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4749/706",
          "image": "https://static.zara.net/assets/public/f562/79a9/f53a4bb1a9a4/7939e398a597/04749706681-p/04749706681-p.jpg?ts=1786640027752&w=850",
          "images": [
              "https://static.zara.net/assets/public/f562/79a9/f53a4bb1a9a4/7939e398a597/04749706681-p/04749706681-p.jpg?ts=1786640027752&w=850",
              "https://static.zara.net/assets/public/3aa5/2598/ccac41f3828f/a2dd50722cac/04749706681-a1/04749706681-a1.jpg?ts=1786640027605&w=850",
              "https://static.zara.net/assets/public/c12e/cc16/bc354bedaf60/0458ff35cd0d/04749706681-a2/04749706681-a2.jpg?ts=1786640027585&w=850",
              "https://static.zara.net/assets/public/47fc/c7f0/518a4097b88a/a57e7572231c/04749706681-a3/04749706681-a3.jpg?ts=1786640027824&w=850",
              "https://static.zara.net/assets/public/ac2f/baba/c29242089423/c463e1604587/04749706681-a4/04749706681-a4.jpg?ts=1786640028036&w=850",
              "https://static.zara.net/assets/public/b384/e264/706349cba5b7/fd6a2a263cb2/04749706681-a5/04749706681-a5.jpg?ts=1786640028349&w=850",
              "https://static.zara.net/assets/public/ac85/99b2/005a4bdc83d7/13485ea84a09/04749706681-e1/04749706681-e1.jpg?ts=1786607533464&w=850",
              "https://static.zara.net/assets/public/8ffe/5fe5/5aa74c868568/8e85df7ee91c/04749706681-e2/04749706681-e2.jpg?ts=1786607532559&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Burgundy",
                  "hex": "#150608",
                  "reference": "4749/706",
                  "images": [
                      "https://static.zara.net/assets/public/f562/79a9/f53a4bb1a9a4/7939e398a597/04749706681-p/04749706681-p.jpg?ts=1786640027752&w=850",
                      "https://static.zara.net/assets/public/3aa5/2598/ccac41f3828f/a2dd50722cac/04749706681-a1/04749706681-a1.jpg?ts=1786640027605&w=850",
                      "https://static.zara.net/assets/public/c12e/cc16/bc354bedaf60/0458ff35cd0d/04749706681-a2/04749706681-a2.jpg?ts=1786640027585&w=850",
                      "https://static.zara.net/assets/public/47fc/c7f0/518a4097b88a/a57e7572231c/04749706681-a3/04749706681-a3.jpg?ts=1786640027824&w=850",
                      "https://static.zara.net/assets/public/ac2f/baba/c29242089423/c463e1604587/04749706681-a4/04749706681-a4.jpg?ts=1786640028036&w=850",
                      "https://static.zara.net/assets/public/b384/e264/706349cba5b7/fd6a2a263cb2/04749706681-a5/04749706681-a5.jpg?ts=1786640028349&w=850",
                      "https://static.zara.net/assets/public/ac85/99b2/005a4bdc83d7/13485ea84a09/04749706681-e1/04749706681-e1.jpg?ts=1786607533464&w=850",
                      "https://static.zara.net/assets/public/8ffe/5fe5/5aa74c868568/8e85df7ee91c/04749706681-e2/04749706681-e2.jpg?ts=1786607532559&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "4749/706",
                  "images": [
                      "https://static.zara.net/assets/public/892a/a05f/aafe4e8f885f/c566c0496307/04749706800-p/04749706800-p.jpg?ts=1791297243685&w=850",
                      "https://static.zara.net/assets/public/2f05/d987/2c964a84b94f/3d7bd314aa03/04749706800-a1/04749706800-a1.jpg?ts=1791297244501&w=850",
                      "https://static.zara.net/assets/public/86ab/e96f/764048128e2d/b82af04b1a08/04749706800-a2/04749706800-a2.jpg?ts=1791297243828&w=850",
                      "https://static.zara.net/assets/public/ff3b/b110/91f849f2bf41/64eb10860a71/04749706800-a3/04749706800-a3.jpg?ts=1791297243578&w=850",
                      "https://static.zara.net/assets/public/78c4/3240/e37040619045/d8943a955c63/04749706800-a4/04749706800-a4.jpg?ts=1791297243982&w=850",
                      "https://static.zara.net/assets/public/1f6d/b7e2/44654fd08074/cf5c745836b1/04749706800-e1/04749706800-e1.jpg?ts=1786607495938&w=850",
                      "https://static.zara.net/assets/public/a85e/8eb8/bc654a0bbe07/4cf07ed7e93f/04749706800-e2/04749706800-e2.jpg?ts=1786607496114&w=850",
                      "https://static.zara.net/assets/public/35f4/ed75/866648bdb66e/e8a37d3fb4e5/04749706800-e3/04749706800-e3.jpg?ts=1786607495220&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL",
              "XXL"
          ],
          "colors": [
              "Burgundy",
              "Black"
          ],
          "description": "Jacket with a high collar and long, drop-shoulder sleeves. Adjustable drawstring waist. Featuring front welt pockets and faux flap pockets. Matching lining. Front zip fastening.",
          "materialCare": [
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-m5",
          "slug": "non-iron-comfort-overshirt-zara-m5",
          "name": "NON-IRON COMFORT OVERSHIRT",
          "category": "Overshirts",
          "gender": "MEN",
          "price": 219.0,
          "oldPrice": null,
          "discount": null,
          "reference": "7484/895",
          "image": "https://static.zara.net/assets/public/6524/353c/a0a749278a99/cccc78f9b836/07484895709-p/07484895709-p.jpg?ts=1791985587408&w=850",
          "images": [
              "https://static.zara.net/assets/public/6524/353c/a0a749278a99/cccc78f9b836/07484895709-p/07484895709-p.jpg?ts=1791985587408&w=850",
              "https://static.zara.net/assets/public/e761/252d/ea4c4e129a43/84953a4676cd/07484895709-a1/07484895709-a1.jpg?ts=1791985586428&w=850",
              "https://static.zara.net/assets/public/f667/276a/86204b498fb2/045a9b6b486c/07484895709-a2/07484895709-a2.jpg?ts=1791985587016&w=850",
              "https://static.zara.net/assets/public/8131/fc12/52754a3d9fc8/2161b2460dc3/07484895709-a3/07484895709-a3.jpg?ts=1791985587636&w=850",
              "https://static.zara.net/assets/public/eb4d/83e1/2d86469884c8/2b459ee5d5c1/07484895709-e1/07484895709-e1.jpg?ts=1791901009431&w=850",
              "https://static.zara.net/assets/public/ca4b/f444/c72b4af6aa4e/5e858e797365/07484895709-e2/07484895709-e2.jpg?ts=1791901008869&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Dark tan",
                  "hex": "#B1A597",
                  "reference": "7484/895",
                  "images": [
                      "https://static.zara.net/assets/public/6524/353c/a0a749278a99/cccc78f9b836/07484895709-p/07484895709-p.jpg?ts=1791985587408&w=850",
                      "https://static.zara.net/assets/public/e761/252d/ea4c4e129a43/84953a4676cd/07484895709-a1/07484895709-a1.jpg?ts=1791985586428&w=850",
                      "https://static.zara.net/assets/public/f667/276a/86204b498fb2/045a9b6b486c/07484895709-a2/07484895709-a2.jpg?ts=1791985587016&w=850",
                      "https://static.zara.net/assets/public/8131/fc12/52754a3d9fc8/2161b2460dc3/07484895709-a3/07484895709-a3.jpg?ts=1791985587636&w=850",
                      "https://static.zara.net/assets/public/eb4d/83e1/2d86469884c8/2b459ee5d5c1/07484895709-e1/07484895709-e1.jpg?ts=1791901009431&w=850",
                      "https://static.zara.net/assets/public/ca4b/f444/c72b4af6aa4e/5e858e797365/07484895709-e2/07484895709-e2.jpg?ts=1791901008869&w=850"
                  ]
              },
              {
                  "name": "Chocolate",
                  "hex": "#242524",
                  "reference": "7484/895",
                  "images": [
                      "https://static.zara.net/assets/public/1c5f/d2c8/89fa4860b079/80251d64c40a/06861895717-p/06861895717-p.jpg?ts=1790865149813&w=850",
                      "https://static.zara.net/assets/public/31e6/80ad/c7e34008bb41/b5c7e9b2bc03/06861895717-a1/06861895717-a1.jpg?ts=1790865149666&w=850",
                      "https://static.zara.net/assets/public/abd7/2e19/9565489680f2/9440b0257acc/06861895717-a2/06861895717-a2.jpg?ts=1790865150467&w=850",
                      "https://static.zara.net/assets/public/3b88/56d2/de7d458f9263/1d2f4a5a05e4/06861895717-a3/06861895717-a3.jpg?ts=1790865147776&w=850",
                      "https://static.zara.net/assets/public/847c/a856/50ea40c59edd/51b414779c4f/06861895717-a4/06861895717-a4.jpg?ts=1790865150299&w=850",
                      "https://static.zara.net/assets/public/1902/0b8b/f96745858c0d/24340ec75128/06861895717-a5/06861895717-a5.jpg?ts=1790865149532&w=850",
                      "https://static.zara.net/assets/public/689c/e668/f8ba4d12afcd/5e07e691f71a/06861895717-a6/06861895717-a6.jpg?ts=1790865147360&w=850",
                      "https://static.zara.net/assets/public/5df3/0a4c/f136491c8603/b38fcfd2a841/06861895717-e1/06861895717-e1.jpg?ts=1784191177079&w=850"
                  ]
              },
              {
                  "name": "Tan marl",
                  "hex": "#867366",
                  "reference": "7484/895",
                  "images": [
                      "https://static.zara.net/assets/public/a8f5/74d9/ac584f2f8a36/f3843d895530/07484895723-p/07484895723-p.jpg?ts=1791467859179&w=850",
                      "https://static.zara.net/assets/public/b2bc/44a3/f50c44bba9f2/3f80f71f8a62/07484895723-a1/07484895723-a1.jpg?ts=1791467859507&w=850",
                      "https://static.zara.net/assets/public/0b1e/edd1/7710468f910c/0ffa492365c7/07484895723-a2/07484895723-a2.jpg?ts=1791467860018&w=850",
                      "https://static.zara.net/assets/public/d905/8bdd/1c87433b9b9e/b014252a426b/07484895723-a3/07484895723-a3.jpg?ts=1791467859176&w=850",
                      "https://static.zara.net/assets/public/158b/4487/262e4d5999f3/0a246a0f588c/07484895723-a4/07484895723-a4.jpg?ts=1791467859973&w=850",
                      "https://static.zara.net/assets/public/4afb/9ad7/66b748b28d9a/7d0e7966f428/07484895723-a5/07484895723-a5.jpg?ts=1791467860209&w=850",
                      "https://static.zara.net/assets/public/de36/666e/894a408bbb4e/c5261cdb226f/07484895723-e1/07484895723-e1.jpg?ts=1782899780685&w=850",
                      "https://static.zara.net/assets/public/b8a2/008a/391c4ccb8272/4c6842dc7082/07484895723-e2/07484895723-e2.jpg?ts=1782899780593&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "7484/895",
                  "images": [
                      "https://static.zara.net/assets/public/55ab/5294/6eaa485d8482/e444e6200fc4/07484895800-p/07484895800-p.jpg?ts=1791467864447&w=850",
                      "https://static.zara.net/assets/public/e587/9de8/dea2454e9aae/d95f2e5e7ea5/07484895800-a1/07484895800-a1.jpg?ts=1791467864093&w=850",
                      "https://static.zara.net/assets/public/50dc/bbf6/97464630a09c/1d4a6f24ea67/07484895800-a2/07484895800-a2.jpg?ts=1791467862882&w=850",
                      "https://static.zara.net/assets/public/a255/16d9/2a4045739a60/8892a13016fd/07484895800-a3/07484895800-a3.jpg?ts=1791467863589&w=850",
                      "https://static.zara.net/assets/public/d5d1/3870/24b645ccbddd/19edb86eb915/07484895800-a4/07484895800-a4.jpg?ts=1791467860751&w=850",
                      "https://static.zara.net/assets/public/8146/8200/02ef46bb8a72/e3f75f874770/07484895800-a5/07484895800-a5.jpg?ts=1791467863990&w=850",
                      "https://static.zara.net/assets/public/14b2/4107/cc9a43e592f6/eb85ba30ecd6/07484895800-e1/07484895800-e1.jpg?ts=1782899780998&w=850",
                      "https://static.zara.net/assets/public/62b9/c1cc/df1e4422a1bf/c067e89e8d41/07484895800-e2/07484895800-e2.jpg?ts=1782899782147&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Dark tan",
              "Chocolate",
              "Tan marl",
              "Black"
          ],
          "description": "Model height: 187 cm\n\nRegular fit overshirt made of breathable, stretch fabric that requires minimal ironing after washing. Featuring a regular collar, long sleeves with buttoned cuffs, a chest patch pocket, side vents at the hem and a snap-button front fastening.",
          "materialCare": [
              "OUTER SHELL: 82% polyester, 13% viscose, 5% elastane"
          ]
      },
      {
          "id": "zara-w6",
          "slug": "reversible-faux-fur-jacket-zara-w6",
          "name": "REVERSIBLE FAUX FUR JACKET",
          "category": "Jackets",
          "gender": "WOMEN",
          "price": 349.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4341/741",
          "image": "https://static.zara.net/assets/public/c794/9b25/736f4042865a/615677687be7/04341741708-p/04341741708-p.jpg?ts=1792154651721&w=850",
          "images": [
              "https://static.zara.net/assets/public/c794/9b25/736f4042865a/615677687be7/04341741708-p/04341741708-p.jpg?ts=1792154651721&w=850",
              "https://static.zara.net/assets/public/8b78/e963/34df4bf89e50/0d79c82bfcef/04341741708-a1/04341741708-a1.jpg?ts=1792154648087&w=850",
              "https://static.zara.net/assets/public/98c9/ec76/5d9b45368777/79db9064cff5/04341741708-a2/04341741708-a2.jpg?ts=1792154648779&w=850",
              "https://static.zara.net/assets/public/17d0/d6e7/a1a04602822d/ab1286a73829/04341741708-a3/04341741708-a3.jpg?ts=1792154648685&w=850",
              "https://static.zara.net/assets/public/2bf0/422b/91a54fc1a2ca/d1788b71cebd/04341741708-a4/04341741708-a4.jpg?ts=1792154650699&w=850",
              "https://static.zara.net/assets/public/9cba/6c3d/f0714d8c9148/1ccb091686f7/04341741708-a5/04341741708-a5.jpg?ts=1792154650893&w=850",
              "https://static.zara.net/assets/public/d0dd/8225/cd4b485d9910/ff0c4a82cd17/04341741708-a7/04341741708-a7.jpg?ts=1792146671658&w=850",
              "https://static.zara.net/assets/public/6091/991d/64bf4d8792eb/6010005514f7/04341741708-e1/04341741708-e1.jpg?ts=1791296281584&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Light tan",
                  "hex": "#A59277",
                  "reference": "4341/741",
                  "images": [
                      "https://static.zara.net/assets/public/c794/9b25/736f4042865a/615677687be7/04341741708-p/04341741708-p.jpg?ts=1792154651721&w=850",
                      "https://static.zara.net/assets/public/8b78/e963/34df4bf89e50/0d79c82bfcef/04341741708-a1/04341741708-a1.jpg?ts=1792154648087&w=850",
                      "https://static.zara.net/assets/public/98c9/ec76/5d9b45368777/79db9064cff5/04341741708-a2/04341741708-a2.jpg?ts=1792154648779&w=850",
                      "https://static.zara.net/assets/public/17d0/d6e7/a1a04602822d/ab1286a73829/04341741708-a3/04341741708-a3.jpg?ts=1792154648685&w=850",
                      "https://static.zara.net/assets/public/2bf0/422b/91a54fc1a2ca/d1788b71cebd/04341741708-a4/04341741708-a4.jpg?ts=1792154650699&w=850",
                      "https://static.zara.net/assets/public/9cba/6c3d/f0714d8c9148/1ccb091686f7/04341741708-a5/04341741708-a5.jpg?ts=1792154650893&w=850",
                      "https://static.zara.net/assets/public/d0dd/8225/cd4b485d9910/ff0c4a82cd17/04341741708-a7/04341741708-a7.jpg?ts=1792146671658&w=850",
                      "https://static.zara.net/assets/public/6091/991d/64bf4d8792eb/6010005514f7/04341741708-e1/04341741708-e1.jpg?ts=1791296281584&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#242524",
                  "reference": "4341/741",
                  "images": [
                      "https://static.zara.net/assets/public/3493/f1c9/780743ea84f5/e290f634be58/04341744800-p/04341744800-p.jpg?ts=1792683286448&w=850",
                      "https://static.zara.net/assets/public/4885/e69a/14df438698c1/c3201a8802df/04341744800-a1/04341744800-a1.jpg?ts=1792683274806&w=850",
                      "https://static.zara.net/assets/public/8bd1/4647/384142bd93c4/9686d53a4294/04341744800-a2/04341744800-a2.jpg?ts=1792683283706&w=850",
                      "https://static.zara.net/assets/public/6892/0a71/6f3b445ab045/4a09be94fa09/04341744800-a3/04341744800-a3.jpg?ts=1792683278093&w=850",
                      "https://static.zara.net/assets/public/7756/4c28/620347e69c05/c01fa0ddea4e/04341744800-a4/04341744800-a4.jpg?ts=1792683277974&w=850",
                      "https://static.zara.net/assets/public/55c3/f701/4ab442e39170/56019abd4156/04341744800-a5/04341744800-a5.jpg?ts=1792683285984&w=850",
                      "https://static.zara.net/assets/public/25b3/5326/de52498da608/9629985feca1/04341744800-e1/04341744800-e1.jpg?ts=1791296274106&w=850",
                      "https://static.zara.net/assets/public/dc04/425c/26814877825f/714998cc5670/04341744800-e2/04341744800-e2.jpg?ts=1791296274769&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL",
              "XXL"
          ],
          "colors": [
              "Light tan",
              "Black"
          ],
          "description": "Reversible jacket in technical fabric that repels water on contact. Helps keep you dry during light rain. High collar and long sleeve. Front welt pockets. Elasticated hem. Button fastening.",
          "materialCare": [
              "100% Certified Apparel Craft",
              "Machine wash at max 30°C / short spin"
          ]
      },
      {
          "id": "zara-m6",
          "slug": "regular-fit-leather-effect-overshirt-zara-m6",
          "name": "REGULAR FIT LEATHER EFFECT OVERSHIRT",
          "category": "Overshirts",
          "gender": "MEN",
          "price": 349.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1557/517",
          "image": "https://static.zara.net/assets/public/9602/0398/77264fa5a13b/c23080689ba4/00155751717-p/00155751717-p.jpg?ts=1786704608365&w=850",
          "images": [
              "https://static.zara.net/assets/public/9602/0398/77264fa5a13b/c23080689ba4/00155751717-p/00155751717-p.jpg?ts=1786704608365&w=850",
              "https://static.zara.net/assets/public/90e9/4aae/fe0a4464a03b/9753173ce187/00155751717-a1/00155751717-a1.jpg?ts=1786704609144&w=850",
              "https://static.zara.net/assets/public/7b6b/e897/c18740869ef2/5d5b08f8fd35/00155751717-a2/00155751717-a2.jpg?ts=1786704609187&w=850",
              "https://static.zara.net/assets/public/007e/eb05/172b4cfbb803/1df18d9569f6/00155751717-a3/00155751717-a3.jpg?ts=1786704610136&w=850",
              "https://static.zara.net/assets/public/e823/6c7a/95024978869c/954a9baa9fef/00155751717-a4/00155751717-a4.jpg?ts=1786704609067&w=850",
              "https://static.zara.net/assets/public/4d3e/120b/f5ed4bceb951/acae7ba7ed64/00155751717-a5/00155751717-a5.jpg?ts=1786704608734&w=850",
              "https://static.zara.net/assets/public/bcf5/d86c/15db4001bb44/c138f520dc1d/00155751717-a6/00155751717-a6.jpg?ts=1786704608995&w=850",
              "https://static.zara.net/assets/public/51f6/2678/7ba148f7a6a9/88b3582d0471/00155751717-e1/00155751717-e1.jpg?ts=1786626234242&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Chocolate",
                  "hex": "#3D2E2D",
                  "reference": "1557/517",
                  "images": [
                      "https://static.zara.net/assets/public/9602/0398/77264fa5a13b/c23080689ba4/00155751717-p/00155751717-p.jpg?ts=1786704608365&w=850",
                      "https://static.zara.net/assets/public/90e9/4aae/fe0a4464a03b/9753173ce187/00155751717-a1/00155751717-a1.jpg?ts=1786704609144&w=850",
                      "https://static.zara.net/assets/public/7b6b/e897/c18740869ef2/5d5b08f8fd35/00155751717-a2/00155751717-a2.jpg?ts=1786704609187&w=850",
                      "https://static.zara.net/assets/public/007e/eb05/172b4cfbb803/1df18d9569f6/00155751717-a3/00155751717-a3.jpg?ts=1786704610136&w=850",
                      "https://static.zara.net/assets/public/e823/6c7a/95024978869c/954a9baa9fef/00155751717-a4/00155751717-a4.jpg?ts=1786704609067&w=850",
                      "https://static.zara.net/assets/public/4d3e/120b/f5ed4bceb951/acae7ba7ed64/00155751717-a5/00155751717-a5.jpg?ts=1786704608734&w=850",
                      "https://static.zara.net/assets/public/bcf5/d86c/15db4001bb44/c138f520dc1d/00155751717-a6/00155751717-a6.jpg?ts=1786704608995&w=850",
                      "https://static.zara.net/assets/public/51f6/2678/7ba148f7a6a9/88b3582d0471/00155751717-e1/00155751717-e1.jpg?ts=1786626234242&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#242524",
                  "reference": "1557/518",
                  "images": [
                      "https://static.zara.net/assets/public/b145/121b/cace4424baeb/0855973e4662/00155751800-p/00155751800-p.jpg?ts=1786627001165&w=850",
                      "https://static.zara.net/assets/public/51ea/e115/212f4b5a924e/37bf9ce23518/00155751800-a1/00155751800-a1.jpg?ts=1786627001237&w=850",
                      "https://static.zara.net/assets/public/0d07/84c0/f88848ccb4c0/ede23e288f04/00155751800-a2/00155751800-a2.jpg?ts=1786627001166&w=850",
                      "https://static.zara.net/assets/public/0238/61b7/195a40e8b0b6/8482ec7ff37d/00155751800-a3/00155751800-a3.jpg?ts=1786627001021&w=850",
                      "https://static.zara.net/assets/public/1cfa/74ce/12184170ad06/6844bf99537b/00155751800-a4/00155751800-a4.jpg?ts=1786627001442&w=850",
                      "https://static.zara.net/assets/public/e294/e893/3beb44e6b56a/7e9b6fb5fa7f/00155751800-a5/00155751800-a5.jpg?ts=1786627001629&w=850",
                      "https://static.zara.net/assets/public/f1a9/c1cf/43384b6fa9cc/71682d961da5/00155751800-e1/00155751800-e1.jpg?ts=1786626237190&w=850",
                      "https://static.zara.net/assets/public/2f13/18a9/d8b04f15acd9/8955b704db38/00155751800-e2/00155751800-e2.jpg?ts=1786626236923&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Chocolate",
              "Black"
          ],
          "description": "Model height: 189 cm\n\nRegular fit overshirt in leather effect fabric. Features a regular collar, long sleeve finished with hidden snap button cuffs, welt hip pockets, irregular edges and front zip fastening.",
          "materialCare": [
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-w7",
          "slug": "blazer-with-vents-and-belt-zara-w7",
          "name": "BLAZER WITH VENTS AND BELT",
          "category": "Blazers",
          "gender": "WOMEN",
          "price": 329.0,
          "oldPrice": null,
          "discount": null,
          "reference": "3046/419",
          "image": "https://static.zara.net/assets/public/2596/b7e7/9b42411da1a5/3356a51e2ff1/03046419081-p/03046419081-p.jpg?ts=1793789461699&w=850",
          "images": [
              "https://static.zara.net/assets/public/2596/b7e7/9b42411da1a5/3356a51e2ff1/03046419081-p/03046419081-p.jpg?ts=1793789461699&w=850",
              "https://static.zara.net/assets/public/2f66/9b41/ea9b4669a27e/362cf8baed44/03046419081-a1/03046419081-a1.jpg?ts=1793789451233&w=850",
              "https://static.zara.net/assets/public/1b0d/39df/eec74471b14d/b5dc5032c119/03046419081-a2/03046419081-a2.jpg?ts=1793789450926&w=850",
              "https://static.zara.net/assets/public/dc72/5c83/98bb4ce983d5/1d0c25cb0b66/03046419081-a3/03046419081-a3.jpg?ts=1793789452044&w=850",
              "https://static.zara.net/assets/public/0c3e/f83b/2c344c5b941c/281e2e5a7d1b/03046419081-a4/03046419081-a4.jpg?ts=1793789457517&w=850",
              "https://static.zara.net/assets/public/b758/fa81/2019478caa20/aaebb98f4f31/03046419081-a5/03046419081-a5.jpg?ts=1793789457993&w=850",
              "https://static.zara.net/assets/public/b71d/1783/deb34bbe92b3/588af140a417/03046419081-a6/03046419081-a6.jpg?ts=1793789461375&w=850",
              "https://static.zara.net/assets/public/6040/11d9/ee304e6d8556/d0063eb3b1ca/03046419081-e1/03046419081-e1.jpg?ts=1793632663516&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Sand / Marl",
                  "hex": "#b8a897",
                  "reference": "3046/419",
                  "images": [
                      "https://static.zara.net/assets/public/2596/b7e7/9b42411da1a5/3356a51e2ff1/03046419081-p/03046419081-p.jpg?ts=1793789461699&w=850",
                      "https://static.zara.net/assets/public/2f66/9b41/ea9b4669a27e/362cf8baed44/03046419081-a1/03046419081-a1.jpg?ts=1793789451233&w=850",
                      "https://static.zara.net/assets/public/1b0d/39df/eec74471b14d/b5dc5032c119/03046419081-a2/03046419081-a2.jpg?ts=1793789450926&w=850",
                      "https://static.zara.net/assets/public/dc72/5c83/98bb4ce983d5/1d0c25cb0b66/03046419081-a3/03046419081-a3.jpg?ts=1793789452044&w=850",
                      "https://static.zara.net/assets/public/0c3e/f83b/2c344c5b941c/281e2e5a7d1b/03046419081-a4/03046419081-a4.jpg?ts=1793789457517&w=850",
                      "https://static.zara.net/assets/public/b758/fa81/2019478caa20/aaebb98f4f31/03046419081-a5/03046419081-a5.jpg?ts=1793789457993&w=850",
                      "https://static.zara.net/assets/public/b71d/1783/deb34bbe92b3/588af140a417/03046419081-a6/03046419081-a6.jpg?ts=1793789461375&w=850",
                      "https://static.zara.net/assets/public/6040/11d9/ee304e6d8556/d0063eb3b1ca/03046419081-e1/03046419081-e1.jpg?ts=1793632663516&w=850"
                  ]
              },
              {
                  "name": "Navy blue",
                  "hex": "#252731",
                  "reference": "3046/419",
                  "images": [
                      "https://static.zara.net/assets/public/529a/d59b/b9934d21965c/abe0581e1629/03046419401-p/03046419401-p.jpg?ts=1793789467857&w=850",
                      "https://static.zara.net/assets/public/493e/cb99/6c9d4855b480/d425215cdd37/03046419401-a1/03046419401-a1.jpg?ts=1793789460888&w=850",
                      "https://static.zara.net/assets/public/4332/5e16/5ae14f8cafdb/b062152b2e88/03046419401-a2/03046419401-a2.jpg?ts=1793789461420&w=850",
                      "https://static.zara.net/assets/public/9a0c/3034/7be342a8bfa0/ab79b5ae9ed1/03046419401-a3/03046419401-a3.jpg?ts=1793789462100&w=850",
                      "https://static.zara.net/assets/public/5043/6f98/6d984191bd02/0d91b568aacc/03046419401-a4/03046419401-a4.jpg?ts=1793789462470&w=850",
                      "https://static.zara.net/assets/public/b465/31f9/c34c4e68a0b2/388b9388371b/03046419401-a5/03046419401-a5.jpg?ts=1793789462725&w=850",
                      "https://static.zara.net/assets/public/ec9b/7845/c6c647e49ec4/6f9a764e298e/03046419401-a6/03046419401-a6.jpg?ts=1793789461182&w=850",
                      "https://static.zara.net/assets/public/80c7/f5a1/6b09498e999f/7aad431ff707/03046419401-e1/03046419401-e1.jpg?ts=1793632666836&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Sand / Marl",
              "Navy blue"
          ],
          "description": "Blazer with a regular collar and long sleeve with shoulder pads. Front flap pockets. Hem with side vents. Front button and belt fastening.",
          "materialCare": [
              "OUTER SHELL: 66% polyester, 31% wool, 3% other fibres",
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-m7",
          "slug": "regular-fit-pocket-overshirt-zara-m7",
          "name": "REGULAR FIT OVERSHIRT WITH POCKETS",
          "category": "Overshirts",
          "gender": "MEN",
          "price": 299.0,
          "oldPrice": null,
          "discount": null,
          "reference": "6861/520",
          "image": "https://static.zara.net/assets/public/8595/b21d/69c045cf852b/cf2dd241da66/06861520407-p/06861520407-p.jpg?ts=1791981619120&w=850",
          "images": [
              "https://static.zara.net/assets/public/8595/b21d/69c045cf852b/cf2dd241da66/06861520407-p/06861520407-p.jpg?ts=1791981619120&w=850",
              "https://static.zara.net/assets/public/6a43/df4a/b729430eba9c/383f772b263a/06861520407-a1/06861520407-a1.jpg?ts=1791981619148&w=850",
              "https://static.zara.net/assets/public/005d/4c9b/40294bdd9e65/57a2e6f6f9e3/06861520407-a2/06861520407-a2.jpg?ts=1791981619894&w=850",
              "https://static.zara.net/assets/public/7ace/8502/8e21475c8abb/e03d74a6b623/06861520407-a3/06861520407-a3.jpg?ts=1791981618699&w=850",
              "https://static.zara.net/assets/public/ea0a/e2ee/dead4196b486/348969925ba4/06861520407-a4/06861520407-a4.jpg?ts=1791981619908&w=850",
              "https://static.zara.net/assets/public/2242/dcc7/9b4a4536954d/ab3cf2164d10/06861520407-a5/06861520407-a5.jpg?ts=1791981617222&w=850",
              "https://static.zara.net/assets/public/c9f4/fa02/ffd54567bc5e/9cdb7c46f050/06861520407-e1/06861520407-e1.jpg?ts=1791969331013&w=850",
              "https://static.zara.net/assets/public/f4f0/31ec/7fec4014ad59/3d2757e754b1/06861520407-e2/06861520407-e2.jpg?ts=1791969330942&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Blue",
                  "hex": "#191821",
                  "reference": "6861/520",
                  "images": [
                      "https://static.zara.net/assets/public/8595/b21d/69c045cf852b/cf2dd241da66/06861520407-p/06861520407-p.jpg?ts=1791981619120&w=850",
                      "https://static.zara.net/assets/public/6a43/df4a/b729430eba9c/383f772b263a/06861520407-a1/06861520407-a1.jpg?ts=1791981619148&w=850",
                      "https://static.zara.net/assets/public/005d/4c9b/40294bdd9e65/57a2e6f6f9e3/06861520407-a2/06861520407-a2.jpg?ts=1791981619894&w=850",
                      "https://static.zara.net/assets/public/7ace/8502/8e21475c8abb/e03d74a6b623/06861520407-a3/06861520407-a3.jpg?ts=1791981618699&w=850",
                      "https://static.zara.net/assets/public/ea0a/e2ee/dead4196b486/348969925ba4/06861520407-a4/06861520407-a4.jpg?ts=1791981619908&w=850",
                      "https://static.zara.net/assets/public/2242/dcc7/9b4a4536954d/ab3cf2164d10/06861520407-a5/06861520407-a5.jpg?ts=1791981617222&w=850",
                      "https://static.zara.net/assets/public/c9f4/fa02/ffd54567bc5e/9cdb7c46f050/06861520407-e1/06861520407-e1.jpg?ts=1791969331013&w=850",
                      "https://static.zara.net/assets/public/f4f0/31ec/7fec4014ad59/3d2757e754b1/06861520407-e2/06861520407-e2.jpg?ts=1791969330942&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "6861/520",
                  "images": [
                      "https://static.zara.net/assets/public/d25b/875f/444945d88362/4c41db0b6f84/06861520800-p/06861520800-p.jpg?ts=1791981620906&w=850",
                      "https://static.zara.net/assets/public/7062/eff6/78484822b643/b852d3e8734d/06861520800-a1/06861520800-a1.jpg?ts=1791981619242&w=850",
                      "https://static.zara.net/assets/public/1c7f/ce81/3c3245e08435/8d0d4444a362/06861520800-a2/06861520800-a2.jpg?ts=1791981620751&w=850",
                      "https://static.zara.net/assets/public/0fd7/c753/ad304a938311/27a90294e876/06861520800-a3/06861520800-a3.jpg?ts=1791981617061&w=850",
                      "https://static.zara.net/assets/public/1974/04b8/13484e9fbf57/bbe7af877ddf/06861520800-a4/06861520800-a4.jpg?ts=1791981619453&w=850",
                      "https://static.zara.net/assets/public/270f/654a/72764617836a/0ab53ef3c4d3/06861520800-a5/06861520800-a5.jpg?ts=1791981619100&w=850",
                      "https://static.zara.net/assets/public/3435/01e5/fb9141748533/55535c208327/06861520800-e1/06861520800-e1.jpg?ts=1791969331474&w=850",
                      "https://static.zara.net/assets/public/efc2/c470/bc494d1e8c8d/7ef719e93ace/06861520800-e2/06861520800-e2.jpg?ts=1791969331115&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Blue",
              "Black"
          ],
          "description": "Model height: 187 cm\n\nRegular fit cotton overshirt. Regular collar and long sleeve with buttoned cuffs. Front patch pocket. Button-up front.\n\nDaily A+ special collection.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-w8",
          "slug": "blazer-with-feather-cuffs-zara-w8",
          "name": "FEATHER CUFF BLAZER",
          "category": "Blazers",
          "gender": "WOMEN",
          "price": 459.0,
          "oldPrice": null,
          "discount": null,
          "reference": "8901/636",
          "image": "https://static.zara.net/assets/public/2b54/fe27/d581485e8815/69a4152c81e7/08901636800-p/08901636800-p.jpg?ts=1793188967835&w=850",
          "images": [
              "https://static.zara.net/assets/public/2b54/fe27/d581485e8815/69a4152c81e7/08901636800-p/08901636800-p.jpg?ts=1793188967835&w=850",
              "https://static.zara.net/assets/public/702c/c0a3/7c3047ff8cd7/2dd58608fffb/08901636800-a1/08901636800-a1.jpg?ts=1793188965545&w=850",
              "https://static.zara.net/assets/public/d205/7219/15d74799bb00/2dcbb4fc333f/08901636800-a2/08901636800-a2.jpg?ts=1793188965970&w=850",
              "https://static.zara.net/assets/public/da38/5c53/69944a11a848/42f9a2a13a85/08901636800-a3/08901636800-a3.jpg?ts=1793188968429&w=850",
              "https://static.zara.net/assets/public/dd56/d090/9a084934b0ee/aee54ff88792/08901636800-a4/08901636800-a4.jpg?ts=1793188968632&w=850",
              "https://static.zara.net/assets/public/46b4/5931/492b4470bc0f/5c3b8b29c4a8/08901636800-e1/08901636800-e1.jpg?ts=1793089537969&w=850",
              "https://static.zara.net/assets/public/afc7/4ca7/47d94bbbac84/61aa14fa4327/08901636800-e2/08901636800-e2.jpg?ts=1793089539380&w=850",
              "https://static.zara.net/assets/public/9c71/5f1f/c3a9417ba69c/ef551defc8dd/08901636800-e3/08901636800-e3.jpg?ts=1793089539575&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Black",
                  "hex": "#121315",
                  "reference": "8901/636",
                  "images": [
                      "https://static.zara.net/assets/public/2b54/fe27/d581485e8815/69a4152c81e7/08901636800-p/08901636800-p.jpg?ts=1793188967835&w=850",
                      "https://static.zara.net/assets/public/702c/c0a3/7c3047ff8cd7/2dd58608fffb/08901636800-a1/08901636800-a1.jpg?ts=1793188965545&w=850",
                      "https://static.zara.net/assets/public/d205/7219/15d74799bb00/2dcbb4fc333f/08901636800-a2/08901636800-a2.jpg?ts=1793188965970&w=850",
                      "https://static.zara.net/assets/public/da38/5c53/69944a11a848/42f9a2a13a85/08901636800-a3/08901636800-a3.jpg?ts=1793188968429&w=850",
                      "https://static.zara.net/assets/public/dd56/d090/9a084934b0ee/aee54ff88792/08901636800-a4/08901636800-a4.jpg?ts=1793188968632&w=850",
                      "https://static.zara.net/assets/public/46b4/5931/492b4470bc0f/5c3b8b29c4a8/08901636800-e1/08901636800-e1.jpg?ts=1793089537969&w=850",
                      "https://static.zara.net/assets/public/afc7/4ca7/47d94bbbac84/61aa14fa4327/08901636800-e2/08901636800-e2.jpg?ts=1793089539380&w=850",
                      "https://static.zara.net/assets/public/9c71/5f1f/c3a9417ba69c/ef551defc8dd/08901636800-e3/08901636800-e3.jpg?ts=1793089539575&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Black"
          ],
          "description": "Model height: 177 cm\n\nFitted blazer with square neckline and long sleeve finished with feathers and pronounced shoulders. Front fastening with matching fabric-covered buttons.",
          "materialCare": [
              "OUTER SHELL: 74% polyester, 20% viscose, 6% elastane",
              "LINING: 100% acetate"
          ]
      },
      {
          "id": "zara-m8",
          "slug": "manteco--wool-blend-regular-fit-coat-zara-m8",
          "name": "MANTECO® WOOL BLEND REGULAR FIT COAT",
          "category": "Coats",
          "gender": "MEN",
          "price": 859.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1551/521",
          "image": "https://static.zara.net/assets/public/2256/6c70/4a7247ceafdc/eecff43cac68/01551521716-p/01551521716-p.jpg?ts=1793889983639&w=850",
          "images": [
              "https://static.zara.net/assets/public/2256/6c70/4a7247ceafdc/eecff43cac68/01551521716-p/01551521716-p.jpg?ts=1793889983639&w=850",
              "https://static.zara.net/assets/public/e410/ec70/bf5841fb97aa/9583c8d62eed/01551521716-a1/01551521716-a1.jpg?ts=1793889983330&w=850",
              "https://static.zara.net/assets/public/c553/5d1c/d6314645948f/5a36fd5ea87b/01551521716-a2/01551521716-a2.jpg?ts=1793889983809&w=850",
              "https://static.zara.net/assets/public/7127/e451/304a406f9054/91ae9f9df2ca/01551521716-a3/01551521716-a3.jpg?ts=1793889984171&w=850",
              "https://static.zara.net/assets/public/398c/f010/32aa43e28f17/3921e9a44734/01551521716-a4/01551521716-a4.jpg?ts=1793889983482&w=850",
              "https://static.zara.net/assets/public/c1ee/c14f/b37a4899b06b/4cea2639eb4c/01551521716-a5/01551521716-a5.jpg?ts=1793889983502&w=850",
              "https://static.zara.net/assets/public/9c28/1781/becf41f380c5/26862fda8427/01551521716-e1/01551521716-e1.jpg?ts=1793871610658&w=850",
              "https://static.zara.net/assets/public/a3c5/b69e/5e204338828c/bf0fc13837e5/01551521716-e2/01551521716-e2.jpg?ts=1793871610346&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Dark brown",
                  "hex": "#3f1c18",
                  "reference": "1551/521",
                  "images": [
                      "https://static.zara.net/assets/public/2256/6c70/4a7247ceafdc/eecff43cac68/01551521716-p/01551521716-p.jpg?ts=1793889983639&w=850",
                      "https://static.zara.net/assets/public/e410/ec70/bf5841fb97aa/9583c8d62eed/01551521716-a1/01551521716-a1.jpg?ts=1793889983330&w=850",
                      "https://static.zara.net/assets/public/c553/5d1c/d6314645948f/5a36fd5ea87b/01551521716-a2/01551521716-a2.jpg?ts=1793889983809&w=850",
                      "https://static.zara.net/assets/public/7127/e451/304a406f9054/91ae9f9df2ca/01551521716-a3/01551521716-a3.jpg?ts=1793889984171&w=850",
                      "https://static.zara.net/assets/public/398c/f010/32aa43e28f17/3921e9a44734/01551521716-a4/01551521716-a4.jpg?ts=1793889983482&w=850",
                      "https://static.zara.net/assets/public/c1ee/c14f/b37a4899b06b/4cea2639eb4c/01551521716-a5/01551521716-a5.jpg?ts=1793889983502&w=850",
                      "https://static.zara.net/assets/public/9c28/1781/becf41f380c5/26862fda8427/01551521716-e1/01551521716-e1.jpg?ts=1793871610658&w=850",
                      "https://static.zara.net/assets/public/a3c5/b69e/5e204338828c/bf0fc13837e5/01551521716-e2/01551521716-e2.jpg?ts=1793871610346&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#121315",
                  "reference": "1551/521",
                  "images": [
                      "https://static.zara.net/assets/public/7ed4/fffe/a4514911bfe7/08b4e005a7f1/01551521800-p/01551521800-p.jpg?ts=1793868899483&w=850",
                      "https://static.zara.net/assets/public/ccb2/5ca2/78534920803b/c210d2c9c381/01551521800-a1/01551521800-a1.jpg?ts=1793868899372&w=850",
                      "https://static.zara.net/assets/public/efbd/45e0/022841bdbec4/2f760fb6ada9/01551521800-a2/01551521800-a2.jpg?ts=1793868899571&w=850",
                      "https://static.zara.net/assets/public/5551/639e/b40d40eab75f/504384571efe/01551521800-a3/01551521800-a3.jpg?ts=1793868899678&w=850",
                      "https://static.zara.net/assets/public/eeaa/4ecf/e7474b43948a/3202e3ed84d7/01551521800-a4/01551521800-a4.jpg?ts=1793868898920&w=850",
                      "https://static.zara.net/assets/public/6307/2284/efff48ba977c/1fed97876e94/01551521800-a5/01551521800-a5.jpg?ts=1793868899480&w=850",
                      "https://static.zara.net/assets/public/aac4/d52d/1c694e15b9c3/016a3c252e41/01551521800-a6/01551521800-a6.jpg?ts=1793868900049&w=850",
                      "https://static.zara.net/assets/public/c3de/2337/ad154152923e/9f821780cf29/01551521800-e1/01551521800-e1.jpg?ts=1793810752264&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Dark brown",
              "Black"
          ],
          "description": "Model height: 184 cm\n\nRegular fit coat made of Italian-origin wool blend fabric. Notched lapel collar and long sleeve. Welt pockets at the hip. Interior pocket detail. Hem with vent at the centre back. Front button fastening.\n\nOrigins special collection.",
          "materialCare": [
              "OUTER SHELL: 75% wool, 25% polyamide",
              "LINING: 52% viscose, 48% polyester"
          ]
      },
      {
          "id": "zara-w9",
          "slug": "textured-blazer-with-feather-cuffs-zara-w9",
          "name": "TEXTURED BLAZER WITH FEATHER CUFFS",
          "category": "Blazers",
          "gender": "WOMEN",
          "price": 349.0,
          "oldPrice": null,
          "discount": null,
          "reference": "8925/965",
          "image": "https://static.zara.net/assets/public/aed6/3c1c/3661401e9633/9e27c20c3b18/08925965684-p/08925965684-p.jpg?ts=1794225675179&w=850",
          "images": [
              "https://static.zara.net/assets/public/aed6/3c1c/3661401e9633/9e27c20c3b18/08925965684-p/08925965684-p.jpg?ts=1794225675179&w=850",
              "https://static.zara.net/assets/public/9ebb/bc44/adb142368410/5d85f9d18131/08925965684-a1/08925965684-a1.jpg?ts=1794225664905&w=850",
              "https://static.zara.net/assets/public/4ecf/de1c/30614fd4931f/ea2dab5cb07d/08925965684-a2/08925965684-a2.jpg?ts=1794225675705&w=850",
              "https://static.zara.net/assets/public/33a3/da66/e47145e7bd6f/1ff368fa712a/08925965684-a3/08925965684-a3.jpg?ts=1794225673316&w=850",
              "https://static.zara.net/assets/public/433c/5a15/8c6d47aaa32a/3346b7085608/08925965684-a4/08925965684-a4.jpg?ts=1794225675081&w=850",
              "https://static.zara.net/assets/public/6fac/01fc/9b5a4f28ad8b/e026168781ee/08925965684-a5/08925965684-a5.jpg?ts=1794225675655&w=850",
              "https://static.zara.net/assets/public/f51d/3847/1f4f411faba1/73af48948bb3/08925965684-e1/08925965684-e1.jpg?ts=1794413612725&w=850",
              "https://static.zara.net/assets/public/a46b/2675/bde44a39a635/96e5c17f4924/08925965684-e2/08925965684-e2.jpg?ts=1794413609486&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Dark burgundy",
                  "hex": "#704749",
                  "reference": "8925/965",
                  "images": [
                      "https://static.zara.net/assets/public/aed6/3c1c/3661401e9633/9e27c20c3b18/08925965684-p/08925965684-p.jpg?ts=1794225675179&w=850",
                      "https://static.zara.net/assets/public/9ebb/bc44/adb142368410/5d85f9d18131/08925965684-a1/08925965684-a1.jpg?ts=1794225664905&w=850",
                      "https://static.zara.net/assets/public/4ecf/de1c/30614fd4931f/ea2dab5cb07d/08925965684-a2/08925965684-a2.jpg?ts=1794225675705&w=850",
                      "https://static.zara.net/assets/public/33a3/da66/e47145e7bd6f/1ff368fa712a/08925965684-a3/08925965684-a3.jpg?ts=1794225673316&w=850",
                      "https://static.zara.net/assets/public/433c/5a15/8c6d47aaa32a/3346b7085608/08925965684-a4/08925965684-a4.jpg?ts=1794225675081&w=850",
                      "https://static.zara.net/assets/public/6fac/01fc/9b5a4f28ad8b/e026168781ee/08925965684-a5/08925965684-a5.jpg?ts=1794225675655&w=850",
                      "https://static.zara.net/assets/public/f51d/3847/1f4f411faba1/73af48948bb3/08925965684-e1/08925965684-e1.jpg?ts=1794413612725&w=850",
                      "https://static.zara.net/assets/public/a46b/2675/bde44a39a635/96e5c17f4924/08925965684-e2/08925965684-e2.jpg?ts=1794413609486&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Dark burgundy"
          ],
          "description": "Blazer in a textured fabric with metallic thread. Featuring a boat neck, long sleeves with shoulder pads, and cuffs in a fabric featuring feathers. Flap pockets at the front. Front button fastening with embossed detail.",
          "materialCare": [
              "LINING: 100% acetate"
          ]
      },
      {
          "id": "zara-m9",
          "slug": "double-faced-wool-blend-coat-zara-m9",
          "name": "DOUBLE-FACED WOOL BLEND COAT",
          "category": "Coats",
          "gender": "MEN",
          "price": 399.0,
          "oldPrice": null,
          "discount": null,
          "reference": "5854/420",
          "image": "https://static.zara.net/assets/public/8769/e5b4/29bb4f5a9c3d/ca442a5ba696/05854420401-p/05854420401-p.jpg?ts=1791981620865&w=850",
          "images": [
              "https://static.zara.net/assets/public/8769/e5b4/29bb4f5a9c3d/ca442a5ba696/05854420401-p/05854420401-p.jpg?ts=1791981620865&w=850",
              "https://static.zara.net/assets/public/a6a2/ac8b/c57044578542/88b481c29e06/05854420401-a1/05854420401-a1.jpg?ts=1791981625787&w=850",
              "https://static.zara.net/assets/public/432f/35d0/70824311b9e9/3c68913e80a7/05854420401-a2/05854420401-a2.jpg?ts=1791981626118&w=850",
              "https://static.zara.net/assets/public/eaa7/91b2/512542df9b6f/a15a9e715154/05854420401-a3/05854420401-a3.jpg?ts=1791981625231&w=850",
              "https://static.zara.net/assets/public/266f/42ff/67cc42a4b498/c5958f9db80e/05854420401-a4/05854420401-a4.jpg?ts=1791981621792&w=850",
              "https://static.zara.net/assets/public/25c9/c69a/a52b4719a8dc/f4d7921acae9/05854420401-e1/05854420401-e1.jpg?ts=1791969336155&w=850",
              "https://static.zara.net/assets/public/deb0/c101/0d36434ea76c/66c60c72cb44/05854420401-e2/05854420401-e2.jpg?ts=1791969336787&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Navy blue",
                  "hex": "#191821",
                  "reference": "5854/420",
                  "images": [
                      "https://static.zara.net/assets/public/8769/e5b4/29bb4f5a9c3d/ca442a5ba696/05854420401-p/05854420401-p.jpg?ts=1791981620865&w=850",
                      "https://static.zara.net/assets/public/a6a2/ac8b/c57044578542/88b481c29e06/05854420401-a1/05854420401-a1.jpg?ts=1791981625787&w=850",
                      "https://static.zara.net/assets/public/432f/35d0/70824311b9e9/3c68913e80a7/05854420401-a2/05854420401-a2.jpg?ts=1791981626118&w=850",
                      "https://static.zara.net/assets/public/eaa7/91b2/512542df9b6f/a15a9e715154/05854420401-a3/05854420401-a3.jpg?ts=1791981625231&w=850",
                      "https://static.zara.net/assets/public/266f/42ff/67cc42a4b498/c5958f9db80e/05854420401-a4/05854420401-a4.jpg?ts=1791981621792&w=850",
                      "https://static.zara.net/assets/public/25c9/c69a/a52b4719a8dc/f4d7921acae9/05854420401-e1/05854420401-e1.jpg?ts=1791969336155&w=850",
                      "https://static.zara.net/assets/public/deb0/c101/0d36434ea76c/66c60c72cb44/05854420401-e2/05854420401-e2.jpg?ts=1791969336787&w=850"
                  ]
              },
              {
                  "name": "Brown",
                  "hex": "#302217",
                  "reference": "5854/420",
                  "images": [
                      "https://static.zara.net/assets/public/4455/4d11/912d4822aa11/c8a97fe695ca/05854420700-p/05854420700-p.jpg?ts=1791981615422&w=850",
                      "https://static.zara.net/assets/public/8d37/8d11/0165468e8585/0305bc22dcc0/05854420700-a1/05854420700-a1.jpg?ts=1791981612702&w=850",
                      "https://static.zara.net/assets/public/f303/d2ea/765b44f6aa47/35f52acfee07/05854420700-a2/05854420700-a2.jpg?ts=1791981613830&w=850",
                      "https://static.zara.net/assets/public/e859/48ab/2bc74a61986a/6e1f4eb2323f/05854420700-a3/05854420700-a3.jpg?ts=1791981613665&w=850",
                      "https://static.zara.net/assets/public/70e8/6525/f37d4e8c85cc/9e65f4d054ff/05854420700-a4/05854420700-a4.jpg?ts=1791981614669&w=850",
                      "https://static.zara.net/assets/public/0bf1/40e1/d9bb4685934f/b21d5242b3c6/05854420700-a5/05854420700-a5.jpg?ts=1791981612442&w=850",
                      "https://static.zara.net/assets/public/c390/6130/f6ba479cbc88/29aa68cc3949/05854420700-e1/05854420700-e1.jpg?ts=1791969327164&w=850",
                      "https://static.zara.net/assets/public/9d6b/1be7/ad8843e2bb1c/ad22f6b48e1d/05854420700-e2/05854420700-e2.jpg?ts=1791969326889&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Navy blue",
              "Brown"
          ],
          "description": "Model height: 187 cm\n\nLightweight regular fit coat made of double-faced wool blend fabric. Featuring a notched lapel collar and long sleeve. Patch pocket on the hips. Back vent at the hem. Front button fastening.\n\nDaily A+ special collection.",
          "materialCare": [
              "OUTER SHELL: 50% wool, 45% polyester, 5% other fibres",
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-w10",
          "slug": "soft-oversize-coat-zara-w10",
          "name": "SOFT OVERSIZE COAT",
          "category": "Coats",
          "gender": "WOMEN",
          "price": 349.0,
          "oldPrice": null,
          "discount": null,
          "reference": "3046/329",
          "image": "https://static.zara.net/assets/public/3294/9e43/0a3648d382a6/929d83902a4d/03046329700-p/03046329700-p.jpg?ts=1790088504397&w=850",
          "images": [
              "https://static.zara.net/assets/public/3294/9e43/0a3648d382a6/929d83902a4d/03046329700-p/03046329700-p.jpg?ts=1790088504397&w=850",
              "https://static.zara.net/assets/public/e3bf/754b/c1f748f6bed0/4723ef3b528f/03046329700-a1/03046329700-a1.jpg?ts=1790088494676&w=850",
              "https://static.zara.net/assets/public/351f/fc52/dac34b3b9b2a/34976e62fb6e/03046329700-a2/03046329700-a2.jpg?ts=1790088494314&w=850",
              "https://static.zara.net/assets/public/6954/38b3/c75b473684d6/ce367a7cb8cc/03046329700-a3/03046329700-a3.jpg?ts=1790088495173&w=850",
              "https://static.zara.net/assets/public/0779/3463/96fe41c9b8f0/814f44435b98/03046329700-a4/03046329700-a4.jpg?ts=1790088499755&w=850",
              "https://static.zara.net/assets/public/2191/afb0/5fb240548047/c1100d37c661/03046329700-a5/03046329700-a5.jpg?ts=1790088503531&w=850",
              "https://static.zara.net/assets/public/0e63/d1fb/227d499b890b/c1c2750cc731/03046329700-a6/03046329700-a6.jpg?ts=1790088504671&w=850",
              "https://static.zara.net/assets/public/41c7/e209/555541a0bac0/1810e9227358/03046329700-e1/03046329700-e1.jpg?ts=1790001715897&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Brown",
                  "hex": "#302217",
                  "reference": "3046/329",
                  "images": [
                      "https://static.zara.net/assets/public/3294/9e43/0a3648d382a6/929d83902a4d/03046329700-p/03046329700-p.jpg?ts=1790088504397&w=850",
                      "https://static.zara.net/assets/public/e3bf/754b/c1f748f6bed0/4723ef3b528f/03046329700-a1/03046329700-a1.jpg?ts=1790088494676&w=850",
                      "https://static.zara.net/assets/public/351f/fc52/dac34b3b9b2a/34976e62fb6e/03046329700-a2/03046329700-a2.jpg?ts=1790088494314&w=850",
                      "https://static.zara.net/assets/public/6954/38b3/c75b473684d6/ce367a7cb8cc/03046329700-a3/03046329700-a3.jpg?ts=1790088495173&w=850",
                      "https://static.zara.net/assets/public/0779/3463/96fe41c9b8f0/814f44435b98/03046329700-a4/03046329700-a4.jpg?ts=1790088499755&w=850",
                      "https://static.zara.net/assets/public/2191/afb0/5fb240548047/c1100d37c661/03046329700-a5/03046329700-a5.jpg?ts=1790088503531&w=850",
                      "https://static.zara.net/assets/public/0e63/d1fb/227d499b890b/c1c2750cc731/03046329700-a6/03046329700-a6.jpg?ts=1790088504671&w=850",
                      "https://static.zara.net/assets/public/41c7/e209/555541a0bac0/1810e9227358/03046329700-e1/03046329700-e1.jpg?ts=1790001715897&w=850"
                  ]
              },
              {
                  "name": "Beige",
                  "hex": "#CEC3B2",
                  "reference": "3046/329",
                  "images": [
                      "https://static.zara.net/assets/public/f574/b9e3/deb94404b253/11560fdf1b82/03046329710-p/03046329710-p.jpg?ts=1790085174488&w=850",
                      "https://static.zara.net/assets/public/0a16/56b0/d9094f21a1bb/c9c85dd3757e/03046329710-a1/03046329710-a1.jpg?ts=1790085167271&w=850",
                      "https://static.zara.net/assets/public/46cb/f7ba/b40348ef8434/9d851a66bfab/03046329710-a2/03046329710-a2.jpg?ts=1790085168535&w=850",
                      "https://static.zara.net/assets/public/5cc0/cbd6/815047fea7af/cd9244fe4913/03046329710-a3/03046329710-a3.jpg?ts=1790085169843&w=850",
                      "https://static.zara.net/assets/public/3e08/b25b/094842aba674/434ddb32c2ab/03046329710-a4/03046329710-a4.jpg?ts=1790085173705&w=850",
                      "https://static.zara.net/assets/public/42a7/41f8/26ed4488b8a6/3f1290a69290/03046329710-a5/03046329710-a5.jpg?ts=1790085173882&w=850",
                      "https://static.zara.net/assets/public/a22e/55cd/2b1f4e5d9e55/4a2082f029ac/03046329710-a6/03046329710-a6.jpg?ts=1790085173360&w=850",
                      "https://static.zara.net/assets/public/9f69/dd76/04ea4504803a/f2b9394d227b/03046329710-e1/03046329710-e1.jpg?ts=1789996314530&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "3046/329",
                  "images": [
                      "https://static.zara.net/assets/public/f3b2/c896/41ba4a768092/30b6fd91b779/03046329800-p/03046329800-p.jpg?ts=1789038821624&w=850",
                      "https://static.zara.net/assets/public/8bd4/e629/e2154fc3b506/b3a03cea4369/03046329800-a1/03046329800-a1.jpg?ts=1789038822350&w=850",
                      "https://static.zara.net/assets/public/9224/6417/822b4a988a7a/86b4bb1d439d/03046329800-a2/03046329800-a2.jpg?ts=1789038822198&w=850",
                      "https://static.zara.net/assets/public/9fbd/5cc7/e88d4d8486c9/a6329db978d1/03046329800-a3/03046329800-a3.jpg?ts=1789038821695&w=850",
                      "https://static.zara.net/assets/public/180d/333c/0736414cb369/d9ce67fb71c4/03046329800-a4/03046329800-a4.jpg?ts=1789038821777&w=850",
                      "https://static.zara.net/assets/public/bd95/7fe5/e808408a9365/e33491e17e6e/03046329800-a5/03046329800-a5.jpg?ts=1789038822278&w=850",
                      "https://static.zara.net/assets/public/cfe6/58af/b4874006aad3/ccdf10dde045/03046329800-e1/03046329800-e1.jpg?ts=1789996138847&w=850",
                      "https://static.zara.net/assets/public/b423/a34a/88354e57b717/54df4f8eadc0/03046329800-e2/03046329800-e2.jpg?ts=1789996138132&w=850"
                  ]
              },
              {
                  "name": "Grey",
                  "hex": "#403E3D",
                  "reference": "3046/329",
                  "images": [
                      "https://static.zara.net/assets/public/e2d2/c8f6/987041b1a00a/efb26eb2fee6/03046329802-p/03046329802-p.jpg?ts=1788968480589&w=850",
                      "https://static.zara.net/assets/public/9cfb/e906/2ac8438d8f57/790e6b85f69c/03046329802-e1/03046329802-e1.jpg?ts=1790001716505&w=850",
                      "https://static.zara.net/assets/public/0e5d/17a9/60be462c963c/08503b5ac04c/03046329802-e2/03046329802-e2.jpg?ts=1790001716169&w=850",
                      "https://static.zara.net/assets/public/92bd/be7e/27444ac4a908/2615921ddaa6/03046329802-e3/03046329802-e3.jpg?ts=1790001716721&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL",
              "XXL"
          ],
          "colors": [
              "Brown",
              "Beige",
              "Black",
              "Grey"
          ],
          "description": "oversize coat with a regular collar and long sleeve finished with a tab and button. Front welt pockets. Double-breasted button fastening.",
          "materialCare": [
              "OUTER SHELL: 100% polyester",
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-m10",
          "slug": "contrast-regular-fit-fleece-sweatshirt-zara-m10",
          "name": "CROPPED CONTRAST FLEECE SWEATSHIRT",
          "category": "Hoodies",
          "gender": "MEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "2878/385",
          "image": "https://static.zara.net/assets/public/3586/78c6/7279466ea287/42a8945b3b50/02878385400-p/02878385400-p.jpg?ts=1794404547306&w=850",
          "images": [
              "https://static.zara.net/assets/public/3586/78c6/7279466ea287/42a8945b3b50/02878385400-p/02878385400-p.jpg?ts=1794404547306&w=850",
              "https://static.zara.net/assets/public/a7d2/cc5d/2b3d4742bc73/20a5545e0607/02878385400-a1/02878385400-a1.jpg?ts=1794404548083&w=850",
              "https://static.zara.net/assets/public/6322/bff7/821f4cf4ad43/fc98057da537/02878385400-a2/02878385400-a2.jpg?ts=1794404547734&w=850",
              "https://static.zara.net/assets/public/adb6/9098/15d94b09b364/1ea17b696498/02878385400-a3/02878385400-a3.jpg?ts=1794404547924&w=850",
              "https://static.zara.net/assets/public/694e/4bab/62ad4be3b265/eb7d9e115dae/02878385400-a4/02878385400-a4.jpg?ts=1794404547926&w=850",
              "https://static.zara.net/assets/public/1305/3bf5/ea254b5bbc96/e069975b6812/02878385400-a5/02878385400-a5.jpg?ts=1794415580951&w=850",
              "https://static.zara.net/assets/public/765b/92b7/857c4f238911/05e4503d49e6/02878385400-e1/02878385400-e1.jpg?ts=1793625104429&w=850",
              "https://static.zara.net/assets/public/9b36/abb2/6fa5408abed1/fd0d79ec13c2/02878385400-e2/02878385400-e2.jpg?ts=1793625104371&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Blue",
                  "hex": "#0958BD",
                  "reference": "2878/385",
                  "images": [
                      "https://static.zara.net/assets/public/3586/78c6/7279466ea287/42a8945b3b50/02878385400-p/02878385400-p.jpg?ts=1794404547306&w=850",
                      "https://static.zara.net/assets/public/a7d2/cc5d/2b3d4742bc73/20a5545e0607/02878385400-a1/02878385400-a1.jpg?ts=1794404548083&w=850",
                      "https://static.zara.net/assets/public/6322/bff7/821f4cf4ad43/fc98057da537/02878385400-a2/02878385400-a2.jpg?ts=1794404547734&w=850",
                      "https://static.zara.net/assets/public/adb6/9098/15d94b09b364/1ea17b696498/02878385400-a3/02878385400-a3.jpg?ts=1794404547924&w=850",
                      "https://static.zara.net/assets/public/694e/4bab/62ad4be3b265/eb7d9e115dae/02878385400-a4/02878385400-a4.jpg?ts=1794404547926&w=850",
                      "https://static.zara.net/assets/public/1305/3bf5/ea254b5bbc96/e069975b6812/02878385400-a5/02878385400-a5.jpg?ts=1794415580951&w=850",
                      "https://static.zara.net/assets/public/765b/92b7/857c4f238911/05e4503d49e6/02878385400-e1/02878385400-e1.jpg?ts=1793625104429&w=850",
                      "https://static.zara.net/assets/public/9b36/abb2/6fa5408abed1/fd0d79ec13c2/02878385400-e2/02878385400-e2.jpg?ts=1793625104371&w=850"
                  ]
              },
              {
                  "name": "Red",
                  "hex": "#E83B39",
                  "reference": "2878/385",
                  "images": [
                      "https://static.zara.net/assets/public/61dd/98fd/9f284afaa74c/3d6eb0b01f26/02878385600-p/02878385600-p.jpg?ts=1794404546997&w=850",
                      "https://static.zara.net/assets/public/889e/fdcb/a8d5488d9adf/02a4b9723644/02878385600-a1/02878385600-a1.jpg?ts=1794404546979&w=850",
                      "https://static.zara.net/assets/public/5ba3/e8bd/b24448d09258/635e4423b849/02878385600-a2/02878385600-a2.jpg?ts=1794404547291&w=850",
                      "https://static.zara.net/assets/public/1b1a/1fdd/a4d54666a008/ebaa4adc7e5e/02878385600-a3/02878385600-a3.jpg?ts=1794404547276&w=850",
                      "https://static.zara.net/assets/public/11a6/32ae/8cb34a36a623/40f152f4091d/02878385600-a4/02878385600-a4.jpg?ts=1794404547892&w=850",
                      "https://static.zara.net/assets/public/f7b5/530f/a68743b3a637/8fb252281538/02878385600-a5/02878385600-a5.jpg?ts=1794404547431&w=850",
                      "https://static.zara.net/assets/public/61db/d8a9/e7394a7a8488/0b155e56e072/02878385600-a6/02878385600-a6.jpg?ts=1794404547470&w=850",
                      "https://static.zara.net/assets/public/277d/6856/e0154a9893a6/d8887567aca0/02878385600-e1/02878385600-e1.jpg?ts=1793625104527&w=850"
                  ]
              }
          ],
          "badge": "NEW IN",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Blue",
              "Red"
          ],
          "description": "Model height: 187 cm\n\nCropped fit sweatshirt made of fleece-effect fabric. Features a high neck with a front zip fastening, long raglan sleeves, a front pouch pocket and contrast ribbed trims.",
          "materialCare": [
              "100% Certified Apparel Craft",
              "Machine wash at max 30°C / short spin"
          ]
      },
      {
          "id": "zara-w11",
          "slug": "soft-shoulder-pad-coat-zara-w11",
          "name": "SOFT COAT WITH SHOULDER PADS",
          "category": "Coats",
          "gender": "WOMEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "3046/331",
          "image": "https://static.zara.net/assets/public/d6e9/2890/94004e799c3a/3ddfb00603f0/03046331450-p/03046331450-p.jpg?ts=1788261645173&w=850",
          "images": [
              "https://static.zara.net/assets/public/d6e9/2890/94004e799c3a/3ddfb00603f0/03046331450-p/03046331450-p.jpg?ts=1788261645173&w=850",
              "https://static.zara.net/assets/public/6475/2ac3/cb2a4879967b/47705a4bf4d8/03046331450-a1/03046331450-a1.jpg?ts=1788261647442&w=850",
              "https://static.zara.net/assets/public/6b9e/fed7/a18a43918a72/1b90d2160322/03046331450-a2/03046331450-a2.jpg?ts=1788261646812&w=850",
              "https://static.zara.net/assets/public/5f68/c7cc/a40f4b439293/d0eab969b08e/03046331450-a3/03046331450-a3.jpg?ts=1788261646812&w=850",
              "https://static.zara.net/assets/public/1452/8577/3af54d578dc7/71893602e3ef/03046331450-a4/03046331450-a4.jpg?ts=1788261647904&w=850",
              "https://static.zara.net/assets/public/a1c2/3b23/8cb3441caead/585c62926a91/03046331450-e1/03046331450-e1.jpg?ts=1788256584882&w=850",
              "https://static.zara.net/assets/public/2d48/66f5/6cbb4f8cb8a3/4caf138a6ff6/03046331450-e2/03046331450-e2.jpg?ts=1788256583738&w=850",
              "https://static.zara.net/assets/public/3e0f/a1a7/dc974fd18759/93bae2275e5f/03046331450-e3/03046331450-e3.jpg?ts=1788256585974&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Beige",
                  "hex": "#B1A597",
                  "reference": "3046/331",
                  "images": [
                      "https://static.zara.net/assets/public/d6e9/2890/94004e799c3a/3ddfb00603f0/03046331450-p/03046331450-p.jpg?ts=1788261645173&w=850",
                      "https://static.zara.net/assets/public/6475/2ac3/cb2a4879967b/47705a4bf4d8/03046331450-a1/03046331450-a1.jpg?ts=1788261647442&w=850",
                      "https://static.zara.net/assets/public/6b9e/fed7/a18a43918a72/1b90d2160322/03046331450-a2/03046331450-a2.jpg?ts=1788261646812&w=850",
                      "https://static.zara.net/assets/public/5f68/c7cc/a40f4b439293/d0eab969b08e/03046331450-a3/03046331450-a3.jpg?ts=1788261646812&w=850",
                      "https://static.zara.net/assets/public/1452/8577/3af54d578dc7/71893602e3ef/03046331450-a4/03046331450-a4.jpg?ts=1788261647904&w=850",
                      "https://static.zara.net/assets/public/a1c2/3b23/8cb3441caead/585c62926a91/03046331450-e1/03046331450-e1.jpg?ts=1788256584882&w=850",
                      "https://static.zara.net/assets/public/2d48/66f5/6cbb4f8cb8a3/4caf138a6ff6/03046331450-e2/03046331450-e2.jpg?ts=1788256583738&w=850",
                      "https://static.zara.net/assets/public/3e0f/a1a7/dc974fd18759/93bae2275e5f/03046331450-e3/03046331450-e3.jpg?ts=1788256585974&w=850"
                  ]
              },
              {
                  "name": "Red",
                  "hex": "#B2170F",
                  "reference": "3046/331",
                  "images": [
                      "https://static.zara.net/assets/public/850e/8c14/5a3746ce9551/e7a89c3f92d5/03046331600-p/03046331600-p.jpg?ts=1789042948664&w=850",
                      "https://static.zara.net/assets/public/c58b/7885/1c964f1e99ef/f9c146e78a7e/03046331600-a1/03046331600-a1.jpg?ts=1789042949575&w=850",
                      "https://static.zara.net/assets/public/34bc/e6a1/e9084c5a8de2/b4e6525d175a/03046331600-a2/03046331600-a2.jpg?ts=1789042949428&w=850",
                      "https://static.zara.net/assets/public/6c42/fdf5/5ec64359922b/a175c8bbd7c5/03046331600-a3/03046331600-a3.jpg?ts=1789042949132&w=850",
                      "https://static.zara.net/assets/public/0178/a245/f01047178406/1dddeecb5b06/03046331600-a4/03046331600-a4.jpg?ts=1789042943802&w=850",
                      "https://static.zara.net/assets/public/725f/fc91/cab845cba479/95aff79e1439/03046331600-e1/03046331600-e1.jpg?ts=1788256585285&w=850",
                      "https://static.zara.net/assets/public/1aa4/48d5/521c478abd75/110349463cd7/03046331600-e2/03046331600-e2.jpg?ts=1788256585771&w=850",
                      "https://static.zara.net/assets/public/d0c1/cfc2/e4784e24af57/2f738b767bd2/03046331600-e3/03046331600-e3.jpg?ts=1788256585535&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#242524",
                  "reference": "3046/331",
                  "images": [
                      "https://static.zara.net/assets/public/1d31/f329/b837497c928b/ef8d965c8f75/03046333800-p/03046333800-p.jpg?ts=1791998462271&w=850",
                      "https://static.zara.net/assets/public/3108/bd90/c3f44047815d/5e51ada1c919/03046333800-a1/03046333800-a1.jpg?ts=1792056702506&w=850",
                      "https://static.zara.net/assets/public/7ee8/ac3f/0fed49c7a7fd/c490e562add5/03046333800-a2/03046333800-a2.jpg?ts=1792056702587&w=850",
                      "https://static.zara.net/assets/public/ea9e/5a80/11234568bd5c/af8a29850681/03046333800-a3/03046333800-a3.jpg?ts=1792056703121&w=850",
                      "https://static.zara.net/assets/public/a27e/dbe9/72c7485891d6/65aa7b4af8fa/03046333800-a4/03046333800-a4.jpg?ts=1792056702733&w=850",
                      "https://static.zara.net/assets/public/04c0/db47/61b34ce69652/acb54324bcb5/03046333800-a5/03046333800-a5.jpg?ts=1792056702183&w=850",
                      "https://static.zara.net/assets/public/3f19/5544/1ca24389967f/9f691a8f9016/03046331800-e1/03046331800-e1.jpg?ts=1788256585880&w=850",
                      "https://static.zara.net/assets/public/3f52/aeff/a7004e2aa075/0f23251ab924/03046331800-e2/03046331800-e2.jpg?ts=1788256586666&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL",
              "XXL"
          ],
          "colors": [
              "Beige",
              "Red",
              "Black"
          ],
          "description": "Model height: 174 cm\n\nCoat with a regular collar and long sleeve, with shoulder pads. Features front welt pockets. Hem with a back vent. Front button fastening.",
          "materialCare": [
              "OUTER SHELL: 100% polyester",
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-m11",
          "slug": "cropped-fit-hoodie-with-zip-zara-m11",
          "name": "CROPPED FIT HOODIE WITH ZIP",
          "category": "Hoodies",
          "gender": "MEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "3443/389",
          "image": "https://static.zara.net/assets/public/dd29/256a/ade34600b295/8f836f4581a9/03443389621-p/03443389621-p.jpg?ts=1794311207342&w=850",
          "images": [
              "https://static.zara.net/assets/public/dd29/256a/ade34600b295/8f836f4581a9/03443389621-p/03443389621-p.jpg?ts=1794311207342&w=850",
              "https://static.zara.net/assets/public/436a/2702/edd04d9493e4/3d75c702f81b/03443389621-a1/03443389621-a1.jpg?ts=1794311207117&w=850",
              "https://static.zara.net/assets/public/8867/f0a5/32fc492f94b6/3e8521da8359/03443389621-a2/03443389621-a2.jpg?ts=1794311205336&w=850",
              "https://static.zara.net/assets/public/7551/e45a/60c24cf285ad/7900d1bcc647/03443389621-a3/03443389621-a3.jpg?ts=1794311205286&w=850",
              "https://static.zara.net/assets/public/7486/d001/f9754f8fbbef/b49c43494136/03443389621-a4/03443389621-a4.jpg?ts=1794311207115&w=850",
              "https://static.zara.net/assets/public/6cbe/5066/bd9e46e1a93b/0338a2e6b78c/03443389621-a5/03443389621-a5.jpg?ts=1794311207667&w=850",
              "https://static.zara.net/assets/public/fb28/f026/8552485d88ba/7481c4d40f6f/03443389621-e1/03443389621-e1.jpg?ts=1794225186335&w=850",
              "https://static.zara.net/assets/public/ad73/55a5/d166402f8c9a/737778bb312e/03443389621-e2/03443389621-e2.jpg?ts=1794225185342&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Pastel pink",
                  "hex": "#a86968",
                  "reference": "3443/389",
                  "images": [
                      "https://static.zara.net/assets/public/dd29/256a/ade34600b295/8f836f4581a9/03443389621-p/03443389621-p.jpg?ts=1794311207342&w=850",
                      "https://static.zara.net/assets/public/436a/2702/edd04d9493e4/3d75c702f81b/03443389621-a1/03443389621-a1.jpg?ts=1794311207117&w=850",
                      "https://static.zara.net/assets/public/8867/f0a5/32fc492f94b6/3e8521da8359/03443389621-a2/03443389621-a2.jpg?ts=1794311205336&w=850",
                      "https://static.zara.net/assets/public/7551/e45a/60c24cf285ad/7900d1bcc647/03443389621-a3/03443389621-a3.jpg?ts=1794311205286&w=850",
                      "https://static.zara.net/assets/public/7486/d001/f9754f8fbbef/b49c43494136/03443389621-a4/03443389621-a4.jpg?ts=1794311207115&w=850",
                      "https://static.zara.net/assets/public/6cbe/5066/bd9e46e1a93b/0338a2e6b78c/03443389621-a5/03443389621-a5.jpg?ts=1794311207667&w=850",
                      "https://static.zara.net/assets/public/fb28/f026/8552485d88ba/7481c4d40f6f/03443389621-e1/03443389621-e1.jpg?ts=1794225186335&w=850",
                      "https://static.zara.net/assets/public/ad73/55a5/d166402f8c9a/737778bb312e/03443389621-e2/03443389621-e2.jpg?ts=1794225185342&w=850"
                  ]
              },
              {
                  "name": "Dark anthracite",
                  "hex": "#373537",
                  "reference": "3443/389",
                  "images": [
                      "https://static.zara.net/assets/public/a455/0728/cb054abaab63/9a29ec9c9f48/03443389898-p/03443389898-p.jpg?ts=1794311209166&w=850",
                      "https://static.zara.net/assets/public/bcec/b07d/e9af4cdb899c/8154754d2a07/03443389898-a1/03443389898-a1.jpg?ts=1794311208678&w=850",
                      "https://static.zara.net/assets/public/3514/c1ea/8f1e4d469349/e057251b7179/03443389898-a2/03443389898-a2.jpg?ts=1794311208060&w=850",
                      "https://static.zara.net/assets/public/ea30/a031/e6ba4f29b13b/f2caf2660e4c/03443389898-a3/03443389898-a3.jpg?ts=1794311209373&w=850",
                      "https://static.zara.net/assets/public/2977/e99c/5a764c8ba3f7/c6275cb94ab5/03443389898-a4/03443389898-a4.jpg?ts=1794311208378&w=850",
                      "https://static.zara.net/assets/public/a14a/5021/78d6478d9623/b0d1c7d460bb/03443389898-e1/03443389898-e1.jpg?ts=1794221577544&w=850",
                      "https://static.zara.net/assets/public/3cb1/8620/8f9a490f8281/f9423348718a/03443389898-e2/03443389898-e2.jpg?ts=1794221578185&w=850",
                      "https://static.zara.net/assets/public/2e5b/33b3/4db442b0a607/d65560ae15c5/03443389898-e3/03443389898-e3.jpg?ts=1794221579084&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Pastel pink",
              "Dark anthracite"
          ],
          "description": "Model height: 188 cm\n\nBoxy-fit hoodie made from a cotton-blend fabric with a fleece interior. Adjustable hoodie and long sleeve. Front pouch pockets. Ribbed trims. Front zip fastening.\n\nSpecial Daily A+ collection.",
          "materialCare": [
              "OUTER SHELL: 100% cotton",
              "LINING: 100% cotton"
          ]
      },
      {
          "id": "zara-w12",
          "slug": "wool-blend-coat-with-detachable-faux-fur-regular-collar-zara-w12",
          "name": "WOOL BLEND COAT WITH DETACHABLE FAUX FUR",
          "category": "Coats",
          "gender": "WOMEN",
          "price": 559.0,
          "oldPrice": null,
          "discount": null,
          "reference": "2971/319",
          "image": "https://static.zara.net/assets/public/66ea/cb9d/07494362a5e3/6a1c578f9615/02971319736-000-p/02971319736-000-p.jpg?ts=1792656218754&w=850",
          "images": [
              "https://static.zara.net/assets/public/66ea/cb9d/07494362a5e3/6a1c578f9615/02971319736-000-p/02971319736-000-p.jpg?ts=1792656218754&w=850",
              "https://static.zara.net/assets/public/3787/accf/37bf4585a324/9e5bb73775a1/02971319736-000-a1/02971319736-000-a1.jpg?ts=1792656222370&w=850",
              "https://static.zara.net/assets/public/74d0/b896/9d144d28880d/65f97756018a/02983341736-a2/02983341736-a2.jpg?ts=1792596227077&w=850",
              "https://static.zara.net/assets/public/c768/ce41/f8cc4791884b/c4e822bcb5da/02983341736-a3/02983341736-a3.jpg?ts=1792596226571&w=850",
              "https://static.zara.net/assets/public/5850/fed7/38994d079822/84c084311cb8/02983341736-a4/02983341736-a4.jpg?ts=1792596234523&w=850",
              "https://static.zara.net/assets/public/4c3a/f786/a1f843d3abd6/ef70b5a69762/02983341736-e1/02983341736-e1.jpg?ts=1792502968596&w=850",
              "https://static.zara.net/assets/public/83ab/1a7b/50ba4e4db397/d7f78ca11e06/02983341736-e2/02983341736-e2.jpg?ts=1792502968359&w=850",
              "https://static.zara.net/assets/public/8a64/7d4a/925445a7a096/07504a8bd1b2/02983341736-e3/02983341736-e3.jpg?ts=1792502966616&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Light mink",
                  "hex": "#9F9288",
                  "reference": "2971/319",
                  "images": [
                      "https://static.zara.net/assets/public/66ea/cb9d/07494362a5e3/6a1c578f9615/02971319736-000-p/02971319736-000-p.jpg?ts=1792656218754&w=850",
                      "https://static.zara.net/assets/public/3787/accf/37bf4585a324/9e5bb73775a1/02971319736-000-a1/02971319736-000-a1.jpg?ts=1792656222370&w=850",
                      "https://static.zara.net/assets/public/74d0/b896/9d144d28880d/65f97756018a/02983341736-a2/02983341736-a2.jpg?ts=1792596227077&w=850",
                      "https://static.zara.net/assets/public/c768/ce41/f8cc4791884b/c4e822bcb5da/02983341736-a3/02983341736-a3.jpg?ts=1792596226571&w=850",
                      "https://static.zara.net/assets/public/5850/fed7/38994d079822/84c084311cb8/02983341736-a4/02983341736-a4.jpg?ts=1792596234523&w=850",
                      "https://static.zara.net/assets/public/4c3a/f786/a1f843d3abd6/ef70b5a69762/02983341736-e1/02983341736-e1.jpg?ts=1792502968596&w=850",
                      "https://static.zara.net/assets/public/83ab/1a7b/50ba4e4db397/d7f78ca11e06/02983341736-e2/02983341736-e2.jpg?ts=1792502968359&w=850",
                      "https://static.zara.net/assets/public/8a64/7d4a/925445a7a096/07504a8bd1b2/02983341736-e3/02983341736-e3.jpg?ts=1792502966616&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#121315",
                  "reference": "2971/319",
                  "images": [
                      "https://static.zara.net/assets/public/06ee/d840/f2dc4147b723/fb800fa559e8/02971319800-p/02971319800-p.jpg?ts=1794329760062&w=850",
                      "https://static.zara.net/assets/public/3fa4/f160/0cfb4a2ead92/9ca5289fc129/02971319800-a1/02971319800-a1.jpg?ts=1794329760152&w=850",
                      "https://static.zara.net/assets/public/7f36/4b01/76e6476fa9ea/c8317dfee433/02971319800-a2/02971319800-a2.jpg?ts=1794329759568&w=850",
                      "https://static.zara.net/assets/public/78b3/8fae/4de04919be4c/b6654dc46be7/02971319800-a3/02971319800-a3.jpg?ts=1794329759819&w=850",
                      "https://static.zara.net/assets/public/c622/bf58/8d664af6b4f5/2f85f28642a2/02971319800-a4/02971319800-a4.jpg?ts=1794329759028&w=850",
                      "https://static.zara.net/assets/public/5030/2c32/0572439ba4f5/ae4f781c42a8/02971319800-a5/02971319800-a5.jpg?ts=1794329759779&w=850",
                      "https://static.zara.net/assets/public/733b/9fc3/1a9f4a2da979/4ada7b0944de/02971319800-a6/02971319800-a6.jpg?ts=1794329759187&w=850",
                      "https://static.zara.net/assets/public/4b3b/10e7/94724d788ed8/63ed261c36ce/02971319800-e1/02971319800-e1.jpg?ts=1793017660666&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Light mink",
              "Black"
          ],
          "description": "Model height: 177 cm\n\nCoat made of a wool blend. Regular collar with detachable faux fur fabric and long sleeve with shoulder pads. Front welt pockets. Back vent at the hem. Front button fastening and matching fabric belt.",
          "materialCare": [
              "LINING: 100% acetate"
          ]
      },
      {
          "id": "zara-m12",
          "slug": "regular-fit-zip-up-hoodie-zara-m12",
          "name": "REGULAR FIT HOODIE WITH ZIP",
          "category": "Hoodies",
          "gender": "MEN",
          "price": 299.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4393/300",
          "image": "https://static.zara.net/assets/public/c4af/95e4/d1084b0088c0/6aa17a0db88b/04393300800-p/04393300800-p.jpg?ts=1794404573035&w=850",
          "images": [
              "https://static.zara.net/assets/public/c4af/95e4/d1084b0088c0/6aa17a0db88b/04393300800-p/04393300800-p.jpg?ts=1794404573035&w=850",
              "https://static.zara.net/assets/public/50ee/fd96/6d0b448e8277/13c04a83e75e/04393300800-a1/04393300800-a1.jpg?ts=1794404573193&w=850",
              "https://static.zara.net/assets/public/3e5b/1721/03c8413dbaf4/799c4d2681c2/04393300800-a2/04393300800-a2.jpg?ts=1794404573378&w=850",
              "https://static.zara.net/assets/public/62a7/92c0/9c674407a013/d2a5be0996f2/04393300800-a3/04393300800-a3.jpg?ts=1794404573381&w=850",
              "https://static.zara.net/assets/public/470e/c2d2/ea924067a4fc/3ea9c077274f/04393300800-e1/04393300800-e1.jpg?ts=1786452535723&w=850",
              "https://static.zara.net/assets/public/9cc2/ec76/47d14ea88fce/bdea7b35df8e/04393300800-e2/04393300800-e2.jpg?ts=1786452536316&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "4393/300",
                  "images": [
                      "https://static.zara.net/assets/public/c4af/95e4/d1084b0088c0/6aa17a0db88b/04393300800-p/04393300800-p.jpg?ts=1794404573035&w=850",
                      "https://static.zara.net/assets/public/50ee/fd96/6d0b448e8277/13c04a83e75e/04393300800-a1/04393300800-a1.jpg?ts=1794404573193&w=850",
                      "https://static.zara.net/assets/public/3e5b/1721/03c8413dbaf4/799c4d2681c2/04393300800-a2/04393300800-a2.jpg?ts=1794404573378&w=850",
                      "https://static.zara.net/assets/public/62a7/92c0/9c674407a013/d2a5be0996f2/04393300800-a3/04393300800-a3.jpg?ts=1794404573381&w=850",
                      "https://static.zara.net/assets/public/470e/c2d2/ea924067a4fc/3ea9c077274f/04393300800-e1/04393300800-e1.jpg?ts=1786452535723&w=850",
                      "https://static.zara.net/assets/public/9cc2/ec76/47d14ea88fce/bdea7b35df8e/04393300800-e2/04393300800-e2.jpg?ts=1786452536316&w=850"
                  ]
              },
              {
                  "name": "Grey marl",
                  "hex": "#B5B4B6",
                  "reference": "4393/300",
                  "images": [
                      "https://static.zara.net/assets/public/c69c/9aa1/4a1a4b1da34b/e7d0ea574721/04393300803-p/04393300803-p.jpg?ts=1794404574575&w=850",
                      "https://static.zara.net/assets/public/d090/19b0/801745e0bbba/c0a5a178a811/04393300803-a1/04393300803-a1.jpg?ts=1794404575038&w=850",
                      "https://static.zara.net/assets/public/ca8f/6310/d8444bea8473/60cb43edb2d0/04393300803-a2/04393300803-a2.jpg?ts=1794404573915&w=850",
                      "https://static.zara.net/assets/public/4354/8a9c/410c42e097bf/84fe881f2977/04393300803-a3/04393300803-a3.jpg?ts=1794404573635&w=850",
                      "https://static.zara.net/assets/public/9fe2/4fc2/64c347dea43d/d6db17c523dc/04393300803-e1/04393300803-e1.jpg?ts=1786452535911&w=850",
                      "https://static.zara.net/assets/public/71da/8608/f4b949e98976/eb502ae050f1/04393300803-e2/04393300803-e2.jpg?ts=1786452535780&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Black",
              "Grey marl"
          ],
          "description": "Model height: 185 cm\n\nRegular fit hoodie made from cotton fabric with a loop-back interior. Features an adjustable hood, long sleeves, front pouch pockets and ribbed trims. Finished with a two-way zip fastening.\n\nOrigins special collection.",
          "materialCare": [
              "LINING: 100% cotton"
          ]
      },
      {
          "id": "zara-w13",
          "slug": "long-halter-satin-dress-zara-w13",
          "name": "LONG HALTER SATIN DRESS",
          "category": "Dresses",
          "gender": "WOMEN",
          "price": 219.0,
          "oldPrice": null,
          "discount": null,
          "reference": "7733/061",
          "image": "https://static.zara.net/assets/public/16a7/665c/54dc49abb999/eaf6889b3b0d/07733061529-000-p/07733061529-000-p.jpg?ts=1794494596282&w=850",
          "images": [
              "https://static.zara.net/assets/public/16a7/665c/54dc49abb999/eaf6889b3b0d/07733061529-000-p/07733061529-000-p.jpg?ts=1794494596282&w=850",
              "https://static.zara.net/assets/public/cd5d/7187/c06e44fd89ec/21a7896b7199/07733061529-000-a1/07733061529-000-a1.jpg?ts=1794494596152&w=850",
              "https://static.zara.net/assets/public/7b9d/2403/addf496896da/cc0b750452e6/07733061529-000-a2/07733061529-000-a2.jpg?ts=1794494597193&w=850",
              "https://static.zara.net/assets/public/d1e1/5a24/a662430cbfdb/5df8174db123/07733061529-000-a3/07733061529-000-a3.jpg?ts=1794494596006&w=850",
              "https://static.zara.net/assets/public/143b/3705/fbaa4370a796/575d6cc77f2a/07733061529-000-a4/07733061529-000-a4.jpg?ts=1794494596210&w=850",
              "https://static.zara.net/assets/public/f167/c7cb/ecb24f71b53f/2589b25cb51c/07733061529-e1/07733061529-e1.jpg?ts=1793695924165&w=850",
              "https://static.zara.net/assets/public/0024/0572/d6134797b59f/317fd1dc0c52/07733061529-e2/07733061529-e2.jpg?ts=1793695924007&w=850",
              "https://static.zara.net/assets/public/cab1/1468/8f1549c2b9ef/fd3d38d12716/07733061529-e3/07733061529-e3.jpg?ts=1793695923881&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Dark green",
                  "hex": "#1a2c28",
                  "reference": "7733/061",
                  "images": [
                      "https://static.zara.net/assets/public/16a7/665c/54dc49abb999/eaf6889b3b0d/07733061529-000-p/07733061529-000-p.jpg?ts=1794494596282&w=850",
                      "https://static.zara.net/assets/public/cd5d/7187/c06e44fd89ec/21a7896b7199/07733061529-000-a1/07733061529-000-a1.jpg?ts=1794494596152&w=850",
                      "https://static.zara.net/assets/public/7b9d/2403/addf496896da/cc0b750452e6/07733061529-000-a2/07733061529-000-a2.jpg?ts=1794494597193&w=850",
                      "https://static.zara.net/assets/public/d1e1/5a24/a662430cbfdb/5df8174db123/07733061529-000-a3/07733061529-000-a3.jpg?ts=1794494596006&w=850",
                      "https://static.zara.net/assets/public/143b/3705/fbaa4370a796/575d6cc77f2a/07733061529-000-a4/07733061529-000-a4.jpg?ts=1794494596210&w=850",
                      "https://static.zara.net/assets/public/f167/c7cb/ecb24f71b53f/2589b25cb51c/07733061529-e1/07733061529-e1.jpg?ts=1793695924165&w=850",
                      "https://static.zara.net/assets/public/0024/0572/d6134797b59f/317fd1dc0c52/07733061529-e2/07733061529-e2.jpg?ts=1793695924007&w=850",
                      "https://static.zara.net/assets/public/cab1/1468/8f1549c2b9ef/fd3d38d12716/07733061529-e3/07733061529-e3.jpg?ts=1793695923881&w=850"
                  ]
              },
              {
                  "name": "Burgundy",
                  "hex": "#391c1a",
                  "reference": "7733/061",
                  "images": [
                      "https://static.zara.net/assets/public/5fa0/ed78/28164df695af/f06572a464c4/07733061606-000-p/07733061606-000-p.jpg?ts=1794494605703&w=850",
                      "https://static.zara.net/assets/public/613d/9212/7d934d8ea1bd/070dd9b36d7a/07733061606-000-a1/07733061606-000-a1.jpg?ts=1794494605785&w=850",
                      "https://static.zara.net/assets/public/3ddb/94fc/eb5d42468c4b/428c10be1a5c/07733061606-000-a2/07733061606-000-a2.jpg?ts=1794494605977&w=850",
                      "https://static.zara.net/assets/public/0776/9a06/d37a495b9801/421187211cb1/07733061606-000-a3/07733061606-000-a3.jpg?ts=1794494606160&w=850",
                      "https://static.zara.net/assets/public/6fbc/d059/e7fa479cbd17/bb91c20f3e69/07733061606-000-a4/07733061606-000-a4.jpg?ts=1794494605985&w=850",
                      "https://static.zara.net/assets/public/a6d9/7ed5/2af440e78dc0/34ed353ffb29/07733061606-000-a5/07733061606-000-a5.jpg?ts=1794494606297&w=850",
                      "https://static.zara.net/assets/public/9945/fd7e/b3b84374a49a/df83562a0d4d/07810061606-e1/07810061606-e1.jpg?ts=1794240920713&w=850",
                      "https://static.zara.net/assets/public/dc2b/d243/6ed44bdcbc3e/a656c89fd98b/07810061606-e2/07810061606-e2.jpg?ts=1794240921215&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#121315",
                  "reference": "7733/061",
                  "images": [
                      "https://static.zara.net/assets/public/c359/b3a6/a9e24ade974c/83568267e1ca/07733051800-p/07733051800-p.jpg?ts=1794307847792&w=850",
                      "https://static.zara.net/assets/public/ed83/d2dd/bd9e4b10b6e4/35c40688de5b/07733051800-a1/07733051800-a1.jpg?ts=1794307840610&w=850",
                      "https://static.zara.net/assets/public/41f5/91f4/9ccb4df69ea4/ea5180a092bd/07733051800-a2/07733051800-a2.jpg?ts=1794307851378&w=850",
                      "https://static.zara.net/assets/public/428a/66a6/e31c433b8daf/42e2fbab1aec/07733051800-a3/07733051800-a3.jpg?ts=1794307853380&w=850",
                      "https://static.zara.net/assets/public/93e2/67c6/c8e14d3e843f/e452b6f3f873/07733051800-a4/07733051800-a4.jpg?ts=1794307845233&w=850",
                      "https://static.zara.net/assets/public/1c3f/e056/f9014763a9e1/5a5188f4731a/07733051800-a5/07733051800-a5.jpg?ts=1794307847198&w=850",
                      "https://static.zara.net/assets/public/3d52/14a6/89384cb38c5f/ae2b447d3fc8/07733051800-e1/07733051800-e1.jpg?ts=1793695929414&w=850",
                      "https://static.zara.net/assets/public/05ad/a3dc/27024c5691c5/fbb575bd8fd9/07733051800-e2/07733051800-e2.jpg?ts=1793695928588&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL",
              "XXL"
          ],
          "colors": [
              "Dark green",
              "Burgundy",
              "Black"
          ],
          "description": "Long dress in satin fabric. Halter neck and open back. Tie fastening at the neck.",
          "materialCare": [
              "OUTER SHELL: 97% polyester, 3% elastane"
          ]
      },
      {
          "id": "zara-m13",
          "slug": "regular-fit-jeans-zara-m13",
          "name": "REGULAR FIT JEANS",
          "category": "Jeans",
          "gender": "MEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4470/350",
          "image": "https://static.zara.net/assets/public/bfa3/f121/db684b61bada/08df79b5e051/05585350251-p/05585350251-p.jpg?ts=1785486164642&w=850",
          "images": [
              "https://static.zara.net/assets/public/bfa3/f121/db684b61bada/08df79b5e051/05585350251-p/05585350251-p.jpg?ts=1785486164642&w=850",
              "https://static.zara.net/assets/public/7738/8e77/e7a54dc4ad88/e7be2fde3889/05585350251-a1/05585350251-a1.jpg?ts=1785486166157&w=850",
              "https://static.zara.net/assets/public/2b30/d895/f68a4015a9f4/f00009c39f8c/05585350251-a2/05585350251-a2.jpg?ts=1785486164550&w=850",
              "https://static.zara.net/assets/public/0b61/94a8/9a674c27825e/44aefa8623a4/05585350251-a3/05585350251-a3.jpg?ts=1785486164947&w=850",
              "https://static.zara.net/assets/public/38d0/e1e3/3a3143aba117/c75b7e414c36/05585350251-a4/05585350251-a4.jpg?ts=1785486164759&w=850",
              "https://static.zara.net/assets/public/1348/5300/6e354a4fa9c6/3ba2eb4f3542/05585350251-a5/05585350251-a5.jpg?ts=1785486167094&w=850",
              "https://static.zara.net/assets/public/e401/c441/ac7446a18c66/23022bfc0327/05585350251-e1/05585350251-e1.jpg?ts=1785401542310&w=850",
              "https://static.zara.net/assets/public/0e90/eacc/072c44328eb5/4bbd9e1b9d3f/05585350251-e2/05585350251-e2.jpg?ts=1785401542518&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Oyster-white",
                  "hex": "#F4F6FA",
                  "reference": "4470/350",
                  "images": [
                      "https://static.zara.net/assets/public/bfa3/f121/db684b61bada/08df79b5e051/05585350251-p/05585350251-p.jpg?ts=1785486164642&w=850",
                      "https://static.zara.net/assets/public/7738/8e77/e7a54dc4ad88/e7be2fde3889/05585350251-a1/05585350251-a1.jpg?ts=1785486166157&w=850",
                      "https://static.zara.net/assets/public/2b30/d895/f68a4015a9f4/f00009c39f8c/05585350251-a2/05585350251-a2.jpg?ts=1785486164550&w=850",
                      "https://static.zara.net/assets/public/0b61/94a8/9a674c27825e/44aefa8623a4/05585350251-a3/05585350251-a3.jpg?ts=1785486164947&w=850",
                      "https://static.zara.net/assets/public/38d0/e1e3/3a3143aba117/c75b7e414c36/05585350251-a4/05585350251-a4.jpg?ts=1785486164759&w=850",
                      "https://static.zara.net/assets/public/1348/5300/6e354a4fa9c6/3ba2eb4f3542/05585350251-a5/05585350251-a5.jpg?ts=1785486167094&w=850",
                      "https://static.zara.net/assets/public/e401/c441/ac7446a18c66/23022bfc0327/05585350251-e1/05585350251-e1.jpg?ts=1785401542310&w=850",
                      "https://static.zara.net/assets/public/0e90/eacc/072c44328eb5/4bbd9e1b9d3f/05585350251-e2/05585350251-e2.jpg?ts=1785401542518&w=850"
                  ]
              },
              {
                  "name": "Blue",
                  "hex": "#D3D9DE",
                  "reference": "4470/350",
                  "images": [
                      "https://static.zara.net/assets/public/2e0b/60e9/68b4439ba0b3/6938e85252aa/06045350400-p/06045350400-p.jpg?ts=1794404489184&w=850",
                      "https://static.zara.net/assets/public/1fdb/0d3c/4b604cea9d33/7f28f5f7b574/06045350400-a1/06045350400-a1.jpg?ts=1794404489461&w=850",
                      "https://static.zara.net/assets/public/1ed4/0498/399843ffbf79/e1e18b4d8e43/06045350400-a2/06045350400-a2.jpg?ts=1794404490774&w=850",
                      "https://static.zara.net/assets/public/6144/69dc/1b614c80b6f5/45bf699c72ad/06045350400-a3/06045350400-a3.jpg?ts=1794404490281&w=850",
                      "https://static.zara.net/assets/public/e0c7/2be3/d7584d8eb694/6b75770e5e94/08062350400-e1/08062350400-e1.jpg?ts=1785401590496&w=850",
                      "https://static.zara.net/assets/public/934f/efec/ddfc411b993b/700789e4fdcb/08062350400-e2/08062350400-e2.jpg?ts=1785401590055&w=850",
                      "https://static.zara.net/assets/public/a52c/9c77/e4634b9a8864/f3e0025596c0/08062350400-e3/08062350400-e3.jpg?ts=1785401590296&w=850",
                      "https://static.zara.net/assets/public/3c7c/1c27/fbd54c9c9e68/d734eeffb931/08062350400-e4/08062350400-e4.jpg?ts=1785401590518&w=850"
                  ]
              },
              {
                  "name": "Indigo",
                  "hex": "#2a3a65",
                  "reference": "4470/350",
                  "images": [
                      "https://static.zara.net/assets/public/8ec1/f234/0c8141e9a5ce/561682075fb4/05762353405-p/05762353405-p.jpg?ts=1793890932058&w=850",
                      "https://static.zara.net/assets/public/a090/f725/c8c5456d96cc/9afc88aa110e/05762353405-a1/05762353405-a1.jpg?ts=1793890934520&w=850",
                      "https://static.zara.net/assets/public/cd6c/568c/39944896bb05/70a71cfe3346/05762353405-a2/05762353405-a2.jpg?ts=1793890933084&w=850",
                      "https://static.zara.net/assets/public/ad11/e4c8/05b140358183/f51912f3b009/05762353405-a3/05762353405-a3.jpg?ts=1793890932412&w=850",
                      "https://static.zara.net/assets/public/2e88/e8f6/06f3487fb8c0/791338f0335b/05762353405-a4/05762353405-a4.jpg?ts=1793890932490&w=850",
                      "https://static.zara.net/assets/public/8850/9ea1/bb564e248744/aceda71feb18/05762353405-a5/05762353405-a5.jpg?ts=1793890933981&w=850",
                      "https://static.zara.net/assets/public/9155/a4ba/62214409a23c/8117c96f3ea2/05762353405-e1/05762353405-e1.jpg?ts=1793870271170&w=850",
                      "https://static.zara.net/assets/public/4b02/7ef2/a049417b909a/ba809147c453/05762353405-e2/05762353405-e2.jpg?ts=1793870270339&w=850"
                  ]
              },
              {
                  "name": "Blue",
                  "hex": "#475C6B",
                  "reference": "4470/350",
                  "images": [
                      "https://static.zara.net/assets/public/f2df/3c19/63ea442b923a/fa8820aaefe5/04470350407-p/04470350407-p.jpg?ts=1794404491387&w=850",
                      "https://static.zara.net/assets/public/fac6/9646/349a405fb271/cfb07bccd650/04470350407-a1/04470350407-a1.jpg?ts=1794404489671&w=850",
                      "https://static.zara.net/assets/public/0b4b/513d/ce984846b57d/8bd3df499bdd/04470350407-a2/04470350407-a2.jpg?ts=1794404491145&w=850",
                      "https://static.zara.net/assets/public/ce13/1c9e/06784da5914a/c44c939cb91e/04470350407-a3/04470350407-a3.jpg?ts=1794404491120&w=850",
                      "https://static.zara.net/assets/public/a28d/8d23/cb874048ae3c/88fbd03415b3/04470350407-a4/04470350407-a4.jpg?ts=1794404491674&w=850",
                      "https://static.zara.net/assets/public/3348/892f/8de4484b8ad7/816f394d863b/04470350407-a5/04470350407-a5.jpg?ts=1794404489905&w=850",
                      "https://static.zara.net/assets/public/f9f8/e3d7/2a7745a3acef/b15ddc075844/04470350407-e1/04470350407-e1.jpg?ts=1785487881614&w=850",
                      "https://static.zara.net/assets/public/b01c/5496/17f342ff831d/b752394569f4/04470350407-e2/04470350407-e2.jpg?ts=1785487882435&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "4470/350",
                  "images": [
                      "https://static.zara.net/assets/public/c1c9/b0e1/2fdb49bd9c60/3f74893b5e24/04060350800-p/04060350800-p.jpg?ts=1794404497330&w=850",
                      "https://static.zara.net/assets/public/78a2/5747/f2254c2db63a/d3af408d27b9/04060350800-a1/04060350800-a1.jpg?ts=1794404497102&w=850",
                      "https://static.zara.net/assets/public/87a7/b625/d65241febe89/8f157542baaf/04060350800-a2/04060350800-a2.jpg?ts=1794404497377&w=850",
                      "https://static.zara.net/assets/public/758b/9f8a/aa79461a901c/fd89de265883/04060350800-a3/04060350800-a3.jpg?ts=1794404492087&w=850",
                      "https://static.zara.net/assets/public/9942/3199/cb624044b8c9/ba83c8257409/04060350800-a4/04060350800-a4.jpg?ts=1794404497339&w=850",
                      "https://static.zara.net/assets/public/daf6/d078/bf9e4833aee3/a76a2ed97105/04060350800-a5/04060350800-a5.jpg?ts=1794404497277&w=850",
                      "https://static.zara.net/assets/public/120f/52d8/53564465989d/f6c8d2cd3c0a/04060350800-e1/04060350800-e1.jpg?ts=1785857069357&w=850",
                      "https://static.zara.net/assets/public/7276/f6e5/9ced498e98ee/d011e60e9e1e/04060350800-e2/04060350800-e2.jpg?ts=1785857069459&w=850"
                  ]
              },
              {
                  "name": "Grey",
                  "hex": "#8F8F8F",
                  "reference": "4470/350",
                  "images": [
                      "https://static.zara.net/assets/public/084e/d10c/08c246148166/93bae61dc8f3/04060350802-p/04060350802-p.jpg?ts=1794404491401&w=850",
                      "https://static.zara.net/assets/public/dfb7/9cca/959549998f59/c5845c5cbf4d/04060350802-a1/04060350802-a1.jpg?ts=1794404497180&w=850",
                      "https://static.zara.net/assets/public/a6fa/f569/3fd14e30a238/6ad814574a44/04060350802-a2/04060350802-a2.jpg?ts=1794404491336&w=850",
                      "https://static.zara.net/assets/public/1681/3083/ec86427b8175/b1688ace98a9/04060350802-a3/04060350802-a3.jpg?ts=1794404490958&w=850",
                      "https://static.zara.net/assets/public/d662/8cc9/a8644759a564/ab13ea42ef6d/04060350802-a4/04060350802-a4.jpg?ts=1794404491979&w=850",
                      "https://static.zara.net/assets/public/0a83/40e6/92fa4c7f804f/de4717839e76/04060350802-a5/04060350802-a5.jpg?ts=1794404491376&w=850",
                      "https://static.zara.net/assets/public/3968/4318/69d04c2abec4/b4c40ce9425d/04060350802-e1/04060350802-e1.jpg?ts=1785857054344&w=850",
                      "https://static.zara.net/assets/public/7fd9/a09f/0f70488ca654/38dbfea93a09/04060350802-e2/04060350802-e2.jpg?ts=1785857054546&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "36",
              "38",
              "40",
              "42",
              "44",
              "46",
              "48"
          ],
          "colors": [
              "Oyster-white",
              "Blue",
              "Indigo",
              "Blue",
              "Black",
              "Grey"
          ],
          "description": "Model height: 185 cm\n\nStraight-leg from hip to ankle with a fit that neither tapers nor flares. Mid-waist. Rigid fabric. A slimmer leg fit than our Basic Straight-leg model.\n\nRegular fit jeans crafted from cotton denim. Five-pocket design. Faded finish. Zip fly and button fastening.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-w14",
          "slug": "satin-midi-dress-zara-w14",
          "name": "SATIN MIDI DRESS",
          "category": "Dresses",
          "gender": "WOMEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "9010/566",
          "image": "https://static.zara.net/assets/public/05c2/fcd5/d68f4d29929f/03bd110de90d/09010566732-p/09010566732-p.jpg?ts=1792667767017&w=850",
          "images": [
              "https://static.zara.net/assets/public/05c2/fcd5/d68f4d29929f/03bd110de90d/09010566732-p/09010566732-p.jpg?ts=1792667767017&w=850",
              "https://static.zara.net/assets/public/ace9/c7df/b4694d4d8388/d6c98fd844d2/09010566732-a1/09010566732-a1.jpg?ts=1792667767128&w=850",
              "https://static.zara.net/assets/public/48b8/fcd3/08c046dd9150/9f90137c0fac/09010566732-a2/09010566732-a2.jpg?ts=1792667766657&w=850",
              "https://static.zara.net/assets/public/c0e2/be29/cedb4bc787e7/5e2707ddfc3e/09010566732-a3/09010566732-a3.jpg?ts=1792667767670&w=850",
              "https://static.zara.net/assets/public/76ae/dd14/027a4969bf38/acb4628d3166/09010566732-a4/09010566732-a4.jpg?ts=1792667767453&w=850",
              "https://static.zara.net/assets/public/73de/e581/e1bd467d9865/f66a489030c6/09010566732-a5/09010566732-a5.jpg?ts=1792667766062&w=850",
              "https://static.zara.net/assets/public/2ca6/45d9/63f744c09e6b/f31f80b7469a/09010566732-e1/09010566732-e1.jpg?ts=1792508619326&w=850",
              "https://static.zara.net/assets/public/555a/7432/4e1949bd92c7/be657d662fe9/09010566732-e2/09010566732-e2.jpg?ts=1792508619463&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Caramel",
                  "hex": "#7F4E2B",
                  "reference": "9010/566",
                  "images": [
                      "https://static.zara.net/assets/public/05c2/fcd5/d68f4d29929f/03bd110de90d/09010566732-p/09010566732-p.jpg?ts=1792667767017&w=850",
                      "https://static.zara.net/assets/public/ace9/c7df/b4694d4d8388/d6c98fd844d2/09010566732-a1/09010566732-a1.jpg?ts=1792667767128&w=850",
                      "https://static.zara.net/assets/public/48b8/fcd3/08c046dd9150/9f90137c0fac/09010566732-a2/09010566732-a2.jpg?ts=1792667766657&w=850",
                      "https://static.zara.net/assets/public/c0e2/be29/cedb4bc787e7/5e2707ddfc3e/09010566732-a3/09010566732-a3.jpg?ts=1792667767670&w=850",
                      "https://static.zara.net/assets/public/76ae/dd14/027a4969bf38/acb4628d3166/09010566732-a4/09010566732-a4.jpg?ts=1792667767453&w=850",
                      "https://static.zara.net/assets/public/73de/e581/e1bd467d9865/f66a489030c6/09010566732-a5/09010566732-a5.jpg?ts=1792667766062&w=850",
                      "https://static.zara.net/assets/public/2ca6/45d9/63f744c09e6b/f31f80b7469a/09010566732-e1/09010566732-e1.jpg?ts=1792508619326&w=850",
                      "https://static.zara.net/assets/public/555a/7432/4e1949bd92c7/be657d662fe9/09010566732-e2/09010566732-e2.jpg?ts=1792508619463&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#121315",
                  "reference": "9010/566",
                  "images": [
                      "https://static.zara.net/assets/public/206b/ebdf/91b24fb2b10a/696542851bca/09030581800-p/09030581800-p.jpg?ts=1794329760686&w=850",
                      "https://static.zara.net/assets/public/648e/eda4/41b74fca93fe/7e9adffc1dd9/09030581800-a1/09030581800-a1.jpg?ts=1794329760371&w=850",
                      "https://static.zara.net/assets/public/8b1e/5268/254145afa413/01be81e73f92/09030581800-a2/09030581800-a2.jpg?ts=1794329761198&w=850",
                      "https://static.zara.net/assets/public/0e7d/072f/438b45068521/cecbab26a349/09030581800-a3/09030581800-a3.jpg?ts=1794329761732&w=850",
                      "https://static.zara.net/assets/public/5b93/68f1/05ef4f7f8111/73975ac6261c/09030581800-a4/09030581800-a4.jpg?ts=1794329760593&w=850",
                      "https://static.zara.net/assets/public/98b9/7d67/d8314621a550/c043385af205/09030581800-a5/09030581800-a5.jpg?ts=1794329761835&w=850",
                      "https://static.zara.net/assets/public/d9ec/8424/b64b4eab82cf/a49678116618/09030581800-e1/09030581800-e1.jpg?ts=1793089582848&w=850",
                      "https://static.zara.net/assets/public/721c/f197/f6d042bb968f/d588293c2beb/09030581800-e2/09030581800-e2.jpg?ts=1793089583080&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Caramel",
              "Black"
          ],
          "description": "Model height: 177 cm\n\nHalter neck dress with pleats and open back. Side zip fastening hidden in the seam and hidden buttons at the neck.",
          "materialCare": [
              "OUTER SHELL: 100% polyester",
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-m14",
          "slug": "basic-slim-fit-jeans-zara-m14",
          "name": "BASIC SLIM FIT JEANS",
          "category": "Jeans",
          "gender": "MEN",
          "price": 159.0,
          "oldPrice": null,
          "discount": null,
          "reference": "7743/334",
          "image": "https://static.zara.net/assets/public/fb72/5e2b/add74fb8b84d/bee85c67d830/00774333400-p/00774333400-p.jpg?ts=1786522714160&w=850",
          "images": [
              "https://static.zara.net/assets/public/fb72/5e2b/add74fb8b84d/bee85c67d830/00774333400-p/00774333400-p.jpg?ts=1786522714160&w=850",
              "https://static.zara.net/assets/public/4e27/5760/b84a41e48f33/c40dfe9f0e23/00774333400-a1/00774333400-a1.jpg?ts=1786522711233&w=850",
              "https://static.zara.net/assets/public/37ed/b3b7/19ed41d3ad82/3921073a761e/00774333400-a2/00774333400-a2.jpg?ts=1786522711063&w=850",
              "https://static.zara.net/assets/public/fef7/b027/fd7642fd9826/22b3503f334a/00774333400-a3/00774333400-a3.jpg?ts=1786522710676&w=850",
              "https://static.zara.net/assets/public/a928/246b/954e4469aa4a/69448b1484ed/00774333400-a4/00774333400-a4.jpg?ts=1786522703940&w=850",
              "https://static.zara.net/assets/public/10d9/cb4b/cd5d4fa786df/bb3529c90dcb/00774333400-e1/00774333400-e1.jpg?ts=1786348679731&w=850",
              "https://static.zara.net/assets/public/4820/96e7/8ea44430bf87/d052da7b5eeb/00774333400-e2/00774333400-e2.jpg?ts=1786348680309&w=850",
              "https://static.zara.net/assets/public/5c67/f44d/b5fe4d66b0d8/e544fd8d2574/00774333400-e3/00774333400-e3.jpg?ts=1786348680635&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Blue",
                  "hex": "#1E2530",
                  "reference": "7743/334",
                  "images": [
                      "https://static.zara.net/assets/public/fb72/5e2b/add74fb8b84d/bee85c67d830/00774333400-p/00774333400-p.jpg?ts=1786522714160&w=850",
                      "https://static.zara.net/assets/public/4e27/5760/b84a41e48f33/c40dfe9f0e23/00774333400-a1/00774333400-a1.jpg?ts=1786522711233&w=850",
                      "https://static.zara.net/assets/public/37ed/b3b7/19ed41d3ad82/3921073a761e/00774333400-a2/00774333400-a2.jpg?ts=1786522711063&w=850",
                      "https://static.zara.net/assets/public/fef7/b027/fd7642fd9826/22b3503f334a/00774333400-a3/00774333400-a3.jpg?ts=1786522710676&w=850",
                      "https://static.zara.net/assets/public/a928/246b/954e4469aa4a/69448b1484ed/00774333400-a4/00774333400-a4.jpg?ts=1786522703940&w=850",
                      "https://static.zara.net/assets/public/10d9/cb4b/cd5d4fa786df/bb3529c90dcb/00774333400-e1/00774333400-e1.jpg?ts=1786348679731&w=850",
                      "https://static.zara.net/assets/public/4820/96e7/8ea44430bf87/d052da7b5eeb/00774333400-e2/00774333400-e2.jpg?ts=1786348680309&w=850",
                      "https://static.zara.net/assets/public/5c67/f44d/b5fe4d66b0d8/e544fd8d2574/00774333400-e3/00774333400-e3.jpg?ts=1786348680635&w=850"
                  ]
              },
              {
                  "name": "Blue",
                  "hex": "#33373F",
                  "reference": "7743/334",
                  "images": [
                      "https://static.zara.net/assets/public/57f0/d327/b1e649a2a5dd/577a8be8b6a9/00774333407-p/00774333407-p.jpg?ts=1786520247548&w=850",
                      "https://static.zara.net/assets/public/7f4d/fb52/bbda4a22a629/784d3f2b5768/00774333407-a1/00774333407-a1.jpg?ts=1786520247052&w=850",
                      "https://static.zara.net/assets/public/06ff/83d0/30d540e3a0cd/3a59a4fa122b/00774333407-a2/00774333407-a2.jpg?ts=1786520249031&w=850",
                      "https://static.zara.net/assets/public/fbee/5616/60eb4433aea7/e1b4f1c51594/00774333407-a3/00774333407-a3.jpg?ts=1786520248081&w=850",
                      "https://static.zara.net/assets/public/e81e/164f/305e429a9328/f36685fd7f19/00774333407-a4/00774333407-a4.jpg?ts=1786520249399&w=850",
                      "https://static.zara.net/assets/public/68dc/e88d/4c4d4667b1ca/74b9ed61a1a0/00774333407-e1/00774333407-e1.jpg?ts=1786348716689&w=850",
                      "https://static.zara.net/assets/public/4c78/8a38/4d624bd99c44/6dd4b28a00df/00774333407-e2/00774333407-e2.jpg?ts=1786348716674&w=850",
                      "https://static.zara.net/assets/public/50d6/534c/035f42e6bd91/1d0f8a5214f0/00774333407-e3/00774333407-e3.jpg?ts=1786348717596&w=850"
                  ]
              },
              {
                  "name": "Mid-blue",
                  "hex": "#495B72",
                  "reference": "7743/334",
                  "images": [
                      "https://static.zara.net/assets/public/e54a/2641/fd3d46f0b9b9/0d0e063f4f17/00774333427-p/00774333427-p.jpg?ts=1786522704150&w=850",
                      "https://static.zara.net/assets/public/a187/d767/4706483dbfb0/8d52b7b72461/00774333427-a1/00774333427-a1.jpg?ts=1786522701258&w=850",
                      "https://static.zara.net/assets/public/de34/b415/12694cb59cbb/f3663e3e6950/00774333427-a2/00774333427-a2.jpg?ts=1786522701016&w=850",
                      "https://static.zara.net/assets/public/de51/50b9/f8814bd08bd6/b77a09db5d1b/00774333427-a3/00774333427-a3.jpg?ts=1786522700611&w=850",
                      "https://static.zara.net/assets/public/83e5/63a1/98e743a9bdda/a3a3ae6098dd/00774333427-a4/00774333427-a4.jpg?ts=1786522711338&w=850",
                      "https://static.zara.net/assets/public/088a/54ab/32cc4b3b9049/de6423a28df0/00774333427-e1/00774333427-e1.jpg?ts=1786348678803&w=850",
                      "https://static.zara.net/assets/public/f40b/0788/d60d48648c3b/ba42fb5b7fcc/00774333427-e2/00774333427-e2.jpg?ts=1786348684054&w=850",
                      "https://static.zara.net/assets/public/0e02/c936/a37242458a8b/c1a3a50deffe/00774333427-e3/00774333427-e3.jpg?ts=1786348678877&w=850"
                  ]
              },
              {
                  "name": "Ecru",
                  "hex": "#B1A597",
                  "reference": "7743/337",
                  "images": [
                      "https://static.zara.net/assets/public/0b54/ba86/e18941ca8a4c/2068743bb301/04806331712-p/04806331712-p.jpg?ts=1793107354381&w=850",
                      "https://static.zara.net/assets/public/773e/f98e/8b6c44d7b9a7/732ec8177fea/04806331712-a1/04806331712-a1.jpg?ts=1793107351359&w=850",
                      "https://static.zara.net/assets/public/f477/2f1b/6ca74858802d/183ea24aef0e/04806331712-a2/04806331712-a2.jpg?ts=1793107354937&w=850",
                      "https://static.zara.net/assets/public/c207/1674/5f444c2ab4fe/80537e6282fd/04806331712-a3/04806331712-a3.jpg?ts=1793107351301&w=850",
                      "https://static.zara.net/assets/public/beed/4062/858c4dd59a1f/94be067c2c45/04806331712-a4/04806331712-a4.jpg?ts=1793107354222&w=850",
                      "https://static.zara.net/assets/public/6cdb/5d33/b77748babf5e/9318bff62062/04806331712-e1/04806331712-e1.jpg?ts=1793016122761&w=850",
                      "https://static.zara.net/assets/public/9b35/f745/b68d4289bc48/18128c82cdcd/04806331712-e2/04806331712-e2.jpg?ts=1793016122732&w=850",
                      "https://static.zara.net/assets/public/5234/6ce1/292f40ffbec5/2d8c8e414b92/04806331712-e3/04806331712-e3.jpg?ts=1793016123453&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#242524",
                  "reference": "7743/338",
                  "images": [
                      "https://static.zara.net/assets/public/fc14/0e62/6f1348ea9945/73b2a05fd63e/05575333800-p/05575333800-p.jpg?ts=1790332973924&w=850",
                      "https://static.zara.net/assets/public/3129/d135/b1df42718edf/2624ca28b0fc/05575333800-a1/05575333800-a1.jpg?ts=1790332974544&w=850",
                      "https://static.zara.net/assets/public/056a/e03a/2b7a4e53b356/377f3e1152a0/05575333800-a2/05575333800-a2.jpg?ts=1790332974958&w=850",
                      "https://static.zara.net/assets/public/c298/1a74/2c0b41f69601/0a105d3167a3/05575333800-a3/05575333800-a3.jpg?ts=1790332974178&w=850",
                      "https://static.zara.net/assets/public/7a9d/014e/e7cb432e9e6f/3c301c7e3e48/05575333800-a4/05575333800-a4.jpg?ts=1790332974881&w=850",
                      "https://static.zara.net/assets/public/bd3d/6c87/2adb49b8b805/f1ed995bc70e/05575333800-a5/05575333800-a5.jpg?ts=1790332974947&w=850",
                      "https://static.zara.net/assets/public/4f04/68ba/00194341950a/a60579a9ed5c/05575333800-e1/05575333800-e1.jpg?ts=1790178241608&w=850",
                      "https://static.zara.net/assets/public/98f3/9a02/9b8e40a58854/1d7795dac854/05575333800-e2/05575333800-e2.jpg?ts=1790178243747&w=850"
                  ]
              },
              {
                  "name": "Grey",
                  "hex": "#313131",
                  "reference": "7743/338",
                  "images": [
                      "https://static.zara.net/assets/public/cd1a/fff7/b23646629899/7807d239ae3a/00774333802-p/00774333802-p.jpg?ts=1786519253245&w=850",
                      "https://static.zara.net/assets/public/3dde/9d2e/50534351aee2/81eb550a392a/00774333802-a1/00774333802-a1.jpg?ts=1786519252634&w=850",
                      "https://static.zara.net/assets/public/f1fb/bd95/7cb648e09fbb/1b3cf11ed505/00774333802-a2/00774333802-a2.jpg?ts=1786519254524&w=850",
                      "https://static.zara.net/assets/public/ec78/cb06/c52b47fdae72/1897c020b6d8/00774333802-a3/00774333802-a3.jpg?ts=1786519254407&w=850",
                      "https://static.zara.net/assets/public/c007/fb4a/11444bba9168/19536b6e7cb8/00774333802-e1/00774333802-e1.jpg?ts=1786348684129&w=850",
                      "https://static.zara.net/assets/public/29e1/0b6c/a8764c66ab49/cbaea134a0b8/00774333802-e2/00774333802-e2.jpg?ts=1786348691936&w=850",
                      "https://static.zara.net/assets/public/8587/bb97/531c468ebfac/99675d38cc09/00774333802-e3/00774333802-e3.jpg?ts=1786348680427&w=850",
                      "https://static.zara.net/assets/public/459b/0591/a3f94540901a/dd91ede1384c/00774333802-e4/00774333802-e4.jpg?ts=1786348680131&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "36",
              "38",
              "40",
              "42",
              "44",
              "46",
              "48"
          ],
          "colors": [
              "Blue",
              "Blue",
              "Mid-blue",
              "Ecru",
              "Black",
              "Grey"
          ],
          "description": "Model height: 188 cm\n\nFitted from waist to ankle. Mid-waist. Elasticated fabric.\n\nSlim fit jeans made from a cotton blend denim with added stretch. Five-pocket design. Faded finish. Zip fly and button fastening.",
          "materialCare": [
              "OUTER SHELL: 99% cotton, 1% elastane"
          ]
      },
      {
          "id": "zara-w15",
          "slug": "high-neck-knit-jumper-zara-w15",
          "name": "HIGH NECK KNIT JUMPER",
          "category": "Knitwear",
          "gender": "WOMEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "6427/111",
          "image": "https://static.zara.net/assets/public/4f5a/3ad1/e8c447d4bdfe/619d03694795/06427111681-p/06427111681-p.jpg?ts=1794499272789&w=850",
          "images": [
              "https://static.zara.net/assets/public/4f5a/3ad1/e8c447d4bdfe/619d03694795/06427111681-p/06427111681-p.jpg?ts=1794499272789&w=850",
              "https://static.zara.net/assets/public/c056/8889/5845485b913a/8eeabf9b5a7c/06427111681-a1/06427111681-a1.jpg?ts=1794499264290&w=850",
              "https://static.zara.net/assets/public/6fda/5d0b/8be145dfba75/625bece6c3da/06427111681-a2/06427111681-a2.jpg?ts=1794499273012&w=850",
              "https://static.zara.net/assets/public/58cf/6764/fb844a739fca/4e3e5b7df447/06427111681-e1/06427111681-e1.jpg?ts=1794226336035&w=850",
              "https://static.zara.net/assets/public/190b/5fde/39b245dea628/928ccfb57a18/06427111681-e2/06427111681-e2.jpg?ts=1794226337208&w=850",
              "https://static.zara.net/assets/public/e9e2/b8be/e05a45f48c5f/989c71c5513f/06427111681-e3/06427111681-e3.jpg?ts=1794226337525&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Burgundy",
                  "hex": "#7a3b5c",
                  "reference": "6427/111",
                  "images": [
                      "https://static.zara.net/assets/public/4f5a/3ad1/e8c447d4bdfe/619d03694795/06427111681-p/06427111681-p.jpg?ts=1794499272789&w=850",
                      "https://static.zara.net/assets/public/c056/8889/5845485b913a/8eeabf9b5a7c/06427111681-a1/06427111681-a1.jpg?ts=1794499264290&w=850",
                      "https://static.zara.net/assets/public/6fda/5d0b/8be145dfba75/625bece6c3da/06427111681-a2/06427111681-a2.jpg?ts=1794499273012&w=850",
                      "https://static.zara.net/assets/public/58cf/6764/fb844a739fca/4e3e5b7df447/06427111681-e1/06427111681-e1.jpg?ts=1794226336035&w=850",
                      "https://static.zara.net/assets/public/190b/5fde/39b245dea628/928ccfb57a18/06427111681-e2/06427111681-e2.jpg?ts=1794226337208&w=850",
                      "https://static.zara.net/assets/public/e9e2/b8be/e05a45f48c5f/989c71c5513f/06427111681-e3/06427111681-e3.jpg?ts=1794226337525&w=850"
                  ]
              },
              {
                  "name": "Grey",
                  "hex": "#a1a2a5",
                  "reference": "6427/111",
                  "images": [
                      "https://static.zara.net/assets/public/186e/6e0f/130243248e47/fc67376aa8b2/06427111802-p/06427111802-p.jpg?ts=1794330789384&w=850",
                      "https://static.zara.net/assets/public/f29a/ef8c/e7dc42419990/906ec4ddaf48/06427111802-a1/06427111802-a1.jpg?ts=1794330786650&w=850",
                      "https://static.zara.net/assets/public/2032/79ce/38174f28b01c/7a117f5cd963/06427111802-a2/06427111802-a2.jpg?ts=1794330788687&w=850",
                      "https://static.zara.net/assets/public/89c7/5e3e/b42241f7a64f/0c5df68ab4f2/06427111802-a3/06427111802-a3.jpg?ts=1794330790610&w=850",
                      "https://static.zara.net/assets/public/8d22/4198/37684e09845c/2de08aa8dd0c/06427111802-a4/06427111802-a4.jpg?ts=1794330788637&w=850",
                      "https://static.zara.net/assets/public/8eee/a039/34824b1aaace/6936901ac321/06427111802-a5/06427111802-a5.jpg?ts=1794488690880&w=850",
                      "https://static.zara.net/assets/public/5980/9bbd/6bbf4546a653/0c30afbadb21/06427111802-a6/06427111802-a6.jpg?ts=1794488690025&w=850",
                      "https://static.zara.net/assets/public/00d5/ff80/34464b2fabdf/2f1a63b97dc5/06427111802-a7/06427111802-a7.jpg?ts=1794488690303&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L"
          ],
          "colors": [
              "Burgundy",
              "Grey"
          ],
          "description": "Model height: 177 cm\n\nJumper with high neck and long sleeve.",
          "materialCare": [
              "OUTER SHELL: 68% acrylic, 19% polyester, 13% alpaca"
          ]
      },
      {
          "id": "zara-m15",
          "slug": "flocked-baggy-fit-jeans-zara-m15",
          "name": "FLOCKED PINSTRIPE BAGGY FIT JEANS",
          "category": "Jeans",
          "gender": "MEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4575/350",
          "image": "https://static.zara.net/assets/public/9592/cb61/7390452bb425/3b987d3ad236/04575350104-p/04575350104-p.jpg?ts=1794243282274&w=850",
          "images": [
              "https://static.zara.net/assets/public/9592/cb61/7390452bb425/3b987d3ad236/04575350104-p/04575350104-p.jpg?ts=1794243282274&w=850",
              "https://static.zara.net/assets/public/4c3e/ff92/4a58425fb787/367b9900e208/04575350104-a1/04575350104-a1.jpg?ts=1794243280892&w=850",
              "https://static.zara.net/assets/public/b298/f2cc/905e4b63861a/e30018eafd82/04575350104-a2/04575350104-a2.jpg?ts=1794243280141&w=850",
              "https://static.zara.net/assets/public/e526/8d6f/bc694f3f8080/c0a96d958fc4/04575350104-a3/04575350104-a3.jpg?ts=1794243280295&w=850",
              "https://static.zara.net/assets/public/7c12/ee7a/26414404955f/2fc858a887e3/04575350104-a4/04575350104-a4.jpg?ts=1794243279663&w=850",
              "https://static.zara.net/assets/public/7eab/0c1d/396c4f8d92a1/980ee69329c8/04575350104-e1/04575350104-e1.jpg?ts=1792738808040&w=850",
              "https://static.zara.net/assets/public/e477/715b/1a534e698f4c/24a8aac19720/04575350104-e2/04575350104-e2.jpg?ts=1792738808647&w=850",
              "https://static.zara.net/assets/public/f21b/75dd/ad3e4dd3bbfe/c639952ffe10/04575350104-e3/04575350104-e3.jpg?ts=1792738808216&w=850"
          ],
          "colorVariants": [
              {
                  "name": "striped",
                  "hex": "#0A0A0A",
                  "reference": "4575/350",
                  "images": [
                      "https://static.zara.net/assets/public/9592/cb61/7390452bb425/3b987d3ad236/04575350104-p/04575350104-p.jpg?ts=1794243282274&w=850",
                      "https://static.zara.net/assets/public/4c3e/ff92/4a58425fb787/367b9900e208/04575350104-a1/04575350104-a1.jpg?ts=1794243280892&w=850",
                      "https://static.zara.net/assets/public/b298/f2cc/905e4b63861a/e30018eafd82/04575350104-a2/04575350104-a2.jpg?ts=1794243280141&w=850",
                      "https://static.zara.net/assets/public/e526/8d6f/bc694f3f8080/c0a96d958fc4/04575350104-a3/04575350104-a3.jpg?ts=1794243280295&w=850",
                      "https://static.zara.net/assets/public/7c12/ee7a/26414404955f/2fc858a887e3/04575350104-a4/04575350104-a4.jpg?ts=1794243279663&w=850",
                      "https://static.zara.net/assets/public/7eab/0c1d/396c4f8d92a1/980ee69329c8/04575350104-e1/04575350104-e1.jpg?ts=1792738808040&w=850",
                      "https://static.zara.net/assets/public/e477/715b/1a534e698f4c/24a8aac19720/04575350104-e2/04575350104-e2.jpg?ts=1792738808647&w=850",
                      "https://static.zara.net/assets/public/f21b/75dd/ad3e4dd3bbfe/c639952ffe10/04575350104-e3/04575350104-e3.jpg?ts=1792738808216&w=850"
                  ]
              },
              {
                  "name": "Navy blue",
                  "hex": "#191821",
                  "reference": "4575/350",
                  "images": [
                      "https://static.zara.net/assets/public/1820/f13f/c561477dad59/5a4db02dc83d/04575352401-p/04575352401-p.jpg?ts=1794243279759&w=850",
                      "https://static.zara.net/assets/public/5223/3ec1/10a841f89636/8918ff549390/04575352401-a1/04575352401-a1.jpg?ts=1794243279489&w=850",
                      "https://static.zara.net/assets/public/b9f6/187a/99a8425ba0e6/767498f40371/04575352401-a2/04575352401-a2.jpg?ts=1794243278992&w=850",
                      "https://static.zara.net/assets/public/bbeb/f72e/f1b84caa9c1e/0ae06fbc49f6/04575352401-a3/04575352401-a3.jpg?ts=1794243280228&w=850",
                      "https://static.zara.net/assets/public/4e65/efae/05e049ab8140/e9f1bf4549f6/04575352401-a4/04575352401-a4.jpg?ts=1794243280080&w=850",
                      "https://static.zara.net/assets/public/a04b/00e9/22a04c8c98a0/d9f25892da90/04575352401-e1/04575352401-e1.jpg?ts=1792589954896&w=850",
                      "https://static.zara.net/assets/public/f492/4236/fc1b43ec8d9a/9696e50b45e2/04575352401-e2/04575352401-e2.jpg?ts=1792589955304&w=850",
                      "https://static.zara.net/assets/public/854d/33cf/0f1c4d26bd6f/f909512fbe03/04575352401-e3/04575352401-e3.jpg?ts=1792589955983&w=850"
                  ]
              },
              {
                  "name": "Brown",
                  "hex": "#150608",
                  "reference": "4575/350",
                  "images": [
                      "https://static.zara.net/assets/public/8582/9f1e/c9554c32876e/92c9ab427552/04575351700-p/04575351700-p.jpg?ts=1794243280123&w=850",
                      "https://static.zara.net/assets/public/c776/2af7/c212465c8c86/bd0fc3dc6610/04575351700-a1/04575351700-a1.jpg?ts=1794243281478&w=850",
                      "https://static.zara.net/assets/public/01fe/62e0/0f804a19b67d/f1d5a4eae8a6/04575351700-a2/04575351700-a2.jpg?ts=1794243280536&w=850",
                      "https://static.zara.net/assets/public/3c80/57c6/82c846ad98d6/9ab0f2d943a7/04575351700-a3/04575351700-a3.jpg?ts=1794243281839&w=850",
                      "https://static.zara.net/assets/public/fe72/bcd6/00ef446ba0a2/29c60da56045/04575351700-a4/04575351700-a4.jpg?ts=1794243282329&w=850",
                      "https://static.zara.net/assets/public/9af7/1a2a/ee034a1faaec/e5fa0292e173/04575351700-e1/04575351700-e1.jpg?ts=1792673933251&w=850",
                      "https://static.zara.net/assets/public/0633/10a2/9c18454ea26b/e07269c4c912/04575351700-e2/04575351700-e2.jpg?ts=1792673933196&w=850",
                      "https://static.zara.net/assets/public/4bc7/8cbe/24804522a5eb/2f9125507755/04575351700-e3/04575351700-e3.jpg?ts=1792673933747&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "4575/350",
                  "images": [
                      "https://static.zara.net/assets/public/4852/c539/978b403e918d/863b94add542/04575350800-p/04575350800-p.jpg?ts=1794323291710&w=850",
                      "https://static.zara.net/assets/public/b64b/8608/beb44ef98b6a/104c0b9aee5d/04575350800-a1/04575350800-a1.jpg?ts=1794323292480&w=850",
                      "https://static.zara.net/assets/public/c015/de19/c20241918f92/a49e475d910d/04575350800-a2/04575350800-a2.jpg?ts=1794323291750&w=850",
                      "https://static.zara.net/assets/public/01f4/fc57/66ee47d3b656/69513857d1cc/04575350800-a3/04575350800-a3.jpg?ts=1794323291662&w=850",
                      "https://static.zara.net/assets/public/1162/047e/aab947aeae43/8dcc54a19f04/04575350800-a4/04575350800-a4.jpg?ts=1794323290340&w=850",
                      "https://static.zara.net/assets/public/88c8/3068/1258496ba5a8/1559b9ff7b8a/04575350800-e1/04575350800-e1.jpg?ts=1792589963909&w=850",
                      "https://static.zara.net/assets/public/ffd2/67b1/25e94e1f828d/0659104094cc/04575350800-e2/04575350800-e2.jpg?ts=1792589961986&w=850",
                      "https://static.zara.net/assets/public/e92d/2c02/ab0b422686d8/e29f3e4f19a5/04575350800-e3/04575350800-e3.jpg?ts=1792589961149&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "36",
              "38",
              "40",
              "42",
              "44"
          ],
          "colors": [
              "striped",
              "Navy blue",
              "Brown",
              "Black"
          ],
          "description": "Loose, wide fit through the leg. Mid-waist. Rigid fabric.\n\nBaggy fit jeans made from a cotton-blend denim with a flocked velvet-effect finish. Five pockets. Front zip and button fastening.",
          "materialCare": [
              "OUTER SHELL: 95% cotton, 5% viscose"
          ]
      },
      {
          "id": "zara-w16",
          "slug": "wool-blend-animal-jacquard-jumper-zara-w16",
          "name": "WOOL JACQUARD ANIMAL JUMPER",
          "category": "Knitwear",
          "gender": "WOMEN",
          "price": 219.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4938/111",
          "image": "https://static.zara.net/assets/public/e5fc/05ec/cc4a4624bc36/30f8bb056240/04938111051-p/04938111051-p.jpg?ts=1794330769202&w=850",
          "images": [
              "https://static.zara.net/assets/public/e5fc/05ec/cc4a4624bc36/30f8bb056240/04938111051-p/04938111051-p.jpg?ts=1794330769202&w=850",
              "https://static.zara.net/assets/public/f4dd/059a/a98c4205811e/b57860d5fe63/04938111051-a1/04938111051-a1.jpg?ts=1794330768589&w=850",
              "https://static.zara.net/assets/public/0576/67d9/e09045c2881b/2c2f8053bc5a/04938111051-a2/04938111051-a2.jpg?ts=1794330768821&w=850",
              "https://static.zara.net/assets/public/b836/4e7c/948049629adf/4a7b85da52df/04938111051-a3/04938111051-a3.jpg?ts=1794330769628&w=850",
              "https://static.zara.net/assets/public/4b04/0d5a/522648caad82/e88fc7ea0193/04938111051-a4/04938111051-a4.jpg?ts=1794330769545&w=850",
              "https://static.zara.net/assets/public/2f94/8c91/c6c84762adc9/24279636e83a/04938111051-e1/04938111051-e1.jpg?ts=1794477684568&w=850",
              "https://static.zara.net/assets/public/2c6c/ff5b/8f9a467e934b/a2879f60274d/04938111051-e2/04938111051-e2.jpg?ts=1794477682898&w=850",
              "https://static.zara.net/assets/public/7ac1/f80f/4fe5484185c1/d69c21afeb39/04938111051-e3/04938111051-e3.jpg?ts=1794477684694&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Leopard",
                  "hex": "#7b5d3f",
                  "reference": "4938/111",
                  "images": [
                      "https://static.zara.net/assets/public/e5fc/05ec/cc4a4624bc36/30f8bb056240/04938111051-p/04938111051-p.jpg?ts=1794330769202&w=850",
                      "https://static.zara.net/assets/public/f4dd/059a/a98c4205811e/b57860d5fe63/04938111051-a1/04938111051-a1.jpg?ts=1794330768589&w=850",
                      "https://static.zara.net/assets/public/0576/67d9/e09045c2881b/2c2f8053bc5a/04938111051-a2/04938111051-a2.jpg?ts=1794330768821&w=850",
                      "https://static.zara.net/assets/public/b836/4e7c/948049629adf/4a7b85da52df/04938111051-a3/04938111051-a3.jpg?ts=1794330769628&w=850",
                      "https://static.zara.net/assets/public/4b04/0d5a/522648caad82/e88fc7ea0193/04938111051-a4/04938111051-a4.jpg?ts=1794330769545&w=850",
                      "https://static.zara.net/assets/public/2f94/8c91/c6c84762adc9/24279636e83a/04938111051-e1/04938111051-e1.jpg?ts=1794477684568&w=850",
                      "https://static.zara.net/assets/public/2c6c/ff5b/8f9a467e934b/a2879f60274d/04938111051-e2/04938111051-e2.jpg?ts=1794477682898&w=850",
                      "https://static.zara.net/assets/public/7ac1/f80f/4fe5484185c1/d69c21afeb39/04938111051-e3/04938111051-e3.jpg?ts=1794477684694&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L"
          ],
          "colors": [
              "Leopard"
          ],
          "description": "Jumper made with wool. High neck and long sleeve. Features an animal jacquard fabric detail and a brushed effect.",
          "materialCare": [
              "OUTER SHELL: 49% polyester, 27% wool, 18% polyamide, 5% alpaca, 1% elastane"
          ]
      },
      {
          "id": "zara-m16",
          "slug": "comfort-slim-fit-trousers-zara-m16",
          "name": "COMFORT SLIM FIT TROUSERS",
          "category": "Trousers",
          "gender": "MEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "6861/331",
          "image": "https://static.zara.net/assets/public/0ba7/30b9/633943cd9d63/1e30cceee851/06861331401-p/06861331401-p.jpg?ts=1794415580248&w=850",
          "images": [
              "https://static.zara.net/assets/public/0ba7/30b9/633943cd9d63/1e30cceee851/06861331401-p/06861331401-p.jpg?ts=1794415580248&w=850",
              "https://static.zara.net/assets/public/3e31/6978/e7cd409dab91/9c57cf54c435/06861331401-a1/06861331401-a1.jpg?ts=1794415578043&w=850",
              "https://static.zara.net/assets/public/bb29/b8b5/441f4e438aa7/1265290e610d/06861331401-a2/06861331401-a2.jpg?ts=1794415579982&w=850",
              "https://static.zara.net/assets/public/f6f0/b6da/eda34a9bb618/7998a1b939d7/06861331401-a3/06861331401-a3.jpg?ts=1794415577644&w=850",
              "https://static.zara.net/assets/public/da97/cc35/32e04f61b27f/a268bd7e6ebb/06861331401-a4/06861331401-a4.jpg?ts=1794415577966&w=850",
              "https://static.zara.net/assets/public/7f3d/cce8/a05b4dd8bbe0/3cb9d4e7306a/06861331401-a5/06861331401-a5.jpg?ts=1794415579869&w=850",
              "https://static.zara.net/assets/public/32a9/fb13/248244bb9696/fceb9bbedf71/06861331401-e1/06861331401-e1.jpg?ts=1783943558356&w=850",
              "https://static.zara.net/assets/public/ff93/92bb/3ecc4d3f9848/e1f3ce541a44/06861331401-e2/06861331401-e2.jpg?ts=1783943558847&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Navy blue",
                  "hex": "#191821",
                  "reference": "6861/331",
                  "images": [
                      "https://static.zara.net/assets/public/0ba7/30b9/633943cd9d63/1e30cceee851/06861331401-p/06861331401-p.jpg?ts=1794415580248&w=850",
                      "https://static.zara.net/assets/public/3e31/6978/e7cd409dab91/9c57cf54c435/06861331401-a1/06861331401-a1.jpg?ts=1794415578043&w=850",
                      "https://static.zara.net/assets/public/bb29/b8b5/441f4e438aa7/1265290e610d/06861331401-a2/06861331401-a2.jpg?ts=1794415579982&w=850",
                      "https://static.zara.net/assets/public/f6f0/b6da/eda34a9bb618/7998a1b939d7/06861331401-a3/06861331401-a3.jpg?ts=1794415577644&w=850",
                      "https://static.zara.net/assets/public/da97/cc35/32e04f61b27f/a268bd7e6ebb/06861331401-a4/06861331401-a4.jpg?ts=1794415577966&w=850",
                      "https://static.zara.net/assets/public/7f3d/cce8/a05b4dd8bbe0/3cb9d4e7306a/06861331401-a5/06861331401-a5.jpg?ts=1794415579869&w=850",
                      "https://static.zara.net/assets/public/32a9/fb13/248244bb9696/fceb9bbedf71/06861331401-e1/06861331401-e1.jpg?ts=1783943558356&w=850",
                      "https://static.zara.net/assets/public/ff93/92bb/3ecc4d3f9848/e1f3ce541a44/06861331401-e2/06861331401-e2.jpg?ts=1783943558847&w=850"
                  ]
              },
              {
                  "name": "Brown / Taupe",
                  "hex": "#72665C",
                  "reference": "6861/331",
                  "images": [
                      "https://static.zara.net/assets/public/b971/76ae/ea884b458fae/2321d43c925d/06861331737-p/06861331737-p.jpg?ts=1794404504783&w=850",
                      "https://static.zara.net/assets/public/ea7e/cf23/cd8d49ef8fab/42e7110079ba/06861331737-a1/06861331737-a1.jpg?ts=1794404506780&w=850",
                      "https://static.zara.net/assets/public/10c9/cc6f/9cf44a7bb311/e74543d664c1/06861331737-a2/06861331737-a2.jpg?ts=1794404502776&w=850",
                      "https://static.zara.net/assets/public/2267/2b41/442c441e91e2/bd5ce3fe9999/06861331737-a3/06861331737-a3.jpg?ts=1794404505494&w=850",
                      "https://static.zara.net/assets/public/14ba/467b/472b44f7b60f/90af2ddb4d05/06861331737-a4/06861331737-a4.jpg?ts=1794404506521&w=850",
                      "https://static.zara.net/assets/public/2321/1fe6/19a146e2931a/d249fb73b0d8/06861331737-a5/06861331737-a5.jpg?ts=1794404503052&w=850",
                      "https://static.zara.net/assets/public/6ef8/f55f/0ab14110b79f/dd90bfbc865e/06861331737-e1/06861331737-e1.jpg?ts=1783943559400&w=850",
                      "https://static.zara.net/assets/public/e556/2c27/35644c85b477/e4cb0a094661/06861331737-e2/06861331737-e2.jpg?ts=1783943559456&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#242524",
                  "reference": "6861/331",
                  "images": [
                      "https://static.zara.net/assets/public/8a27/c7d5/c5384c1891cc/80c790f233da/06861331800-p/06861331800-p.jpg?ts=1794404504976&w=850",
                      "https://static.zara.net/assets/public/9817/16be/15d1474d86bb/23e66de878a0/06861331800-a1/06861331800-a1.jpg?ts=1794404504740&w=850",
                      "https://static.zara.net/assets/public/87b6/7ded/6eb047d09d53/0b568a0dffb1/06861331800-a2/06861331800-a2.jpg?ts=1794404507081&w=850",
                      "https://static.zara.net/assets/public/0b98/c14e/f26c49e7aa15/dea5def788ed/06861331800-a3/06861331800-a3.jpg?ts=1794404501998&w=850",
                      "https://static.zara.net/assets/public/85fa/20e6/e6a8442697ce/4d939805bbd5/06861331800-a4/06861331800-a4.jpg?ts=1794404506491&w=850",
                      "https://static.zara.net/assets/public/a52c/2da6/51824911bd44/797b456912f1/06861331800-e1/06861331800-e1.jpg?ts=1783943560636&w=850",
                      "https://static.zara.net/assets/public/48d9/e50b/ea2a4283b1ef/d2af92a190e9/06861331800-e2/06861331800-e2.jpg?ts=1783943560081&w=850",
                      "https://static.zara.net/assets/public/204f/630b/d5364b0a8cfc/692e7b44ea30/06861331800-e3/06861331800-e3.jpg?ts=1783943560064&w=850"
                  ]
              },
              {
                  "name": "Anthracite Grey",
                  "hex": "#403E3D",
                  "reference": "6861/331",
                  "images": [
                      "https://static.zara.net/assets/public/12a5/c4d5/cd394e3b9fa2/bce444446194/06861331801-p/06861331801-p.jpg?ts=1788795852372&w=850",
                      "https://static.zara.net/assets/public/13c2/0ea1/05d345929f72/032de0c15d39/06861331801-a1/06861331801-a1.jpg?ts=1788795850288&w=850",
                      "https://static.zara.net/assets/public/7969/23c0/2c384c9ea031/bf675ae1df77/06861331801-a2/06861331801-a2.jpg?ts=1788795851738&w=850",
                      "https://static.zara.net/assets/public/f264/8946/b2ec497fbfd0/40bbb8410311/06861331801-a3/06861331801-a3.jpg?ts=1788795853330&w=850",
                      "https://static.zara.net/assets/public/8f9a/9a51/8eac49dbb77e/098f665ff5bc/06861331801-e1/06861331801-e1.jpg?ts=1788767811291&w=850",
                      "https://static.zara.net/assets/public/6394/eec7/65004c399926/f4e4f21cde7b/06861331801-e2/06861331801-e2.jpg?ts=1788767811907&w=850",
                      "https://static.zara.net/assets/public/d080/774e/ed824b689a92/68fb9c3ddb05/06861331801-e3/06861331801-e3.jpg?ts=1788767811553&w=850",
                      "https://static.zara.net/assets/public/c4aa/7b62/b515429da11e/ec75b7244922/06861331801-e4/06861331801-e4.jpg?ts=1788767811762&w=850"
                  ]
              },
              {
                  "name": "Grey",
                  "hex": "#585A59",
                  "reference": "6861/331",
                  "images": [
                      "https://static.zara.net/assets/public/a5d7/adf7/79de40ed8b2a/e9bec3a3a075/06861441802-a4/06861441802-a4.jpg?ts=1794404506316&w=850",
                      "https://static.zara.net/assets/public/b596/c629/283740958ffb/5807597a5c10/06861441802-e1/06861441802-e1.jpg?ts=1783943565446&w=850",
                      "https://static.zara.net/assets/public/a725/ebff/e39b4776a1ae/a96717c17eaa/06861441802-e2/06861441802-e2.jpg?ts=1783943563022&w=850",
                      "https://static.zara.net/assets/public/f154/1fb8/7bf04128aefe/1d1d1b6aa57f/06861441802-e4/06861441802-e4.jpg?ts=1783943563843&w=850"
                  ]
              },
              {
                  "name": "Stone",
                  "hex": "#CEC3B2",
                  "reference": "6861/331",
                  "images": [
                      "https://static.zara.net/assets/public/34e3/184c/9b8146139fb2/8c091ff04904/06861331806-p/06861331806-p.jpg?ts=1785853942148&w=850",
                      "https://static.zara.net/assets/public/1633/a658/70094ac2a219/b16a13f3cd8b/06861331806-a1/06861331806-a1.jpg?ts=1785853942659&w=850",
                      "https://static.zara.net/assets/public/5239/6b92/c80a423793fd/678b5f3c601d/06861331806-a2/06861331806-a2.jpg?ts=1785853942750&w=850",
                      "https://static.zara.net/assets/public/90fc/022f/880d4fc495be/6f2814a5d3d0/06861331806-a3/06861331806-a3.jpg?ts=1785853942353&w=850",
                      "https://static.zara.net/assets/public/47d6/dd32/7546493bb44c/f06584ac5f5e/06861331806-a4/06861331806-a4.jpg?ts=1785853942547&w=850",
                      "https://static.zara.net/assets/public/7314/8f8b/2667461c9e8a/57490327db02/06861331806-a5/06861331806-a5.jpg?ts=1785853943121&w=850",
                      "https://static.zara.net/assets/public/c2b1/090b/13454889a90c/ee29a9b745d1/06861331806-a6/06861331806-a6.jpg?ts=1785853941535&w=850",
                      "https://static.zara.net/assets/public/a68c/6dc3/ef0449b7a5d1/c09156a5d95f/06861331806-e1/06861331806-e1.jpg?ts=1783943560233&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Navy blue",
              "Brown / Taupe",
              "Black",
              "Anthracite Grey",
              "Grey",
              "Stone"
          ],
          "description": "Slim fit trousers made from high-stretch fabric. Featuring an elasticated waistband, front pockets, rear welt pockets and a zip fly with press-stud fastening.",
          "materialCare": [
              "OUTER SHELL: 64% polyester, 34% viscose, 2% elastane"
          ]
      },
      {
          "id": "zara-w17",
          "slug": "floral-jacquard-knit-jumper-zara-w17",
          "name": "FLORAL JACQUARD KNIT JUMPER",
          "category": "Knitwear",
          "gender": "WOMEN",
          "price": 219.0,
          "oldPrice": null,
          "discount": null,
          "reference": "3991/104",
          "image": "https://static.zara.net/assets/public/6cca/07ae/57744fac8f51/e16314aafb8f/03991104330-p/03991104330-p.jpg?ts=1794397643656&w=850",
          "images": [
              "https://static.zara.net/assets/public/6cca/07ae/57744fac8f51/e16314aafb8f/03991104330-p/03991104330-p.jpg?ts=1794397643656&w=850",
              "https://static.zara.net/assets/public/5a8e/fb99/2acc48ff9e40/d0d2d12ef2b0/03991104330-a1/03991104330-a1.jpg?ts=1794397644472&w=850",
              "https://static.zara.net/assets/public/f349/58fd/7170492c9af7/14614c76099d/03991104330-a2/03991104330-a2.jpg?ts=1794397642597&w=850",
              "https://static.zara.net/assets/public/b0f6/48f9/29574b388422/1be17f8de9c7/03991104330-a3/03991104330-a3.jpg?ts=1794397643896&w=850",
              "https://static.zara.net/assets/public/f84b/eebc/4f004be8ab41/bde503ee1eaf/03991104330-e1/03991104330-e1.jpg?ts=1794226339670&w=850",
              "https://static.zara.net/assets/public/7e88/3d1b/541c4503b40d/b466b552fc01/03991104330-e2/03991104330-e2.jpg?ts=1794226336038&w=850",
              "https://static.zara.net/assets/public/43d6/9635/1e24462cad06/a7936287ae8e/03991104330-e3/03991104330-e3.jpg?ts=1794226339284&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Multicoloured",
                  "hex": "#d7dbe6",
                  "reference": "3991/104",
                  "images": [
                      "https://static.zara.net/assets/public/6cca/07ae/57744fac8f51/e16314aafb8f/03991104330-p/03991104330-p.jpg?ts=1794397643656&w=850",
                      "https://static.zara.net/assets/public/5a8e/fb99/2acc48ff9e40/d0d2d12ef2b0/03991104330-a1/03991104330-a1.jpg?ts=1794397644472&w=850",
                      "https://static.zara.net/assets/public/f349/58fd/7170492c9af7/14614c76099d/03991104330-a2/03991104330-a2.jpg?ts=1794397642597&w=850",
                      "https://static.zara.net/assets/public/b0f6/48f9/29574b388422/1be17f8de9c7/03991104330-a3/03991104330-a3.jpg?ts=1794397643896&w=850",
                      "https://static.zara.net/assets/public/f84b/eebc/4f004be8ab41/bde503ee1eaf/03991104330-e1/03991104330-e1.jpg?ts=1794226339670&w=850",
                      "https://static.zara.net/assets/public/7e88/3d1b/541c4503b40d/b466b552fc01/03991104330-e2/03991104330-e2.jpg?ts=1794226336038&w=850",
                      "https://static.zara.net/assets/public/43d6/9635/1e24462cad06/a7936287ae8e/03991104330-e3/03991104330-e3.jpg?ts=1794226339284&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Multicoloured"
          ],
          "description": "Jumper with high neck and long sleeve. Floral jacquard detail.",
          "materialCare": [
              "OUTER SHELL: 64% acrylic, 36% polyester"
          ]
      },
      {
          "id": "zara-m17",
          "slug": "inverted-pleat-wide-leg-trousers-zara-m17",
          "name": "INVERTED PLEAT WIDE-LEG TROUSERS",
          "category": "Trousers",
          "gender": "MEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "6861/616",
          "image": "https://static.zara.net/assets/public/556c/cbff/857c42d6809d/599847b76331/06861616422-p/06861616422-p.jpg?ts=1792507284328&w=850",
          "images": [
              "https://static.zara.net/assets/public/556c/cbff/857c42d6809d/599847b76331/06861616422-p/06861616422-p.jpg?ts=1792507284328&w=850",
              "https://static.zara.net/assets/public/532c/c6dd/77284df4951c/43f6f8eca4c2/06861616422-a1/06861616422-a1.jpg?ts=1792507283486&w=850",
              "https://static.zara.net/assets/public/8c88/c397/f3614dcc8e1d/aff5026422a7/06861616422-a2/06861616422-a2.jpg?ts=1792507284574&w=850",
              "https://static.zara.net/assets/public/9261/92f7/f5fc4cd2adda/d2eac221c6c3/06861616422-a3/06861616422-a3.jpg?ts=1792507283854&w=850",
              "https://static.zara.net/assets/public/cdbc/bb3c/79434ab38529/f9984141b82e/06861616422-a4/06861616422-a4.jpg?ts=1792507285014&w=850",
              "https://static.zara.net/assets/public/3159/5ad0/8b47448cbdc7/25de0a06f8f3/06861616422-e1/06861616422-e1.jpg?ts=1792414410443&w=850",
              "https://static.zara.net/assets/public/6bfd/bef2/a57f46e38e13/852401174ed6/06861616422-e2/06861616422-e2.jpg?ts=1792414406028&w=850",
              "https://static.zara.net/assets/public/364d/3e34/2ac144cc833a/9bf14d86d47c/06861616422-e3/06861616422-e3.jpg?ts=1792414401202&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Dark navy",
                  "hex": "#191821",
                  "reference": "6861/616",
                  "images": [
                      "https://static.zara.net/assets/public/556c/cbff/857c42d6809d/599847b76331/06861616422-p/06861616422-p.jpg?ts=1792507284328&w=850",
                      "https://static.zara.net/assets/public/532c/c6dd/77284df4951c/43f6f8eca4c2/06861616422-a1/06861616422-a1.jpg?ts=1792507283486&w=850",
                      "https://static.zara.net/assets/public/8c88/c397/f3614dcc8e1d/aff5026422a7/06861616422-a2/06861616422-a2.jpg?ts=1792507284574&w=850",
                      "https://static.zara.net/assets/public/9261/92f7/f5fc4cd2adda/d2eac221c6c3/06861616422-a3/06861616422-a3.jpg?ts=1792507283854&w=850",
                      "https://static.zara.net/assets/public/cdbc/bb3c/79434ab38529/f9984141b82e/06861616422-a4/06861616422-a4.jpg?ts=1792507285014&w=850",
                      "https://static.zara.net/assets/public/3159/5ad0/8b47448cbdc7/25de0a06f8f3/06861616422-e1/06861616422-e1.jpg?ts=1792414410443&w=850",
                      "https://static.zara.net/assets/public/6bfd/bef2/a57f46e38e13/852401174ed6/06861616422-e2/06861616422-e2.jpg?ts=1792414406028&w=850",
                      "https://static.zara.net/assets/public/364d/3e34/2ac144cc833a/9bf14d86d47c/06861616422-e3/06861616422-e3.jpg?ts=1792414401202&w=850"
                  ]
              },
              {
                  "name": "Burgundy",
                  "hex": "#302121",
                  "reference": "6861/616",
                  "images": [
                      "https://static.zara.net/assets/public/3a91/3669/97c5468ba1af/1471eaf7de76/06861616681-p/06861616681-p.jpg?ts=1789031089818&w=850",
                      "https://static.zara.net/assets/public/6ee2/2031/68a24c50b4f4/1d08619c96da/06861616681-a1/06861616681-a1.jpg?ts=1789031089632&w=850",
                      "https://static.zara.net/assets/public/6198/70d8/e4134cca8d56/facd39e63aac/06861616681-a2/06861616681-a2.jpg?ts=1789031091433&w=850",
                      "https://static.zara.net/assets/public/490d/6ab4/af19494f8d39/e58f1af97948/06861616681-a3/06861616681-a3.jpg?ts=1789031089735&w=850",
                      "https://static.zara.net/assets/public/ec9a/5dd3/705a43d0802a/117cebf3e78d/06861616681-a4/06861616681-a4.jpg?ts=1789031090884&w=850",
                      "https://static.zara.net/assets/public/27fa/7ed4/6f8849458d2b/ef0a80f8acd5/06861616681-a5/06861616681-a5.jpg?ts=1789031091327&w=850",
                      "https://static.zara.net/assets/public/df52/7b19/02774d00896b/9dd476ed619a/06861616681-e1/06861616681-e1.jpg?ts=1787216432246&w=850",
                      "https://static.zara.net/assets/public/d861/4dfa/77c1483a823f/b8b1e210df2e/06861616681-e2/06861616681-e2.jpg?ts=1787216431812&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#242524",
                  "reference": "6861/616",
                  "images": [
                      "https://static.zara.net/assets/public/ea58/6613/6b06452ea1a6/712e5e9f31df/06861616800-p/06861616800-p.jpg?ts=1788942268163&w=850",
                      "https://static.zara.net/assets/public/da2b/2a86/a8134c45b4f5/042c3f337c2c/06861616800-a1/06861616800-a1.jpg?ts=1788942283294&w=850",
                      "https://static.zara.net/assets/public/2cda/7af9/e757411ebce6/53494b3b1366/06861616800-a2/06861616800-a2.jpg?ts=1788942283911&w=850",
                      "https://static.zara.net/assets/public/3a9a/15e2/d4ee470c88ac/0d44a6f7a797/06861616800-a3/06861616800-a3.jpg?ts=1788942266826&w=850",
                      "https://static.zara.net/assets/public/12e0/26e8/4f574ddaa44c/98b75689c630/06861616800-a4/06861616800-a4.jpg?ts=1788942269319&w=850",
                      "https://static.zara.net/assets/public/11d1/8554/33f4439eae7a/e05aef8847f1/06861616800-a5/06861616800-a5.jpg?ts=1788942269381&w=850",
                      "https://static.zara.net/assets/public/d64d/87ef/5ac0413f857d/93afdb4fc60a/06861616800-e1/06861616800-e1.jpg?ts=1787216430076&w=850",
                      "https://static.zara.net/assets/public/e7d3/53d4/623e4ec99aaa/e2f981d8eda2/06861616800-e2/06861616800-e2.jpg?ts=1787216430332&w=850"
                  ]
              },
              {
                  "name": "Grey",
                  "hex": "#313131",
                  "reference": "6861/616",
                  "images": [
                      "https://static.zara.net/assets/public/3a73/98b2/acdb46ffa544/ce5fae7e899f/06861616802-p/06861616802-p.jpg?ts=1788942283435&w=850",
                      "https://static.zara.net/assets/public/1009/a152/2f6a4eda8da4/bb9b82ddad23/06861616802-a1/06861616802-a1.jpg?ts=1788942283576&w=850",
                      "https://static.zara.net/assets/public/3926/3ea1/46da4cd0b71a/03970995c99f/06861616802-a2/06861616802-a2.jpg?ts=1788942270741&w=850",
                      "https://static.zara.net/assets/public/df71/eebd/ad264e8b9542/b8ee920498b1/06861616802-a3/06861616802-a3.jpg?ts=1788942269708&w=850",
                      "https://static.zara.net/assets/public/0bff/fd43/bd574db0b66c/1ae99bbae157/06861616802-a4/06861616802-a4.jpg?ts=1788942270867&w=850",
                      "https://static.zara.net/assets/public/e819/ae7b/9d334fc89e4f/e55e98b77dc7/06861616802-a5/06861616802-a5.jpg?ts=1788942271548&w=850",
                      "https://static.zara.net/assets/public/1a5c/d09e/00d34df48485/96b65e65e227/06861616802-e1/06861616802-e1.jpg?ts=1787216431500&w=850",
                      "https://static.zara.net/assets/public/8baf/b2fb/23764d48a9b6/ce3184a07ff3/06861616802-e2/06861616802-e2.jpg?ts=1787216432507&w=850"
                  ]
              },
              {
                  "name": "Grey / Beige",
                  "hex": "#9e9d9a",
                  "reference": "6861/616",
                  "images": [
                      "https://static.zara.net/assets/public/f596/b93c/cef2400e9b6e/5ccb0f41f6e6/06861615814-p/06861615814-p.jpg?ts=1794240031076&w=850",
                      "https://static.zara.net/assets/public/434d/8fc4/9015438b9aa6/f4593874790e/06861615814-a1/06861615814-a1.jpg?ts=1794240032885&w=850",
                      "https://static.zara.net/assets/public/7609/b131/7ee8458aa7f7/faefd67a1a6b/06861615814-a2/06861615814-a2.jpg?ts=1794240032181&w=850",
                      "https://static.zara.net/assets/public/1da3/c34a/d000472c91d1/7bf8ab8e6466/06861615814-a3/06861615814-a3.jpg?ts=1794240033137&w=850",
                      "https://static.zara.net/assets/public/c390/9399/9af94df98ef3/445400f90a21/06861615814-a4/06861615814-a4.jpg?ts=1794240032932&w=850",
                      "https://static.zara.net/assets/public/6611/3136/6c2b462f9632/c4c45af15a3b/06861615814-a5/06861615814-a5.jpg?ts=1794240032104&w=850",
                      "https://static.zara.net/assets/public/41f3/b26b/14fb4304b495/240cf8aaa438/06861615814-e1/06861615814-e1.jpg?ts=1794219924072&w=850",
                      "https://static.zara.net/assets/public/f5b2/025b/fba64b28b068/63d6b878fab4/06861615814-e2/06861615814-e2.jpg?ts=1794219930173&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "36",
              "38",
              "40",
              "42",
              "44"
          ],
          "colors": [
              "Dark navy",
              "Burgundy",
              "Black",
              "Grey",
              "Grey / Beige"
          ],
          "description": "Wide-leg trousers made from fabric with viscose. Waist with front pleat detail. Front pockets and rear welt pocket detail. Zip fly and concealed metal hook fastening.",
          "materialCare": [
              "OUTER SHELL: 64% polyester, 34% viscose, 2% elastane"
          ]
      },
      {
          "id": "zara-w18",
          "slug": "satin-halter-top-zara-w18",
          "name": "ANIMAL PRINT SATIN HALTER TOP",
          "category": "Tops",
          "gender": "WOMEN",
          "price": 119.0,
          "oldPrice": null,
          "discount": null,
          "reference": "7092/625",
          "image": "https://static.zara.net/assets/public/2b51/6c3a/280d478a9ad5/fd156a41d37a/02157227051-p/02157227051-p.jpg?ts=1781189506358&w=850",
          "images": [
              "https://static.zara.net/assets/public/2b51/6c3a/280d478a9ad5/fd156a41d37a/02157227051-p/02157227051-p.jpg?ts=1781189506358&w=850",
              "https://static.zara.net/assets/public/4439/e706/ed7c4a54ac93/8fa841850f03/02157227051-a1/02157227051-a1.jpg?ts=1781189506531&w=850",
              "https://static.zara.net/assets/public/009b/fbc4/67304455b8c9/314868d64f37/02157227051-a2/02157227051-a2.jpg?ts=1781189506216&w=850",
              "https://static.zara.net/assets/public/899a/1387/fe51427c9de6/acfeca8bff4a/02157227051-a3/02157227051-a3.jpg?ts=1781189506160&w=850",
              "https://static.zara.net/assets/public/9468/2067/e0b74ab2af03/2aa45744b257/02157227051-a4/02157227051-a4.jpg?ts=1781189506453&w=850",
              "https://static.zara.net/assets/public/dcd7/198c/d56e4ec69887/265f29549f78/02157227051-a5/02157227051-a5.jpg?ts=1781189506221&w=850",
              "https://static.zara.net/assets/public/15b1/9a8c/aed14465aff3/f23d212ced70/02157227051-e1/02157227051-e1.jpg?ts=1781099038872&w=850",
              "https://static.zara.net/assets/public/9640/00b2/a57b43bea246/9442a56a77c3/02157227051-e2/02157227051-e2.jpg?ts=1781099038933&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Leopard",
                  "hex": "#D2AD96",
                  "reference": "7092/625",
                  "images": [
                      "https://static.zara.net/assets/public/2b51/6c3a/280d478a9ad5/fd156a41d37a/02157227051-p/02157227051-p.jpg?ts=1781189506358&w=850",
                      "https://static.zara.net/assets/public/4439/e706/ed7c4a54ac93/8fa841850f03/02157227051-a1/02157227051-a1.jpg?ts=1781189506531&w=850",
                      "https://static.zara.net/assets/public/009b/fbc4/67304455b8c9/314868d64f37/02157227051-a2/02157227051-a2.jpg?ts=1781189506216&w=850",
                      "https://static.zara.net/assets/public/899a/1387/fe51427c9de6/acfeca8bff4a/02157227051-a3/02157227051-a3.jpg?ts=1781189506160&w=850",
                      "https://static.zara.net/assets/public/9468/2067/e0b74ab2af03/2aa45744b257/02157227051-a4/02157227051-a4.jpg?ts=1781189506453&w=850",
                      "https://static.zara.net/assets/public/dcd7/198c/d56e4ec69887/265f29549f78/02157227051-a5/02157227051-a5.jpg?ts=1781189506221&w=850",
                      "https://static.zara.net/assets/public/15b1/9a8c/aed14465aff3/f23d212ced70/02157227051-e1/02157227051-e1.jpg?ts=1781099038872&w=850",
                      "https://static.zara.net/assets/public/9640/00b2/a57b43bea246/9442a56a77c3/02157227051-e2/02157227051-e2.jpg?ts=1781099038933&w=850"
                  ]
              },
              {
                  "name": "Black / White",
                  "hex": "#E6E6DF",
                  "reference": "7092/625",
                  "images": [
                      "https://static.zara.net/assets/public/593e/858d/c10e4d8599e8/7a8cf6b482da/02157227064-p/02157227064-p.jpg?ts=1784209887637&w=850",
                      "https://static.zara.net/assets/public/20d9/534d/1ab84ca89241/166f7d4dab4c/02157227064-a1/02157227064-a1.jpg?ts=1784209887073&w=850",
                      "https://static.zara.net/assets/public/460d/f622/a09243f594a2/c89039939df0/02157227064-a2/02157227064-a2.jpg?ts=1784209887319&w=850",
                      "https://static.zara.net/assets/public/fbee/5e63/3deb4adfb45c/2f8a7462e69c/02157227064-a3/02157227064-a3.jpg?ts=1784209886718&w=850",
                      "https://static.zara.net/assets/public/f806/f9eb/bca444d2bc15/f1851408bbaf/02157227064-a4/02157227064-a4.jpg?ts=1784209887514&w=850",
                      "https://static.zara.net/assets/public/c8cc/1f5c/005645ff93ca/6a495ce2c507/02157227064-e1/02157227064-e1.jpg?ts=1781793161578&w=850",
                      "https://static.zara.net/assets/public/0bbc/9d50/b3b6410a9186/795d76ee940e/02157227064-e2/02157227064-e2.jpg?ts=1781793162180&w=850",
                      "https://static.zara.net/assets/public/9e1e/1d38/3d714b9ca265/aef3a40acd9f/02157227064-e3/02157227064-e3.jpg?ts=1781793162379&w=850"
                  ]
              },
              {
                  "name": "Black / White",
                  "hex": "#242524",
                  "reference": "7092/625",
                  "images": [
                      "https://static.zara.net/assets/public/96d4/bf30/f7c944389e16/6a3072db6c0a/08741263084-p/08741263084-p.jpg?ts=1784040116575&w=850",
                      "https://static.zara.net/assets/public/cd63/35ef/3f034c2d91a9/d4b8f36726b2/08741263084-a1/08741263084-a1.jpg?ts=1784040114970&w=850",
                      "https://static.zara.net/assets/public/504e/84df/e2574eea8a0f/1f32e84a79e5/08741263084-a2/08741263084-a2.jpg?ts=1784040115516&w=850",
                      "https://static.zara.net/assets/public/64e1/edf1/ab6e4f27aadc/5fd98aea974a/08741263084-a3/08741263084-a3.jpg?ts=1784040115815&w=850",
                      "https://static.zara.net/assets/public/2caa/45bf/5db6439ea84a/e62317985b30/08741263084-a4/08741263084-a4.jpg?ts=1784040115978&w=850",
                      "https://static.zara.net/assets/public/b183/14af/c74e41e5a2bc/3f9b52d0e265/08741263084-a5/08741263084-a5.jpg?ts=1784040116415&w=850",
                      "https://static.zara.net/assets/public/8d9d/c4df/fbc04fb1a264/9bde1ce39e59/08741263084-e1/08741263084-e1.jpg?ts=1784018994177&w=850",
                      "https://static.zara.net/assets/public/ea26/eeea/c6984e23b8a5/2d931fa103c9/08741263084-e2/08741263084-e2.jpg?ts=1784018994842&w=850"
                  ]
              },
              {
                  "name": "Navy blue",
                  "hex": "#365E78",
                  "reference": "7092/625",
                  "images": [
                      "https://static.zara.net/assets/public/0fb6/9f9d/3eb147719970/7611456ccdb6/08020566401-p/08020566401-p.jpg?ts=1787309840740&w=850",
                      "https://static.zara.net/assets/public/8606/ac9c/9cd349b9aa40/85e892cbdf52/08020566401-a1/08020566401-a1.jpg?ts=1787309842593&w=850",
                      "https://static.zara.net/assets/public/1422/3250/25874f648369/8e21e4cf45a1/08020566401-a2/08020566401-a2.jpg?ts=1787309845055&w=850",
                      "https://static.zara.net/assets/public/3672/0ef9/e9f94d1a85d7/083444732f8f/08020566401-a3/08020566401-a3.jpg?ts=1787309842298&w=850",
                      "https://static.zara.net/assets/public/0387/bfc2/e4b44d318916/0f4bdf920602/08020566401-a4/08020566401-a4.jpg?ts=1787309844946&w=850",
                      "https://static.zara.net/assets/public/6408/d3da/8e4a4196ba6c/b68044014ef7/08020566401-a5/08020566401-a5.jpg?ts=1787309839268&w=850",
                      "https://static.zara.net/assets/public/a3d5/7249/5d434271ad3d/1e54c07fc37f/08020566401-a6/08020566401-a6.jpg?ts=1787309842258&w=850",
                      "https://static.zara.net/assets/public/ecc6/76bc/321e4ed1a7cb/3399cd293cd6/08020566401-e1/08020566401-e1.jpg?ts=1787043987303&w=850"
                  ]
              },
              {
                  "name": "Light khaki",
                  "hex": "#C6B195",
                  "reference": "7092/625",
                  "images": [
                      "https://static.zara.net/assets/public/256b/b3f8/e85748cb92bf/54bd6f0fc9d4/07969057506-p/07969057506-p.jpg?ts=1792075699880&w=850",
                      "https://static.zara.net/assets/public/8ff7/eb26/35db40598be7/2afcba73c1b4/07969057506-a1/07969057506-a1.jpg?ts=1792075700655&w=850",
                      "https://static.zara.net/assets/public/efbf/951f/7d77498da72a/d9b12043dc3e/07969057506-a2/07969057506-a2.jpg?ts=1792075702650&w=850",
                      "https://static.zara.net/assets/public/5e46/848e/44764936b417/92a9dfdee0d3/07969057506-a3/07969057506-a3.jpg?ts=1792075698487&w=850",
                      "https://static.zara.net/assets/public/46a4/73a4/95d24ce78e75/6199f2f1af18/07969057506-a4/07969057506-a4.jpg?ts=1792075699610&w=850",
                      "https://static.zara.net/assets/public/b4a6/91d9/412f48ca8fce/9485b3c2cfc0/02231748506-e1/02231748506-e1.jpg?ts=1773060100117&w=850",
                      "https://static.zara.net/assets/public/0231/b26c/525d4f9491ce/def58fde2171/02231748506-e2/02231748506-e2.jpg?ts=1773060097121&w=850",
                      "https://static.zara.net/assets/public/4f70/cad9/883641f6a528/1233ed0f0e9b/02231748506-e3/02231748506-e3.jpg?ts=1773060097111&w=850"
                  ]
              },
              {
                  "name": "Orange",
                  "hex": "#DD5F1B",
                  "reference": "7092/625",
                  "images": [
                      "https://static.zara.net/assets/public/4274/3f6f/9eb44584b83c/f746de2aa4de/02157069615-p/02157069615-p.jpg?ts=1777566710426&w=850",
                      "https://static.zara.net/assets/public/009a/954b/cb54405c84bc/cbed5d94e5bc/02157069615-a1/02157069615-a1.jpg?ts=1777566704572&w=850",
                      "https://static.zara.net/assets/public/dcbe/8f8d/7e224876932d/b2182cb46605/02157069615-a2/02157069615-a2.jpg?ts=1777566706142&w=850",
                      "https://static.zara.net/assets/public/b76c/a6f3/e69144c48200/662b4559dbdf/02157069615-a3/02157069615-a3.jpg?ts=1777566704968&w=850",
                      "https://static.zara.net/assets/public/3d73/e8b6/50c8474db634/62bba7e2fee9/02157069615-a4/02157069615-a4.jpg?ts=1777566704812&w=850",
                      "https://static.zara.net/assets/public/f9bb/4b10/db644a568c56/cf6d9455e218/02157069615-a5/02157069615-a5.jpg?ts=1777566704568&w=850",
                      "https://static.zara.net/assets/public/d742/ce18/0b054666b844/6475bb0c35ae/02157069615-e1/02157069615-e1.jpg?ts=1777532241689&w=850",
                      "https://static.zara.net/assets/public/a26a/f4e3/c75b46868e38/8f9f747f6925/02157069615-e2/02157069615-e2.jpg?ts=1777532241902&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Leopard",
              "Black / White",
              "Black / White",
              "Navy blue",
              "Light khaki",
              "Orange"
          ],
          "description": "Model height: 180 cm\n\nHalter neck top with an open back. Back fastening with hidden buttons.",
          "materialCare": [
              "OUTER SHELL: 97% polyester, 3% elastane"
          ]
      },
      {
          "id": "zara-m18",
          "slug": "washed-corduroy-carrot-fit-trousers-zara-m18",
          "name": "WASHED CORDUROY CARROT FIT TROUSERS",
          "category": "Trousers",
          "gender": "MEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4302/320",
          "image": "https://static.zara.net/assets/public/a40d/b660/52ef444f95e6/f1192b52e8cd/04575302505-p/04575302505-p.jpg?ts=1789116928847&w=850",
          "images": [
              "https://static.zara.net/assets/public/a40d/b660/52ef444f95e6/f1192b52e8cd/04575302505-p/04575302505-p.jpg?ts=1789116928847&w=850",
              "https://static.zara.net/assets/public/f3d3/6bdb/ec9d4839bdbf/1fef05ef20ef/04575302505-a1/04575302505-a1.jpg?ts=1789116928387&w=850",
              "https://static.zara.net/assets/public/ed81/c51e/52854a74b574/4fcf318db131/04575302505-a2/04575302505-a2.jpg?ts=1789116929064&w=850",
              "https://static.zara.net/assets/public/d0f3/e68f/ad3b46cba2c8/d8f1e5fb231d/04575302505-a3/04575302505-a3.jpg?ts=1789116928667&w=850",
              "https://static.zara.net/assets/public/3013/520f/a91b49bda09d/1b4ac28342b4/04575302505-a4/04575302505-a4.jpg?ts=1789116929101&w=850",
              "https://static.zara.net/assets/public/a0ee/6e37/e09e487eaf71/c3260bca8127/04575302505-a5/04575302505-a5.jpg?ts=1789116929330&w=850",
              "https://static.zara.net/assets/public/3523/da85/a1744479813c/1afe5a5783e0/04575302505-a6/04575302505-a6.jpg?ts=1789116928436&w=850",
              "https://static.zara.net/assets/public/53be/6f79/ff854a978891/346740042cf9/04575302505-e1/04575302505-e1.jpg?ts=1789116928585&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Khaki",
                  "hex": "#413F2F",
                  "reference": "4302/320",
                  "images": [
                      "https://static.zara.net/assets/public/a40d/b660/52ef444f95e6/f1192b52e8cd/04575302505-p/04575302505-p.jpg?ts=1789116928847&w=850",
                      "https://static.zara.net/assets/public/f3d3/6bdb/ec9d4839bdbf/1fef05ef20ef/04575302505-a1/04575302505-a1.jpg?ts=1789116928387&w=850",
                      "https://static.zara.net/assets/public/ed81/c51e/52854a74b574/4fcf318db131/04575302505-a2/04575302505-a2.jpg?ts=1789116929064&w=850",
                      "https://static.zara.net/assets/public/d0f3/e68f/ad3b46cba2c8/d8f1e5fb231d/04575302505-a3/04575302505-a3.jpg?ts=1789116928667&w=850",
                      "https://static.zara.net/assets/public/3013/520f/a91b49bda09d/1b4ac28342b4/04575302505-a4/04575302505-a4.jpg?ts=1789116929101&w=850",
                      "https://static.zara.net/assets/public/a0ee/6e37/e09e487eaf71/c3260bca8127/04575302505-a5/04575302505-a5.jpg?ts=1789116929330&w=850",
                      "https://static.zara.net/assets/public/3523/da85/a1744479813c/1afe5a5783e0/04575302505-a6/04575302505-a6.jpg?ts=1789116928436&w=850",
                      "https://static.zara.net/assets/public/53be/6f79/ff854a978891/346740042cf9/04575302505-e1/04575302505-e1.jpg?ts=1789116928585&w=850"
                  ]
              },
              {
                  "name": "Brown",
                  "hex": "#4E3A2F",
                  "reference": "4302/320",
                  "images": [
                      "https://static.zara.net/assets/public/c92e/1c66/40e644919889/c11ec952b538/04575302700-p/04575302700-p.jpg?ts=1789116853623&w=850",
                      "https://static.zara.net/assets/public/d037/c623/bbc248068a33/08a33c2f7a6d/04575302700-a1/04575302700-a1.jpg?ts=1789116854895&w=850",
                      "https://static.zara.net/assets/public/1824/eae7/a31247e7b6a7/096e7269aa2f/04575302700-a2/04575302700-a2.jpg?ts=1789116854888&w=850",
                      "https://static.zara.net/assets/public/d3b4/8bba/93bb4f5ba7fb/faedd8aa33ca/04575302700-a3/04575302700-a3.jpg?ts=1789116853883&w=850",
                      "https://static.zara.net/assets/public/413c/2e9b/fe0d4e82b12a/63cf82532536/04575302700-a4/04575302700-a4.jpg?ts=1789116853726&w=850",
                      "https://static.zara.net/assets/public/a67a/72dc/2af24a1cbb7f/eb2a09b6ab60/04575302700-e1/04575302700-e1.jpg?ts=1789116854690&w=850",
                      "https://static.zara.net/assets/public/ee16/56a8/a91f49d4a02b/934964fff5b8/04575302700-e2/04575302700-e2.jpg?ts=1789116853610&w=850",
                      "https://static.zara.net/assets/public/5ab3/859e/02b4451ea18f/6c594bb5780b/04575302700-e3/04575302700-e3.jpg?ts=1789116853702&w=850"
                  ]
              },
              {
                  "name": "Ecru",
                  "hex": "#EEDED0",
                  "reference": "4302/320",
                  "images": [
                      "https://static.zara.net/assets/public/958b/88d4/e75a409395b8/be0c07f82939/04302320712-p/04302320712-p.jpg?ts=1794408728091&w=850",
                      "https://static.zara.net/assets/public/4fe5/b110/6785494b8c6a/a95bd6448204/04302320712-a1/04302320712-a1.jpg?ts=1794408728290&w=850",
                      "https://static.zara.net/assets/public/8eef/51c7/0efa44c3b048/618d70c8e68b/04302320712-a2/04302320712-a2.jpg?ts=1794408728987&w=850",
                      "https://static.zara.net/assets/public/94b2/602e/1cf148f8bd3c/8dfad0cbc873/04302320712-a3/04302320712-a3.jpg?ts=1794408728186&w=850",
                      "https://static.zara.net/assets/public/c77f/b9e1/60aa43679236/7be841f06bbd/04302320712-a4/04302320712-a4.jpg?ts=1794408730697&w=850",
                      "https://static.zara.net/assets/public/2b23/fed5/3a2a46e4bddb/763fb80f6fbc/04575302712-e1/04575302712-e1.jpg?ts=1789116741676&w=850",
                      "https://static.zara.net/assets/public/a813/e1ce/4ee745968458/636cacded2a1/04575302712-e2/04575302712-e2.jpg?ts=1789116742073&w=850",
                      "https://static.zara.net/assets/public/8c5f/e653/754e4fe19807/6442bc76d3e3/04575302712-e3/04575302712-e3.jpg?ts=1789116742239&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "4302/320",
                  "images": [
                      "https://static.zara.net/assets/public/f506/ced8/d2f046419345/13376f21de9c/04575302800-p/04575302800-p.jpg?ts=1789117008402&w=850",
                      "https://static.zara.net/assets/public/674a/858d/c5ed43589827/e15816000f2b/04575302800-a1/04575302800-a1.jpg?ts=1789117008250&w=850",
                      "https://static.zara.net/assets/public/3e94/4eb4/79ad4772bfdb/2d2ee51d1b23/04575302800-a2/04575302800-a2.jpg?ts=1789117008338&w=850",
                      "https://static.zara.net/assets/public/1cb1/0e03/34e24033a533/f1effba3933b/04575302800-a3/04575302800-a3.jpg?ts=1789117007916&w=850",
                      "https://static.zara.net/assets/public/6565/0435/14914a07a78f/48e5a96145b7/04575302800-a4/04575302800-a4.jpg?ts=1789117008361&w=850",
                      "https://static.zara.net/assets/public/93e6/8d9d/fa824269bd38/45c4b94be82b/04575302800-e1/04575302800-e1.jpg?ts=1789117007460&w=850",
                      "https://static.zara.net/assets/public/6abc/2058/cc7640c09f8b/6e350441daa3/04575302800-e2/04575302800-e2.jpg?ts=1789117008086&w=850",
                      "https://static.zara.net/assets/public/8e5c/2a94/b3e643508c6d/ccd02ab94466/04575302800-e3/04575302800-e3.jpg?ts=1789117008289&w=850"
                  ]
              },
              {
                  "name": "Grey",
                  "hex": "#72665C",
                  "reference": "4302/320",
                  "images": [
                      "https://static.zara.net/assets/public/a832/38e7/cd8f416a9d4a/dc20c9fd07f3/04575302802-p/04575302802-p.jpg?ts=1789116190332&w=850",
                      "https://static.zara.net/assets/public/ea2c/d8b3/ce5d424797f3/9895fdab5c80/04575302802-a1/04575302802-a1.jpg?ts=1789116190576&w=850",
                      "https://static.zara.net/assets/public/ac1e/d204/95384b558b47/d744d4d6f47b/04575302802-a2/04575302802-a2.jpg?ts=1789116189637&w=850",
                      "https://static.zara.net/assets/public/c974/09d7/202f4844bbb7/6bfa3be52e2b/04575302802-a3/04575302802-a3.jpg?ts=1789116190332&w=850",
                      "https://static.zara.net/assets/public/d27e/81fa/f5a14bee9326/f9b316ca32a4/04575302802-a4/04575302802-a4.jpg?ts=1789116190581&w=850",
                      "https://static.zara.net/assets/public/8040/984e/1c6b48b7b5c0/66fc18fdc8ec/04575302802-e1/04575302802-e1.jpg?ts=1789116190197&w=850",
                      "https://static.zara.net/assets/public/3548/fda0/4c8d4bf4909c/256fd6b6418e/04575302802-e2/04575302802-e2.jpg?ts=1789116190630&w=850",
                      "https://static.zara.net/assets/public/5eef/b282/d99a4a05ba23/b64aba3d2ec3/04575302802-e3/04575302802-e3.jpg?ts=1789116190343&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "36",
              "38",
              "40",
              "42",
              "44",
              "46"
          ],
          "colors": [
              "Khaki",
              "Brown",
              "Ecru",
              "Black",
              "Grey"
          ],
          "description": "Model height: 186 cm\n\nCarrot fit trousers made from cotton corduroy. Front pockets and rear patch pockets. Faded finish. Front zip fly and top button fastening.\n\nThis garment has a unique appearance thanks to its special washing process. As a result, the colour may vary slightly from that shown in the photograph.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-w19",
          "slug": "satin-balloon-crop-top-zara-w19",
          "name": "SATIN BALLOON CROP TOP",
          "category": "Tops",
          "gender": "WOMEN",
          "price": 139.0,
          "oldPrice": null,
          "discount": null,
          "reference": "2646/071",
          "image": "https://static.zara.net/assets/public/e258/3ddc/e77d4f7ca133/1d02210342ce/07754061251-p/07754061251-p.jpg?ts=1788359838957&w=850",
          "images": [
              "https://static.zara.net/assets/public/e258/3ddc/e77d4f7ca133/1d02210342ce/07754061251-p/07754061251-p.jpg?ts=1788359838957&w=850",
              "https://static.zara.net/assets/public/349c/2ccf/83cc45cfa8d4/96c0a96fafe5/07754061251-a1/07754061251-a1.jpg?ts=1788359839403&w=850",
              "https://static.zara.net/assets/public/be1d/bbc3/8d454095af96/ddebbb63e47c/07754061251-a2/07754061251-a2.jpg?ts=1788359839605&w=850",
              "https://static.zara.net/assets/public/2171/0003/3a624b0d994c/fe6f36920211/07754061251-a3/07754061251-a3.jpg?ts=1788359838894&w=850",
              "https://static.zara.net/assets/public/10a0/c47f/7403443785e7/3523a603c13c/07754061251-e1/07754061251-e1.jpg?ts=1788254531085&w=850",
              "https://static.zara.net/assets/public/a546/a8b2/d5c2430cbc90/bb46071f70c2/07754061251-e2/07754061251-e2.jpg?ts=1788254531248&w=850",
              "https://static.zara.net/assets/public/1b02/f0b5/8f5d45809c67/bfb69699c7ba/07754061251-e3/07754061251-e3.jpg?ts=1788254529900&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Oyster-white",
                  "hex": "#E6E6DF",
                  "reference": "2646/071",
                  "images": [
                      "https://static.zara.net/assets/public/e258/3ddc/e77d4f7ca133/1d02210342ce/07754061251-p/07754061251-p.jpg?ts=1788359838957&w=850",
                      "https://static.zara.net/assets/public/349c/2ccf/83cc45cfa8d4/96c0a96fafe5/07754061251-a1/07754061251-a1.jpg?ts=1788359839403&w=850",
                      "https://static.zara.net/assets/public/be1d/bbc3/8d454095af96/ddebbb63e47c/07754061251-a2/07754061251-a2.jpg?ts=1788359839605&w=850",
                      "https://static.zara.net/assets/public/2171/0003/3a624b0d994c/fe6f36920211/07754061251-a3/07754061251-a3.jpg?ts=1788359838894&w=850",
                      "https://static.zara.net/assets/public/10a0/c47f/7403443785e7/3523a603c13c/07754061251-e1/07754061251-e1.jpg?ts=1788254531085&w=850",
                      "https://static.zara.net/assets/public/a546/a8b2/d5c2430cbc90/bb46071f70c2/07754061251-e2/07754061251-e2.jpg?ts=1788254531248&w=850",
                      "https://static.zara.net/assets/public/1b02/f0b5/8f5d45809c67/bfb69699c7ba/07754061251-e3/07754061251-e3.jpg?ts=1788254529900&w=850"
                  ]
              },
              {
                  "name": "Cream",
                  "hex": "#E6E6DF",
                  "reference": "2646/071",
                  "images": [
                      "https://static.zara.net/assets/public/2ac3/f164/ba964da19a6d/5901864c4765/07764061733-p/07764061733-p.jpg?ts=1792506822999&w=850",
                      "https://static.zara.net/assets/public/fcb5/7df7/2b7c4192b4d1/574e0bd0151d/07764061733-a1/07764061733-a1.jpg?ts=1792506823353&w=850",
                      "https://static.zara.net/assets/public/6797/6b7d/92ea44318569/769ef7ecde3a/07764061733-a2/07764061733-a2.jpg?ts=1792506823374&w=850",
                      "https://static.zara.net/assets/public/0d7c/a53b/ac4f46eaab25/43a5d80ca739/07764061733-a3/07764061733-a3.jpg?ts=1792506822217&w=850",
                      "https://static.zara.net/assets/public/72eb/1fb8/3b9848e69db2/5db87f13fc74/01255527684-015-a4/01255527684-015-a4.jpg?ts=1792585182405&w=850",
                      "https://static.zara.net/assets/public/9106/ffe9/a24b4c7e94ce/5be8388ae4f1/07764061733-e1/07764061733-e1.jpg?ts=1792497221568&w=850",
                      "https://static.zara.net/assets/public/bd5a/1786/ee064653bdc4/7be6f3f6d2fd/07764061733-e2/07764061733-e2.jpg?ts=1792497224305&w=850",
                      "https://static.zara.net/assets/public/9305/cc21/f0594654adf4/0ecc84af4e7a/07764061733-e3/07764061733-e3.jpg?ts=1792497221739&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#121315",
                  "reference": "2646/071",
                  "images": [
                      "https://static.zara.net/assets/public/5c72/7d8a/904647db8587/3e1190e17ac6/07754061800-p/07754061800-p.jpg?ts=1794402323200&w=850",
                      "https://static.zara.net/assets/public/c64b/799e/c227414282de/05ce6c984e47/07754061800-a1/07754061800-a1.jpg?ts=1794402322585&w=850",
                      "https://static.zara.net/assets/public/f9bf/b199/8b9d45088668/31edee6bc6df/07754061800-a2/07754061800-a2.jpg?ts=1794402323185&w=850",
                      "https://static.zara.net/assets/public/aa9d/d6b4/c8df4f8080e5/726ce88c3f07/07754061800-a3/07754061800-a3.jpg?ts=1794472034119&w=850",
                      "https://static.zara.net/assets/public/3ed5/361e/f0624ee3979c/6d3a2b3245f0/02646071800-e1/02646071800-e1.jpg?ts=1784288459098&w=850",
                      "https://static.zara.net/assets/public/3ce2/a9de/c9d54896b153/fa91e5901d78/02646071800-e2/02646071800-e2.jpg?ts=1784288458177&w=850",
                      "https://static.zara.net/assets/public/3c07/e550/300043ae9d8e/a7365120e213/02646071800-e3/02646071800-e3.jpg?ts=1784288458261&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL",
              "XXL"
          ],
          "colors": [
              "Oyster-white",
              "Cream",
              "Black"
          ],
          "description": "Model height: 176 cm\n\nTop crafted from satin fabric. Halter neck with ruching detail. Lined in the same fabric. Finished with a balloon hem. Featuring a back opening with tie fastening.",
          "materialCare": [
              "OUTER SHELL: 97% polyester, 3% elastane",
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-m19",
          "slug": "long-sleeve-washed-effect-t-shirt-zara-m19",
          "name": "WASHED EFFECT LONG SLEEVE T-SHIRT",
          "category": "T-Shirts",
          "gender": "MEN",
          "price": 219.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4090/323",
          "image": "https://static.zara.net/assets/public/b6a4/2c6d/2fb541d895b9/511d9ed61164/04090323427-p/04090323427-p.jpg?ts=1793868882546&w=850",
          "images": [
              "https://static.zara.net/assets/public/b6a4/2c6d/2fb541d895b9/511d9ed61164/04090323427-p/04090323427-p.jpg?ts=1793868882546&w=850",
              "https://static.zara.net/assets/public/b41a/9f03/c3ba4f0b9abb/63c7c090f4b7/04090323427-a1/04090323427-a1.jpg?ts=1793868884261&w=850",
              "https://static.zara.net/assets/public/4aa1/b544/153f4ded994a/6e26fb40fccf/04090323427-a2/04090323427-a2.jpg?ts=1793868883829&w=850",
              "https://static.zara.net/assets/public/5954/4c81/9b8f409e8fd1/7860eed82fb7/04090323427-a3/04090323427-a3.jpg?ts=1793868884542&w=850",
              "https://static.zara.net/assets/public/8412/6325/700546d186e6/fdd275b75fcc/04090323427-a4/04090323427-a4.jpg?ts=1793868881863&w=850",
              "https://static.zara.net/assets/public/fd7d/5a71/5b7b470fac5e/6230102ccab6/04090323427-a5/04090323427-a5.jpg?ts=1793868884264&w=850",
              "https://static.zara.net/assets/public/4919/345e/9f6447a0a2fb/c7b73b16b5bd/04090323427-e1/04090323427-e1.jpg?ts=1793810746937&w=850",
              "https://static.zara.net/assets/public/3cdd/0c22/ef35460390b5/6761468c96ed/04090323427-e2/04090323427-e2.jpg?ts=1793810746635&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Mid-blue",
                  "hex": "#556386",
                  "reference": "4090/323",
                  "images": [
                      "https://static.zara.net/assets/public/b6a4/2c6d/2fb541d895b9/511d9ed61164/04090323427-p/04090323427-p.jpg?ts=1793868882546&w=850",
                      "https://static.zara.net/assets/public/b41a/9f03/c3ba4f0b9abb/63c7c090f4b7/04090323427-a1/04090323427-a1.jpg?ts=1793868884261&w=850",
                      "https://static.zara.net/assets/public/4aa1/b544/153f4ded994a/6e26fb40fccf/04090323427-a2/04090323427-a2.jpg?ts=1793868883829&w=850",
                      "https://static.zara.net/assets/public/5954/4c81/9b8f409e8fd1/7860eed82fb7/04090323427-a3/04090323427-a3.jpg?ts=1793868884542&w=850",
                      "https://static.zara.net/assets/public/8412/6325/700546d186e6/fdd275b75fcc/04090323427-a4/04090323427-a4.jpg?ts=1793868881863&w=850",
                      "https://static.zara.net/assets/public/fd7d/5a71/5b7b470fac5e/6230102ccab6/04090323427-a5/04090323427-a5.jpg?ts=1793868884264&w=850",
                      "https://static.zara.net/assets/public/4919/345e/9f6447a0a2fb/c7b73b16b5bd/04090323427-e1/04090323427-e1.jpg?ts=1793810746937&w=850",
                      "https://static.zara.net/assets/public/3cdd/0c22/ef35460390b5/6761468c96ed/04090323427-e2/04090323427-e2.jpg?ts=1793810746635&w=850"
                  ]
              },
              {
                  "name": "Taupe grey",
                  "hex": "#5c5143",
                  "reference": "4090/323",
                  "images": [
                      "https://static.zara.net/assets/public/2c0f/cc56/3d05429dacc8/2cbc4a00edcc/04090323832-p/04090323832-p.jpg?ts=1793868881328&w=850",
                      "https://static.zara.net/assets/public/ac33/b848/6e6d4e6abdd6/7b7064bf9bd2/04090323832-a1/04090323832-a1.jpg?ts=1793868879529&w=850",
                      "https://static.zara.net/assets/public/16ea/3ebe/fe2f481ca152/b5a10cc1ea75/04090323832-a2/04090323832-a2.jpg?ts=1793868882410&w=850",
                      "https://static.zara.net/assets/public/3d44/488e/5d00411f9627/0c2c81d4c514/04090323832-a3/04090323832-a3.jpg?ts=1793868880833&w=850",
                      "https://static.zara.net/assets/public/6680/5cb3/ad78409aa1b5/92937247c2a4/04090323832-a4/04090323832-a4.jpg?ts=1793868881208&w=850",
                      "https://static.zara.net/assets/public/42e3/049d/2e7342d3b855/50945814b489/04090323832-a5/04090323832-a5.jpg?ts=1793868879900&w=850",
                      "https://static.zara.net/assets/public/1006/1bc5/7a26429a94f4/8cdedc0fb72e/04090323832-e1/04090323832-e1.jpg?ts=1793810745129&w=850",
                      "https://static.zara.net/assets/public/c553/5634/1f0045b695b0/ea996fce4bac/04090323832-e2/04090323832-e2.jpg?ts=1793810745857&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Mid-blue",
              "Taupe grey"
          ],
          "description": "Model height: 184 cm\n\nRelaxed fit T-shirt made from cotton fabric. Round neck and long sleeve. Uneven wash effect on the entire garment.\n\nThe garment has a unique appearance due to its special washing process. For this reason, it may differ slightly in colour from that shown in the photo.\n\nOrigins special collection.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-w20",
          "slug": "satin-shirt-with-jewel-buttons-zara-w20",
          "name": "SATIN SHIRT WITH JEWEL BUTTONS",
          "category": "Shirts",
          "gender": "WOMEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "8971/581",
          "image": "https://static.zara.net/assets/public/c1f9/5f5a/6fb94457a798/e789d2666314/08971581681-p/08971581681-p.jpg?ts=1794225688909&w=850",
          "images": [
              "https://static.zara.net/assets/public/c1f9/5f5a/6fb94457a798/e789d2666314/08971581681-p/08971581681-p.jpg?ts=1794225688909&w=850",
              "https://static.zara.net/assets/public/36a6/c332/5b5044d2b786/45d2ccefcdfb/08971581681-a1/08971581681-a1.jpg?ts=1794225682991&w=850",
              "https://static.zara.net/assets/public/25c4/7be5/8aea43a48d7e/7b7676a7bb94/08971581681-a2/08971581681-a2.jpg?ts=1794225683328&w=850",
              "https://static.zara.net/assets/public/4282/ed9c/5af843e8a59c/ca996040f2f7/08971581681-a3/08971581681-a3.jpg?ts=1794225683120&w=850",
              "https://static.zara.net/assets/public/359f/57c0/d96e497f8c83/577906378ac0/08971581681-a4/08971581681-a4.jpg?ts=1794225685031&w=850",
              "https://static.zara.net/assets/public/e652/8a04/ebd84caabd9b/d2e4346934ca/08971581681-a5/08971581681-a5.jpg?ts=1794225688209&w=850",
              "https://static.zara.net/assets/public/b0bf/c2c0/0d0843baa535/5c289eef3ccf/08971581681-e1/08971581681-e1.jpg?ts=1794314757531&w=850",
              "https://static.zara.net/assets/public/3eef/657d/bb2f4cc99e69/732da5f5cd51/08971581681-e2/08971581681-e2.jpg?ts=1794314758653&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Burgundy",
                  "hex": "#7a3b5c",
                  "reference": "8971/581",
                  "images": [
                      "https://static.zara.net/assets/public/c1f9/5f5a/6fb94457a798/e789d2666314/08971581681-p/08971581681-p.jpg?ts=1794225688909&w=850",
                      "https://static.zara.net/assets/public/36a6/c332/5b5044d2b786/45d2ccefcdfb/08971581681-a1/08971581681-a1.jpg?ts=1794225682991&w=850",
                      "https://static.zara.net/assets/public/25c4/7be5/8aea43a48d7e/7b7676a7bb94/08971581681-a2/08971581681-a2.jpg?ts=1794225683328&w=850",
                      "https://static.zara.net/assets/public/4282/ed9c/5af843e8a59c/ca996040f2f7/08971581681-a3/08971581681-a3.jpg?ts=1794225683120&w=850",
                      "https://static.zara.net/assets/public/359f/57c0/d96e497f8c83/577906378ac0/08971581681-a4/08971581681-a4.jpg?ts=1794225685031&w=850",
                      "https://static.zara.net/assets/public/e652/8a04/ebd84caabd9b/d2e4346934ca/08971581681-a5/08971581681-a5.jpg?ts=1794225688209&w=850",
                      "https://static.zara.net/assets/public/b0bf/c2c0/0d0843baa535/5c289eef3ccf/08971581681-e1/08971581681-e1.jpg?ts=1794314757531&w=850",
                      "https://static.zara.net/assets/public/3eef/657d/bb2f4cc99e69/732da5f5cd51/08971581681-e2/08971581681-e2.jpg?ts=1794314758653&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Burgundy"
          ],
          "description": "Fluid shirt in satin. Regular collar and long sleeve. Front fastening with jewel buttons.",
          "materialCare": [
              "OUTER SHELL: 100% polyester"
          ]
      },
      {
          "id": "zara-m20",
          "slug": "supima--striped-jacquard-t-shirt-zara-m20",
          "name": "SUPIMA® STRIPED JACQUARD T-SHIRT",
          "category": "T-Shirts",
          "gender": "MEN",
          "price": 219.0,
          "oldPrice": null,
          "discount": null,
          "reference": "4231/347",
          "image": "https://static.zara.net/assets/public/f622/4cb2/9e7e465b83d1/d8d9c31abb06/04231347490-p/04231347490-p.jpg?ts=1791200527224&w=850",
          "images": [
              "https://static.zara.net/assets/public/f622/4cb2/9e7e465b83d1/d8d9c31abb06/04231347490-p/04231347490-p.jpg?ts=1791200527224&w=850",
              "https://static.zara.net/assets/public/c3cc/ad66/824e4a5c916f/285d14ec727d/04231347490-a1/04231347490-a1.jpg?ts=1791200526476&w=850",
              "https://static.zara.net/assets/public/f1e5/cd82/183647198754/cea3c4f6996a/04231347490-a2/04231347490-a2.jpg?ts=1791200526877&w=850",
              "https://static.zara.net/assets/public/f9e0/2d90/ce554c0a9c1b/53e2e2add5ba/04231347490-a3/04231347490-a3.jpg?ts=1791200525869&w=850",
              "https://static.zara.net/assets/public/d25f/4684/f3154aed8e5c/f5bd37675d70/04231347490-a4/04231347490-a4.jpg?ts=1791200526042&w=850",
              "https://static.zara.net/assets/public/d360/3d10/cc6140d78211/dc061dbf5447/04231347490-a5/04231347490-a5.jpg?ts=1791200526000&w=850",
              "https://static.zara.net/assets/public/ad29/9e8a/00c944c4b172/4007367195df/04231347490-e1/04231347490-e1.jpg?ts=1790846335476&w=850",
              "https://static.zara.net/assets/public/923c/2402/fcf74dcd80b7/6d10c15f42f7/04231347490-e2/04231347490-e2.jpg?ts=1790846335939&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Midnight blue",
                  "hex": "#363E4F",
                  "reference": "4231/347",
                  "images": [
                      "https://static.zara.net/assets/public/f622/4cb2/9e7e465b83d1/d8d9c31abb06/04231347490-p/04231347490-p.jpg?ts=1791200527224&w=850",
                      "https://static.zara.net/assets/public/c3cc/ad66/824e4a5c916f/285d14ec727d/04231347490-a1/04231347490-a1.jpg?ts=1791200526476&w=850",
                      "https://static.zara.net/assets/public/f1e5/cd82/183647198754/cea3c4f6996a/04231347490-a2/04231347490-a2.jpg?ts=1791200526877&w=850",
                      "https://static.zara.net/assets/public/f9e0/2d90/ce554c0a9c1b/53e2e2add5ba/04231347490-a3/04231347490-a3.jpg?ts=1791200525869&w=850",
                      "https://static.zara.net/assets/public/d25f/4684/f3154aed8e5c/f5bd37675d70/04231347490-a4/04231347490-a4.jpg?ts=1791200526042&w=850",
                      "https://static.zara.net/assets/public/d360/3d10/cc6140d78211/dc061dbf5447/04231347490-a5/04231347490-a5.jpg?ts=1791200526000&w=850",
                      "https://static.zara.net/assets/public/ad29/9e8a/00c944c4b172/4007367195df/04231347490-e1/04231347490-e1.jpg?ts=1790846335476&w=850",
                      "https://static.zara.net/assets/public/923c/2402/fcf74dcd80b7/6d10c15f42f7/04231347490-e2/04231347490-e2.jpg?ts=1790846335939&w=850"
                  ]
              },
              {
                  "name": "Brown",
                  "hex": "#281c15",
                  "reference": "4231/347",
                  "images": [
                      "https://static.zara.net/assets/public/55e2/9061/747f4e8c8019/5cfe1a4e897f/04231347700-p/04231347700-p.jpg?ts=1793889976499&w=850",
                      "https://static.zara.net/assets/public/0ea6/a752/01fa490a9af7/000d502ab384/04231347700-a1/04231347700-a1.jpg?ts=1793889976515&w=850",
                      "https://static.zara.net/assets/public/e158/e657/7cce412cb470/3e36f1913437/04231347700-a2/04231347700-a2.jpg?ts=1793889976544&w=850",
                      "https://static.zara.net/assets/public/9856/5616/29a44fe78ab3/fe5b2b877bb7/04231347700-a3/04231347700-a3.jpg?ts=1793889978268&w=850",
                      "https://static.zara.net/assets/public/ccf8/f3d8/9aea448d813b/e6a58e644c2c/04231347700-a4/04231347700-a4.jpg?ts=1793889975858&w=850",
                      "https://static.zara.net/assets/public/4bd1/8389/125c442db0a3/2887e5715fd1/04231347700-a5/04231347700-a5.jpg?ts=1793889977011&w=850",
                      "https://static.zara.net/assets/public/cb7c/221b/12c648a59eb5/f714a7f636c1/04231347700-e1/04231347700-e1.jpg?ts=1793810741062&w=850",
                      "https://static.zara.net/assets/public/5731/2dca/3c79492abe75/6ccc21e9f7bf/04231347700-e2/04231347700-e2.jpg?ts=1793810741104&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Midnight blue",
              "Brown"
          ],
          "description": "Model height: 184 cm\n\nRegular fit cotton T-shirt featuring a ribbed round neck and long sleeve. Origins special collection.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-w21",
          "slug": "check-beaded-collar-shirt-zara-w21",
          "name": "CHECK SHIRT WITH BEADED COLLAR",
          "category": "Shirts",
          "gender": "WOMEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "8035/873",
          "image": "https://static.zara.net/assets/public/44cd/881f/796e40c18b24/f47d645c146d/08035873049-p/08035873049-p.jpg?ts=1793795560275&w=850",
          "images": [
              "https://static.zara.net/assets/public/44cd/881f/796e40c18b24/f47d645c146d/08035873049-p/08035873049-p.jpg?ts=1793795560275&w=850",
              "https://static.zara.net/assets/public/2580/3d7f/062d42ff8d4d/40483b539b38/08035873049-a1/08035873049-a1.jpg?ts=1793795555729&w=850",
              "https://static.zara.net/assets/public/4f1d/cca2/865241fc8e2f/7382c10d1483/08035873049-a2/08035873049-a2.jpg?ts=1793795558182&w=850",
              "https://static.zara.net/assets/public/b650/ea15/eb6c459487ac/4a7ce5876c94/08035873049-a3/08035873049-a3.jpg?ts=1793795558552&w=850",
              "https://static.zara.net/assets/public/4bef/3453/2a7843108b45/b555b6e57bbe/08035873049-a4/08035873049-a4.jpg?ts=1793795558724&w=850",
              "https://static.zara.net/assets/public/2e28/1ff5/b4b6420fa715/0fb5275c37ee/08035873049-e1/08035873049-e1.jpg?ts=1794225990408&w=850",
              "https://static.zara.net/assets/public/53d4/0547/d4064a9cb3e8/17ed16243869/08035873049-e2/08035873049-e2.jpg?ts=1794225990965&w=850",
              "https://static.zara.net/assets/public/9a77/456c/bf6f47b8ad53/457ddbe72165/08035873049-e3/08035873049-e3.jpg?ts=1794225992907&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Brown-Blue",
                  "hex": "#935a2a",
                  "reference": "8035/873",
                  "images": [
                      "https://static.zara.net/assets/public/44cd/881f/796e40c18b24/f47d645c146d/08035873049-p/08035873049-p.jpg?ts=1793795560275&w=850",
                      "https://static.zara.net/assets/public/2580/3d7f/062d42ff8d4d/40483b539b38/08035873049-a1/08035873049-a1.jpg?ts=1793795555729&w=850",
                      "https://static.zara.net/assets/public/4f1d/cca2/865241fc8e2f/7382c10d1483/08035873049-a2/08035873049-a2.jpg?ts=1793795558182&w=850",
                      "https://static.zara.net/assets/public/b650/ea15/eb6c459487ac/4a7ce5876c94/08035873049-a3/08035873049-a3.jpg?ts=1793795558552&w=850",
                      "https://static.zara.net/assets/public/4bef/3453/2a7843108b45/b555b6e57bbe/08035873049-a4/08035873049-a4.jpg?ts=1793795558724&w=850",
                      "https://static.zara.net/assets/public/2e28/1ff5/b4b6420fa715/0fb5275c37ee/08035873049-e1/08035873049-e1.jpg?ts=1794225990408&w=850",
                      "https://static.zara.net/assets/public/53d4/0547/d4064a9cb3e8/17ed16243869/08035873049-e2/08035873049-e2.jpg?ts=1794225990965&w=850",
                      "https://static.zara.net/assets/public/9a77/456c/bf6f47b8ad53/457ddbe72165/08035873049-e3/08035873049-e3.jpg?ts=1794225992907&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Brown-Blue"
          ],
          "description": "Shirt with regular collar featuring shiny beads and long sleeve. Front button fastening.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-m21",
          "slug": "relaxed-fit-check-shirt-zara-m21",
          "name": "RELAXED FIT CHECK SHIRT",
          "category": "Shirts",
          "gender": "MEN",
          "price": 299.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1115/405",
          "image": "https://static.zara.net/assets/public/ece0/fbc5/b0e64fff8285/3df0c2a019f6/01115406400-p/01115406400-p.jpg?ts=1793889985268&w=850",
          "images": [
              "https://static.zara.net/assets/public/ece0/fbc5/b0e64fff8285/3df0c2a019f6/01115406400-p/01115406400-p.jpg?ts=1793889985268&w=850",
              "https://static.zara.net/assets/public/322d/0b0d/1e014d2f96d8/bb1cb7fc20be/01115406400-a1/01115406400-a1.jpg?ts=1793889983695&w=850",
              "https://static.zara.net/assets/public/aefc/0b43/6a3b4291912b/785ac8cef0f5/01115406400-a2/01115406400-a2.jpg?ts=1793889984915&w=850",
              "https://static.zara.net/assets/public/dc41/8aa4/cc6b4ba08292/9a45e3dbe743/01115406400-a3/01115406400-a3.jpg?ts=1793889984030&w=850",
              "https://static.zara.net/assets/public/5454/d4a5/ebcd4e1caca6/f27fc1be8c62/01115406400-a4/01115406400-a4.jpg?ts=1793889984993&w=850",
              "https://static.zara.net/assets/public/0af6/4853/22ca4685915f/2469623875ab/01115406400-a5/01115406400-a5.jpg?ts=1793889985284&w=850",
              "https://static.zara.net/assets/public/29aa/8aa9/407741668ed9/089b34fae102/01115406400-e1/01115406400-e1.jpg?ts=1793810757907&w=850",
              "https://static.zara.net/assets/public/3afd/073e/ae884934bbd2/42c880f62d4a/01115406400-e2/01115406400-e2.jpg?ts=1793810756948&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Blue",
                  "hex": "#8792ad",
                  "reference": "1115/405",
                  "images": [
                      "https://static.zara.net/assets/public/ece0/fbc5/b0e64fff8285/3df0c2a019f6/01115406400-p/01115406400-p.jpg?ts=1793889985268&w=850",
                      "https://static.zara.net/assets/public/322d/0b0d/1e014d2f96d8/bb1cb7fc20be/01115406400-a1/01115406400-a1.jpg?ts=1793889983695&w=850",
                      "https://static.zara.net/assets/public/aefc/0b43/6a3b4291912b/785ac8cef0f5/01115406400-a2/01115406400-a2.jpg?ts=1793889984915&w=850",
                      "https://static.zara.net/assets/public/dc41/8aa4/cc6b4ba08292/9a45e3dbe743/01115406400-a3/01115406400-a3.jpg?ts=1793889984030&w=850",
                      "https://static.zara.net/assets/public/5454/d4a5/ebcd4e1caca6/f27fc1be8c62/01115406400-a4/01115406400-a4.jpg?ts=1793889984993&w=850",
                      "https://static.zara.net/assets/public/0af6/4853/22ca4685915f/2469623875ab/01115406400-a5/01115406400-a5.jpg?ts=1793889985284&w=850",
                      "https://static.zara.net/assets/public/29aa/8aa9/407741668ed9/089b34fae102/01115406400-e1/01115406400-e1.jpg?ts=1793810757907&w=850",
                      "https://static.zara.net/assets/public/3afd/073e/ae884934bbd2/42c880f62d4a/01115406400-e2/01115406400-e2.jpg?ts=1793810756948&w=850"
                  ]
              },
              {
                  "name": "Brown",
                  "hex": "#281c15",
                  "reference": "1115/405",
                  "images": [
                      "https://static.zara.net/assets/public/7161/b7a3/ab654483b306/d461d05a94d3/01115405700-p/01115405700-p.jpg?ts=1793868904660&w=850",
                      "https://static.zara.net/assets/public/db52/fbd0/317940539f8c/7db36cd028b7/01115405700-a1/01115405700-a1.jpg?ts=1793868904612&w=850",
                      "https://static.zara.net/assets/public/fa89/4842/edbd40c99016/b139c89479d3/01115405700-a2/01115405700-a2.jpg?ts=1793868902635&w=850",
                      "https://static.zara.net/assets/public/19e2/5dfb/21d942f1a955/63a184a8cb32/01115405700-a3/01115405700-a3.jpg?ts=1793868905071&w=850",
                      "https://static.zara.net/assets/public/eebf/1660/ce86435488c8/76edec43c02f/01115405700-a4/01115405700-a4.jpg?ts=1793868902832&w=850",
                      "https://static.zara.net/assets/public/51a5/842b/314c4896bfe2/c80c2749a57b/01115405700-a5/01115405700-a5.jpg?ts=1793868904411&w=850",
                      "https://static.zara.net/assets/public/38e3/4cf8/438f42fe90d6/0c8692f8be0b/01115405700-a6/01115405700-a6.jpg?ts=1793868904426&w=850",
                      "https://static.zara.net/assets/public/dac1/7829/bc994302b47a/7534c1b6d3b0/01115405700-e1/01115405700-e1.jpg?ts=1793810757591&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Blue",
              "Brown"
          ],
          "description": "Model height: 184 cm\n\nRelaxed fit shirt made from a cotton blend fabric. Regular collar and long sleeve finished with a buttoned cuff. Patch pocket on the chest. Button-up front.\n\nOrigins special collection.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-w22",
          "slug": "basic-plush-trousers-zara-w22",
          "name": "BASIC PLUSH TROUSERS",
          "category": "Trousers",
          "gender": "WOMEN",
          "price": 119.0,
          "oldPrice": null,
          "discount": null,
          "reference": "3199/635",
          "image": "https://static.zara.net/assets/public/37c1/22cf/b44946de857d/9a62b6972e23/03199635081-p/03199635081-p.jpg?ts=1789131896085&w=850",
          "images": [
              "https://static.zara.net/assets/public/37c1/22cf/b44946de857d/9a62b6972e23/03199635081-p/03199635081-p.jpg?ts=1789131896085&w=850",
              "https://static.zara.net/assets/public/0a35/d7b1/87e14d8d8fc0/9813a1534da1/03199635081-a1/03199635081-a1.jpg?ts=1789131897262&w=850",
              "https://static.zara.net/assets/public/313f/e7f3/8c764070a890/9cfed2ddaa63/03199635081-a2/03199635081-a2.jpg?ts=1789131897238&w=850",
              "https://static.zara.net/assets/public/6061/97cc/01df46a4a4d5/ca5ca463de63/03199635081-a3/03199635081-a3.jpg?ts=1789131896837&w=850",
              "https://static.zara.net/assets/public/7ad5/60d5/dd644a72845f/f6fd04201f4d/03199635081-a4/03199635081-a4.jpg?ts=1789131896120&w=850",
              "https://static.zara.net/assets/public/e141/07b2/3d394e3da5c0/f911702737d1/03199635081-e1/03199635081-e1.jpg?ts=1787827293228&w=850",
              "https://static.zara.net/assets/public/a010/f18b/e2624679bb82/82c7c789bcd0/03199635081-e2/03199635081-e2.jpg?ts=1787827302321&w=850",
              "https://static.zara.net/assets/public/2b01/3824/12e24f199203/2709c5bc4c03/03199635081-e3/03199635081-e3.jpg?ts=1787827294688&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Sand / Marl",
                  "hex": "#E6E6DF",
                  "reference": "3199/635",
                  "images": [
                      "https://static.zara.net/assets/public/37c1/22cf/b44946de857d/9a62b6972e23/03199635081-p/03199635081-p.jpg?ts=1789131896085&w=850",
                      "https://static.zara.net/assets/public/0a35/d7b1/87e14d8d8fc0/9813a1534da1/03199635081-a1/03199635081-a1.jpg?ts=1789131897262&w=850",
                      "https://static.zara.net/assets/public/313f/e7f3/8c764070a890/9cfed2ddaa63/03199635081-a2/03199635081-a2.jpg?ts=1789131897238&w=850",
                      "https://static.zara.net/assets/public/6061/97cc/01df46a4a4d5/ca5ca463de63/03199635081-a3/03199635081-a3.jpg?ts=1789131896837&w=850",
                      "https://static.zara.net/assets/public/7ad5/60d5/dd644a72845f/f6fd04201f4d/03199635081-a4/03199635081-a4.jpg?ts=1789131896120&w=850",
                      "https://static.zara.net/assets/public/e141/07b2/3d394e3da5c0/f911702737d1/03199635081-e1/03199635081-e1.jpg?ts=1787827293228&w=850",
                      "https://static.zara.net/assets/public/a010/f18b/e2624679bb82/82c7c789bcd0/03199635081-e2/03199635081-e2.jpg?ts=1787827302321&w=850",
                      "https://static.zara.net/assets/public/2b01/3824/12e24f199203/2709c5bc4c03/03199635081-e3/03199635081-e3.jpg?ts=1787827294688&w=850"
                  ]
              },
              {
                  "name": "Navy blue",
                  "hex": "#252731",
                  "reference": "3199/635",
                  "images": [
                      "https://static.zara.net/assets/public/90e1/5528/53a042fbbcad/7992030269d4/03199635401-p/03199635401-p.jpg?ts=1794476393606&w=850",
                      "https://static.zara.net/assets/public/0762/c592/16844e0a8307/883b340cfc4c/03199635401-a1/03199635401-a1.jpg?ts=1794476392793&w=850",
                      "https://static.zara.net/assets/public/daaf/e5bf/86d84c0e8e98/a574f2a5739c/03199635401-a2/03199635401-a2.jpg?ts=1794476393778&w=850",
                      "https://static.zara.net/assets/public/672c/5ad6/b1da4f91ab74/11626052d505/03199635401-e1/03199635401-e1.jpg?ts=1787827312153&w=850",
                      "https://static.zara.net/assets/public/8288/7bae/a034473f8855/be9ceecc9bd1/03199635401-e2/03199635401-e2.jpg?ts=1787827312652&w=850",
                      "https://static.zara.net/assets/public/3b22/2061/a7204e269c05/58ac17a5a89c/03199635401-e3/03199635401-e3.jpg?ts=1787827313342&w=850"
                  ]
              },
              {
                  "name": "Grey marl",
                  "hex": "#C8D8D4",
                  "reference": "3199/635",
                  "images": [
                      "https://static.zara.net/assets/public/2bad/85d7/11be49cd8491/b7c96cc7c233/03199635803-p/03199635803-p.jpg?ts=1794476389624&w=850",
                      "https://static.zara.net/assets/public/ed7a/4cdd/7b264fbdaceb/2afa14ae1dd4/03199635803-a1/03199635803-a1.jpg?ts=1794476394036&w=850",
                      "https://static.zara.net/assets/public/a2b2/94f0/7bcc4e25b5d5/ab3841921d26/03199635803-a2/03199635803-a2.jpg?ts=1794476393076&w=850",
                      "https://static.zara.net/assets/public/3831/3095/2840438391d0/d888742c2375/03199635803-a3/03199635803-a3.jpg?ts=1794476393938&w=850",
                      "https://static.zara.net/assets/public/cedf/c9c0/c7b444f2bba3/f0f3ef7fe811/03199635803-a4/03199635803-a4.jpg?ts=1794476394132&w=850",
                      "https://static.zara.net/assets/public/97ab/290a/4cb94a0580f7/1089bd5f4f44/03199635803-e1/03199635803-e1.jpg?ts=1787827303809&w=850",
                      "https://static.zara.net/assets/public/1327/ecfd/df254d2d8f44/ec2926489ec6/03199635803-e2/03199635803-e2.jpg?ts=1787827303343&w=850",
                      "https://static.zara.net/assets/public/9b42/768e/75344b90a241/8f76b998f20c/03199635803-e3/03199635803-e3.jpg?ts=1787827308217&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Sand / Marl",
              "Navy blue",
              "Grey marl"
          ],
          "description": "Mid-waist trousers with an elasticated waistband and interior adjustable drawstrings. Featuring side pockets and wide legs.",
          "materialCare": [
              "100% Certified Apparel Craft",
              "Machine wash at max 30°C / short spin"
          ]
      },
      {
          "id": "zara-m22",
          "slug": "check-washed-effect-shirt-zara-m22",
          "name": "WASHED EFFECT CHECK SHIRT",
          "category": "Shirts",
          "gender": "MEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1820/355",
          "image": "https://static.zara.net/assets/public/9418/62a1/6df04572b670/438c166069ac/01820355700-p/01820355700-p.jpg?ts=1794214008888&w=850",
          "images": [
              "https://static.zara.net/assets/public/9418/62a1/6df04572b670/438c166069ac/01820355700-p/01820355700-p.jpg?ts=1794214008888&w=850",
              "https://static.zara.net/assets/public/f1d3/f98d/3a134233b20e/e76af1c54331/01820355700-a1/01820355700-a1.jpg?ts=1794214009197&w=850",
              "https://static.zara.net/assets/public/49de/8cd1/6e02466b928d/8c1bafccfb32/01820355700-a2/01820355700-a2.jpg?ts=1794214008892&w=850",
              "https://static.zara.net/assets/public/8171/e955/a22041de97e6/f1f7df6144ad/01820355700-a3/01820355700-a3.jpg?ts=1794214007494&w=850",
              "https://static.zara.net/assets/public/bd6d/1abb/35274097b396/9efe786a8efb/01820355700-a4/01820355700-a4.jpg?ts=1794214008896&w=850",
              "https://static.zara.net/assets/public/5640/fc00/8c0d45c7abd1/7a729992e47e/01820355700-e1/01820355700-e1.jpg?ts=1793970092083&w=850",
              "https://static.zara.net/assets/public/bb01/a243/ad7546a7978b/03dc64131229/01820355700-e2/01820355700-e2.jpg?ts=1793970091450&w=850",
              "https://static.zara.net/assets/public/871d/eddc/7eff41d69803/d8e4bc54e3a3/01820355700-e3/01820355700-e3.jpg?ts=1793970094091&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Brown",
                  "hex": "#281c15",
                  "reference": "1820/355",
                  "images": [
                      "https://static.zara.net/assets/public/9418/62a1/6df04572b670/438c166069ac/01820355700-p/01820355700-p.jpg?ts=1794214008888&w=850",
                      "https://static.zara.net/assets/public/f1d3/f98d/3a134233b20e/e76af1c54331/01820355700-a1/01820355700-a1.jpg?ts=1794214009197&w=850",
                      "https://static.zara.net/assets/public/49de/8cd1/6e02466b928d/8c1bafccfb32/01820355700-a2/01820355700-a2.jpg?ts=1794214008892&w=850",
                      "https://static.zara.net/assets/public/8171/e955/a22041de97e6/f1f7df6144ad/01820355700-a3/01820355700-a3.jpg?ts=1794214007494&w=850",
                      "https://static.zara.net/assets/public/bd6d/1abb/35274097b396/9efe786a8efb/01820355700-a4/01820355700-a4.jpg?ts=1794214008896&w=850",
                      "https://static.zara.net/assets/public/5640/fc00/8c0d45c7abd1/7a729992e47e/01820355700-e1/01820355700-e1.jpg?ts=1793970092083&w=850",
                      "https://static.zara.net/assets/public/bb01/a243/ad7546a7978b/03dc64131229/01820355700-e2/01820355700-e2.jpg?ts=1793970091450&w=850",
                      "https://static.zara.net/assets/public/871d/eddc/7eff41d69803/d8e4bc54e3a3/01820355700-e3/01820355700-e3.jpg?ts=1793970094091&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Brown"
          ],
          "description": "Relaxed fit shirt made from cotton fabric. Regular collar and long sleeve finished with a buttoned cuff. Washed effect. Button-up front fastening.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-w23",
          "slug": "soft-volume-trousers-zara-w23",
          "name": "SOFT VOLUME TROUSERS",
          "category": "Trousers",
          "gender": "WOMEN",
          "price": 139.0,
          "oldPrice": null,
          "discount": null,
          "reference": "5039/671",
          "image": "https://static.zara.net/assets/public/0687/0614/afef42698903/33139285fa9e/05039671720-p/05039671720-p.jpg?ts=1788520831347&w=850",
          "images": [
              "https://static.zara.net/assets/public/0687/0614/afef42698903/33139285fa9e/05039671720-p/05039671720-p.jpg?ts=1788520831347&w=850",
              "https://static.zara.net/assets/public/223d/9919/10b645f9b3fe/06c8d6723633/05039671720-a1/05039671720-a1.jpg?ts=1788520831319&w=850",
              "https://static.zara.net/assets/public/783c/e2b9/69c24aa2a0ef/2569ab09c089/05039671720-a2/05039671720-a2.jpg?ts=1788520831016&w=850",
              "https://static.zara.net/assets/public/5161/ba8a/6a21473d9441/b031d7b35eb1/05039671720-a3/05039671720-a3.jpg?ts=1788520831293&w=850",
              "https://static.zara.net/assets/public/d0b9/da8d/48e044f495a7/4bd70f7618c4/05039671720-a4/05039671720-a4.jpg?ts=1788520831051&w=850",
              "https://static.zara.net/assets/public/d4c2/3189/497a463a9b88/96c3d411b41a/05039671720-e1/05039671720-e1.jpg?ts=1788276769705&w=850",
              "https://static.zara.net/assets/public/b06e/1bf2/dafa4b90864d/11189cb7e34a/05039671720-e2/05039671720-e2.jpg?ts=1788276768949&w=850",
              "https://static.zara.net/assets/public/ff58/f316/9f624d4e92d4/e80cd913f9d6/05039671720-e3/05039671720-e3.jpg?ts=1788276769269&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Beige marl",
                  "hex": "#C5C5BF",
                  "reference": "5039/671",
                  "images": [
                      "https://static.zara.net/assets/public/0687/0614/afef42698903/33139285fa9e/05039671720-p/05039671720-p.jpg?ts=1788520831347&w=850",
                      "https://static.zara.net/assets/public/223d/9919/10b645f9b3fe/06c8d6723633/05039671720-a1/05039671720-a1.jpg?ts=1788520831319&w=850",
                      "https://static.zara.net/assets/public/783c/e2b9/69c24aa2a0ef/2569ab09c089/05039671720-a2/05039671720-a2.jpg?ts=1788520831016&w=850",
                      "https://static.zara.net/assets/public/5161/ba8a/6a21473d9441/b031d7b35eb1/05039671720-a3/05039671720-a3.jpg?ts=1788520831293&w=850",
                      "https://static.zara.net/assets/public/d0b9/da8d/48e044f495a7/4bd70f7618c4/05039671720-a4/05039671720-a4.jpg?ts=1788520831051&w=850",
                      "https://static.zara.net/assets/public/d4c2/3189/497a463a9b88/96c3d411b41a/05039671720-e1/05039671720-e1.jpg?ts=1788276769705&w=850",
                      "https://static.zara.net/assets/public/b06e/1bf2/dafa4b90864d/11189cb7e34a/05039671720-e2/05039671720-e2.jpg?ts=1788276768949&w=850",
                      "https://static.zara.net/assets/public/ff58/f316/9f624d4e92d4/e80cd913f9d6/05039671720-e3/05039671720-e3.jpg?ts=1788276769269&w=850"
                  ]
              },
              {
                  "name": "Mink marl",
                  "hex": "#9c8c80",
                  "reference": "5039/671",
                  "images": [
                      "https://static.zara.net/assets/public/56c3/d83c/904440c6b4b5/e46b26abec28/05039671722-p/05039671722-p.jpg?ts=1794476391269&w=850",
                      "https://static.zara.net/assets/public/7462/ae59/30c2456087d5/e76479223b65/05039671722-a1/05039671722-a1.jpg?ts=1794476394245&w=850",
                      "https://static.zara.net/assets/public/9a54/58f7/83194feea406/25b032bdac11/05039671722-a2/05039671722-a2.jpg?ts=1794476393563&w=850",
                      "https://static.zara.net/assets/public/92e0/4b9b/5ed3403899fd/ebd76bc30c78/05039671722-a3/05039671722-a3.jpg?ts=1794476393253&w=850",
                      "https://static.zara.net/assets/public/80af/a6de/8ff7403593fb/9ca20ad312a6/05039671722-e1/05039671722-e1.jpg?ts=1788186885587&w=850",
                      "https://static.zara.net/assets/public/b6d7/407a/7a2a493aa9ae/f918cd8e4fa6/05039671722-e2/05039671722-e2.jpg?ts=1788186884907&w=850",
                      "https://static.zara.net/assets/public/7334/f10e/6e614213bcb1/da6e1583bcaa/05039671722-e3/05039671722-e3.jpg?ts=1788186885523&w=850"
                  ]
              },
              {
                  "name": "Anthracite grey",
                  "hex": "#303030",
                  "reference": "5039/671",
                  "images": [
                      "https://static.zara.net/assets/public/02d1/bc1f/8c664d5aaf8e/2b68adaeae40/05039671807-p/05039671807-p.jpg?ts=1794476392929&w=850",
                      "https://static.zara.net/assets/public/f0ea/4e04/34154160b727/d00e38f47e0c/05039671807-a1/05039671807-a1.jpg?ts=1794476394056&w=850",
                      "https://static.zara.net/assets/public/515e/6077/d07e4516aa09/8ca99987cfed/05039671807-a2/05039671807-a2.jpg?ts=1794476395097&w=850",
                      "https://static.zara.net/assets/public/98be/6e1f/ddf544cc8f46/d98c6b7db26f/05039671807-a3/05039671807-a3.jpg?ts=1794476395168&w=850",
                      "https://static.zara.net/assets/public/bcd4/de0e/a0964540b48f/fff2dcda9c58/05039671807-e1/05039671807-e1.jpg?ts=1788276769818&w=850",
                      "https://static.zara.net/assets/public/66e8/e823/97b045cea874/75abc10ae834/05039671807-e2/05039671807-e2.jpg?ts=1788276769375&w=850",
                      "https://static.zara.net/assets/public/6696/9ad1/dd7747ea8303/b4d3589570a9/05039671807-e3/05039671807-e3.jpg?ts=1788276770389&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L"
          ],
          "colors": [
              "Beige marl",
              "Mink marl",
              "Anthracite grey"
          ],
          "description": "Trousers made from soft fabric. Mid-waist with an elasticated waistband and defined seam detailing.",
          "materialCare": [
              "OUTER SHELL: 58% polyester, 42% cotton"
          ]
      },
      {
          "id": "zara-m23",
          "slug": "relaxed-fit-striped-pique-polo-shirt-zara-m23",
          "name": "RELAXED FIT STRIPED PIQUÉ POLO SHIRT",
          "category": "Polos",
          "gender": "MEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "5263/250",
          "image": "https://static.zara.net/assets/public/a61b/48e3/3e8b4faf9ae3/61f60df345be/04087325060-p/04087325060-p.jpg?ts=1788787090888&w=850",
          "images": [
              "https://static.zara.net/assets/public/a61b/48e3/3e8b4faf9ae3/61f60df345be/04087325060-p/04087325060-p.jpg?ts=1788787090888&w=850",
              "https://static.zara.net/assets/public/732d/9eaf/d1184e86b1e0/2c073d98e433/04087325060-a1/04087325060-a1.jpg?ts=1788787090425&w=850",
              "https://static.zara.net/assets/public/517d/476d/c47c4f4ab1b0/90ee90c3978a/04087325060-a2/04087325060-a2.jpg?ts=1788787091356&w=850",
              "https://static.zara.net/assets/public/7dfd/0503/bca8401ab43b/9644a2677a1b/04087325060-a3/04087325060-a3.jpg?ts=1788787091358&w=850",
              "https://static.zara.net/assets/public/c7a1/13c3/38a449da8f74/ca9c02f5d0a3/04087325060-a4/04087325060-a4.jpg?ts=1788787090532&w=850",
              "https://static.zara.net/assets/public/394e/3692/62304d5599b6/323c4b79dbdc/00526325060-e1/00526325060-e1.jpg?ts=1787126911243&w=850",
              "https://static.zara.net/assets/public/4b69/0bad/06144831a60e/34dd7fc5d1ec/00526325060-e2/00526325060-e2.jpg?ts=1787126905245&w=850"
          ],
          "colorVariants": [
              {
                  "name": "White / Navy",
                  "hex": "#EEDED0",
                  "reference": "5263/250",
                  "images": [
                      "https://static.zara.net/assets/public/a61b/48e3/3e8b4faf9ae3/61f60df345be/04087325060-p/04087325060-p.jpg?ts=1788787090888&w=850",
                      "https://static.zara.net/assets/public/732d/9eaf/d1184e86b1e0/2c073d98e433/04087325060-a1/04087325060-a1.jpg?ts=1788787090425&w=850",
                      "https://static.zara.net/assets/public/517d/476d/c47c4f4ab1b0/90ee90c3978a/04087325060-a2/04087325060-a2.jpg?ts=1788787091356&w=850",
                      "https://static.zara.net/assets/public/7dfd/0503/bca8401ab43b/9644a2677a1b/04087325060-a3/04087325060-a3.jpg?ts=1788787091358&w=850",
                      "https://static.zara.net/assets/public/c7a1/13c3/38a449da8f74/ca9c02f5d0a3/04087325060-a4/04087325060-a4.jpg?ts=1788787090532&w=850",
                      "https://static.zara.net/assets/public/394e/3692/62304d5599b6/323c4b79dbdc/00526325060-e1/00526325060-e1.jpg?ts=1787126911243&w=850",
                      "https://static.zara.net/assets/public/4b69/0bad/06144831a60e/34dd7fc5d1ec/00526325060-e2/00526325060-e2.jpg?ts=1787126905245&w=850"
                  ]
              },
              {
                  "name": "Yellow",
                  "hex": "#4A365B",
                  "reference": "5263/253",
                  "images": [
                      "https://static.zara.net/assets/public/f510/4453/691447d78896/ffe2af5366ef/00526325300-p/00526325300-p.jpg?ts=1786629983075&w=850",
                      "https://static.zara.net/assets/public/2890/8ab7/0466487f8604/7504c14e51a7/00526325300-a1/00526325300-a1.jpg?ts=1786629984794&w=850",
                      "https://static.zara.net/assets/public/503a/39ab/1d0f45ac8a71/1eb7c2f33688/00526325300-a2/00526325300-a2.jpg?ts=1786629982499&w=850",
                      "https://static.zara.net/assets/public/a987/b4f8/37944f729725/327df82db677/00526325300-a3/00526325300-a3.jpg?ts=1786629983213&w=850",
                      "https://static.zara.net/assets/public/0729/5446/37014b6cabc2/e67d3e7a056c/00526325300-a4/00526325300-a4.jpg?ts=1786629983634&w=850",
                      "https://static.zara.net/assets/public/bd82/f65d/fa764fefa1a2/e702dca83a6d/00526325300-a5/00526325300-a5.jpg?ts=1786629984612&w=850",
                      "https://static.zara.net/assets/public/d2b1/27e3/ed6f40c8a71c/5ea727524b21/00526325300-a6/00526325300-a6.jpg?ts=1786629982786&w=850",
                      "https://static.zara.net/assets/public/9121/3da9/6a274ecdaed8/1c6173b48dc1/00526325300-e1/00526325300-e1.jpg?ts=1786530502303&w=850"
                  ]
              },
              {
                  "name": "Navy blue",
                  "hex": "#191821",
                  "reference": "5263/254",
                  "images": [
                      "https://static.zara.net/assets/public/3afb/31f2/d1cc4a8082b8/9d2fe13ad011/00526325401-p/00526325401-p.jpg?ts=1787220327711&w=850",
                      "https://static.zara.net/assets/public/6100/1754/fa704d7da47b/ef0a9e0a3410/00526325401-a1/00526325401-a1.jpg?ts=1787220327121&w=850",
                      "https://static.zara.net/assets/public/b9be/4292/ee8148aea8a3/68aa1ebbbaa6/00526325401-a2/00526325401-a2.jpg?ts=1787220323556&w=850",
                      "https://static.zara.net/assets/public/9e38/7991/14bf41a6b46e/697b7e04f97f/00526325401-a3/00526325401-a3.jpg?ts=1787220326166&w=850",
                      "https://static.zara.net/assets/public/98a2/6bb9/57c54b0bbccf/65ff74b1a47a/00526325401-a4/00526325401-a4.jpg?ts=1787220327161&w=850",
                      "https://static.zara.net/assets/public/8da1/135b/8c1248c18bf3/9a430587e3d5/00526325401-a5/00526325401-a5.jpg?ts=1787220326041&w=850",
                      "https://static.zara.net/assets/public/3422/89b3/9be24be68285/6f564a4934a8/00526325401-e1/00526325401-e1.jpg?ts=1787126963548&w=850",
                      "https://static.zara.net/assets/public/9b84/c2e1/772b43038679/66892e56d16e/00526325401-e2/00526325401-e2.jpg?ts=1787126963103&w=850"
                  ]
              },
              {
                  "name": "Bottle green",
                  "hex": "#193729",
                  "reference": "5263/255",
                  "images": [
                      "https://static.zara.net/assets/public/1af7/7821/5a804a9bab28/930781622049/04087325501-p/04087325501-p.jpg?ts=1792753760573&w=850",
                      "https://static.zara.net/assets/public/76dc/9031/f1c64a6fac3c/8665ca20bfd7/04087325501-a1/04087325501-a1.jpg?ts=1792753761249&w=850",
                      "https://static.zara.net/assets/public/38f0/9746/fc974dc49a60/a9332c1a15db/04087325501-a2/04087325501-a2.jpg?ts=1792753763805&w=850",
                      "https://static.zara.net/assets/public/330e/96d8/feba4ca4a5d1/a69ac5157728/04087325501-a3/04087325501-a3.jpg?ts=1792753763241&w=850",
                      "https://static.zara.net/assets/public/d1c7/8544/992e4b448a9b/043e656b5e3a/04087325501-a4/04087325501-a4.jpg?ts=1792753761285&w=850",
                      "https://static.zara.net/assets/public/6246/fd44/92be4ee7938f/ac025f64585a/04087325501-a5/04087325501-a5.jpg?ts=1792753761116&w=850",
                      "https://static.zara.net/assets/public/26a0/9705/136741df8606/73f1187a1d8e/04087325501-e1/04087325501-e1.jpg?ts=1792750224798&w=850",
                      "https://static.zara.net/assets/public/4eab/2f79/32ad46779853/36c561d96716/04087325501-e2/04087325501-e2.jpg?ts=1792750220599&w=850"
                  ]
              },
              {
                  "name": "Neon fuchsia",
                  "hex": "#d2dbde",
                  "reference": "5263/256",
                  "images": [
                      "https://static.zara.net/assets/public/d3ca/244a/cb0b4d10854c/baf5db16dba0/00526325631-p/00526325631-p.jpg?ts=1794214000618&w=850",
                      "https://static.zara.net/assets/public/0744/2042/7b88443f9527/a28761a6fc93/00526325631-a1/00526325631-a1.jpg?ts=1794214001784&w=850",
                      "https://static.zara.net/assets/public/a432/d429/fbce41ba9540/e6253edb5629/00526325631-a2/00526325631-a2.jpg?ts=1794214000085&w=850",
                      "https://static.zara.net/assets/public/8213/79f4/e73a42aabebf/cd8310d425ec/00526325631-a3/00526325631-a3.jpg?ts=1794214000922&w=850",
                      "https://static.zara.net/assets/public/0ae1/e75b/a95b40999095/08b0b816e98f/00526325631-a4/00526325631-a4.jpg?ts=1794214001244&w=850",
                      "https://static.zara.net/assets/public/ac6d/63a0/ade846b78066/fced23876f1a/00526325631-a5/00526325631-a5.jpg?ts=1794214001675&w=850",
                      "https://static.zara.net/assets/public/e070/5278/792641a7a553/9c7a0c467b0f/00526325631-e1/00526325631-e1.jpg?ts=1793968106522&w=850",
                      "https://static.zara.net/assets/public/579c/b38e/53f347c79258/6f6a1f824185/00526325631-e2/00526325631-e2.jpg?ts=1793968104434&w=850"
                  ]
              },
              {
                  "name": "Brown",
                  "hex": "#302217",
                  "reference": "5263/257",
                  "images": [
                      "https://static.zara.net/assets/public/0501/97d3/e1614a1baeb2/add46d908403/00526325700-p/00526325700-p.jpg?ts=1787220328747&w=850",
                      "https://static.zara.net/assets/public/d511/aeb2/985a4be58a23/47ed376aa0f8/00526325700-a1/00526325700-a1.jpg?ts=1787220327847&w=850",
                      "https://static.zara.net/assets/public/9242/fe81/db8b4a89afc8/af002fde73f6/00526325700-a2/00526325700-a2.jpg?ts=1787220327996&w=850",
                      "https://static.zara.net/assets/public/a691/9a8a/10b34b9da98f/1703fa67d157/00526325700-a3/00526325700-a3.jpg?ts=1787220326559&w=850",
                      "https://static.zara.net/assets/public/c63b/e221/2b0241f1956d/4e7149b76ef6/00526325700-a4/00526325700-a4.jpg?ts=1787220329156&w=850",
                      "https://static.zara.net/assets/public/fd52/2c83/a9104613b9c5/8f4fc47ca973/00526325700-e1/00526325700-e1.jpg?ts=1787126969264&w=850",
                      "https://static.zara.net/assets/public/7efc/74b0/63d949b7bb2b/9067d284788d/00526325700-e2/00526325700-e2.jpg?ts=1787126969355&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL",
              "XXL"
          ],
          "colors": [
              "White / Navy",
              "Yellow",
              "Navy blue",
              "Bottle green",
              "Neon fuchsia",
              "Brown"
          ],
          "description": "Model height: 188 cm\n\nRelaxed fit polo shirt crafted in cotton blend piqué. Features a regular collar, a front button placket with concealed buttons, long sleeves and ribbed trims.",
          "materialCare": [
              "100% Certified Apparel Craft",
              "Machine wash at max 30°C / short spin"
          ]
      },
      {
          "id": "zara-w24",
          "slug": "basic-pique-trousers-zara-w24",
          "name": "BASIC PIQUÉ TROUSERS",
          "category": "Trousers",
          "gender": "WOMEN",
          "price": 139.0,
          "oldPrice": null,
          "discount": null,
          "reference": "5067/165",
          "image": "https://static.zara.net/assets/public/9769/d8b9/6c2f4c0cae6c/0d22d6c6af7a/05067176716-p/05067176716-p.jpg?ts=1790944214350&w=850",
          "images": [
              "https://static.zara.net/assets/public/9769/d8b9/6c2f4c0cae6c/0d22d6c6af7a/05067176716-p/05067176716-p.jpg?ts=1790944214350&w=850",
              "https://static.zara.net/assets/public/0d8e/371f/a4614d9791ea/17911360ebc7/05067176716-a1/05067176716-a1.jpg?ts=1790944214271&w=850",
              "https://static.zara.net/assets/public/125e/59d3/0e584100ad62/df1bc40f3ed0/05067176716-a2/05067176716-a2.jpg?ts=1790944214254&w=850",
              "https://static.zara.net/assets/public/2877/0bde/41fb494b9482/fb79102520bb/05067176716-a4/05067176716-a4.jpg?ts=1790944214493&w=850",
              "https://static.zara.net/assets/public/df16/52c3/2a654755a467/33ea7d9c13e4/05067176716-e1/05067176716-e1.jpg?ts=1790867962286&w=850",
              "https://static.zara.net/assets/public/2be6/4476/85e448238978/9557ff711a8a/05067176716-e2/05067176716-e2.jpg?ts=1790867961553&w=850",
              "https://static.zara.net/assets/public/8a5c/5214/eeb44d37b0ce/b0bbd9437670/05067176716-e3/05067176716-e3.jpg?ts=1790867962408&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Dark brown",
                  "hex": "#271412",
                  "reference": "5067/165",
                  "images": [
                      "https://static.zara.net/assets/public/9769/d8b9/6c2f4c0cae6c/0d22d6c6af7a/05067176716-p/05067176716-p.jpg?ts=1790944214350&w=850",
                      "https://static.zara.net/assets/public/0d8e/371f/a4614d9791ea/17911360ebc7/05067176716-a1/05067176716-a1.jpg?ts=1790944214271&w=850",
                      "https://static.zara.net/assets/public/125e/59d3/0e584100ad62/df1bc40f3ed0/05067176716-a2/05067176716-a2.jpg?ts=1790944214254&w=850",
                      "https://static.zara.net/assets/public/2877/0bde/41fb494b9482/fb79102520bb/05067176716-a4/05067176716-a4.jpg?ts=1790944214493&w=850",
                      "https://static.zara.net/assets/public/df16/52c3/2a654755a467/33ea7d9c13e4/05067176716-e1/05067176716-e1.jpg?ts=1790867962286&w=850",
                      "https://static.zara.net/assets/public/2be6/4476/85e448238978/9557ff711a8a/05067176716-e2/05067176716-e2.jpg?ts=1790867961553&w=850",
                      "https://static.zara.net/assets/public/8a5c/5214/eeb44d37b0ce/b0bbd9437670/05067176716-e3/05067176716-e3.jpg?ts=1790867962408&w=850"
                  ]
              },
              {
                  "name": "Light brown",
                  "hex": "#ac857b",
                  "reference": "5067/165",
                  "images": [
                      "https://static.zara.net/assets/public/8373/4625/7de94151ac78/cad70a3358f2/05067176730-p/05067176730-p.jpg?ts=1794476394205&w=850",
                      "https://static.zara.net/assets/public/5d7d/30e3/ddfc4d6db104/312fca262280/05067176730-a1/05067176730-a1.jpg?ts=1794476394219&w=850",
                      "https://static.zara.net/assets/public/766b/1926/6fce4087a287/bf031f9ad999/05067176730-a2/05067176730-a2.jpg?ts=1794476393993&w=850",
                      "https://static.zara.net/assets/public/c803/9f7c/a3c147e897ae/6249c6e498a1/05067176730-e1/05067176730-e1.jpg?ts=1790868015711&w=850",
                      "https://static.zara.net/assets/public/1ba8/f4f9/0c434c73b56a/3934561428c1/05067176730-e2/05067176730-e2.jpg?ts=1790868015996&w=850",
                      "https://static.zara.net/assets/public/d0dc/fd21/3a4242fbaf9b/f1cd6fe28c4a/05067176730-e3/05067176730-e3.jpg?ts=1790868016079&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L"
          ],
          "colors": [
              "Dark brown",
              "Light brown"
          ],
          "description": "Mid-waist trousers with an internal elastic waistband. Wide-leg fit.",
          "materialCare": [
              "OUTER SHELL: 98% polyester, 2% elastane"
          ]
      },
      {
          "id": "zara-m24",
          "slug": "relaxed-fit-soft-knit-polo-shirt-zara-m24",
          "name": "SOFT STRIPED KNIT POLO SHIRT",
          "category": "Polos",
          "gender": "MEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "5536/340",
          "image": "https://static.zara.net/assets/public/9b96/cbee/3c3c4a01b02c/ec075a48d3b5/05536340076-p/05536340076-p.jpg?ts=1785494937910&w=850",
          "images": [
              "https://static.zara.net/assets/public/9b96/cbee/3c3c4a01b02c/ec075a48d3b5/05536340076-p/05536340076-p.jpg?ts=1785494937910&w=850",
              "https://static.zara.net/assets/public/d6d7/d035/774742f48d87/e9028f031c08/05536340076-a1/05536340076-a1.jpg?ts=1785494937672&w=850",
              "https://static.zara.net/assets/public/553b/ed95/1d544c39bbfc/8a7dc3dc9193/05536340076-a2/05536340076-a2.jpg?ts=1785494937826&w=850",
              "https://static.zara.net/assets/public/9a4c/1995/5b9c40e48cd1/f2038ccb71a3/05536340076-a3/05536340076-a3.jpg?ts=1785494938849&w=850",
              "https://static.zara.net/assets/public/1724/f170/7370431298c7/7d50532247ff/05536340076-a4/05536340076-a4.jpg?ts=1785494939836&w=850",
              "https://static.zara.net/assets/public/410e/f0d5/c89940b49f88/a2d39f56ec10/05536340076-e1/05536340076-e1.jpg?ts=1784797588427&w=850",
              "https://static.zara.net/assets/public/8bf2/b563/8315488295d9/5215268d58bc/05536340076-e2/05536340076-e2.jpg?ts=1784797590466&w=850"
          ],
          "colorVariants": [
              {
                  "name": "red/navy",
                  "hex": "#191821",
                  "reference": "5536/340",
                  "images": [
                      "https://static.zara.net/assets/public/9b96/cbee/3c3c4a01b02c/ec075a48d3b5/05536340076-p/05536340076-p.jpg?ts=1785494937910&w=850",
                      "https://static.zara.net/assets/public/d6d7/d035/774742f48d87/e9028f031c08/05536340076-a1/05536340076-a1.jpg?ts=1785494937672&w=850",
                      "https://static.zara.net/assets/public/553b/ed95/1d544c39bbfc/8a7dc3dc9193/05536340076-a2/05536340076-a2.jpg?ts=1785494937826&w=850",
                      "https://static.zara.net/assets/public/9a4c/1995/5b9c40e48cd1/f2038ccb71a3/05536340076-a3/05536340076-a3.jpg?ts=1785494938849&w=850",
                      "https://static.zara.net/assets/public/1724/f170/7370431298c7/7d50532247ff/05536340076-a4/05536340076-a4.jpg?ts=1785494939836&w=850",
                      "https://static.zara.net/assets/public/410e/f0d5/c89940b49f88/a2d39f56ec10/05536340076-e1/05536340076-e1.jpg?ts=1784797588427&w=850",
                      "https://static.zara.net/assets/public/8bf2/b563/8315488295d9/5215268d58bc/05536340076-e2/05536340076-e2.jpg?ts=1784797590466&w=850"
                  ]
              },
              {
                  "name": "Stripes",
                  "hex": "#110f0b",
                  "reference": "5536/340",
                  "images": [
                      "https://static.zara.net/assets/public/1f86/3c06/347940d8a04f/56b57a1e4949/05536340105-p/05536340105-p.jpg?ts=1794213998850&w=850",
                      "https://static.zara.net/assets/public/fc2c/2ee3/68c34c53b495/fab9abaf228d/05536340105-a1/05536340105-a1.jpg?ts=1794213999932&w=850",
                      "https://static.zara.net/assets/public/3756/353e/3c1942ccb878/9fa1af08d73e/05536340105-a2/05536340105-a2.jpg?ts=1794213999328&w=850",
                      "https://static.zara.net/assets/public/f90a/0f3a/4f204030a563/e8d3b536003f/05536340105-a3/05536340105-a3.jpg?ts=1794213998627&w=850",
                      "https://static.zara.net/assets/public/9608/ece4/20884a218e93/27fe54f8485a/05536340105-a4/05536340105-a4.jpg?ts=1794213998481&w=850",
                      "https://static.zara.net/assets/public/3b53/2b54/367d49d38e9a/7a5ce6b2c8f6/05536340105-a5/05536340105-a5.jpg?ts=1794213998888&w=850",
                      "https://static.zara.net/assets/public/aaf5/1e6c/167a4efab96a/d6c16ab85800/05536340105-e1/05536340105-e1.jpg?ts=1794240622995&w=850",
                      "https://static.zara.net/assets/public/ed89/3b5c/b447417cb438/6ed05d6b1fb5/05536340105-e2/05536340105-e2.jpg?ts=1794240624076&w=850"
                  ]
              },
              {
                  "name": "Oyster-white",
                  "hex": "#EEDED0",
                  "reference": "5536/340",
                  "images": [
                      "https://static.zara.net/assets/public/4e0e/1c7d/7e814f7a809f/a2c8ef48f7b1/05536340251-p/05536340251-p.jpg?ts=1793620704512&w=850",
                      "https://static.zara.net/assets/public/7156/8f10/c6b14216aa3c/c348016f2845/05536340251-a1/05536340251-a1.jpg?ts=1793620704963&w=850",
                      "https://static.zara.net/assets/public/311c/dc3a/9ece422487ec/c3e4e2c10d10/05536340251-a2/05536340251-a2.jpg?ts=1793620705638&w=850",
                      "https://static.zara.net/assets/public/a0d2/eb5d/711e494e9773/0ca91b4113c6/05536340251-a3/05536340251-a3.jpg?ts=1793620705293&w=850",
                      "https://static.zara.net/assets/public/2f85/93c4/bf29455a9c34/cc0a97235fde/05536340251-a4/05536340251-a4.jpg?ts=1793620702912&w=850",
                      "https://static.zara.net/assets/public/50cb/6635/783a41179567/5cfa9fea8b4c/05536340251-e1/05536340251-e1.jpg?ts=1784797592726&w=850",
                      "https://static.zara.net/assets/public/c330/bafd/f22b49d69b8b/f6d25b919a35/05536340251-e2/05536340251-e2.jpg?ts=1784797588718&w=850"
                  ]
              },
              {
                  "name": "Red",
                  "hex": "#B2170F",
                  "reference": "5536/340",
                  "images": [
                      "https://static.zara.net/assets/public/4bd2/8b07/94b14c7f8476/01ece3664240/05536340600-p/05536340600-p.jpg?ts=1790321781969&w=850",
                      "https://static.zara.net/assets/public/4c56/dd5c/d48c4ef8a5e7/b38a76d975ef/05536340600-a1/05536340600-a1.jpg?ts=1790321784250&w=850",
                      "https://static.zara.net/assets/public/d1ac/fb13/87494af59480/e072b92eac80/05536340600-a2/05536340600-a2.jpg?ts=1790321781447&w=850",
                      "https://static.zara.net/assets/public/9b93/3bed/3a3f42d58236/66ca2d5e12d6/05536340600-a3/05536340600-a3.jpg?ts=1790321783289&w=850",
                      "https://static.zara.net/assets/public/956d/47e3/ce4c4b84a7bb/7a4c17a75e63/05536340600-a4/05536340600-a4.jpg?ts=1790321782746&w=850",
                      "https://static.zara.net/assets/public/adfe/0982/16fe4626a3d1/d3d43c4a5b39/05536340600-a5/05536340600-a5.jpg?ts=1790321782288&w=850",
                      "https://static.zara.net/assets/public/6c3e/8089/439246ddb3a2/873a85dbc953/05536340600-e1/05536340600-e1.jpg?ts=1790236150706&w=850",
                      "https://static.zara.net/assets/public/024d/b5dc/a91d45ff98c4/cee2b6c8d7e1/05536340600-e2/05536340600-e2.jpg?ts=1790236148493&w=850"
                  ]
              },
              {
                  "name": "Brown",
                  "hex": "#3D2E2D",
                  "reference": "5536/340",
                  "images": [
                      "https://static.zara.net/assets/public/602e/823e/62fa41309f9f/30d7a910f455/05536340700-p/05536340700-p.jpg?ts=1793620702159&w=850",
                      "https://static.zara.net/assets/public/0a61/f840/536840f2a48c/9f65d1c72dc6/05536340700-a1/05536340700-a1.jpg?ts=1793620701136&w=850",
                      "https://static.zara.net/assets/public/8957/9578/e37446e9ae58/30571937ed51/05536340700-a2/05536340700-a2.jpg?ts=1793620702390&w=850",
                      "https://static.zara.net/assets/public/e1b8/b32a/764d42748da9/349b4da418a2/05536340700-a3/05536340700-a3.jpg?ts=1793620701357&w=850",
                      "https://static.zara.net/assets/public/c6f1/baad/966b486e8a6c/187ecce87fc7/05536340700-a4/05536340700-a4.jpg?ts=1793620701665&w=850",
                      "https://static.zara.net/assets/public/afb4/0815/c82344509524/23177af07695/05536340700-e1/05536340700-e1.jpg?ts=1784797587777&w=850",
                      "https://static.zara.net/assets/public/2a16/1a7e/15d4477dad29/57d989640895/05536340700-e2/05536340700-e2.jpg?ts=1784797588394&w=850"
                  ]
              },
              {
                  "name": "camel",
                  "hex": "#BCB0A2",
                  "reference": "5536/340",
                  "images": [
                      "https://static.zara.net/assets/public/87b1/e748/e19b45d2a9d9/44993297401d/05536340707-p/05536340707-p.jpg?ts=1791300069081&w=850",
                      "https://static.zara.net/assets/public/0493/f006/88fb45a08b29/665c0d0f35f0/05536340707-a1/05536340707-a1.jpg?ts=1791300070923&w=850",
                      "https://static.zara.net/assets/public/ffda/5298/4d344c839a34/f651114ebb37/05536340707-a2/05536340707-a2.jpg?ts=1791300069089&w=850",
                      "https://static.zara.net/assets/public/842b/e1ad/a5c94d2ca8c0/3334757b8b8e/05536340707-a3/05536340707-a3.jpg?ts=1791300068777&w=850",
                      "https://static.zara.net/assets/public/d293/6b4a/f37d4a828035/7d7775d460c8/05536340707-a4/05536340707-a4.jpg?ts=1791300071255&w=850",
                      "https://static.zara.net/assets/public/400a/5d67/c35347ea975d/3d56964020f5/05536340707-a5/05536340707-a5.jpg?ts=1791300068657&w=850",
                      "https://static.zara.net/assets/public/651e/4f64/8ec54dfca554/45c0d7166c61/05536340707-e1/05536340707-e1.jpg?ts=1791289428407&w=850",
                      "https://static.zara.net/assets/public/f460/69bf/e15d485296f2/c8df94dc00c8/05536340707-e2/05536340707-e2.jpg?ts=1791289428678&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "red/navy",
              "Stripes",
              "Oyster-white",
              "Red",
              "Brown",
              "camel"
          ],
          "description": "Model height: 185 cm\n\nRegular fit knitted polo shirt crafted from spun yarn with a soft-touch viscose blend. Featuring a regular collar, front button fastening, long sleeves and side vents at the hem.",
          "materialCare": [
              "OUTER SHELL: 50% viscose, 30% polyester, 20% polyamide"
          ]
      },
      {
          "id": "zara-w25",
          "slug": "split-suede-flat-loafers-zara-w25",
          "name": "SPLIT SUEDE FLAT LOAFERS",
          "category": "Shoes",
          "gender": "WOMEN",
          "price": 219.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1250/481",
          "image": "https://static.zara.net/assets/public/96f4/5bf3/26774d27b7d2/d7691f9dc4a8/12517710107-p/12517710107-p.jpg?ts=1767866934935&w=850",
          "images": [
              "https://static.zara.net/assets/public/96f4/5bf3/26774d27b7d2/d7691f9dc4a8/12517710107-p/12517710107-p.jpg?ts=1767866934935&w=850",
              "https://static.zara.net/assets/public/ee8c/d8ad/366a4bf18ad7/fcb6152c30c7/12517710107-a1/12517710107-a1.jpg?ts=1767866935261&w=850",
              "https://static.zara.net/assets/public/7546/dc49/b65c49bf9c1e/1c6749552abd/12517710107-e1/12517710107-e1.jpg?ts=1763382695970&w=850",
              "https://static.zara.net/assets/public/8347/f39b/f10646b78c2b/2d612df7c3c6/12517710107-e2/12517710107-e2.jpg?ts=1763643270750&w=850",
              "https://static.zara.net/assets/public/96df/d25b/e2dc4b52997a/6d6932b10f4c/12517710107-e3/12517710107-e3.jpg?ts=1763382696370&w=850",
              "https://static.zara.net/assets/public/e2b5/d28a/f4254f80a247/26bf91f11210/12517710107-e4/12517710107-e4.jpg?ts=1763382696253&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Sand Brown",
                  "hex": "#B68D62",
                  "reference": "1250/481",
                  "images": [
                      "https://static.zara.net/assets/public/96f4/5bf3/26774d27b7d2/d7691f9dc4a8/12517710107-p/12517710107-p.jpg?ts=1767866934935&w=850",
                      "https://static.zara.net/assets/public/ee8c/d8ad/366a4bf18ad7/fcb6152c30c7/12517710107-a1/12517710107-a1.jpg?ts=1767866935261&w=850",
                      "https://static.zara.net/assets/public/7546/dc49/b65c49bf9c1e/1c6749552abd/12517710107-e1/12517710107-e1.jpg?ts=1763382695970&w=850",
                      "https://static.zara.net/assets/public/8347/f39b/f10646b78c2b/2d612df7c3c6/12517710107-e2/12517710107-e2.jpg?ts=1763643270750&w=850",
                      "https://static.zara.net/assets/public/96df/d25b/e2dc4b52997a/6d6932b10f4c/12517710107-e3/12517710107-e3.jpg?ts=1763382696370&w=850",
                      "https://static.zara.net/assets/public/e2b5/d28a/f4254f80a247/26bf91f11210/12517710107-e4/12517710107-e4.jpg?ts=1763382696253&w=850"
                  ]
              },
              {
                  "name": "Ice",
                  "hex": "#E4D2BE",
                  "reference": "1250/481",
                  "images": [
                      "https://static.zara.net/assets/public/95a9/86bd/f76a4b6e9c16/341f3af2dcbf/12504811805-p/12504811805-p.jpg?ts=1785831458069&w=850",
                      "https://static.zara.net/assets/public/c3be/7d73/2bcd490d9b38/9fe100721d5d/12504811805-a1/12504811805-a1.jpg?ts=1785831456656&w=850",
                      "https://static.zara.net/assets/public/4188/da7b/12734398be42/c40ec73925b0/12504811805-e1/12504811805-e1.jpg?ts=1784730515869&w=850",
                      "https://static.zara.net/assets/public/2ccc/f4dc/1ce647fda879/f498ee709b99/12504811805-e2/12504811805-e2.jpg?ts=1784730515920&w=850",
                      "https://static.zara.net/assets/public/9026/3783/28144ce281bc/fea60f7dcea0/12504811805-e3/12504811805-e3.jpg?ts=1784730516302&w=850",
                      "https://static.zara.net/assets/public/ddbc/e792/2ca049028e6f/02d089bbcbe2/12504811805-e4/12504811805-e4.jpg?ts=1784730514992&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "35",
              "36",
              "37",
              "38",
              "39",
              "40",
              "41",
              "42"
          ],
          "colors": [
              "Sand Brown",
              "Ice"
          ],
          "description": "Model height: 177 cm\n\nFlat split suede loafers. Raised vamp detail. Rubberised-effect sole. Round toe.\n\nSole height: 2 cm / 0.7″",
          "materialCare": [
              "UPPER: 100% cow leather",
              "LINING: 100% polyester",
              "SOLE: 100% sbs",
              "INSOLE: 100% polyester"
          ]
      },
      {
          "id": "zara-m25",
          "slug": "purl-knit-quarter-zip-jumper-zara-m25",
          "name": "PURL KNIT QUARTER-ZIP JUMPER",
          "category": "Knitwear",
          "gender": "MEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "3332/310",
          "image": "https://static.zara.net/assets/public/bbbc/0cf7/21c74a33b883/ae60a4f237cb/03332310401-p/03332310401-p.jpg?ts=1788763982956&w=850",
          "images": [
              "https://static.zara.net/assets/public/bbbc/0cf7/21c74a33b883/ae60a4f237cb/03332310401-p/03332310401-p.jpg?ts=1788763982956&w=850",
              "https://static.zara.net/assets/public/a220/79e2/50b942c380ae/840e1bb8f3d1/03332310401-a1/03332310401-a1.jpg?ts=1788763983923&w=850",
              "https://static.zara.net/assets/public/bbad/2e29/f1de4854ab47/743c47253bcb/03332310401-a2/03332310401-a2.jpg?ts=1788763981958&w=850",
              "https://static.zara.net/assets/public/05f8/f5e8/b986418ab2b1/c5a281bc3ed8/03332310401-a3/03332310401-a3.jpg?ts=1788763982407&w=850",
              "https://static.zara.net/assets/public/0f83/3cbe/f5674362a492/c7b1e758d38d/03332310401-e1/03332310401-e1.jpg?ts=1784026748086&w=850",
              "https://static.zara.net/assets/public/ce04/de32/ae784a7d896d/6a49cc57e565/03332310401-e2/03332310401-e2.jpg?ts=1784026748079&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Navy blue",
                  "hex": "#1E262D",
                  "reference": "3332/310",
                  "images": [
                      "https://static.zara.net/assets/public/bbbc/0cf7/21c74a33b883/ae60a4f237cb/03332310401-p/03332310401-p.jpg?ts=1788763982956&w=850",
                      "https://static.zara.net/assets/public/a220/79e2/50b942c380ae/840e1bb8f3d1/03332310401-a1/03332310401-a1.jpg?ts=1788763983923&w=850",
                      "https://static.zara.net/assets/public/bbad/2e29/f1de4854ab47/743c47253bcb/03332310401-a2/03332310401-a2.jpg?ts=1788763981958&w=850",
                      "https://static.zara.net/assets/public/05f8/f5e8/b986418ab2b1/c5a281bc3ed8/03332310401-a3/03332310401-a3.jpg?ts=1788763982407&w=850",
                      "https://static.zara.net/assets/public/0f83/3cbe/f5674362a492/c7b1e758d38d/03332310401-e1/03332310401-e1.jpg?ts=1784026748086&w=850",
                      "https://static.zara.net/assets/public/ce04/de32/ae784a7d896d/6a49cc57e565/03332310401-e2/03332310401-e2.jpg?ts=1784026748079&w=850"
                  ]
              },
              {
                  "name": "Mid-ecru",
                  "hex": "#DFD3C2",
                  "reference": "3332/310",
                  "images": [
                      "https://static.zara.net/assets/public/96e0/24e0/158840c5ac1a/997605aee93b/03332310715-p/03332310715-p.jpg?ts=1788165229169&w=850",
                      "https://static.zara.net/assets/public/6d82/d9c0/c2ef4cfeaad0/5f53e1983d24/03332310715-a1/03332310715-a1.jpg?ts=1788165229937&w=850",
                      "https://static.zara.net/assets/public/06f3/6c9e/d7374bfd8350/113280689209/03332310715-a2/03332310715-a2.jpg?ts=1788165229678&w=850",
                      "https://static.zara.net/assets/public/1930/b390/c2b341f394ea/7cc5ec6b7b98/03332310715-a3/03332310715-a3.jpg?ts=1788165229480&w=850",
                      "https://static.zara.net/assets/public/8040/262c/15114ac3b192/98a456765401/03332310715-a4/03332310715-a4.jpg?ts=1788165228934&w=850",
                      "https://static.zara.net/assets/public/7623/2a30/703341b3b5fa/517e45f2de2b/03332310715-a5/03332310715-a5.jpg?ts=1788165229659&w=850",
                      "https://static.zara.net/assets/public/a26a/5206/8e2a4bbeb8e1/b3b22f68aff9/03332310715-e1/03332310715-e1.jpg?ts=1784035507779&w=850",
                      "https://static.zara.net/assets/public/7cb9/1950/2af149548a0b/70e7d21acc15/03332310715-e2/03332310715-e2.jpg?ts=1784035504992&w=850"
                  ]
              },
              {
                  "name": "Chocolate",
                  "hex": "#2B2321",
                  "reference": "3332/310",
                  "images": [
                      "https://static.zara.net/assets/public/64de/35e4/36f44d21a5bf/3bc20a53bce6/03332310717-p/03332310717-p.jpg?ts=1788165229082&w=850",
                      "https://static.zara.net/assets/public/c858/dd62/a83c4e6ca4b1/c953493772ef/03332310717-a1/03332310717-a1.jpg?ts=1788165228462&w=850",
                      "https://static.zara.net/assets/public/c54f/07ef/88114992b8b6/1b22f5114666/03332310717-a2/03332310717-a2.jpg?ts=1788165229501&w=850",
                      "https://static.zara.net/assets/public/9fec/8fd6/eaad493881d5/889ae24bce86/03332310717-a3/03332310717-a3.jpg?ts=1788165229254&w=850",
                      "https://static.zara.net/assets/public/9116/3548/de6a4f528176/e1bafe0c3faa/03332310717-a4/03332310717-a4.jpg?ts=1788165228111&w=850",
                      "https://static.zara.net/assets/public/7af8/6888/cf3844a8b052/a1054fa35e8d/03332310717-a5/03332310717-a5.jpg?ts=1794313184522&w=850",
                      "https://static.zara.net/assets/public/1b91/c56a/e5414837b508/2e5c5fa5f878/03332310717-e1/03332310717-e1.jpg?ts=1784035508397&w=850",
                      "https://static.zara.net/assets/public/053c/c3bb/a50d40d0abc2/34de6d4b26ad/03332310717-e2/03332310717-e2.jpg?ts=1784035509137&w=850"
                  ]
              },
              {
                  "name": "Anthracite Grey",
                  "hex": "#312f32",
                  "reference": "3332/310",
                  "images": [
                      "https://static.zara.net/assets/public/5f54/d76a/cbef4e26b597/95e4defa170e/03284310801-p/03284310801-p.jpg?ts=1794212142693&w=850",
                      "https://static.zara.net/assets/public/4eeb/33ab/dc6f443c9419/669312f8e919/03284310801-a1/03284310801-a1.jpg?ts=1794212143576&w=850",
                      "https://static.zara.net/assets/public/64af/830d/d2d04aecbc84/4463f77b0a05/03284310801-a2/03284310801-a2.jpg?ts=1794212142237&w=850",
                      "https://static.zara.net/assets/public/e56b/94b3/7a5646ec9ca6/464da76cc608/03284310801-a3/03284310801-a3.jpg?ts=1794212142402&w=850",
                      "https://static.zara.net/assets/public/f107/d84a/ab6147e284d9/bffc235e4ddb/03284310801-a4/03284310801-a4.jpg?ts=1794212141542&w=850",
                      "https://static.zara.net/assets/public/e828/7d4e/51734460bf50/953104ce05d8/03284310801-a5/03284310801-a5.jpg?ts=1794212143886&w=850",
                      "https://static.zara.net/assets/public/6fcc/9f4f/cd8f4280909f/be569fc8a7b6/03284310801-e1/03284310801-e1.jpg?ts=1793970095013&w=850",
                      "https://static.zara.net/assets/public/529b/4f50/6a9847de9866/ebb380393b96/03284310801-e2/03284310801-e2.jpg?ts=1793970095696&w=850"
                  ]
              },
              {
                  "name": "Grey marl",
                  "hex": "#8A8580",
                  "reference": "3332/310",
                  "images": [
                      "https://static.zara.net/assets/public/f4c4/b472/e7894acea606/579326330d4f/03284310803-p/03284310803-p.jpg?ts=1788763983337&w=850",
                      "https://static.zara.net/assets/public/314f/5d51/c7c940548ff9/5b9470efc00e/03284310803-a1/03284310803-a1.jpg?ts=1788763982885&w=850",
                      "https://static.zara.net/assets/public/b405/2972/aff04ad4b1ab/04c765ccb4fc/03284310803-a2/03284310803-a2.jpg?ts=1788763983762&w=850",
                      "https://static.zara.net/assets/public/7183/3bde/691c4092a93f/7ea8f74e4e4d/03284310803-a3/03284310803-a3.jpg?ts=1788763983660&w=850",
                      "https://static.zara.net/assets/public/41b2/daa6/80bf49c5967a/008c35899967/03284310803-a4/03284310803-a4.jpg?ts=1788763983281&w=850",
                      "https://static.zara.net/assets/public/e62c/d322/bdb3403b9c72/12da8f048fee/03284310803-e1/03284310803-e1.jpg?ts=1784035504580&w=850",
                      "https://static.zara.net/assets/public/80d4/a23f/532e444eb428/ee20de7a19de/03284310803-e2/03284310803-e2.jpg?ts=1784035504012&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Navy blue",
              "Mid-ecru",
              "Chocolate",
              "Anthracite Grey",
              "Grey marl"
          ],
          "description": "Model height: 188 cm\n\nRegular fit jumper made from cotton yarn. High neck with a front zip fastening. Long sleeves. Ribbed trims.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-w26",
          "slug": "fabric-ballet-flats-zara-w26",
          "name": "FABRIC BALLET FLATS",
          "category": "Shoes",
          "gender": "WOMEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1254/381",
          "image": "https://static.zara.net/assets/public/9490/9e55/1e8f4c7c86fc/f8560bfe890a/03564181044-000-p/03564181044-000-p.jpg?ts=1786964339514&w=850",
          "images": [
              "https://static.zara.net/assets/public/9490/9e55/1e8f4c7c86fc/f8560bfe890a/03564181044-000-p/03564181044-000-p.jpg?ts=1786964339514&w=850",
              "https://static.zara.net/assets/public/632b/d094/23854d778f4b/a24849a684bc/12543810202-e1/12543810202-e1.jpg?ts=1786442207973&w=850",
              "https://static.zara.net/assets/public/f7e1/fbea/3cb34f358353/58e281946d03/12543810202-e2/12543810202-e2.jpg?ts=1786442207562&w=850",
              "https://static.zara.net/assets/public/01a2/0d8c/213c429ca4b2/912b7dcfe857/12543810202-e3/12543810202-e3.jpg?ts=1786442206748&w=850",
              "https://static.zara.net/assets/public/c59c/317e/b36841108494/d389d6348bab/12543810202-e4/12543810202-e4.jpg?ts=1786442208498&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Multicoloured",
                  "hex": "#EEDED0",
                  "reference": "1254/381",
                  "images": [
                      "https://static.zara.net/assets/public/9490/9e55/1e8f4c7c86fc/f8560bfe890a/03564181044-000-p/03564181044-000-p.jpg?ts=1786964339514&w=850",
                      "https://static.zara.net/assets/public/632b/d094/23854d778f4b/a24849a684bc/12543810202-e1/12543810202-e1.jpg?ts=1786442207973&w=850",
                      "https://static.zara.net/assets/public/f7e1/fbea/3cb34f358353/58e281946d03/12543810202-e2/12543810202-e2.jpg?ts=1786442207562&w=850",
                      "https://static.zara.net/assets/public/01a2/0d8c/213c429ca4b2/912b7dcfe857/12543810202-e3/12543810202-e3.jpg?ts=1786442206748&w=850",
                      "https://static.zara.net/assets/public/c59c/317e/b36841108494/d389d6348bab/12543810202-e4/12543810202-e4.jpg?ts=1786442208498&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "35",
              "36",
              "37",
              "38",
              "39",
              "40",
              "41",
              "42"
          ],
          "colors": [
              "Multicoloured"
          ],
          "description": "Fabric ballet flats. Strap closure with a metal appliqué on the instep. Round toe.\n\nSole height: 1 cm",
          "materialCare": [
              "UPPER: 100% polyester",
              "LINING: 100% polyester",
              "SOLE: 100% polyurethane thermoplastic",
              "INSOLE: 100% polyester"
          ]
      },
      {
          "id": "zara-m26",
          "slug": "purl-knit-regular-fit-jumper-zara-m26",
          "name": "PURL KNIT REGULAR FIT JUMPER",
          "category": "Knitwear",
          "gender": "MEN",
          "price": 179.0,
          "oldPrice": null,
          "discount": null,
          "reference": "3284/341",
          "image": "https://static.zara.net/assets/public/41e0/bb12/107a433bbf3f/0477123c3ff6/03284333401-p/03284333401-p.jpg?ts=1788763981527&w=850",
          "images": [
              "https://static.zara.net/assets/public/41e0/bb12/107a433bbf3f/0477123c3ff6/03284333401-p/03284333401-p.jpg?ts=1788763981527&w=850",
              "https://static.zara.net/assets/public/83c0/4c01/86f9477e8b84/54097ef39a8e/03284333401-a1/03284333401-a1.jpg?ts=1788763981331&w=850",
              "https://static.zara.net/assets/public/bfb8/66c7/a0c343e18447/85b2736bfb3f/03284333401-a2/03284333401-a2.jpg?ts=1788763981712&w=850",
              "https://static.zara.net/assets/public/3aff/0186/edd44954b1d2/dcb5e8cf68a9/03284333401-a3/03284333401-a3.jpg?ts=1788763981109&w=850",
              "https://static.zara.net/assets/public/18b5/0583/0e654989905e/facf89a7fb3c/03284333401-a4/03284333401-a4.jpg?ts=1788763981727&w=850",
              "https://static.zara.net/assets/public/6b21/9054/39fa4731b828/4fe0afe24ba3/03284333401-a5/03284333401-a5.jpg?ts=1794313369559&w=850",
              "https://static.zara.net/assets/public/d336/e0d4/d8804d95bc88/5e44e7e6adf3/03284333401-e1/03284333401-e1.jpg?ts=1782989595584&w=850",
              "https://static.zara.net/assets/public/99b9/e514/a93c4332b25e/18ae2cfc0f6b/03284333401-e2/03284333401-e2.jpg?ts=1782989592787&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Navy blue",
                  "hex": "#25242D",
                  "reference": "3284/341",
                  "images": [
                      "https://static.zara.net/assets/public/41e0/bb12/107a433bbf3f/0477123c3ff6/03284333401-p/03284333401-p.jpg?ts=1788763981527&w=850",
                      "https://static.zara.net/assets/public/83c0/4c01/86f9477e8b84/54097ef39a8e/03284333401-a1/03284333401-a1.jpg?ts=1788763981331&w=850",
                      "https://static.zara.net/assets/public/bfb8/66c7/a0c343e18447/85b2736bfb3f/03284333401-a2/03284333401-a2.jpg?ts=1788763981712&w=850",
                      "https://static.zara.net/assets/public/3aff/0186/edd44954b1d2/dcb5e8cf68a9/03284333401-a3/03284333401-a3.jpg?ts=1788763981109&w=850",
                      "https://static.zara.net/assets/public/18b5/0583/0e654989905e/facf89a7fb3c/03284333401-a4/03284333401-a4.jpg?ts=1788763981727&w=850",
                      "https://static.zara.net/assets/public/6b21/9054/39fa4731b828/4fe0afe24ba3/03284333401-a5/03284333401-a5.jpg?ts=1794313369559&w=850",
                      "https://static.zara.net/assets/public/d336/e0d4/d8804d95bc88/5e44e7e6adf3/03284333401-e1/03284333401-e1.jpg?ts=1782989595584&w=850",
                      "https://static.zara.net/assets/public/99b9/e514/a93c4332b25e/18ae2cfc0f6b/03284333401-e2/03284333401-e2.jpg?ts=1782989592787&w=850"
                  ]
              },
              {
                  "name": "Ecru",
                  "hex": "#EFE4D2",
                  "reference": "3284/341",
                  "images": [
                      "https://static.zara.net/assets/public/5084/75bf/9fa64f1f86a1/e08d7a4ce88e/03284341712-p/03284341712-p.jpg?ts=1788763984031&w=850",
                      "https://static.zara.net/assets/public/8199/22f3/4c904142967d/c8db2dc657a7/03284341712-a1/03284341712-a1.jpg?ts=1788763984118&w=850",
                      "https://static.zara.net/assets/public/00e1/558d/a89547c5ba00/e33d3a461c91/03284341712-a2/03284341712-a2.jpg?ts=1788763985275&w=850",
                      "https://static.zara.net/assets/public/d52e/db20/489248b08e9f/2564c94f7807/03284341712-a3/03284341712-a3.jpg?ts=1788763984915&w=850",
                      "https://static.zara.net/assets/public/3c0c/94cc/749447c7944b/1bd14747a80d/03284341712-a4/03284341712-a4.jpg?ts=1788763982989&w=850",
                      "https://static.zara.net/assets/public/aee4/f728/d93045a8bad2/f545505a6a1b/03284333712-e1/03284333712-e1.jpg?ts=1782989589060&w=850",
                      "https://static.zara.net/assets/public/5821/4402/dec94b9a80fa/b0ab591fbe7a/03284333712-e2/03284333712-e2.jpg?ts=1782989590057&w=850"
                  ]
              },
              {
                  "name": "Brown marl",
                  "hex": "#302217",
                  "reference": "3284/341",
                  "images": [
                      "https://static.zara.net/assets/public/4f22/1470/f288469cbcba/4e580daf5fe3/03284341724-p/03284341724-p.jpg?ts=1788763986031&w=850",
                      "https://static.zara.net/assets/public/3305/8284/08914587bfc4/d27a4934eb2c/03284341724-a1/03284341724-a1.jpg?ts=1788763984177&w=850",
                      "https://static.zara.net/assets/public/2bc3/77a9/33aa438390ba/e3130fd69097/03284341724-a2/03284341724-a2.jpg?ts=1788763985660&w=850",
                      "https://static.zara.net/assets/public/acb8/d39d/c08646efa52e/ac6317e23949/03284341724-a3/03284341724-a3.jpg?ts=1788763984983&w=850",
                      "https://static.zara.net/assets/public/33c2/7037/9a8e452fbc32/2a9c532316b8/03284341724-a4/03284341724-a4.jpg?ts=1788763984232&w=850",
                      "https://static.zara.net/assets/public/ded8/3226/596f4d07aeb6/874e1d0b0df2/03284341724-e1/03284341724-e1.jpg?ts=1786000827089&w=850",
                      "https://static.zara.net/assets/public/fe7b/5ede/382c4f33b7ec/f073f6b4d28c/03284341724-e2/03284341724-e2.jpg?ts=1786000827675&w=850"
                  ]
              },
              {
                  "name": "Grey marl",
                  "hex": "#706660",
                  "reference": "3284/341",
                  "images": [
                      "https://static.zara.net/assets/public/3aab/dc83/77cd416cb12b/9523629e732d/03284341803-p/03284341803-p.jpg?ts=1788763982397&w=850",
                      "https://static.zara.net/assets/public/8945/b359/7ff6450a94bc/95a73785d6b1/03284341803-a1/03284341803-a1.jpg?ts=1788763981560&w=850",
                      "https://static.zara.net/assets/public/2d61/6548/1595430e9ebb/e1e6a8d44149/03284341803-a2/03284341803-a2.jpg?ts=1788763981941&w=850",
                      "https://static.zara.net/assets/public/6f93/3d4b/47c54f9c95f5/c9f033abb7fe/03284341803-a3/03284341803-a3.jpg?ts=1788763981677&w=850",
                      "https://static.zara.net/assets/public/4038/30eb/30cc40f2a19a/14c0135b5818/03284341803-e1/03284341803-e1.jpg?ts=1786008368718&w=850",
                      "https://static.zara.net/assets/public/a44f/0cb9/0ec149c18805/29aaf50e9ccf/03284341803-e2/03284341803-e2.jpg?ts=1786008369495&w=850"
                  ]
              },
              {
                  "name": "charcoal grey",
                  "hex": "#1d1d1b",
                  "reference": "3284/341",
                  "images": [
                      "https://static.zara.net/assets/public/bbba/8bd2/d5a74339a09e/34c0c936955c/03284341823-p/03284341823-p.jpg?ts=1794213998238&w=850",
                      "https://static.zara.net/assets/public/3190/bc33/0d01449e9d24/5d6e46dbb5c7/03284341823-a1/03284341823-a1.jpg?ts=1794213999087&w=850",
                      "https://static.zara.net/assets/public/ecdc/a23b/1a064bd1a108/816996b245c5/03284341823-a2/03284341823-a2.jpg?ts=1794213998189&w=850",
                      "https://static.zara.net/assets/public/2d9d/1e53/9a504c95ad1b/3abe40d0a18d/03284341823-a3/03284341823-a3.jpg?ts=1794213999381&w=850",
                      "https://static.zara.net/assets/public/8fbe/b28c/a1874cc38677/a5863b1c61cd/03284341823-a4/03284341823-a4.jpg?ts=1794213998369&w=850",
                      "https://static.zara.net/assets/public/f45c/e8a4/138e4ec1a063/a55a2558b4bd/03284341823-a5/03284341823-a5.jpg?ts=1794213999379&w=850",
                      "https://static.zara.net/assets/public/1834/575b/2c4a4376ab9c/709e2ce20a24/03284341823-e1/03284341823-e1.jpg?ts=1794240608974&w=850",
                      "https://static.zara.net/assets/public/1864/433d/ba384a82a579/6b84de11fa9f/03284341823-e2/03284341823-e2.jpg?ts=1794240608572&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "S",
              "M",
              "L",
              "XL"
          ],
          "colors": [
              "Navy blue",
              "Ecru",
              "Brown marl",
              "Grey marl",
              "charcoal grey"
          ],
          "description": "Model height: 185 cm\n\nRegular fit jumper crafted from cotton yarn. Featuring a round neck, long sleeves and ribbed trims.",
          "materialCare": [
              "OUTER SHELL: 100% cotton"
          ]
      },
      {
          "id": "zara-w27",
          "slug": "flap-shoulder-bag-zara-w27",
          "name": "FLAP SHOULDER BAG",
          "category": "Bags",
          "gender": "WOMEN",
          "price": 129.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1620/971",
          "image": "https://static.zara.net/assets/public/0cd5/d86c/92704da3b924/8b6868b6d6c2/16209710600-e1/16209710600-e1.jpg?ts=1777286757729&w=850",
          "images": [
              "https://static.zara.net/assets/public/0cd5/d86c/92704da3b924/8b6868b6d6c2/16209710600-e1/16209710600-e1.jpg?ts=1777286757729&w=850",
              "https://static.zara.net/assets/public/3a00/2a30/cf28465bb1ff/917d692eff5c/16209710600-e2/16209710600-e2.jpg?ts=1766144252345&w=850",
              "https://static.zara.net/assets/public/268c/4513/528640f09530/9a3731e5c59f/16209710600-e3/16209710600-e3.jpg?ts=1766144252315&w=850",
              "https://static.zara.net/assets/public/f6fe/5511/7d4a4f40a506/cacc01b9f6cd/16209710600-e4/16209710600-e4.jpg?ts=1766144252612&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Red",
                  "hex": "#591C24",
                  "reference": "1620/971",
                  "images": [
                      "https://static.zara.net/assets/public/0cd5/d86c/92704da3b924/8b6868b6d6c2/16209710600-e1/16209710600-e1.jpg?ts=1777286757729&w=850",
                      "https://static.zara.net/assets/public/3a00/2a30/cf28465bb1ff/917d692eff5c/16209710600-e2/16209710600-e2.jpg?ts=1766144252345&w=850",
                      "https://static.zara.net/assets/public/268c/4513/528640f09530/9a3731e5c59f/16209710600-e3/16209710600-e3.jpg?ts=1766144252315&w=850",
                      "https://static.zara.net/assets/public/f6fe/5511/7d4a4f40a506/cacc01b9f6cd/16209710600-e4/16209710600-e4.jpg?ts=1766144252612&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "1620/971",
                  "images": [
                      "https://static.zara.net/assets/public/0fd7/1371/12b64576b4ba/b419dc7364d8/04470011406-016-a2/04470011406-016-a2.jpg?ts=1776430338823&w=850",
                      "https://static.zara.net/assets/public/81f9/3a5e/1a9f40729b14/3a5f84ab35cb/16920710800-e1/16920710800-e1.jpg?ts=1771836086955&w=850",
                      "https://static.zara.net/assets/public/7477/cf3d/cca443ceb614/74ef0bad6599/16920710800-e2/16920710800-e2.jpg?ts=1771836087452&w=850",
                      "https://static.zara.net/assets/public/d9a0/117c/aea4490d9333/701804caaeb6/16920710800-e3/16920710800-e3.jpg?ts=1771836087842&w=850",
                      "https://static.zara.net/assets/public/c785/e8fa/142946649f96/c78807708e0e/16920710800-e4/16920710800-e4.jpg?ts=1771836087961&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "ONE SIZE ONLY"
          ],
          "colors": [
              "Red",
              "Black"
          ],
          "description": "Shoulder bag. Adjustable shoulder strap. Inside zip pocket. Magnetic button and flap closure.\n\nHeight x Length x Width: 12.5 x 26.5 x 5.5 cm / 4.9 x 10.4 x 2.1″",
          "materialCare": [
              "OUTER SHELL: 100% polyurethane",
              "LINING: 100% polyester"
          ]
      },
      {
          "id": "zara-m27",
          "slug": "leather-trainers-zara-m27",
          "name": "LEATHER TRAINERS",
          "category": "Shoes",
          "gender": "MEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1220/982",
          "image": "https://static.zara.net/assets/public/de64/065b/e35048db8992/edce5fa32f17/12209820131-a2/12209820131-a2.jpg?ts=1787643357282&w=850",
          "images": [
              "https://static.zara.net/assets/public/de64/065b/e35048db8992/edce5fa32f17/12209820131-a2/12209820131-a2.jpg?ts=1787643357282&w=850",
              "https://static.zara.net/assets/public/13c9/a433/bba642b7b8ef/565d803f3534/12209820131-a1/12209820131-a1.jpg?ts=1787643357624&w=850",
              "https://static.zara.net/assets/public/f9f1/98c2/179d4c3a931e/431279a8acc5/12209820131-a3/12209820131-a3.jpg?ts=1787643356850&w=850",
              "https://static.zara.net/assets/public/711d/936e/eca54fd4ae0e/a5545c3aab7e/12209820131-e1/12209820131-e1.jpg?ts=1785166991522&w=850",
              "https://static.zara.net/assets/public/5ab0/ef49/a640409ea23c/29e8deaeef24/12209820131-e2/12209820131-e2.jpg?ts=1785166993363&w=850",
              "https://static.zara.net/assets/public/c892/e8f5/eb444e1b9ba7/a1d39ff2fb2b/12209820131-e3/12209820131-e3.jpg?ts=1785166993138&w=850",
              "https://static.zara.net/assets/public/a5b9/537d/348f4d2aac09/bb8fa8e23a1c/12209820131-e4/12209820131-e4.jpg?ts=1785166993134&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Taupe Grey",
                  "hex": "#CEC3B2",
                  "reference": "1220/982",
                  "images": [
                      "https://static.zara.net/assets/public/de64/065b/e35048db8992/edce5fa32f17/12209820131-a2/12209820131-a2.jpg?ts=1787643357282&w=850",
                      "https://static.zara.net/assets/public/13c9/a433/bba642b7b8ef/565d803f3534/12209820131-a1/12209820131-a1.jpg?ts=1787643357624&w=850",
                      "https://static.zara.net/assets/public/f9f1/98c2/179d4c3a931e/431279a8acc5/12209820131-a3/12209820131-a3.jpg?ts=1787643356850&w=850",
                      "https://static.zara.net/assets/public/711d/936e/eca54fd4ae0e/a5545c3aab7e/12209820131-e1/12209820131-e1.jpg?ts=1785166991522&w=850",
                      "https://static.zara.net/assets/public/5ab0/ef49/a640409ea23c/29e8deaeef24/12209820131-e2/12209820131-e2.jpg?ts=1785166993363&w=850",
                      "https://static.zara.net/assets/public/c892/e8f5/eb444e1b9ba7/a1d39ff2fb2b/12209820131-e3/12209820131-e3.jpg?ts=1785166993138&w=850",
                      "https://static.zara.net/assets/public/a5b9/537d/348f4d2aac09/bb8fa8e23a1c/12209820131-e4/12209820131-e4.jpg?ts=1785166993134&w=850"
                  ]
              },
              {
                  "name": "Grey",
                  "hex": "#403E3D",
                  "reference": "1220/982",
                  "images": [
                      "https://static.zara.net/assets/public/4c14/3a41/ef004081b947/624e6307eff2/12209820802-a2/12209820802-a2.jpg?ts=1786629981255&w=850",
                      "https://static.zara.net/assets/public/a641/2121/cae6493aa629/768136d8d95d/12209820802-a1/12209820802-a1.jpg?ts=1786629983478&w=850",
                      "https://static.zara.net/assets/public/e33a/cb9d/133b44bdaa11/82d0e6bfd63e/12209820802-a3/12209820802-a3.jpg?ts=1786629981420&w=850",
                      "https://static.zara.net/assets/public/173e/c382/a1774cab8a1e/0ec9aed750ff/12209820802-e1/12209820802-e1.jpg?ts=1786437690302&w=850",
                      "https://static.zara.net/assets/public/78ab/dba3/fbee4639a661/14f4ca1533ec/12209820802-e2/12209820802-e2.jpg?ts=1786437690717&w=850",
                      "https://static.zara.net/assets/public/9aef/772a/4ce84d25b0d6/8c205e5a9ac1/12209820802-e3/12209820802-e3.jpg?ts=1786437689591&w=850",
                      "https://static.zara.net/assets/public/181e/3c48/6873484bb38d/a724d7c0e6be/12209820802-e4/12209820802-e4.jpg?ts=1786437689738&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "39",
              "40",
              "41",
              "42",
              "43",
              "44",
              "45",
              "46",
              "47"
          ],
          "colors": [
              "Taupe Grey",
              "Grey"
          ],
          "description": "Model height: 185 cm\n\nTrainers made from split suede leather. Smooth upper with contrast colour detail on the heel. Contrast flat sole.",
          "materialCare": [
              "UPPER: 100% cow leather",
              "LINING: 100% polyester",
              "SOLE: 100% sbs",
              "INSOLE: 100% polyester",
              "TONGUE: 100% cow leather"
          ]
      },
      {
          "id": "zara-w28",
          "slug": "shoulder-bag-with-topstitching-zara-w28",
          "name": "TOPSTITCHED SHOULDER BAG",
          "category": "Bags",
          "gender": "WOMEN",
          "price": 219.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1641/181",
          "image": "https://static.zara.net/assets/public/9cb4/2efa/44314d92a81f/deb26a00e27b/16411810709-e1/16411810709-e1.jpg?ts=1788168875197&w=850",
          "images": [
              "https://static.zara.net/assets/public/9cb4/2efa/44314d92a81f/deb26a00e27b/16411810709-e1/16411810709-e1.jpg?ts=1788168875197&w=850",
              "https://static.zara.net/assets/public/8090/fd0c/c6624656b346/bb2a1de021c2/16411810709-e2/16411810709-e2.jpg?ts=1788168875680&w=850",
              "https://static.zara.net/assets/public/f6b3/0d1e/cc69442ab787/03a15558af1d/16411810709-e3/16411810709-e3.jpg?ts=1788168875589&w=850",
              "https://static.zara.net/assets/public/8761/8c42/dc3442ff876a/b486b580a768/16411810709-e4/16411810709-e4.jpg?ts=1788168875658&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Dark tan",
                  "hex": "#7F4E2B",
                  "reference": "1641/181",
                  "images": [
                      "https://static.zara.net/assets/public/9cb4/2efa/44314d92a81f/deb26a00e27b/16411810709-e1/16411810709-e1.jpg?ts=1788168875197&w=850",
                      "https://static.zara.net/assets/public/8090/fd0c/c6624656b346/bb2a1de021c2/16411810709-e2/16411810709-e2.jpg?ts=1788168875680&w=850",
                      "https://static.zara.net/assets/public/f6b3/0d1e/cc69442ab787/03a15558af1d/16411810709-e3/16411810709-e3.jpg?ts=1788168875589&w=850",
                      "https://static.zara.net/assets/public/8761/8c42/dc3442ff876a/b486b580a768/16411810709-e4/16411810709-e4.jpg?ts=1788168875658&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "ONE SIZE ONLY"
          ],
          "colors": [
              "Dark tan"
          ],
          "description": "Shoulder bag with topstitching detail. Straps with metal buckles at the sides. Shoulder strap. Inside pocket with zip. Magnetic button fastening.\n\nHeight x Length x Width: 30,5 x 33 x 18 cm. / 12.0 x 13.0 x 7.1″",
          "materialCare": [
              "OUTER SHELL: 100% polyurethane"
          ]
      },
      {
          "id": "zara-m28",
          "slug": "track-chelsea-boots-zara-m28",
          "name": "TRACK CHELSEA BOOTS",
          "category": "Shoes",
          "gender": "MEN",
          "price": 239.0,
          "oldPrice": null,
          "discount": null,
          "reference": "1202/082",
          "image": "https://static.zara.net/assets/public/8b6a/e0de/23024ce9a01d/fb242fa67d8d/12020821700-a2/12020821700-a2.jpg?ts=1791183243570&w=850",
          "images": [
              "https://static.zara.net/assets/public/8b6a/e0de/23024ce9a01d/fb242fa67d8d/12020821700-a2/12020821700-a2.jpg?ts=1791183243570&w=850",
              "https://static.zara.net/assets/public/0b0b/0347/47a643a79d03/14644e1c53ff/12020821700-a1/12020821700-a1.jpg?ts=1791183245836&w=850",
              "https://static.zara.net/assets/public/293b/ba20/18164d8184f9/7c4c5a9fb049/12020821700-a3/12020821700-a3.jpg?ts=1791183243812&w=850",
              "https://static.zara.net/assets/public/24c0/5984/b52e4e57a5b7/56a10bb3c8d6/12020821700-e1/12020821700-e1.jpg?ts=1788950594357&w=850",
              "https://static.zara.net/assets/public/5436/c176/aae948959ac8/e1d08659a65e/12020821700-e2/12020821700-e2.jpg?ts=1788950593605&w=850",
              "https://static.zara.net/assets/public/0a56/30e2/a70f41cd8ebb/213a7b3f6a01/12020821700-e3/12020821700-e3.jpg?ts=1788950593256&w=850",
              "https://static.zara.net/assets/public/dd77/c4bb/bdc9445f934e/387d5b1d8beb/12020821700-e4/12020821700-e4.jpg?ts=1788950593660&w=850"
          ],
          "colorVariants": [
              {
                  "name": "Brown",
                  "hex": "#47423E",
                  "reference": "1202/082",
                  "images": [
                      "https://static.zara.net/assets/public/8b6a/e0de/23024ce9a01d/fb242fa67d8d/12020821700-a2/12020821700-a2.jpg?ts=1791183243570&w=850",
                      "https://static.zara.net/assets/public/0b0b/0347/47a643a79d03/14644e1c53ff/12020821700-a1/12020821700-a1.jpg?ts=1791183245836&w=850",
                      "https://static.zara.net/assets/public/293b/ba20/18164d8184f9/7c4c5a9fb049/12020821700-a3/12020821700-a3.jpg?ts=1791183243812&w=850",
                      "https://static.zara.net/assets/public/24c0/5984/b52e4e57a5b7/56a10bb3c8d6/12020821700-e1/12020821700-e1.jpg?ts=1788950594357&w=850",
                      "https://static.zara.net/assets/public/5436/c176/aae948959ac8/e1d08659a65e/12020821700-e2/12020821700-e2.jpg?ts=1788950593605&w=850",
                      "https://static.zara.net/assets/public/0a56/30e2/a70f41cd8ebb/213a7b3f6a01/12020821700-e3/12020821700-e3.jpg?ts=1788950593256&w=850",
                      "https://static.zara.net/assets/public/dd77/c4bb/bdc9445f934e/387d5b1d8beb/12020821700-e4/12020821700-e4.jpg?ts=1788950593660&w=850"
                  ]
              },
              {
                  "name": "Black",
                  "hex": "#0A0A0A",
                  "reference": "1202/082",
                  "images": [
                      "https://static.zara.net/assets/public/f98f/80ad/955448f8a0f7/ed5a8f89aee0/12020820800-a2/12020820800-a2.jpg?ts=1786458618228&w=850",
                      "https://static.zara.net/assets/public/e6b4/30a8/1b1f4a32b23c/0e759d957f41/12020820800-a1/12020820800-a1.jpg?ts=1786458618372&w=850",
                      "https://static.zara.net/assets/public/91c5/3e22/44c24d2f8147/d95a90a7d45d/12020820800-a3/12020820800-a3.jpg?ts=1786458619417&w=850",
                      "https://static.zara.net/assets/public/b1c7/d943/acd6468bb982/12b807fa57a7/12020820800-e1/12020820800-e1.jpg?ts=1784029035271&w=850",
                      "https://static.zara.net/assets/public/2305/58a1/94b24e1c96a9/4a31cfac157c/12020820800-e2/12020820800-e2.jpg?ts=1784029034840&w=850",
                      "https://static.zara.net/assets/public/2edc/aa46/176343f0b1ff/c43696d7173c/12020820800-e3/12020820800-e3.jpg?ts=1784029035186&w=850",
                      "https://static.zara.net/assets/public/8b2b/140f/63fb40f08d9b/5139065b2ae2/12020820800-e4/12020820800-e4.jpg?ts=1784029034793&w=850"
                  ]
              }
          ],
          "badge": "COLLECTION",
          "isSale": true,
          "inStock": true,
          "stockCount": 12,
          "sizes": [
              "39",
              "40",
              "41",
              "42",
              "43",
              "44",
              "45",
              "46",
              "47"
          ],
          "colors": [
              "Brown",
              "Black"
          ],
          "description": "Model height: 188 cm\n\nChelsea boots. Plain upper. Round toe. Elastic side panels and back pull tab for slipping on with ease. Track sole.",
          "materialCare": [
              "UPPER: 75% polyurethane, 18% polyester, 7% elastodiene",
              "LINING: 100% polyester",
              "SOLE: 100% sbs",
              "INSOLE: 86% polyamide, 14% elastane"
          ]
      }
  ];

  // Dynamic products list connected to live customizer data with fallbacks
  const products = useMemo(() => {
    const list = (data?.products && Array.isArray(data.products) && data.products.length > 0)
      ? data.products
      : ((data?.productsCatalog && Array.isArray(data.productsCatalog) && data.productsCatalog.length > 0)
          ? data.productsCatalog
          : fallbackProducts);

    return list
      .filter((p) => p.isPublished !== false)
      .map((p, idx) => {
        const primaryImg = p.img || p.image || fallbackProducts[idx % fallbackProducts.length]?.img;
        const normalizedImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : [primaryImg];
        const normalizedColors = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ['Black'];
        const normalizedVariants = Array.isArray(p.colorVariants) && p.colorVariants.length > 0
          ? p.colorVariants
          : normalizedColors.map((c) => ({ name: c, hex: getColorHex(c), images: normalizedImages }));

        const resolvedOld = p.oldPrice ?? p.originalPrice ?? null;
        return {
          id: p.id || `prod-${idx + 1}`,
          slug: p.slug || (p.name || `piece-${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: p.name || 'COLLECTION PIECE',
          price: typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0),
          oldPrice: resolvedOld !== null && resolvedOld !== '' ? (typeof resolvedOld === 'number' ? resolvedOld : (parseFloat(resolvedOld) || null)) : null,
          discount: p.discount || null,
          category: p.category || 'Apparel',
          gender: p.gender || (idx % 2 === 0 ? 'WOMEN' : 'MEN'),
          img: primaryImg,
          image: primaryImg,
        images: normalizedImages,
        colorVariants: normalizedVariants,
        desc: p.description || p.desc || 'Editorial collection piece crafted for modern silhouettes.',
        description: p.description || p.desc || 'Editorial collection piece crafted for modern silhouettes.',
        badge: p.badge || null,
        isSale: p.isSale !== undefined ? p.isSale : true,
        inStock: p.inStock !== undefined ? p.inStock : true,
        stockCount: p.stockCount || 12,
        sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['XS', 'S', 'M', 'L', 'XL'],
        colors: normalizedColors,
        reference: p.reference || '',
        materialCare: p.materialCare || ['100% Cotton', 'Follow garment care label']
      };
    });
  }, [data?.products, data?.productsCatalog]);

  // Keep selectedProduct, color & size synced whenever URL /product/:slug changes (incl. refresh & popstate)
  const activeRouteProduct = useMemo(() => {
    if (!routeState.slug) return null;
    return (
      products.find((p) => p.slug === routeState.slug || p.id === routeState.slug) ||
      selectedProduct ||
      null
    );
  }, [routeState.slug, products, selectedProduct]);

  useEffect(() => {
    if (activeRouteProduct && (!selectedProduct || selectedProduct.id !== activeRouteProduct.id)) {
      setSelectedProduct(activeRouteProduct);
      const safeColor = (activeRouteProduct.colorVariants && activeRouteProduct.colorVariants[routeState.colorIdx])
        ? routeState.colorIdx
        : 0;
      setSelectedColorIdx(safeColor);
      setSelectedSize(activeRouteProduct.sizes?.[0] || 'M');
      setSelectedColor(
        activeRouteProduct.colorVariants?.[safeColor]?.name ||
        activeRouteProduct.colors?.[safeColor] ||
        'Standard'
      );
    } else if (!routeState.slug && selectedProduct) {
      setSelectedProduct(null);
    }
  }, [activeRouteProduct, routeState.slug, routeState.colorIdx]);

  // Counts for gender separation ("Trier Femme & Homme")
  const menSaleCount = useMemo(() => products.filter(p => p.isSale !== false && p.gender === 'MEN').length, [products]);
  const womenSaleCount = useMemo(() => products.filter(p => p.isSale !== false && p.gender === 'WOMEN').length, [products]);
  const totalSaleCount = useMemo(() => products.filter(p => p.isSale !== false).length, [products]);

  // Categories present in sale products for interactive tabs (adapts to selected gender)
  const saleCategories = useMemo(() => {
    const cats = new Set();
    products.forEach(p => {
      if (p.isSale !== false && (saleGenderFilter === 'ALL' || p.gender === saleGenderFilter) && p.category) {
        cats.add(p.category);
      }
    });
    return ['ALL', ...Array.from(cats)];
  }, [products, saleGenderFilter]);

  // Filtered sale products according to gender filter AND category filter
  const saleProducts = useMemo(() => {
    let list = products.filter(p => p.isSale !== false);
    if (saleGenderFilter !== 'ALL') {
      list = list.filter(p => p.gender === saleGenderFilter);
    }
    if (saleCategoryFilter !== 'ALL') {
      const q = saleCategoryFilter.toLowerCase();
      list = list.filter(p => p.category.toLowerCase() === q);
    }
    return list;
  }, [products, saleGenderFilter, saleCategoryFilter]);

  // New arrivals list dynamically filtered by gender tab (MEN / WOMEN)
  const newArrivalsList = useMemo(() => {
    const filtered = products.filter(p => p.gender === activeNewArrivalsTab);
    return filtered.length > 0 ? filtered.slice(0, 8) : products.slice(0, 8);
  }, [products, activeNewArrivalsTab]);

  // Filtered products for search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 6);
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [searchQuery, products]);

  return (
    <div
      data-store-theme={themeMode}
      dir={langMeta.dir}
      className="kronos-storefront min-h-screen bg-[#111111] text-[#FFFFE3] font-sans selection:bg-[#EA301F] selection:text-white relative overflow-x-hidden"
    >

      {/* ─────────────────────────────────────────────────────────────
          SECTION 0: FLOATING ISLAND NAVBAR (Landing / Storefront page only)
      ───────────────────────────────────────────────────────────── */}
      {!(routeState.slug && activeRouteProduct) && (
      <nav
        className={`kronos-floating-nav fixed ${hasTopNav ? 'top-[78px]' : 'top-5'} left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 lg:left-6 z-40 w-[95%] md:w-fit md:max-w-[calc(100%-2rem)] h-[80px] bg-[#111111] border border-[#FFFFE3]/25 rounded-2xl flex items-center justify-between gap-2.5 lg:gap-3.5 px-4 lg:px-5 shadow-2xl transition-all duration-500 ease-out ${
          navVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-20'
        }`}
      >
        {/* Left: KRONOS Geometric 'K' Crest Logo (Sharp brutalist crimson & bone white) */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateToHome('');
          }}
          className="flex items-center group shrink-0"
          title={data?.brand?.name || 'KRONOS'}
        >
          <KronosLogo className="w-11 h-9 lg:w-12 lg:h-10 transform group-hover:scale-105 transition-transform drop-shadow-lg" />
        </a>

        {/* Center: Navigation Links (hidden on mobile, visible on md+) */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-5 font-azeret text-[15px] font-bold tracking-tight whitespace-nowrap shrink-0">
          {/* Shop Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowShopDropdown(v => !v)}
              className="flex items-center gap-1.5 text-[#FFFFE3] hover:text-[#EA301F] transition-colors"
            >
              <span>{t('nav.shop')}</span>
              <svg viewBox="0 0 7.364 12.728" className="w-3 h-3 rotate-90 fill-current opacity-80">
                <path d="M 7.071 7.071 L 1.414 12.728 L 0 11.314 L 4.95 6.364 L 0 1.414 L 1.414 0 L 7.071 5.657 C 7.461 6.047 7.461 6.681 7.071 7.071" />
              </svg>
            </button>
            {showShopDropdown && (
              <div className="absolute top-full left-0 mt-3 w-56 bg-[#141418] border border-[#FFFFE3]/20 rounded-xl p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-mono text-[#EA301F] font-bold uppercase tracking-wider border-b border-[#25252E] pb-1.5 mb-1.5">
                  {t('nav.shop')}
                </div>
                <a
                  href="#sale"
                  onClick={(e) => {
                    e.preventDefault();
                    setSaleGenderFilter('MEN');
                    setSaleCategoryFilter('ALL');
                    setShowShopDropdown(false);
                    if (routeState.slug) navigateToHome('#sale', 'MEN');
                  }}
                  className="flex items-center justify-between px-3 py-2 text-xs text-[#FFFFE3] hover:text-white hover:bg-[#EA301F]/20 rounded-lg transition-colors font-bold"
                >
                  <span>{t('nav.man')}</span>
                  <span className="text-[10px] font-mono text-[#8E8E93]">{menSaleCount}</span>
                </a>
                <a
                  href="#sale"
                  onClick={(e) => {
                    e.preventDefault();
                    setSaleGenderFilter('WOMEN');
                    setSaleCategoryFilter('ALL');
                    setShowShopDropdown(false);
                    if (routeState.slug) navigateToHome('#sale', 'WOMEN');
                  }}
                  className="flex items-center justify-between px-3 py-2 text-xs text-[#FFFFE3] hover:text-white hover:bg-[#EA301F]/20 rounded-lg transition-colors font-bold"
                >
                  <span>{t('nav.woman')}</span>
                  <span className="text-[10px] font-mono text-[#8E8E93]">{womenSaleCount}</span>
                </a>
                <a
                  href="#sale"
                  onClick={(e) => {
                    e.preventDefault();
                    setSaleGenderFilter('ALL');
                    setSaleCategoryFilter('ALL');
                    setShowShopDropdown(false);
                    if (routeState.slug) navigateToHome('#sale', 'ALL');
                  }}
                  className="flex items-center justify-between px-3 py-2 text-xs text-[#A1A1AA] hover:text-white hover:bg-[#222] rounded-lg transition-colors border-b border-[#25252E] pb-2 mb-1.5"
                >
                  <span>{t('nav.allCollections')}</span>
                  <span className="text-[10px] font-mono text-[#8E8E93]">{totalSaleCount}</span>
                </a>
                <div className="px-3 py-1 text-[10px] font-mono text-[#787878] uppercase tracking-wider">
                  {t('nav.categories')}
                </div>
                {saleCategories.filter((c) => c !== 'ALL').slice(0, 8).map(c => (
                  <a
                    key={c}
                    href="#sale"
                    onClick={(e) => {
                      e.preventDefault();
                      setSaleCategoryFilter(c);
                      setShowShopDropdown(false);
                      if (routeState.slug) navigateToHome('#sale');
                    }}
                    className="block px-3 py-1.5 text-xs text-[#8E8E93] hover:text-[#FFFFE3] hover:bg-[#1E1E26] rounded transition-colors"
                  >
                    {localizeCategory(c, language)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Drops with Crown (Pic 1) */}
          <a
            href="#drops"
            onClick={(e) => {
              if (routeState.slug) {
                e.preventDefault();
                navigateToHome('#drops');
              }
            }}
            className="flex items-center gap-1.5 text-[#FFFFE3] hover:text-[#EA301F] transition-colors group"
          >
            <span>{t('nav.drops')}</span>
            <svg viewBox="0 0 17 11" className="w-5 h-3.5 -mt-4 transform -rotate-12 group-hover:scale-110 transition-transform">
              <path
                d="M 8.5 0 L 12.278 5.5 L 17 1.833 L 15.111 11 L 1.889 11 L 0 1.833 L 4.722 5.5 Z"
                fill="#EA301F"
                stroke="#FFFFE3"
                strokeWidth="1.2"
              />
            </svg>
          </a>

          {/* Sale (Red) */}
          <a
            href="#sale"
            onClick={(e) => {
              if (routeState.slug) {
                e.preventDefault();
                navigateToHome('#sale');
              }
            }}
            className="text-[#EA301F] hover:text-[#ff4536] font-bold transition-colors"
          >
            {t('nav.sale')}
          </a>

          {/* New */}
          <a
            href="#new-arrivals"
            onClick={(e) => {
              if (routeState.slug) {
                e.preventDefault();
                navigateToHome('#new-arrivals');
              }
            }}
            className="text-[#FFFFE3] hover:text-[#EA301F] transition-colors"
          >
            {t('nav.new')}
          </a>

          {/* AI Stylist Pill */}
          <button
            onClick={() => setShowAIChat(v => !v)}
            className="kronos-surface-pill flex items-center gap-1.5 h-[36px] px-3 rounded-full bg-[#18181D] hover:bg-[#EA301F] text-[#FFFFE3] hover:text-white border border-[#2B2B33] hover:border-[#EA301F] text-[11px] font-mono font-bold uppercase transition-all tracking-wider shadow-sm cursor-pointer group whitespace-nowrap shrink-0"
            title="Open K AI Stylist & Concierge"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-[#EA301F] group-hover:text-white animate-pulse" />
            <span>{t('nav.aiStylist')}</span>
          </button>

          {/* 3D Virtual Try-On Studio Pill (Bigger 24x24 3D Cube Icon & Expanded Dimensions) */}
          <button
            onClick={() => handleOpenFittingLab(null)}
            className="kronos-accent-btn flex items-center gap-2 h-[42px] px-3.5 rounded-xl bg-[#EA301F]/25 hover:bg-[#EA301F] text-[#FF4D3D] hover:text-white border border-[#EA301F]/70 hover:border-[#EA301F] text-[12px] font-mono font-black uppercase transition-all tracking-wider shadow-[0_0_16px_rgba(234,48,31,0.22)] cursor-pointer group whitespace-nowrap shrink-0"
            title="Launch 3D Virtual Try-On Studio"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 stroke-current fill-none transition-transform group-hover:scale-110" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.5 L20.5 7.25 L20.5 16.75 L12 21.5 L3.5 16.75 L3.5 7.25 Z" />
              <path d="M12 21.5 L12 12 M12 12 L20.5 7.25 M12 12 L3.5 7.25" />
              <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            <span>{t('nav.lab3d')}</span>
          </button>

          {/* Direct Admin Studio Pill */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="kronos-surface-pill flex items-center gap-1.5 h-[36px] px-3 rounded-full bg-[#18181D] hover:bg-[#23232A] text-[#FFFFE3] hover:text-[#EA301F] border border-[#2B2B33] hover:border-[#EA301F] text-[11px] font-mono font-bold uppercase transition-all tracking-wider shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              title="Open K Admin Studio"
            >
              <span>{language === 'ar' ? 'الإدارة' : 'Admin'}</span>
            </button>
          )}
        </div>

        {/* Right: Night/Day Toggle, Language EN|FR|AR, Currency, Search, Wishlist, Cart & Mobile Toggle */}
        <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
          {/* Night / Day Mode Pill */}
          <button
            type="button"
            onClick={() => setThemeMode((prev) => (prev === 'night' ? 'day' : 'night'))}
            className="kronos-surface-pill flex items-center gap-1 h-[34px] px-2.5 rounded-full bg-[#18181D] hover:bg-[#23232A] border border-[#2B2B33] hover:border-[#EA301F] text-[10px] font-mono font-bold text-[#FFFFE3] transition-all cursor-pointer shadow-sm shrink-0"
            title={themeMode === 'night' ? 'Switch to Editorial Day Mode' : 'Switch to Midnight Night Mode'}
          >
            {themeMode === 'night' ? (
              <Moon className="w-3.5 h-3.5 text-[#E5A93C]" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#EA301F]" />
            )}
            <span className="hidden xl:inline">{themeMode === 'night' ? t('nav.nightMode') : t('nav.dayMode')}</span>
          </button>

          {/* Language Selector (EN | FR | AR) */}
          <div className="kronos-surface-pill hidden sm:flex items-center bg-[#18181D] border border-[#2B2B33] rounded-full p-0.5 shrink-0">
            {SUPPORTED_LANGUAGES.map((lng) => (
              <button
                key={lng.code}
                type="button"
                onClick={() => setLanguage(lng.code)}
                className={`px-2 py-1 rounded-full font-mono text-[10px] font-bold transition-all cursor-pointer ${
                  language === lng.code
                    ? 'kronos-accent-btn bg-[#EA301F] text-white shadow-sm'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
                title={lng.nativeName}
              >
                {lng.label}
              </button>
            ))}
          </div>

          {/* Currency Pill */}
          <button
            onClick={() => setShowCountryModal(true)}
            className="kronos-surface-pill hidden sm:flex items-center gap-1 h-[34px] px-2.5 rounded-full bg-[#18181D] hover:bg-[#23232A] border border-[#2B2B33] hover:border-[#EA301F] text-[11px] font-mono font-bold text-[#FFFFE3] transition-all cursor-pointer shadow-sm whitespace-nowrap shrink-0"
            title="Current Currency (Click to change)"
          >
            <span>{currentCurrency.flag}</span>
            <span>{currentCurrency.code} ({currentCurrency.symbol})</span>
          </button>

          {/* Search Icon (hidden on mobile, visible on md+) */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="hidden md:block text-[#FFFFE3] hover:text-[#EA301F] transition-transform hover:scale-110 p-1 shrink-0"
            title="Search Products"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current stroke-[2.4] fill-none">
              <circle cx="10.5" cy="10.5" r="7" />
              <path d="M 15.5 15.5 L 21 21" strokeLinecap="round" />
            </svg>
          </button>

          {/* Wishlist Heart Icon (hidden on mobile, visible on md+) */}
          <button
            onClick={() => setShowWishlistDrawer(true)}
            className="hidden md:block text-[#FFFFE3] hover:text-[#EA301F] relative transition-transform hover:scale-110 p-1 shrink-0"
            title="Wishlist"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path
                d="M 10.534 17.956 L 1.734 9.656 C 0.133 8.129 -0.418 5.801 0.328 3.717 C 1.074 1.634 2.977 0.185 5.184 0.02 C 7.391 -0.144 9.488 1.006 10.534 2.956 C 11.572 1.019 13.646 -0.132 15.839 0.012 C 18.031 0.156 19.937 1.57 20.711 3.626 C 21.486 5.682 20.987 8.001 19.434 9.556 Z"
                transform="translate(1.466 3.044)"
                stroke="currentColor"
                strokeWidth="2.4"
                fill={wishlist.length > 0 ? '#EA301F' : 'none'}
              />
            </svg>
          </button>

          {/* Cart Icon + Pic 1 Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {cartCount > 0 && (
              <span
                onClick={() => setShowCartDrawer(true)}
                className="bg-[#EA301F] text-white text-xs font-black font-mono px-2 py-0.5 rounded-full min-w-[22px] h-[22px] flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform"
                title={`${cartCount} items in bag`}
              >
                {cartCount}
              </span>
            )}
            <button
              onClick={() => setShowCartDrawer(true)}
              className="text-[#FFFFE3] hover:text-[#EA301F] relative transition-transform hover:scale-110 p-1 shrink-0"
              title="Shopping Bag"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path
                  d="M 14.55 11 C 15.3 11 15.96 10.59 16.3 9.97 L 19.88 3.48 C 20.25 2.82 19.77 2 19.01 2 L 4.21 2 L 3.27 0 L 0 0 L 0 2 L 2 2 L 5.6 9.59 L 4.25 12.03 C 3.52 13.37 4.48 15 6 15 L 18 15 L 18 13 L 6 13 L 7.1 11 Z M 5.16 4 L 17.31 4 L 14.55 9 L 7.53 9 Z M 6 16 C 4.9 16 4.01 16.9 4.01 18 C 4.01 19.1 4.9 20 6 20 C 7.1 20 8 19.1 8 18 C 8 16.9 7.1 16 6 16 Z M 16 16 C 14.9 16 14.01 16.9 14.01 18 C 14.01 19.1 14.9 20 16 20 C 17.1 20 18 19.1 18 18 C 18 16.9 17.1 16 16 16 Z"
                  transform="translate(1.996 2)"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Hamburger Toggle Button (Exact Framer mobile = icon) */}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="md:hidden text-[#FFFFE3] hover:text-[#EA301F] p-1.5 flex items-center justify-center transition-colors ml-0.5"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current stroke-2 fill-none">
                <path d="M 6 6 L 18 18 M 6 18 L 18 6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current stroke-2 fill-none">
                <path d="M 4 8 L 20 8 M 4 16 L 20 16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </nav>
      )}

      {/* Mobile Drawer Menu */}
      {!(routeState.slug && activeRouteProduct) && mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#111111] backdrop-blur-2xl flex flex-col pt-28 px-6 pb-12 overflow-y-auto animate-in fade-in duration-200 md:hidden">
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-[#FFFFE3]/15">
            <div className="flex items-center gap-1.5 bg-[#18181D] border border-[#2B2B33] rounded-full p-1">
              {SUPPORTED_LANGUAGES.map((lng) => (
                <button
                  key={lng.code}
                  type="button"
                  onClick={() => setLanguage(lng.code)}
                  className={`px-3 py-1 rounded-full font-mono text-xs font-bold cursor-pointer ${
                    language === lng.code ? 'bg-[#EA301F] text-white' : 'text-[#8E8E93]'
                  }`}
                >
                  {lng.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setThemeMode((prev) => (prev === 'night' ? 'day' : 'night'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18181D] border border-[#2B2B33] text-xs font-mono font-bold text-[#FFFFE3]"
            >
              {themeMode === 'night' ? <Moon className="w-3.5 h-3.5 text-[#E5A93C]" /> : <Sun className="w-3.5 h-3.5 text-[#EA301F]" />}
              <span>{themeMode === 'night' ? t('nav.nightMode') : t('nav.dayMode')}</span>
            </button>
          </div>
          <div className="flex flex-col space-y-6 font-azeret text-2xl uppercase font-bold text-[#FFFFE3]">
            <a
              href="#drops"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (routeState.slug) {
                  e.preventDefault();
                  navigateToHome('#drops');
                }
              }}
              className="flex items-center gap-2 hover:text-[#EA301F] transition-colors"
            >
              <span>{t('nav.drops')}</span>
              <svg viewBox="0 0 17 11" className="w-4 h-3 -mt-2 transform -rotate-12 fill-[#EA301F] stroke-[#FFFFE3]">
                <path d="M 8.5 0 L 12.278 5.5 L 17 1.833 L 15.111 11 L 1.889 11 L 0 1.833 L 4.722 5.5 Z" />
              </svg>
            </a>
            <a
              href="#sale"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (routeState.slug) {
                  e.preventDefault();
                  navigateToHome('#sale');
                }
              }}
              className="text-[#EA301F] hover:text-[#ff4536] transition-colors"
            >
              {t('nav.sale')}
            </a>
            <a
              href="#new-arrivals"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (routeState.slug) {
                  e.preventDefault();
                  navigateToHome('#new-arrivals');
                }
              }}
              className="hover:text-[#EA301F] transition-colors"
            >
              {t('sections.newSuffix')}
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowAIChat(true);
              }}
              className="flex items-center justify-between text-[#EA301F] hover:text-[#ff4536] transition-colors w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#EA301F]" />
                <span>{t('nav.aiStylist')}</span>
              </div>
              <span className="text-xs font-mono bg-[#EA301F]/20 border border-[#EA301F]/40 px-2 py-0.5 rounded text-[#EA301F]">{t('footer.neural')}</span>
            </button>
            {onOpenAdmin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="flex items-center justify-between text-[#FFFFE3] hover:text-[#EA301F] transition-colors w-full text-left"
              >
                <span>{t('footer.adminStudio')}</span>
                <span className="text-xs font-mono border border-[#FFFFE3]/30 px-2 py-0.5 rounded text-[#FFFFE3]/80">/admin</span>
              </button>
            )}

            <div className="pt-6 border-t border-[#FFFFE3]/10">
              <p className="text-xs font-mono text-[#FFFFE3]/40 tracking-widest mb-4">
                {language === 'en' ? (data?.categoriesSection?.title || 'CATEGORIES').toUpperCase() : t('sections.categoriesTitle').toUpperCase()}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm font-medium normal-case font-sans">
                {(data?.categoriesSection?.items || [
                  { title: 'Shoes', filterCategory: 'Shoes' },
                  { title: 'T-Shirt', filterCategory: 'T-Shirt' },
                  { title: 'Hoodie', filterCategory: 'Hoodie' },
                  { title: 'Jacket', filterCategory: 'Jacket' },
                  { title: 'Shirt', filterCategory: 'Shirt' },
                  { title: 'Jeans', filterCategory: 'Jeans' },
                  { title: 'Accessories', filterCategory: 'Accessories' }
                ]).map((c) => (
                  <a
                    key={c.id || c.title}
                    href="#sale"
                    onClick={() => {
                      setSaleCategoryFilter(c.filterCategory || c.title);
                      setMobileMenuOpen(false);
                    }}
                    className="text-[#FFFFE3]/80 hover:text-[#EA301F] py-1 transition-colors"
                  >
                    {localizeCategory(c.title, language)}
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#FFFFE3]/10 flex flex-col gap-4 text-base font-medium normal-case font-sans">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowSearchModal(true); }}
                className="flex items-center justify-between text-[#FFFFE3] hover:text-[#EA301F] py-1"
              >
                <span>{t('footer.searchStore')}</span>
                <span className="font-mono">↗</span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setShowWishlistDrawer(true); }}
                className="flex items-center justify-between text-[#FFFFE3] hover:text-[#EA301F] py-1"
              >
                <span>{t('nav.wishlist')} ({wishlist.length})</span>
                <span className="font-mono">↗</span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setShowCountryModal(true); }}
                className="flex items-center justify-between text-[#FFFFE3] hover:text-[#EA301F] py-1"
              >
                <span>{t('footer.currencyLabel')} ({activeCurrencyCode})</span>
                <span className="font-mono">⌄</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ROUTE-DRIVEN PRODUCT DETAIL PAGE (/product/:slug) VS STOREFRONT HOME ── */}
      {routeState.slug && activeRouteProduct ? (
        <ZaraProductDetailPage
          product={activeRouteProduct}
          allProducts={products}
          stores={data?.stores || []}
          selectedColorIdx={selectedColorIdx}
          onSelectColorIdx={handleSelectColorIdxOnPage}
          selectedSize={selectedSize}
          onSelectSize={setSelectedSize}
          onAddToCart={addToCart}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
          onSelectProduct={handleSelectProduct}
          onBackToStore={navigateToHome}
          onOpenFittingLab={handleOpenFittingLab}
          onOpenSearch={() => setShowSearchModal(true)}
          onOpenCart={() => setShowCartDrawer(true)}
          onOpenWishlist={() => setShowWishlistDrawer(true)}
          onOpenCurrency={() => setShowCountryModal(true)}
          cartCount={cartCount}
          activeCurrencyCode={activeCurrencyCode}
          formatPrice={formatPrice}
          language={language}
        />
      ) : (
        <>
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: HERO VIEWPORT (100vh / min-h-[850px])
          Left: 70.5% width Editorial photo + "WEAR THE HYPE 'RAW'" (96px)
          Right: 29.5% width Framed with 5px red border + 3D Ticker + 90px SHOP NOW (48px)
      ───────────────────────────────────────────────────────────── */}
      <section className="hero-photo-preserve w-full h-screen min-h-[850px] lg:min-h-[900px] flex flex-col lg:flex-row relative bg-[#111111] overflow-hidden">
        {/* Left Column (70.5% width) */}
        <div className="w-full lg:w-[70.5%] h-[60vh] lg:h-full relative overflow-hidden flex flex-col justify-end p-8 sm:p-12 lg:p-16">
          {/* Background Image: 3 Models in streetwear */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out hover:scale-[1.02]"
            style={{
              backgroundImage: `url('${(data?.hero?.bgImage && !data.hero.bgImage.includes('75LBV1xf4btDeSecxxpQ1EHBtKE')) ? data.hero.bgImage : 'https://framerusercontent.com/images/KxF8H6qGSaJvRZEhALbixoOrQg.jpg'}')`,
              maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.945) 0%, rgb(0, 0, 0) 100%)',
              WebkitMaskImage: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.945) 0%, rgb(0, 0, 0) 100%)'
            }}
          />
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />

          {/* Left Bottom Typography */}
          <div className="relative z-10 max-w-3xl">
            <p className="font-azeret text-[19.2px] font-normal tracking-wide text-[#FFFFE3] mb-4 uppercase drop-shadow">
              {language === 'en' ? (data?.hero?.tagline || data?.brand?.subTagline || t('hero.tagline')) : translateEditorialCopy(data?.hero?.tagline || data?.brand?.subTagline || 'Dress the unconventional', language)}
            </p>
            <h1 className="font-azeret font-bold text-5xl sm:text-7xl lg:text-[96px] leading-[0.85] uppercase text-[#FFFFE3] tracking-tight sm:tracking-[-3px] lg:tracking-[-4.8px] drop-shadow-2xl">
              <div>{language === 'en' ? (data?.hero?.titleLine1 || t('hero.titleLine1')) : translateEditorialCopy(data?.hero?.titleLine1 || 'WEAR THE', language)}</div>
              <div>{language === 'en' ? (data?.hero?.titleLine2 || t('hero.titleLine2')) : translateEditorialCopy(data?.hero?.titleLine2 || 'HYPE "RAW"', language)}</div>
            </h1>
          </div>
        </div>

        {/* Right Column (29.5% width) */}
        <div className="w-full lg:w-[29.5%] h-[40vh] lg:h-full flex flex-col relative bg-[#111111] border-t-0 lg:border-t-0 border-l-0 lg:border-l-[5px] border-r-0 lg:border-r-[5px] border-b-[5px] border-[#EA301F] shadow-[inset_0_0_29px_13px_rgba(57,57,57,0.33)] overflow-hidden">
          {/* Vertical Infinite Marquee Ticker */}
          <div
            className="flex-1 w-full overflow-hidden relative flex flex-col justify-center items-center"
            style={{
              maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 12.5%, rgba(0, 0, 0, 1) 87.5%, rgba(0, 0, 0, 0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 12.5%, rgba(0, 0, 0, 1) 87.5%, rgba(0, 0, 0, 0) 100%)'
            }}
          >
            <div className="ticker-vertical flex flex-col gap-6 py-4 items-center">
              {/* Loop set 1 & 2 over curated Zara studio pieces */}
              {[0, 1].map((loopIdx) =>
                [products[0], products[1], products[2], products[3]].filter(Boolean).map((item, idx) => (
                  <div
                    key={`${loopIdx}-${item.id}-${idx}`}
                    onClick={() => handleSelectProduct(item)}
                    className="w-[230px] aspect-[2/3] rounded-lg overflow-hidden bg-[#ECECE9] flex items-center justify-center cursor-pointer group transition-transform hover:scale-105 relative border border-white/10 shadow-2xl"
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="font-azeret text-[10px] font-bold uppercase text-white truncate">{localizeProductName(item.name, language)}</div>
                      <div className="font-azeret text-xs font-bold text-[#EA301F]">{formatPrice(item.price)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Solid Red Button: SHOP NOW (48px exact) */}
          <a
            href="#sale"
            className="w-full h-[90px] bg-[#EA301F] hover:bg-[#ff3b29] text-[#FFFFE3] flex items-center justify-center gap-3 font-azeret font-bold text-3xl sm:text-4xl lg:text-[48px] uppercase tracking-[-2.4px] transition-all duration-300 group z-10"
          >
            <span>{language === 'en' ? (data?.hero?.ctaText || t('hero.ctaText')) : translateEditorialCopy(data?.hero?.ctaText || 'SHOP NOW', language)}</span>
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
              <path d="M 1 0 L 1 2 L 9.59 2 L 0 11.59 L 1.41 13 L 11 3.41 L 11 12 L 13 0 Z" />
            </svg>
          </a>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: ABOUT US / MANIFESTO (ABusUT)
          Full viewport height, gritty tunnel backdrop, central typography
          Scroll-driven scale zoom animation (1 -> 1.35)
      ───────────────────────────────────────────────────────────── */}
      <section
        ref={aboutRef}
        id="about"
        className="hero-photo-preserve w-full h-screen min-h-[850px] relative flex items-center justify-center bg-[#111111] overflow-hidden px-4"
      >
        {/* Background Image with Smooth Scroll Scale Effect */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out will-change-transform"
          style={{
            backgroundImage: `url('${data?.about?.bgImage || data?.manifesto?.bgImage || 'https://framerusercontent.com/images/2LEsj8dTfuADr3ESmjj0dA2TgA.webp?width=3000&height=2000'}')`,
            transform: `scale(${1 + aboutProgress * 0.3})`
          }}
        />
        <div className="absolute inset-0 bg-[#111111]/25 pointer-events-none" />

        {/* Content with parallax translateY */}
        <div
          className="relative z-10 max-w-4xl text-center px-4 transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${(1 - aboutProgress) * 60}px)`
          }}
        >
          {/* Superimposed Title */}
          <div className="relative z-10 inline-block mb-6">
            <h2 className="font-azeret font-bold text-6xl sm:text-7xl lg:text-[70.4px] leading-[56.32px] tracking-[-3.52px] uppercase text-[#EA301F]">
              {language === 'en' ? (data?.about?.title || t('about.prefix')) : t('about.prefix')}
            </h2>
            <h4 className="absolute inset-0 flex items-center justify-center font-serif-italic font-bold text-4xl sm:text-5xl lg:text-[48px] leading-[38.4px] tracking-[-2.4px] text-[#FFFFE3] pointer-events-none -mt-1">
              {language === 'en' ? (data?.about?.subtitle || t('about.suffix')) : t('about.suffix')}
            </h4>
          </div>

          <p className="font-azeret font-normal text-base sm:text-lg lg:text-[19.2px] leading-[26.88px] text-[#FFFFE3] max-w-3xl mx-auto tracking-normal uppercase">
            {translateEditorialCopy(data?.about?.text || data?.manifesto?.text || "RAWLINE IS MORE THAN CLOTHING, IT'S A MOVEMENT. BORN FROM THE STREETS, DRIVEN BY CULTURE, AND MADE FOR TRENDSETTERS. BOLD DROPS, EXCLUSIVE COLLABS, AND FEARLESS ENERGY DEFINE THOSE WHO STAY FRESH.", language)}
          </p>

          <a
            href="#drops"
            className="inline-block mt-8 px-8 py-3 border border-[#FFFFE3] text-[#FFFFE3] font-azeret text-[19.2px] uppercase tracking-normal hover:bg-[#FFFFE3] hover:text-[#111111] transition-all duration-300"
          >
            {translateEditorialCopy(data?.about?.ctaText || data?.manifesto?.ctaText || 'VIEW MORE', language)} ↗
          </a>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: ONGOING DROPS (latest DROPS)
          Vinyl record banner + limited badge + dynamic drop split cards
      ───────────────────────────────────────────────────────────── */}
      <section id="drops" className="w-full max-w-[1400px] mx-auto py-20 px-4 sm:px-6 bg-[#111111]">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#222]">
          <div className="flex items-baseline gap-3">
            <span className="font-serif-italic font-bold text-4xl lg:text-[48px] tracking-[-2.4px] text-[#FFFFE3]">
              {language === 'en' ? (data?.drops?.titlePrefix || t('sections.dropsPrefix')) : t('sections.dropsPrefix')}
            </span>
            <span className="font-azeret font-bold text-4xl lg:text-[48px] tracking-[-2.4px] uppercase text-[#EA301F]">
              {language === 'en' ? (data?.drops?.titleSuffix || t('sections.dropsSuffix')) : t('sections.dropsSuffix')}
            </span>
          </div>
          <a href="#sale" className="font-azeret font-bold text-2xl lg:text-[32px] tracking-[-1.6px] text-[#FFFFE3] hover:text-[#EA301F] transition-colors flex items-center gap-2">
            <span>{language === 'en' ? (data?.drops?.ctaText || t('sections.viewAll')) : t('sections.viewAll')}</span>
            <span>↗</span>
          </a>
        </div>

        {/* Top Drop Banner */}
        {data?.drops?.items?.[0] && (
          <div className="relative w-full h-[360px] sm:h-[460px] lg:h-[355px] overflow-hidden mb-6 group cursor-pointer">
            <img
              src={data.drops.items[0].image || 'https://framerusercontent.com/images/BJfrkmv0iyiZnReeFBXU944wCT0.webp?width=1920&height=2880'}
              alt={data.drops.items[0].title || 'Featured Drop'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />

            {/* Tilted Limited Stock Badge */}
            <div className="absolute top-4 left-4 z-20 transform -rotate-8 hover:rotate-0 transition-transform">
              {data?.drops?.badgeImage ? (
                <img
                  src={data.drops.badgeImage}
                  alt={data?.drops?.attentionBadge || 'Limited Stock'}
                  className="w-32 sm:w-36 drop-shadow-xl"
                />
              ) : (
                <span className="inline-block px-3 py-1.5 bg-[#EA301F] text-[#FFFFE3] font-azeret font-bold text-[10px] uppercase tracking-widest border border-[#FFFFE3] shadow-xl">
                  {translateEditorialCopy(data?.drops?.attentionBadge || 'LIMITED STOCK', language)}
                </span>
              )}
            </div>

            {/* Progressive blur backdrop on hover with info */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors duration-300 flex flex-col justify-end p-8 text-center">
              <h4 className="font-azeret font-bold text-3xl sm:text-4xl lg:text-[48px] tracking-[-2.4px] uppercase text-[#FFFFE3] drop-shadow-lg">
                {data.drops.items[0].title}
              </h4>
              <p className="font-azeret text-sm sm:text-base lg:text-[19.2px] text-[#FFFFE3] uppercase mt-2 opacity-90 max-w-2xl mx-auto drop-shadow">
                {translateEditorialCopy(data.drops.items[0].description, language)}
              </p>
            </div>
          </div>
        )}

        {/* Split Images Below (Remaining Drops dynamically rendered) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(data?.drops?.items || []).slice(1).map((dropItem, idx) => (
            <div key={dropItem.id || idx} className="relative h-[380px] sm:h-[460px] lg:h-[355px] overflow-hidden group cursor-pointer">
              <img
                src={dropItem.image}
                alt={dropItem.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors duration-300 flex flex-col justify-end p-8 text-center">
                <h4 className="font-azeret font-bold text-2xl sm:text-3xl lg:text-[48px] tracking-[-2.4px] uppercase text-[#FFFFE3] drop-shadow-lg">
                  {dropItem.title}
                </h4>
                <p className="font-azeret text-xs sm:text-sm lg:text-[19.2px] text-[#FFFFE3] uppercase mt-2 opacity-90 drop-shadow">
                  {translateEditorialCopy(dropItem.description, language)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: ON SALE (black friday SALE)
          4-column product grid with 1px dark borders, jagged serrated ticket discount badges
      ───────────────────────────────────────────────────────────── */}
      <section id="sale" className="w-full max-w-[1400px] mx-auto pt-28 sm:pt-32 pb-20 px-4 sm:px-6 bg-[#111111] scroll-mt-24">
        {/* Header with Counter and Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#222] gap-4">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-serif-italic font-bold text-4xl lg:text-[48px] tracking-[-2.4px] text-[#FFFFE3]">
              {language === 'en' ? (data?.sectionHeaders?.sale?.prefix || t('sections.salePrefix')) : t('sections.salePrefix')}
            </span>
            <span className="font-azeret font-bold text-4xl lg:text-[48px] tracking-[-2.4px] uppercase text-[#EA301F]">
              {language === 'en' ? (data?.sectionHeaders?.sale?.suffix || t('sections.saleSuffix')) : t('sections.saleSuffix')}
            </span>
            <span className="kronos-surface-pill text-xs font-mono text-[#888] tracking-widest px-2.5 py-1 rounded bg-[#181818] border border-[#2a2a2a]">
              {saleProducts.length} {t('sections.piecesLoaded')}
            </span>
          </div>
          <button
            onClick={() => {
              setSaleCategoryFilter('ALL');
              setShowAllSale(prev => !prev);
            }}
            className="font-azeret font-bold text-xl lg:text-[28px] tracking-[-1.4px] text-[#FFFFE3] hover:text-[#EA301F] transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span>
              {showAllSale ? t('sections.viewingAll') : t('sections.viewAll')}
            </span>
            <span>↗</span>
          </button>
        </div>

        {/* Gender Separation Bar ("Trier Homme & Femme Séparément") */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#222]">
          <div className="kronos-surface-pill flex items-center gap-2 p-1.5 bg-[#16161C] border border-[#2A2A35] rounded-xl flex-wrap">
            <button
              onClick={() => {
                setSaleGenderFilter('ALL');
                setSaleCategoryFilter('ALL');
              }}
              className={`px-4 sm:px-6 py-2 rounded-lg font-azeret text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                saleGenderFilter === 'ALL'
                  ? 'kronos-accent-btn bg-[#EA301F] text-white shadow-[0_0_15px_rgba(234,48,31,0.5)]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#22222B]'
              }`}
            >
              {t('filters.all')} ({totalSaleCount})
            </button>
            <button
              onClick={() => {
                setSaleGenderFilter('MEN');
                setSaleCategoryFilter('ALL');
              }}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-azeret text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                saleGenderFilter === 'MEN'
                  ? 'kronos-accent-btn bg-[#EA301F] text-white shadow-[0_0_15px_rgba(234,48,31,0.5)]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#22222B]'
              }`}
            >
              <span>{t('filters.man')}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-mono text-white">
                {menSaleCount}
              </span>
            </button>
            <button
              onClick={() => {
                setSaleGenderFilter('WOMEN');
                setSaleCategoryFilter('ALL');
              }}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-azeret text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                saleGenderFilter === 'WOMEN'
                  ? 'kronos-accent-btn bg-[#EA301F] text-white shadow-[0_0_15px_rgba(234,48,31,0.5)]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#22222B]'
              }`}
            >
              <span>{t('filters.woman')}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-mono text-white">
                {womenSaleCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#787878]">{t('sections.pricingLabel')}</span>
            <button
              onClick={() => setShowCountryModal(true)}
              className="kronos-surface-pill flex items-center gap-1.5 text-[#FFFFE3] font-bold bg-[#1C1C24] hover:bg-[#262632] px-3 py-1.5 rounded-lg border border-[#2D2D38] transition-colors cursor-pointer"
              title={t('currencyModal.title')}
            >
              <span>{currentCurrency.flag}</span>
              <span dir="ltr">{String(currentCurrency.name || currentCurrency.code).toUpperCase()} ({currentCurrency.symbol})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar scroll-smooth">
          {saleCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSaleCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                saleCategoryFilter === cat
                  ? 'kronos-accent-btn bg-[#EA301F] text-white font-bold shadow-[0_0_15px_rgba(234,48,31,0.5)] border border-[#EA301F]'
                  : 'kronos-surface-pill bg-[#161616] text-[#A1A1AA] hover:text-[#FFFFE3] hover:bg-[#202020] border border-[#262626]'
              }`}
            >
              {localizeCategory(cat, language)}
            </button>
          ))}
        </div>

        {/* 4-Column Zara-Style Studio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(showAllSale ? saleProducts : saleProducts.slice(0, 8)).map(prod => (
            <ZaraProductCard
              key={prod.id}
              prod={prod}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              formatPrice={formatPrice}
              onSelectProduct={handleSelectProduct}
              onQuickAddToCart={addToCart}
              onOpenFittingLab={handleOpenFittingLab}
              language={language}
              t={t}
            />
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: FEATURES (why KRONOS?)
          4 vertical stair-step columns with 0, 150px, 300px, 450px top spacers
      ───────────────────────────────────────────────────────────── */}
      <section ref={featuresRef} className="w-full max-w-[1400px] mx-auto py-20 px-4 sm:px-6 bg-[#111111]">
        {/* Header */}
        <div className="pb-8 mb-10 border-b border-[#222] flex items-baseline gap-3">
          <span className="font-serif-italic font-bold text-4xl lg:text-[48px] tracking-[-2.4px] text-[#FFFFE3]">
            {language === 'en' ? (data?.featuresSection?.titlePrefix || t('sections.featuresPrefix')) : t('sections.featuresPrefix')}
          </span>
          <span className="font-azeret font-bold text-4xl lg:text-[48px] tracking-[-2.4px] uppercase text-[#EA301F] inline-flex items-baseline gap-1">
            {language === 'ar' ? (
              <>
                <span dir="ltr">{data?.brand?.name || 'KRONOS'}</span>
                <span>؟</span>
              </>
            ) : language === 'fr' ? (
              <>
                <span>{data?.brand?.name || 'KRONOS'}</span>
                <span>?</span>
              </>
            ) : (
              data?.featuresSection?.titleSuffix || `${data?.brand?.name || 'KRONOS'}?`
            )}
          </span>
        </div>

        {/* 4 Stair-step Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {(data?.featuresSection?.items || [
            { id: 'f1', description: 'GET YOUR ORDER DELIVERED QUICKLY, STRAIGHT TO YOUR DOOR.', title: 'Fast Shipping', subtitle: '3–5 business days' },
            { id: 'f2', description: 'RETURN YOUR ITEMS HASSLE-FREE. OUR FLEXIBLE POLICY MAKES IT SIMPLE.', title: 'Easy Returns', subtitle: '7 days from delivery' },
            { id: 'f3', description: 'PAY FOR YOUR ORDER WITH CONFIDENCE. YOUR DETAILS ARE ALWAYS PROTECTED.', title: 'Secure Payments', subtitle: 'Bank-grade SSL protection' },
            { id: 'f4', description: 'GET THE HELP YOU NEED, FAST. OUR DEDICATED TEAM IS HERE FOR YOU.', title: 'Customer Support', subtitle: 'hello@raw.example', useFooterEmail: true }
          ]).map((feat, idx) => {
            const mtClasses = ['', 'lg:mt-[150px]', 'lg:mt-[300px]', 'lg:mt-[450px]'];
            const speedMultipliers = [1.5, 1.3, 1.1, 0.9];
            const opMultipliers = [2.0, 1.8, 1.5, 1.2];
            const mult = speedMultipliers[idx] ?? 1.0;
            const opMult = opMultipliers[idx] ?? 1.2;
            const subRaw = feat.useFooterEmail ? (data?.footer?.email || feat.subtitle) : feat.subtitle;
            const sub = feat.useFooterEmail ? subRaw : translateEditorialCopy(subRaw, language);
            return (
              <div
                key={feat.id || idx}
                className={`p-6 bg-[#131313] border border-[#222] flex flex-col justify-between min-h-[300px] ${mtClasses[idx] || ''} transition-all duration-700 ease-out`}
                style={{
                  transform: `translateY(${(1 - Math.min(1, featuresProgress * mult)) * 60}px)`,
                  opacity: Math.min(1, featuresProgress * opMult)
                }}
              >
                <p className="font-azeret text-[19.2px] leading-[26.88px] uppercase text-[#FFFFE3] mb-8">
                  {translateEditorialCopy(feat.description, language)}
                </p>
                <div>
                  <h3 className="font-azeret font-bold text-3xl lg:text-[48px] leading-[38.4px] tracking-[-2.4px] uppercase text-[#FFFFE3]">
                    {translateEditorialCopy(feat.title, language)}
                  </h3>
                  <p dir={feat.useFooterEmail ? 'ltr' : undefined} className="font-azeret text-base text-[#787878] uppercase mt-2">
                    {sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: CATEGORIES
          Asymmetric editorial high-fashion photo collage with dynamic Admin items
      ───────────────────────────────────────────────────────────── */}
      {(() => {
        const catItems = data?.categoriesSection?.items || [
          { title: 'Shoes', filterCategory: 'Shoes', image: 'https://framerusercontent.com/images/v0XCMMD3lRM3TU0xC5O5upOnFM.jpeg?width=3000&height=4000' },
          { title: 'Hoodie', filterCategory: 'Hoodie', image: 'https://framerusercontent.com/images/US3m591Ba1oBNTKd7x1ZpQRKnco.png?width=655&height=1200' },
          { title: 'Jacket', filterCategory: 'Jacket', image: 'https://framerusercontent.com/images/sryKbTpcRyaW7v3XxPsUwHUFyVw.jpeg?width=4928&height=3280' },
          { title: 'Accessories', filterCategory: 'Accessories', image: 'https://framerusercontent.com/images/CiHimviYwfud7xwSwJVc0ykQGQ.png?width=960&height=1200' },
          { title: 'T-Shirt', filterCategory: 'T-Shirt', image: 'https://framerusercontent.com/images/SPZzAXp3MGGvfY6xYZzIzXbt9HI.jpeg?width=2000&height=3000' },
          { title: 'Shirt', filterCategory: 'Shirt', image: 'https://framerusercontent.com/images/LIiUpXMeQEBfuNgYYaeO1PyL5BA.jpg?width=800&height=1200' },
          { title: 'Jeans', filterCategory: 'Jeans', image: 'https://framerusercontent.com/images/mqgBZP4952uBDqPQX6hHfyoX6fM.png?width=859&height=1200' }
        ];
        const openCat = (cat) => {
          setSaleCategoryFilter(cat?.filterCategory || cat?.title || 'ALL');
          document.getElementById('sale')?.scrollIntoView({ behavior: 'smooth' });
        };
        const renderCatCard = (cat, heightClass, extraImgClass = '') => {
          if (!cat) return null;
          return (
            <div
              key={cat.id || cat.title}
              onClick={() => openCat(cat)}
              className={`relative ${heightClass} overflow-hidden group cursor-pointer`}
            >
              <img
                src={cat.image}
                alt={cat.title}
                className={`w-full h-full object-cover ${extraImgClass} group-hover:scale-105 transition-transform duration-700`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-6">
                <h4 className="font-azeret font-bold text-3xl lg:text-[48px] tracking-[-2.4px] uppercase text-[#FFFFE3] drop-shadow-md">
                  {localizeCategory(cat.title, language)}
                </h4>
              </div>
            </div>
          );
        };
        return (
          <section id="categories" className="w-full max-w-[1400px] mx-auto py-20 px-4 sm:px-6 bg-[#111111]">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#222]">
              <h2 className="font-azeret font-bold text-4xl lg:text-[48px] tracking-[-2.4px] text-[#EA301F] uppercase">
                {language === 'en' ? (data?.categoriesSection?.title || t('sections.categoriesTitle')) : t('sections.categoriesTitle')}
              </h2>
              <a href="#sale" className="font-azeret font-bold text-2xl lg:text-[32px] tracking-[-1.6px] text-[#FFFFE3] hover:text-[#EA301F] transition-colors flex items-center gap-2">
                <span>{language === 'en' ? (data?.categoriesSection?.ctaText || t('sections.categoriesCta')) : t('sections.categoriesCta')}</span>
                <span>↗</span>
              </a>
            </div>

            {/* Collage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {renderCatCard(catItems[0], 'h-[262px]')}
                {renderCatCard(catItems[1], 'h-[262px]')}
                {renderCatCard(catItems[2], 'h-[480px] lg:h-[534px]', 'object-bottom')}
                {renderCatCard(catItems[3], 'h-[262px]')}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {renderCatCard(catItems[4], 'h-[480px] lg:h-[534px]', 'object-center')}
                {renderCatCard(catItems[5], 'h-[262px]')}
                {renderCatCard(catItems[6], 'h-[480px] lg:h-[534px]')}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: HOLY GRAILS (GRholyLS)
          Left: Grails + holy superimposed + VIEW ALL, Right: 3 cols of products
      ───────────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1400px] mx-auto py-20 px-4 sm:px-6 bg-[#111111]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Title */}
          <div className="lg:col-span-3 flex flex-col justify-between pb-8">
            <div>
              <div className="relative inline-block">
                <h2 className="font-azeret font-bold text-5xl lg:text-[70.4px] leading-[56.32px] tracking-[-3.52px] text-[#EA301F] uppercase">
                  {language === 'en' ? (data?.sectionHeaders?.holyGrails?.headline || t('sections.holyGrailsSuffix')) : t('sections.holyGrailsSuffix')}
                </h2>
                <h4 className="absolute inset-0 flex items-center justify-center font-serif-italic font-bold text-4xl lg:text-[48px] leading-[38.4px] tracking-[-2.4px] text-[#FFFFE3] pointer-events-none -mt-1">
                  {language === 'en' ? (data?.sectionHeaders?.holyGrails?.overlay || t('sections.holyGrailsPrefix')) : t('sections.holyGrailsPrefix')}
                </h4>
              </div>
              <a href="#sale" className="font-azeret font-bold text-2xl lg:text-[32px] tracking-[-1.6px] text-[#FFFFE3] hover:text-[#EA301F] mt-6 flex items-center gap-2 transition-colors">
                <span>{language === 'en' ? (data?.sectionHeaders?.holyGrails?.ctaText || t('sections.viewAll')) : t('sections.viewAll')}</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Right Product Grid (3 cols x 2 rows) */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[products[0], products[1], products[2], products[3], products[4], products[5]].filter(Boolean).map((prod) => (
              <ZaraProductCard
                key={prod.id}
                prod={prod}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
                formatPrice={formatPrice}
                onSelectProduct={handleSelectProduct}
                onQuickAddToCart={addToCart}
                onOpenFittingLab={handleOpenFittingLab}
                compact={true}
                language={language}
                t={t}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: CINEMATIC LOOKBOOK VIDEO BANNER (Pic 5!)
          Actual video of guy with dreads in blue night lighting!
          Superimposed "Rawline" + "clothing"
      ───────────────────────────────────────────────────────────── */}
      <section className="hero-photo-preserve w-full h-screen min-h-[850px] relative flex items-center justify-center bg-[#111111] overflow-hidden p-5">
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
          {/* Authentic Video Element */}
          <video
            src={data?.lookbook?.videoUrl || 'https://www.pexels.com/download/video/10380614/'}
            poster={data?.lookbook?.poster || 'https://framerusercontent.com/images/VuYyTMeqVjLcLafwEzMBiH706A.webp?width=1896&height=1000'}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />

          {/* Superimposed Title */}
          <div className="relative z-10 text-center px-4">
            <div className="relative inline-block">
              <h2 className="font-azeret font-bold text-6xl sm:text-7xl lg:text-[70.4px] leading-[56.32px] tracking-[-3.52px] text-[#FFFFE3] uppercase drop-shadow-2xl">
                {data?.lookbook?.headline || 'Rawline'}
              </h2>
              <h4 className="absolute inset-0 flex items-center justify-center font-serif-italic font-bold text-4xl sm:text-5xl lg:text-[48px] leading-[38.4px] tracking-[-2.4px] text-[#EA301F] pointer-events-none -mt-1">
                {language === 'en' ? (data?.lookbook?.overlay || t('lookbook.overlay')) : t('lookbook.overlay')}
              </h4>
            </div>

            <div className="mt-8">
              <a
                href="#sale"
                className="inline-block px-8 py-3 border border-[#FFFFE3] text-[#FFFFE3] font-azeret text-[19.2px] uppercase tracking-normal hover:bg-[#FFFFE3] hover:text-[#111111] transition-all duration-300 shadow-xl"
              >
                {language === 'en' ? (data?.lookbook?.ctaText || t('lookbook.ctaText')) : translateEditorialCopy(data?.lookbook?.ctaText || 'SHOP COLLECTION', language)} ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 9: NEW ARRIVALS (new ARRIVALS)
          MEN / WOMEN filter checkboxes, 4-col catalog
      ───────────────────────────────────────────────────────────── */}
      <section id="new-arrivals" className="w-full max-w-[1400px] mx-auto py-20 px-4 sm:px-6 bg-[#111111]">
        {/* Header with MEN / WOMEN pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-[#222] gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-baseline gap-3">
              <span className="font-serif-italic font-bold text-4xl lg:text-[48px] tracking-[-2.4px] text-[#FFFFE3]">
                {language === 'en' ? (data?.sectionHeaders?.newArrivals?.prefix || t('sections.newPrefix')) : t('sections.newPrefix')}
              </span>
              <span className="font-azeret font-bold text-4xl lg:text-[48px] tracking-[-2.4px] uppercase text-[#EA301F]">
                {language === 'en' ? (data?.sectionHeaders?.newArrivals?.suffix || t('sections.newSuffix')) : t('sections.newSuffix')}
              </span>
            </div>

            {/* Exact Framer Square Checkbox Filter Pills */}
            <div className="flex items-center gap-6 font-azeret text-[12.8px] font-medium tracking-tight">
              <button
                onClick={() => setActiveNewArrivalsTab('MEN')}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                  activeNewArrivalsTab === 'MEN' ? 'bg-[#EA301F] text-white' : 'border border-[#FFFFE3]/40'
                }`}>
                  {activeNewArrivalsTab === 'MEN' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="text-[#FFFFE3] group-hover:text-[#EA301F] transition-colors">{t('filters.man')}</span>
              </button>

              <button
                onClick={() => setActiveNewArrivalsTab('WOMEN')}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                  activeNewArrivalsTab === 'WOMEN' ? 'bg-[#EA301F] text-white' : 'border border-[#FFFFE3]/40'
                }`}>
                  {activeNewArrivalsTab === 'WOMEN' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="text-[#FFFFE3] group-hover:text-[#EA301F] transition-colors">{t('filters.woman')}</span>
              </button>
            </div>
          </div>

          <a href="#sale" className="font-azeret font-bold text-2xl lg:text-[32px] tracking-[-1.6px] text-[#FFFFE3] hover:text-[#EA301F] transition-colors flex items-center gap-2">
            <span>{t('sections.viewAll')}</span>
            <span>↗</span>
          </a>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {newArrivalsList.map(prod => (
            <ZaraProductCard
              key={prod.id}
              prod={prod}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              formatPrice={formatPrice}
              onSelectProduct={handleSelectProduct}
              onQuickAddToCart={addToCart}
              onOpenFittingLab={handleOpenFittingLab}
              language={language}
              t={t}
            />
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 10: SOCIAL WALL (Social wall)
          Alternating mosaic with dynamic quotes & editorial photography from data.reviews
      ───────────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1400px] mx-auto py-20 px-4 sm:px-6 bg-[#111111]">
        {/* Header with dynamic socials */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-[#222] gap-4">
          <div className="relative inline-block">
            <h2 className="font-azeret font-bold text-5xl lg:text-[70.4px] leading-[56.32px] tracking-[-3.52px] text-[#EA301F] uppercase">
              {language === 'en' ? (data?.sectionHeaders?.socialWall?.prefix || t('sections.socialPrefix')) : t('sections.socialPrefix')}
            </h2>
            <h4 className="absolute inset-0 flex items-center justify-center font-serif-italic font-bold text-4xl lg:text-[48px] leading-[38.4px] tracking-[-2.4px] text-[#FFFFE3] pointer-events-none -mt-1">
              {language === 'en' ? (data?.sectionHeaders?.socialWall?.suffix || t('sections.socialSuffix')) : t('sections.socialSuffix')}
            </h4>
          </div>

          <div className="flex items-center gap-8 font-azeret text-base uppercase">
            {(data?.footer?.socials || [
              { name: 'X', url: 'https://x.com' },
              { name: 'Facebook', url: 'https://facebook.com' },
              { name: 'Instagram', url: 'https://instagram.com' }
            ]).map((soc, idx) => (
              <a
                key={soc.name || idx}
                href={sanitizeSafeExternalUrl(soc.url, '#')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFFFE3] hover:text-[#EA301F] underline decoration-1 underline-offset-4 transition-colors"
              >
                {soc.name}
              </a>
            ))}
          </div>
        </div>

        {/* 4x2 Alternating Grid driven by data.reviews */}
        {(() => {
          const revList = (data?.reviews && data.reviews.length > 0) ? data.reviews : [];
          const defaultPhotos = [
            'https://framerusercontent.com/images/4JyNJK5h7DVDfgID8lBKhy3M.jpg?width=640&height=960',
            'https://framerusercontent.com/images/vfprU5p4ewa5iy7pKy0FpdX3A.jpg?width=640&height=960',
            'https://framerusercontent.com/images/grQPT0mJNGR4u9N7bpUUkvk720w.webp?width=800&height=1000',
            'https://framerusercontent.com/images/aoQHDlgf24ATYxdu0msFV5QjCU.webp?width=671&height=800'
          ];
          const tiles = [];
          revList.forEach((rev, i) => {
            const isRed = i === 0 || i === revList.length - 1 || Boolean(rev.accentBg);
            const quoteTile = (
              <div
                key={`q-${rev.id || i}`}
                className={`${isRed ? 'bg-[#EA301F]' : 'bg-[#141414] border border-[#222]'} p-6 flex flex-col justify-between min-h-[340px]`}
              >
                <p className="font-azeret font-bold text-base leading-relaxed text-[#FFFFE3] uppercase">
                  &ldquo;{translateEditorialCopy(rev.quote, language)}&rdquo;
                </p>
                <p dir="ltr" className="font-azeret font-bold text-base text-[#FFFFE3] uppercase mt-6">
                  -{rev.author}
                </p>
              </div>
            );
            const photoUrl = rev.image || defaultPhotos[i % defaultPhotos.length];
            const photoHref = rev.socialUrl || (data?.footer?.socials?.find((s) => s.name?.toLowerCase() === (rev.platform || '').toLowerCase())?.url) || 'https://instagram.com';
            const photoTile = (
              <div key={`p-${rev.id || i}`} className="relative h-[340px] overflow-hidden group">
                <img
                  src={photoUrl}
                  alt={rev.author || `Social Post ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <a
                  href={sanitizeSafeExternalUrl(photoHref, '#')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-azeret text-sm uppercase tracking-wider text-white"
                >
                  {t('sections.viewOn')} {rev.platform || 'Instagram'} ↗
                </a>
              </div>
            );
            if (i === 2) {
              tiles.push(photoTile, quoteTile);
            } else if (i === 3) {
              tiles.push(photoTile, quoteTile);
            } else {
              tiles.push(quoteTile, photoTile);
            }
          });
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiles}
            </div>
          );
        })()}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 11: GIFT CARD (Pic 4!)
          Curly hair model with glasses in leather jacket
          Smooth scroll scale zoom animation (1 -> 1.35)
      ───────────────────────────────────────────────────────────── */}
      <section
        ref={giftRef}
        className="hero-photo-preserve w-full h-screen min-h-[850px] relative flex items-center justify-center bg-[#111111] overflow-hidden px-4"
      >
        {/* Background Image with Smooth Scroll Scale Animation */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out will-change-transform"
          style={{
            backgroundImage: `url('${data?.giftCard?.bgImage || 'https://framerusercontent.com/images/fcUv7dMRjP5YP77zc5TUoOIeStQ.webp?width=2997&height=2000'}')`,
            transform: `scale(${1 + giftProgress * 0.3})`
          }}
        />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Content with parallax translateY */}
        <div
          className="relative z-10 max-w-4xl text-center px-4 transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${(1 - giftProgress) * 60}px)`
          }}
        >
          {/* Superimposed Title */}
          <div className="relative inline-block mb-6">
            <h2 className="font-azeret font-bold text-6xl sm:text-7xl lg:text-[70.4px] leading-[56.32px] tracking-[-3.52px] text-[#FFFFE3] uppercase drop-shadow-2xl">
              {data?.giftCard?.headline || 'Rawline'}
            </h2>
            <h4 className="absolute inset-0 flex items-center justify-center font-serif-italic font-bold text-4xl sm:text-5xl lg:text-[48px] leading-[38.4px] tracking-[-2.4px] text-[#EA301F] pointer-events-none -mt-1">
              {language === 'en' ? (data?.giftCard?.overlay || t('giftCard.overlay')) : t('giftCard.overlay')}
            </h4>
          </div>

          <p className="font-azeret font-normal text-base sm:text-lg lg:text-[19.2px] leading-[26.88px] text-[#FFFFE3] max-w-3xl mx-auto uppercase tracking-normal drop-shadow">
            {translateEditorialCopy(data?.giftCard?.description || "NOT SURE WHAT TO GRAB? KEEP IT REAL WITH THE RAWLINE GIFT CARD. FROM EXCLUSIVE DROPS TO EVERYDAY FITS, LET THEM CHOOSE THEIR VIBE. IT'S MORE THAN A GIFT, IT'S THEIR PASS INTO THE RAW WORLD.", language)}
          </p>

          <button
            onClick={() => {
              const cardItem = {
                id: 'gift-card',
                name: `${data?.brand?.name || 'KRONOS'} DIGITAL GIFT CARD`,
                price: typeof data?.giftCard?.price === 'number' ? data.giftCard.price : 250.00,
                oldPrice: null,
                discount: null,
                category: 'Gift Card',
                img: data?.giftCard?.cardImage || data?.giftCard?.bgImage || 'https://framerusercontent.com/images/3ZytNmcPnRvgkQrdPfnjNSmUHQ.png?width=1024&height=1024',
                desc: 'Digital voucher instantly delivered via email. Redeemable against all limited drops and mainline collections.'
              };
              addToCart(cardItem, 'DIGITAL', 'Standard', 1);
            }}
            className="inline-block mt-8 px-8 py-3 border border-[#FFFFE3] text-[#FFFFE3] font-azeret text-[19.2px] uppercase tracking-normal hover:bg-[#FFFFE3] hover:text-[#111111] transition-all duration-300 shadow-2xl cursor-pointer"
          >
            {language === 'en' ? (data?.giftCard?.ctaText || t('giftCard.ctaText')) : translateEditorialCopy(data?.giftCard?.ctaText || 'GET NOW', language)} ↗
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 12: WALK-IN STORES (walk-in STORES)
          Dynamically renders all stores configured in Admin Dashboard
      ───────────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1400px] mx-auto py-20 px-4 sm:px-6 bg-[#111111]">
        {/* Header */}
        <div className="pb-8 mb-10 border-b border-[#222] flex items-baseline gap-3">
          <span className="font-serif-italic font-bold text-4xl lg:text-[48px] tracking-[-2.4px] text-[#FFFFE3]">
            {language === 'en' ? (data?.sectionHeaders?.storesSection?.prefix || t('sections.storesPrefix')) : t('sections.storesPrefix')}
          </span>
          <span className="font-azeret font-bold text-4xl lg:text-[48px] tracking-[-2.4px] uppercase text-[#EA301F]">
            {language === 'en' ? (data?.sectionHeaders?.storesSection?.suffix || t('sections.storesSuffix')) : t('sections.storesSuffix')}
          </span>
        </div>

        {/* Store Columns (Dynamic .map over all Admin stores) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(data?.stores || []).map((st, idx) => (
            <div key={st.id || idx}>
              <div className="relative h-[324px] overflow-hidden mb-6 group">
                <img
                  src={st.image || (idx % 2 === 0
                    ? 'https://framerusercontent.com/images/gqJnwudaBfsyzpMDRUVHcuY.webp?width=870&height=800'
                    : 'https://framerusercontent.com/images/RtzexXET68jVkKH97jdJpyotYOk.webp?width=799&height=800')}
                  alt={`${st.city || 'Flagship'} Store`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {st.status && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#111111]/85 border border-[#FFFFE3]/30 text-[10px] font-mono font-bold uppercase text-[#FFFFE3]">
                    {translateEditorialCopy(st.status, language)}
                  </span>
                )}
              </div>
              <h4 className="font-azeret font-bold text-3xl lg:text-[48px] tracking-[-2.4px] uppercase text-[#FFFFE3]">
                {st.city}
              </h4>
              <h5 className="font-serif-italic font-semibold text-2xl lg:text-[32px] tracking-[-1.6px] text-[#FFFFE3] mt-1">
                {st.district}
              </h5>
              {st.address && (
                <p className="font-azeret text-xs text-[#8E8E93] uppercase mt-2">
                  {st.address}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <p className="font-serif-italic font-medium text-base lg:text-[19.2px] text-[#FFFFE3]">
                  {translateEditorialCopy(st.hours, language)}
                </p>
                {st.phone && (
                  <span dir="ltr" className="font-mono text-xs text-[#EA301F] font-bold">
                    {st.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 13: FOOTER
          Logo, contact details, newsletter, pill links, currency selector, legal
      ───────────────────────────────────────────────────────────── */}
      <footer className="w-full max-w-[1400px] mx-auto pt-20 pb-12 px-4 sm:px-6 border-t border-[#222] bg-[#111111]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 border-b border-[#222]">
          {/* Col 1: Logo & Contact (4 cols) */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <KronosLogo className="w-10 h-9" />
              <div>
                <h5 className="font-azeret font-bold text-xl uppercase text-[#FFFFE3]">{data?.brand?.name || 'KRONOS'}</h5>
                <p className="font-azeret text-xs text-[#787878] uppercase">{language === 'en' ? (data?.brand?.badgeText || t('footer.archiveTag')) : t('footer.archiveTag')}</p>
              </div>
            </div>

            <div className="font-azeret text-xs text-[#8E8E93] space-y-1">
              <p className="text-[#FFFFE3] font-bold uppercase mb-2">{t('footer.contactUs')}</p>
              <p>{data?.footer?.studioName || 'RAW Studio'}</p>
              <p>{data?.footer?.address || '12 Forge Lane, Riverton'}</p>
              <p dir="ltr" className="pt-2 text-[#FFFFE3]">{data?.footer?.email || 'hello@raw.example'}</p>
              <p dir="ltr">{data?.footer?.phone || '+1 (555) 010-2025'}</p>
            </div>
          </div>

          {/* Col 2: Newsletter (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <p className="font-azeret text-sm uppercase text-[#FFFFE3] leading-relaxed">
              {language === 'en'
                ? (data?.footer?.newsletterTitle || t('footer.newsletterTitle'))
                : translateEditorialCopy(data?.footer?.newsletterTitle || 'Join to receive exclusive offers and 15% off your first order.', language)}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (newsletterEmail) {
                  await subscribeNewsletter(newsletterEmail);
                  setNewsletterSubmitted(true);
                  setTimeout(() => setNewsletterSubmitted(false), 4000);
                  setNewsletterEmail('');
                }
              }}
              className="space-y-3"
            >
              <div className="relative border-b-2 border-[#EA301F] pb-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={t('footer.newsletterPlaceholder')}
                  className="w-full bg-transparent font-azeret text-sm text-[#FFFFE3] placeholder-[#666] outline-none uppercase"
                />
              </div>
              <button
                type="submit"
                className="font-azeret font-bold text-xs uppercase tracking-wider text-[#EA301F] hover:text-white transition-colors cursor-pointer"
              >
                {newsletterSubmitted ? t('footer.subscribed') : t('footer.subscribe')}
              </button>
            </form>
          </div>

          {/* Col 3: Navigation Links & Currency (4 cols) */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div className="flex flex-wrap gap-4 font-azeret text-sm uppercase">
              <a href="#sale" className="text-[#FFFFE3] hover:text-[#EA301F] transition-colors">{t('footer.navAll')}</a>
              <a href="#drops" className="text-[#FFFFE3] hover:text-[#EA301F] transition-colors">{t('footer.navDrops')}</a>
              <a href="#new-arrivals" className="text-[#FFFFE3] hover:text-[#EA301F] transition-colors">{t('footer.navNew')}</a>
              <button onClick={() => setShowAIChat(true)} className="text-[#EA301F] hover:text-white transition-colors uppercase cursor-pointer">{t('footer.navAi')}</button>
              <a href="#sale" className="text-[#EA301F] hover:text-white transition-colors">{t('footer.navSale')}</a>
              <a href="#about" className="text-[#FFFFE3] hover:text-[#EA301F] transition-colors">{t('footer.navAbout')}</a>
              <a href="#categories" className="text-[#FFFFE3] hover:text-[#EA301F] transition-colors">{t('footer.navCategories')}</a>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-6 font-azeret text-xs uppercase text-[#8E8E93]">
                {(data?.footer?.socials || [
                  { name: 'X', url: 'https://x.com' },
                  { name: 'Facebook', url: 'https://facebook.com' },
                  { name: 'Instagram', url: 'https://instagram.com' }
                ]).map((soc, idx) => (
                  <a
                    key={soc.name || idx}
                    href={sanitizeSafeExternalUrl(soc.url, '#')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {soc.name}
                  </a>
                ))}
              </div>

              {/* Currency Selector Pill */}
              <button
                onClick={() => setShowCountryModal(true)}
                className="flex items-center gap-2 border border-[#FFFFE3]/30 px-3 py-1.5 rounded-full font-azeret text-xs uppercase text-[#FFFFE3] hover:border-[#EA301F] transition-colors cursor-pointer"
              >
                <span>{currentCurrency.flag}</span>
                <span dir="ltr">{currentCurrency.code} ({currentCurrency.symbol})</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-azeret text-xs text-[#787878] uppercase">
          <div>{translateEditorialCopy(data?.footer?.credits || 'Built in Framer by Syed · Recreated for Kayan Studio', language)}</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a>
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-[#EA301F] hover:text-white font-bold transition-colors cursor-pointer"
              >
                {t('footer.adminStudio')}
              </button>
            )}
          </div>
          <div>{translateEditorialCopy(data?.footer?.copyright || '© 2026 RAWLINE STREETWEAR', language)}</div>
        </div>
      </footer>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: SMART COUNTRY / CURRENCY SELECTOR (as shown in diagnostic)
          Glitchy landscape art + select your currency
      ───────────────────────────────────────────────────────────── */}
      {showCountryModal && (
        <div
          onClick={() => setShowCountryModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141418] border border-[#26262B] rounded-2xl max-w-sm w-full overflow-hidden p-5 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <h3 className="font-azeret font-bold text-xs uppercase tracking-wider text-white">
                {language === 'en' ? (data?.sectionHeaders?.countryModal?.title || t('currencyModal.title')) : t('currencyModal.title')}
              </h3>
              <button
                onClick={() => setShowCountryModal(false)}
                className="text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Glitch Landscape Art Image */}
            <div className="my-4 rounded overflow-hidden h-40 border border-[#222] relative">
              <img
                src={data?.sectionHeaders?.countryModal?.bannerImage || 'https://framerusercontent.com/images/Qwxop40QQBpQNelDjnFRm3d1Mg.png'}
                alt="Currency Selector Visual"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Currency Options */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {currencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => {
                    setActiveCurrencyCode(c.code);
                    setShowCountryModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded font-azeret text-xs uppercase transition-colors ${
                    activeCurrencyCode === c.code
                      ? 'bg-[#EA301F] text-white font-bold'
                      : 'bg-[#1C1C22] text-[#FFFFE3] hover:bg-[#25252e]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </span>
                  <span>{c.code} ({c.symbol})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: SEARCH MODAL
      ───────────────────────────────────────────────────────────── */}
      {showSearchModal && (
        <div
          onClick={() => setShowSearchModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center pt-24 p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141418] border border-[#26262B] rounded-2xl max-w-2xl w-full p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#222]">
              <div className="flex items-center gap-3 flex-1">
                <Search className="w-5 h-5 text-[#8E8E93]" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="bg-transparent font-azeret text-sm uppercase text-white placeholder-[#666] outline-none w-full"
                />
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 text-[#8E8E93] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
              {filteredProducts.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => {
                    handleSelectProduct(prod);
                    setShowSearchModal(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1C1C22] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={prod.img} alt={localizeProductName(prod.name, language)} className="w-11 h-14 object-cover object-top bg-[#ECECE9] rounded" />
                    <div>
                      <h4 className="font-azeret font-bold text-xs uppercase text-white">{localizeProductName(prod.name, language)}</h4>
                      <span className="font-azeret text-[10px] text-[#8E8E93]">{localizeGender(prod.gender, language)} • {localizeCategory(prod.category, language)}</span>
                    </div>
                  </div>
                  <span className="font-azeret font-bold text-xs text-white">{formatPrice(prod.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: CART / BAG DRAWER + REAL CUSTOMER CHECKOUT
      ───────────────────────────────────────────────────────────── */}
      {showCartDrawer && (
        <div
          onClick={() => {
            setShowCartDrawer(false);
            if (checkoutStep === 'success') setCheckoutStep('cart');
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141418] border-l border-[#26262B] h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#EA301F]" />
                  <h3 className="font-azeret font-bold text-lg uppercase text-white">
                    {checkoutStep === 'cart' && `${t('cart.title')} (${cartCount})`}
                    {checkoutStep === 'form' && t('cart.checkoutTitle')}
                    {checkoutStep === 'success' && t('cart.confirmedTitle')}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowCartDrawer(false);
                    if (checkoutStep === 'success') setCheckoutStep('cart');
                  }}
                  className="text-[#8E8E93] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {checkoutStep === 'cart' && (
                <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-sm font-azeret text-[#8E8E93]">
                      {t('cart.empty')}
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#1C1C22] rounded-xl border border-[#2A2A35]">
                        <div className="flex items-center gap-3">
                          <img src={item.product.img} alt={localizeProductName(item.product.name, language)} className="w-12 h-16 object-cover object-top bg-[#ECECE9] rounded shrink-0" />
                          <div>
                            <h4 className="font-azeret font-bold text-xs uppercase text-white truncate max-w-[160px]">
                              {localizeProductName(item.product.name, language)}
                            </h4>
                            <div className="flex items-center gap-1.5 font-azeret text-[10px] text-[#8E8E93] mt-0.5 flex-wrap">
                              <span>{t('cart.sizeLabel')}: <strong className="text-white">{item.size}</strong></span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full border border-white/20 inline-block shrink-0"
                                  style={{ backgroundColor: getColorHex(item.color) }}
                                />
                                <span className="text-[#A1A1AA]">{localizeColor(item.color, language) || t('cart.standardColor')}</span>
                              </span>
                              <span>•</span>
                              <span>{t('cart.qtyLabel')}: {item.quantity}</span>
                            </div>
                            <div className="font-azeret font-bold text-xs text-white mt-1">
                              {formatPrice(item.product.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-[#8E8E93] hover:text-[#EA301F]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {checkoutStep === 'form' && (
                <form
                  id="kronos-checkout-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (cart.length === 0) return;
                    setOrderSubmitting(true);
                    try {
                      const discountTnd = appliedPromo
                        ? appliedPromo.discount_type === 'percentage'
                          ? (cartTotal * Number(appliedPromo.discount_value)) / 100
                          : Math.min(cartTotal, Number(appliedPromo.discount_value))
                        : 0;
                      const shippingTnd = cartTotal >= 300 ? 0 : 8;
                      const totalTnd = Math.max(0, cartTotal - discountTnd + shippingTnd);

                      const res = await submitCustomerOrder({
                        ...checkoutForm,
                        items: cart.map((c) => ({
                          id: c.product.id,
                          name: c.product.name,
                          size: c.size,
                          color: c.color,
                          quantity: c.quantity,
                          price: c.product.price,
                          img: c.product.img
                        })),
                        subtotal_tnd: cartTotal,
                        discount_tnd: discountTnd,
                        shipping_tnd: shippingTnd,
                        total_tnd: totalTnd,
                        currency_code: activeCurrencyCode,
                        promo_code: appliedPromo?.code || null
                      });
                      if (res?.order) {
                        setConfirmedOrder(res.order);
                        setCart([]);
                        setAppliedPromo(null);
                        setPromoCodeInput('');
                        setCheckoutStep('success');
                      }
                    } finally {
                      setOrderSubmitting(false);
                    }
                  }}
                  className="mt-5 space-y-3 text-xs font-inter"
                >
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="text-[11px] font-azeret text-[#8E8E93] hover:text-white uppercase cursor-pointer"
                  >
                    {t('cart.backToBag')}
                  </button>

                  <div>
                    <label className="block font-azeret text-[10px] text-[#8E8E93] uppercase mb-1">{t('cart.fullName')}</label>
                    <input
                      required
                      value={checkoutForm.customer_name}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_name: e.target.value })}
                      placeholder={t('cart.fullNamePh')}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#1C1C22] border border-[#2A2A35] text-white outline-none focus:border-[#EA301F]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-azeret text-[10px] text-[#8E8E93] uppercase mb-1">{t('cart.emailLabel')}</label>
                      <input
                        type="email"
                        required
                        value={checkoutForm.customer_email}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_email: e.target.value })}
                        placeholder="you@email.com"
                        className="w-full px-3 py-2.5 rounded-lg bg-[#1C1C22] border border-[#2A2A35] text-white outline-none focus:border-[#EA301F]"
                      />
                    </div>
                    <div>
                      <label className="block font-azeret text-[10px] text-[#8E8E93] uppercase mb-1">{t('cart.phoneLabel')}</label>
                      <input
                        required
                        value={checkoutForm.customer_phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_phone: e.target.value })}
                        placeholder="+216 XX XXX XXX"
                        className="w-full px-3 py-2.5 rounded-lg bg-[#1C1C22] border border-[#2A2A35] text-white outline-none focus:border-[#EA301F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-azeret text-[10px] text-[#8E8E93] uppercase mb-1">{t('cart.cityLabel')}</label>
                      <input
                        required
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                        placeholder={t('cart.cityPh')}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#1C1C22] border border-[#2A2A35] text-white outline-none focus:border-[#EA301F]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block font-azeret text-[10px] text-[#8E8E93] uppercase mb-1">{t('cart.addressLabel')}</label>
                      <input
                        required
                        value={checkoutForm.shipping_address}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, shipping_address: e.target.value })}
                        placeholder={t('cart.addressPh')}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#1C1C22] border border-[#2A2A35] text-white outline-none focus:border-[#EA301F]"
                      />
                    </div>
                  </div>

                  {/* Promo Code Box */}
                  <div className="pt-1">
                    <label className="block font-azeret text-[10px] text-[#8E8E93] uppercase mb-1">{t('cart.promoLabel')}</label>
                    <div className="flex gap-2">
                      <input
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value.toUpperCase());
                          setPromoError('');
                        }}
                        placeholder={t('cart.promoPh')}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#1C1C22] border border-[#2A2A35] text-white font-mono uppercase outline-none"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await validatePromoCode(promoCodeInput, cartTotal);
                          if (res?.error) {
                            setPromoError(res.error);
                            setAppliedPromo(null);
                          } else if (res) {
                            setAppliedPromo(res);
                            setPromoError('');
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-white text-black font-azeret font-bold text-[10px] uppercase cursor-pointer"
                      >
                        {t('cart.applyBtn')}
                      </button>
                    </div>
                    {promoError && <p className="text-[11px] text-[#EA301F] mt-1">{promoError}</p>}
                    {appliedPromo && (
                      <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                        ✓ {appliedPromo.code} {t('cart.appliedSuffix')} (-
                        {appliedPromo.discount_type === 'percentage'
                          ? `${appliedPromo.discount_value}%`
                          : `${appliedPromo.discount_value} DT`}
                        )
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-azeret text-[10px] text-[#8E8E93] uppercase mb-1">{t('cart.notesLabel')}</label>
                    <textarea
                      rows={2}
                      value={checkoutForm.notes}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                      placeholder={t('cart.notesPh')}
                      className="w-full px-3 py-2 rounded-lg bg-[#1C1C22] border border-[#2A2A35] text-white outline-none"
                    />
                  </div>
                </form>
              )}

              {checkoutStep === 'success' && confirmedOrder && (
                <div className="mt-8 p-5 rounded-xl bg-[#1C1C22] border border-emerald-500/40 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="font-azeret text-xs uppercase text-emerald-400 font-bold">
                    {t('cart.commandeRegistered')}
                  </p>
                  <p className="font-mono text-xl font-black text-white">
                    {confirmedOrder.order_number}
                  </p>
                  <p className="text-xs text-[#A1A1AA]">
                    {t('cart.thankYouOrderPrefix')} {confirmedOrder.customer_name}! {t('cart.thankYouOrderMid')}{' '}
                    <strong dir="ltr" className="text-white">
                      {Number(confirmedOrder.total_tnd || 0).toFixed(2)} DT
                    </strong>{' '}
                    {t('cart.thankYouOrderSuffix')}
                  </p>
                  <button
                    onClick={() => {
                      setCheckoutStep('cart');
                      setShowCartDrawer(false);
                    }}
                    className="w-full mt-2 py-3 rounded-lg bg-[#EA301F] text-white font-azeret font-bold text-xs uppercase cursor-pointer"
                  >
                    {t('cart.continueShopping')}
                  </button>
                </div>
              )}
            </div>

            {checkoutStep !== 'success' && (
              <div className="pt-6 border-t border-[#222]">
                <div className="flex items-center justify-between font-azeret text-sm mb-4">
                  <span className="text-[#8E8E93] uppercase">
                    {checkoutStep === 'form' ? t('cart.estimatedTotalShipping') : t('cart.estimatedTotal')}
                  </span>
                  <span className="font-bold text-xl text-white">
                    {formatPrice(
                      checkoutStep === 'form'
                        ? Math.max(
                            0,
                            cartTotal -
                              (appliedPromo
                                ? appliedPromo.discount_type === 'percentage'
                                  ? (cartTotal * Number(appliedPromo.discount_value)) / 100
                                  : Math.min(cartTotal, Number(appliedPromo.discount_value))
                                : 0) +
                              (cartTotal >= 300 || cartTotal === 0 ? 0 : 8)
                          )
                        : cartTotal
                    )}
                  </span>
                </div>
                {checkoutStep === 'cart' ? (
                  <button
                    disabled={cart.length === 0}
                    onClick={() => setCheckoutStep('form')}
                    className="w-full bg-[#EA301F] hover:bg-[#ff3b29] disabled:opacity-50 text-white py-4 font-azeret font-bold text-sm uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    {t('cart.checkout')}
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="kronos-checkout-form"
                    disabled={orderSubmitting || cart.length === 0}
                    className="w-full bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-black py-4 font-azeret font-bold text-sm uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    {orderSubmitting ? t('cart.processing') : t('cart.confirmOrder')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: WISHLIST DRAWER
      ───────────────────────────────────────────────────────────── */}
      {showWishlistDrawer && (
        <div
          onClick={() => setShowWishlistDrawer(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141418] border-l border-[#26262B] h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#EA301F] fill-[#EA301F]" />
                  <h3 className="font-azeret font-bold text-lg uppercase text-white">{t('wishlist.title')} ({wishlist.length})</h3>
                </div>
                <button onClick={() => setShowWishlistDrawer(false)} className="text-[#8E8E93] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-3 max-h-[70vh] overflow-y-auto">
                {wishlist.length === 0 ? (
                  <div className="text-center py-12 text-sm font-azeret text-[#8E8E93]">
                    {t('wishlist.empty')}
                  </div>
                ) : (
                  wishlist.map(id => {
                    const prod = products.find(p => p.id === id);
                    if (!prod) return null;
                    return (
                      <div key={id} className="flex items-center justify-between p-3 bg-[#1C1C22] rounded-xl border border-[#2A2A35]">
                        <div
                          onClick={() => {
                            setShowWishlistDrawer(false);
                            handleSelectProduct(prod);
                          }}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2 group"
                        >
                          <img src={prod.img} alt={localizeProductName(prod.name, language)} className="w-11 h-14 object-cover object-top bg-[#ECECE9] rounded shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-azeret font-bold text-xs uppercase text-white group-hover:text-[#EA301F] truncate transition-colors">{localizeProductName(prod.name, language)}</h4>
                            <span className="font-azeret font-bold text-xs text-white">{formatPrice(prod.price)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(prod, prod.sizes?.[0] || 'M', prod.colors?.[0] || 'Standard', 1)}
                          className="px-3 py-1.5 bg-[#EA301F] text-white font-azeret text-[10px] font-bold rounded cursor-pointer shrink-0"
                        >
                          {t('wishlist.moveToBag')}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Persistent Floating Customize Studio Trigger ── */}
      {onOpenCustomizer && (
        <button
          onClick={onOpenCustomizer}
          className="fixed bottom-6 right-6 z-40 bg-[#141418]/95 hover:bg-[#1C1C22] text-[#FFFFE3] hover:text-[#EA301F] border border-[#2D2D35] hover:border-[#EA301F]/60 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2.5 backdrop-blur-xl shadow-2xl transition-all group hover:scale-105 cursor-pointer"
          title="Open Visual Studio & Live Customizer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#EA301F] animate-pulse" />
          <Sliders className="w-4 h-4 text-[#EA301F] group-hover:rotate-45 transition-transform" />
          <span>{t('footer.customizeStore')}</span>
        </button>
      )}

      {/* ── 3D Real Human Fitting Lab & Virtual Try-On Studio ── */}
      <Rawline3DFittingLab
        isOpen={showFittingLab || externalFittingLabOpen}
        onClose={() => {
          setShowFittingLab(false);
          if (onCloseFittingLab) onCloseFittingLab();
        }}
        product={fittingLabProduct}
        allProducts={products}
        onAddToCart={(prod, sz, qty, col) => addToCart(prod, sz, col, qty)}
        initialSize="L"
        onAddProduct={onAddProduct}
        onUpdateProduct={onUpdateProduct}
        onDeleteProduct={onDeleteProduct}
        uploadImage={uploadImage}
      />

      {/* ── Persistent Floating AI Stylist Widget (Groq + Graph RAG) ── */}
      <RawlineAIChatbot
        isOpen={showAIChat}
        setIsOpen={setShowAIChat}
        storeData={data}
        products={products}
        drops={data?.drops}
        brandName={data?.brand?.name}
        faqs={data?.faqs}
        footer={data?.footer}
        formatPrice={formatPrice}
        addToCart={addToCart}
        onOpenFittingLab={handleOpenFittingLab}
        onSelectProduct={handleSelectProduct}
        activeCurrencyCode={activeCurrencyCode}
        currentCurrency={currentCurrency}
        language={language}
      />

    </div>
  );
}
