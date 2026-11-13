/**
 * semanticVectorEngine.js
 * Deterministic 384-dimensional multilingual semantic + subword embedding engine (EN / FR / AR)
 * Mirrored in Postgres (`public.kronos_semantic_embed`) for native Supabase pgvector (<=> HNSW) retrieval.
 */

export const VECTOR_DIMS = 384;
const CONCEPT_DIMS = 64;
const HASH_DIMS = VECTOR_DIMS - CONCEPT_DIMS; // 320 dims (indices 64..383)

// Shared semantic concept bands aligned across English, French, and Arabic fashion terminology
const SEMANTIC_CONCEPTS = [
  { dim: 0, re: /\b(jacket|jackets|bomber|coat|trench|blazer|blouson|veste|manteau|parka)\b|(جاكيت|سترة|معطف|بليزر)/i, w: 2.2 },
  { dim: 1, re: /\b(leather|suede|faux|nappa|cuir|daim)\b|(جلد|شامواه)/i, w: 2.2 },
  { dim: 2, re: /\b(jeans|denim|baggy|wide|slim|flared|relaxed|straight|cargo|trousers|pants|pantalon)\b|(جينز|دجينز|بنطلون|سروال|كارجو)/i, w: 2.2 },
  { dim: 3, re: /\b(overshirt|shirt|tee|top|blouse|chemise|surchemise|tshirt)\b|(قميص|بلوزة|تيشيرت)/i, w: 2.0 },
  { dim: 4, re: /\b(knit|knitwear|jumper|sweater|cardigan|pull|maille|hoodie|sweat|sweatshirt|fleece)\b|(كنزة|صوف|هودي|تريكو)/i, w: 2.0 },
  { dim: 5, re: /\b(shoe|shoes|boot|boots|loafer|loafers|flats|ballet|sneaker|chaussure|mocassin|bottes)\b|(حذاء|أحذية|بوت)/i, w: 2.1 },
  { dim: 6, re: /\b(bag|bags|handbag|crossbody|tote|backpack|wallet|accessory|sac|sacoche|pochette)\b|(حقيبة|شنطة|اكسسوار)/i, w: 2.0 },
  { dim: 7, re: /\b(men|mens|man|male|homme|hommes|guy|guys)\b|(رجال|رجالي|رجالية|رجل)/i, w: 2.6 },
  { dim: 8, re: /\b(women|womens|woman|female|femme|femmes|lady|ladies)\b|(نساء|نسائي|نسائية|امرأة)/i, w: 2.6 },
  { dim: 9, re: /\b(outfit|outfits|look|looks|styling|pair|pairing|combo|ensemble|tenue|assortir)\b|(إطلالة|طقم|تنسيق|ملابس)/i, w: 2.0 },
  { dim: 10, re: /\b(promo|discount|code|coupon|sale|offer|off|réduction|reduction|soldes)\b|(خصم|تخفيض|كود)/i, w: 2.2 },
  { dim: 11, re: /\b(ship|shipping|deliver|delivery|express|courier|free|livraison|gratuite|offerte)\b|(شحن|توصيل|مجاني|سريع)/i, w: 2.2 },
  { dim: 12, re: /\b(tunis|tunisia|sousse|sfax|tunisie|store|stores|shop|address|hours|boutique)\b|(تونس|سوسة|صفاقس|متجر|فرع|عنوان)/i, w: 2.1 },
  { dim: 13, re: /\b(3d|fit|fitting|size|sizing|virtual|mannequin|try|measurements|taille|coupe|essayage|mesure)\b|(قياس|مقاس|مختبر)/i, w: 2.1 },
  { dim: 14, re: /\b(return|returns|refund|exchange|warranty|authenticity|nfc|retour|échange|remboursement)\b|(استرجاع|استبدال|إرجاع|أصلي)/i, w: 2.0 },
  { dim: 15, re: /\b(black|noir|dark|charcoal|ebony|أسود|داكن)/i, w: 1.7 },
  { dim: 16, re: /\b(white|cream|ivory|ecru|beige|tan|khaki|sand|camel|أبيض|بيج|كريمي|جملي)/i, w: 1.7 },
  { dim: 17, re: /\b(blue|navy|indigo|sky|cobalt|أزرق|كحلي)/i, w: 1.7 },
  { dim: 18, re: /\b(brown|chocolate|espresso|rust|burgundy|olive|green|بني|أخضر|زيتي)/i, w: 1.7 },
  { dim: 19, re: /\b(cotton|wool|denim|nylon|viscose|fabric|material|matière|coton|laine)\b|(قطن|قماش|خامة)/i, w: 1.7 },
  { dim: 20, re: /\b(drop|capsule|nova|vero|luna|limited|edition|new|collection|nouveauté)\b|(إصدار|مجموعة|جديد)/i, w: 1.8 },
  { dim: 21, re: /\b(how many|count|total|all|catalog|catalogue|items|pieces|clothes|combien|nombre|tout)\b|(كم|عدد|إجمالي|كل|قطع)/i, w: 2.1 },
  { dim: 22, re: /\b(price|cost|budget|cheap|affordable|under|below|expensive|lux|prix|coût|moins de|dt|tnd)\b|(سعر|ثمن|تكلفة|أرخص|دينار)/i, w: 1.9 },
  { dim: 23, re: /\b(order|orders|track|tracking|status|krn|commande|suivi)\b|(طلب|تتبع|شحنة)/i, w: 2.0 }
];

function stableTokenHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33 + str.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

/**
 * Generates an L2-normalized 384-dimensional float array for semantic cosine retrieval.
 */
export function computeSemanticEmbedding384(text = '') {
  const vec = new Float32Array(VECTOR_DIMS);
  const raw = String(text || '').toLowerCase().trim();
  if (!raw) {
    vec[0] = 1;
    return Array.from(vec);
  }

  // Band 1: Multilingual semantic fashion concepts (dims 0..63)
  SEMANTIC_CONCEPTS.forEach((c) => {
    if (c.re.test(raw)) {
      vec[c.dim] += c.w;
      vec[c.dim + 24] += c.w * 0.65;
    }
  });

  // Band 2: Signed feature-hashed tokens + char 3-grams (dims 64..383)
  const words = raw
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  for (const w of words) {
    const h = stableTokenHash(`w:${w}`);
    const bucket = CONCEPT_DIMS + (h % HASH_DIMS);
    const sign = h % 2 === 0 ? 1 : -1;
    vec[bucket] += sign * (w.length >= 5 ? 1.2 : 0.85);

    if (w.length >= 4) {
      for (let i = 0; i <= w.length - 3; i += 1) {
        const tri = w.slice(i, i + 3);
        const th = stableTokenHash(`g:${tri}`);
        const tBucket = CONCEPT_DIMS + (th % HASH_DIMS);
        const tSign = th % 2 === 0 ? 1 : -1;
        vec[tBucket] += tSign * 0.35;
      }
    }
  }

  // L2 normalize onto unit sphere
  let normSq = 0;
  for (let i = 0; i < VECTOR_DIMS; i += 1) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq) || 1;
  const out = new Array(VECTOR_DIMS);
  for (let i = 0; i < VECTOR_DIMS; i += 1) {
    out[i] = Number((vec[i] / norm).toFixed(6));
  }
  return out;
}

export function cosineSimilarity384(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += (a[i] || 0) * (b[i] || 0);
  }
  return dot;
}

export function formatPgVectorLiteral(vec = []) {
  return `[${vec.join(',')}]`;
}
