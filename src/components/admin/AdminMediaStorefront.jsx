import React, { useState, useMemo } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Film,
  FileText,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Save,
  Mail,
  Phone,
  MapPin,
  Plus,
  Globe,
  Sparkles
} from 'lucide-react';
import { uploadMediaAsset } from '../../lib/kronosDataService';

/* ── 3. SUPABASE STORAGE MEDIA VAULT (IMAGES, VIDEOS, DOCUMENTS) ───────────── */
export function MediaVaultTab({
  assets = [],
  onAssetsChange,
  onUpdateField,
  onNotify
}) {
  const [bucketFilter, setBucketFilter] = useState('ALL');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('image');
  const [linkedTarget, setLinkedTarget] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const filtered = useMemo(() => {
    if (bucketFilter === 'ALL') return assets;
    return assets.filter((a) => a.media_type === bucketFilter);
  }, [assets, bucketFilter]);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMediaAsset(file, {
        mediaType: uploadType,
        title: uploadTitle.trim() || file.name,
        linkedEntityType: linkedTarget,
        linkedEntityId: 'admin-upload'
      });

      if (res?.asset) {
        onAssetsChange([res.asset, ...assets.filter((a) => a.id !== res.asset.id)]);

        if (linkedTarget === 'hero' && res.publicUrl) {
          onUpdateField('hero.bgImage', res.publicUrl);
          onNotify?.('Uploaded & automatically set as Hero Key Visual!');
        } else if (linkedTarget === 'lookbook' && res.publicUrl) {
          onUpdateField('lookbook.videoUrl', res.publicUrl);
          onNotify?.('Uploaded & automatically set as Lookbook Video!');
        } else if (linkedTarget === 'about' && res.publicUrl) {
          onUpdateField('about.bgImage', res.publicUrl);
          onNotify?.('Uploaded & automatically set as Manifesto Image!');
        } else {
          onNotify?.(
            res.cloud
              ? `Uploaded "${res.asset.title}" to Supabase Storage (${res.asset.bucket_name})!`
              : res.cloudError
                ? `Saved locally — Supabase Storage blocked (${res.cloudError}). Sign in under Supabase tab!`
                : `Saved "${res.asset.title}" locally (connect Supabase keys for permanent bucket storage).`
          );
        }
        setUploadTitle('');
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCopy = (asset) => {
    navigator.clipboard.writeText(asset.public_url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1800);
    onNotify?.('Copied public URL to clipboard');
  };

  return (
    <div className="space-y-6 font-geist">
      {/* Upload Dropzone Bar */}
      <div className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-[#f7efe9] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
              upload to supabase storage buckets
            </h4>
            <p className="text-xs text-[#171717]/70">
              Supports <span className="font-mono font-bold">kronos-images</span> (JPG/PNG/WEBP),{' '}
              <span className="font-mono font-bold">kronos-videos</span> (MP4/WEBM), and{' '}
              <span className="font-mono font-bold">kronos-documents</span> (PDF/DOCX/CSV).
            </p>
          </div>
          <span className="superr-tag bg-white">3 Buckets Synced</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs">
          <div>
            <label className="font-bold block mb-1">Asset Title</label>
            <input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. Lookbook Film AW26"
              className="w-full px-3 py-2 rounded-[10px] border-[1.5px] border-[#171717] bg-white"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Bucket / Media Type</label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] border-[1.5px] border-[#171717] bg-white font-bold"
            >
              <option value="image">Image (kronos-images)</option>
              <option value="video">Video (kronos-videos)</option>
              <option value="document">Document / PDF (kronos-documents)</option>
            </select>
          </div>

          <div>
            <label className="font-bold block mb-1">Auto-Bind Section</label>
            <select
              value={linkedTarget}
              onChange={(e) => setLinkedTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] border-[1.5px] border-[#171717] bg-white"
            >
              <option value="general">Vault Library Only</option>
              <option value="hero">Set as Hero Background</option>
              <option value="lookbook">Set as Lookbook Video</option>
              <option value="about">Set as Manifesto Image</option>
              <option value="document">Storefront Size/Lookbook Doc</option>
            </select>
          </div>

          <label className="superr-pill-btn-primary w-full py-2.5 justify-center">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Select & Upload File'}</span>
            <input
              type="file"
              accept={
                uploadType === 'image'
                  ? 'image/*'
                  : uploadType === 'video'
                    ? 'video/*'
                    : '.pdf,.doc,.docx,.csv,.txt,.json'
              }
              onChange={handleFileSelected}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: `All Files (${assets.length})` },
          {
            id: 'image',
            label: `Images (${assets.filter((a) => a.media_type === 'image').length})`,
            icon: ImageIcon
          },
          {
            id: 'video',
            label: `Videos (${assets.filter((a) => a.media_type === 'video').length})`,
            icon: Film
          },
          {
            id: 'document',
            label: `Documents (${assets.filter((a) => a.media_type === 'document').length})`,
            icon: FileText
          }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setBucketFilter(id)}
            className={bucketFilter === id ? 'superr-pill-btn-primary py-1.5 px-4 text-xs' : 'superr-pill-btn py-1.5 px-4 text-xs'}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((asset) => (
          <div
            key={asset.id}
            className="rounded-[12px] border-[1.5px] border-[#171717] bg-white overflow-hidden shadow-[2px_2px_0px_#171717] flex flex-col justify-between"
          >
            <div className="h-44 bg-[#141418] relative flex items-center justify-center overflow-hidden">
              {asset.media_type === 'image' && (
                <img
                  src={asset.public_url}
                  alt={asset.title}
                  className="w-full h-full object-cover object-top"
                />
              )}
              {asset.media_type === 'video' && (
                <video
                  src={asset.public_url}
                  controls
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              {asset.media_type === 'document' && (
                <div className="text-center p-4 text-white space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#ff6f1e] border-2 border-white flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-mono text-xs uppercase tracking-wider text-white/80">
                    {asset.mime_type || 'DOCUMENT'}
                  </p>
                </div>
              )}

              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[12px] border border-[#171717] bg-[#fdfbf9] text-[#171717] text-[9px] font-mono font-bold">
                {asset.bucket_name}
              </span>
            </div>

            <div className="p-3.5 space-y-2.5 text-xs flex-1 flex flex-col justify-between">
              <div>
                <p className="font-bold text-[#2b1a07] truncate" title={asset.title}>
                  {asset.title}
                </p>
                <p className="text-[10px] font-mono text-[#171717]/60 truncate mt-0.5">
                  {asset.storage_path}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#171717]/15">
                <button
                  onClick={() => handleCopy(asset)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[12px] border border-[#171717] bg-[#f7efe9] text-[10px] font-bold cursor-pointer"
                >
                  {copiedId === asset.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy URL
                    </>
                  )}
                </button>

                {asset.media_type === 'image' && (
                  <button
                    onClick={() => {
                      onUpdateField('hero.bgImage', asset.public_url);
                      onNotify?.(`Set "${asset.title}" as Hero Background`);
                    }}
                    className="px-2.5 py-1 rounded-[12px] border border-[#171717] bg-white hover:bg-[#ff6f1e] hover:text-white text-[10px] font-bold cursor-pointer"
                  >
                    Use as Hero
                  </button>
                )}

                {asset.media_type === 'video' && (
                  <button
                    onClick={() => {
                      onUpdateField('lookbook.videoUrl', asset.public_url);
                      onNotify?.(`Set "${asset.title}" as Lookbook Film`);
                    }}
                    className="px-2.5 py-1 rounded-[12px] border border-[#171717] bg-white hover:bg-[#ff6f1e] hover:text-white text-[10px] font-bold cursor-pointer"
                  >
                    Use in Lookbook
                  </button>
                )}

                <a
                  href={asset.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-[10px] border border-[#171717] bg-white hover:bg-[#f7efe9]"
                  title="Open raw file"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={async () => {
                    const { deleteMediaAssetItem } = await import('../../lib/kronosDataService');
                    const next = await deleteMediaAssetItem(asset);
                    onAssetsChange(next);
                    onNotify?.(`Removed "${asset.title}"`);
                  }}
                  className="ml-auto p-1.5 rounded-[10px] border border-[#171717] bg-white hover:bg-red-50 text-red-600 cursor-pointer"
                  title="Delete from vault"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 4. STOREFRONT CONTENT, CONTACT INFO (EMAIL/PHONE), VIDEO & STORES CMS ─── */
export function StorefrontContentTab({ data, onUpdateField, onNotify }) {
  const [brandDraft, setBrandDraft] = useState(data.brand || {});
  const [footerDraft, setFooterDraft] = useState(data.footer || {});
  const [heroDraft, setHeroDraft] = useState(data.hero || {});
  const [lookbookDraft, setLookbookDraft] = useState(data.lookbook || {});
  const [aboutDraft, setAboutDraft] = useState(data.about || {});
  const [giftDraft, setGiftDraft] = useState(data.giftCard || {});
  const [announcement, setAnnouncement] = useState(data.navigation?.announcement || '');
  const [storesDraft, setStoresDraft] = useState(data.stores || []);
  const [dropsDraft, setDropsDraft] = useState(data.drops || { items: [] });
  const [featuresDraft, setFeaturesDraft] = useState(data.featuresSection || { items: [] });
  const [categoriesDraft, setCategoriesDraft] = useState(data.categoriesSection || { items: [] });
  const [headersDraft, setHeadersDraft] = useState(data.sectionHeaders || {});
  const [activeCurrency, setActiveCurrency] = useState(data.currency?.active || 'TND');

  const saveContactAndFooter = () => {
    onUpdateField('brand', brandDraft);
    onUpdateField('footer', footerDraft);
    onNotify?.('Saved brand name, studio email, phone, address & social links!');
  };

  const saveHeroAndSections = () => {
    onUpdateField('navigation.announcement', announcement);
    onUpdateField('hero', heroDraft);
    onUpdateField('about', aboutDraft);
    onUpdateField('lookbook', lookbookDraft);
    onUpdateField('giftCard', { ...giftDraft, price: Number(giftDraft.price || 250) });
    onNotify?.('Updated Hero, Announcement Banner, Lookbook Video & Gift Card!');
  };

  const saveDropsFeaturesAndCategories = () => {
    onUpdateField('drops', dropsDraft);
    onUpdateField('featuresSection', featuresDraft);
    onUpdateField('categoriesSection', categoriesDraft);
    onUpdateField('sectionHeaders', headersDraft);
    onNotify?.('Saved Drops, Features, Categories Collage & Section Headings!');
  };

  const saveStores = () => {
    onUpdateField('stores', storesDraft);
    onNotify?.('Saved retail store addresses & phone numbers!');
  };

  const handleCurrencyChange = (code) => {
    setActiveCurrency(code);
    const chosen = (data.currency?.options || []).find((o) => o.code === code);
    if (chosen) {
      onUpdateField('currency', {
        ...data.currency,
        active: chosen.code,
        symbol: chosen.symbol
      });
      onNotify?.(`Default storefront currency set to ${chosen.name}`);
    }
  };

  return (
    <div className="space-y-6 font-geist text-xs">
      {/* A. Studio Contact Email, Phone Number, Address & Socials */}
      <div className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#171717]/15">
          <div>
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
              studio contact (email, phone, socials & footer)
            </h4>
            <p className="text-[#171717]/65">
              Changes appear immediately in the storefront footer, AI stylist contact info & order confirmations.
            </p>
          </div>
          <button onClick={saveContactAndFooter} className="superr-pill-btn-primary py-2 px-4">
            <Save className="w-3.5 h-3.5" />
            <span>Save Contact Info</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="font-bold block mb-1">Brand Name (Logo / AI / Footer)</label>
            <input
              value={brandDraft.name || ''}
              onChange={(e) => setBrandDraft({ ...brandDraft, name: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9] font-bold"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Brand Archive Badge</label>
            <input
              value={brandDraft.badgeText || ''}
              onChange={(e) => setBrandDraft({ ...brandDraft, badgeText: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Gift Card Background Image URL</label>
            <input
              value={giftDraft.bgImage || ''}
              onChange={(e) => setGiftDraft({ ...giftDraft, bgImage: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9] font-mono text-[10px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="font-bold block mb-1">Studio Name</label>
            <input
              value={footerDraft.studioName || ''}
              onChange={(e) => setFooterDraft({ ...footerDraft, studioName: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
          <div>
            <label className="font-bold flex items-center gap-1 mb-1">
              <Mail className="w-3.5 h-3.5 text-[#ff6f1e]" /> Contact Email
            </label>
            <input
              type="email"
              value={footerDraft.email || ''}
              onChange={(e) => setFooterDraft({ ...footerDraft, email: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
          <div>
            <label className="font-bold flex items-center gap-1 mb-1">
              <Phone className="w-3.5 h-3.5 text-emerald-700" /> Contact Phone Number
            </label>
            <input
              value={footerDraft.phone || ''}
              onChange={(e) => setFooterDraft({ ...footerDraft, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9] font-mono"
            />
          </div>
          <div>
            <label className="font-bold flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#ff6f1e]" /> HQ Address
            </label>
            <input
              value={footerDraft.address || ''}
              onChange={(e) => setFooterDraft({ ...footerDraft, address: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="font-bold block mb-1">Newsletter Promo Copy</label>
            <input
              value={footerDraft.newsletterTitle || ''}
              onChange={(e) => setFooterDraft({ ...footerDraft, newsletterTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Copyright Line</label>
            <input
              value={footerDraft.copyright || ''}
              onChange={(e) => setFooterDraft({ ...footerDraft, copyright: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
          <div>
            <label className="font-bold flex items-center gap-1 mb-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" /> Default Storefront Currency
            </label>
            <select
              value={activeCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#f7efe9] font-bold"
            >
              {(data.currency?.options || []).map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.flag} {opt.name} ({opt.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* B. Hero Headlines, Lookbook Video, Manifesto & Gift Card */}
      <div className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#171717]/15">
          <div>
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
              hero visual, announcement band, lookbook video & gift card
            </h4>
            <p className="text-[#171717]/65">
              Customize every text, price badge, background picture, and autoplay runway video.
            </p>
          </div>
          <button onClick={saveHeroAndSections} className="superr-pill-btn-primary py-2 px-4">
            <Save className="w-3.5 h-3.5" />
            <span>Save Storefront Media</span>
          </button>
        </div>

        <div>
          <label className="font-bold block mb-1">Top Marquee Announcement Band</label>
          <input
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#f7efe9] font-mono"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="font-bold block mb-1">Hero Tagline</label>
            <input
              value={heroDraft.tagline || ''}
              onChange={(e) => setHeroDraft({ ...heroDraft, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Hero Title Line 1</label>
            <input
              value={heroDraft.titleLine1 || ''}
              onChange={(e) => setHeroDraft({ ...heroDraft, titleLine1: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Hero Title Line 2</label>
            <input
              value={heroDraft.titleLine2 || ''}
              onChange={(e) => setHeroDraft({ ...heroDraft, titleLine2: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="font-bold block mb-1">Hero Background Image URL</label>
            <input
              value={heroDraft.bgImage || ''}
              onChange={(e) => setHeroDraft({ ...heroDraft, bgImage: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9] font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Lookbook Runway Video URL (MP4 / Bucket)</label>
            <input
              value={lookbookDraft.videoUrl || ''}
              onChange={(e) => setLookbookDraft({ ...lookbookDraft, videoUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9] font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="md:col-span-2">
            <label className="font-bold block mb-1">Manifesto Editorial Copy</label>
            <textarea
              rows={2}
              value={aboutDraft.text || ''}
              onChange={(e) => setAboutDraft({ ...aboutDraft, text: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9]"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Digital Gift Card Price (DT)</label>
            <input
              type="number"
              value={giftDraft.price ?? 250}
              onChange={(e) => setGiftDraft({ ...giftDraft, price: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-[#171717] bg-[#fdfbf9] font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* C. Walk-in Retail Stores */}
      <div className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#171717]/15">
          <div>
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
              walk-in flagship stores
            </h4>
            <p className="text-[#171717]/65">Edit store cities, districts, hours & phone numbers.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setStoresDraft([
                  ...storesDraft,
                  {
                    id: `store-${Date.now()}`,
                    city: 'Tunis',
                    district: 'Lac 2',
                    address: 'Rue du Lac Constance, Tunis 1053',
                    hours: 'Mon - Sun, 10am - 8pm',
                    phone: '+216 71 000 100',
                    status: 'OPEN TODAY'
                  }
                ])
              }
              className="superr-pill-btn py-1.5 px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Store
            </button>
            <button onClick={saveStores} className="superr-pill-btn-primary py-2 px-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Save Stores</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {storesDraft.map((st, idx) => (
            <div
              key={st.id || idx}
              className="p-4 rounded-[12px] border-[1.5px] border-[#171717] bg-[#fdfbf9] space-y-2.5"
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={st.city || ''}
                  onChange={(e) => {
                    const next = [...storesDraft];
                    next[idx] = { ...st, city: e.target.value };
                    setStoresDraft(next);
                  }}
                  placeholder="City"
                  className="px-2.5 py-1.5 rounded-[8px] border border-[#171717] bg-white font-bold"
                />
                <input
                  value={st.district || ''}
                  onChange={(e) => {
                    const next = [...storesDraft];
                    next[idx] = { ...st, district: e.target.value };
                    setStoresDraft(next);
                  }}
                  placeholder="District"
                  className="px-2.5 py-1.5 rounded-[8px] border border-[#171717] bg-white"
                />
              </div>
              <input
                value={st.address || ''}
                onChange={(e) => {
                  const next = [...storesDraft];
                  next[idx] = { ...st, address: e.target.value };
                  setStoresDraft(next);
                }}
                placeholder="Street Address"
                className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#171717] bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={st.hours || ''}
                  onChange={(e) => {
                    const next = [...storesDraft];
                    next[idx] = { ...st, hours: e.target.value };
                    setStoresDraft(next);
                  }}
                  placeholder="Hours"
                  className="px-2.5 py-1.5 rounded-[8px] border border-[#171717] bg-white"
                />
                <input
                  value={st.phone || ''}
                  onChange={(e) => {
                    const next = [...storesDraft];
                    next[idx] = { ...st, phone: e.target.value };
                    setStoresDraft(next);
                  }}
                  placeholder="Store Phone"
                  className="px-2.5 py-1.5 rounded-[8px] border border-[#171717] bg-white font-mono"
                />
              </div>
              <input
                value={st.image || ''}
                onChange={(e) => {
                  const next = [...storesDraft];
                  next[idx] = { ...st, image: e.target.value };
                  setStoresDraft(next);
                }}
                placeholder="Store Photo URL (https://...)"
                className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#171717] bg-white font-mono text-[10px]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* D. Dynamic Section Headings, Drops, Categories Collage & Why-KRONOS Features */}
      <div className="p-5 rounded-[14px] border-[1.5px] border-[#171717] bg-white space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#171717]/15">
          <div>
            <h4 className="font-gelica font-bold text-lg text-[#2b1a07] lowercase">
              all sections (drops, categories collage, why-us features & headings)
            </h4>
            <p className="text-[#171717]/65">
              Every headline, category tile image, feature pillar & drop showcase is live-editable here.
            </p>
          </div>
          <button onClick={saveDropsFeaturesAndCategories} className="superr-pill-btn-primary py-2 px-4">
            <Save className="w-3.5 h-3.5" />
            <span>Save All Sections</span>
          </button>
        </div>

        {/* Section Headings Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="font-bold block mb-1">Sale Title Prefix / Suffix</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                value={headersDraft.sale?.prefix || ''}
                onChange={(e) => setHeadersDraft({ ...headersDraft, sale: { ...headersDraft.sale, prefix: e.target.value } })}
                placeholder="studio"
                className="px-2 py-1.5 rounded border border-[#171717] bg-[#fdfbf9]"
              />
              <input
                value={headersDraft.sale?.suffix || ''}
                onChange={(e) => setHeadersDraft({ ...headersDraft, sale: { ...headersDraft.sale, suffix: e.target.value } })}
                placeholder="collection"
                className="px-2 py-1.5 rounded border border-[#171717] bg-[#fdfbf9]"
              />
            </div>
          </div>
          <div>
            <label className="font-bold block mb-1">Drops Title Prefix / Suffix</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                value={dropsDraft.titlePrefix || ''}
                onChange={(e) => setDropsDraft({ ...dropsDraft, titlePrefix: e.target.value })}
                placeholder="latest"
                className="px-2 py-1.5 rounded border border-[#171717] bg-[#fdfbf9]"
              />
              <input
                value={dropsDraft.titleSuffix || ''}
                onChange={(e) => setDropsDraft({ ...dropsDraft, titleSuffix: e.target.value })}
                placeholder="DROPS"
                className="px-2 py-1.5 rounded border border-[#171717] bg-[#fdfbf9]"
              />
            </div>
          </div>
          <div>
            <label className="font-bold block mb-1">New Arrivals Prefix / Suffix</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                value={headersDraft.newArrivals?.prefix || ''}
                onChange={(e) => setHeadersDraft({ ...headersDraft, newArrivals: { ...headersDraft.newArrivals, prefix: e.target.value } })}
                placeholder="new"
                className="px-2 py-1.5 rounded border border-[#171717] bg-[#fdfbf9]"
              />
              <input
                value={headersDraft.newArrivals?.suffix || ''}
                onChange={(e) => setHeadersDraft({ ...headersDraft, newArrivals: { ...headersDraft.newArrivals, suffix: e.target.value } })}
                placeholder="Arrivals"
                className="px-2 py-1.5 rounded border border-[#171717] bg-[#fdfbf9]"
              />
            </div>
          </div>
          <div>
            <label className="font-bold block mb-1">Categories Heading & CTA</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                value={categoriesDraft.title || ''}
                onChange={(e) => setCategoriesDraft({ ...categoriesDraft, title: e.target.value })}
                placeholder="Categories"
                className="px-2 py-1.5 rounded border border-[#171717] bg-[#fdfbf9]"
              />
              <input
                value={categoriesDraft.ctaText || ''}
                onChange={(e) => setCategoriesDraft({ ...categoriesDraft, ctaText: e.target.value })}
                placeholder="SHOP ALL"
                className="px-2 py-1.5 rounded border border-[#171717] bg-[#fdfbf9]"
              />
            </div>
          </div>
        </div>

        {/* Category Collage Tiles */}
        <div className="space-y-2">
          <p className="font-bold text-[#2b1a07]">Categories Collage Photos & Titles</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {(categoriesDraft.items || []).map((cat, idx) => (
              <div key={cat.id || idx} className="p-2.5 rounded-[10px] border border-[#171717] bg-[#fdfbf9] grid grid-cols-12 gap-2 items-center">
                <input
                  value={cat.title || ''}
                  onChange={(e) => {
                    const next = [...(categoriesDraft.items || [])];
                    next[idx] = { ...cat, title: e.target.value, filterCategory: e.target.value };
                    setCategoriesDraft({ ...categoriesDraft, items: next });
                  }}
                  placeholder="Title"
                  className="col-span-4 px-2 py-1 rounded border border-[#171717] bg-white font-bold"
                />
                <input
                  value={cat.image || ''}
                  onChange={(e) => {
                    const next = [...(categoriesDraft.items || [])];
                    next[idx] = { ...cat, image: e.target.value };
                    setCategoriesDraft({ ...categoriesDraft, items: next });
                  }}
                  placeholder="Category Photo URL"
                  className="col-span-8 px-2 py-1 rounded border border-[#171717] bg-white font-mono text-[10px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Why KRONOS Features */}
        <div className="space-y-2">
          <p className="font-bold text-[#2b1a07]">Why-KRONOS 4 Value Pillars</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {(featuresDraft.items || []).map((feat, idx) => (
              <div key={feat.id || idx} className="p-3 rounded-[10px] border border-[#171717] bg-[#fdfbf9] space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={feat.title || ''}
                    onChange={(e) => {
                      const next = [...(featuresDraft.items || [])];
                      next[idx] = { ...feat, title: e.target.value };
                      setFeaturesDraft({ ...featuresDraft, items: next });
                    }}
                    placeholder="Title"
                    className="px-2 py-1 rounded border border-[#171717] bg-white font-bold"
                  />
                  <input
                    value={feat.subtitle || ''}
                    onChange={(e) => {
                      const next = [...(featuresDraft.items || [])];
                      next[idx] = { ...feat, subtitle: e.target.value };
                      setFeaturesDraft({ ...featuresDraft, items: next });
                    }}
                    placeholder="Subtitle"
                    className="px-2 py-1 rounded border border-[#171717] bg-white"
                  />
                </div>
                <input
                  value={feat.description || ''}
                  onChange={(e) => {
                    const next = [...(featuresDraft.items || [])];
                    next[idx] = { ...feat, description: e.target.value };
                    setFeaturesDraft({ ...featuresDraft, items: next });
                  }}
                  placeholder="Editorial Copy"
                  className="w-full px-2 py-1 rounded border border-[#171717] bg-white text-[11px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Drops Items */}
        <div className="space-y-2">
          <p className="font-bold text-[#2b1a07]">Editorial Drops Showcase Cards ({(dropsDraft.items || []).length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {(dropsDraft.items || []).map((dr, idx) => (
              <div key={dr.id || idx} className="p-3 rounded-[10px] border border-[#171717] bg-[#fdfbf9] space-y-1.5">
                <input
                  value={dr.title || ''}
                  onChange={(e) => {
                    const next = [...(dropsDraft.items || [])];
                    next[idx] = { ...dr, title: e.target.value };
                    setDropsDraft({ ...dropsDraft, items: next });
                  }}
                  placeholder="Drop Title"
                  className="w-full px-2 py-1 rounded border border-[#171717] bg-white font-bold"
                />
                <input
                  value={dr.description || ''}
                  onChange={(e) => {
                    const next = [...(dropsDraft.items || [])];
                    next[idx] = { ...dr, description: e.target.value };
                    setDropsDraft({ ...dropsDraft, items: next });
                  }}
                  placeholder="Drop Description"
                  className="w-full px-2 py-1 rounded border border-[#171717] bg-white text-[11px]"
                />
                <input
                  value={dr.image || ''}
                  onChange={(e) => {
                    const next = [...(dropsDraft.items || [])];
                    next[idx] = { ...dr, image: e.target.value };
                    setDropsDraft({ ...dropsDraft, items: next });
                  }}
                  placeholder="Drop Photo URL"
                  className="w-full px-2 py-1 rounded border border-[#171717] bg-white font-mono text-[10px]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

