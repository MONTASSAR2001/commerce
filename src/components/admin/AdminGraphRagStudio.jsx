import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Network,
  Sparkles,
  Send,
  Cpu,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Eye,
  EyeOff,
  Zap,
  MessageSquare,
  FileText,
  ThumbsUp,
  ThumbsDown,
  GitBranch,
  Layers,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target,
  TrendingUp,
  Package,
  Tag,
  ShieldCheck,
  Activity
} from 'lucide-react';
import {
  GROQ_FREE_MODELS,
  getGroqConfig,
  saveGroqConfig,
  fetchAvailableGroqModels,
  buildKronosKnowledgeGraph,
  askKronosGraphRag,
  syncGraphToSupabase,
  fetchRagDocuments,
  upsertRagDocument,
  deleteRagDocument,
  fetchRagQaLogs,
  deleteRagQaLog,
  checkGraphRagTablesStatus,
  runGraphRagDiagnostics
} from '../../lib/kronosGraphRag';
import RichChatbotMessage, { CHATBOT_LUXURY_BG_STYLE } from '../RichChatbotMessage';

const ADMIN_CHAT_HISTORY_KEY = 'kronos_admin_copilot_history_v1';
const ADMIN_CHAT_TRACE_KEY = 'kronos_admin_copilot_trace_v1';

function buildAdminInitialMessage(brandName = 'K') {
  return {
    id: 'adm-init',
    sender: 'bot',
    text: `### ✨ ${brandName} Intelligence Copilot Ready\nWelcome to your **Knowledge Graph + Groq LPU Command Studio**.\n- **Styling & Pairings**: Build multi-hop outfit strategies across **${brandName}**'s catalog.\n- **Promos & Margins**: Test **KRONOS15**, **BLACKFRIDAY35**, and free-shipping bundles (**300 DT+**).\n- **Live Telemetry**: Every question answered here or on the storefront logs automatically to **Supabase**.\n> 💡 Strategy: Click any quick strategy prompt below or inspect active **Hop-0 → Hop-2** paths on the right.`,
    timestamp: 'READY'
  };
}

function loadStoredAdminChat(brandName) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ADMIN_CHAT_HISTORY_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore corrupted cache
  }
  return [buildAdminInitialMessage(brandName)];
}

function loadStoredAdminTrace() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ADMIN_CHAT_TRACE_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
import { KronosLogo } from '../KronosLogo';
import EnterpriseGraphCanvas from './EnterpriseGraphCanvas';

const NODE_STYLES = {
  brand: { fill: '#ff6f1e', glow: 'rgba(255,111,30,0.55)', badge: 'bg-[#ff6f1e] text-white', label: 'Brand' },
  product: { fill: '#fb923c', glow: 'rgba(251,146,60,0.45)', badge: 'bg-orange-500/20 text-orange-300 border-orange-400/40', label: 'Product' },
  category: { fill: '#38bdf8', glow: 'rgba(56,189,248,0.45)', badge: 'bg-sky-500/20 text-sky-300 border-sky-400/40', label: 'Category' },
  collection: { fill: '#c084fc', glow: 'rgba(192,132,252,0.45)', badge: 'bg-purple-500/20 text-purple-300 border-purple-400/40', label: 'Drop/Edit' },
  colorway: { fill: '#f472b6', glow: 'rgba(244,114,182,0.45)', badge: 'bg-pink-500/20 text-pink-300 border-pink-400/40', label: 'Color' },
  material: { fill: '#2dd4bf', glow: 'rgba(45,212,191,0.45)', badge: 'bg-teal-500/20 text-teal-300 border-teal-400/40', label: 'Material' },
  store: { fill: '#4ade80', glow: 'rgba(74,222,128,0.45)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40', label: 'Store' },
  promo: { fill: '#facc15', glow: 'rgba(250,204,21,0.45)', badge: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40', label: 'Promo' },
  policy: { fill: '#f87171', glow: 'rgba(248,113,113,0.45)', badge: 'bg-red-500/20 text-red-300 border-red-400/40', label: 'Policy' },
  faq: { fill: '#94a3b8', glow: 'rgba(148,163,184,0.35)', badge: 'bg-slate-500/20 text-slate-300 border-slate-400/40', label: 'FAQ' },
  custom_doc: { fill: '#22d3ee', glow: 'rgba(34,211,238,0.45)', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40', label: 'Doc' }
};

function computeCurvedPath(x1, y1, x2, y2, curveSign = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dist = Math.hypot(dx, dy) || 1;
  const offset = Math.min(34, dist * 0.14) * curveSign;
  const nx = (-dy / dist) * offset;
  const ny = (dx / dist) * offset;
  return `M ${x1} ${y1} Q ${mx + nx} ${my + ny} ${x2} ${y2}`;
}

export default function AdminGraphRagStudio({
  storeData,
  promos = [],
  orders = [],
  mediaAssets = [],
  subscribers = [],
  sessionUser,
  onNotify
}) {
  const brandName = (storeData?.brand?.name || 'K').trim();

  const [subView, setSubView] = useState('copilot'); // 'copilot' | 'explorer' | 'groq' | 'logs'
  const [groqCfg, setGroqCfg] = useState(() => getGroqConfig());
  const [showKey, setShowKey] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState([]);
  const [discoveringModels, setDiscoveringModels] = useState(false);
  const [modelStatusMsg, setModelStatusMsg] = useState('');

  const [ragDocs, setRagDocs] = useState([]);
  const [qaLogs, setQaLogs] = useState([]);
  const [supaStatus, setSupaStatus] = useState({ configured: false, tablesReady: false, cloudNodeCount: 0 });
  const [syncingGraph, setSyncingGraph] = useState(false);
  const [diagReport, setDiagReport] = useState(null);
  const [runningDiag, setRunningDiag] = useState(false);

  // Interactive Copilot Chat State (persisted across tab switches & reloads)
  const [promptInput, setPromptInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatFeed, setChatFeed] = useState(() => loadStoredAdminChat(brandName));
  const [activeTrace, setActiveTrace] = useState(() => loadStoredAdminTrace());
  const chatScrollRef = useRef(null);

  // Interactive Force/Constellation Graph Explorer State
  const [graphMode, setGraphMode] = useState('constellation'); // 'constellation' | 'subgraph' | 'ego'
  const [graphFilterType, setGraphFilterType] = useState('ALL');
  const [graphSearch, setGraphSearch] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('brand:kronos');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [graphZoom, setGraphZoom] = useState(1);
  const [dragOffsets, setDragOffsets] = useState({});
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const dragStartRef = useRef(null);
  const svgRef = useRef(null);

  // New Custom Document Form State
  const [docForm, setDocForm] = useState({
    title: '',
    doc_type: 'knowledge',
    content: '',
    tagsText: 'tunisia, styling',
    linked_node_id: 'brand:kronos'
  });
  const [savingDoc, setSavingDoc] = useState(false);
  const [sqlGuideCopied, setSqlGuideCopied] = useState(false);

  const loadGraphRagBackend = useCallback(async () => {
    const [docs, logs, status] = await Promise.all([
      fetchRagDocuments(),
      fetchRagQaLogs(),
      checkGraphRagTablesStatus()
    ]);
    setRagDocs(docs);
    setQaLogs(logs);
    setSupaStatus(status);

    // If localStorage has no saved conversation yet, hydrate recent admin_studio turns from Supabase
    setChatFeed((prev) => {
      const hasUserTurns = prev.some((m) => m.sender === 'user');
      if (hasUserTurns || !Array.isArray(logs) || logs.length === 0) return prev;
      const adminLogs = logs
        .filter((l) => l.channel === 'admin_studio' && l.question && l.answer)
        .slice(0, 8)
        .reverse();
      if (adminLogs.length === 0) return prev;
      const restored = [prev[0] || buildAdminInitialMessage(brandName)];
      adminLogs.forEach((entry, idx) => {
        const ts = entry.created_at
          ? new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'SAVED';
        restored.push({
          id: `supa-u-${entry.id || idx}`,
          sender: 'user',
          text: entry.question,
          timestamp: ts
        });
        restored.push({
          id: `supa-b-${entry.id || idx}`,
          sender: 'bot',
          text: entry.answer,
          timestamp: ts,
          meta: {
            modelUsed: entry.model_used || groqCfg.model,
            latencyMs: entry.latency_ms || 0,
            loggedInCloud: true,
            hopCount: Array.isArray(entry.matched_node_ids) ? entry.matched_node_ids.length : 0,
            products: []
          }
        });
      });
      return restored;
    });
  }, [brandName, groqCfg.model]);

  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ADMIN_CHAT_HISTORY_KEY, JSON.stringify(chatFeed.slice(-50)));
      }
    } catch {
      // ignore storage quota errors
    }
  }, [chatFeed]);

  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        if (activeTrace) {
          localStorage.setItem(ADMIN_CHAT_TRACE_KEY, JSON.stringify(activeTrace));
        } else {
          localStorage.removeItem(ADMIN_CHAT_TRACE_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, [activeTrace]);

  useEffect(() => {
    loadGraphRagBackend();
  }, [loadGraphRagBackend, sessionUser]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatFeed, asking]);

  // Compile live Knowledge Graph (includes internal inventory for Admin view)
  const compiledGraph = useMemo(
    () => buildKronosKnowledgeGraph(storeData, ragDocs, promos, { includeInternalStock: true }),
    [storeData, ragDocs, promos]
  );

  // Run full 6-point Graph RAG + Privacy Shield Verification Suite
  const handleRunDiagnostics = async () => {
    setRunningDiag(true);
    try {
      const report = await runGraphRagDiagnostics({
        storeData,
        customDocs: ragDocs,
        promos,
        orders,
        mediaAssets,
        subscribers,
        qaLogs
      });
      setDiagReport(report);
      if (subView !== 'copilot') setSubView('copilot');
      onNotify?.(
        `Graph RAG Verification: ${report.passed}/${report.total} checks passed (${report.durationMs}ms)`
      );
    } finally {
      setRunningDiag(false);
    }
  };

  // Run a live Graph RAG + Free Groq question
  const handleRunCopilotQuery = async (customQuery = null) => {
    const q = (customQuery !== null ? customQuery : promptInput).trim();
    if (!q || asking) return;

    if (subView !== 'copilot') setSubView('copilot');

    const userEntry = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const nextFeed = [...chatFeed, userEntry];
    setChatFeed(nextFeed);
    if (customQuery === null) setPromptInput('');
    setAsking(true);

    try {
      const res = await askKronosGraphRag({
        query: q,
        channel: 'admin_studio',
        storeData,
        customDocs: ragDocs,
        promos,
        orders,
        mediaAssets,
        subscribers,
        qaLogs,
        history: nextFeed,
        overrideModel: groqCfg.model
      });

      setActiveTrace({
        query: q,
        modelUsed: res.modelUsed,
        engineMode: res.engineMode,
        latencyMs: res.latencyMs,
        promptTokens: res.promptTokens,
        completionTokens: res.completionTokens,
        loggedInCloud: res.loggedInCloud,
        reasoningTrace: res.reasoningTrace,
        llmError: res.llmError,
        seedIds: res.subgraph?.seedIds || [],
        rankedNodes: res.subgraph?.rankedNodes || [],
        activeEdgeIds: res.subgraph?.activeEdgeIds || [],
        traversalPaths: res.subgraph?.traversalPaths || [],
        recommendedProducts: res.subgraph?.recommendedProducts || [],
        supabaseHitsCount: res.subgraph?.supabaseHitsCount || 0
      });

      if (res.subgraph?.seedIds?.[0]) {
        setSelectedNodeId(res.subgraph.seedIds[0]);
      }

      setChatFeed((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: res.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          meta: {
            modelUsed: res.modelUsed,
            engineMode: res.engineMode,
            latencyMs: res.latencyMs,
            loggedInCloud: res.loggedInCloud,
            products: res.subgraph?.recommendedProducts || [],
            hopCount: res.subgraph?.rankedNodes?.length || 0
          }
        }
      ]);

      const latestLogs = await fetchRagQaLogs();
      setQaLogs(latestLogs);
    } finally {
      setAsking(false);
    }
  };

  const handleSyncGraph = async () => {
    setSyncingGraph(true);
    try {
      const res = await syncGraphToSupabase(storeData, ragDocs, promos);
      if (res.ok) {
        onNotify?.(
          res.vectorSynced
            ? `Synced ${res.nodeCount} Graph nodes + 384-dim pgvector embeddings & ${res.edgeCount} edges to Supabase!`
            : `Synced ${res.nodeCount} Graph nodes & ${res.edgeCount} edges (run 06_pgvector_hybrid_graph_rag.sql for pgvector HNSW)!`
        );
        await loadGraphRagBackend();
      } else {
        onNotify?.(`Graph sync: ${res.error || 'Run supabase/06_pgvector_hybrid_graph_rag.sql first'}`);
      }
    } finally {
      setSyncingGraph(false);
    }
  };

  const handleDiscoverModels = async () => {
    setDiscoveringModels(true);
    setModelStatusMsg('');
    try {
      const res = await fetchAvailableGroqModels(groqCfg.apiKey);
      if (res.ok) {
        setDiscoveredModels(res.models);
        setModelStatusMsg(`Verified ${res.models.length} active free Groq chat models.`);
        onNotify?.(`Groq connected — ${res.models.length} free chat models ready!`);
      } else {
        setModelStatusMsg(`Groq check failed: ${res.error}`);
        onNotify?.(`Groq API error: ${res.error}`);
      }
    } finally {
      setDiscoveringModels(false);
    }
  };

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    if (!docForm.title.trim() || !docForm.content.trim()) return;
    setSavingDoc(true);
    try {
      const tags = docForm.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await upsertRagDocument({
        title: docForm.title,
        doc_type: docForm.doc_type,
        content: docForm.content,
        tags,
        linked_node_id: docForm.linked_node_id
      });
      setRagDocs(res.documents || []);
      setDocForm({ title: '', doc_type: 'knowledge', content: '', tagsText: 'tunisia, styling', linked_node_id: 'brand:kronos' });
      onNotify?.(
        res.cloud
          ? 'Saved Knowledge Doc to Supabase & compiled into Graph RAG!'
          : 'Saved Knowledge Doc locally (run 04_graph_rag.sql + Sign In for cloud persistence).'
      );
    } finally {
      setSavingDoc(false);
    }
  };

  /* ── Interactive Multi-Tier Orbital / Force Graph Geometry ─────────────── */
  const graphLayout = useMemo(() => {
    const cx = 400;
    const cy = 260;
    const activeNodeSet = new Set((activeTrace?.rankedNodes || []).map((n) => n.id));
    const activeEdgeSet = new Set(activeTrace?.activeEdgeIds || []);

    const passesFilter = (n) => {
      if (!n) return false;
      if (graphFilterType !== 'ALL' && n.node_type !== graphFilterType) return false;
      if (graphSearch.trim()) {
        const q = graphSearch.toLowerCase();
        return n.label.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q);
      }
      return true;
    };

    const positioned = [];
    const posMap = new Map();

    const placeNode = (node, baseX, baseY, tier = 0) => {
      const off = dragOffsets[node.id] || { x: 0, y: 0 };
      const p = {
        ...node,
        x: baseX + off.x,
        y: baseY + off.y,
        tier,
        isHighlighted: activeNodeSet.has(node.id),
        isSelected: node.id === selectedNodeId
      };
      positioned.push(p);
      posMap.set(node.id, p);
    };

    // Mode 1: Active Query Subgraph (or fallback to Constellation if no query yet)
    const effectiveMode =
      graphMode === 'subgraph' && (!activeTrace || activeTrace.rankedNodes.length === 0)
        ? 'constellation'
        : graphMode;

    if (effectiveMode === 'subgraph' && activeTrace) {
      const seeds = activeTrace.rankedNodes.filter((n) => n.hop === 0).slice(0, 4);
      const hop1 = activeTrace.rankedNodes.filter((n) => n.hop === 1).slice(0, 10);
      const hop2 = activeTrace.rankedNodes.filter((n) => n.hop >= 2).slice(0, 10);

      seeds.forEach((n, idx) => {
        const ang = (idx / Math.max(1, seeds.length)) * Math.PI * 2 - Math.PI / 2;
        const r = seeds.length === 1 ? 0 : 62;
        placeNode(n, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 0);
      });
      hop1.forEach((n, idx) => {
        const ang = (idx / Math.max(1, hop1.length)) * Math.PI * 2 - Math.PI / 3;
        placeNode(n, cx + Math.cos(ang) * 145, cy + Math.sin(ang) * 145, 1);
      });
      hop2.forEach((n, idx) => {
        const ang = (idx / Math.max(1, hop2.length)) * Math.PI * 2;
        placeNode(n, cx + Math.cos(ang) * 225, cy + Math.sin(ang) * 205, 2);
      });
    } else if (effectiveMode === 'ego') {
      const center = compiledGraph.nodesMap.get(selectedNodeId) || compiledGraph.nodesMap.get('brand:kronos') || compiledGraph.nodes[0];
      if (center) {
        placeNode(center, cx, cy, 0);
        const hop1Items = (compiledGraph.adjacency.get(center.id) || [])
          .map((a) => compiledGraph.nodesMap.get(a.neighborId))
          .filter(passesFilter);
        const uniqueHop1 = Array.from(new Map(hop1Items.map((n) => [n.id, n])).values()).slice(0, 14);
        uniqueHop1.forEach((n, idx) => {
          const ang = (idx / Math.max(1, uniqueHop1.length)) * Math.PI * 2 - Math.PI / 2;
          placeNode(n, cx + Math.cos(ang) * 138, cy + Math.sin(ang) * 138, 1);
        });

        // 2-hop satellite ring
        const hop2Set = new Map();
        uniqueHop1.slice(0, 8).forEach((h1) => {
          (compiledGraph.adjacency.get(h1.id) || []).forEach((a) => {
            const nb = compiledGraph.nodesMap.get(a.neighborId);
            if (nb && nb.id !== center.id && !posMap.has(nb.id) && passesFilter(nb) && hop2Set.size < 16) {
              hop2Set.set(nb.id, nb);
            }
          });
        });
        const hop2Arr = Array.from(hop2Set.values());
        hop2Arr.forEach((n, idx) => {
          const ang = (idx / Math.max(1, hop2Arr.length)) * Math.PI * 2 - Math.PI / 4;
          placeNode(n, cx + Math.cos(ang) * 238, cy + Math.sin(ang) * 212, 2);
        });
      }
    } else {
      // Constellation Overview: Brand center + Inner Strategic Ring (Policies, Promos, Drops, Stores, Categories, Docs) + Outer Garments & Materials Ring
      const center = compiledGraph.nodesMap.get('brand:kronos') || compiledGraph.nodes[0];
      if (center) placeNode(center, cx, cy, 0);

      const innerTypes = new Set(['collection', 'category', 'promo', 'policy', 'store', 'custom_doc']);
      const innerNodes = compiledGraph.nodes
        .filter((n) => n.id !== center?.id && innerTypes.has(n.node_type) && passesFilter(n))
        .slice(0, 16);

      innerNodes.forEach((n, idx) => {
        const ang = (idx / Math.max(1, innerNodes.length)) * Math.PI * 2 - Math.PI / 2;
        placeNode(n, cx + Math.cos(ang) * 145, cy + Math.sin(ang) * 135, 1);
      });

      const outerNodes = compiledGraph.nodes
        .filter((n) => n.id !== center?.id && !posMap.has(n.id) && passesFilter(n))
        .sort((a, b) => (activeNodeSet.has(b.id) ? 1 : 0) - (activeNodeSet.has(a.id) ? 1 : 0) || (b.weight || 1) - (a.weight || 1))
        .slice(0, 18);

      outerNodes.forEach((n, idx) => {
        const ang = (idx / Math.max(1, outerNodes.length)) * Math.PI * 2 + 0.18;
        placeNode(n, cx + Math.cos(ang) * 255, cy + Math.sin(ang) * 215, 2);
      });
    }

    // Collect edges connecting any two positioned nodes
    const visibleEdges = [];
    compiledGraph.edges.forEach((e, idx) => {
      const s = posMap.get(e.source_id);
      const t = posMap.get(e.target_id);
      if (s && t) {
        const isHighlighted = activeEdgeSet.has(e.id) || e.source_id === selectedNodeId || e.target_id === selectedNodeId;
        visibleEdges.push({
          ...e,
          x1: s.x,
          y1: s.y,
          x2: t.x,
          y2: t.y,
          curveSign: idx % 2 === 0 ? 1 : -1,
          isHighlighted
        });
      }
    });

    return {
      nodes: positioned,
      edges: visibleEdges.slice(0, 90),
      effectiveMode
    };
  }, [compiledGraph, selectedNodeId, graphMode, graphFilterType, graphSearch, activeTrace, dragOffsets]);

  const handleSvgPointerMove = (e) => {
    if (!draggingNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = (800 / graphZoom) / rect.width;
    const scaleY = (520 / graphZoom) / rect.height;
    const dx = (e.clientX - dragStartRef.current.clientX) * scaleX;
    const dy = (e.clientY - dragStartRef.current.clientY) * scaleY;
    setDragOffsets((prev) => ({
      ...prev,
      [draggingNodeId]: {
        x: dragStartRef.current.origX + dx,
        y: dragStartRef.current.origY + dy
      }
    }));
  };

  const handleSvgPointerUp = () => {
    setDraggingNodeId(null);
  };

  const filteredBrowseNodes = useMemo(() => {
    return compiledGraph.nodes
      .filter((n) => {
        if (graphFilterType !== 'ALL' && n.node_type !== graphFilterType) return false;
        if (graphSearch.trim()) {
          const q = graphSearch.toLowerCase();
          return n.label.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q);
        }
        return true;
      })
      .slice(0, 50);
  }, [compiledGraph.nodes, graphFilterType, graphSearch]);

  const selectedNode = compiledGraph.nodesMap.get(selectedNodeId) || compiledGraph.nodes[0];
  const selectedNeighbors = selectedNode ? compiledGraph.adjacency.get(selectedNode.id) || [] : [];

  const availableModelChoices = useMemo(() => {
    const map = new Map();
    GROQ_FREE_MODELS.forEach((m) => map.set(m.id, m));
    discoveredModels.forEach((id) => {
      if (!map.has(id)) {
        map.set(id, {
          id,
          label: id,
          tier: 'Live Discovered Free Model',
          speed: 'Groq LPU',
          isReasoning: id.includes('gpt-oss') || id.includes('qwen'),
          notes: 'Discovered live via Groq /openai/v1/models.'
        });
      }
    });
    return Array.from(map.values());
  }, [discoveredModels]);

  return (
    <div className="space-y-6">
      {/* ── FLAGSHIP DARK EDITORIAL COMMAND HEADER ──────────────────────────── */}
      <div className="rounded-[20px] border-[1.5px] border-[#171717] bg-gradient-to-br from-[#12131a] via-[#171722] to-[#26140c] text-[#FFFFE3] p-5 sm:p-7 shadow-[5px_5px_0px_#ff6f1e] relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#ff6f1e]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#ff6f1e] to-[#E5A93C] border border-white/20 flex items-center justify-center text-[#111111] shadow-[0_0_24px_rgba(255,111,30,0.45)] shrink-0">
              <Network className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-gelica text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {brandName} AI Assistant &amp; Graph RAG Studio
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {groqCfg.model}
                </span>
              </div>
              <p className="text-xs text-[#C7C7D1] mt-1">
                2-Hop Knowledge Graph across{' '}
                <strong className="text-[#FFE082]">{compiledGraph.nodes.length} entities</strong> &amp;{' '}
                <strong className="text-[#ff8f4d]">{compiledGraph.edges.length} semantic edges</strong> — synced with Free Groq LPU &amp; Supabase Q&amp;A telemetry.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRunDiagnostics}
              disabled={runningDiag}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1C24] hover:bg-[#252530] border border-[#C59B27]/60 text-[#FFE082] text-xs font-extrabold shadow-[0_0_18px_rgba(197,155,39,0.22)] transition-all cursor-pointer"
            >
              <Activity className={`w-3.5 h-3.5 text-[#C59B27] ${runningDiag ? 'animate-spin' : ''}`} />
              <span>{runningDiag ? 'Verifying Graph RAG...' : 'Verify Graph RAG'}</span>
            </button>
            <button
              type="button"
              onClick={handleSyncGraph}
              disabled={syncingGraph}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff6f1e] to-[#E5A93C] text-[#111111] text-xs font-extrabold shadow-[0_0_20px_rgba(255,111,30,0.35)] hover:brightness-110 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{syncingGraph ? 'Syncing Graph...' : 'Sync Graph to Supabase'}</span>
            </button>
            <button
              type="button"
              onClick={loadGraphRagBackend}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Vibrant Glass KPI Tiles */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 rounded-[14px] bg-white/[0.06] border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300 block">
              Graph Topology
            </span>
            <p className="font-gelica text-2xl font-bold text-white mt-0.5">{compiledGraph.nodes.length}</p>
            <span className="text-[10px] font-mono text-white/65">
              {compiledGraph.edges.length} typed edges
            </span>
          </div>

          <div className="p-3.5 rounded-[14px] bg-white/[0.06] border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
              Supabase Vector/Graph
            </span>
            <p className="font-gelica text-lg font-bold flex items-center gap-1.5 mt-1">
              {supaStatus.pgvectorReady && supaStatus.cloudNodeCount >= 20 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">pgvector ({supaStatus.cloudNodeCount})</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300">
                    {supaStatus.tablesReady ? `Run 06_pgvector (${supaStatus.cloudNodeCount})` : 'Run 06_pgvector.sql'}
                  </span>
                </>
              )}
            </p>
            <span className="text-[10px] font-mono text-white/60">pgvector HNSW · rag_nodes</span>
          </div>

          <div className="p-3.5 rounded-[14px] bg-white/[0.06] border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
              Questions Answered
            </span>
            <p className="font-gelica text-2xl font-bold text-white mt-0.5">{qaLogs.length}</p>
            <span className="text-[10px] font-mono text-sky-200/80">
              {qaLogs.filter((l) => l.cloud_logged || (l.id && !String(l.id).startsWith('rag-local-'))).length} persisted in Postgres
            </span>
          </div>

          <div className="p-3.5 rounded-[14px] bg-white/[0.06] border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
              Knowledge Playbooks
            </span>
            <p className="font-gelica text-2xl font-bold text-white mt-0.5">{ragDocs.length}</p>
            <span className="text-[10px] font-mono text-purple-200/80">Free Groq Failover Armed</span>
          </div>
        </div>

        {/* Sub-View Pill Bar */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 pt-5">
          {[
            { id: 'copilot', label: 'AI Copilot & Strategy Trace', icon: Sparkles },
            { id: 'explorer', label: 'Interactive Knowledge Graph', icon: GitBranch },
            { id: 'groq', label: 'Groq Free Models & Key', icon: Cpu },
            { id: 'logs', label: `Supabase Q&A Logs (${qaLogs.length}) & Docs`, icon: FileText }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubView(id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                subView === id
                  ? 'bg-white text-[#111111] shadow-[0_0_20px_rgba(255,255,255,0.22)]'
                  : 'bg-white/10 hover:bg-white/15 text-white/85 border border-white/10'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${subView === id ? 'text-[#ff6f1e]' : ''}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Supabase 06_pgvector_hybrid_graph_rag.sql notice if pgvector RPC or product nodes are missing */}
      {supaStatus.configured && (!supaStatus.tablesReady || !supaStatus.pgvectorReady || supaStatus.cloudNodeCount < 20) && (
        <div className="p-4 rounded-[14px] border-[1.5px] border-[#171717] bg-[#fff3e6] shadow-[3px_3px_0px_#171717] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-[#9a3412]">
              Run <code>supabase/06_pgvector_hybrid_graph_rag.sql</code> in Supabase SQL Editor to enable <code>pgvector</code> HNSW search &amp; backfill all {compiledGraph.nodes.length} nodes into Postgres.
              {supaStatus.pgvectorError || supaStatus.error ? ` (${supaStatus.pgvectorError || supaStatus.error})` : ''}
            </p>
            <p className="text-[#171717]/75">
              Currently {supaStatus.cloudNodeCount || 0} rows in <code>rag_nodes</code>. Running SQL 06 populates all 56 products + 384-dim embeddings &amp; fixes the RPC query.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText('Run file: supabase/06_pgvector_hybrid_graph_rag.sql in Supabase Dashboard -> SQL Editor');
              setSqlGuideCopied(true);
              onNotify?.('Open supabase/06_pgvector_hybrid_graph_rag.sql and click Run in Supabase SQL Editor!');
              setTimeout(() => setSqlGuideCopied(false), 2000);
            }}
            className="superr-pill-btn py-1.5 px-3 text-xs shrink-0"
          >
            {sqlGuideCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy SQL Path</span>
          </button>
        </div>
      )}

      {/* ── VIEW 1: AI COPILOT (MATCHES MAIN WEBSITE CHATBOT) & GRAPH TRACE ───── */}
      {subView === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Matches Main Storefront High-Level Studio Glass Chatbot */}
          <div
            style={CHATBOT_LUXURY_BG_STYLE}
            className="lg:col-span-7 backdrop-blur-3xl border border-[#C59B27]/55 rounded-[28px] flex flex-col h-[720px] overflow-hidden text-[#FFFFE3]"
          >
            {/* Header Bar matching RawlineAIChatbot */}
            <div className="px-5 py-3.5 bg-white/[0.03] backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1C1C24] border border-[#2B2B38] flex items-center justify-center p-1.5 shadow-sm">
                  <KronosLogo className="w-5 h-4" />
                </div>
                <div>
                  <h3 className="font-azeret font-bold text-xs uppercase tracking-wider text-white">
                    {brandName} AI · ADMIN STUDIO
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                    <span className="font-sans text-[10px] text-[#A0A0A5]">
                      Full Project Graph RAG · {groqCfg.model}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunDiagnostics}
                  disabled={runningDiag}
                  className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#1C1C24] hover:bg-[#252530] border border-[#C59B27]/50 text-[#FFE082] font-bold cursor-pointer transition-colors"
                >
                  {runningDiag ? 'Testing...' : 'Verify RAG'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fresh = [buildAdminInitialMessage(brandName)];
                    setChatFeed(fresh);
                    setActiveTrace(null);
                    try {
                      if (typeof localStorage !== 'undefined') {
                        localStorage.setItem(ADMIN_CHAT_HISTORY_KEY, JSON.stringify(fresh));
                        localStorage.removeItem(ADMIN_CHAT_TRACE_KEY);
                      }
                    } catch {
                      // ignore
                    }
                  }}
                  className="text-[10px] font-mono text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Body Content Area (Hero + Quick 2x2 Grid + Messages Stream) */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto bg-transparent p-4 sm:p-5 space-y-4 scroll-smooth">
              {/* Top Hero Card matching Storefront Chatbot */}
              <div className="relative pt-1 pb-2 border-b border-white/10">
                <div className="flex items-start justify-between pr-2">
                  <div>
                    <h4 className="font-sans font-bold text-2xl text-white tracking-tight flex items-center gap-1.5">
                      <span>Hello!</span>
                      <span className="text-xl">👋</span>
                    </h4>
                    <p className="font-sans text-xs text-[#C8C8D0] mt-1 font-medium max-w-sm">
                      Ask anything about <strong className="text-[#FFE082]">{brandName}</strong> — revenue, commandes, catalog stock, promos, Graph RAG, or architecture.
                    </p>
                  </div>
                </div>

                {/* 2x2 Quick Action Grid matching RawlineAIChatbot */}
                <div className="grid grid-cols-2 gap-2 mt-3.5">
                  {[
                    {
                      label: 'Revenue & commandes',
                      icon: TrendingUp,
                      prompt: 'Give me a complete breakdown of our revenue (GMV), total commandes, statuses, cities, and average order value.'
                    },
                    {
                      label: 'Catalog & stock audit',
                      icon: Package,
                      prompt: 'Audit our full catalog: live vs draft products, price bands, stock levels, and promo opportunities.'
                    },
                    {
                      label: 'Outfit + promo strategy',
                      icon: Tag,
                      prompt: 'Build a complete MEN jacket + jeans look under 550 DT with active promo savings.'
                    },
                    {
                      label: 'System, vault & stores',
                      icon: ShieldCheck,
                      prompt: `Summarize ${brandName} Tunisia stores, Media Vault buckets, newsletter subscribers, and Graph RAG architecture.`
                    }
                  ].map(({ label, icon: Icon, prompt }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleRunCopilotQuery(prompt)}
                      className="bg-[#1C1C22] hover:bg-[#25252E] border border-[#2B2B36] hover:border-[#C59B27]/60 text-white rounded-xl py-2.5 px-3 text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 group text-left"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#C59B27] group-hover:scale-110 transition-transform shrink-0" />
                      <span className="font-sans text-xs truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Bubbles Stream */}
              <div className="space-y-4 pt-1">
                {chatFeed.map((m) => {
                  const isBot = m.sender === 'bot';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      {isBot && (
                        <div className="w-7 h-7 rounded-full bg-[#1C1C22] border border-[#2A2A35] flex items-center justify-center p-1 shrink-0 mt-0.5 shadow-sm">
                          <KronosLogo className="w-4 h-3.5" />
                        </div>
                      )}

                      <div className="flex flex-col max-w-[88%]">
                        <div
                          className={`text-xs leading-relaxed ${
                            isBot
                              ? 'bg-transparent px-0.5 py-1 text-white'
                              : 'rounded-2xl p-3.5 shadow-md bg-gradient-to-r from-[#EA301F] to-[#ff5a1f] text-white font-semibold shadow-[#EA301F]/25'
                          }`}
                        >
                          {isBot ? (
                            <RichChatbotMessage text={m.text} variant="dark" />
                          ) : (
                            <p className="whitespace-pre-line font-sans">{m.text}</p>
                          )}

                          {m.meta?.products?.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-[#262633] grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {m.meta.products.map((prod) => (
                                <div
                                  key={prod.id}
                                  className="flex items-center gap-2 p-2 rounded-xl bg-[#121217] border border-[#242430] hover:border-[#C59B27]/50 transition-colors"
                                >
                                  <img
                                    src={prod.img || prod.image}
                                    alt={prod.name}
                                    className="w-9 h-11 object-cover object-top rounded-lg border border-white/15 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-azeret font-bold text-[10px] uppercase text-[#FFFFE3] truncate">
                                      {prod.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-azeret font-black text-[10px] text-[#FFE082]">
                                        {prod.price} DT
                                      </span>
                                      <span className="text-[9px] text-white/45 font-mono">{prod.gender}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 ml-1 text-[10px] font-mono text-[#787878]">
                          <span>{m.timestamp}</span>
                          {m.meta && (
                            <>
                              <span className="text-[#C59B27]">· {m.meta.modelUsed}</span>
                              <span className="text-sky-300">· {m.meta.hopCount} graph nodes</span>
                              <span>· {m.meta.latencyMs}ms</span>
                              <span className={m.meta.loggedInCloud ? 'text-emerald-400 font-bold' : ''}>
                                · {m.meta.loggedInCloud ? 'Supabase Logged ✓' : 'Local Log'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {asking && (
                  <div className="flex items-center gap-2 px-1 py-2 bg-transparent w-fit">
                    <div className="w-2 h-2 rounded-full bg-[#C59B27] animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-[#FFFFE3] animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-[#EA301F] animate-bounce [animation-delay:0.4s]" />
                    <span className="font-mono text-[10px] text-[#C8C8D0] ml-1">
                      Querying full project Graph RAG + {groqCfg.model}...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Input Area matching Storefront Chatbot */}
            <div className="p-3.5 bg-black/25 backdrop-blur-xl border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunCopilotQuery();
                }}
                className="rounded-full bg-[#121216] border border-[#C59B27]/70 focus-within:border-[#E5A93C] p-1.5 pl-3.5 flex items-center gap-2 shadow-[0_0_15px_rgba(197,155,39,0.15)] transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#E5A93C] shrink-0" />
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Ask anything about revenue, commandes, catalog, Graph RAG, or strategy..."
                  className="w-full bg-transparent font-sans text-xs text-[#FFFFE3] placeholder-[#777] outline-none"
                />
                <button
                  type="submit"
                  disabled={asking || !promptInput.trim()}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-[#E5A93C] to-[#D97706] hover:brightness-110 disabled:opacity-40 flex items-center justify-center text-black font-bold shadow-md cursor-pointer transition-transform hover:scale-105 shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-black fill-black -ml-0.5" />
                </button>
              </form>

              {/* Decorative Bottom Bar with Golden Corner Flairs matching RawlineAIChatbot */}
              <div className="flex items-center justify-between px-2 pt-2 text-[#C59B27]">
                <svg viewBox="0 0 10 10" className="w-2 h-2 fill-current">
                  <polygon points="0,0 0,10 10,10" />
                </svg>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C59B27]/90 font-bold">
                  {brandName} • ADMIN INTELLIGENCE
                </span>
                <svg viewBox="0 0 10 10" className="w-2 h-2 fill-current">
                  <polygon points="10,0 0,10 10,10" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Multi-Hop Reasoning Inspector + Live Graph RAG Verification */}
          <div className="lg:col-span-5 rounded-[24px] border-[1.5px] border-[#171717] bg-[#fdfbf9] shadow-[4px_4px_0px_#171717] flex flex-col h-[520px] sm:h-[640px] lg:h-[720px] overflow-hidden">
            <div className="px-5 py-3.5 border-b-[1.5px] border-[#171717]/15 bg-[#fff8f1] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ff6f1e]" />
                <h3 className="font-gelica font-bold text-base lowercase text-[#2b1a07]">
                  multi-hop graph trace
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                {activeTrace && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {activeTrace.rankedNodes.length} nodes · {activeTrace.latencyMs}ms
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRunDiagnostics}
                  disabled={runningDiag}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#171717] text-[#FFE082] hover:bg-[#2a2a2a] cursor-pointer"
                >
                  {runningDiag ? 'Checking...' : 'Run 7-Point Proof'}
                </button>
              </div>
            </div>

            {diagReport && (
              <div className="p-3.5 border-b border-[#171717]/15 bg-gradient-to-br from-[#fffaf3] to-[#f7f4ee] space-y-2 max-h-[260px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2b1a07] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Graph RAG &amp; Privacy Verification ({diagReport.passed}/{diagReport.total} Passed · {diagReport.durationMs}ms)
                  </span>
                  <button
                    type="button"
                    onClick={() => setDiagReport(null)}
                    className="text-[10px] font-mono text-[#171717]/50 hover:text-[#171717] cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
                <div className="space-y-1.5">
                  {diagReport.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className={`p-2 rounded-[10px] border text-[11px] flex items-start gap-2 ${
                        chk.ok
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                          : 'bg-red-50 border-red-300 text-red-950'
                      }`}
                    >
                      {chk.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] leading-tight">{chk.name}</p>
                        <p className="text-[10px] font-mono opacity-80 break-words mt-0.5">{chk.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!activeTrace ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6f1e]/20 to-[#E5A93C]/20 border border-[#171717]/20 flex items-center justify-center text-[#ff6f1e]">
                  <Network className="w-7 h-7" />
                </div>
                <p className="font-gelica text-lg font-bold text-[#2b1a07]">
                  Real-Time Subgraph Inspector
                </p>
                <p className="text-xs text-[#171717]/65 max-w-xs leading-relaxed">
                  Trigger any strategy or project question on the left to watch{' '}
                  <strong className="text-[#9a3412]">Hop 0</strong> seeds expand through{' '}
                  <strong className="text-[#ff6f1e]">Hop 1</strong> attributes and{' '}
                  <strong className="text-emerald-700">Hop 2</strong> pairings live — or click{' '}
                  <strong className="text-[#171717]">Run 7-Point Proof</strong> above!
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {activeTrace.llmError && activeTrace.engineMode === 'local-graph-fallback' && (
                  <div className="p-2.5 rounded-[10px] border border-red-400 bg-red-50 text-red-800 text-[11px]">
                    <strong>Groq Failover Note:</strong> {activeTrace.llmError}
                  </div>
                )}

                {/* Enterprise Agent Workflow Timeline (from Enterprise GraphRAG Studio) */}
                {activeTrace.workflowStages && activeTrace.workflowStages.length > 0 && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        Multi-Stage Agent Workflow
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                        RRF top {(activeTrace.topRrfScore || 0).toFixed(4)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {activeTrace.workflowStages.map((stg, idx) => (
                        <div
                          key={stg.id}
                          className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-[10px]"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate">{stg.label}</span>
                          </div>
                          <p className="text-zinc-500 text-[9.5px] truncate mt-0.5">{stg.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Telemetry Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-[12px] border border-[#171717]/20 bg-gradient-to-br from-amber-50 to-orange-50">
                    <span className="text-[9px] font-bold uppercase text-[#9a3412] block">LATENCY</span>
                    <span className="font-mono font-extrabold text-sm text-[#171717]">
                      {activeTrace.latencyMs} ms
                    </span>
                  </div>
                  <div className="p-2.5 rounded-[12px] border border-[#171717]/20 bg-gradient-to-br from-sky-50 to-indigo-50">
                    <span className="text-[9px] font-bold uppercase text-sky-900 block">TOKENS</span>
                    <span className="font-mono font-extrabold text-sm text-[#171717]">
                      {activeTrace.promptTokens + activeTrace.completionTokens}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-[12px] border border-[#171717]/20 bg-gradient-to-br from-emerald-50 to-teal-50">
                    <span className="text-[9px] font-bold uppercase text-emerald-900 block">SUPA RPC</span>
                    <span className="font-mono font-extrabold text-sm text-[#171717]">
                      {activeTrace.supabaseHitsCount} hits
                    </span>
                  </div>
                </div>

                {/* Multi-Hop Traversal Paths */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a3412]">
                      Traversed Reasoning Paths ({activeTrace.traversalPaths.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setGraphMode('subgraph');
                        setSubView('explorer');
                      }}
                      className="text-[10px] font-bold text-[#ff6f1e] hover:underline cursor-pointer"
                    >
                      Visualize Subgraph →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {activeTrace.traversalPaths.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-[10px] bg-[#14151D] border border-white/10 text-[#FFFFE3] font-mono text-[10px] leading-relaxed"
                      >
                        <span className="text-[#ff6f1e] font-bold mr-1.5">#{idx + 1}</span>
                        {p}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activated Subgraph Entities with Hop Depth Badges */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a3412]">
                    Activated Entities ({activeTrace.rankedNodes.length})
                  </span>
                  <div className="space-y-1.5">
                    {activeTrace.rankedNodes.map((n) => {
                      const hopBadge =
                        n.hop === 0
                          ? 'bg-[#ff6f1e] text-white'
                          : n.hop === 1
                            ? 'bg-sky-600 text-white'
                            : 'bg-purple-600 text-white';
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setSelectedNodeId(n.id);
                            setGraphMode('ego');
                            setSubView('explorer');
                          }}
                          className="w-full text-left p-2.5 rounded-[12px] border border-[#171717]/15 bg-white hover:border-[#ff6f1e] hover:shadow-[2px_2px_0px_#ff6f1e] transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[11px] text-[#171717] truncate">{n.label}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${hopBadge}`}>
                                HOP {n.hop}
                              </span>
                              {n.pagerank !== undefined && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[9px] font-bold">
                                  PR {Number(n.pagerank).toFixed(3)}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-[#171717] text-[#FFE082] font-mono text-[9px] font-bold">
                                {n.node_type}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#171717]/70 line-clamp-2 mt-1">{n.summary}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeTrace.reasoningTrace && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#9a3412]">
                      Model Internal Reasoning Trace
                    </span>
                    <p className="p-2.5 rounded-[10px] border border-[#171717]/20 bg-[#fff3e6] font-mono text-[10px] text-[#2b1a07] whitespace-pre-wrap">
                      {activeTrace.reasoningTrace}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW 2: ENTERPRISE GRAPH RAG STUDIO (2D RING & 3D WEBGL SPHERE) ───── */}
      {subView === 'explorer' && (
        <EnterpriseGraphCanvas
          compiledGraph={compiledGraph}
          activeTrace={activeTrace}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      )}

      {/* ── VIEW 3: FREE GROQ MODEL HUB & CONFIG ──────────────────────────────── */}
      {subView === 'groq' && (
        <div className="superr-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dashed border-[#171717]/15">
            <div>
              <h3 className="font-gelica font-bold text-lg lowercase text-[#2b1a07]">
                free groq lpu models &amp; api configuration
              </h3>
              <p className="text-xs text-[#171717]/70">
                Select any zero-cost Groq model and verify live availability directly from{' '}
                <code>https://api.groq.com/openai/v1/models</code>. Automatic failover activates on rate limits.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDiscoverModels}
              disabled={discoveringModels}
              className="superr-pill-btn-primary py-1.5 px-3.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${discoveringModels ? 'animate-spin' : ''}`} />
              <span>{discoveringModels ? 'Querying Groq...' : 'Discover Free Models Live'}</span>
            </button>
          </div>

          {modelStatusMsg && (
            <div className="p-3 rounded-[10px] border border-[#171717] bg-[#fff3e6] text-xs font-mono text-[#9a3412]">
              {modelStatusMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableModelChoices.map((m) => {
              const selected = groqCfg.model === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const updated = saveGroqConfig({ model: m.id });
                    setGroqCfg(updated);
                    onNotify?.(`Switched active Groq Free Model to ${m.id}`);
                  }}
                  className={`text-left p-4 rounded-[12px] border-[1.5px] cursor-pointer transition-all ${
                    selected
                      ? 'border-[#171717] bg-[#fff3e6] shadow-[3px_3px_0px_#ff6f1e]'
                      : 'border-[#171717]/30 bg-white hover:border-[#171717]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-[#171717]">{m.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        selected
                          ? 'bg-[#ff6f1e] text-white border-[#171717]'
                          : 'bg-[#fdfbf9] text-[#171717]/70 border-[#171717]/20'
                      }`}
                    >
                      {selected ? 'ACTIVE MODEL' : m.speed}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#9a3412] mt-1">{m.tier}</p>
                  <p className="text-[11px] text-[#171717]/70 mt-1">{m.notes}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#171717]/70 mb-1">
                  Groq API Key (Loaded from .env.local or browser override)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={groqCfg.apiKey}
                    onChange={(e) => setGroqCfg((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="gsk_..."
                    className="flex-1 px-3 py-2 rounded-[10px] border-[1.3px] border-[#171717] bg-white font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="p-2 rounded-[10px] border-[1.3px] border-[#171717] bg-white cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#171717]/70 mb-1">
                  Temperature ({groqCfg.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={groqCfg.temperature}
                  onChange={(e) =>
                    setGroqCfg((prev) => ({ ...prev, temperature: Number(e.target.value) }))
                  }
                  className="w-full accent-[#ff6f1e]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#171717]/70 mb-1">
                  Graph RAG System Persona Instruction
                </label>
                <textarea
                  rows={4}
                  value={groqCfg.systemPersona}
                  onChange={(e) => setGroqCfg((prev) => ({ ...prev, systemPersona: e.target.value }))}
                  className="w-full px-3 py-2 rounded-[10px] border-[1.3px] border-[#171717] bg-white text-xs"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    saveGroqConfig(groqCfg);
                    onNotify?.('Saved Groq Free Model & Graph RAG settings!');
                  }}
                  className="superr-pill-btn-primary py-2 px-4 text-xs"
                >
                  Save Groq Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 4: CUSTOM KNOWLEDGE DOCS + SUPABASE Q&A LOGS ─────────────────── */}
      {subView === 'logs' && (
        <div className="space-y-6">
          <div className="superr-card p-5 space-y-4">
            <h3 className="font-gelica font-bold text-base lowercase text-[#2b1a07]">
              custom knowledge graph documents (rag_documents)
            </h3>

            <form onSubmit={handleSaveDoc} className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              <input
                type="text"
                required
                value={docForm.title}
                onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Doc Title (e.g. Tunisia Drop Delivery Rules)"
                className="md:col-span-5 px-3 py-2 rounded-[10px] border-[1.3px] border-[#171717] bg-white"
              />
              <select
                value={docForm.doc_type}
                onChange={(e) => setDocForm((p) => ({ ...p, doc_type: e.target.value }))}
                className="md:col-span-3 px-3 py-2 rounded-[10px] border-[1.3px] border-[#171717] bg-white"
              >
                <option value="knowledge">General Knowledge</option>
                <option value="policy">Store / Delivery Policy</option>
                <option value="styling_guide">Styling Guide</option>
                <option value="sizing_guide">Sizing Guide</option>
                <option value="brand_story">Brand Story</option>
                <option value="faq">FAQ Entry</option>
              </select>
              <input
                type="text"
                value={docForm.tagsText}
                onChange={(e) => setDocForm((p) => ({ ...p, tagsText: e.target.value }))}
                placeholder="tags: tunisia, sizing, drop"
                className="md:col-span-4 px-3 py-2 rounded-[10px] border-[1.3px] border-[#171717] bg-white font-mono"
              />
              <textarea
                rows={2}
                required
                value={docForm.content}
                onChange={(e) => setDocForm((p) => ({ ...p, content: e.target.value }))}
                placeholder="Knowledge text injected into Graph RAG nodes & Supabase..."
                className="md:col-span-10 px-3 py-2 rounded-[10px] border-[1.3px] border-[#171717] bg-white"
              />
              <button
                type="submit"
                disabled={savingDoc}
                className="md:col-span-2 superr-pill-btn-primary py-2 px-3 text-xs justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{savingDoc ? 'Saving...' : 'Add Node'}</span>
              </button>
            </form>

            {ragDocs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {ragDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-[12px] border border-[#171717]/25 bg-[#fdfbf9] flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono text-[9px] font-bold">
                          {doc.doc_type}
                        </span>
                        <h4 className="font-bold truncate">{doc.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#171717]/75 mt-1 line-clamp-2">{doc.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const next = await deleteRagDocument(doc);
                        setRagDocs(next);
                        onNotify?.('Removed knowledge document');
                      }}
                      className="p-1.5 rounded-[8px] border border-[#171717]/20 hover:bg-red-50 text-red-600 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="superr-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-gelica font-bold text-base lowercase text-[#2b1a07]">
                  supabase answered questions ledger (rag_qa_logs)
                </h3>
                <p className="text-xs text-[#171717]/65">
                  Every question answered on the main storefront chatbot &amp; Admin AI Studio is persisted here.
                </p>
              </div>
              <button
                type="button"
                onClick={loadGraphRagBackend}
                className="superr-pill-btn py-1.5 px-3 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Supabase Logs</span>
              </button>
            </div>

            {qaLogs.length === 0 ? (
              <p className="text-xs text-[#171717]/60 py-6 text-center">
                No questions logged yet. Ask a question in the Copilot tab or the Storefront chatbot!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {qaLogs.map((log) => {
                  const isCloud = log.cloud_logged || (log.id && !String(log.id).startsWith('rag-local-'));
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-[12px] border-[1.2px] border-[#171717]/25 bg-white space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold border ${
                              log.channel === 'storefront'
                                ? 'bg-[#ff6f1e]/15 text-[#9a3412] border-[#ff6f1e]/30'
                                : 'bg-[#171717] text-white border-[#171717]'
                            }`}
                          >
                            {log.channel}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#fdfbf9] border border-[#171717]/20 font-mono text-[9px]">
                            {log.groq_model}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-[#171717]/60">
                            <Clock className="w-3 h-3" />
                            {log.latency_ms}ms
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                              isCloud ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isCloud ? 'Supabase Synced' : 'Local Only'}
                          </span>
                          {log.feedback_rating === 1 && <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />}
                          {log.feedback_rating === -1 && <ThumbsDown className="w-3.5 h-3.5 text-red-600" />}
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const next = await deleteRagQaLog(log.id);
                            setQaLogs(next);
                          }}
                          className="p-1 rounded hover:bg-red-50 text-red-600 cursor-pointer"
                          title="Delete log row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="font-bold text-[#2b1a07]">Q: {log.user_question}</p>
                      <p className="text-[#171717]/80 whitespace-pre-line">{log.assistant_answer}</p>

                      {Array.isArray(log.traversal_paths) && log.traversal_paths.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {log.traversal_paths.slice(0, 3).map((tp, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#fdfbf9] border border-[#171717]/15 text-[#171717]/70"
                            >
                              {tp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
