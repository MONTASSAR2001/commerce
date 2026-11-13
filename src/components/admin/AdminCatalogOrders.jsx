import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Check,
  X,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Package,
  Download,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Tag
} from 'lucide-react';
import { uploadMediaAsset } from '../../lib/kronosDataService';

/* ── 1. PRODUCT CATALOG & DYNAMIC PRICING MANAGER ──────────────────────────── */
export function CatalogManagerTab({
  products = [],
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onNotify
}) {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [editingPriceMap, setEditingPriceMap] = useState({});
  const [modalProduct, setModalProduct] = useState(null);
  const [isNewModal, setIsNewModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (genderFilter !== 'ALL' && (p.gender || 'MEN').toUpperCase() !== genderFilter) return false;
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (q) {
        const hit =
          (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.id || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [products, search, genderFilter, categoryFilter]);

  const handleQuickPriceSave = (prod) => {
    const draft = editingPriceMap[prod.id];
    if (!draft) return;
    const price = Math.max(0, Number(draft.price ?? prod.price));
    const originalPrice =
      draft.originalPrice !== undefined && draft.originalPrice !== ''
        ? Math.max(0, Number(draft.originalPrice))
        : undefined;
    let discount = prod.discount;
    if (originalPrice && originalPrice > price) {
      const pct = Math.round(((originalPrice - price) / originalPrice) * 100);
      discount = `${pct}% OFF`;
    } else if (draft.originalPrice === '') {
      discount = undefined;
    }

    onUpdateProduct(prod.id, {
      price,
      originalPrice,
      discount,
      stockQuantity: draft.stockQuantity != null ? Number(draft.stockQuantity) : prod.stockQuantity
    });
    setEditingPriceMap((prev) => {
      const next = { ...prev };
      delete next[prod.id];
      return next;
    });
    onNotify?.(`Updated pricing for ${prod.name} (${price.toFixed(2)} DT)`);
  };

  const openNewProductModal = () => {
    setIsNewModal(true);
    setModalProduct({
      id: `kronos-${Date.now().toString(36)}`,
      name: '',
      category: 'Jackets',
      gender: 'MEN',
      price: 249,
      originalPrice: '',
      discount: '',
      badge: 'NEW IN',
      img: 'https://static.zara.net/assets/public/7885/679c/95ba446d93fa/8fb1b0121dcd/01437388076-p/01437388076-p.jpg?ts=1794212222104&w=850',
      images: [],
      colors: ['Black', 'Ecru'],
      sizes: ['S', 'M', 'L', 'XL'],
      description: '',
      modelHeight: 'Model height: 185 cm',
      composition: '100% Cotton',
      garmentType: 'top',
      stockQuantity: 40,
      isPublished: true
    });
  };

  const openEditModal = (prod) => {
    setIsNewModal(false);
    setModalProduct({
      ...prod,
      originalPrice: prod.originalPrice ?? '',
      colorsText: (prod.colors || []).join(', '),
      sizesText: (prod.sizes || ['S', 'M', 'L', 'XL']).join(', '),
      galleryText: (prod.images || [prod.img].filter(Boolean)).join('\n')
    });
  };

  const handleModalImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !modalProduct) return;
    setUploadingPhoto(true);
    try {
      const res = await uploadMediaAsset(file, {
        mediaType: 'image',
        title: `${modalProduct.name || 'Product'} Photo`,
        linkedEntityType: 'product',
        linkedEntityId: modalProduct.id
      });
      if (res?.publicUrl) {
        const currentGallery = modalProduct.galleryText
          ? modalProduct.galleryText.split('\n').map((s) => s.trim()).filter(Boolean)
          : (modalProduct.images || []);
        const nextGallery = [res.publicUrl, ...currentGallery.filter((u) => u !== res.publicUrl)];
        setModalProduct((prev) => ({
          ...prev,
          img: res.publicUrl,
          images: nextGallery,
          galleryText: nextGallery.join('\n')
        }));
        onNotify?.(
          res.cloud
            ? 'Uploaded image to Supabase Storage (kronos-images)!'
            : res.authRequired
              ? 'Attached local preview — Sign in with montassarzarai0@gmail.com to upload to Supabase!'
              : res.cloudError
                ? `Attached locally — Supabase RLS blocked (${res.cloudError}).`
                : 'Image attached (local preview — connect Supabase Storage to persist in cloud).'
        );
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!modalProduct?.name?.trim()) return;

    const parsedImages = (modalProduct.galleryText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const primaryImg = modalProduct.img?.trim() || parsedImages[0] || '';
    const finalImages = parsedImages.length > 0 ? parsedImages : [primaryImg].filter(Boolean);

    const parsedColors = (modalProduct.colorsText || (modalProduct.colors || []).join(', '))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedSizes = (modalProduct.sizesText || (modalProduct.sizes || []).join(', '))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const price = Number(modalProduct.price || 0);
    const orig =
      modalProduct.originalPrice !== '' && modalProduct.originalPrice != null
        ? Number(modalProduct.originalPrice)
        : undefined;
    let discount = modalProduct.discount?.trim() || undefined;
    if (orig && orig > price && !discount) {
      discount = `${Math.round(((orig - price) / orig) * 100)}% OFF`;
    }

    // Keep colorVariants[0] synchronized so ProductCard and ZaraProductDetailPage
    // immediately render the updated primary & gallery images instead of old variant URLs.
    const existingVariants = Array.isArray(modalProduct.colorVariants) ? modalProduct.colorVariants : [];
    const mergedColors = parsedColors.length > 0 ? parsedColors : ['Standard'];
    const syncedVariants =
      existingVariants.length > 0
        ? existingVariants.map((v, vIdx) =>
            vIdx === 0 ? { ...v, name: mergedColors[0] || v.name, images: finalImages } : v
          )
        : mergedColors.map((cName) => ({
            name: cName,
            images: finalImages
          }));

    const payload = {
      ...modalProduct,
      price,
      originalPrice: orig,
      discount,
      img: primaryImg,
      images: finalImages,
      colorVariants: syncedVariants,
      colors: mergedColors,
      sizes: parsedSizes.length > 0 ? parsedSizes : ['S', 'M', 'L', 'XL'],
      slug:
        modalProduct.slug ||
        `${modalProduct.name}-${modalProduct.id}`
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/(^-|-$)/g, '')
    };
    delete payload.colorsText;
    delete payload.sizesText;
    delete payload.galleryText;

    if (isNewModal) {
      onAddProduct(payload);
      onNotify?.(`Added new garment "${payload.name}"`);
    } else {
      onUpdateProduct(payload.id, payload);
      onNotify?.(`Saved changes to "${payload.name}"`);
    }
    setModalProduct(null);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-[#171717]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item name, category, ID..."
              className="w-full pl-10 pr-4 py-2 rounded-[20px] border-[1.5px] border-[#171717] bg-white text-xs font-geist text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#ff6f1e]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#f7efe9] p-1 rounded-[20px] border-[1.5px] border-[#171717]">
            {['ALL', 'MEN', 'WOMEN'].map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 rounded-[16px] text-[11px] font-bold transition-all cursor-pointer ${
                  genderFilter === g
                    ? 'bg-[#171717] text-white'
                    : 'text-[#171717]/75 hover:bg-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-[20px] border-[1.5px] border-[#171717] bg-white text-xs font-bold text-[#171717] focus:outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>

        <button onClick={openNewProductModal} className="superr-pill-btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-[12px] border-[1.5px] border-[#171717] bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-[1.5px] border-[#171717] bg-[#f7efe9] text-[10px] font-mono uppercase tracking-wider text-[#171717]">
              <th className="py-3 px-3.5">Garment</th>
              <th className="py-3 px-3">Section / Cat</th>
              <th className="py-3 px-3">Price (DT)</th>
              <th className="py-3 px-3">Original (DT)</th>
              <th className="py-3 px-3">Stock</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171717]/15 text-xs font-geist">
            {filtered.map((prod) => {
              const draft = editingPriceMap[prod.id];
              const isDirty = Boolean(draft);
              const thumb = prod.img || prod.images?.[0] || prod.colorVariants?.[0]?.images?.[0];

              return (
                <tr key={prod.id} className="hover:bg-[#fdfbf9] transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-3 min-w-[230px]">
                      <img
                        src={thumb}
                        alt={prod.name}
                        className="w-11 h-14 object-cover object-top rounded-[6px] border-[1.2px] border-[#171717] bg-[#ECECE9] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#171717] truncate max-w-[220px]">
                          {prod.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-[#171717]/60">
                          <span>#{prod.id}</span>
                          {prod.discount && (
                            <span className="px-1.5 py-0.2 bg-[#EA301F]/15 text-[#EA301F] font-bold rounded">
                              {prod.discount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`px-2 py-0.5 rounded-[12px] text-[10px] font-mono font-bold border border-[#171717] ${
                          prod.gender === 'WOMEN'
                            ? 'bg-[#ff66cf]/20 text-[#9d174d]'
                            : 'bg-[#3b82f6]/15 text-[#1d4ed8]'
                        }`}
                      >
                        {prod.gender || 'MEN'}
                      </span>
                      <span className="text-[11px] font-semibold text-[#171717]/75">
                        {prod.category}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        value={draft?.price ?? prod.price}
                        onChange={(e) =>
                          setEditingPriceMap((prev) => ({
                            ...prev,
                            [prod.id]: { ...prev[prod.id], price: e.target.value }
                          }))
                        }
                        className="w-24 px-2 py-1.5 rounded-[8px] border-[1.2px] border-[#171717] font-mono font-bold text-xs bg-[#fdfbf9] focus:outline-none focus:ring-2 focus:ring-[#ff6f1e]"
                      />
                      <span className="text-[10px] font-mono font-bold text-[#171717]/60">DT</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="—"
                      value={draft?.originalPrice ?? (prod.originalPrice ?? '')}
                      onChange={(e) =>
                        setEditingPriceMap((prev) => ({
                          ...prev,
                          [prod.id]: { ...prev[prod.id], originalPrice: e.target.value }
                        }))
                      }
                      className="w-24 px-2 py-1.5 rounded-[8px] border-[1.2px] border-[#171717]/40 font-mono text-xs bg-white focus:outline-none focus:border-[#171717]"
                    />
                  </td>

                  <td className="py-3 px-3">
                    <input
                      type="number"
                      value={draft?.stockQuantity ?? (prod.stockQuantity ?? 50)}
                      onChange={(e) =>
                        setEditingPriceMap((prev) => ({
                          ...prev,
                          [prod.id]: { ...prev[prod.id], stockQuantity: e.target.value }
                        }))
                      }
                      className="w-16 px-2 py-1.5 rounded-[8px] border-[1.2px] border-[#171717]/40 font-mono text-xs bg-white text-center"
                    />
                  </td>

                  <td className="py-3 px-3">
                    <button
                      onClick={() =>
                        onUpdateProduct(prod.id, { isPublished: prod.isPublished === false })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[16px] border-[1.2px] border-[#171717] text-[10px] font-bold cursor-pointer ${
                        prod.isPublished !== false
                          ? 'bg-[#22c55e]/15 text-[#166534]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {prod.isPublished !== false ? (
                        <>
                          <Eye className="w-3 h-3" /> live
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> hidden
                        </>
                      )}
                    </button>
                  </td>

                  <td className="py-3 px-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {isDirty && (
                        <button
                          onClick={() => handleQuickPriceSave(prod)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[14px] border-[1.2px] border-[#171717] bg-[#22c55e] text-white text-[10px] font-bold shadow-[1px_1px_0px_#171717] cursor-pointer"
                          title="Save price & stock changes"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 rounded-[10px] border-[1.2px] border-[#171717] bg-[#f7efe9] hover:bg-[#ff6f1e] hover:text-white transition-colors cursor-pointer"
                        title="Edit details, photos & variants"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${prod.name}" from KRONOS catalog?`)) {
                            onDeleteProduct(prod.id);
                            onNotify?.(`Removed ${prod.name}`);
                          }
                        }}
                        className="p-1.5 rounded-[10px] border-[1.2px] border-[#171717] bg-white hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {modalProduct && (
        <div
          onClick={() => setModalProduct(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#fdfbf9] border-[2px] border-[#171717] rounded-[16px] shadow-[6px_6px_0px_#171717] p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b-[1.5px] border-[#171717]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#c2410c]">
                  {isNewModal ? 'Create Catalog Entry' : `Editing #${modalProduct.id}`}
                </span>
                <h3 className="font-gelica text-2xl font-bold text-[#2b1a07] lowercase">
                  {isNewModal ? 'add new garment' : modalProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setModalProduct(null)}
                className="p-2 rounded-[10px] border-[1.5px] border-[#171717] bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-5 space-y-4 font-geist text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-1">Product Name *</label>
                  <input
                    required
                    value={modalProduct.name}
                    onChange={(e) => setModalProduct({ ...modalProduct, name: e.target.value })}
                    placeholder="e.g. CROPPED WOOL BOMBER"
                    className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Gender</label>
                    <select
                      value={modalProduct.gender || 'MEN'}
                      onChange={(e) => setModalProduct({ ...modalProduct, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                    >
                      <option value="MEN">MEN</option>
                      <option value="WOMEN">WOMEN</option>
                      <option value="UNISEX">UNISEX</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Category</label>
                    <input
                      value={modalProduct.category || ''}
                      onChange={(e) =>
                        setModalProduct({ ...modalProduct, category: e.target.value })
                      }
                      placeholder="Jackets, Jeans, Shoes..."
                      className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold block mb-1">Price (DT) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={modalProduct.price}
                    onChange={(e) => setModalProduct({ ...modalProduct, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Original Price</label>
                  <input
                    type="number"
                    step="0.5"
                    value={modalProduct.originalPrice ?? ''}
                    onChange={(e) =>
                      setModalProduct({ ...modalProduct, originalPrice: e.target.value })
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Badge</label>
                  <input
                    value={modalProduct.badge || ''}
                    onChange={(e) => setModalProduct({ ...modalProduct, badge: e.target.value })}
                    placeholder="NEW IN / HOT"
                    className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">3D Garment Type</label>
                  <select
                    value={modalProduct.garmentType || 'top'}
                    onChange={(e) =>
                      setModalProduct({ ...modalProduct, garmentType: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                  >
                    <option value="top">Top / Jacket</option>
                    <option value="bottom">Bottom / Jeans</option>
                    <option value="shoes">Shoes / Boots</option>
                  </select>
                </div>
              </div>

              {/* Photo URL + Upload to Supabase Storage */}
              <div className="p-3.5 rounded-[12px] border-[1.5px] border-[#171717] bg-[#f7efe9] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold">Product Photography (Supabase Storage or URL)</label>
                  <label className="superr-pill-btn py-1.5 px-3 text-[11px]">
                    <Upload className="w-3.5 h-3.5 text-[#ff6f1e]" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo to Bucket'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleModalImageUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  {modalProduct.img && (
                    <img
                      src={modalProduct.img}
                      alt="preview"
                      className="w-16 h-20 object-cover rounded-[8px] border-[1.5px] border-[#171717] bg-white shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      value={modalProduct.img || ''}
                      onChange={(e) => setModalProduct({ ...modalProduct, img: e.target.value })}
                      placeholder="Primary Image HTTPS URL"
                      className="w-full px-3 py-2 rounded-[8px] border-[1.2px] border-[#171717] bg-white font-mono text-[11px]"
                    />
                    <textarea
                      rows={2}
                      value={modalProduct.galleryText ?? (modalProduct.images || []).join('\n')}
                      onChange={(e) =>
                        setModalProduct({ ...modalProduct, galleryText: e.target.value })
                      }
                      placeholder="Additional gallery image URLs (one per line)"
                      className="w-full px-3 py-1.5 rounded-[8px] border-[1.2px] border-[#171717] bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Colors (comma separated)</label>
                  <input
                    value={modalProduct.colorsText ?? (modalProduct.colors || []).join(', ')}
                    onChange={(e) =>
                      setModalProduct({ ...modalProduct, colorsText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Sizes (comma separated)</label>
                  <input
                    value={modalProduct.sizesText ?? (modalProduct.sizes || []).join(', ')}
                    onChange={(e) =>
                      setModalProduct({ ...modalProduct, sizesText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Editorial Description</label>
                <textarea
                  rows={3}
                  value={modalProduct.description || ''}
                  onChange={(e) =>
                    setModalProduct({ ...modalProduct, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#171717]/15">
                <button
                  type="button"
                  onClick={() => setModalProduct(null)}
                  className="superr-pill-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="superr-pill-btn-primary">
                  <Check className="w-4 h-4" />
                  <span>{isNewModal ? 'Publish Product' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 2. COMMANDES (ORDERS) MANAGEMENT TAB ──────────────────────────────────── */
const STATUS_META = {
  pending: { label: 'pending', cls: 'bg-amber-100 text-amber-900 border-amber-700' },
  confirmed: { label: 'confirmed', cls: 'bg-blue-100 text-blue-900 border-blue-700' },
  preparing: { label: 'preparing', cls: 'bg-purple-100 text-purple-900 border-purple-700' },
  shipped: { label: 'shipped', cls: 'bg-cyan-100 text-cyan-900 border-cyan-700' },
  delivered: { label: 'delivered', cls: 'bg-emerald-100 text-emerald-900 border-emerald-700' },
  cancelled: { label: 'cancelled', cls: 'bg-red-100 text-red-900 border-red-700' }
};

export function CommandesManagerTab({
  orders = [],
  onUpdateStatus,
  onDeleteOrder,
  onCreateSampleOrder,
  onNotify
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (q) {
        const hit =
          (o.order_number || '').toLowerCase().includes(q) ||
          (o.customer_name || '').toLowerCase().includes(q) ||
          (o.customer_email || '').toLowerCase().includes(q) ||
          (o.customer_phone || '').toLowerCase().includes(q) ||
          (o.city || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  const exportCsv = () => {
    const header = [
      'OrderNumber',
      'Date',
      'CustomerName',
      'Email',
      'Phone',
      'City',
      'Address',
      'Total_DT',
      'Status',
      'Items'
    ];
    const rows = filtered.map((o) => [
      o.order_number,
      o.created_at,
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      o.customer_email,
      o.customer_phone,
      `"${(o.city || '').replace(/"/g, '""')}"`,
      `"${(o.shipping_address || '').replace(/"/g, '""')}"`,
      Number(o.total_tnd || 0).toFixed(2),
      o.status,
      `"${(o.items || []).map((i) => `${i.name} (${i.size}/${i.color} x${i.quantity})`).join('; ').replace(/"/g, '""')}"`
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kronos-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.('Exported commandes CSV');
  };

  return (
    <div className="space-y-5">
      {/* Filter & Actions Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-[#171717]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, client name, email, phone..."
              className="w-full pl-10 pr-4 py-2 rounded-[20px] border-[1.5px] border-[#171717] bg-white text-xs font-geist focus:outline-none focus:ring-2 focus:ring-[#ff6f1e]"
            />
          </div>

          <div className="flex flex-wrap gap-1 bg-[#f7efe9] p-1 rounded-[20px] border-[1.5px] border-[#171717]">
            {['ALL', 'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-[16px] text-[10px] font-bold uppercase cursor-pointer ${
                    statusFilter === st ? 'bg-[#171717] text-white' : 'text-[#171717]/75 hover:bg-white'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onCreateSampleOrder && (
            <button onClick={onCreateSampleOrder} className="superr-pill-btn text-xs py-2 px-3.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff6f1e]" />
              <span>+ Test Order</span>
            </button>
          )}
          <button onClick={exportCsv} className="superr-pill-btn-primary text-xs py-2 px-4">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-[12px] border-[1.5px] border-[#171717] bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-[1.5px] border-[#171717] bg-[#f7efe9] text-[10px] font-mono uppercase tracking-wider text-[#171717]">
              <th className="py-3 px-3.5">Order N°</th>
              <th className="py-3 px-3">Customer / Email / Phone</th>
              <th className="py-3 px-3">City & Address</th>
              <th className="py-3 px-3">Items</th>
              <th className="py-3 px-3">Total (DT)</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3.5 text-right">Dossier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171717]/15 text-xs font-geist">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#171717]/60">
                  No commandes matching the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((ord) => {
                const st = STATUS_META[ord.status] || STATUS_META.pending;
                return (
                  <tr key={ord.id} className="hover:bg-[#fdfbf9] transition-colors">
                    <td className="py-3 px-3.5">
                      <p className="font-mono font-bold text-[#171717]">{ord.order_number}</p>
                      <p className="text-[10px] text-[#171717]/55">
                        {new Date(ord.created_at).toLocaleString()}
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-bold text-[#2b1a07]">{ord.customer_name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#171717]/75 mt-0.5">
                        <Mail className="w-3 h-3 text-[#ff6f1e]" />
                        <span>{ord.customer_email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#171717]/80">
                        <Phone className="w-3 h-3 text-emerald-700" />
                        <span>{ord.customer_phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <p className="font-semibold text-[#171717]">{ord.city}</p>
                      <p className="text-[11px] text-[#171717]/65 truncate" title={ord.shipping_address}>
                        {ord.shipping_address}
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[12px] border border-[#171717] bg-[#f7efe9] text-[10px] font-bold">
                        <Package className="w-3 h-3" />
                        {(ord.items || []).reduce((s, i) => s + Number(i.quantity || 1), 0)} pcs
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-mono font-extrabold text-sm text-[#171717]">
                        {Number(ord.total_tnd || 0).toFixed(2)} DT
                      </p>
                      {ord.promo_code && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-bold">
                          <Tag className="w-2.5 h-2.5" /> {ord.promo_code}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={ord.status}
                        onChange={(e) => {
                          onUpdateStatus(ord.id, e.target.value);
                          onNotify?.(`Order ${ord.order_number} -> ${e.target.value}`);
                        }}
                        className={`px-2.5 py-1 rounded-[14px] border text-[11px] font-bold uppercase cursor-pointer focus:outline-none ${st.cls}`}
                      >
                        {Object.keys(STATUS_META).map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="superr-pill-btn py-1 px-3 text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3 text-[#ff6f1e]" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete order ${ord.order_number}?`)) {
                              onDeleteOrder(ord.id);
                              onNotify?.(`Deleted ${ord.order_number}`);
                            }
                          }}
                          className="p-1.5 rounded-[10px] border-[1.2px] border-[#171717] bg-white hover:bg-red-50 text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Commande Inspector Modal */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#fdfbf9] border-[2px] border-[#171717] rounded-[16px] shadow-[6px_6px_0px_#171717] p-6 space-y-4 font-geist text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#171717]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#c2410c]">
                  COMMANDE DOSSIER
                </span>
                <h3 className="font-gelica text-2xl font-bold text-[#2b1a07]">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-[10px] border-[1.5px] border-[#171717] bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-[12px] border-[1.5px] border-[#171717] bg-[#f7efe9]">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-[#171717]/60">Client Contact</p>
                <p className="font-bold text-sm text-[#171717]">{selectedOrder.customer_name}</p>
                <a
                  href={`mailto:${selectedOrder.customer_email}`}
                  className="flex items-center gap-1.5 text-[#c2410c] hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" /> {selectedOrder.customer_email}
                </a>
                <a
                  href={`tel:${selectedOrder.customer_phone}`}
                  className="flex items-center gap-1.5 font-mono font-bold text-[#171717] hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" /> {selectedOrder.customer_phone}
                </a>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-[#171717]/60">
                  Delivery Location
                </p>
                <p className="font-bold text-[#171717] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#ff6f1e]" /> {selectedOrder.city},{' '}
                  {selectedOrder.country || 'Tunisia'}
                </p>
                <p className="text-[#171717]/80">{selectedOrder.shipping_address}</p>
                {selectedOrder.notes && (
                  <p className="text-[11px] italic text-[#9a3412]">“{selectedOrder.notes}”</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold uppercase text-[10px] text-[#171717]/60">Ordered Garments</p>
              {(selectedOrder.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-[10px] border-[1.2px] border-[#171717] bg-white"
                >
                  <div className="flex items-center gap-3">
                    {item.img && (
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-10 h-12 object-cover rounded border border-[#171717]"
                      />
                    )}
                    <div>
                      <p className="font-bold text-[#171717]">{item.name}</p>
                      <p className="text-[11px] font-mono text-[#171717]/70">
                        Size: {item.size} · Color: {item.color} · Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono font-bold text-[#171717]">
                    {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)} DT
                  </p>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-[12px] border-[1.5px] border-[#171717] bg-white space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{Number(selectedOrder.subtotal_tnd || 0).toFixed(2)} DT</span>
              </div>
              {Number(selectedOrder.discount_tnd || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Promo ({selectedOrder.promo_code})</span>
                  <span>-{Number(selectedOrder.discount_tnd).toFixed(2)} DT</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{Number(selectedOrder.shipping_tnd || 0).toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#171717]/20 text-sm font-extrabold">
                <span>TOTAL DUE ({selectedOrder.payment_method})</span>
                <span>{Number(selectedOrder.total_tnd || 0).toFixed(2)} DT</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Synced with Commandes Ledger
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="superr-pill-btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

