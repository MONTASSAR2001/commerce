import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Plus,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  MapPin,
  Truck,
  Ruler,
  ShieldCheck,
  Maximize2,
  X
} from 'lucide-react';
import {
  createTranslator,
  localizeProductName,
  localizeCategory,
  localizeGender,
  localizeColor,
  translateEditorialCopy
} from '../lib/i18nEngine';

const getFallbackHex = (colorName = '') => {
  const map = {
    black: '#111111',
    charcoal: '#2F323A',
    white: '#F5F5F5',
    ecru: '#EFECE3',
    cream: '#EDEAE0',
    beige: '#D9CDB8',
    sand: '#D2C2A8',
    taupe: '#9C8C7E',
    brown: '#5C4033',
    camel: '#B58958',
    blue: '#253241',
    navy: '#1B2845',
    indigo: '#283854',
    green: '#2A4D3E',
    khaki: '#5B6248',
    olive: '#556B2F',
    red: '#9E1B1B',
    burgundy: '#5C1622',
    pink: '#D6A1A8',
    grey: '#7C7F84',
    gray: '#7C7F84'
  };
  const lower = String(colorName).toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v;
  }
  return '#3F3F46';
};

export default function ZaraProductDetailPage({
  product,
  allProducts = [],
  stores = [],
  selectedColorIdx = 0,
  onSelectColorIdx,
  selectedSize,
  onSelectSize,
  onAddToCart,
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onBackToStore,
  onOpenFittingLab,
  onOpenSearch,
  onOpenCart,
  onOpenWishlist,
  onOpenCurrency,
  cartCount = 0,
  activeCurrencyCode = 'TND',
  formatPrice,
  language = 'en'
}) {
  const t = createTranslator(language);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('composition');
  const [quickAddId, setQuickAddId] = useState(null);
  const [justAdded, setJustAdded] = useState(false);

  // Reset gallery index & accordions when switching product or color variant
  useEffect(() => {
    setActivePhotoIdx(0);
    setZoomPhotoUrl(null);
    setQuickAddId(null);
  }, [product?.id, selectedColorIdx]);

  // Build normalized color variants
  const variants = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
      return product.colorVariants;
    }
    return (product.colors || ['Standard']).map((c) => ({
      name: c,
      hex: getFallbackHex(c),
      reference: product.reference || '',
      images: product.images || [product.img]
    }));
  }, [product]);

  const activeVariant = variants[selectedColorIdx] || variants[0] || {};
  const gallery = useMemo(() => {
    if (Array.isArray(activeVariant?.images) && activeVariant.images.length > 0) {
      return activeVariant.images;
    }
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images;
    }
    return [product?.img || product?.image].filter(Boolean);
  }, [activeVariant, product]);

  const heroImage = gallery[activePhotoIdx] || gallery[0];
  const secondaryImages = gallery.filter((_, idx) => idx !== activePhotoIdx);

  // Parse Zara model height + garment description cleanly
  const { modelHeightLine, bodyDescription } = useMemo(() => {
    const raw = String(product?.desc || product?.description || '').trim();
    const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const heightLine = lines.find((l) => /model height/i.test(l)) || '';
    const remaining = lines.filter((l) => !/model height/i.test(l)).join(' ');
    return {
      modelHeightLine: heightLine,
      bodyDescription: remaining || raw
    };
  }, [product]);

  // Same-gender complementary items ("COMPLETE YOUR LOOK") from different categories
  const completeYourLook = useMemo(() => {
    if (!product) return [];
    const sameGender = allProducts.filter(
      (p) => p.id !== product.id && p.gender === product.gender && p.category !== product.category
    );
    const seenCats = new Set();
    const picks = [];
    for (const item of sameGender) {
      if (!seenCats.has(item.category)) {
        seenCats.add(item.category);
        picks.push(item);
      }
      if (picks.length >= 3) break;
    }
    return picks;
  }, [allProducts, product]);

  // Horizontal filmstrip items (Pic 3 style): same gender, same category first then rest
  const filmstripItems = useMemo(() => {
    if (!product) return [];
    const sameGender = allProducts.filter((p) => p.gender === product.gender);
    const sameCat = sameGender.filter((p) => p.category === product.category);
    const others = sameGender.filter((p) => p.category !== product.category);
    return [...sameCat, ...others].slice(0, 16);
  }, [allProducts, product]);

  // "YOU MAY BE INTERESTED IN" grid (Pic 5 style): 12 same-gender products excluding current
  const interestedItems = useMemo(() => {
    if (!product) return [];
    const sameGender = allProducts.filter((p) => p.id !== product.id && p.gender === product.gender);
    const sameCatFirst = sameGender.filter((p) => p.category === product.category);
    const rest = sameGender.filter((p) => p.category !== product.category);
    return [...sameCatFirst, ...rest].slice(0, 12);
  }, [allProducts, product]);

  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);
  const sizes = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ['XS', 'S', 'M', 'L', 'XL'];
  const refCode = activeVariant?.reference || product.reference || '';

  const handlePrimaryAdd = () => {
    onAddToCart(
      { ...product, img: heroImage, image: heroImage },
      selectedSize || sizes[0] || 'M',
      activeVariant?.name || 'Standard',
      1
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-[#FFFFFF] text-[#111111] pt-6 sm:pt-8 pb-20 selection:bg-[#111111] selection:text-white">
      {/* ── Top Zara Architectural Header & Breadcrumb Bar (No floating black pill) ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono uppercase tracking-[0.14em] text-[#555555]">
          <button
            onClick={() => onBackToStore('#sale')}
            className="inline-flex items-center gap-1.5 text-[#111111] hover:text-[#EA301F] font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('product.backToCollection')}</span>
          </button>
          <span className="text-black/25">/</span>
          <button
            onClick={() => onBackToStore('#sale', product.gender)}
            className="hover:text-[#111111] transition-colors cursor-pointer"
          >
            {localizeGender(product.gender, language)}
          </button>
          <span className="text-black/25">/</span>
          <span className="text-[#111111]">{localizeCategory(product.category, language)}</span>
          <span className="hidden md:inline text-black/25">/</span>
          <span className="hidden md:inline text-black/50 truncate max-w-[260px]">{localizeProductName(product.name, language)}</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#111111]">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hover:text-[#EA301F] transition-colors border-b border-black/40 pb-0.5 cursor-pointer"
            >
              {t('product.search')}
            </button>
          )}
          {onOpenCurrency && (
            <button
              onClick={onOpenCurrency}
              className="hidden sm:inline-block text-[#555555] hover:text-[#111111] transition-colors cursor-pointer"
            >
              {activeCurrencyCode}
            </button>
          )}
          {onOpenWishlist && (
            <button
              onClick={onOpenWishlist}
              className="hidden sm:inline-block hover:text-[#EA301F] transition-colors cursor-pointer"
            >
              {t('product.saved')} ({wishlist.length})
            </button>
          )}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="hover:text-[#EA301F] font-semibold transition-colors cursor-pointer"
            >
              {t('product.bag')} [{cartCount}]
            </button>
          )}
          <button
            onClick={() => onOpenFittingLab({ ...product, img: heroImage, image: heroImage })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-black/20 hover:border-[#EA301F] hover:bg-[#EA301F] hover:text-white text-[10px] font-mono uppercase tracking-[0.14em] transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>{t('nav.lab3d')}</span>
          </button>
        </div>
      </div>

      {/* ── Main Split PDP Container (Pic 2 + Pic 4 Layout) ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">

          {/* LEFT COLUMN: Editorial Zara Studio Gallery (Hero + 2-col angle grid on scroll) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Primary Hero Frame */}
            <div className="relative aspect-[2/3] w-full bg-[#F5F5F3] overflow-hidden group">
              <img
                src={heroImage}
                alt={`${product.name} - ${activeVariant?.name || ''}`}
                onClick={() => setZoomPhotoUrl(heroImage)}
                className="w-full h-full object-cover object-top cursor-zoom-in transition-transform duration-700 group-hover:scale-[1.015]"
              />

              {/* Discount / New tag subtle Zara stamp */}
              {product.discount ? (
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#EA301F] text-white text-[10px] font-mono font-bold uppercase tracking-widest">
                  {product.discount}
                </span>
              ) : product.badge ? (
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 text-[#111111] text-[10px] font-mono uppercase tracking-widest border border-black/10">
                  {product.badge}
                </span>
              ) : null}

              {/* Expand button */}
              <button
                onClick={() => setZoomPhotoUrl(heroImage)}
                title="Zoom studio view"
                className="absolute bottom-3 right-3 w-8 h-8 bg-white/85 hover:bg-white text-[#111111] flex items-center justify-center border border-black/10 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Left / Right angle arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
                    }}
                    aria-label="Previous angle"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 hover:bg-white text-[#111111] flex items-center justify-center border border-black/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx((prev) => (prev + 1) % gallery.length);
                    }}
                    aria-label="Next angle"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 hover:bg-white text-[#111111] flex items-center justify-center border border-black/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip (Quick Jump across all angles) */}
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-16 h-24 shrink-0 bg-[#F5F5F3] overflow-hidden border transition-all cursor-pointer ${
                      idx === activePhotoIdx ? 'border-black opacity-100' : 'border-transparent opacity-55 hover:opacity-90'
                    }`}
                  >
                    <img src={imgUrl} alt={`Studio view ${idx + 1}`} className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            )}

            {/* Pic 4 Editorial 2-Column Studio Angle Grid below Hero */}
            {secondaryImages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {secondaryImages.map((imgUrl, i) => (
                  <div
                    key={i}
                    onClick={() => setZoomPhotoUrl(imgUrl)}
                    className="aspect-[2/3] w-full bg-[#F5F5F3] overflow-hidden cursor-zoom-in group"
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} detail ${i + 2}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Zara Sticky Purchase & Info Rail (Pic 2 Logic) */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 lg:self-start max-w-lg w-full">
            {/* Top Meta + Wishlist Bookmark */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#666666]">
                {product.badge || t('product.collection')} · {localizeGender(product.gender, language)}
              </span>
              <button
                onClick={() => onToggleWishlist(product.id)}
                title={isWishlisted ? 'Remove from saved' : 'Save item'}
                className="p-1.5 text-[#111111] hover:text-[#EA301F] transition-colors cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#EA301F] text-[#EA301F]' : ''}`} />
              </button>
            </div>

            {/* Title & TND Price with Zara Hairline Rule */}
            <h1 className="text-base sm:text-lg font-medium uppercase tracking-[0.06em] text-[#111111] leading-snug">
              {localizeProductName(product.name, language)}
            </h1>
            <div className="flex items-baseline gap-3 mt-1.5 pb-5 border-b border-black/15">
              <span className="text-sm sm:text-base font-medium tracking-wide text-[#111111]">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-xs text-black/40 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
              {product.discount && (
                <span dir="ltr" className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#EA301F] text-white uppercase">
                  {product.discount}
                </span>
              )}
            </div>

            {/* Color Name | Ref Code + Square Zara Color Swatches */}
            <div className="pt-5">
              <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#333333] mb-3">
                <span>{localizeColor(activeVariant?.name, language) || t('cart.standardColor').toUpperCase()}</span>
                {refCode && <span dir="ltr" className="text-black/45"> | {refCode}</span>}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {variants.map((cv, idx) => {
                  const isActive = idx === selectedColorIdx;
                  return (
                    <button
                      key={`${cv.name}-${idx}`}
                      onClick={() => onSelectColorIdx(idx)}
                      title={localizeColor(cv.name, language)}
                      className={`w-5 h-5 rounded-none transition-all cursor-pointer ${
                        isActive
                          ? 'ring-1 ring-[#111111] ring-offset-2'
                          : 'border border-black/25 hover:border-black'
                      }`}
                      style={{ backgroundColor: cv.hex || getFallbackHex(cv.name) }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Zara Clean Size Selector */}
            <div className="pt-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#333333]">
                  {t('product.selectSize')}
                </span>
                <span className="text-[11px] font-mono uppercase text-black/60">
                  {selectedSize}
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                {sizes.map((sz) => {
                  const active = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => onSelectSize(sz)}
                      className={`py-2.5 text-[11px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111] font-semibold'
                          : 'bg-white text-[#111111] border-black/20 hover:border-[#111111]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sharp Rectangular Zara ADD CTA + 3D Fitting Lab CTA */}
            <div className="pt-5 space-y-2.5">
              <button
                onClick={handlePrimaryAdd}
                className={`w-full py-3.5 text-[11px] font-mono uppercase tracking-[0.22em] font-semibold border transition-colors cursor-pointer ${
                  justAdded
                    ? 'bg-[#15803D] border-[#15803D] text-white'
                    : 'bg-[#111111] border-[#111111] text-white hover:bg-[#EA301F] hover:border-[#EA301F]'
                }`}
              >
                {justAdded
                  ? `${t('product.addedBanner')} — ${selectedSize} ✓`
                  : `${t('product.addToBag')}  (${selectedSize} · ${localizeColor(activeVariant?.name, language) || t('cart.standardColor').toUpperCase()})`}
              </button>

              <button
                onClick={() => onOpenFittingLab({ ...product, img: heroImage, image: heroImage })}
                className="w-full py-3 text-[11px] font-mono uppercase tracking-[0.16em] border border-black/25 hover:border-[#111111] text-[#111111] hover:bg-[#F5F5F3] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#EA301F]" />
                <span>{t('product.tryOn3dFull')}</span>
              </button>
            </div>

            {/* Model Height + Expandable Description (Pic 2) */}
            <div className="pt-6 pb-5 border-b border-black/15 text-xs text-[#333333] leading-relaxed space-y-2.5">
              {modelHeightLine && (
                <p className="text-[11px] text-[#555555]">{modelHeightLine}</p>
              )}
              <p className={showFullDesc ? '' : 'line-clamp-3'}>
                {bodyDescription}
              </p>
              {bodyDescription.length > 110 && (
                <button
                  onClick={() => setShowFullDesc((v) => !v)}
                  className="text-[11px] underline underline-offset-4 text-[#111111] hover:text-[#EA301F] cursor-pointer"
                >
                  {showFullDesc ? t('product.viewLess') : t('product.viewMore')}
                </button>
              )}
            </div>

            {/* COMPLETE YOUR LOOK (Pic 2) */}
            {completeYourLook.length > 0 && (
              <div className="pt-5 pb-5 border-b border-black/15">
                <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#111111] mb-3">
                  {t('product.completeLook')}
                </h2>
                <div className="grid grid-cols-3 gap-2.5">
                  {completeYourLook.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelectProduct(item, 0)}
                      className="text-left group cursor-pointer"
                    >
                      <div className="aspect-[2/3] w-full bg-[#F5F5F3] overflow-hidden mb-1.5">
                        <img
                          src={item.img || item.image}
                          alt={localizeProductName(item.name, language)}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <p className="text-[10px] uppercase tracking-wide text-[#111111] truncate">
                        {localizeProductName(item.name, language)}
                      </p>
                      <p className="text-[10px] font-mono text-[#555555]">
                        {formatPrice(item.price)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zara Info Links / Accordions (Pic 2 Bottom Right) */}
            <div className="divide-y divide-black/10 text-[11px] font-mono uppercase tracking-[0.14em]">
              {/* PRODUCT MEASUREMENTS */}
              <div>
                <button
                  onClick={() => setOpenAccordion((v) => (v === 'measurements' ? '' : 'measurements'))}
                  className="w-full py-3.5 flex items-center justify-between text-start hover:text-[#EA301F] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 opacity-60" />
                    {t('product.measurements')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openAccordion === 'measurements' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'measurements' && (
                  <div className="pb-4 text-[11px] font-sans normal-case tracking-normal text-[#555555] space-y-1">
                    <p>{t('product.measurementsDesc')} (<span dir="ltr">{sizes.join(' / ')}</span>).</p>
                    <p>{t('product.measurementsTipPrefix')} <button onClick={() => onOpenFittingLab({ ...product, img: heroImage, image: heroImage })} className="underline text-[#111111] font-medium cursor-pointer">{t('product.measurementsTipLink')}</button> {t('product.measurementsTipSuffix')}</p>
                  </div>
                )}
              </div>

              {/* COMPOSITION & CARE */}
              <div>
                <button
                  onClick={() => setOpenAccordion((v) => (v === 'composition' ? '' : 'composition'))}
                  className="w-full py-3.5 flex items-center justify-between text-start hover:text-[#EA301F] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 opacity-60" />
                    {t('product.compositionCare')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openAccordion === 'composition' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'composition' && (
                  <ul className="pb-4 text-[11px] font-sans normal-case tracking-normal text-[#555555] space-y-1">
                    {(product.materialCare || ['100% Certified Apparel Craft', 'Machine wash at max 30°C']).map((line, i) => (
                      <li key={i}>• {line}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* CHECK IN-STORE AVAILABILITY */}
              <div>
                <button
                  onClick={() => setOpenAccordion((v) => (v === 'availability' ? '' : 'availability'))}
                  className="w-full py-3.5 flex items-center justify-between text-start hover:text-[#EA301F] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 opacity-60" />
                    {t('product.inStoreAvailability')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openAccordion === 'availability' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'availability' && (
                  <div className="pb-4 text-[11px] font-sans normal-case tracking-normal text-[#555555] space-y-1">
                    {(Array.isArray(stores) && stores.length > 0 ? stores : [
                      { city: 'London', district: 'Canary Wharf', status: 'IN STOCK' },
                      { city: 'New York City', district: 'Manhattan', status: 'IN STOCK' }
                    ]).map((st, idx) => (
                      <p key={st.id || idx}>
                        • <strong className="text-[#111111]">{st.city}{st.district ? ` — ${st.district}` : ''}</strong>: {translateEditorialCopy(st.status || 'OPEN TODAY', language)} ({selectedSize})
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* SHIPPING, EXCHANGES AND RETURNS */}
              <div>
                <button
                  onClick={() => setOpenAccordion((v) => (v === 'shipping' ? '' : 'shipping'))}
                  className="w-full py-3.5 flex items-center justify-between text-start hover:text-[#EA301F] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 opacity-60" />
                    {t('product.shippingReturns')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openAccordion === 'shipping' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pb-4 text-[11px] font-sans normal-case tracking-normal text-[#555555] space-y-1">
                    <p>• {t('product.shippingBullet1')}</p>
                    <p>• {t('product.shippingBullet2')}</p>
                    <p>• {t('product.shippingBullet3')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Pic 3 Style: Horizontal Studio Look Strip ── */}
        {filmstripItems.length > 0 && (
          <div className="mt-16 pt-8 border-t border-black/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#555555]">
                {localizeGender(product.gender, language)} {t('product.studioLineup')} · {localizeCategory(product.category, language)} &amp; {t('product.moreLabel')}
              </span>
              <span className="text-[10px] font-mono uppercase text-black/45">
                {t('product.clickPiece')}
              </span>
            </div>
            <div className="flex items-end gap-2.5 overflow-x-auto pb-4">
              {filmstripItems.map((item) => {
                const isCurrent = item.id === product.id;
                const thumbImg = item.images?.[item.images.length - 1] || item.img || item.image;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectProduct(item, 0)}
                    title={`${item.name} — ${formatPrice(item.price)}`}
                    className="flex flex-col items-center shrink-0 group cursor-pointer"
                  >
                    <div
                      className={`bg-[#F5F5F3] overflow-hidden transition-all duration-300 ${
                        isCurrent ? 'w-16 h-24 ring-1 ring-[#111111]' : 'w-12 h-18 opacity-75 group-hover:opacity-100'
                      }`}
                    >
                      <img
                        src={thumbImg}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <span
                      className={`mt-1.5 w-1 h-1 rounded-full ${
                        isCurrent ? 'bg-[#111111]' : 'bg-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pic 5 Style: YOU MAY BE INTERESTED IN (6-Column Zara Grid) ── */}
        {interestedItems.length > 0 && (
          <div className="mt-14 pt-10 border-t border-black/10">
            <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-[#111111] mb-6">
              {t('product.youMayLike')}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
              {interestedItems.map((item) => {
                const cardImg = item.img || item.image;
                const itemSizes = Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : ['XS', 'S', 'M', 'L', 'XL'];
                const isQuickOpen = quickAddId === item.id;

                return (
                  <div key={item.id} className="group flex flex-col">
                    <div
                      onClick={() => onSelectProduct(item, 0)}
                      className="relative aspect-[2/3] w-full bg-[#F5F5F3] overflow-hidden cursor-pointer mb-2"
                    >
                      <img
                        src={cardImg}
                        alt={localizeProductName(item.name, language)}
                        loading="lazy"
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      />

                      {isQuickOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-black/15 p-1.5"
                        >
                          <div className="flex flex-wrap gap-1 justify-center">
                            {itemSizes.slice(0, 6).map((sz) => (
                              <button
                                key={sz}
                                onClick={() => {
                                  onAddToCart(item, sz, item.colors?.[0] || 'Standard', 1);
                                  setQuickAddId(null);
                                }}
                                className="px-1.5 py-0.5 text-[9px] font-mono border border-black/20 hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectProduct(item, 0)}
                      className="text-start text-[10px] uppercase tracking-[0.06em] text-[#111111] hover:text-[#EA301F] truncate transition-colors cursor-pointer"
                    >
                      {localizeProductName(item.name, language)}
                    </button>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-mono text-[#333333]">
                        {formatPrice(item.price)}
                      </span>
                      <button
                        onClick={() => setQuickAddId((prev) => (prev === item.id ? null : item.id))}
                        title="Quick Add Size"
                        className="p-1 text-[#555555] hover:text-[#111111] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Fullscreen Zoom Lightbox on Studio Image Click ── */}
      {zoomPhotoUrl && (
        <div
          onClick={() => setZoomPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setZoomPhotoUrl(null)}
            className="fixed top-6 right-6 p-2.5 bg-[#111111] text-white hover:bg-[#EA301F] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={zoomPhotoUrl}
            alt={product.name}
            className="max-h-[92vh] max-w-full object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

