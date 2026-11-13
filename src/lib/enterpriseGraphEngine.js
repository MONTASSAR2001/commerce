/**
 * Enterprise Graph RAG Mathematical Engine (Ported & Extended from Enterprise GraphRAG Studio)
 * Provides real graph topology analytics, Okapi BM25 scoring, and Reciprocal Rank Fusion (RRF k=60):
 *  - Degree Centrality & Closeness Centrality
 *  - 10-Iteration Power-Iteration PageRank (d = 0.85)
 *  - Brandes Exact Betweenness Centrality
 *  - Disjoint-Set (Union-Find) Community Detection
 *  - Okapi BM25 + Multi-Source Reciprocal Rank Fusion (BM25 + Semantic Hub + Graph PageRank)
 */

export const CATEGORICAL_PALETTE = [
  '#4f46e5', // indigo-600
  '#0d9488', // teal-600
  '#e11d48', // rose-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#0284c7', // sky-600
  '#059669', // emerald-600
  '#c026d3', // fuchsia-600
  '#2563eb', // blue-600
  '#ea580c', // orange-600
  '#65a30d', // lime-600
  '#db2777'  // pink-600
];

const ENTITY_TYPE_BASE_COLORS = {
  brand: '#0f172a',
  collection: '#7c3aed',
  category: '#e11d48',
  product: '#4f46e5',
  color: '#d97706',
  material: '#0d9488',
  promo: '#059669',
  store: '#0284c7',
  faq: '#64748b',
  policy: '#475569',
  outfit: '#9333ea',
  document: '#0369a1'
};

export function normalizeDomain(node) {
  const type = String(node.type || 'entity').toLowerCase();
  if (type === 'product' || type === 'collection' || type === 'category' || type === 'outfit') {
    return 'Apparel & Merchandising';
  }
  if (type === 'material' || type === 'color') {
    return 'Design & Fabrication';
  }
  if (type === 'promo' || type === 'policy') {
    return 'Growth, Pricing & Ops';
  }
  if (type === 'store' || type === 'faq' || type === 'document') {
    return 'Customer & Omnichannel';
  }
  return 'Core Brand Intelligence';
}

/**
 * Computes structural graph metrics, Union-Find communities, dynamic clustering colors,
 * and normalized node radii for 2D/3D Enterprise Knowledge Graph visualization & ranking.
 */
export function computeGraphMetrics(
  rawNodes = [],
  rawEdges = [],
  clusteringMode = 'Type',
  metricMode = 'Centrality'
) {
  const n = rawNodes.length;
  if (n === 0) {
    return {
      nodes: [],
      edges: [],
      nodeMap: new Map(),
      summary: {
        nodeCount: 0,
        edgeCount: 0,
        communityCount: 0,
        topPagerankLabel: 'N/A',
        topBetweennessLabel: 'N/A',
        density: 0
      }
    };
  }

  const adj = new Map();
  const idToIndex = new Map();
  rawNodes.forEach((node, idx) => {
    idToIndex.set(node.id, idx);
    adj.set(node.id, new Set());
  });

  const validEdges = [];
  rawEdges.forEach((e) => {
    if (idToIndex.has(e.source) && idToIndex.has(e.target) && e.source !== e.target) {
      adj.get(e.source).add(e.target);
      adj.get(e.target).add(e.source);
      validEdges.push(e);
    }
  });

  // 1. Degree
  const degree = new Map();
  rawNodes.forEach((node) => degree.set(node.id, adj.get(node.id)?.size || 0));

  // 2. 10-Iteration PageRank (d = 0.85)
  let pr = new Map();
  const initVal = 1 / n;
  rawNodes.forEach((node) => pr.set(node.id, initVal));

  const d = 0.85;
  for (let iter = 0; iter < 10; iter += 1) {
    const nextPr = new Map();
    let danglingSum = 0;
    rawNodes.forEach((node) => {
      if ((degree.get(node.id) || 0) === 0) {
        danglingSum += pr.get(node.id) || 0;
      }
    });

    rawNodes.forEach((node) => {
      let sum = 0;
      const neighbors = adj.get(node.id);
      if (neighbors) {
        neighbors.forEach((nbr) => {
          const deg = degree.get(nbr) || 1;
          sum += (pr.get(nbr) || 0) / deg;
        });
      }
      const val = (1 - d) / n + d * (sum + danglingSum / n);
      nextPr.set(node.id, val);
    });
    pr = nextPr;
  }

  // 3. Brandes Exact Betweenness & Closeness Centrality
  const betweenness = new Map();
  const closeness = new Map();
  rawNodes.forEach((node) => {
    betweenness.set(node.id, 0);
    closeness.set(node.id, 0);
  });

  rawNodes.forEach((s) => {
    const S = [];
    const P = new Map();
    const sigma = new Map();
    const dist = new Map();

    rawNodes.forEach((v) => {
      P.set(v.id, []);
      sigma.set(v.id, 0);
      dist.set(v.id, -1);
    });

    sigma.set(s.id, 1);
    dist.set(s.id, 0);
    const Q = [s.id];

    while (Q.length > 0) {
      const v = Q.shift();
      S.push(v);
      const vDist = dist.get(v);
      const neighbors = adj.get(v);
      if (neighbors) {
        neighbors.forEach((w) => {
          if (dist.get(w) === -1) {
            Q.push(w);
            dist.set(w, vDist + 1);
          }
          if (dist.get(w) === vDist + 1) {
            sigma.set(w, (sigma.get(w) || 0) + (sigma.get(v) || 0));
            P.get(w).push(v);
          }
        });
      }
    }

    let distSum = 0;
    let reachableCount = 0;
    dist.forEach((dv) => {
      if (dv > 0) {
        distSum += dv;
        reachableCount += 1;
      }
    });
    if (distSum > 0 && reachableCount > 0) {
      closeness.set(s.id, reachableCount / distSum);
    }

    const delta = new Map();
    rawNodes.forEach((v) => delta.set(v.id, 0));

    while (S.length > 0) {
      const w = S.pop();
      const sigmaW = sigma.get(w) || 1;
      P.get(w).forEach((v) => {
        const sigmaV = sigma.get(v) || 1;
        const c = (sigmaV / sigmaW) * (1 + (delta.get(w) || 0));
        delta.set(v, (delta.get(v) || 0) + c);
      });
      if (w !== s.id) {
        betweenness.set(w, (betweenness.get(w) || 0) + (delta.get(w) || 0));
      }
    }
  });

  // 4. Union-Find Connected Components / Community Detection
  const parent = new Map();
  rawNodes.forEach((node) => parent.set(node.id, node.id));

  const find = (i) => {
    let curr = i;
    while (parent.get(curr) !== curr) {
      curr = parent.get(curr);
    }
    let node = i;
    while (node !== curr) {
      const nxt = parent.get(node);
      parent.set(node, curr);
      node = nxt;
    }
    return curr;
  };

  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  };

  validEdges.forEach((e) => union(e.source, e.target));

  // Also group high-modularity sub-communities by domain if entire graph is single component
  const communityRoots = new Map();
  let nextCommIdx = 0;
  const communityMap = new Map();
  rawNodes.forEach((node) => {
    const r = find(node.id);
    if (!communityRoots.has(r)) {
      communityRoots.set(r, nextCommIdx);
      nextCommIdx += 1;
    }
    communityMap.set(node.id, communityRoots.get(r));
  });

  // 5. Normalize max values
  let maxDeg = 1;
  let maxPr = 0.0001;
  let maxBet = 0.0001;
  let maxClose = 0.0001;

  rawNodes.forEach((node) => {
    const dVal = degree.get(node.id) || 0;
    const pVal = pr.get(node.id) || 0;
    const bVal = (betweenness.get(node.id) || 0) / 2;
    const cVal = closeness.get(node.id) || 0;
    if (dVal > maxDeg) maxDeg = dVal;
    if (pVal > maxPr) maxPr = pVal;
    if (bVal > maxBet) maxBet = bVal;
    if (cVal > maxClose) maxClose = cVal;
  });

  const typePalette = new Map();
  const domainPalette = new Map();
  let tIdx = 0;
  let domIdx = 0;

  let topPrNode = null;
  let topBetNode = null;
  let highestPr = -1;
  let highestBet = -1;

  const computedNodes = rawNodes.map((node) => {
    const deg = degree.get(node.id) || 0;
    const pVal = pr.get(node.id) || 0;
    const bVal = (betweenness.get(node.id) || 0) / 2;
    const cVal = closeness.get(node.id) || 0;
    const domain = normalizeDomain(node);
    const commId = communityMap.get(node.id) ?? 0;

    const normDeg = deg / maxDeg;
    const normPr = pVal / maxPr;
    const normBet = bVal / maxBet;
    const normClose = cVal / maxClose;

    const centrality = 0.4 * normDeg + 0.35 * normPr + 0.25 * normBet;

    let color = ENTITY_TYPE_BASE_COLORS[node.type] || '#4f46e5';
    if (clusteringMode === 'None') {
      color = '#4f46e5';
    } else if (clusteringMode === 'Type') {
      const key = String(node.type || 'entity').toLowerCase();
      if (!typePalette.has(key)) {
        typePalette.set(
          key,
          ENTITY_TYPE_BASE_COLORS[key] || CATEGORICAL_PALETTE[tIdx % CATEGORICAL_PALETTE.length]
        );
        tIdx += 1;
      }
      color = typePalette.get(key);
    } else if (clusteringMode === 'Community') {
      // Cluster visually by domain-community tuple when graph has 1 giant component
      const subCluster = commId === 0 ? domain : `comp_${commId}`;
      if (!domainPalette.has(subCluster)) {
        domainPalette.set(subCluster, CATEGORICAL_PALETTE[domIdx % CATEGORICAL_PALETTE.length]);
        domIdx += 1;
      }
      color = domainPalette.get(subCluster);
    } else if (clusteringMode === 'Domain') {
      if (!domainPalette.has(domain)) {
        domainPalette.set(domain, CATEGORICAL_PALETTE[domIdx % CATEGORICAL_PALETTE.length]);
        domIdx += 1;
      }
      color = domainPalette.get(domain);
    }

    let targetRatio = centrality;
    if (metricMode === 'Degree') targetRatio = normDeg;
    else if (metricMode === 'PageRank') targetRatio = normPr;
    else if (metricMode === 'Betweenness') targetRatio = normBet;
    else if (metricMode === 'Closeness') targetRatio = normClose;

    const radius = Math.round(13 + targetRatio * 20);

    const enriched = {
      ...node,
      domain,
      community: commId,
      degree: deg,
      pagerank: Number(pVal.toFixed(5)),
      betweenness: Number(bVal.toFixed(2)),
      closeness: Number(cVal.toFixed(4)),
      centrality: Number(centrality.toFixed(4)),
      radius,
      color
    };

    if (pVal > highestPr) {
      highestPr = pVal;
      topPrNode = enriched;
    }
    if (bVal > highestBet) {
      highestBet = bVal;
      topBetNode = enriched;
    }

    return enriched;
  });

  const nodeMap = new Map();
  computedNodes.forEach((cn) => nodeMap.set(cn.id, cn));

  const possibleEdges = (n * (n - 1)) / 2 || 1;
  return {
    nodes: computedNodes,
    edges: validEdges,
    nodeMap,
    summary: {
      nodeCount: n,
      edgeCount: validEdges.length,
      communityCount: Math.max(communityRoots.size, domainPalette.size || 1),
      topPagerankLabel: topPrNode ? `${topPrNode.label} (${topPrNode.pagerank.toFixed(3)})` : 'N/A',
      topBetweennessLabel: topBetNode ? `${topBetNode.label} (${topBetNode.betweenness})` : 'N/A',
      density: Number((validEdges.length / possibleEdges).toFixed(4))
    }
  };
}

/**
 * Okapi BM25 lexical relevance score for a single node document.
 */
export function computeBm25Score(queryTokens = [], docTokens = [], avgDocLen = 18, docFreqMap = null, totalDocs = 150) {
  if (!queryTokens.length || !docTokens.length) return 0;
  const k1 = 1.5;
  const b = 0.75;
  const dl = docTokens.length;
  const tfMap = new Map();
  docTokens.forEach((t) => tfMap.set(t, (tfMap.get(t) || 0) + 1));

  let score = 0;
  const seenQ = new Set();
  for (const term of queryTokens) {
    if (seenQ.has(term)) continue;
    seenQ.add(term);
    const tf = tfMap.get(term) || 0;
    if (tf === 0) continue;
    const df = docFreqMap ? (docFreqMap.get(term) || 1) : 1;
    const idf = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5));
    const num = tf * (k1 + 1);
    const den = tf + k1 * (1 - b + b * (dl / Math.max(1, avgDocLen)));
    score += idf * (num / den);
  }
  return score;
}

/**
 * Reciprocal Rank Fusion (RRF, k = 60) matching Enterprise GraphRAG Studio hybrid retriever.
 * Fuses independent ranked lists: [{ items: [{ id, ... }], weight: 1.0, name: 'bm25' }, ...]
 */
export function reciprocalRankFusion(rankedLists = [], k = 60) {
  const fused = new Map();
  rankedLists.forEach((list) => {
    const weight = Number(list.weight ?? 1.0);
    const listName = list.name || 'retriever';
    (list.items || []).forEach((item, idx) => {
      if (!item?.id) return;
      const rank = idx + 1;
      const contrib = weight / (k + rank);
      const existing = fused.get(item.id) || {
        id: item.id,
        rrfScore: 0,
        ranks: {}
      };
      existing.rrfScore += contrib;
      existing.ranks[listName] = rank;
      fused.set(item.id, existing);
    });
  });

  return Array.from(fused.values()).sort((a, b) => b.rrfScore - a.rrfScore);
}

/**
 * Generates Enterprise Multi-Stage Agent Workflow Telemetry for Trace UI.
 */
export function buildWorkflowTelemetry({
  query = '',
  mode = 'storefront',
  targetGender = null,
  seedCount = 0,
  totalNodes = 0,
  edgeCount = 0,
  latencyMs = 0,
  topRrfScore = 0
}) {
  return [
    {
      id: 'planning',
      label: 'Decompose & Plan',
      status: 'completed',
      engine: mode === 'admin_studio' ? 'Admin Full-Dossier Intent' : 'Storefront Guarded Intent',
      detail: targetGender
        ? `Locked gender scope -> ${targetGender}`
        : mode === 'admin_studio'
        ? 'Unrestricted workspace intelligence + catalog audit'
        : 'Semantic streetwear intent extraction'
    },
    {
      id: 'rrf',
      label: 'BM25 + RRF Fusion (k=60)',
      status: 'completed',
      engine: 'Okapi BM25 x PageRank',
      detail: `${seedCount} fused seed nodes · top RRF ${topRrfScore.toFixed(4)}`
    },
    {
      id: 'diffusion',
      label: 'Multi-Hop Diffusion',
      status: 'completed',
      engine: '2-Hop Bounded BFS',
      detail: `Traversed ${totalNodes} entities across ${edgeCount} semantic paths`
    },
    {
      id: 'synthesis',
      label: 'Groq LPU Synthesis',
      status: 'completed',
      engine: 'Llama / GPT-OSS Stream',
      detail: `Synthesized cited memo in ${latencyMs}ms`
    }
  ];
}

