/**
 * Rawline3DFittingLab.jsx
 * KRONOS — True WebGL 3D Human Virtual Try-On Studio
 * Powered by Three.js WebGL, RoomEnvironment PBR IBL, OrbitControls (360° rotation),
 * and real rigged full-body 3D human models (/models/man.glb & /models/woman.glb).
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  X,
  RotateCw,
  Sparkles,
  ShoppingBag,
  Camera,
  Check,
  User,
  SlidersHorizontal,
  Layers,
  Plus,
  Search,
  Palette,
  Upload,
  Tag,
  Shirt
} from 'lucide-react';
import {
  extractSoftwareSceneData,
  createSoftwareFrameBuffers,
  renderSoftware3DFrame
} from '../lib/software3dRenderer';

function computeSlotByMeshName(equippedOutfit, selectedGender) {
  const topSlot = equippedOutfit?.top;
  const bottomSlot = equippedOutfit?.bottom;
  const shoesSlot = equippedOutfit?.shoes;
  const bagSlot = equippedOutfit?.bag;

  const topMeshName =
    mapProductToGarmentMesh(topSlot?.product) ||
    (selectedGender === 'female' ? 'garment_tank_top' : 'garment_tshirt');
  const isTopDress = topMeshName === 'garment_dress';
  const bottomMeshName = isTopDress
    ? null
    : mapProductToGarmentMesh(bottomSlot?.product) || 'garment_baggy_jeans';
  const shoesMeshName = mapProductToGarmentMesh(shoesSlot?.product) || 'garment_sneakers';
  const bagMeshName = bagSlot?.product ? 'garment_bag' : null;

  return {
    [topMeshName]: topSlot,
    ...(bottomMeshName ? { [bottomMeshName]: bottomSlot } : {}),
    [shoesMeshName]: shoesSlot,
    ...(bagMeshName ? { [bagMeshName]: bagSlot } : {})
  };
}

// Photoreal MB-Lab Skin Texture Presets (2048px natural pore, lip & sebum detail loaded cleanly from /textures/skin/)
const SKIN_TONES = [
  { id: 'latino', name: 'Warm Olive', hex: '#D8A280', suffix: 'latino', tint: '#FFFFFF', isDefault: true },
  { id: 'cauc', name: 'Fair Porcelain', hex: '#F3D2BE', suffix: 'cauc', tint: '#FFFFFF' },
  { id: 'asian', name: 'Golden Light', hex: '#EAD0B0', suffix: 'asian', tint: '#FFFFFF' },
  { id: 'chestnut', name: 'Warm Chestnut', hex: '#A46D4D', suffix: 'latino', tint: '#C28A6C' },
  { id: 'bronze', name: 'Rich Bronze', hex: '#7A4930', suffix: 'afro', tint: '#D4A58E' },
  { id: 'afro', name: 'Deep Espresso', hex: '#4C2D1E', suffix: 'afro', tint: '#FFFFFF' }
];

// Studio Lighting Environments (Editorial Daylight by default so face & fabric details shine)
const LIGHTING_MODES = [
  {
    id: 'atelier',
    name: 'Zara Studio',
    bgColor: 0xf4f4f1,
    bgCss: '#F4F4F1',
    isLight: true,
    podiumColor: 0xe6e6e2,
    podiumRim: 0x111111,
    keyIntensity: 2.15,
    fillIntensity: 1.05,
    envIntensity: 0.68
  },
  {
    id: 'runway',
    name: 'Architectural Dark',
    bgColor: 0x101116,
    bgCss: '#101116',
    isLight: false,
    podiumColor: 0x1a1b22,
    podiumRim: 0xea301f,
    keyIntensity: 2.5,
    fillIntensity: 1.0,
    envIntensity: 0.85
  },
  {
    id: 'warm',
    name: 'Golden Editorial',
    bgColor: 0x1b1715,
    bgCss: '#1B1715',
    isLight: false,
    podiumColor: 0x26201c,
    podiumRim: 0xd4af37,
    keyIntensity: 2.4,
    fillIntensity: 1.1,
    envIntensity: 0.9
  }
];

function getColorHexNumber(colorNameOrHex) {
  if (!colorNameOrHex) return 0x253241;
  if (typeof colorNameOrHex === 'number') return colorNameOrHex;
  if (typeof colorNameOrHex === 'string') {
    if (colorNameOrHex.startsWith('#')) {
      const parsed = parseInt(colorNameOrHex.replace('#', '0x'), 16);
      return isNaN(parsed) ? 0x253241 : parsed;
    }
    const lower = colorNameOrHex.toLowerCase();
    const map = {
      'navy blue': 0x192338,
      'light blue': 0x6f8faf,
      'midnight blue': 0x162033,
      'faded black': 0x28292d,
      'obsidian black': 0x141418,
      'black': 0x18181c,
      'ecru': 0xe8e3d5,
      'cream': 0xebe6d8,
      'white': 0xf3f2ee,
      'beige': 0xcbbfaa,
      'sand': 0xcbb79c,
      'taupe': 0x8d7f71,
      'camel': 0x9d7449,
      'brown': 0x4c3224,
      'burgundy': 0x5c1824,
      'red': 0xa81e1a,
      'khaki': 0x5d6247,
      'olive': 0x4b5836,
      'green': 0x254434,
      'grey': 0x73767d,
      'gray': 0x73767d,
      'charcoal': 0x2f3137,
      'pink': 0xd49ea7,
      'blue': 0x2b4568
    };
    for (const [k, v] of Object.entries(map)) {
      if (lower.includes(k)) return v;
    }
  }
  return 0x253241;
}

function normalizeColorLabel(colorItem) {
  if (!colorItem) return 'Standard';
  if (typeof colorItem === 'object') return String(colorItem.name || colorItem.label || colorItem.hex || 'Standard');
  return String(colorItem);
}

/** Create a Three.js WebGLRenderer with progressive fallbacks and clear diagnostics. */
function createWebGLRendererSafe() {
  const attempts = [
    { antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' },
    { antialias: true, alpha: false, preserveDrawingBuffer: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false },
    { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false },
    { antialias: false, alpha: true, stencil: false, depth: true, preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false },
    null
  ];
  let lastErr = null;
  let gpuMsg = '';
  for (const opts of attempts) {
    const testCanvas = document.createElement('canvas');
    const onErr = (ev) => {
      if (ev?.statusMessage) gpuMsg = ev.statusMessage;
    };
    testCanvas.addEventListener('webglcontextcreationerror', onErr, false);
    try {
      if (opts === null) {
        const rawGl =
          testCanvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
          testCanvas.getContext('webgl2');
        if (rawGl) {
          const r = new THREE.WebGLRenderer({ canvas: testCanvas, context: rawGl, antialias: false });
          testCanvas.removeEventListener('webglcontextcreationerror', onErr);
          return r;
        }
      } else {
        const r = new THREE.WebGLRenderer({ canvas: testCanvas, ...opts });
        if (r && r.getContext && r.getContext()) {
          testCanvas.removeEventListener('webglcontextcreationerror', onErr);
          return r;
        }
      }
    } catch (err) {
      lastErr = err;
    }
    testCanvas.removeEventListener('webglcontextcreationerror', onErr);
  }
  const detail = gpuMsg || lastErr?.message || 'Browser WebGL2 context unavailable';
  throw new Error(detail);
}

function getHexStr(colorNameOrHex, productObj = null) {
  const label = normalizeColorLabel(colorNameOrHex);
  if (productObj && Array.isArray(productObj.colorVariants)) {
    const match = productObj.colorVariants.find(
      (cv) => cv.name?.toLowerCase() === label.toLowerCase()
    );
    if (match?.hex) return match.hex;
  }
  if (label.startsWith('#')) return label;
  const num = getColorHexNumber(label);
  return '#' + num.toString(16).padStart(6, '0');
}

function classifySlot(category = '') {
  const c = String(category).toLowerCase();
  if (c.includes('jean') || c.includes('trouser') || c.includes('pant') || c.includes('cargo')) return 'bottom';
  if (c.includes('shoe') || c.includes('boot') || c.includes('trainer') || c.includes('loafer') || c.includes('flat')) return 'shoes';
  if (c.includes('bag') || c.includes('tote') || c.includes('clutch')) return 'bag';
  return 'top';
}

// Map every catalog product precisely to its tailored 3D garment mesh in man.glb / woman.glb
function mapProductToGarmentMesh(product) {
  if (!product) return null;
  const cat = String(product.category || '').toLowerCase();
  const name = String(product.name || '').toLowerCase();
  const desc = String(product.description || '').toLowerCase();

  if (cat.includes('dress') || name.includes('dress')) return 'garment_dress';
  if (cat.includes('coat') || name.includes('coat') || name.includes('trench')) return 'garment_coat';
  if (cat.includes('blazer') || name.includes('blazer')) return 'garment_blazer';
  if (cat.includes('hoodie') || name.includes('hoodie') || name.includes('sweatshirt')) return 'garment_hoodie';
  if (cat.includes('jacket') || name.includes('jacket') || name.includes('bomber')) return 'garment_jacket';
  if (cat.includes('t-shirt') || cat.includes('tshirt')) {
    return name.includes('long sleeve') || desc.includes('long sleeve') ? 'garment_knitwear' : 'garment_tshirt';
  }
  if (cat.includes('overshirt') || cat.includes('shirt')) return 'garment_overshirt';
  if (cat.includes('knit') || cat.includes('polo') || name.includes('jumper') || name.includes('polo')) return 'garment_knitwear';
  if (cat.includes('top') || name.includes('halter') || name.includes('tank') || name.includes('crop')) return 'garment_tank_top';

  if (cat.includes('jean') || cat.includes('trouser') || cat.includes('pant') || cat.includes('cargo')) {
    if (
      name.includes('baggy') ||
      name.includes('folded') ||
      name.includes('wide') ||
      name.includes('volume') ||
      name.includes('pleat') ||
      name.includes('plush') ||
      name.includes('relaxed') ||
      name.includes('piqué') ||
      name.includes('pique') ||
      name.includes('carrot')
    ) {
      return 'garment_baggy_jeans';
    }
    return 'garment_slim_trousers';
  }

  if (cat.includes('shoe') || cat.includes('boot') || cat.includes('trainer') || cat.includes('loafer') || cat.includes('flat')) {
    return name.includes('boot') || name.includes('track') ? 'garment_boots' : 'garment_sneakers';
  }

  if (cat.includes('bag') || cat.includes('tote') || cat.includes('clutch')) {
    return 'garment_bag';
  }
  return 'garment_tshirt';
}

const garmentSwatchCache = new Map();
const fabricBumpCache = new Map();
const skinTexCache = new Map();

function createFabricBumpMap(category = '', productName = '') {
  const key = `${category}|${productName}`.toLowerCase();
  if (fabricBumpCache.has(key)) return fabricBumpCache.get(key);
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const cat = String(category).toLowerCase();
  const name = String(productName).toLowerCase();

  if (cat.includes('knit') || name.includes('purl') || name.includes('rib')) {
    for (let x = 0; x < size; x += 6) {
      ctx.fillStyle = '#c8c8c8';
      ctx.fillRect(x, 0, 3, size);
      ctx.fillStyle = '#484848';
      ctx.fillRect(x + 3, 0, 3, size);
    }
  } else if (cat.includes('jean') || name.includes('denim')) {
    ctx.strokeStyle = '#bcbcbc';
    ctx.lineWidth = 1.2;
    for (let i = -size; i < size * 2; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#9a9a9a';
    for (let y = 0; y < size; y += 3) ctx.fillRect(0, y, size, 1);
    ctx.fillStyle = '#686868';
    for (let x = 0; x < size; x += 3) ctx.fillRect(x, 0, 1, size);
  }

  const bump = new THREE.CanvasTexture(canvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(4, 4);
  bump.flipY = false;
  bump.needsUpdate = true;
  fabricBumpCache.set(key, bump);
  return bump;
}

// Generate realistic seamless PBR woven/print fabric texture onto a CanvasTexture (512px)
function createRealisticFabricTexture(category = '', productName = '', hexColor = '#253241') {
  const cacheKey = `proc2|${category}|${productName}|${hexColor}`;
  if (garmentSwatchCache.has(cacheKey)) return garmentSwatchCache.get(cacheKey);

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cat = String(category).toLowerCase();
  const name = String(productName).toLowerCase();

  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, size, size);

  if (name.includes('animal') || name.includes('leopard')) {
    ctx.fillStyle = '#241911';
    for (let i = 0; i < 160; i++) {
      const x = (Math.sin(i * 73.1) * 0.5 + 0.5) * size;
      const y = (Math.cos(i * 41.7) * 0.5 + 0.5) * size;
      const r = 8 + (i % 7);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8b5e34';
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#241911';
    }
  } else if (name.includes('floral')) {
    for (let i = 0; i < 95; i++) {
      const x = (Math.sin(i * 53.3) * 0.5 + 0.5) * size;
      const y = (Math.cos(i * 29.9) * 0.5 + 0.5) * size;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(218, 180, 145, 0.35)' : 'rgba(40, 48, 36, 0.28)';
      ctx.beginPath();
      ctx.arc(x, y, 7 + (i % 5), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (name.includes('check') || name.includes('plaid')) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (let i = 0; i < size; i += 64) {
      ctx.fillRect(i, 0, 18, size);
      ctx.fillRect(0, i, size, 18);
    }
    ctx.fillStyle = 'rgba(235,232,226,0.18)';
    for (let i = 32; i < size; i += 64) {
      ctx.fillRect(i, 0, 3, size);
      ctx.fillRect(0, i, size, 3);
    }
  } else if (name.includes('stripe') || name.includes('pinstripe')) {
    const isPinstripe = name.includes('pinstripe');
    ctx.fillStyle = isPinstripe ? 'rgba(238,238,236,0.26)' : 'rgba(242,240,234,0.34)';
    if (!isPinstripe) {
      for (let y = 0; y < size; y += 36) ctx.fillRect(0, y, size, 10);
    } else {
      for (let x = 0; x < size; x += 26) ctx.fillRect(x, 0, 2, size);
    }
  } else if (cat.includes('jean') || name.includes('denim')) {
    // Organic dark/mid indigo diagonal twill yarn weave (no shiny vertical gradients!)
    ctx.strokeStyle = 'rgba(255,255,255,0.065)';
    ctx.lineWidth = 1.1;
    for (let i = -size; i < size * 2; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    for (let i = -size + 2; i < size * 2; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
  } else if (name.includes('corduroy')) {
    for (let x = 0; x < size; x += 8) {
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(x, 0, 3, size);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x + 3, 0, 3, size);
    }
  } else if (cat.includes('knit') || name.includes('purl') || name.includes('cardigan') || cat.includes('top')) {
    ctx.fillStyle = 'rgba(0,0,0,0.085)';
    for (let x = 0; x < size; x += 6) ctx.fillRect(x, 0, 2, size);
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    for (let y = 0; y < size; y += 6) ctx.fillRect(0, y, size, 1.5);
  } else if (name.includes('leather') || cat.includes('shoe') || cat.includes('bag')) {
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.055)';
      const x = (Math.sin(i * 19.3) * 0.5 + 0.5) * size;
      const y = (Math.cos(i * 37.9) * 0.5 + 0.5) * size;
      ctx.fillRect(x, y, 2, 2);
    }
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.032)';
    for (let y = 0; y < size; y += 4) ctx.fillRect(0, y, size, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.038)';
    for (let x = 0; x < size; x += 4) ctx.fillRect(x, 0, 1, size);
  }

  // Subtle organic woven textile slub grain across every pixel
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  let seed = 1337;
  for (let i = 0; i < data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const jitter = ((seed & 15) - 7.5) * 0.85;
    data[i] = Math.max(0, Math.min(255, data[i] + jitter));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + jitter));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + jitter));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.flipY = false;
  tex.needsUpdate = true;
  garmentSwatchCache.set(cacheKey, tex);
  return tex;
}

function getFabricMaterialProps(category = '', productName = '') {
  const cat = String(category).toLowerCase();
  const name = String(productName).toLowerCase();
  if (name.includes('satin') || cat.includes('dress')) {
    return { roughness: 0.34, metalness: 0.0, sheen: 0.65, envMapIntensity: 0.55 };
  }
  if (name.includes('leather') || cat.includes('shoe') || cat.includes('bag')) {
    if (name.includes('suede') || name.includes('fabric')) return { roughness: 0.90, metalness: 0.0, sheen: 0.35, envMapIntensity: 0.25 };
    return { roughness: 0.44, metalness: 0.0, sheen: 0.15, envMapIntensity: 0.48 };
  }
  if (cat.includes('jean')) {
    return { roughness: 0.88, metalness: 0.0, sheen: 0.28, envMapIntensity: 0.26 };
  }
  if (cat.includes('knit') || cat.includes('hoodie') || cat.includes('coat') || name.includes('wool') || name.includes('fur')) {
    return { roughness: 0.92, metalness: 0.0, sheen: 0.48, envMapIntensity: 0.24 };
  }
  return { roughness: 0.84, metalness: 0.0, sheen: 0.32, envMapIntensity: 0.28 };
}

export default function Rawline3DFittingLab({
  isOpen = false,
  onClose = () => {},
  product = null,
  allProducts = [],
  onAddToCart = () => {},
  initialSize = 'M',
  onAddProduct,
  uploadImage
}) {
  const containerRef = useRef(null);
  const threeRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    pmrem: null,
    podiumGroup: null,
    podiumMesh: null,
    podiumRim: null,
    keyLight: null,
    fillLight: null,
    loadedModels: {},
    activeAvatar: null,
    cameraTargetAngle: null
  });

  const portfolioProducts = useMemo(() => (Array.isArray(allProducts) && allProducts.length > 0 ? allProducts : []), [allProducts]);

  const initialGender = useMemo(() => {
    if (product?.gender === 'WOMEN') return 'female';
    if (product?.gender === 'MEN') return 'male';
    return 'female';
  }, [product?.gender]);

  // If opened from global "3D LAB" without a specific product, prompt MAN vs WOMAN first!
  const [hasPickedModel, setHasPickedModel] = useState(() => Boolean(product));
  const [selectedGender, setSelectedGender] = useState(initialGender);
  const [skinToneHex, setSkinToneHex] = useState(SKIN_TONES[0].hex);
  const [heightCm, setHeightCm] = useState(() => (initialGender === 'female' ? 175 : 184));
  const [bodyBuild, setBodyBuild] = useState('athletic');
  const [lightingMode, setLightingMode] = useState('atelier');
  const [autoRotate, setAutoRotate] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState('');
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [webglFailReason, setWebglFailReason] = useState('');
  const [webglRetryCount, setWebglRetryCount] = useState(0);
  const [showWebglDetails, setShowWebglDetails] = useState(false);
  const [softwareSceneTick, setSoftwareSceneTick] = useState(0);
  const studio2dCanvasRef = useRef(null);
  const softwareOrbitRef = useRef({
    yaw: Math.PI * 0.16,
    pitch: 0.06,
    zoom: 3.16,
    dragging: false,
    lastX: 0,
    lastY: 0
  });
  const softwareDataCacheRef = useRef({});
  const softwareFrameBufRef = useRef(null);
  const renderSoftwareNowRef = useRef(null);
  const [activeAngleLabel, setActiveAngleLabel] = useState('3/4');

  // Outfit Slots worn simultaneously on the 3D human
  const [activeProduct, setActiveProduct] = useState(() => product || portfolioProducts[0] || null);
  const [equippedOutfit, setEquippedOutfit] = useState({
    top: null,
    bottom: null,
    shoes: null,
    bag: null
  });

  const [selectedSize, setSelectedSize] = useState(initialSize || 'M');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  // Wardrobe / Piece Picker UI
  const [wardrobeTab, setWardrobeTab] = useState('ALL');
  const [wardrobeSearch, setWardrobeSearch] = useState('');
  const [showWardrobeDrawer, setShowWardrobeDrawer] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Jackets');
  const [newItemPrice, setNewItemPrice] = useState(299);
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemColors, setNewItemColors] = useState('Black, Navy blue, Sand');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Helper: seed coordinated gender-accurate Zara items into all outfit slots
  const seedOutfitForProduct = (focusProd, genderStr) => {
    const targetGender = genderStr === 'female' ? 'WOMEN' : 'MEN';
    const genderPool = portfolioProducts.filter((p) => p.gender === targetGender);
    const pool = genderPool.length > 0 ? genderPool : portfolioProducts;

    const findDefault = (slotName) => {
      const found = pool.find((p) => classifySlot(p.category) === slotName);
      return found ? { product: found, color: found.colors?.[0] || 'Standard' } : null;
    };

    const next = {
      top: findDefault('top'),
      bottom: findDefault('bottom'),
      shoes: findDefault('shoes'),
      bag: null
    };

    if (focusProd) {
      const slot = classifySlot(focusProd.category);
      next[slot] = { product: focusProd, color: focusProd.selectedColor || normalizeColorLabel(focusProd.colors?.[0]) };
      // If trying Jeans/Trousers, pair with clean studio Tank Top (Woman) or Crewneck Tee (Man)
      if (slot === 'bottom' && next.top) {
        const cleanTop =
          pool.find((p) => (genderStr === 'female' ? p.category === 'Tops' : p.category === 'T-Shirts')) ||
          pool.find((p) => ['Tops', 'T-Shirts', 'Shirts', 'Knitwear'].includes(p.category));
        if (cleanTop) {
          next.top = {
            product: cleanTop,
            color: genderStr === 'female' ? '#F3F2EE' : '#1E1E22'
          };
        }
      }
    } else if (genderStr === 'female') {
      // Iconic Zara Woman studio starter look (White Ribbed Tank + Baggy Folded Jeans)
      const baggy = pool.find((p) => p.name?.toLowerCase().includes('baggy')) || findDefault('bottom')?.product;
      const tank = pool.find((p) => p.category === 'Tops') || findDefault('top')?.product;
      if (baggy) next.bottom = { product: baggy, color: baggy.colors?.[0] || 'Faded black' };
      if (tank) next.top = { product: tank, color: '#F3F2EE' };
    }
    return next;
  };

  // Synchronize when modal opens or external product prop changes
  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      const nextGender = product.gender === 'WOMEN' ? 'female' : product.gender === 'MEN' ? 'male' : selectedGender;
      setHasPickedModel(true);
      setSelectedGender(nextGender);
      setHeightCm(nextGender === 'female' ? 175 : 184);
      setActiveProduct(product);
      setSelectedSize(product.sizes?.[0] || 'M');
      setEquippedOutfit(seedOutfitForProduct(product, nextGender));
    } else {
      setHasPickedModel(false);
      const fallback = portfolioProducts.find((p) => p.gender === (selectedGender === 'female' ? 'WOMEN' : 'MEN')) || portfolioProducts[0];
      if (fallback) {
        setActiveProduct(fallback);
        setSelectedSize(fallback.sizes?.[0] || 'M');
        setEquippedOutfit(seedOutfitForProduct(fallback, selectedGender));
      }
    }
  }, [isOpen, product?.id]);

  const handleChooseGenderModel = (genderStr) => {
    setSelectedGender(genderStr);
    setHasPickedModel(true);
    setHeightCm(genderStr === 'female' ? 175 : 184);

    const targetGender = genderStr === 'female' ? 'WOMEN' : 'MEN';
    const currentMatchesGender = activeProduct?.gender === targetGender;
    const focus = currentMatchesGender
      ? activeProduct
      : portfolioProducts.find((p) => p.gender === targetGender) || activeProduct;

    if (focus) {
      setActiveProduct(focus);
      setSelectedSize(focus.sizes?.[0] || 'M');
    }
    setEquippedOutfit(seedOutfitForProduct(focus, genderStr));
  };

  // Clicking ANY product dresses the 3D person in that item immediately
  const handleWearItem = (item, colorOverride = null) => {
    if (!item) return;
    const slot = classifySlot(item.category);
    const chosenColor = colorOverride || item.colors?.[0] || 'Standard';
    setActiveProduct(item);
    setSelectedSize(item.sizes?.[0] || 'M');
    setEquippedOutfit((prev) => ({
      ...prev,
      [slot]: { product: item, color: chosenColor }
    }));
  };

  const activeSlot = classifySlot(activeProduct?.category);
  const activeColor = equippedOutfit[activeSlot]?.color || activeProduct?.colors?.[0] || 'Standard';

  const handleSelectColorForActive = (colorName) => {
    if (!activeProduct) return;
    setEquippedOutfit((prev) => ({
      ...prev,
      [activeSlot]: { product: activeProduct, color: colorName }
    }));
  };

  // Filtered products matching current model gender for fast try-on switching
  const genderProducts = useMemo(() => {
    const g = selectedGender === 'female' ? 'WOMEN' : 'MEN';
    const filtered = portfolioProducts.filter((p) => p.gender === g);
    return filtered.length > 0 ? filtered : portfolioProducts;
  }, [portfolioProducts, selectedGender]);

  const visibleWardrobe = useMemo(() => {
    return genderProducts.filter((p) => {
      const slot = classifySlot(p.category);
      const matchesTab =
        wardrobeTab === 'ALL' ||
        (wardrobeTab === 'TOP' && slot === 'top') ||
        (wardrobeTab === 'BOTTOM' && slot === 'bottom') ||
        (wardrobeTab === 'SHOES' && slot === 'shoes') ||
        (wardrobeTab === 'BAG' && slot === 'bag');
      const matchesSearch =
        !wardrobeSearch ||
        String(p?.name || '').toLowerCase().includes(wardrobeSearch.toLowerCase()) ||
        String(p?.category || '').toLowerCase().includes(wardrobeSearch.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [genderProducts, wardrobeTab, wardrobeSearch]);

  // Move camera to clean preset azimuth around 360° circle (works for WebGL & Software 3D)
  const setCameraPreset = (preset) => {
    setActiveAngleLabel(preset);
    const angleMap = {
      'Front': 0,
      '3/4': Math.PI * 0.16,
      'Side': Math.PI * 0.5,
      'Back': Math.PI
    };
    const theta = angleMap[preset] ?? 0;

    softwareOrbitRef.current.yaw = theta;
    softwareOrbitRef.current.pitch = 0.06;
    softwareOrbitRef.current.zoom = 3.16;
    renderSoftwareNowRef.current?.();

    const t = threeRef.current;
    if (!t.camera || !t.controls) return;
    const dist = 3.16;
    const y = 1.06;
    t.camera.position.set(Math.sin(theta) * dist, y + 0.08, Math.cos(theta) * dist);
    t.controls.target.set(0, 0.92, 0);
    t.controls.update();
  };

  useEffect(() => {
    if (!isOpen) {
      setWebglRetryCount(0);
      setWebglUnavailable(false);
      setWebglFailReason('');
      setShowWebglDetails(false);
    }
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────
  // THREE.JS WEBGL INITIALIZATION & LIFECYCLE
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    let frameId = null;
    let retryTimer = null;
    let ro = null;
    let renderer = null;
    let controls = null;
    let pmrem = null;
    let handleContextLost = null;

    try {
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 650;

      renderer = createWebGLRendererSafe();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      try {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      } catch {
        renderer.shadowMap.enabled = false;
      }
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';

      handleContextLost = (ev) => {
        ev.preventDefault();
        setWebglUnavailable(true);
        setWebglFailReason('WebGL context lost by GPU/browser');
        setModelLoading(false);
        setModelError('');
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf4f4f1);

      let envReady = false;
      try {
        pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environmentIntensity = 0.85;
        envReady = true;
      } catch (pmremErr) {
        console.warn('[Rawline3DFittingLab] PMREM environment skipped (using 3-point lights):', pmremErr);
        if (pmrem) {
          try { pmrem.dispose(); } catch {}
          pmrem = null;
        }
      }

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
      camera.position.set(0.86, 1.10, 3.04);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.92, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enablePan = false;
      controls.minDistance = 1.15;
      controls.maxDistance = 4.6;
      controls.minPolarAngle = 0.25;
      controls.maxPolarAngle = Math.PI * 0.515;
      controls.update();

      // Studio 3-Point Lighting (boosted automatically if PMREM IBL unavailable)
      const lightBoost = envReady ? 1.0 : 1.35;
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcac8c0, 0.75 * lightBoost);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfffaf2, 2.3 * lightBoost);
      keyLight.position.set(2.4, 3.8, 3.2);
      keyLight.castShadow = renderer.shadowMap.enabled;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      const d = 1.6;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d * 1.4;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xeef4ff, 1.1 * lightBoost);
      fillLight.position.set(-2.6, 2.1, 1.8);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 1.05 * lightBoost);
      rimLight.position.set(0.4, 2.8, -3.2);
      scene.add(rimLight);

      // Architectural Studio Runway Podium & Soft Shadow Floor
      const shadowFloor = new THREE.Mesh(
        new THREE.CircleGeometry(3.2, 64),
        new THREE.ShadowMaterial({ opacity: 0.22 })
      );
      shadowFloor.rotation.x = -Math.PI / 2;
      shadowFloor.position.y = 0.002;
      shadowFloor.receiveShadow = renderer.shadowMap.enabled;
      scene.add(shadowFloor);

      const podiumGroup = new THREE.Group();
      const podiumMat = new THREE.MeshStandardMaterial({
        color: 0xe6e6e2,
        roughness: 0.45,
        metalness: 0.08
      });
      const podiumMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.76, 0.04, 64), podiumMat);
      podiumMesh.position.y = -0.02;
      podiumMesh.receiveShadow = renderer.shadowMap.enabled;
      podiumGroup.add(podiumMesh);

      const rimMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.22 });
      const podiumRim = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.735, 64), rimMat);
      podiumRim.rotation.x = -Math.PI / 2;
      podiumRim.position.y = 0.001;
      podiumGroup.add(podiumRim);
      scene.add(podiumGroup);

      threeRef.current = {
        ...threeRef.current,
        renderer,
        scene,
        camera,
        controls,
        pmrem,
        podiumGroup,
        podiumMesh,
        podiumRim,
        keyLight,
        fillLight,
        loadedModels: threeRef.current.loadedModels || {}
      };
      setWebglUnavailable(false);
      setWebglFailReason('');
      setModelError('');

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!containerRef.current || !threeRef.current.renderer) return;
        const w = containerRef.current.clientWidth || 800;
        const h = containerRef.current.clientHeight || 650;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      ro = new ResizeObserver(handleResize);
      ro.observe(container);
    } catch (err) {
      const reason = String(err?.message || 'WebGL2 context unavailable');
      console.warn('[Rawline3DFittingLab] WebGL2 unavailable, switching to Software 3D GL engine:', reason);
      if (webglRetryCount === 0) {
        retryTimer = setTimeout(() => setWebglRetryCount(1), 180);
      } else {
        setWebglUnavailable(true);
        setWebglFailReason(reason);
        setModelError('');
      }
      if (container) container.innerHTML = '';
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (frameId) cancelAnimationFrame(frameId);
      if (ro) ro.disconnect();
      if (renderer && handleContextLost) {
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost, false);
      }
      if (controls) controls.dispose();
      if (pmrem) pmrem.dispose();
      if (renderer) renderer.dispose();
      if (container) container.innerHTML = '';
      threeRef.current.renderer = null;
      threeRef.current.scene = null;
      threeRef.current.activeAvatar = null;
    };
  }, [isOpen, webglRetryCount]);

  // Real 3D Software GL Rasterizer Engine for /models/woman.glb & /models/man.glb when WebGL2 is blocked
  useEffect(() => {
    if (!isOpen || !webglUnavailable) {
      renderSoftwareNowRef.current = null;
      return;
    }
    const canvas = studio2dCanvasRef.current;
    if (!canvas) return;

    if (!softwareFrameBufRef.current) {
      softwareFrameBufRef.current = createSoftwareFrameBuffers();
    }

    const url = selectedGender === 'female' ? '/models/woman.glb' : '/models/man.glb';
    const baseHeight = selectedGender === 'female' ? 175 : 184;
    const lightingPreset = LIGHTING_MODES.find((m) => m.id === lightingMode) || LIGHTING_MODES[0];
    const toneObj = SKIN_TONES.find((s) => s.hex.toLowerCase() === skinToneHex.toLowerCase()) || SKIN_TONES[0];
    const buildScale = bodyBuild === 'slim' ? 0.94 : bodyBuild === 'relaxed' ? 1.07 : 1.0;

    const slotByMeshName = computeSlotByMeshName(equippedOutfit, selectedGender);
    const visibleGarments = {};
    Object.entries(slotByMeshName).forEach(([meshName, slotItem]) => {
      if (!slotItem?.product) return;
      const prod = slotItem.product;
      const chosenColorName = slotItem.color || prod.colors?.[0] || 'Standard';
      visibleGarments[meshName] = { hex: getHexStr(chosenColorName, prod) };
    });

    const drawFrame = (interactive = false) => {
      const sceneData = softwareDataCacheRef.current[url];
      if (!sceneData) return;
      const orbit = softwareOrbitRef.current;
      renderSoftware3DFrame({
        canvas,
        buffers: softwareFrameBufRef.current,
        sceneData,
        options: {
          lightingMode,
          lightingPreset,
          skinToneHex,
          isDefaultSkin: Boolean(toneObj.isDefault),
          heightCm,
          baseHeight,
          bodyBuild: buildScale,
          selectedSize,
          yaw: orbit.yaw,
          pitch: orbit.pitch,
          zoomDist: orbit.zoom,
          visibleGarments,
          interactive
        }
      });
    };

    renderSoftwareNowRef.current = () => drawFrame(false);
    drawFrame(false);

    let dragRaf = 0;
    let wheelTimer = 0;
    const scheduleDraw = (interactive = false) => {
      if (dragRaf) return;
      dragRaf = requestAnimationFrame(() => {
        dragRaf = 0;
        drawFrame(interactive);
      });
    };

    const handlePointerDown = (e) => {
      const orbit = softwareOrbitRef.current;
      orbit.dragging = true;
      orbit.lastX = e.clientX;
      orbit.lastY = e.clientY;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture is unavailable
      }
    };

    const handlePointerMove = (e) => {
      const orbit = softwareOrbitRef.current;
      if (!orbit.dragging) return;
      const dx = e.clientX - orbit.lastX;
      const dy = e.clientY - orbit.lastY;
      orbit.lastX = e.clientX;
      orbit.lastY = e.clientY;
      orbit.yaw += dx * 0.011;
      orbit.pitch = Math.max(-0.5, Math.min(0.65, orbit.pitch + dy * 0.008));
      scheduleDraw(true);
    };

    const handlePointerUp = (e) => {
      const wasDragging = softwareOrbitRef.current.dragging;
      softwareOrbitRef.current.dragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if not captured
      }
      if (wasDragging) {
        scheduleDraw(false);
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const orbit = softwareOrbitRef.current;
      orbit.zoom = Math.max(1.85, Math.min(4.8, orbit.zoom + e.deltaY * 0.0025));
      scheduleDraw(true);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => scheduleDraw(false), 120);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    const ro = new ResizeObserver(() => scheduleDraw(false));
    ro.observe(canvas);

    let spinRaf = 0;
    let lastTime = performance.now();
    if (autoRotate) {
      const tick = (now) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        if (!softwareOrbitRef.current.dragging) {
          softwareOrbitRef.current.yaw += dt * 0.9;
          drawFrame(true);
        }
        spinRaf = requestAnimationFrame(tick);
      };
      spinRaf = requestAnimationFrame(tick);
    }

    return () => {
      if (renderSoftwareNowRef.current) {
        renderSoftwareNowRef.current = null;
      }
      if (dragRaf) cancelAnimationFrame(dragRaf);
      if (spinRaf) cancelAnimationFrame(spinRaf);
      if (wheelTimer) clearTimeout(wheelTimer);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [
    isOpen,
    webglUnavailable,
    softwareSceneTick,
    lightingMode,
    selectedGender,
    heightCm,
    bodyBuild,
    selectedSize,
    skinToneHex,
    equippedOutfit,
    autoRotate
  ]);

  // Toggle OrbitControls 360° auto-rotation
  useEffect(() => {
    const controls = threeRef.current.controls;
    if (!controls) return;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.6;
  }, [autoRotate]);

  // Lighting Environment Updates
  useEffect(() => {
    const t = threeRef.current;
    if (!t.scene) return;
    const preset = LIGHTING_MODES.find((m) => m.id === lightingMode) || LIGHTING_MODES[0];
    t.scene.background = new THREE.Color(preset.bgColor);
    t.scene.environmentIntensity = preset.envIntensity;
    if (t.podiumMesh) t.podiumMesh.material.color.setHex(preset.podiumColor);
    if (t.podiumRim) t.podiumRim.material.color.setHex(preset.podiumRim);
    if (t.keyLight) t.keyLight.intensity = preset.keyIntensity;
    if (t.fillLight) t.fillLight.intensity = preset.fillIntensity;
  }, [lightingMode, isOpen]);

  // Load & Switch 3D Man vs Woman Avatar Model cleanly (supports both WebGL2 and Software 3D GL)
  useEffect(() => {
    if (!isOpen) return;
    const t = threeRef.current;
    if (!t.scene && !webglUnavailable) return;

    let cancelled = false;
    const onUnload = () => {
      cancelled = true;
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    const url = selectedGender === 'female' ? '/models/woman.glb' : '/models/man.glb';

    const attachAvatar = (gltfScene) => {
      if (cancelled) return;

      if (webglUnavailable || !t.scene) {
        if (!softwareDataCacheRef.current[url]) {
          softwareDataCacheRef.current[url] = extractSoftwareSceneData(gltfScene);
        }
        setModelLoading(false);
        setModelError('');
        setSoftwareSceneTick((v) => v + 1);
        return;
      }

      if (t.activeAvatar) {
        t.scene.remove(t.activeAvatar);
      }

      const clone = gltfScene.clone(true);

      // Upgrade photoreal skin to MeshPhysicalMaterial with subcutaneous sheen, natural glossy eyes & crisp lashes
      clone.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.material) return;

        const origMat = child.material;
        const matName = String(origMat.name || '').toLowerCase();

        if (matName.includes('mblab_skin') || matName.includes('mblab_generic')) {
          const physSkin = new THREE.MeshPhysicalMaterial({
            name: origMat.name,
            map: origMat.map || null,
            normalMap: origMat.normalMap || null,
            normalScale: new THREE.Vector2(1.05, 1.05),
            roughnessMap: origMat.roughnessMap || null,
            roughness: 0.62,
            metalness: 0.0,
            sheen: 0.30,
            sheenRoughness: 0.66,
            sheenColor: new THREE.Color(0xea907a),
            specularIntensity: 0.38,
            envMapIntensity: 0.66
          });
          child.material = physSkin;
          child.userData.isSkinMesh = true;
          child.userData.origMap = origMat.map || null;
        } else if (matName.includes('eyelash')) {
          const lashMat = origMat.clone();
          lashMat.transparent = true;
          lashMat.alphaTest = 0.28;
          lashMat.side = THREE.DoubleSide;
          lashMat.depthWrite = false;
          lashMat.roughness = 0.45;
          child.castShadow = false;
          child.material = lashMat;
        } else if (matName.includes('iris') || matName.includes('human_eyes') || matName.includes('pupil')) {
          const eyeMat = new THREE.MeshPhysicalMaterial({
            name: origMat.name,
            map: origMat.map || null,
            color: origMat.color ? origMat.color.clone() : new THREE.Color(0xffffff),
            roughness: 0.08,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            envMapIntensity: 1.35
          });
          child.castShadow = false;
          child.material = eyeMat;
        } else if (matName.includes('hair')) {
          const hairMat = new THREE.MeshPhysicalMaterial({
            name: origMat.name,
            map: origMat.map || null,
            color: origMat.color ? origMat.color.clone() : new THREE.Color(0xffffff),
            alphaTest: origMat.map ? 0.30 : 0.0,
            transparent: false,
            side: THREE.DoubleSide,
            roughness: origMat.map ? 0.58 : 0.78,
            metalness: 0.0,
            sheen: 0.42,
            sheenRoughness: 0.60,
            sheenColor: new THREE.Color(0x3a2b22),
            envMapIntensity: 0.52
          });
          child.castShadow = false;
          child.material = hairMat;
        } else if (child.name.startsWith('garment_')) {
          const clothMat = new THREE.MeshPhysicalMaterial({
            name: origMat.name,
            color: 0x202226,
            roughness: 0.86,
            metalness: 0.0,
            sheen: 0.32,
            sheenRoughness: 0.80,
            sheenColor: new THREE.Color(0xffffff),
            bumpScale: 0.0065,
            envMapIntensity: 0.28
          });
          child.material = clothMat;
        } else {
          child.material = origMat.clone();
        }
      });

      // Seat model feet accurately on y = 0 podium surface
      const box = new THREE.Box3().setFromObject(clone);
      clone.position.y = -box.min.y;

      t.scene.add(clone);
      t.activeAvatar = clone;

      setModelLoading(false);
      setModelError('');
      applyBodyAndOutfitMaterials();
    };

    if (t.loadedModels[url]) {
      attachAvatar(t.loadedModels[url]);
    } else {
      setModelLoading(true);
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          t.loadedModels[url] = gltf.scene;
          attachAvatar(gltf.scene);
        },
        undefined,
        (err) => {
          if (cancelled) return;
          console.error('GLB Load error:', err);
          setModelError('Could not load 3D human model.');
          setModelLoading(false);
        }
      );
    }

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
    };
  }, [isOpen, selectedGender, webglUnavailable, webglRetryCount]);

  // Apply Live Body Proportions, Photographic Skin Complexion, & Exact Tailored Zara Garments
  const applyBodyAndOutfitMaterials = () => {
    const t = threeRef.current;
    const avatar = t.activeAvatar;
    if (!avatar) return;

    const baseHeight = selectedGender === 'female' ? 175 : 184;
    const hScale = heightCm / baseHeight;
    let buildWidth = 1.0;
    if (bodyBuild === 'slim') buildWidth = 0.94;
    if (bodyBuild === 'relaxed') buildWidth = 1.07;

    const sizeIdx = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].indexOf(String(selectedSize).toUpperCase());
    const sizeEase = sizeIdx >= 0 ? 1.0 + (sizeIdx - 2) * 0.015 : 1.0;

    avatar.scale.set(hScale * buildWidth * sizeEase, hScale, hScale * buildWidth * sizeEase);

    const toneObj = SKIN_TONES.find((s) => s.hex.toLowerCase() === skinToneHex.toLowerCase()) || SKIN_TONES[0];
    const gPrefix = selectedGender === 'female' ? 'f' : 'm';
    const skinUrl = `/textures/skin/${gPrefix}_${toneObj.suffix || 'latino'}.jpg`;

    const applySkinMap = (tex) => {
      if (threeRef.current.activeAvatar !== avatar) return;
      avatar.traverse((child) => {
        if (child.isMesh && child.userData.isSkinMesh && child.material) {
          child.material.map = tex;
          child.material.color.set(toneObj.tint || '#FFFFFF');
          child.material.needsUpdate = true;
        }
      });
    };

    if (toneObj.isDefault) {
      avatar.traverse((child) => {
        if (child.isMesh && child.userData.isSkinMesh && child.material) {
          child.material.map = child.userData.origMap || child.material.map;
          child.material.color.set('#FFFFFF');
          child.material.needsUpdate = true;
        }
      });
    } else if (skinTexCache.has(skinUrl)) {
      applySkinMap(skinTexCache.get(skinUrl));
    } else {
      new THREE.TextureLoader().load(skinUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        tex.needsUpdate = true;
        skinTexCache.set(skinUrl, tex);
        applySkinMap(tex);
      });
    }

    const slotByMeshName = computeSlotByMeshName(equippedOutfit, selectedGender);

    avatar.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const n = child.name;

      // Toggle ONLY the exact 3D garment meshes worn for the current outfit!
      if (n.startsWith('garment_')) {
        const slotItem = slotByMeshName[n];
        if (!slotItem?.product) {
          child.visible = false;
          return;
        }
        child.visible = true;

        const prod = slotItem.product;
        const chosenColorName = slotItem.color || prod.colors?.[0] || 'Standard';
        const hex = getHexStr(chosenColorName, prod);
        const procTex = createRealisticFabricTexture(prod.category, prod.name, hex);
        const bumpMap = createFabricBumpMap(prod.category, prod.name);
        const pbr = getFabricMaterialProps(prod.category, prod.name);

        child.material.map = procTex;
        child.material.bumpMap = bumpMap;
        child.material.color.setHex(0xffffff);
        child.material.roughness = pbr.roughness;
        child.material.metalness = pbr.metalness;
        child.material.envMapIntensity = pbr.envMapIntensity ?? 0.28;
        if ('sheen' in child.material) {
          child.material.sheen = pbr.sheen ?? 0.3;
        }
        child.material.needsUpdate = true;
      }
    });
  };

  useEffect(() => {
    applyBodyAndOutfitMaterials();
  }, [equippedOutfit, skinToneHex, heightCm, bodyBuild, selectedSize, selectedGender]);

  const heightFtIn = useMemo(() => {
    const totalInches = Math.round(heightCm / 2.54);
    return `${Math.floor(totalInches / 12)}'${totalInches % 12}"`;
  }, [heightCm]);

  const recommendedSize = useMemo(() => {
    const sizes = activeProduct?.sizes || ['XS', 'S', 'M', 'L', 'XL'];
    if (sizes.includes('36') || sizes.includes('38')) {
      if (heightCm < 168) return sizes[0] || '34';
      if (heightCm < 176) return '38';
      return '40';
    }
    if (heightCm < 168) return sizes.includes('S') ? 'S' : sizes[0];
    if (heightCm < 178) return bodyBuild === 'relaxed' ? 'L' : 'M';
    if (heightCm < 188) return bodyBuild === 'relaxed' ? 'XL' : 'L';
    return sizes.includes('XL') ? 'XL' : sizes[sizes.length - 1];
  }, [heightCm, bodyBuild, activeProduct]);

  const handleAddToCart = () => {
    if (!activeProduct) return;
    onAddToCart(activeProduct, selectedSize, 1, activeColor);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleSnapshot = () => {
    const canvas = threeRef.current.renderer?.domElement || studio2dCanvasRef.current;
    if (!canvas) return;
    try {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `KRONOS-3D-${(activeProduct?.name || 'LOOK').replace(/\s+/g, '-')}-${selectedSize}.png`;
      a.click();
      setSnapshotTaken(true);
      setTimeout(() => setSnapshotTaken(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNewPiece = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const colorsArr = newItemColors.split(',').map((c) => c.trim()).filter(Boolean);
    const newPiece = {
      id: `piece-${Date.now()}`,
      name: newItemName.trim().toUpperCase(),
      category: newItemCategory,
      gender: selectedGender === 'female' ? 'WOMEN' : 'MEN',
      price: parseFloat(newItemPrice) || 299.0,
      image: newItemImage || activeProduct?.image || '',
      img: newItemImage || activeProduct?.image || '',
      badge: 'CUSTOM FIT',
      colors: colorsArr.length > 0 ? colorsArr : ['Black', 'Navy blue'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      description: 'Custom piece calibrated in the 3D Virtual Fitting Lab.'
    };
    if (onAddProduct) onAddProduct(newPiece);
    handleWearItem(newPiece);
    setShowAddModal(false);
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      if (uploadImage) {
        const url = await uploadImage(file);
        if (url) setNewItemImage(url);
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => evt.target?.result && setNewItemImage(evt.target.result);
        reader.readAsDataURL(file);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  const currentLighting = LIGHTING_MODES.find((m) => m.id === lightingMode) || LIGHTING_MODES[0];

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0B10] flex flex-col font-sans text-white overflow-hidden antialiased select-none">
      {/* ── CLEAN KRONOS 3D VIRTUAL TRY-ON HEADER ── */}
      <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#0D0D13] flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EA301F] flex items-center justify-center font-azeret font-black text-xs text-white shadow-lg shadow-[#EA301F]/30">
            3D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-azeret font-bold text-xs sm:text-sm tracking-wider uppercase text-white">
                KRONOS • 3D VIRTUAL TRY-ON LAB
              </h1>
              <span
                className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  webglUnavailable
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {webglUnavailable ? 'REAL 3D AVATAR · SOFTWARE GL' : 'REAL 3D WEBGL AVATAR'}
              </span>
            </div>
            <p className="text-[11px] text-[#8E8E98] hidden sm:block">
              {selectedGender === 'male' ? 'Man 3D Model (184 cm)' : 'Woman 3D Model (175 cm)'} • Drag 360° to Inspect Every Angle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick MAN / WOMAN Top Bar Switcher */}
          <div className="hidden sm:flex items-center bg-black/50 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => handleChooseGenderModel('male')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                selectedGender === 'male' ? 'bg-[#EA301F] text-white' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              MAN
            </button>
            <button
              onClick={() => handleChooseGenderModel('female')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                selectedGender === 'female' ? 'bg-[#EA301F] text-white' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              WOMAN
            </button>
          </div>

          <button
            onClick={() => setShowWardrobeDrawer((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showWardrobeDrawer
                ? 'bg-[#EA301F] border-[#EA301F] text-white'
                : 'bg-white/5 hover:bg-white/10 text-[#D1D1DB] border-white/10'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All Outfits ({genderProducts.length})</span>
          </button>

          <button
            onClick={handleSnapshot}
            className="p-2 sm:px-3 sm:py-2 bg-white/5 hover:bg-white/10 text-[#D1D1DB] hover:text-white rounded-xl border border-white/10 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            title="Save 3D Lookbook Snapshot"
          >
            <Camera className="w-4 h-4 text-[#EA301F]" />
            <span className="hidden md:inline">{snapshotTaken ? 'Saved ✓' : 'Snapshot'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-[#EA301F] text-[#8E8E98] hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Close 3D Lab"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ── LEFT / CENTER: REAL 3D WEBGL HUMAN VIEWPORT ── */}
        <div
          className="flex-1 relative overflow-hidden min-h-[460px]"
          style={{ backgroundColor: currentLighting.bgCss }}
        >
          {/* Three.js Canvas Mount */}
          <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Full-Bleed Real 3D Software GL Canvas when Browser/GPU Refuses WebGL2 */}
          {webglUnavailable && (
            <>
              <canvas
                ref={studio2dCanvasRef}
                className="absolute inset-0 w-full h-full block z-[5] cursor-grab active:cursor-grabbing touch-none"
              />

              {/* Compact Non-Blocking Top Status Pill + Optional Diagnostics Popover */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 shadow-lg text-[10px] font-mono text-white">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="hidden sm:inline text-white/90">3D Software GL · GPU Paused</span>
                  <span className="sm:hidden text-white/90">Software 3D</span>
                  <button
                    type="button"
                    onClick={() => setShowWebglDetails((v) => !v)}
                    className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[#D1D1DB] hover:text-white transition-colors cursor-pointer"
                  >
                    {showWebglDetails ? 'Hide' : 'Why?'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWebglDetails(false);
                      setWebglUnavailable(false);
                      setModelLoading(true);
                      setWebglRetryCount((c) => c + 1);
                    }}
                    className="px-2 py-0.5 rounded-full bg-[#EA301F] hover:bg-[#FF3B28] text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCw className="w-2.5 h-2.5" />
                    <span>Retry 3D</span>
                  </button>
                </div>

                {showWebglDetails && (
                  <div className="mt-2 w-[320px] sm:w-[360px] rounded-2xl border border-white/15 bg-[#12121A]/95 p-3.5 shadow-2xl text-[11px] text-[#B4B4BF] leading-relaxed space-y-1.5 backdrop-blur-md">
                    <p>
                      <strong className="text-white">Browser GPU WebGL2 paused:</strong>{' '}
                      {webglFailReason || 'Browser returned null for WebGL2'}.
                    </p>
                    <p className="text-[10px] text-[#8E8E98]">
                      Showing your real 3D human (.glb) model via CPU 3D Software GL. To re-enable hardware GPU in Brave on Linux, open <code className="text-white/90">brave://settings/system</code> and enable <strong className="text-white/90">Use graphics acceleration when available</strong>, then restart Brave or click Retry 3D.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Initial MAN vs WOMAN Onboarding Selector Overlay (when opening 3D Lab from global nav) */}
          {!hasPickedModel && (
            <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="max-w-xl w-full bg-[#121218] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#EA301F] font-bold">
                    STEP 1 · SELECT YOUR 3D MODEL
                  </span>
                  <h2 className="text-xl sm:text-2xl font-azeret font-bold uppercase text-white mt-2">
                    Choose Man or Woman
                  </h2>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    Rotate your real 3D model 360° and click any item from Zara Tunisia to see it tailored &amp; worn live.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleChooseGenderModel('male')}
                    className="group p-5 rounded-2xl bg-[#191922] hover:bg-[#EA301F]/15 border border-white/15 hover:border-[#EA301F] transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-[#EA301F] flex items-center justify-center transition-colors">
                        <User className="w-5 h-5 text-white" />
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-[#D1D1DB]">
                        184 CM
                      </span>
                    </div>
                    <h3 className="font-azeret font-bold text-base text-white">MAN 3D MODEL</h3>
                    <p className="text-xs text-[#8E8E98] mt-1">
                      Menswear silhouettes: Jackets, Overshirts, Hoodies, Jeans, Polos &amp; Shoes.
                    </p>
                  </button>

                  <button
                    onClick={() => handleChooseGenderModel('female')}
                    className="group p-5 rounded-2xl bg-[#191922] hover:bg-[#EA301F]/15 border border-white/15 hover:border-[#EA301F] transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-[#EA301F] flex items-center justify-center transition-colors">
                        <User className="w-5 h-5 text-white" />
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-[#D1D1DB]">
                        175 CM
                      </span>
                    </div>
                    <h3 className="font-azeret font-bold text-base text-white">WOMAN 3D MODEL</h3>
                    <p className="text-xs text-[#8E8E98] mt-1">
                      Womenswear silhouettes: Baggy Jeans, Blazers, Dresses, Coats, Tops &amp; Bags.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Badge while GLB parses */}
          {modelLoading && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="px-5 py-3 rounded-2xl bg-black/80 border border-white/15 text-xs font-mono uppercase tracking-wider text-white flex items-center gap-2.5 shadow-xl">
                <RotateCw className="w-4 h-4 text-[#EA301F] animate-spin" />
                <span>Loading 3D Human Model...</span>
              </div>
            </div>
          )}

          {modelError && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-red-600/90 text-white text-xs font-mono z-20">
              {modelError}
            </div>
          )}

          {/* Top Left: Height & Currently Worn Full-Outfit Badge */}
          <div className="absolute left-4 top-4 pointer-events-none z-10 hidden sm:flex flex-col gap-2">
            <div className={`px-3.5 py-2.5 rounded-2xl border shadow-sm backdrop-blur-md ${
              currentLighting.isLight ? 'bg-white/85 border-black/10 text-[#111111]' : 'bg-[#0E0E16]/85 border-white/10 text-white'
            }`}>
              <span className={`text-[9px] font-mono uppercase block ${currentLighting.isLight ? 'text-black/50' : 'text-[#8E8E98]'}`}>
                3D Model Height
              </span>
              <span className="text-sm font-bold block mt-0.5">{heightCm} cm ({heightFtIn})</span>
            </div>

            {/* Active Outfit Stack Indicator */}
            <div className={`px-3.5 py-2.5 rounded-2xl border shadow-sm backdrop-blur-md space-y-1 max-w-[230px] ${
              currentLighting.isLight ? 'bg-white/85 border-black/10 text-[#111111]' : 'bg-[#0E0E16]/85 border-white/10 text-white'
            }`}>
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#EA301F] font-bold block">
                CURRENTLY WEARING
              </span>
              {equippedOutfit.top && (
                <div className="text-[10px] truncate">
                  <strong className="opacity-60">TOP:</strong> {equippedOutfit.top.product.name}
                </div>
              )}
              {equippedOutfit.bottom && (
                <div className="text-[10px] truncate">
                  <strong className="opacity-60">BOTTOM:</strong> {equippedOutfit.bottom.product.name}
                </div>
              )}
              {equippedOutfit.shoes && (
                <div className="text-[10px] truncate">
                  <strong className="opacity-60">SHOES:</strong> {equippedOutfit.shoes.product.name}
                </div>
              )}
              {equippedOutfit.bag && (
                <div className="text-[10px] truncate">
                  <strong className="opacity-60">BAG:</strong> {equippedOutfit.bag.product.name}
                </div>
              )}
            </div>
          </div>

          {/* Top Right: 360° Camera Angle Presets */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-lg">
            {['Front', '3/4', 'Side', 'Back'].map((preset) => (
              <button
                key={preset}
                onClick={() => setCameraPreset(preset)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono uppercase transition-all cursor-pointer ${
                  activeAngleLabel === preset ? 'bg-[#EA301F] text-white font-bold' : 'text-[#D1D1DB] hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Bottom Canvas Controls: 360° Turntable + Studio Lighting */}
          <div className="absolute bottom-4 inset-x-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
            <div className="pointer-events-auto flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 shadow-lg">
              <button
                onClick={() => setAutoRotate((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  autoRotate ? 'bg-[#EA301F] text-white' : 'bg-white/10 text-[#D1D1DB] hover:text-white'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
                <span>360° Auto-Rotate</span>
              </button>
              <span className="text-[11px] text-[#A1A1AA] hidden md:inline">
                Drag freely 360° • Scroll to zoom
              </span>
            </div>

            <div className="pointer-events-auto flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-lg">
              {LIGHTING_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLightingMode(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    lightingMode === m.id ? 'bg-[#EA301F] text-white' : 'text-[#D1D1DB] hover:text-white'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: MODEL + OUTFIT BUILDER + TAILORING CONTROLS ── */}
        <div className="w-full lg:w-[460px] xl:w-[480px] bg-[#0B0B11] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shrink-0 overflow-y-auto">
          {/* Active Focused Piece Banner */}
          {activeProduct && (
            <div className="p-4 sm:p-5 border-b border-white/10 bg-[#111119] flex items-center gap-4">
              <div className="w-14 h-20 rounded-xl bg-[#ECECE9] overflow-hidden shrink-0">
                <img
                  src={activeProduct.image || activeProduct.img}
                  alt={activeProduct.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#EA301F] uppercase">
                    {activeProduct.category}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                    {activeProduct.gender === 'WOMEN' ? 'WOMAN' : 'MAN'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white truncate mt-0.5">
                  {activeProduct.name}
                </h3>
                <div className="text-sm font-azeret font-bold text-white mt-1">
                  {Number(activeProduct.price || 0).toFixed(2)} DT
                </div>
              </div>
            </div>
          )}

          <div className="p-5 space-y-5 flex-1">
            {/* 1. CHOOSE MAN OR WOMAN MODEL */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#EA301F]" />
                  <span>1. Choose 3D Person (Man / Woman)</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleChooseGenderModel('male')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedGender === 'male'
                      ? 'border-[#EA301F] bg-[#EA301F]/15 ring-1 ring-[#EA301F]'
                      : 'border-white/10 bg-[#14141C] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-azeret font-bold text-xs text-white">MAN</span>
                    {selectedGender === 'male' && <Check className="w-3.5 h-3.5 text-[#EA301F]" />}
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Realistic 3D Male · 184 cm</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChooseGenderModel('female')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedGender === 'female'
                      ? 'border-[#EA301F] bg-[#EA301F]/15 ring-1 ring-[#EA301F]'
                      : 'border-white/10 bg-[#14141C] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-azeret font-bold text-xs text-white">WOMAN</span>
                    {selectedGender === 'female' && <Check className="w-3.5 h-3.5 text-[#EA301F]" />}
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Realistic 3D Female · 175 cm</span>
                </button>
              </div>
            </div>

            {/* 2. CLICK ANY ITEM TO WEAR IT ON THE 3D PERSON */}
            <div className="p-4 rounded-2xl bg-[#12121A] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-[#EA301F]" />
                  <span>2. Click Outfit to Wear ({visibleWardrobe.length})</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="text-[11px] font-semibold text-[#EA301F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Custom</span>
                </button>
              </div>

              {/* Slot Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'TOP', label: 'Tops & Jackets' },
                  { id: 'BOTTOM', label: 'Jeans & Pants' },
                  { id: 'SHOES', label: 'Shoes' },
                  ...(selectedGender === 'female' ? [{ id: 'BAG', label: 'Bags' }] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setWardrobeTab(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase border transition-all cursor-pointer ${
                      wardrobeTab === tab.id
                        ? 'bg-[#EA301F] border-[#EA301F] text-white font-bold'
                        : 'bg-black/40 border-white/10 text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Interactive Thumbnail Grid — Click any item & the 3D Person wears it */}
              <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {visibleWardrobe.map((p) => {
                  const slot = classifySlot(p.category);
                  const isWornInSlot = equippedOutfit[slot]?.product?.id === p.id;
                  const isFocused = activeProduct?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleWearItem(p)}
                      className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col relative group ${
                        isFocused
                          ? 'border-[#EA301F] bg-[#EA301F]/15 ring-1 ring-[#EA301F]'
                          : isWornInSlot
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-white/10 bg-black/30 hover:border-white/30'
                      }`}
                    >
                      <div className="aspect-[2/3] w-full bg-[#ECECE9] rounded-lg overflow-hidden mb-1">
                        <img
                          src={p.image || p.img}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                        />
                      </div>
                      {isWornInSlot && (
                        <span className="absolute top-2.5 right-2.5 px-1 py-0.5 rounded bg-emerald-500 text-black text-[8px] font-mono font-bold">
                          ON
                        </span>
                      )}
                      <span className="text-[9px] font-semibold text-white truncate w-full">
                        {p.name}
                      </span>
                      <span className="text-[9px] font-mono text-[#EA301F] font-bold">
                        {Number(p.price || 0).toFixed(0)} DT
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. GARMENT COLORWAY & SIZE */}
            {activeProduct && (
              <div className="p-4 rounded-2xl bg-[#12121A] border border-white/10 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#EA301F]" />
                      Colorway
                    </span>
                    <span className="text-xs font-mono text-[#EA301F]">{activeColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeProduct.colors || ['Standard']).map((cName, idx) => {
                      const colorLabel = normalizeColorLabel(cName);
                      const hex = getHexStr(colorLabel, activeProduct);
                      const active = normalizeColorLabel(activeColor) === colorLabel;
                      return (
                        <button
                          key={`${colorLabel}-${idx}`}
                          onClick={() => handleSelectColorForActive(colorLabel)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                            active
                              ? 'border-[#EA301F] bg-[#EA301F]/20 text-white font-semibold'
                              : 'border-white/10 bg-black/30 text-[#A1A1AA] hover:text-white'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-sm border border-white/25" style={{ backgroundColor: hex }} />
                          <span>{colorLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#EA301F]" />
                      Size
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Recommended: {recommendedSize}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeProduct.sizes || ['XS', 'S', 'M', 'L', 'XL']).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`min-w-10 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          selectedSize === sz
                            ? 'bg-white text-black border-white'
                            : 'bg-black/40 text-[#A1A1AA] border-white/10 hover:border-white/30'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. SKIN TONE, HEIGHT & BUILD CALIBRATION */}
            <div className="p-4 rounded-2xl bg-[#12121A] border border-white/10 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Skin Tone</span>
                  <span className="text-[11px] text-[#9CA3AF]">
                    {SKIN_TONES.find((t) => t.hex.toLowerCase() === skinToneHex.toLowerCase())?.name || 'Custom'}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSkinToneHex(tone.hex)}
                      style={{ backgroundColor: tone.hex }}
                      title={tone.name}
                      className={`h-8 rounded-lg cursor-pointer flex items-center justify-center ${
                        skinToneHex.toLowerCase() === tone.hex.toLowerCase()
                          ? 'ring-2 ring-[#EA301F] ring-offset-2 ring-offset-[#12121A]'
                          : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      {skinToneHex.toLowerCase() === tone.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-black drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#EA301F]" />
                    Height &amp; Build
                  </span>
                  <span className="text-xs font-mono text-[#EA301F]">{heightCm} cm ({heightFtIn})</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="205"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full accent-[#EA301F] cursor-pointer"
                />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: 'slim', label: 'Slim' },
                    { id: 'athletic', label: 'Athletic' },
                    { id: 'relaxed', label: 'Relaxed' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBodyBuild(b.id)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        bodyBuild === b.id
                          ? 'bg-[#EA301F] border-[#EA301F] text-white'
                          : 'bg-black/30 border-white/10 text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── ADD TO BAG FOOTER (TND / DT) ── */}
          <div className="p-4 border-t border-white/10 bg-[#0D0D13] shrink-0">
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 bg-[#EA301F] hover:bg-[#FF3B28] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-[#EA301F]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {addedSuccess
                  ? 'Added to Bag ✓'
                  : `Add ${selectedSize} to Shopping Bag • ${Number(activeProduct?.price || 0).toFixed(2)} DT`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── UPLOAD / CUSTOM PIECE MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#12121A] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white">Add Custom Piece to 3D Model</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#9CA3AF] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateNewPiece} className="space-y-3">
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Piece name (e.g. Oversized Trench Coat)"
                className="w-full bg-[#181824] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="Jackets">Jacket / Outerwear</option>
                  <option value="Coats">Coat / Trench</option>
                  <option value="Hoodies">Hoodie / Sweatshirt</option>
                  <option value="Shirts">Shirt</option>
                  <option value="T-Shirts">T-Shirt</option>
                  <option value="Jeans">Jeans</option>
                  <option value="Trousers">Trousers</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Bags">Bag</option>
                  <option value="Dresses">Dress</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="Price (DT)"
                  className="bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <input
                type="text"
                value={newItemColors}
                onChange={(e) => setNewItemColors(e.target.value)}
                placeholder="Colors (Black, Navy blue, Sand)"
                className="w-full bg-[#181824] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemImage}
                  onChange={(e) => setNewItemImage(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="flex-1 bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <label className="px-3 py-2 bg-white/10 hover:bg-[#EA301F] rounded-xl text-xs cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingImage ? '...' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#EA301F] hover:bg-[#FF3B28] text-white font-bold text-xs uppercase cursor-pointer"
              >
                Wear on 3D Model
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── SEARCHABLE FULL WARDROBE DRAWER ── */}
      {showWardrobeDrawer && (
        <div
          onClick={() => setShowWardrobeDrawer(false)}
          className="fixed inset-0 z-40 bg-black/80 flex justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0E0E16] h-full border-l border-white/10 flex flex-col p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-sm uppercase text-white">
                {selectedGender === 'female' ? 'WOMAN' : 'MAN'} Wardrobe ({genderProducts.length})
              </h3>
              <button onClick={() => setShowWardrobeDrawer(false)} className="p-1.5 rounded-lg bg-white/10 text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8E8E98] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search pieces..."
                value={wardrobeSearch}
                onChange={(e) => setWardrobeSearch(e.target.value)}
                className="w-full bg-[#14141E] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {genderProducts
                .filter((p) => !wardrobeSearch || String(p?.name || '').toLowerCase().includes(wardrobeSearch.toLowerCase()))
                .map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      handleWearItem(prod);
                      setShowWardrobeDrawer(false);
                    }}
                    className="w-full p-2.5 rounded-xl border border-white/10 hover:border-[#EA301F] bg-[#14141E] flex items-center gap-3 text-left transition-all cursor-pointer"
                  >
                    <img src={prod.image || prod.img} alt={prod.name} className="w-11 h-14 object-cover object-top rounded bg-[#ECECE9]" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-[#EA301F] uppercase block">{prod.category}</span>
                      <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                      <span className="text-xs text-[#9CA3AF]">{Number(prod.price || 0).toFixed(2)} DT</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
