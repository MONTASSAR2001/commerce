import { getSupabase } from './supabaseClient';
import { getLocalOrders, getLocalPromoCodes, safeReadJson, safeWriteJson } from './kronosDataService';
import {
  computeGraphMetrics,
  computeBm25Score,
  reciprocalRankFusion,
  buildWorkflowTelemetry
} from './enterpriseGraphEngine';
import {
  computeSemanticEmbedding384,
  cosineSimilarity384,
  formatPgVectorLiteral
} from './semanticVectorEngine';

const GROQ_CONFIG_STORAGE_KEY = 'kronos_groq_rag_config_v1';
const RAG_DOCS_STORAGE_KEY = 'kronos_rag_documents_v1';
const RAG_LOGS_STORAGE_KEY = 'kronos_rag_qa_logs_v1';
const RAG_SESSION_STORAGE_KEY = 'kronos_rag_session_id';

export const GROQ_FREE_MODELS = [
  {
    id: 'openai/gpt-oss-120b',
    label: 'OpenAI GPT-OSS 120B',
    tier: 'Flagship Reasoning (Free)',
    speed: 'Fast LPU',
    isReasoning: true,
    notes: 'Highest quality multi-hop streetwear styling, pricing & catalog reasoning.'
  },
  {
    id: 'qwen/qwen3.8-27b',
    label: 'Qwen 3.8 27B',
    tier: 'Multilingual & Structured (Free)',
    speed: 'Very Fast',
    isReasoning: false,
    notes: 'Crisp English/French/Arabic responses with direct output.'
  },
  {
    id: 'openai/gpt-oss-20b',
    label: 'OpenAI GPT-OSS 20B',
    tier: 'Ultra-Fast Fallback (Free)',
    speed: 'Ultra Fast',
    isReasoning: true,
    notes: 'Low-latency backup when 120B hits free RPM caps.'
  },
  {
    id: 'allam-2-7b',
    label: 'ALLaM 2 7B',
    tier: 'Arabic / Bilingual Light (Free)',
    speed: 'Instant',
    isReasoning: false,
    notes: 'Compact bilingual Arabic/English lightweight fallback.'
  }
];

const SYNONYM_MAP = {
  jean: ['jeans', 'denim', 'trousers', 'pants', 'baggy', 'pantalon'],
  jeans: ['jean', 'denim', 'trousers', 'pants', 'baggy'],
  jacket: ['jackets', 'coat', 'bomber', 'leather', 'outerwear', 'veste', 'blouson'],
  jackets: ['jacket', 'coat', 'bomber', 'leather', 'outerwear'],
  shirt: ['overshirt', 'shirt', 'top', 'tee', 'chemise'],
  knit: ['knitwear', 'jumper', 'sweater', 'cardigan', 'pull'],
  shipping: ['delivery', 'livraison', 'tunis', 'sousse', 'sfax', 'courier', 'dhl', 'free'],
  delivery: ['shipping', 'livraison', 'tunis', 'sousse', 'sfax', '24h', '48h'],
  return: ['returns', 'refund', 'exchange', 'policy', '30'],
  price: ['cost', 'tnd', 'dt', 'budget', 'cheap', 'under', 'discount', 'promo'],
  promo: ['discount', 'code', 'coupon', 'offer', 'sale'],
  drop: ['drops', 'nova', 'vero', 'luna', 'capsule', 'limited'],
  order: ['orders', 'commande', 'commandes', 'track', 'status', 'krn'],
  size: ['sizing', 'fit', 'eu', 'xs', 'xl', '3d', 'avatar', 'lab'],
  // French streetwear & shopping synonyms
  veste: ['jacket', 'jackets', 'bomber', 'outerwear', 'leather', 'surchemise'],
  blouson: ['jacket', 'bomber', 'leather', 'outerwear'],
  pantalon: ['jeans', 'denim', 'trousers', 'baggy'],
  chemise: ['overshirt', 'shirt', 'top'],
  pull: ['knitwear', 'sweater', 'cardigan', 'knit'],
  livraison: ['shipping', 'delivery', 'tunis', 'sousse', 'sfax', '24h', '48h'],
  réduction: ['promo', 'discount', 'code', 'sale'],
  reduction: ['promo', 'discount', 'code', 'sale'],
  boutique: ['store', 'shop', 'tunis', 'sousse', 'sfax'],
  // Arabic streetwear & shopping synonyms
  سترة: ['jacket', 'jackets', 'bomber', 'outerwear'],
  جاكيت: ['jacket', 'jackets', 'bomber', 'outerwear'],
  جينز: ['jeans', 'denim', 'baggy'],
  بنطال: ['jeans', 'trousers', 'pants', 'baggy'],
  قميص: ['overshirt', 'shirt'],
  كنزة: ['knitwear', 'sweater', 'knit'],
  شحن: ['shipping', 'delivery', 'tunis', 'sousse', 'sfax'],
  توصيل: ['shipping', 'delivery', 'tunis', 'sousse', 'sfax'],
  خصم: ['promo', 'discount', 'code', 'sale'],
  تخفيض: ['promo', 'discount', 'code', 'sale'],
  طلب: ['order', 'orders', 'commande', 'track'],
  متجر: ['store', 'shop', 'tunis', 'sousse', 'sfax']
};

export function getOrCreateRagSessionId() {
  if (typeof window === 'undefined') return 'server-session';
  try {
    let sid = window.sessionStorage.getItem(RAG_SESSION_STORAGE_KEY);
    if (!sid) {
      sid = `krn-ses-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      window.sessionStorage.setItem(RAG_SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return `krn-ses-${Date.now().toString(36)}`;
  }
}

export function getGroqConfig() {
  const saved = safeReadJson(GROQ_CONFIG_STORAGE_KEY, null) || {};
  const envKey = import.meta.env.VITE_GROQ_API_KEY || '';
  const envModel = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-120b';
  return {
    apiKey: saved.apiKey !== undefined && saved.apiKey !== '' ? saved.apiKey : envKey,
    model: saved.model || envModel,
    temperature: typeof saved.temperature === 'number' ? saved.temperature : 0.35,
    maxTokens: typeof saved.maxTokens === 'number' ? saved.maxTokens : 900,
    systemPersona:
      saved.systemPersona ||
      'You are K AI — an elite architectural streetwear stylist and Knowledge Graph strategist for K Tunisia. Ground every answer strictly in the retrieved Knowledge Graph context, cite real product names, prices in DT/TND, promo codes, store locations, and policies using **bold** highlights and crisp strategy sections.'
  };
}

export function saveGroqConfig(partial) {
  const next = { ...getGroqConfig(), ...partial };
  safeWriteJson(GROQ_CONFIG_STORAGE_KEY, next);
  return next;
}

export async function fetchAvailableGroqModels(customApiKey = null) {
  const cfg = getGroqConfig();
  const key = (customApiKey || cfg.apiKey || '').trim();
  if (!key) {
    return { ok: false, error: 'Missing Groq API key', models: GROQ_FREE_MODELS.map((m) => m.id) };
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${key}` }
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: data?.error?.message || `Groq HTTP ${res.status}`,
        models: GROQ_FREE_MODELS.map((m) => m.id)
      };
    }
    const allIds = (data.data || []).map((m) => m.id).sort();
    const chatIds = allIds.filter(
      (id) => !id.includes('whisper') && !id.includes('orpheus') && !id.includes('guard') && !id.includes('safeguard')
    );
    return { ok: true, models: chatIds, allModels: allIds };
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error', models: GROQ_FREE_MODELS.map((m) => m.id) };
  }
}

/* ── Knowledge Graph Compilation (Catalog + Drops + Stores + Promos + Docs) ── */

function tokenize(text = '') {
  const raw = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9àâäéèêëîïôöùûüç\u0600-\u06FF\-\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  const expanded = new Set(raw);
  raw.forEach((tok) => {
    if (SYNONYM_MAP[tok]) {
      SYNONYM_MAP[tok].forEach((syn) => expanded.add(syn));
    }
  });
  return Array.from(expanded);
}

function slugId(prefix, val) {
  return `${prefix}:${String(val || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;
}

function extractMaterials(composition = '') {
  const known = ['Cotton', 'Polyester', 'Denim', 'Leather', 'Wool', 'Elastane', 'Nylon', 'Viscose', 'Linen', 'Acrylic'];
  const lower = String(composition).toLowerCase();
  const hits = known.filter((m) => lower.includes(m.toLowerCase()));
  return hits.length > 0 ? hits : ['Studio Blend'];
}

export function buildKronosKnowledgeGraph(storeData = {}, customDocs = [], promos = [], options = {}) {
  const { includeInternalStock = false } = options;
  const nodesMap = new Map();
  const edgesMap = new Map();

  const addNode = (node) => {
    if (!node?.id || !node?.label) return;
    if (!nodesMap.has(node.id)) {
      nodesMap.set(node.id, {
        weight: 1.0,
        properties: {},
        search_text: `${node.label} ${node.summary || ''}`.toLowerCase(),
        is_active: true,
        ...node
      });
    }
  };

  const addEdge = (sourceId, targetId, relation, weight = 1.0, evidence = '') => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const id = `${sourceId}__${relation}__${targetId}`;
    if (!edgesMap.has(id)) {
      edgesMap.set(id, {
        id,
        source_id: sourceId,
        target_id: targetId,
        relation,
        weight,
        evidence
      });
    }
  };

  const brandName = storeData?.brand?.name || 'K';
  const brandNodeId = 'brand:kronos';
  addNode({
    id: brandNodeId,
    label: `${brandName} Streetwear Tunisia`,
    node_type: 'brand',
    weight: 2.0,
    summary: `${brandName} — ${storeData?.brand?.tagline || 'Unfiltered Streetwear'}. Stores in Tunisia, Cash on Delivery, 3D Virtual Fitting Lab.`,
    properties: {
      email: storeData?.footer?.email || '',
      phone: storeData?.footer?.phone || ''
    }
  });

  // Policies derived live from storefront settings
  const currencyCode = storeData?.currency?.activeCurrency || 'TND';
  const freeShippingThreshold = 300;
  addNode({
    id: 'policy:shipping',
    label: 'Tunisia Express Shipping Policy',
    node_type: 'policy',
    weight: 1.75,
    summary: `24-48h delivery across Tunis, Sousse, Sfax and all Tunisia governorates. 8 DT flat rate, FREE shipping on orders over ${freeShippingThreshold} DT. Currency: ${currencyCode}.`,
    search_text: 'shipping delivery livraison tunis sousse sfax 8 dt free 300 dt cash on delivery',
    properties: { freeOverTnd: freeShippingThreshold, flatFeeTnd: 8 }
  });
  addEdge(brandNodeId, 'policy:shipping', 'PROVIDES_SHIPPING', 1.4, 'Fast nationwide Tunisia courier');

  addNode({
    id: 'policy:returns',
    label: '30-Day Return & Size Exchange',
    node_type: 'policy',
    weight: 1.5,
    summary: '30-day hassle-free size exchange and returns on unworn garments with original tags.',
    search_text: 'return returns exchange refund 30 days policy size'
  });
  addEdge(brandNodeId, 'policy:returns', 'GUARANTEES_RETURNS', 1.3, '30-day size exchange guarantee');

  addNode({
    id: 'policy:3d-lab',
    label: '3D Anatomical Fitting Lab',
    node_type: 'policy',
    weight: 1.5,
    summary: 'Interactive 3D mannequin try-on calibrating garment silhouette across XS-XL & EU 32-46.',
    search_text: '3d fitting lab virtual try on mannequin height chest waist sizing'
  });
  addEdge(brandNodeId, 'policy:3d-lab', 'POWERS_TRYON', 1.35, 'Every catalog garment supports 3D preview');

  // Stores
  (storeData?.stores || []).forEach((st) => {
    const sid = slugId('store', st.id || st.city);
    addNode({
      id: sid,
      label: `${st.name} (${st.city})`,
      node_type: 'store',
      weight: 1.4,
      summary: `${st.name} in ${st.city}: ${st.address}. Hours: ${st.hours}. Phone: ${st.phone}.`,
      search_text: `${st.name} ${st.city} ${st.address} ${st.phone} ${st.hours}`.toLowerCase(),
      properties: st
    });
    addEdge(brandNodeId, sid, 'OPERATES_FLAGSHIP', 1.25, st.city);
  });

  // FAQs
  (storeData?.faqs || []).forEach((f, idx) => {
    const fid = slugId('faq', f.id || `q-${idx}`);
    addNode({
      id: fid,
      label: f.q || f.question || `FAQ #${idx + 1}`,
      node_type: 'faq',
      weight: 1.35,
      summary: f.a || f.answer || '',
      search_text: `${f.q || f.question || ''} ${f.a || f.answer || ''}`.toLowerCase()
    });
    addEdge(brandNodeId, fid, 'ANSWERS_FAQ', 1.1, 'Official customer FAQ');
  });

  // Promos
  const promoList = promos.length > 0 ? promos : getLocalPromoCodes();
  promoList
    .filter((p) => p.is_active !== false)
    .forEach((p) => {
      const pid = slugId('promo', p.code);
      const discText =
        p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : `${p.discount_value} DT OFF`;
      addNode({
        id: pid,
        label: `Promo ${p.code} (${discText})`,
        node_type: 'promo',
        weight: 1.65,
        summary: `Active code ${p.code}: ${discText}. ${p.description || ''} Min order: ${p.min_order_tnd || 0} DT.`,
        search_text: `promo code discount coupon ${p.code} ${p.description || ''} ${discText}`.toLowerCase(),
        properties: p
      });
      addEdge(brandNodeId, pid, 'OFFERS_PROMO', 1.45, p.code);
    });

  // Drops / Capsules
  const dropItems = storeData?.drops?.items || [];
  dropItems.forEach((d) => {
    const did = slugId('drop', d.id || d.name);
    addNode({
      id: did,
      label: `${d.code || 'DROP'} — ${d.name}`,
      node_type: 'collection',
      weight: 1.55,
      summary: `${d.name} (${d.units || 'Limited'}). Status: ${d.status || 'LIVE'}. ${d.tag || ''}`,
      search_text: `drop capsule ${d.code || ''} ${d.name || ''} ${d.tag || ''} ${d.status || ''}`.toLowerCase(),
      properties: d
    });
    addEdge(brandNodeId, did, 'RELEASES_CAPSULE', 1.35, d.status || 'LIVE');
  });

  // Custom Documents (rag_documents)
  (customDocs || [])
    .filter((d) => d.is_active !== false)
    .forEach((doc) => {
      const docId = slugId('doc', doc.id || doc.title);
      const tagsStr = Array.isArray(doc.tags) ? doc.tags.join(' ') : '';
      addNode({
        id: docId,
        label: doc.title,
        node_type: 'custom_doc',
        weight: 1.75,
        summary: doc.content,
        search_text: `${doc.title} ${doc.doc_type || ''} ${doc.content} ${tagsStr}`.toLowerCase(),
        properties: doc
      });
      addEdge(brandNodeId, docId, 'DOCUMENTS_KNOWLEDGE', 1.35, doc.doc_type || 'knowledge');
      if (doc.linked_node_id && nodesMap.has(doc.linked_node_id)) {
        addEdge(docId, doc.linked_node_id, 'AUGMENTS_ENTITY', 1.5, 'Admin knowledge doc');
      }
    });

  // Products + Categories + Colorways + Materials + Cross-Styling PAIR_WITH edges
  const products = (storeData?.products || []).filter((p) => p.isPublished !== false);
  const byGenderCategory = new Map();

  products.forEach((prod) => {
    const pNodeId = `product:${prod.id}`;
    const colorList = Array.isArray(prod.colors) ? prod.colors : [];
    const sizesList = Array.isArray(prod.sizes) ? prod.sizes : ['S', 'M', 'L', 'XL'];
    const comp = prod.composition || '100% Cotton';
    const catName = prod.category || 'Apparel';
    const gender = (prod.gender || 'MEN').toUpperCase();

    const stockTag = includeInternalStock ? ` Stock: ${prod.stock ?? 50} units.` : '';
    addNode({
      id: pNodeId,
      label: prod.name,
      node_type: 'product',
      weight: prod.badge ? 1.45 : 1.15,
      summary: `${prod.name} (${gender} ${catName}) — ${prod.price} DT${prod.originalPrice ? ` (was ${prod.originalPrice} DT, ${prod.discount || 'SALE'})` : ''
        }. Colors: ${colorList.join(', ') || 'Standard'}. Fabric: ${comp}.${stockTag} ${prod.description || ''
        }`,
      search_text: `${prod.name} ${catName} ${gender} ${colorList.join(' ')} ${comp} ${prod.badge || ''} ${prod.description || ''
        } ${prod.price} dt`.toLowerCase(),
      properties: {
        productId: prod.id,
        slug: prod.slug,
        price: prod.price,
        originalPrice: prod.originalPrice,
        gender,
        category: catName,
        ...(includeInternalStock ? { stock: prod.stock ?? 50 } : {}),
        img: prod.img || prod.image,
        colors: colorList,
        sizes: sizesList
      }
    });

    // Category node & edge
    const catNodeId = slugId('cat', catName);
    addNode({
      id: catNodeId,
      label: catName,
      node_type: 'category',
      weight: 1.4,
      summary: `${brandName} ${catName} architectural garments engineered for fit and texture.`,
      search_text: `category ${catName}`.toLowerCase()
    });
    addEdge(pNodeId, catNodeId, 'BELONGS_TO_CATEGORY', 1.35, catName);

    // Gender Collection anchor
    const genderNodeId = slugId('drop', `gender-${gender}`);
    addNode({
      id: genderNodeId,
      label: `${gender} Edit`,
      node_type: 'collection',
      weight: 1.35,
      summary: `Curated ${gender} architectural streetwear garments in TND.`,
      search_text: `${gender.toLowerCase()} collection edit line`
    });
    addEdge(pNodeId, genderNodeId, 'IN_EDIT', 1.2, gender);

    // Colorways
    colorList.forEach((col) => {
      const colId = slugId('color', col);
      addNode({
        id: colId,
        label: col,
        node_type: 'colorway',
        weight: 1.1,
        summary: `Colorway palette: ${col}`,
        search_text: `color colorway ${col}`.toLowerCase()
      });
      addEdge(pNodeId, colId, 'AVAILABLE_IN_COLOR', 1.15, col);
    });

    // Materials
    extractMaterials(comp).forEach((mat) => {
      const matId = slugId('material', mat);
      addNode({
        id: matId,
        label: mat,
        node_type: 'material',
        weight: 1.15,
        summary: `Fabric composition material: ${mat}`,
        search_text: `material fabric ${mat} textile`.toLowerCase()
      });
      addEdge(pNodeId, matId, 'CRAFTED_WITH', 1.2, comp);
    });

    // Link products into Nova / Vero / Luna drops deterministically by index/vibe
    if (dropItems.length > 0) {
      const dropTarget = dropItems[Math.abs(prod.name.length + Number(prod.price || 0)) % dropItems.length];
      if (dropTarget) {
        addEdge(pNodeId, slugId('drop', dropTarget.id || dropTarget.name), 'FEATURED_IN_DROP', 1.1, dropTarget.name);
      }
    }

    const gcKey = `${gender}:${catName}`;
    if (!byGenderCategory.has(gcKey)) byGenderCategory.set(gcKey, []);
    byGenderCategory.get(gcKey).push(prod);
  });

  // Cross-Category Outfit Styling Edges (Jackets/Overshirts <-> Jeans/Trousers <-> Knitwear/Tops)
  const pairings = [
    ['Jackets', 'Jeans'],
    ['Overshirts', 'Jeans'],
    ['Jackets', 'Knitwear'],
    ['Knitwear', 'Trousers'],
    ['Leather', 'Jeans'],
    ['Blazers', 'Trousers']
  ];
  ['MEN', 'WOMEN'].forEach((gender) => {
    const genderOutfitPairs = [];
    pairings.forEach(([catA, catB]) => {
      const listA = byGenderCategory.get(`${gender}:${catA}`) || [];
      const listB = byGenderCategory.get(`${gender}:${catB}`) || [];
      listA.slice(0, 6).forEach((prodA, i) => {
        const prodB = listB[i % Math.max(1, listB.length)];
        if (prodB) {
          addEdge(
            `product:${prodA.id}`,
            `product:${prodB.id}`,
            'PAIRS_WELL_WITH',
            1.25,
            `${gender} outfit pairing: ${prodA.name} + ${prodB.name}`
          );
          if (genderOutfitPairs.length < 4) {
            genderOutfitPairs.push([prodA, prodB]);
          }
        }
      });
    });

    // Dedicated Gender Outfit Nodes (Strict MEN vs WOMEN Outfit Index)
    const genderAnchorId = slugId('drop', `gender-${gender}`);
    genderOutfitPairs.forEach(([p1, p2], idx) => {
      const total = Number(p1.price || 0) + Number(p2.price || 0);
      const outfitId = `outfit:${gender.toLowerCase()}-${idx + 1}`;
      addNode({
        id: outfitId,
        label: `${gender} Curated Look #${idx + 1}`,
        node_type: 'collection',
        weight: 1.55,
        summary: `${gender} 2-piece architectural pairing: ${p1.name} (${p1.price} DT) + ${p2.name} (${p2.price} DT) — Total ${total} DT.`,
        search_text: `${gender.toLowerCase()} outfit look ensemble pairing ${p1.name} ${p2.name} ${p1.category} ${p2.category}`.toLowerCase(),
        properties: {
          gender,
          isOutfit: true,
          productIds: [p1.id, p2.id],
          totalPrice: total
        }
      });
      addEdge(outfitId, genderAnchorId, 'PART_OF_EDIT', 1.4, `${gender} outfits table`);
      addEdge(outfitId, `product:${p1.id}`, 'OUTFIT_INCLUDES', 1.5, p1.category);
      addEdge(outfitId, `product:${p2.id}`, 'OUTFIT_INCLUDES', 1.5, p2.category);
    });
  });

  // Compute Enterprise Graph Metrics: 10-iter PageRank, Brandes Betweenness, Closeness & Union-Find Communities
  const rawNodesList = Array.from(nodesMap.values());
  const rawEdgesList = Array.from(edgesMap.values());
  const computed = computeGraphMetrics(
    rawNodesList.map((n) => ({ ...n, type: n.node_type })),
    rawEdgesList.map((e) => ({ ...e, source: e.source_id, target: e.target_id, type: e.relation })),
    'Type',
    'Centrality'
  );

  const enrichedNodesMap = new Map();
  const enrichedNodes = computed.nodes.map((cn) => {
    const withVec = {
      ...cn,
      embedding:
        cn.embedding ||
        computeSemanticEmbedding384(`${cn.label || ''} ${cn.summary || ''} ${cn.search_text || ''}`)
    };
    enrichedNodesMap.set(withVec.id, withVec);
    return withVec;
  });

  // Build fast bidirectional adjacency list
  const adjacency = new Map();
  rawEdgesList.forEach((edge) => {
    if (!adjacency.has(edge.source_id)) adjacency.set(edge.source_id, []);
    if (!adjacency.has(edge.target_id)) adjacency.set(edge.target_id, []);
    adjacency.get(edge.source_id).push({ edge, neighborId: edge.target_id, direction: 'out' });
    adjacency.get(edge.target_id).push({ edge, neighborId: edge.source_id, direction: 'in' });
  });

  return {
    nodes: enrichedNodes,
    edges: rawEdgesList,
    nodesMap: enrichedNodesMap,
    edgesMap,
    adjacency,
    metricsSummary: computed.summary
  };
}

/* ── Hybrid Multi-Hop Graph RAG Subgraph Retriever ─────────────────────────── */

/* ── Channel Privacy Shield & Full Admin Project Dossier ──────────────────── */

export function isStorefrontRestrictedQuery(query = '') {
  const q = String(query || '').toLowerCase();
  if (!q.trim()) return false;

  const patterns = [
    /\b(revenue|gmv|turnover|earnings|profit|margin|margins|income|cashflow|balance|treasury|funds?|bank|capital|net worth|money\s*(font|made|earned|total|in|flow)?|how much money|combien\s*(d[' ]argent|de\s*revenu|gagn[eé])|chiffre\s*d[' ]affaires?|recette|b[eé]n[eé]fice|argent)\b/i,
    /\b(how many\s+(orders?|commandes?|sales|clients?|customers?|users?|subscribers?|admins?|products?\s+in\s+stock)|total\s+(orders?|commandes?|revenue|sales|customers?|subscribers?)|number of\s+(orders?|commandes?|customers?|clients?)|combien\s+de\s+(commandes?|clients?|ventes?|abonn[eé]s?)|nombre\s+de\s+(commandes?|clients?))\b/i,
    /\b(list\s+(all\s+)?(orders?|commandes?|customers?|clients?|subscribers?|emails?|phones?)|export\s+(orders?|customers?)|all\s+(orders?|commandes?|customers?|clients?))\b/i,
    /\b(admin\s+(password|email|panel|credentials|access|secret|key|dashboard)|service[_\s]?role|api\s*key|gsk_|env\.local|database\s+(schema|dump|url)|sql\s+table|rls\s+policy|unpublished|draft\s+products?)\b/i,
    /\b(exact\s+stock|stock\s+(count|level|quantity|inventory)|warehouse\s+inventory)\b/i,
    /\b(ignore\s+(?:all\s+|previous\s+|the\s+)?instructions?|system\s*prompt|developer\s*prompt|reveal\s+(?:your\s+|the\s+)?(?:prompt|instructions?|secrets?|keys?|dossier)|admin\s+full\s+project\s+dossier|bypass\s+(?:privacy|security|shield)|act\s+as\s+admin)\b/i,
    /(?:إجمالي\s*(?:الإيرادات|المبيعات|الأرباح|الطلبات|العملاء|الزبائن|المشتركين)|كم\s*(?:عدد\s*)?(?:الطلبات|المبيعات|العملاء|الزبائن|الأرباح|المداخيل)|كشف\s*(?:الطلبات|العملاء|كلمات\s*المرور|المفاتيح)|مفتاح\s*(?:الواجهة|الأدمن|سري|api)|تجاهل\s*(?:التعليمات|الأوامر)|كلمة\s*(?:السر|المرور)|قاعدة\s*البيانات|لوحة\s*(?:التحكم|الإدارة)|سجل\s*(?:الطلبات|العملاء))/iu
  ];

  return patterns.some((re) => re.test(q));
}

export function buildAdminProjectDossier({
  storeData = {},
  orders = [],
  mediaAssets = [],
  subscribers = [],
  promos = [],
  customDocs = [],
  qaLogs = [],
  graph = null
}) {
  const brandName = storeData?.brand?.name || 'K';
  const allProducts = storeData?.products || [];
  const publishedProducts = allProducts.filter((p) => p.isPublished !== false);
  const draftProducts = allProducts.filter((p) => p.isPublished === false);
  const menCount = publishedProducts.filter((p) => (p.gender || '').toUpperCase() === 'MEN').length;
  const womenCount = publishedProducts.filter((p) => (p.gender || '').toUpperCase() === 'WOMEN').length;
  const discountedProducts = publishedProducts.filter((p) => p.originalPrice && Number(p.originalPrice) > Number(p.price));
  const lowStockProducts = allProducts.filter((p) => Number(p.stock ?? 50) <= 10);
  const prices = publishedProducts.map((p) => Number(p.price || 0)).filter((n) => n > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const activeOrders = orders || [];
  const nonCancelled = activeOrders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = nonCancelled.reduce((s, o) => s + Number(o.total_tnd || 0), 0);
  const aov = nonCancelled.length > 0 ? Math.round(totalRevenue / nonCancelled.length) : 0;
  const statusBreakdown = activeOrders.reduce((acc, o) => {
    const k = o.status || 'pending';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const cityBreakdown = activeOrders.reduce((acc, o) => {
    const c = o.city || 'Unspecified';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const bucketCounts = (mediaAssets || []).reduce(
    (acc, a) => {
      const b = a.bucket_name || a.media_type || 'other';
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    },
    {}
  );

  const promoSummary = (promos.length > 0 ? promos : getLocalPromoCodes())
    .map(
      (p) =>
        `${p.code} (${p.discount_type === 'percentage' ? `${p.discount_value}%` : `${p.discount_value} DT`}, min ${p.min_order_tnd || 0
        } DT, active=${p.is_active !== false}, uses=${p.usage_count ?? 0})`
    )
    .join('; ');

  const recentOrdersText = activeOrders
    .slice(0, 6)
    .map(
      (o) =>
        `${o.order_number || o.id}: ${o.customer_name || 'Client'} (${o.city || 'TN'}) — ${o.total_tnd || 0} DT [${o.status || 'pending'
        }]`
    )
    .join(' | ');

  return [
    `ADMIN FULL PROJECT DOSSIER (${brandName} Platform Intelligence):`,
    `- FINANCIALS & COMMANDES: Total Commandes=${activeOrders.length} | Active Non-Cancelled=${nonCancelled.length} | Gross Merchandise Volume (Revenue)=${totalRevenue.toFixed(
      2
    )} DT | Average Order Value=${aov} DT | Status Breakdown=${JSON.stringify(statusBreakdown)} | City Breakdown=${JSON.stringify(
      cityBreakdown
    )}.`,
    recentOrdersText ? `- RECENT COMMANDES: ${recentOrdersText}` : '- RECENT COMMANDES: 0 orders recorded yet.',
    `- CATALOG & INVENTORY: Total=${allProducts.length} items (${publishedProducts.length} live, ${draftProducts.length} drafts) | MEN=${menCount} | WOMEN=${womenCount} | On Sale=${discountedProducts.length} | Price Range=${minPrice}-${maxPrice} DT | Low Stock (<=10 units)=${lowStockProducts.length} (${lowStockProducts.slice(0, 5).map((p) => `${p.name}:${p.stock}`).join(', ') || 'none'
    }).`,
    `- PROMOS & DROPS: Promos=[${promoSummary}] | Capsules/Drops=${(storeData?.drops?.items || []).length} live drops.`,
    `- MEDIA VAULT & AUDIENCE: Media Assets=${(mediaAssets || []).length} files (${JSON.stringify(
      bucketCounts
    )}) | Newsletter Subscribers=${(subscribers || []).length} | Physical Stores=${(storeData?.stores || []).length} (${(storeData?.stores || []).map((s) => `${s.name} @ ${s.city}`).join(', ') || 'none'
    }).`,
    `- GRAPH RAG & SYSTEM STACK: Compiled Graph=${graph?.nodes?.length || 0} entities / ${graph?.edges?.length || 0
    } semantic edges | Custom Knowledge Docs=${(customDocs || []).length} | Q&A Logs=${(qaLogs || []).length
    } | Tech Stack=React 18 + Vite 6 + Tailwind CSS + Three.js 3D Fitting Lab (Rawline3DFittingLab.jsx) + Supabase Postgres/Storage/RLS + Groq LPU Graph RAG (openai/gpt-oss-120b failover) | Routes=/, /admin, /admin-kronos-2026, /product/:slug.`
  ].join('\n');
}

export function detectTargetGender(query = '') {
  const q = String(query || '').toLowerCase();
  const wantsWomen =
    /\b(women|woman|womens|wom[ae]n|femme|femmes|female|lady|ladies|girl|girls|fille|filles|wmn|her|she)\b/.test(q) ||
    /(نساء|نسائي|نسوية|امرأة|امراة|سيدات|بنات)/.test(q);
  const wantsMen =
    /\b(men|mens|man|homme|hommes|male|guy|guys|boy|boys|garcon|garcons|his|him)\b/.test(q) ||
    /\bgive\s+me\s+me\s+(items?|outfits?|looks?|pieces?|clothes?)\b/.test(q) ||
    /\bme\s+(items?|outfits?|looks?|jackets?|jeans|shirts?)\b/.test(q) ||
    /(رجال|رجالي|رجالية|رجل|شباب)/.test(q);

  if (wantsWomen && !wantsMen) return 'WOMEN';
  if (wantsMen && !wantsWomen) return 'MEN';
  return null;
}

export function isPureGreeting(query = '') {
  const cleaned = String(query || '').toLowerCase().replace(/[^a-z\u0600-\u06FF\s]/g, '').trim();
  if (!cleaned) return false;
  return /^(hi|hello|hey|yo|salam|salut|bonjour|bonsoir|coucou|hola|good morning|good evening|good afternoon|how are you|ca va|مرحبا|اهلا|أهلا|السلام عليكم|سلام|صباح الخير|مساء الخير|اهلين)$/.test(
    cleaned
  );
}

export function isCatalogOverviewQuery(query = '') {
  const q = String(query || '').toLowerCase();
  return (
    /\b(how many|total|count|number of|categor(?:y|ies)|cheapest|lowest price|most expensive|highest price|price range|all items|all clothes|full catalog|what do you sell|combien|nombre d|cat[eé]gories|gamme de prix|tous les articles|moins cher)\b/i.test(
      q
    ) || /(كم\s*(?:عدد|قطعة|ملابس)|إجمالي|الفئات|أرخص|أغلى|كل\s*القطع|عدد\s*الملابس)/.test(q)
  );
}

export function computePublicCatalogStats(storeData = {}, liveStats = null) {
  const published = (storeData?.products || []).filter((p) => p.isPublished !== false);
  const menItems = published.filter((p) => (p.gender || '').toUpperCase() === 'MEN');
  const womenItems = published.filter((p) => (p.gender || '').toUpperCase() === 'WOMEN');
  const countCats = (arr) =>
    arr.reduce((acc, p) => {
      const cat = p.category || 'Apparel';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

  const sortedByPrice = [...published]
    .filter((p) => Number(p.price) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price));

  const menCategories =
    liveStats?.men_categories && Object.keys(liveStats.men_categories).length > 0
      ? liveStats.men_categories
      : countCats(menItems);
  const womenCategories =
    liveStats?.women_categories && Object.keys(liveStats.women_categories).length > 0
      ? liveStats.women_categories
      : countCats(womenItems);

  const totalProducts =
    typeof liveStats?.total_products === 'number' && liveStats.total_products > 0
      ? liveStats.total_products
      : published.length;
  const menCount =
    typeof liveStats?.men_count === 'number' && (liveStats.men_count > 0 || totalProducts === 0)
      ? liveStats.men_count
      : menItems.length;
  const womenCount =
    typeof liveStats?.women_count === 'number' && (liveStats.women_count > 0 || totalProducts === 0)
      ? liveStats.women_count
      : womenItems.length;
  const onSaleCount =
    typeof liveStats?.on_sale_count === 'number'
      ? liveStats.on_sale_count
      : published.filter((p) => p.originalPrice && Number(p.originalPrice) > Number(p.price)).length;

  return {
    totalProducts,
    menCount,
    womenCount,
    onSaleCount,
    minPrice:
      typeof liveStats?.min_price_tnd === 'number' && liveStats.min_price_tnd > 0
        ? liveStats.min_price_tnd
        : sortedByPrice[0]?.price || 0,
    maxPrice:
      typeof liveStats?.max_price_tnd === 'number' && liveStats.max_price_tnd > 0
        ? liveStats.max_price_tnd
        : sortedByPrice[sortedByPrice.length - 1]?.price || 0,
    menCategories,
    womenCategories,
    lowestItem: sortedByPrice[0] || null,
    highestItem: sortedByPrice[sortedByPrice.length - 1] || null
  };
}

function formatPublicCatalogOverview(stats) {
  const fmtCats = (obj) =>
    Object.entries(obj || {})
      .map(([k, v]) => `${k} (${v})`)
      .join(', ') || 'None';
  const lowText = stats.lowestItem ? `${stats.lowestItem.name} (${stats.lowestItem.price} DT)` : `${stats.minPrice} DT`;
  const highText = stats.highestItem ? `${stats.highestItem.name} (${stats.highestItem.price} DT)` : `${stats.maxPrice} DT`;
  return [
    `AUTHORITATIVE STOREWIDE CATALOG BREAKDOWN (exact live counts across all published garments — never confuse with sampled pieces below):`,
    `- Total Live Pieces: ${stats.totalProducts} | MEN Collection: ${stats.menCount} pieces | WOMEN Collection: ${stats.womenCount} pieces | On Sale: ${stats.onSaleCount} pieces`,
    `- Price Range: ${stats.minPrice} DT – ${stats.maxPrice} DT (Accessible entry: ${lowText} | Signature statement: ${highText})`,
    `- MEN Categories (${stats.menCount}): ${fmtCats(stats.menCategories)}`,
    `- WOMEN Categories (${stats.womenCount}): ${fmtCats(stats.womenCategories)}`
  ].join('\n');
}

export function retrieveGraphRagSubgraph({
  query,
  graph,
  storeData = {},
  remoteRows = [],
  orders = [],
  channel = 'storefront',
  adminProjectData = null,
  genderOutfits = [],
  liveStats = null,
  queryVector = null
}) {
  const qLower = String(query || '').toLowerCase().trim();
  const targetGender = detectTargetGender(qLower);
  const pureGreeting = isPureGreeting(qLower);
  const isOverviewQ = isCatalogOverviewQuery(qLower);
  const qVec = Array.isArray(queryVector) ? queryVector : computeSemanticEmbedding384(query);
  const tokens = tokenize(query);
  const scoreMap = new Map();
  const hopMap = new Map();
  const pathMap = new Map();

  // Enforce strict gender boundary across Stage 0, Stage 1, and Stage 2 BFS traversal
  const nodeMatchesGender = (node) => {
    if (!targetGender || !node) return true;
    if (node.node_type === 'product') {
      return (node.properties?.gender || '').toUpperCase() === targetGender;
    }
    if (node.node_type === 'collection') {
      const nodeGender = (node.properties?.gender || '').toUpperCase();
      if (nodeGender === 'MEN' || nodeGender === 'WOMEN') {
        return nodeGender === targetGender;
      }
      if (node.id === 'drop:gender-men' || /\bmen\b/i.test(node.label)) return targetGender === 'MEN';
      if (node.id === 'drop:gender-women' || /\bwomen\b/i.test(node.label)) return targetGender === 'WOMEN';
    }
    return true;
  };

  // Check for budget filter e.g. "under 250", "less than 200"
  const budgetMatch = qLower.match(/(?:under|below|moins de|less than|<)\s*(\d{2,4})/);
  const maxBudget = budgetMatch ? Number(budgetMatch[1]) : null;

  // Stage 0: Merge Supabase pgvector HNSW + SQL Graph RAG RPC seed hits when available (gender-filtered)
  const pgvectorCandidates = [];
  (remoteRows || []).forEach((r) => {
    const id = r.node_id || r.id;
    const node = id ? graph.nodesMap.get(id) : null;
    if (!node || !nodeMatchesGender(node)) return;
    const vecSim = Number(r.vector_score || 0);
    const rpcScore = Number(r.graph_score || 3.0) * 1.4 + vecSim * 5.5;
    if (vecSim > 0 || rpcScore > 0) {
      pgvectorCandidates.push({ id, val: rpcScore });
    }
    scoreMap.set(id, (scoreMap.get(id) || 0) + rpcScore);
    hopMap.set(id, Number(r.hop_distance ?? 0));
    pathMap.set(id, r.via_path || node.label);
  });

  // Stage 1: Okapi BM25 + 384-Dim Cosine Vector + Intent Scoring + Multi-Source Reciprocal Rank Fusion (RRF k=60)
  const docFreqMap = new Map();
  let totalDocLen = 0;
  const nodeDocTokens = new Map();
  graph.nodes.forEach((node) => {
    const docToks = tokenize(`${node.label} ${node.search_text || ''} ${node.summary || ''}`);
    nodeDocTokens.set(node.id, docToks);
    totalDocLen += docToks.length;
    new Set(docToks).forEach((t) => docFreqMap.set(t, (docFreqMap.get(t) || 0) + 1));
  });
  const avgDocLen = totalDocLen / Math.max(1, graph.nodes.length);

  const bm25Candidates = [];
  const vectorCandidates = [];
  const intentCandidates = [];
  const structuralCandidates = [];

  graph.nodes.forEach((node) => {
    if (!nodeMatchesGender(node)) return;

    const haystack = `${node.label} ${node.search_text || ''} ${node.summary || ''}`.toLowerCase();
    const bm25 = computeBm25Score(
      tokens,
      nodeDocTokens.get(node.id) || [],
      avgDocLen,
      docFreqMap,
      graph.nodes.length
    );

    if (bm25 > 0) {
      bm25Candidates.push({ id: node.id, val: bm25 });
    }

    const cosSim = node.embedding ? cosineSimilarity384(qVec, node.embedding) : 0;
    if (cosSim >= 0.22) {
      vectorCandidates.push({ id: node.id, val: cosSim });
    }

    let score = bm25 + (cosSim >= 0.22 ? cosSim * 7.5 : 0);
    if (qLower.length > 2 && node.label.toLowerCase().includes(qLower)) {
      score += 8.0;
    }

    let matchedTerms = 0;
    tokens.forEach((tok) => {
      if (haystack.includes(tok)) {
        matchedTerms += 1;
        score += tok.length >= 5 ? 2.4 : 1.5;
        if (node.label.toLowerCase().includes(tok)) score += 1.6;
      }
    });

    if (matchedTerms === 0 && !scoreMap.has(node.id) && bm25 <= 0 && cosSim < 0.34) return;

    // Gender intent alignment & outfit priority
    if (node.node_type === 'product') {
      const gender = (node.properties?.gender || '').toUpperCase();
      if (targetGender === 'WOMEN' && gender === 'WOMEN') score += 4.5;
      if (targetGender === 'MEN' && gender === 'MEN') score += 4.5;
      if (maxBudget !== null && Number(node.properties?.price || 9999) <= maxBudget) {
        score += 4.0;
      }
    }
    if (node.node_type === 'collection' && node.properties?.isOutfit && targetGender) {
      score += 5.0;
    }

    // Channel/Topic priors (including FR/AR triggers)
    if (node.node_type === 'promo' && /promo|discount|code|sale|offre|coupon|réduction|reduction|خصم|تخفيض/.test(qLower)) {
      score += 4.5;
    }
    if (node.node_type === 'policy' && /ship|deliver|return|refund|3d|fit|livraison|retour|شحن|توصيل/.test(qLower)) {
      score += 4.2;
    }
    if (node.node_type === 'store' && /store|shop|address|tunis|sousse|sfax|location|phone|email|boutique|متجر/.test(qLower)) {
      score += 4.5;
    }

    score *= node.weight || 1.0;
    if (score > 0) {
      intentCandidates.push({ id: node.id, val: score });
      structuralCandidates.push({
        id: node.id,
        val: (node.pagerank || 0.01) * 100 + (node.centrality || 0) * 5
      });
    }

    if (score > (scoreMap.get(node.id) || 0)) {
      scoreMap.set(node.id, score);
      hopMap.set(node.id, 0);
      pathMap.set(node.id, node.label);
    }
  });

  // Fuse Supabase pgvector HNSW + Local 384-dim Cosine + BM25 Lexical + Intent Semantic + PageRank via Enterprise RRF (k=60)
  const rrfSources = [
    { name: 'semantic_cosine', weight: 1.25, items: vectorCandidates.sort((a, b) => b.val - a.val).slice(0, 35) },
    { name: 'bm25', weight: 1.0, items: bm25Candidates.sort((a, b) => b.val - a.val).slice(0, 35) },
    { name: 'intent', weight: 1.15, items: intentCandidates.sort((a, b) => b.val - a.val).slice(0, 35) },
    { name: 'pagerank', weight: 0.65, items: structuralCandidates.sort((a, b) => b.val - a.val).slice(0, 35) }
  ];
  if (pgvectorCandidates.length > 0) {
    rrfSources.unshift({
      name: 'supabase_pgvector',
      weight: 1.35,
      items: pgvectorCandidates.sort((a, b) => b.val - a.val).slice(0, 35)
    });
  }
  const rrfFusedList = reciprocalRankFusion(rrfSources, 60);
  const rrfScoreMap = new Map(rrfFusedList.map((r) => [r.id, r.rrfScore]));
  rrfFusedList.slice(0, 12).forEach((entry) => {
    const n = graph.nodesMap.get(entry.id);
    if (!n || !nodeMatchesGender(n)) return;
    const rrfBoost = entry.rrfScore * 120;
    if (rrfBoost > (scoreMap.get(entry.id) || 0)) {
      scoreMap.set(entry.id, (scoreMap.get(entry.id) || 0) + rrfBoost * 0.35);
    }
  });

  // If user requested MEN or WOMEN explicitly (e.g. "men items", "women outfit"), ensure curated gender seeds are populated
  if (targetGender) {
    const productSeedCount = Array.from(scoreMap.keys()).filter(
      (id) => graph.nodesMap.get(id)?.node_type === 'product'
    ).length;
    if (productSeedCount < 3) {
      graph.nodes
        .filter((n) => (n.node_type === 'product' || n.properties?.isOutfit) && nodeMatchesGender(n))
        .slice(0, 6)
        .forEach((n, idx) => {
          if (!scoreMap.has(n.id)) {
            scoreMap.set(n.id, 6.0 - idx * 0.4);
            hopMap.set(n.id, 0);
            pathMap.set(n.id, `${targetGender} Curated Selection -> ${n.label}`);
          }
        });
    }
  }

  // Ensure brand anchor if general question matched nothing specific
  if (scoreMap.size === 0) {
    ['brand:kronos', 'policy:shipping', 'policy:3d-lab'].forEach((id, i) => {
      const n = graph.nodesMap.get(id);
      if (n) {
        scoreMap.set(id, 4.0 - i * 0.5);
        hopMap.set(id, 0);
        pathMap.set(id, n.label);
      }
    });
  }

  const topSeeds = Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([id]) => id);

  // Stage 2: 2-Hop Personalized Spreading Activation Traversal over Graph Edges (Strictly Gender-Safe)
  const activeEdgeIds = new Set();
  const traversalPaths = [];

  topSeeds.forEach((seedId) => {
    const seedScore = scoreMap.get(seedId) || 1;
    const seedLabel = graph.nodesMap.get(seedId)?.label || seedId;
    const hop1Neighbors = graph.adjacency.get(seedId) || [];

    hop1Neighbors.slice(0, 14).forEach(({ edge, neighborId }) => {
      const nbNode = graph.nodesMap.get(neighborId);
      if (!nbNode || !nodeMatchesGender(nbNode)) return;
      const propagated1 = seedScore * 0.65 * (edge.weight || 1.0);
      activeEdgeIds.add(edge.id);

      const path1 = `${seedLabel} --[${edge.relation}]--> ${nbNode.label}`;
      if ((scoreMap.get(neighborId) || 0) < propagated1) {
        scoreMap.set(neighborId, propagated1);
        hopMap.set(neighborId, 1);
        pathMap.set(neighborId, path1);
      }
      if (traversalPaths.length < 14) traversalPaths.push(path1);

      // Hop 2 expansion (prioritize styling pairings, drops, policies, promos; block opposite-gender jump)
      const hop2Neighbors = graph.adjacency.get(neighborId) || [];
      hop2Neighbors.slice(0, 6).forEach(({ edge: edge2, neighborId: nb2Id }) => {
        if (nb2Id === seedId) return;
        const nb2Node = graph.nodesMap.get(nb2Id);
        if (!nb2Node || !nodeMatchesGender(nb2Node)) return;
        const boost2 = edge2.relation === 'PAIRS_WELL_WITH' || edge2.relation === 'OUTFIT_INCLUDES' || nb2Node.node_type === 'promo' ? 1.2 : 1.0;
        const propagated2 = propagated1 * 0.48 * (edge2.weight || 1.0) * boost2;
        activeEdgeIds.add(edge2.id);

        const path2 = `${path1} --[${edge2.relation}]--> ${nb2Node.label}`;
        if ((scoreMap.get(nb2Id) || 0) < propagated2) {
          scoreMap.set(nb2Id, propagated2);
          hopMap.set(nb2Id, 2);
          pathMap.set(nb2Id, path2);
        }
        if (traversalPaths.length < 18 && (edge2.relation === 'PAIRS_WELL_WITH' || edge2.relation === 'OUTFIT_INCLUDES')) {
          traversalPaths.push(path2);
        }
      });
    });
  });

  // Rank subgraph nodes & attach RRF / PageRank telemetry
  const rankedNodes = Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([id, score]) => ({
      ...graph.nodesMap.get(id),
      score: Number(score.toFixed(2)),
      rrfScore: Number((rrfScoreMap.get(id) || 0).toFixed(5)),
      hop: hopMap.get(id) ?? 0,
      viaPath: pathMap.get(id) || ''
    }))
    .filter((n) => n && n.id && nodeMatchesGender(n));

  // Extract recommended live product objects (Strictly respecting targetGender; empty for pure greetings)
  const productLookup = new Map((storeData?.products || []).map((p) => [p.id, p]));
  const matchedProducts = rankedNodes
    .filter((n) => n.node_type === 'product' && n.properties?.productId)
    .map((n) => productLookup.get(n.properties.productId))
    .filter((p) => p && (!targetGender || (p.gender || '').toUpperCase() === targetGender));

  let recommendedProducts = [];
  if (!pureGreeting) {
    if (isOverviewQ && !targetGender) {
      const publishedAll = (storeData?.products || []).filter((p) => p.isPublished !== false);
      const topMen = publishedAll.find((p) => (p.gender || '').toUpperCase() === 'MEN');
      const topWomen = publishedAll.find((p) => (p.gender || '').toUpperCase() === 'WOMEN');
      recommendedProducts = [topMen, topWomen].filter(Boolean);
    } else if (matchedProducts.length > 0) {
      recommendedProducts = matchedProducts.slice(0, 3);
    } else if (targetGender) {
      recommendedProducts = (storeData?.products || [])
        .filter((p) => p.isPublished !== false && (p.gender || '').toUpperCase() === targetGender)
        .slice(0, 3);
    } else if (!/track|order|commande|faq|policy|return|ship|revenue|gmv/i.test(qLower)) {
      recommendedProducts = (storeData?.products || []).filter((p) => p.isPublished !== false).slice(0, 3);
    }
  }

  // Order / Project lookup enrichment:
  // Strictly isolated! Storefront NEVER receives store financials, aggregate order counts, or customer lists.
  const krnMatch = qLower.match(/krn-[a-z0-9-]+/i);
  let orderContext = '';
  if (channel === 'admin_studio') {
    const adminOrders = adminProjectData?.orders || orders || [];
    if (krnMatch) {
      const foundOrd = adminOrders.find(
        (o) => String(o.order_number || '').toLowerCase() === krnMatch[0].toLowerCase()
      );
      if (foundOrd) {
        orderContext = `\nMATCHED ORDER ${foundOrd.order_number}: Status=${foundOrd.status}, Total=${foundOrd.total_tnd} DT, City=${foundOrd.city}, Customer=${foundOrd.customer_name}, Phone=${foundOrd.phone || 'n/a'}.`;
      } else {
        orderContext = `\nNO ORDER MATCHED code "${krnMatch[0].toUpperCase()}".`;
      }
    }
    const dossier = buildAdminProjectDossier({
      storeData,
      orders: adminOrders,
      mediaAssets: adminProjectData?.mediaAssets || [],
      subscribers: adminProjectData?.subscribers || [],
      promos: adminProjectData?.promos || [],
      customDocs: adminProjectData?.customDocs || [],
      qaLogs: adminProjectData?.qaLogs || [],
      graph
    });
    orderContext = `${orderContext}\n${dossier}`.trim();
  } else if (krnMatch) {
    // Storefront: only match an exact KRN code present in this visitor's own local session receipt
    const visitorLocalOrders = getLocalOrders();
    const foundOrd = visitorLocalOrders.find(
      (o) => String(o.order_number || '').toLowerCase() === krnMatch[0].toLowerCase()
    );
    if (foundOrd) {
      orderContext = `\nYOUR ORDER ${foundOrd.order_number}: Status=${foundOrd.status}, Total=${foundOrd.total_tnd} DT, City=${foundOrd.city}.`;
    } else {
      orderContext = `\nORDER CODE "${krnMatch[0].toUpperCase()}" NOT FOUND IN LOCAL RECEIPT. Ask visitor to double-check their confirmation code or contact ${storeData?.footer?.email || 'support'}.`;
    }
  }

  const catalogStats = computePublicCatalogStats(storeData, liveStats);
  const catalogOverviewBlock = formatPublicCatalogOverview(catalogStats);
  const uniquePaths = Array.from(new Set(traversalPaths)).slice(0, 12);
  const isAdminChannel = channel === 'admin_studio';
  const contextLines = rankedNodes
    .slice(0, 16)
    .map((n) =>
      isAdminChannel
        ? `- [${n.node_type.toUpperCase()} | hop=${n.hop} | score=${n.score}] ${n.label}: ${n.summary}`
        : `- [${n.node_type.toUpperCase()}] ${n.label}: ${n.summary}`
    )
    .join('\n');

  const outfitLines =
    Array.isArray(genderOutfits) && genderOutfits.length > 0
      ? `\n${isAdminChannel ? `SUPABASE ${targetGender || 'GENDER'} OUTFITS TABLE` : `CURATED ${targetGender || 'BOUTIQUE'} OUTFITS`} (${genderOutfits.length} looks):\n${genderOutfits
        .map(
          (o) =>
            `- ${o.title} (${o.style_vibe || 'Studio'}): ${o.total_price_tnd} DT | Promo: ${o.recommended_promo_code || 'KRONOS15'
            }`
        )
        .join('\n')}`
      : '';

  const genderGuardBanner = targetGender
    ? `ACTIVE GENDER FILTER: STRICTLY ${targetGender} ONLY — DO NOT mention or suggest any ${targetGender === 'MEN' ? 'WOMEN' : 'MEN'
    } pieces.`
    : '';

  const formattedContext = [
    genderGuardBanner,
    catalogOverviewBlock,
    isAdminChannel
      ? `KNOWLEDGE GRAPH ENTITIES (${rankedNodes.length} retrieved from ${graph.nodes.length} nodes / ${graph.edges.length} edges):`
      : `RELEVANT BOUTIQUE PIECES & DETAILS:`,
    contextLines,
    outfitLines,
    isAdminChannel && uniquePaths.length > 0
      ? `\nMULTI-HOP GRAPH PATHS:\n${uniquePaths.map((p) => `• ${p}`).join('\n')}`
      : '',
    orderContext
  ]
    .filter(Boolean)
    .join('\n');

  const topRrfScore = rrfFusedList[0]?.rrfScore || 0;
  const workflowStages = buildWorkflowTelemetry({
    query,
    mode: channel,
    targetGender,
    seedCount: topSeeds.length,
    totalNodes: rankedNodes.length,
    edgeCount: activeEdgeIds.size,
    latencyMs: 0,
    topRrfScore
  });

  return {
    seedIds: topSeeds,
    rankedNodes,
    activeEdgeIds: Array.from(activeEdgeIds),
    traversalPaths: uniquePaths,
    recommendedProducts,
    supabaseHitsCount: (remoteRows || []).length,
    topRrfScore,
    workflowStages,
    formattedContext
  };
}

/* ── Groq Free LLM Call + Failover + Automatic Supabase Q&A Logging ────────── */

async function callGroqChatCompletion({ apiKey, model, messages, temperature, maxTokens }) {
  const isGptOss = model.includes('gpt-oss');
  const body = {
    model,
    messages,
    temperature,
    max_completion_tokens: maxTokens,
    ...(isGptOss ? { reasoning_effort: 'low' } : {})
  };

  const t0 = performance.now();
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  const latencyMs = Math.round(performance.now() - t0);

  if (!response.ok) {
    const errMsg = payload?.error?.message || `Groq HTTP ${response.status}`;
    const err = new Error(errMsg);
    err.status = response.status;
    throw err;
  }

  const choice = payload?.choices?.[0]?.message || {};
  const content = (choice.content || '').trim();
  if (!content) {
    throw new Error(`Model ${model} returned empty content (increase max_completion_tokens)`);
  }

  return {
    answer: content,
    reasoningTrace: (choice.reasoning || '').trim(),
    modelUsed: payload.model || model,
    latencyMs,
    promptTokens: payload?.usage?.prompt_tokens || 0,
    completionTokens: payload?.usage?.completion_tokens || 0
  };
}

function isCasualGreetingQuery(query = '') {
  const q = String(query || '').trim();
  return /^(hi+|hello+|hey+|yo+|good\s*(morning|afternoon|evening)|salut+|bonjour+|bonsoir+|coucou+|ça\s*va|مرحبا+|أهلا+|اهلا+|سلام+|صباح\s*الخير|مساء\s*الخير)[!.,\s؟?]*$/i.test(
    q
  );
}

export function sanitizeStorefrontAnswer(answer = '') {
  if (!answer) return '';
  return String(answer)
    .replace(/^###\s*✨\s*(?:CURATED\s+SELECTION|SÉLECTION\s+SIGNÉE|تشكيلة\s+مختارة|K\s+AI\s+STYLIST[^\n]*|WELCOME\s+TO\s+K[^\n]*)\s*\n?/gim, '')
    .replace(/^>\s*💡\s*(?:Strategy|Stratégie|استراتيجية(?:\s+ذكية)?)\s*:\s*/gim, '')
    .replace(/\b(?:Knowledge Graph|Graph RAG|Supabase|Groq(?:\s*LPU)?)\b/gi, 'our boutique catalog')
    .replace(/\b(?:gsk|sbp|sb_secret)_[A-Za-z0-9_-]{8,}\b/g, '[redacted-key]')
    .replace(/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{10,}\b/g, '[redacted-token]')
    .replace(/ADMIN\s+FULL\s+PROJECT\s+DOSSIER/gi, 'Boutique Catalog Overview')
    .trim();
}

function buildLocalFallbackAnswer(query, subgraph, storeData, { channel = 'storefront', language = 'en', liveStats = null } = {}) {
  const brandName = storeData?.brand?.name || 'K';
  const topProd = subgraph.recommendedProducts || [];
  const policies = subgraph.rankedNodes.filter((n) => n.node_type === 'policy' || n.node_type === 'faq' || n.node_type === 'promo');

  if (isCatalogOverviewQuery(query)) {
    const stats = computePublicCatalogStats(storeData, liveStats);
    const fmtCats = (obj) =>
      Object.entries(obj || {})
        .map(([k, v]) => `**${k}** (${v})`)
        .join(', ');
    if (language === 'fr') {
      return [
        `La collection **${brandName}** compte actuellement **${stats.totalProducts} pièces** au total : **${stats.menCount} pour HOMME** et **${stats.womenCount} pour FEMME** (gamme de **${stats.minPrice} DT** à **${stats.maxPrice} DT**).`,
        `- **Collection HOMME (${stats.menCount})** : ${fmtCats(stats.menCategories)}`,
        `- **Collection FEMME (${stats.womenCount})** : ${fmtCats(stats.womenCategories)}`,
        `La livraison express en Tunisie est offerte dès **300 DT** d'achat.`
      ].join('\n');
    }
    if (language === 'ar') {
      return [
        `تضم مجموعة **${brandName}** حالياً **${stats.totalProducts} قطعة** إجمالاً: **${stats.menCount} للرجال** و**${stats.womenCount} للنساء** (الأسعار من **${stats.minPrice} DT** إلى **${stats.maxPrice} DT**).`,
        `- **قسم الرجال (${stats.menCount})**: ${fmtCats(stats.menCategories)}`,
        `- **قسم النساء (${stats.womenCount})**: ${fmtCats(stats.womenCategories)}`,
        `التوصيل السريع في تونس مجاني للطلبات فوق **300 DT**.`
      ].join('\n');
    }
    return [
      `Our **${brandName}** catalog features **${stats.totalProducts} live pieces** in total: **${stats.menCount} for MEN** and **${stats.womenCount} for WOMEN** (ranging from **${stats.minPrice} DT** to **${stats.maxPrice} DT**).`,
      `- **MEN Collection (${stats.menCount})**: ${fmtCats(stats.menCategories)}`,
      `- **WOMEN Collection (${stats.womenCount})**: ${fmtCats(stats.womenCategories)}`,
      `Tell me which silhouette you want to explore, or preview any piece inside our **3D Fitting Lab**.`
    ].join('\n');
  }

  if (channel !== 'admin_studio') {
    if (isCasualGreetingQuery(query)) {
      if (language === 'fr') {
        return `Bonjour et bienvenue chez **${brandName}**. Recherchez-vous une silhouette **HOMME** ou **FEMME**, une veste forte pour cette saison ou un conseil taille ?`;
      }
      if (language === 'ar') {
        return `أهلاً بك في **${brandName}**. هل تبحث اليوم عن إطلالة **رجالية** أو **نسائية**، أم عن قطعة معينة وتنسيق يناسب ذوقك؟`;
      }
      return `Hello and welcome to **${brandName}**. Are you styling a **MEN** or **WOMEN** look today, or looking for a specific fit, promo, or delivery detail?`;
    }

    const lines = [];
    if (topProd.length > 0) {
      if (language === 'fr') {
        lines.push('Voici une sélection équilibrée pensée pour structurer votre silhouette :');
        lines.push(...topProd.slice(0, 3).map((p) => `- **${p.name}** — **${p.price} DT** (${p.gender} · ${p.category})`));
        lines.push('Vous pouvez tester la coupe exacte dans le **Labo d\'Essayage 3D** ou profiter de la **livraison offerte dès 300 DT** en Tunisie.');
      } else if (language === 'ar') {
        lines.push('إليك اختيارات متناسقة تجمع بين الأناقة والعملية:');
        lines.push(...topProd.slice(0, 3).map((p) => `- **${p.name}** — **${p.price} DT** (${p.gender} · ${p.category})`));
        lines.push('يمكنك معاينة المقاس في **مختبر القياس 3D** والاستفادة من **التوصيل المجاني فوق 300 DT** في تونس.');
      } else {
        lines.push('Here is a tailored edit curated around texture, clean proportions, and everyday versatility:');
        lines.push(...topProd.slice(0, 3).map((p) => `- **${p.name}** — **${p.price} DT** (${p.gender} · ${p.category})`));
        lines.push('Try proportions live inside the **3D Fitting Lab**—orders over **300 DT** unlock complimentary **Tunisia express delivery**.');
      }
      return lines.join('\n');
    }

    if (policies.length > 0) {
      lines.push(...policies.slice(0, 2).map((p) => `- **${p.label}**: ${p.summary}`));
      return lines.join('\n');
    }
    return language === 'fr'
      ? `Notre équipe conciergerie reste à votre écoute à **${storeData?.footer?.email || 'contact@kronos.tn'}** pour toute demande sur mesure.`
      : language === 'ar'
      ? `يسعد فريق خدمة العملاء بمساعدتك مباشرة عبر **${storeData?.footer?.email || 'contact@kronos.tn'}**.`
      : `Our boutique concierge can also assist directly at **${storeData?.footer?.email || 'contact@kronos.tn'}** for bespoke requests.`;
  }

  const lines = [`### ✨ ${brandName} Knowledge Graph Insight`];
  lines.push(`Here is the curated breakdown for **${query}**:`);
  if (policies.length > 0) {
    lines.push('', '### 💎 Policies & Promo Advantage', ...policies.slice(0, 2).map((p) => `- **${p.label}**: ${p.summary}`));
  }
  if (topProd.length > 0) {
    lines.push(
      '',
      '### 🎯 Recommended Pieces',
      ...topProd.map((p) => `- **${p.name}** — **${p.price} DT** (${p.gender} · ${p.category})`)
    );
    lines.push('', `> 💡 Strategy: Preview any match inside the **3D Fitting Lab** or combine pieces above **300 DT** to unlock free Tunisia express shipping.`);
  } else {
    lines.push('', `Contact **${storeData?.footer?.email || 'contact@kronos.tn'}** for direct concierge support.`);
  }
  return lines.join('\n');
}

export async function askKronosGraphRag({
  query,
  channel = 'storefront',
  language = 'en',
  storeData = {},
  customDocs = [],
  promos = [],
  orders = [],
  mediaAssets = [],
  subscribers = [],
  qaLogs = [],
  history = [],
  sessionId = getOrCreateRagSessionId(),
  overrideModel = null
}) {
  const cfg = getGroqConfig();
  const isAdminStudio = channel === 'admin_studio';
  const activeCustomDocs = customDocs.length > 0 ? customDocs : getLocalRagDocuments();
  const graph = buildKronosKnowledgeGraph(storeData, activeCustomDocs, promos, {
    includeInternalStock: isAdminStudio
  });
  const brandLabel = storeData?.brand?.name || 'K';
  const hasArabicScript = /[\u0600-\u06FF]/.test(String(query || ''));
  const hasFrenchHint = /\b(bonjour|salut|veste|pantalon|chemise|livraison|femme|homme|prix|combien|commande|code)\b/i.test(
    String(query || '')
  );
  const resolvedLang = hasArabicScript ? 'ar' : language === 'ar' ? 'ar' : language === 'fr' || hasFrenchHint ? 'fr' : 'en';

  // Strict Storefront Client Privacy Shield:
  // Clients on the main site must NEVER access store revenue/funds, total order counts, customer lists, stock counts, or internal admin data.
  if (!isAdminStudio && isStorefrontRestrictedQuery(query)) {
    const blockedSubgraph = retrieveGraphRagSubgraph({
      query: 'shipping drops promo',
      graph,
      storeData,
      remoteRows: [],
      orders: [],
      channel: 'storefront'
    });
    const supportEmail = storeData?.footer?.email || 'contact@kronos.tn';
    const shieldAnswer =
      resolvedLang === 'ar'
        ? [
            `أنا **مستشار الأناقة في ${brandLabel}**، يسعدني مساعدتك في **تنسيق الإطلالات، اختيار المقاس عبر مختبر القياس 3D، أكواد الخصم، ومتابعة التوصيل**.`,
            `- **بيانات المتجر الداخلية**: الأرباح وإجمالي الطلبات وحالة المخزون مخصصة لإدارة **${brandLabel}** فقط.`,
            `- **تتبع طلبك الشخصي**: أرسل لي رقم تأكيد طلبك **KRN-...** (أو تواصل عبر **${supportEmail}**) وسأساعدك فوراً في حالة الشحن، أو أخبرني بذوقك لأنسق لك إطلالة متكاملة.`
          ].join('\n')
        : resolvedLang === 'fr'
        ? [
            `Je suis votre **Conseiller Style ${brandLabel}**, dédié aux **silhouettes, essayage 3D, codes promo et suivi de livraison**.`,
            `- **Données internes de la maison**: Le chiffre d'affaires, le volume global de commandes et les stocks internes sont strictement confidentiels.`,
            `- **Suivi de votre colis**: Indiquez votre référence **KRN-...** (ou écrivez à **${supportEmail}**), ou dites-moi quel look **HOMME** ou **FEMME** vous souhaitez composer.`
          ].join('\n')
        : [
            `I am your **${brandLabel} Personal Stylist**, here to curate **outfits, 3D Fitting Lab sizing tips, promo savings, and delivery support**.`,
            `- **Private Maison Records**: Store revenue, total order volumes, and internal stock logs stay strictly confidential.`,
            `- **Your Personal Order**: Share your **KRN-...** reference code (or reach **${supportEmail}**) for shipping updates — or tell me what **MEN** or **WOMEN** look you're styling today.`
          ].join('\n');

    return {
      logId: `rag-shield-${Date.now()}`,
      loggedInCloud: false,
      answer: shieldAnswer,
      reasoningTrace: 'Privacy Shield blocked storefront access to internal financials/command counts.',
      modelUsed: 'privacy-shield',
      engineMode: 'privacy-shield',
      llmError: '',
      latencyMs: 2,
      promptTokens: 0,
      completionTokens: 0,
      graph,
      subgraph: {
        ...blockedSubgraph,
        recommendedProducts: []
      }
    };
  }

  // Query Supabase pgvector HNSW + 2-Hop Graph RPC + Live Catalog Stats + Dedicated Gender Outfits
  const targetGender = detectTargetGender(query);
  const queryVector = computeSemanticEmbedding384(query);
  const queryVecLiteral = formatPgVectorLiteral(queryVector);
  let effectiveStoreData = storeData;
  let effectiveGraph = graph;
  let remoteRows = [];
  let genderOutfits = [];
  let liveStats = null;
  let pgvectorRpcActive = false;
  const sb = getSupabase();
  if (sb) {
    try {
      const rpcPromise = sb
        .rpc('query_kronos_pgvector_graph_rag', {
          p_query: query,
          p_query_embedding: queryVecLiteral,
          p_limit: 18,
          p_gender: targetGender
        })
        .then(async (res) => {
          if (!res?.error && Array.isArray(res?.data)) {
            pgvectorRpcActive = true;
            return res;
          }
          const legacy = await sb.rpc('query_kronos_graph_rag', {
            p_query: query,
            p_limit: 16,
            ...(targetGender ? { p_gender: targetGender } : {})
          });
          if (!legacy?.error) return legacy;
          return { data: [] };
        });

      const statsPromise = sb.rpc('get_kronos_catalog_stats').then((r) => (r?.error ? null : r?.data || null));

      const outfitsPromise = targetGender
        ? sb
          .from(targetGender === 'MEN' ? 'men_outfits' : 'women_outfits')
          .select('id, title, style_vibe, total_price_tnd, recommended_promo_code, product_ids')
          .eq('is_active', true)
          .limit(4)
        : /outfit|look|ensemble|tenue|إطلالة|طقم/i.test(query)
        ? Promise.all([
            sb.from('men_outfits').select('id, title, style_vibe, total_price_tnd, recommended_promo_code, product_ids').eq('is_active', true).limit(2),
            sb.from('women_outfits').select('id, title, style_vibe, total_price_tnd, recommended_promo_code, product_ids').eq('is_active', true).limit(2)
          ]).then(([m, w]) => ({ data: [...(m?.data || []), ...(w?.data || [])] }))
        : Promise.resolve({ data: [] });

      const needsCatalogHydration = (storeData?.products || []).length < 10;
      const productsPromise = needsCatalogHydration
        ? sb
          .from('products')
          .select('id, slug, name, category, gender, price, original_price, discount, badge, img, colors, sizes, description, composition, is_published')
          .eq('is_published', true)
          .limit(120)
        : Promise.resolve({ data: null });

      const [rpcRes, rpcStats, outfitRes, prodRes] = await Promise.all([
        rpcPromise,
        statsPromise,
        outfitsPromise,
        productsPromise
      ]);

      if (Array.isArray(rpcRes?.data)) remoteRows = rpcRes.data;
      if (rpcStats && typeof rpcStats === 'object') liveStats = rpcStats;
      if (Array.isArray(outfitRes?.data)) genderOutfits = outfitRes.data;
      if (Array.isArray(prodRes?.data) && prodRes.data.length > 0) {
        const mapped = prodRes.data.map((p) => ({
          ...p,
          originalPrice: p.original_price,
          isPublished: p.is_published !== false
        }));
        effectiveStoreData = { ...storeData, products: mapped };
        effectiveGraph = buildKronosKnowledgeGraph(effectiveStoreData, activeCustomDocs, promos, {
          includeInternalStock: isAdminStudio
        });
      }
    } catch {
      // safe fallback to local compiled graph + 384-dim cosine vector index
    }
  }

  const subgraph = retrieveGraphRagSubgraph({
    query,
    graph: effectiveGraph,
    storeData: effectiveStoreData,
    remoteRows,
    orders: isAdminStudio ? orders : [],
    channel,
    adminProjectData: isAdminStudio
      ? { orders, mediaAssets, subscribers, promos, customDocs: activeCustomDocs, qaLogs }
      : null,
    genderOutfits,
    liveStats,
    queryVector
  });

  const channelRoleDesc = isAdminStudio
    ? `Admin Studio FULL-PROJECT Intelligence Copilot — you have complete authorized access to the ADMIN FULL PROJECT DOSSIER below (live GMV/revenue in DT, exact commandes count/statuses/cities, inventory & stock counts, promo usage, media vault buckets, newsletter subscribers, stores, Graph RAG telemetry, and platform architecture/routes/3D Fitting Lab). Answer any project, financial, operational, or merchandising question accurately with exact figures from the context.`
    : `Storefront Luxury Customer Stylist — help shoppers discover outfits, prices, promo codes, 3D Fitting Lab sizing, and shipping. STRICT PRIVACY RULE: You NEVER know and must NEVER disclose store revenue, funds, total order/commande counts, customer lists, subscriber numbers, stock quantities, or internal admin details.`;

  const genderPromptRule = targetGender
    ? `- **STRICT GENDER LOCK**: The user asked specifically for **${targetGender}**. Recommend ONLY **${targetGender}** garments. NEVER include ${targetGender === 'MEN' ? 'WOMEN' : 'MEN'
    } pieces.`
    : '- Respect exact product gender tags whenever styling outfits.';

  const languageRule =
    resolvedLang === 'ar'
      ? `LANGUAGE REQUIREMENT: Respond in fluent, refined luxury-fashion Arabic (العربية الفصحى الأنيقة). Never translate mechanically word-by-word; use natural Arabic fashion terminology while keeping product codes/titles and prices like **299 DT** and promo codes like **KRONOS15** crisp and clear.`
      : resolvedLang === 'fr'
      ? `LANGUAGE REQUIREMENT: Respond in fluent, chic luxury-streetwear French (français naturel et raffiné, vouvoiement élégant). Never translate word-by-word; use natural French fashion phrasing (surchemise, blouson en cuir, coupe ample, maille structurée) while keeping exact catalog names, **DT** prices, and promo codes intact.`
      : `LANGUAGE REQUIREMENT: Respond in crisp, high-fashion editorial English.`;

  if (!isAdminStudio && isCasualGreetingQuery(query)) {
    subgraph.recommendedProducts = [];
  }

  const storefrontClientPersona = `You are the Personal Stylist & Boutique Client Advisor for ${brandLabel} Tunisia. Speak naturally like an attentive, refined in-store fashion advisor welcoming a VIP shopper.`;

  const systemPrompt = isAdminStudio
    ? `${cfg.systemPersona}
BRAND NAME: ${brandLabel}
${languageRule}
CHANNEL: ${channelRoleDesc}
CHIC EDITORIAL FORMATTING RULES:
1. Ground every fact ONLY in the retrieved ${brandLabel} Knowledge Graph context below. Never invent prices or codes.
2. Make every reply **minimalist, chic, high-fashion editorial**, never wordy or cluttered:
   - **NEVER output Markdown tables** (\`| ... |\`).
   - **DO NOT dump raw fabric percentages, long color lists, stitch descriptions, or stock details** unless specifically asked.
   - Start with 1 sleek header like \`### ✨ Curated Selection\` (or translated equivalent in the user's language) followed by 2 to 4 concise bullets ONLY:
     \`- **PIECE NAME** — **299 DT** · Short 4-word style note\`
   - Put key piece names, **exact DT prices**, **promo codes**, and key KPIs in **bold** (\`**...**\`).
   - End with 1 short chic callout \`> 💡 Strategy: ...\` (e.g. **KRONOS15**, **300 DT+** free Tunisia delivery, or **3D Fitting Lab**).
3. ${genderPromptRule}
4. Keep casual greetings ("hi", "bonjour", "مرحبا") to 1–2 crisp warm sentences without listing products unless asked.

${subgraph.formattedContext}`
    : `${storefrontClientPersona}
BRAND NAME: ${brandLabel}
${languageRule}
CLIENT CONCIERGE STRATEGY & PRIVACY:
1. Ground every garment name, price in **DT**, promo code, and boutique detail strictly in the catalog context below. Never invent details.
2. STRICT PRIVACY & JARGON BAN: You are talking directly to a shopper. NEVER mention **AI**, **Groq**, **Supabase**, **Graph RAG**, **Knowledge Graph**, **nodes**, **database**, **model**, or the label **Strategy:** / **💡 Strategy:**. Never disclose revenue, stock quantities, or total store orders.
3. ADAPTIVE CLIENT ANSWERING METHOD (choose naturally by what the shopper asked):
   - **Casual Greeting** ("hi", "bonjour", "salut", "مرحبا", "سلام"): Reply in 1–2 warm, stylish boutique sentences welcoming them to **${brandLabel}** and asking what occasion, mood, or look (**MEN** or **WOMEN**) they are shopping for. NO headings, NO product lists.
   - **Catalog Totals / Categories / Price Range** ("how many clothes", "men vs women count", "what categories", "cheapest"): Answer IMMEDIATELY with the exact numbers from \`AUTHORITATIVE STOREWIDE CATALOG BREAKDOWN\` below (**total pieces**, **MEN count**, **WOMEN count**, categories, price range). NEVER count sampled lines below instead of the storewide totals.
   - **Outfit / Styling / Product Inquiry**: Open with 1 tailored styling sentence explaining silhouette balance or fabric contrast, then highlight **2 to 3 matching garments** as crisp bullets: \`- **PIECE NAME** — **299 DT** · concise styling & pairing tip\`. End naturally with 1 gentle shopper tip when relevant (e.g., trying proportions in the **3D Fitting Lab**, **24–48h Tunisia express delivery** complimentary over **300 DT**, or applying **KRONOS15**).
   - **Delivery / Sizing / Promo / Store Inquiry**: Lead immediately with the direct, reassuring answer (**exact DT prices**, **promo codes**, Tunisia store addresses, or shipping timelines), keeping total response under 95 words and NEVER using Markdown tables.
4. ${genderPromptRule}

${subgraph.formattedContext}`;

  const recentHistory = (history || [])
    .slice(-8)
    .map((m) => {
      const role = m.sender === 'user' || m.role === 'user' ? 'user' : 'assistant';
      const raw = String(m.text || m.content || '').slice(0, 600);
      return {
        role,
        content: !isAdminStudio && role === 'assistant' ? sanitizeStorefrontAnswer(raw) : raw
      };
    })
    .filter((m) => m.content);

  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: query }
  ];

  const primaryModel = overrideModel || cfg.model || 'openai/gpt-oss-120b';
  const candidateModels = Array.from(
    new Set([primaryModel, 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'allam-2-7b'])
  );

  let llmResult = null;
  let engineMode = pgvectorRpcActive ? 'groq+pgvector+graph-rag' : 'groq+vector+graph-rag';
  let llmError = '';

  if (cfg.apiKey && cfg.apiKey.trim()) {
    for (const model of candidateModels) {
      try {
        llmResult = await callGroqChatCompletion({
          apiKey: cfg.apiKey.trim(),
          model,
          messages: chatMessages,
          temperature: cfg.temperature,
          maxTokens: cfg.maxTokens
        });
        break;
      } catch (err) {
        llmError = err?.message || 'Groq request failed';
        console.warn(`[Groq Failover] ${model} failed:`, llmError);
      }
    }
  } else {
    llmError = 'No Groq API key configured';
  }

  if (!llmResult) {
    engineMode = pgvectorRpcActive ? 'pgvector+local-fallback' : 'local-vector-graph-fallback';
    llmResult = {
      answer: buildLocalFallbackAnswer(query, subgraph, effectiveStoreData, {
        channel,
        language: resolvedLang,
        liveStats
      }),
      reasoningTrace: `Fallback triggered: ${llmError}`,
      modelUsed: primaryModel,
      latencyMs: 12,
      promptTokens: 0,
      completionTokens: 0
    };
  }

  if (!isAdminStudio) {
    llmResult.answer = sanitizeStorefrontAnswer(llmResult.answer);
  }

  // Persist every answered question into Supabase + local cache
  const matchedNodeIds = subgraph.rankedNodes.map((n) => n.id);
  const recommendedIds = subgraph.recommendedProducts.map((p) => p.id);

  let loggedId = `rag-local-${Date.now()}`;
  let loggedInCloud = false;
  let createdAt = new Date().toISOString();

  if (sb) {
    try {
      const { data: logRes, error: logErr } = await sb.rpc('log_rag_interaction', {
        p_session_id: sessionId,
        p_channel: channel,
        p_user_question: query,
        p_assistant_answer: llmResult.answer,
        p_groq_model: llmResult.modelUsed,
        p_engine_mode: engineMode,
        p_matched_node_ids: matchedNodeIds,
        p_traversal_paths: subgraph.traversalPaths,
        p_recommended_product_ids: recommendedIds,
        p_reasoning_trace: llmResult.reasoningTrace || '',
        p_latency_ms: llmResult.latencyMs,
        p_prompt_tokens: llmResult.promptTokens,
        p_completion_tokens: llmResult.completionTokens
      });
      if (!logErr && Array.isArray(logRes) && logRes[0]) {
        loggedId = logRes[0].id;
        createdAt = logRes[0].created_at;
        loggedInCloud = true;
      }
    } catch (err) {
      console.warn('[Supabase Graph RAG] log_rag_interaction skipped:', err?.message);
    }
  }

  const localLogRow = {
    id: loggedId,
    session_id: sessionId,
    channel,
    user_question: query,
    assistant_answer: llmResult.answer,
    groq_model: llmResult.modelUsed,
    engine_mode: engineMode,
    matched_node_ids: matchedNodeIds,
    traversal_paths: subgraph.traversalPaths,
    recommended_product_ids: recommendedIds,
    reasoning_trace: llmResult.reasoningTrace,
    latency_ms: llmResult.latencyMs,
    prompt_tokens: llmResult.promptTokens,
    completion_tokens: llmResult.completionTokens,
    feedback_rating: 0,
    cloud_logged: loggedInCloud,
    created_at: createdAt
  };

  const prevLogs = safeReadJson(RAG_LOGS_STORAGE_KEY, []) || [];
  safeWriteJson(RAG_LOGS_STORAGE_KEY, [localLogRow, ...prevLogs.slice(0, 99)]);

  const finalWorkflowStages = buildWorkflowTelemetry({
    query,
    mode: channel,
    targetGender,
    seedCount: subgraph.seedIds.length,
    totalNodes: subgraph.rankedNodes.length,
    edgeCount: subgraph.activeEdgeIds.length,
    latencyMs: llmResult.latencyMs,
    topRrfScore: subgraph.topRrfScore || 0
  });

  return {
    logId: loggedId,
    loggedInCloud,
    answer: llmResult.answer,
    reasoningTrace: llmResult.reasoningTrace,
    modelUsed: llmResult.modelUsed,
    engineMode,
    llmError,
    latencyMs: llmResult.latencyMs,
    promptTokens: llmResult.promptTokens,
    completionTokens: llmResult.completionTokens,
    pgvectorActive: pgvectorRpcActive,
    graph: effectiveGraph,
    subgraph: {
      ...subgraph,
      workflowStages: finalWorkflowStages
    }
  };
}

/* ── Supabase CRUD for Graph Nodes, Documents, Sync & Q&A Telemetry Logs ──── */

async function getSessionOrNull(sb) {
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}

export function getLocalRagDocuments() {
  const saved = safeReadJson(RAG_DOCS_STORAGE_KEY, null);
  return Array.isArray(saved) ? saved : [];
}

export async function fetchRagDocuments() {
  const local = getLocalRagDocuments();
  const sb = getSupabase();
  if (!sb) return local;
  try {
    const { data, error } = await sb
      .from('rag_documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      safeWriteJson(RAG_DOCS_STORAGE_KEY, data);
      return data;
    }
  } catch {
    // table may not exist yet before 04_graph_rag.sql is executed
  }
  return local;
}

export async function upsertRagDocument(doc) {
  const clean = {
    id: doc.id && !String(doc.id).startsWith('local-') ? doc.id : undefined,
    title: String(doc.title || 'Untitled KRONOS Knowledge Doc').trim(),
    doc_type: doc.doc_type || 'knowledge',
    content: String(doc.content || '').trim(),
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    linked_node_id: doc.linked_node_id || 'brand:kronos',
    is_active: doc.is_active !== false
  };

  const sb = getSupabase();
  if (sb) {
    const session = await getSessionOrNull(sb);
    if (session) {
      try {
        const { data, error } = await sb
          .from('rag_documents')
          .upsert(clean)
          .select('*')
          .single();
        if (!error && data) {
          const prev = getLocalRagDocuments().filter((d) => d.id !== data.id);
          const next = [data, ...prev];
          safeWriteJson(RAG_DOCS_STORAGE_KEY, next);
          return { ok: true, cloud: true, documents: next };
        }
        return { ok: false, cloud: false, error: error?.message || 'Supabase doc upsert failed', documents: getLocalRagDocuments() };
      } catch (err) {
        return { ok: false, cloud: false, error: err?.message, documents: getLocalRagDocuments() };
      }
    }
  }

  const localDoc = {
    ...clean,
    id: doc.id || `local-doc-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  const next = [localDoc, ...getLocalRagDocuments().filter((d) => d.id !== localDoc.id)];
  safeWriteJson(RAG_DOCS_STORAGE_KEY, next);
  return { ok: true, cloud: false, authRequired: Boolean(sb), documents: next };
}

export async function deleteRagDocument(doc) {
  const next = getLocalRagDocuments().filter((d) => d.id !== doc.id);
  safeWriteJson(RAG_DOCS_STORAGE_KEY, next);

  const sb = getSupabase();
  if (sb && doc?.id && !String(doc.id).startsWith('local-')) {
    const session = await getSessionOrNull(sb);
    if (session) {
      await sb.from('rag_documents').delete().eq('id', doc.id);
    }
  }
  return next;
}

export async function syncGraphToSupabase(storeData = {}, customDocs = [], promos = []) {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Supabase not configured' };
  const session = await getSessionOrNull(sb);
  if (!session) {
    window.dispatchEvent(
      new CustomEvent('kronos:require-admin-auth', {
        detail: 'Sign in with montassarzarai0@gmail.com to sync Graph RAG nodes & edges to Supabase.'
      })
    );
    return { ok: false, authRequired: true, error: 'Sign in required' };
  }

  const graph = buildKronosKnowledgeGraph(storeData, customDocs, promos);

  const nodeRows = graph.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    node_type: n.node_type,
    summary: n.summary || '',
    properties: n.properties || {},
    search_text: n.search_text || '',
    weight: Number(n.weight || 1.0),
    is_active: true,
    embedding: formatPgVectorLiteral(
      n.embedding || computeSemanticEmbedding384(`${n.label} ${n.summary || ''} ${n.search_text || ''}`)
    )
  }));

  const edgeRows = graph.edges.map((e) => ({
    id: e.id,
    source_id: e.source_id,
    target_id: e.target_id,
    relation: e.relation,
    weight: Number(e.weight || 1.0),
    evidence: e.evidence || '',
    is_active: true
  }));

  try {
    let vectorSynced = true;
    // Upsert nodes in chunks of 80 (with 384-dim pgvector embedding; gracefully fall back if schema 06 not yet applied)
    for (let i = 0; i < nodeRows.length; i += 80) {
      const batch = nodeRows.slice(i, i + 80);
      const { error } = await sb.from('rag_nodes').upsert(batch, { onConflict: 'id' });
      if (error) {
        if (/embedding/i.test(error.message || '')) {
          vectorSynced = false;
          const legacyBatch = batch.map(({ embedding: _drop, ...rest }) => rest);
          const { error: legacyErr } = await sb.from('rag_nodes').upsert(legacyBatch, { onConflict: 'id' });
          if (legacyErr) return { ok: false, error: `rag_nodes sync failed: ${legacyErr.message}` };
        } else {
          return { ok: false, error: `rag_nodes sync failed: ${error.message}` };
        }
      }
    }
    for (let i = 0; i < edgeRows.length; i += 150) {
      const { error } = await sb.from('rag_edges').upsert(edgeRows.slice(i, i + 150), { onConflict: 'id' });
      if (error) return { ok: false, error: `rag_edges sync failed: ${error.message}` };
    }
    return { ok: true, vectorSynced, nodeCount: nodeRows.length, edgeCount: edgeRows.length };
  } catch (err) {
    return { ok: false, error: err?.message || 'Graph sync exception' };
  }
}

export async function fetchRagQaLogs() {
  const local = safeReadJson(RAG_LOGS_STORAGE_KEY, []) || [];
  const sb = getSupabase();
  if (!sb) return local;
  const session = await getSessionOrNull(sb);
  if (!session) return local;
  try {
    const { data, error } = await sb
      .from('rag_qa_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && Array.isArray(data)) {
      safeWriteJson(RAG_LOGS_STORAGE_KEY, data);
      return data;
    }
  } catch {
    // fallback to local logs
  }
  return local;
}

export async function deleteRagQaLog(logId) {
  const local = (safeReadJson(RAG_LOGS_STORAGE_KEY, []) || []).filter((r) => r.id !== logId);
  safeWriteJson(RAG_LOGS_STORAGE_KEY, local);
  const sb = getSupabase();
  if (sb && logId && !String(logId).startsWith('rag-local-')) {
    const session = await getSessionOrNull(sb);
    if (session) {
      await sb.from('rag_qa_logs').delete().eq('id', logId);
    }
  }
  return local;
}

export async function submitRagFeedback(logId, rating) {
  const local = (safeReadJson(RAG_LOGS_STORAGE_KEY, []) || []).map((r) =>
    r.id === logId ? { ...r, feedback_rating: rating } : r
  );
  safeWriteJson(RAG_LOGS_STORAGE_KEY, local);

  const sb = getSupabase();
  if (sb && logId && !String(logId).startsWith('rag-local-')) {
    try {
      await sb.rpc('submit_rag_feedback', { p_log_id: logId, p_rating: rating });
    } catch {
      // ignore if schema not yet applied
    }
  }
}

export async function checkGraphRagTablesStatus() {
  const sb = getSupabase();
  if (!sb) return { configured: false, tablesReady: false, pgvectorReady: false };
  try {
    const [{ count, error }, vecProbe] = await Promise.all([
      sb.from('rag_nodes').select('id', { count: 'exact', head: true }),
      sb.rpc('query_kronos_pgvector_graph_rag', {
        p_query: 'jacket',
        p_query_embedding: null,
        p_limit: 2
      })
    ]);
    if (error) {
      return { configured: true, tablesReady: false, pgvectorReady: false, error: error.message };
    }
    const pgvectorReady = !vecProbe?.error;
    return {
      configured: true,
      tablesReady: true,
      pgvectorReady,
      cloudNodeCount: count || 0,
      pgvectorError: vecProbe?.error?.message || ''
    };
  } catch (err) {
    return { configured: true, tablesReady: false, pgvectorReady: false, error: err?.message };
  }
}

/* ── End-to-End Graph RAG Verification Suite (For Admin Proof) ─────────────── */

export async function runGraphRagDiagnostics({
  storeData = {},
  customDocs = [],
  promos = [],
  orders = [],
  mediaAssets = [],
  subscribers = [],
  qaLogs = []
} = {}) {
  const t0 = performance.now();
  const checks = [];
  const cfg = getGroqConfig();

  // 1. Knowledge Graph Topology Check
  const graph = buildKronosKnowledgeGraph(storeData, customDocs, promos, { includeInternalStock: true });
  const hasProducts = graph.nodes.some((n) => n.node_type === 'product');
  const hasPairings = graph.edges.some((e) => e.relation === 'PAIRS_WELL_WITH');
  checks.push({
    id: 'topology',
    name: 'Knowledge Graph Compilation',
    ok: graph.nodes.length >= 10 && graph.edges.length >= 10 && hasProducts && hasPairings,
    detail: `${graph.nodes.length} nodes · ${graph.edges.length} edges (incl. PAIRS_WELL_WITH)`
  });

  // 2. 2-Hop Traversal Check
  const hopSubgraph = retrieveGraphRagSubgraph({
    query: 'Recommend a MEN jacket paired with jeans under 550 DT',
    graph,
    storeData,
    channel: 'storefront'
  });
  const maxHop = hopSubgraph.rankedNodes.reduce((m, n) => Math.max(m, n.hop || 0), 0);
  checks.push({
    id: 'multihop',
    name: '2-Hop BFS Graph Traversal',
    ok: hopSubgraph.rankedNodes.length >= 4 && maxHop >= 1 && hopSubgraph.traversalPaths.length >= 1,
    detail: `Seeds=${hopSubgraph.seedIds.length} · Ranked=${hopSubgraph.rankedNodes.length} · MaxHop=${maxHop} · Paths=${hopSubgraph.traversalPaths.length}`
  });

  // 3. Storefront Privacy Shield Check
  const probeFinancial = isStorefrontRestrictedQuery('How much money font and how many commandes total?');
  const probeLegit = isStorefrontRestrictedQuery('Show me a black oversized jacket under 300 DT');
  const storefrontSub = retrieveGraphRagSubgraph({
    query: 'Recommend black jacket',
    graph: buildKronosKnowledgeGraph(storeData, customDocs, promos, { includeInternalStock: false }),
    storeData,
    orders,
    channel: 'storefront'
  });
  const leaksFinancials = /ADMIN LIVE METRICS|ADMIN FULL PROJECT DOSSIER|Gross Merchandise Volume|Stock:/i.test(
    storefrontSub.formattedContext
  );
  checks.push({
    id: 'privacy',
    name: 'Storefront Client Privacy Shield',
    ok: probeFinancial && !probeLegit && !leaksFinancials,
    detail:
      probeFinancial && !leaksFinancials
        ? 'Blocked money/commandes probes · Zero admin leak in storefront context'
        : 'Privacy isolation warning detected'
  });

  // 4. Admin Full-Project Dossier Check
  const adminSub = retrieveGraphRagSubgraph({
    query: 'Give revenue, commandes count, and media vault summary',
    graph,
    storeData,
    orders,
    channel: 'admin_studio',
    adminProjectData: { orders, mediaAssets, subscribers, promos, customDocs, qaLogs }
  });
  const hasDossier = adminSub.formattedContext.includes('ADMIN FULL PROJECT DOSSIER');
  checks.push({
    id: 'admin_dossier',
    name: 'Admin Full-Project Intelligence',
    ok: hasDossier,
    detail: hasDossier
      ? `Full dossier injected (${orders.length} orders · ${mediaAssets.length} media · ${subscribers.length} subscribers)`
      : 'Admin dossier missing'
  });

  // 5. Supabase Live pgvector HNSW + Graph Tables + Catalog Stats RPC Check
  let supaDetail = 'Supabase not configured';
  let supaOk = false;
  const sb = getSupabase();
  if (sb) {
    const status = await checkGraphRagTablesStatus();
    if (status.tablesReady) {
      const probeVec = formatPgVectorLiteral(computeSemanticEmbedding384('men leather jacket'));
      const [pgVecRes, legacyRes, statsRes] = await Promise.all([
        sb.rpc('query_kronos_pgvector_graph_rag', {
          p_query: 'men leather jacket',
          p_query_embedding: probeVec,
          p_limit: 5,
          p_gender: 'MEN'
        }),
        sb.rpc('query_kronos_graph_rag', { p_query: 'jacket', p_limit: 5 }),
        sb.rpc('get_kronos_catalog_stats')
      ]);

      const hasPgVec = !pgVecRes.error && Array.isArray(pgVecRes.data);
      const hasLegacyRpc = !legacyRes.error;
      const statsTotal = statsRes?.data?.total_products ?? '?';
      supaOk = hasPgVec && status.cloudNodeCount >= 20;
      if (hasPgVec && status.cloudNodeCount >= 20) {
        supaDetail = `pgvector HNSW active (${status.cloudNodeCount} Postgres nodes · ${pgVecRes.data.length} semantic hits · Catalog Stats=${statsTotal})`;
      } else if (!hasPgVec) {
        supaDetail = `Cloud nodes=${status.cloudNodeCount} · Run supabase/06_pgvector_hybrid_graph_rag.sql (${pgVecRes.error?.message || 'pgvector RPC missing'})`;
      } else {
        supaDetail = `pgvector RPC=${hasPgVec ? 'OK' : 'err'} · Legacy RPC=${hasLegacyRpc ? 'OK' : legacyRes.error?.message} · Nodes=${status.cloudNodeCount} (click Sync Graph)`;
      }
    } else {
      supaDetail = `Tables check failed: ${status.error || 'run 06_pgvector_hybrid_graph_rag.sql'}`;
    }
  }
  checks.push({
    id: 'supabase',
    name: 'Supabase pgvector HNSW & Graph RPC',
    ok: supaOk,
    detail: supaDetail
  });

  // 6. Live Groq LPU API Inference Check
  let groqOk = false;
  let groqDetail = 'No Groq API key';
  if (cfg.apiKey && cfg.apiKey.trim()) {
    try {
      const livePing = await callGroqChatCompletion({
        apiKey: cfg.apiKey.trim(),
        model: cfg.model || 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: 'Reply with two words: GRAPH READY' },
          { role: 'user', content: 'ping' }
        ],
        temperature: 0.1,
        maxTokens: 60
      });
      groqOk = Boolean(livePing.answer);
      groqDetail = `${livePing.modelUsed} responded in ${livePing.latencyMs}ms`;
    } catch (err) {
      groqDetail = err?.message || 'Groq inference error';
    }
  }
  checks.push({
    id: 'groq',
    name: 'Groq Free Model Live Inference',
    ok: groqOk,
    detail: groqDetail
  });

  // 7. Strict MEN vs WOMEN Outfit Isolation Check
  const menSub = retrieveGraphRagSubgraph({
    query: 'give me men outfit items',
    graph,
    storeData,
    channel: 'storefront'
  });
  const womenSub = retrieveGraphRagSubgraph({
    query: 'give me women outfit items',
    graph,
    storeData,
    channel: 'storefront'
  });
  const greetSub = retrieveGraphRagSubgraph({
    query: 'hi',
    graph,
    storeData,
    channel: 'storefront'
  });
  const menPure =
    menSub.recommendedProducts.length > 0 &&
    menSub.recommendedProducts.every((p) => (p.gender || '').toUpperCase() === 'MEN');
  const womenPure =
    womenSub.recommendedProducts.length > 0 &&
    womenSub.recommendedProducts.every((p) => (p.gender || '').toUpperCase() === 'WOMEN');
  const greetingClean = greetSub.recommendedProducts.length === 0;
  checks.push({
    id: 'gender_isolation',
    name: 'Strict MEN / WOMEN Gender Isolation',
    ok: menPure && womenPure && greetingClean,
    detail:
      menPure && womenPure && greetingClean
        ? `MEN=${menSub.recommendedProducts.length} pure MEN · WOMEN=${womenSub.recommendedProducts.length} pure WOMEN · Greeting=0 mixed cards`
        : `Isolation issue (menPure=${menPure}, womenPure=${womenPure}, greetEmpty=${greetingClean})`
  });

  return {
    passed: checks.filter((c) => c.ok).length,
    total: checks.length,
    durationMs: Math.round(performance.now() - t0),
    checks
  };
}

