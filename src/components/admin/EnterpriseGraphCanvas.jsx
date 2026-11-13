import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Box,
  Compass,
  GitBranch,
  Network,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { computeGraphMetrics } from '../../lib/enterpriseGraphEngine';

function disposeHierarchy(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        });
      } else {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    }
  });
}

function createTextSprite(text, color = '#0f172a') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const display = text.length > 22 ? `${text.slice(0, 20)}..` : text;
  canvas.width = 360;
  canvas.height = 72;
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '700 22px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    const w = Math.min(340, ctx.measureText(display).width + 26);
    const x = (canvas.width - w) / 2;
    ctx.beginPath();
    ctx.roundRect(x, 14, w, 44, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(display, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(58, 12, 1);
  return sprite;
}

export default function EnterpriseGraphCanvas({
  compiledGraph,
  activeTrace = null,
  selectedNodeId,
  onSelectNode
}) {
  const [viewDimension, setViewDimension] = useState('2D');
  const [scopeMode, setScopeMode] = useState('constellation'); // 'constellation' | 'ego' | 'subgraph'
  const [clusteringMode, setClusteringMode] = useState('Type'); // 'Type' | 'Community' | 'Domain' | 'None'
  const [metricMode, setMetricMode] = useState('Centrality'); // 'Centrality' | 'PageRank' | 'Degree' | 'Betweenness'
  const [entityTypeFilter, setEntityTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [zoom2D, setZoom2D] = useState(1);
  const [dragOffsets, setDragOffsets] = useState({});

  const canvas3DRef = useRef(null);
  const container3DRef = useRef(null);
  const svgRef = useRef(null);
  const dragStateRef = useRef(null);
  const hoveredIdRef = useRef(null);
  const selectedIdRef = useRef(selectedNodeId);

  const threeStateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    graphGroup: null,
    meshMap: new Map(),
    nodeMap: new Map(),
    lines: [],
    reqId: null
  });

  useEffect(() => {
    selectedIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  const entityTypes = useMemo(() => {
    const counts = new Map();
    (compiledGraph?.nodes || []).forEach((n) => {
      const t = n.node_type || 'entity';
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [compiledGraph]);

  // 1. Apply Live Clustering & Metric Recalculation via Enterprise Graph Engine
  const enrichedGraph = useMemo(() => {
    const rawNodes = (compiledGraph?.nodes || []).map((n) => ({ ...n, type: n.node_type }));
    const rawEdges = (compiledGraph?.edges || []).map((e) => ({
      ...e,
      source: e.source_id,
      target: e.target_id,
      type: e.relation
    }));
    return computeGraphMetrics(rawNodes, rawEdges, clusteringMode, metricMode);
  }, [compiledGraph, clusteringMode, metricMode]);

  // 2. Scope & Filter Visible Subgraph
  const visibleGraph = useMemo(() => {
    const allNodes = enrichedGraph.nodes;
    const allEdges = enrichedGraph.edges;
    if (allNodes.length === 0) return { nodes: [], edges: [] };

    let allowedIds = new Set();

    if (scopeMode === 'subgraph' && activeTrace?.rankedNodes?.length > 0) {
      activeTrace.rankedNodes.forEach((rn) => allowedIds.add(rn.id));
    } else if (scopeMode === 'ego' && selectedNodeId && enrichedGraph.nodeMap.has(selectedNodeId)) {
      allowedIds.add(selectedNodeId);
      const hop1 = new Set();
      allEdges.forEach((e) => {
        if (e.source === selectedNodeId) {
          allowedIds.add(e.target);
          hop1.add(e.target);
        } else if (e.target === selectedNodeId) {
          allowedIds.add(e.source);
          hop1.add(e.source);
        }
      });
      allEdges.forEach((e) => {
        if (hop1.has(e.source)) allowedIds.add(e.target);
        if (hop1.has(e.target)) allowedIds.add(e.source);
      });
    } else {
      // Full Constellation: take top 85 highest-centrality/PageRank entities for crisp visual clarity
      allNodes
        .slice()
        .sort((a, b) => (b.centrality || 0) - (a.centrality || 0))
        .slice(0, 85)
        .forEach((n) => allowedIds.add(n.id));
    }

    const q = searchQuery.trim().toLowerCase();
    const filteredNodes = allNodes.filter((n) => {
      if (q) {
        const hay = `${n.label} ${n.node_type} ${n.summary || ''} ${n.domain || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      } else if (!allowedIds.has(n.id)) {
        return false;
      }
      if (entityTypeFilter !== 'ALL' && n.node_type !== entityTypeFilter) return false;
      return true;
    });

    const visSet = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = allEdges.filter((e) => visSet.has(e.source) && visSet.has(e.target));

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [enrichedGraph, scopeMode, activeTrace, selectedNodeId, entityTypeFilter, searchQuery]);

  // 3. Deterministic Concentric Ring 2D Coordinates (Enterprise GraphRAG Studio Layout)
  const layout2D = useMemo(() => {
    const nodes = visibleGraph.nodes;
    if (nodes.length === 0) return { nodes: [], edges: [] };

    const cx = 420;
    const cy = 260;
    const ranked = nodes.slice().sort((a, b) => (b.centrality || 0) - (a.centrality || 0));

    const posMap = new Map();
    const positionedNodes = ranked.map((n, idx) => {
      let bx = cx;
      let by = cy;
      let ringTier = 2;

      if (idx === 0 || n.id === selectedNodeId) {
        bx = idx === 0 ? cx : cx + Math.cos(idx * 1.4) * 55;
        by = idx === 0 ? cy : cy + Math.sin(idx * 1.4) * 45;
        ringTier = 0;
      } else if (idx <= 12) {
        const angle = ((idx - 1) / Math.min(12, ranked.length - 1 || 1)) * Math.PI * 2 - Math.PI / 2;
        bx = cx + Math.cos(angle) * 125;
        by = cy + Math.sin(angle) * 102;
        ringTier = 1;
      } else if (idx <= 36) {
        const subIdx = idx - 13;
        const count = Math.min(24, Math.max(1, ranked.length - 13));
        const angle = (subIdx / count) * Math.PI * 2 + 0.25;
        bx = cx + Math.cos(angle) * 235;
        by = cy + Math.sin(angle) * 175;
        ringTier = 2;
      } else {
        const subIdx = idx - 37;
        const count = Math.max(1, ranked.length - 37);
        const angle = (subIdx / count) * Math.PI * 2 - 0.15;
        bx = cx + Math.cos(angle) * 340;
        by = cy + Math.sin(angle) * 228;
        ringTier = 3;
      }

      const off = dragOffsets[n.id] || { x: 0, y: 0 };
      const x = bx + off.x;
      const y = by + off.y;
      posMap.set(n.id, { x, y });
      return { ...n, x, y, ringTier };
    });

    const positionedEdges = visibleGraph.edges
      .map((e, i) => {
        const s = posMap.get(e.source);
        const t = posMap.get(e.target);
        if (!s || !t) return null;
        return {
          ...e,
          x1: s.x,
          y1: s.y,
          x2: t.x,
          y2: t.y,
          curveSign: i % 2 === 0 ? 1 : -1
        };
      })
      .filter(Boolean);

    return { nodes: positionedNodes, edges: positionedEdges };
  }, [visibleGraph, selectedNodeId, dragOffsets]);

  // 4. Deterministic 3D Fibonacci Lattice Sphere Positions
  const positions3D = useMemo(() => {
    const out = {};
    const nodes = visibleGraph.nodes;
    const total = nodes.length || 1;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const maxR = 165;

    nodes.forEach((n, i) => {
      if (i === 0 && nodes.length > 4) {
        out[n.id] = { x: 0, y: 0, z: 0 };
        return;
      }
      const y = 1 - (i / (total - 1 || 1)) * 2;
      const rAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const scale = maxR * (0.65 + (1 - (n.centrality || 0.3)) * 0.45);
      out[n.id] = {
        x: Math.cos(theta) * rAtY * scale,
        y: y * scale * 0.88,
        z: Math.sin(theta) * rAtY * scale
      };
    });
    return out;
  }, [visibleGraph.nodes]);

  const update3DStyles = useCallback(() => {
    const { meshMap, lines } = threeStateRef.current;
    const curHover = hoveredIdRef.current;
    const curSel = selectedIdRef.current;

    meshMap.forEach((mesh, id) => {
      const mat = mesh.material;
      if (!mat) return;
      const baseScale = mesh.userData.sphereR || 5;
      if (id === curSel) {
        mat.emissive.setHex(0x059669);
        mat.emissiveIntensity = 0.75;
        mesh.scale.setScalar(baseScale * 1.28);
      } else if (id === curHover) {
        mat.emissive.setHex(0x4f46e5);
        mat.emissiveIntensity = 0.45;
        mesh.scale.setScalar(baseScale * 1.15);
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
        mesh.scale.setScalar(baseScale);
      }
    });

    lines.forEach(({ line, source, target }) => {
      const mat = line.material;
      if (!mat) return;
      const active = source === curSel || target === curSel || source === curHover || target === curHover;
      mat.color.setHex(active ? 0x4f46e5 : 0xcbd5e1);
      mat.opacity = active ? 0.92 : 0.42;
    });
  }, []);

  // 5. Three.js 3D WebGL Renderer Lifecycle (only when viewDimension === '3D')
  useEffect(() => {
    if (viewDimension !== '3D') {
      if (threeStateRef.current.reqId) cancelAnimationFrame(threeStateRef.current.reqId);
      if (threeStateRef.current.controls) threeStateRef.current.controls.dispose();
      if (threeStateRef.current.scene) disposeHierarchy(threeStateRef.current.scene);
      if (threeStateRef.current.renderer) threeStateRef.current.renderer.dispose();
      threeStateRef.current = {
        renderer: null,
        scene: null,
        camera: null,
        controls: null,
        graphGroup: null,
        meshMap: new Map(),
        nodeMap: new Map(),
        lines: [],
        reqId: null
      };
      return;
    }

    const canvas = canvas3DRef.current;
    const container = container3DRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 760;
    const height = 470;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#fafafa');

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 2500);
    camera.position.set(0, 65, 410);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 90;
    controls.maxDistance = 950;

    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.3);
    dir1.position.set(220, 300, 220);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x94a3b8, 0.7);
    dir2.position.set(-200, -140, -180);
    scene.add(dir2);

    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    const meshMap = new Map();
    const nodeMap = new Map();
    const lines = [];

    visibleGraph.nodes.forEach((node) => {
      const pos = positions3D[node.id];
      if (!pos) return;
      nodeMap.set(node.id, node);
      const sphereR = Math.max(4.5, Math.min(13, (node.radius || 16) * 0.42));
      const colorHex = node.color ? parseInt(node.color.replace('#', '0x'), 16) : 0x4f46e5;
      const geo = new THREE.SphereGeometry(1, 28, 28);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.25, metalness: 0.15 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.scale.setScalar(sphereR);
      mesh.userData = { nodeId: node.id, sphereR };

      const sprite = createTextSprite(node.label, '#0f172a');
      sprite.position.set(pos.x, pos.y + sphereR + 9, pos.z);
      graphGroup.add(mesh);
      graphGroup.add(sprite);
      meshMap.set(node.id, mesh);
    });

    visibleGraph.edges.forEach((edge) => {
      const p1 = positions3D[edge.source];
      const p2 = positions3D[edge.target];
      if (!p1 || !p2) return;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p1.x, p1.y, p1.z),
        new THREE.Vector3(p2.x, p2.y, p2.z)
      ]);
      const mat = new THREE.LineBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.45 });
      const line = new THREE.Line(geo, mat);
      graphGroup.add(line);
      lines.push({ line, source: edge.source, target: edge.target });
    });

    threeStateRef.current = {
      renderer,
      scene,
      camera,
      controls,
      graphGroup,
      meshMap,
      nodeMap,
      lines,
      reqId: null
    };
    update3DStyles();

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (ev) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Array.from(meshMap.values()));
      if (hits.length > 0) {
        const id = hits[0].object.userData.nodeId;
        if (id && onSelectNode) onSelectNode(id);
      }
    };

    const onPointerMove = (ev) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Array.from(meshMap.values()));
      if (hits.length > 0) {
        canvas.style.cursor = 'pointer';
        const hitId = hits[0].object.userData.nodeId;
        if (hoveredIdRef.current !== hitId) {
          hoveredIdRef.current = hitId;
          setHoveredNodeId(hitId);
          update3DStyles();
        }
      } else {
        canvas.style.cursor = 'grab';
        if (hoveredIdRef.current !== null) {
          hoveredIdRef.current = null;
          setHoveredNodeId(null);
          update3DStyles();
        }
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      graphGroup.rotation.y += 0.0008;
      renderer.render(scene, camera);
    };
    animate();
    threeStateRef.current.reqId = animId;

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(animId);
      controls.dispose();
      disposeHierarchy(scene);
      renderer.dispose();
    };
  }, [viewDimension, visibleGraph, positions3D, onSelectNode, update3DStyles]);

  useEffect(() => {
    if (viewDimension === '3D') update3DStyles();
  }, [selectedNodeId, viewDimension, update3DStyles]);

  const selectedNode = useMemo(() => {
    return (
      enrichedGraph.nodeMap.get(selectedNodeId) ||
      visibleGraph.nodes[0] ||
      enrichedGraph.nodes[0] ||
      null
    );
  }, [enrichedGraph, visibleGraph.nodes, selectedNodeId]);

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];
    return enrichedGraph.edges
      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
      .map((e) => {
        const isOutgoing = e.source === selectedNode.id;
        const otherId = isOutgoing ? e.target : e.source;
        const otherNode = enrichedGraph.nodeMap.get(otherId);
        return {
          id: e.id,
          relation: e.relation,
          direction: isOutgoing ? 'OUT' : 'IN',
          neighbor: otherNode
        };
      })
      .filter((x) => x.neighbor)
      .slice(0, 18);
  }, [selectedNode, enrichedGraph]);

  const handleSvgPointerMove = (e) => {
    if (!dragStateRef.current || !svgRef.current) return;
    const { id, startX, startY, origX, origY } = dragStateRef.current;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = (840 / zoom2D) / (rect.width || 840);
    const scaleY = (520 / zoom2D) / (rect.height || 520);
    setDragOffsets((prev) => ({
      ...prev,
      [id]: {
        x: origX + (e.clientX - startX) * scaleX,
        y: origY + (e.clientY - startY) * scaleY
      }
    }));
  };

  const summary = enrichedGraph.summary;

  return (
    <div className="space-y-4">
      {/* Enterprise Topology Metrics Bar (Pic 3 Light Studio Aesthetic) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'ENTITIES', value: summary.nodeCount, sub: 'Graph Nodes', accent: 'text-indigo-700' },
          { label: 'EDGES', value: summary.edgeCount, sub: 'Typed Relations', accent: 'text-teal-700' },
          { label: 'COMMUNITIES', value: summary.communityCount, sub: 'Union-Find Clusters', accent: 'text-violet-700' },
          { label: 'DENSITY', value: summary.density, sub: 'Structural Ratio', accent: 'text-amber-700' },
          { label: 'TOP PAGERANK', value: summary.topPagerankLabel, sub: 'd=0.85 · 10 iters', accent: 'text-rose-700', small: true }
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 shadow-sm"
          >
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">
              {card.label}
            </span>
            <p className={`font-bold text-zinc-900 mt-0.5 truncate ${card.small ? 'text-xs' : 'text-lg font-mono'}`}>
              {card.value}
            </p>
            <span className="text-[10px] text-zinc-500 block truncate">{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Main Enterprise Studio Grid (Canvas + Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Enterprise Graph Controls + 2D/3D Interactive Viewport */}
        <div className="lg:col-span-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
          {/* Graph Controls Header (matches enterprise_graphrag_studio GraphControls) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* 2D vs 3D WebGL Sphere Switch */}
              <div className="inline-flex rounded-xl bg-zinc-100 p-0.5 border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setViewDimension('2D')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    viewDimension === '2D'
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Compass className="w-3 h-3" />
                  <span>2D Ring</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewDimension('3D')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    viewDimension === '3D'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Box className="w-3 h-3" />
                  <span>3D WebGL</span>
                </button>
              </div>

              {/* Scope Buttons */}
              {[
                { id: 'constellation', label: 'Full Network' },
                { id: 'ego', label: '2-Hop Ego' },
                { id: 'subgraph', label: `RRF Subgraph (${activeTrace?.rankedNodes?.length || 0})` }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScopeMode(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all border ${
                    scopeMode === s.id
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {viewDimension === '2D' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom2D((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
                  className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom2D((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
                  className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom2D(1);
                    setDragOffsets({});
                  }}
                  className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                  title="Reset Canvas"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Search, Type, Clustering & Metric Selectors (matching GraphControls.tsx) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entity (jacket, jeans, KRONOS15)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-700 font-medium outline-none"
              >
                <option value="ALL">Type: All ({enrichedGraph.nodes.length})</option>
                {entityTypes.map(([t, cnt]) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()} ({cnt})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={clusteringMode}
                onChange={(e) => setClusteringMode(e.target.value)}
                title="Color Clustering Algorithm"
                className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-700 font-medium outline-none"
              >
                <option value="Type">Cluster: Type</option>
                <option value="Community">Cluster: Community</option>
                <option value="Domain">Cluster: Domain</option>
                <option value="None">Cluster: Single</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={metricMode}
                onChange={(e) => setMetricMode(e.target.value)}
                title="Node Radius Metric"
                className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-700 font-medium outline-none"
              >
                <option value="Centrality">Metric: Composite Centrality</option>
                <option value="PageRank">Metric: PageRank (10 iter)</option>
                <option value="Betweenness">Metric: Brandes Betweenness</option>
                <option value="Degree">Metric: Node Degree</option>
              </select>
            </div>
          </div>

          {/* 2D or 3D Graph Canvas Surface (#fafafa clean Studio background from Pic 3) */}
          <div
            ref={container3DRef}
            className="rounded-xl border border-zinc-200 bg-[#fafafa] overflow-hidden relative h-[470px]"
          >
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-white/90 border border-zinc-200 text-[10px] font-mono text-zinc-600 shadow-xs pointer-events-none">
              {viewDimension === '3D'
                ? `3D WebGL Fibonacci Sphere · Drag to orbit, scroll to zoom · ${visibleGraph.nodes.length} nodes`
                : `2D Concentric Topology · Drag nodes, click to inspect · ${layout2D.nodes.length} nodes / ${layout2D.edges.length} edges`}
            </div>

            {viewDimension === '3D' ? (
              <canvas ref={canvas3DRef} className="w-full h-full block" />
            ) : (
              <svg
                ref={svgRef}
                viewBox={`${420 - 420 / zoom2D} ${260 - 260 / zoom2D} ${840 / zoom2D} ${520 / zoom2D}`}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={() => {
                  dragStateRef.current = null;
                }}
                onPointerLeave={() => {
                  dragStateRef.current = null;
                }}
                className="w-full h-full select-none touch-none"
              >
                <defs>
                  <pattern id="enterprise-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="#e4e4e7" />
                  </pattern>
                </defs>
                <rect x="-500" y="-500" width="2000" height="1600" fill="url(#enterprise-grid)" />
                <circle cx="420" cy="260" r="125" fill="none" stroke="#e4e4e7" strokeDasharray="4 4" />
                <circle cx="420" cy="260" r="235" fill="none" stroke="#e4e4e7" strokeDasharray="4 6" />
                <circle cx="420" cy="260" r="340" fill="none" stroke="#f4f4f5" strokeDasharray="4 8" />

                {/* Edges */}
                {layout2D.edges.map((e) => {
                  const isFocus =
                    e.source === selectedNode?.id ||
                    e.target === selectedNode?.id ||
                    e.source === hoveredNodeId ||
                    e.target === hoveredNodeId;
                  const dx = e.x2 - e.x1;
                  const dy = e.y2 - e.y1;
                  const dist = Math.hypot(dx, dy) || 1;
                  const mx = (e.x1 + e.x2) / 2 + (-dy / dist) * Math.min(26, dist * 0.12) * e.curveSign;
                  const my = (e.y1 + e.y2) / 2 + (dx / dist) * Math.min(26, dist * 0.12) * e.curveSign;
                  return (
                    <g key={e.id}>
                      <path
                        d={`M ${e.x1} ${e.y1} Q ${mx} ${my} ${e.x2} ${e.y2}`}
                        fill="none"
                        stroke={isFocus ? '#4f46e5' : '#cbd5e1'}
                        strokeWidth={isFocus ? 2 : 0.9}
                        strokeOpacity={isFocus ? 0.92 : 0.55}
                      />
                      {isFocus && (
                        <text
                          x={mx}
                          y={my - 4}
                          fill="#4338ca"
                          fontSize="7.5"
                          fontWeight="700"
                          textAnchor="middle"
                          className="font-mono pointer-events-none"
                        >
                          {e.relation}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {layout2D.nodes.map((n) => {
                  const r = Math.max(8, Math.min(24, (n.radius || 16) * 0.68));
                  const isSel = selectedNode?.id === n.id;
                  const isHov = hoveredNodeId === n.id;
                  const shortLabel = n.label.length > 18 ? `${n.label.slice(0, 16)}..` : n.label;
                  return (
                    <g
                      key={n.id}
                      className="cursor-pointer"
                      onPointerDown={(ev) => {
                        ev.stopPropagation();
                        const prev = dragOffsets[n.id] || { x: 0, y: 0 };
                        dragStateRef.current = {
                          id: n.id,
                          startX: ev.clientX,
                          startY: ev.clientY,
                          origX: prev.x,
                          origY: prev.y
                        };
                        if (onSelectNode) onSelectNode(n.id);
                      }}
                      onPointerEnter={() => setHoveredNodeId(n.id)}
                      onPointerLeave={() => setHoveredNodeId(null)}
                    >
                      {(isSel || isHov) && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={r + 5}
                          fill="none"
                          stroke={isSel ? '#059669' : '#4f46e5'}
                          strokeWidth="2"
                        />
                      )}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={r}
                        fill={n.color}
                        stroke="#ffffff"
                        strokeWidth={isSel ? 2.5 : 1.5}
                      />
                      {(r >= 13 || isSel || isHov || n.ringTier <= 1) && (
                        <text
                          x={n.x}
                          y={n.y + r + 11}
                          fill="#0f172a"
                          fontSize="9"
                          fontWeight={isSel ? '800' : '600'}
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {shortLabel}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Entity Topological Inspector (matching Pic 3 Right Pane) */}
        <div className="lg:col-span-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col h-[595px]">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-zinc-900">Entity Topology Inspector</h4>
            </div>
            {selectedNode && (
              <span
                className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full text-white font-bold"
                style={{ backgroundColor: selectedNode.color || '#4f46e5' }}
              >
                {selectedNode.node_type}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="flex-1 overflow-y-auto pt-3 space-y-4">
              <div>
                <h5 className="font-bold text-base text-zinc-900 leading-snug">{selectedNode.label}</h5>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5 truncate">{selectedNode.id}</p>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed bg-zinc-50 border border-zinc-200/80 rounded-xl p-2.5">
                  {selectedNode.summary || 'Enterprise Knowledge Graph entity node.'}
                </p>
              </div>

              {/* Structural Algorithm Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/70">
                  <span className="text-[9px] font-mono uppercase text-indigo-700 font-bold block">
                    PageRank (d=0.85)
                  </span>
                  <span className="font-mono font-extrabold text-sm text-zinc-900">
                    {selectedNode.pagerank}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/70">
                  <span className="text-[9px] font-mono uppercase text-teal-700 font-bold block">
                    Betweenness
                  </span>
                  <span className="font-mono font-extrabold text-sm text-zinc-900">
                    {selectedNode.betweenness}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                  <span className="text-[9px] font-mono uppercase text-amber-800 font-bold block">
                    Degree / Edges
                  </span>
                  <span className="font-mono font-extrabold text-sm text-zinc-900">
                    {selectedNode.degree} links
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70">
                  <span className="text-[9px] font-mono uppercase text-rose-800 font-bold block">
                    Cluster Domain
                  </span>
                  <span className="font-bold text-[11px] text-zinc-900 block truncate mt-0.5">
                    {selectedNode.domain}
                  </span>
                </div>
              </div>

              {/* Clickable Adjacency Paths */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-indigo-600" />
                    Semantic Neighbors ({selectedConnections.length})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Comm #{selectedNode.community}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {selectedConnections.map((conn) => (
                    <button
                      key={conn.id}
                      type="button"
                      onClick={() => onSelectNode && onSelectNode(conn.neighbor.id)}
                      className="w-full text-left p-2 rounded-xl border border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] text-indigo-700 font-bold block">
                          {conn.direction === 'OUT' ? '→' : '←'} {conn.relation}
                        </span>
                        <span className="text-xs font-semibold text-zinc-900 truncate block">
                          {conn.neighbor.label}
                        </span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-400 p-6">
              <Layers className="w-8 h-8 mb-2" />
              <p className="text-xs">Select any entity in the 2D Ring or 3D Sphere to inspect metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

