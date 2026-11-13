/**
 * Pure-JavaScript CPU 3D Z-buffer rasterizer for Three.js GLTF human avatar scenes.
 *
 * Used automatically whenever the browser refuses WebGL2 context creation
 * (e.g. Chromium/Brave GPU process crashes on Linux) so users still see and
 * interact with the real 3D human `.glb` models, garments, lighting, skin
 * tones, and 360-degree camera orbit without any WebGL dependency.
 */

function parseHexToRgb01(hex) {
  let num = 0xffffff;
  if (typeof hex === 'number' && Number.isFinite(hex)) {
    num = hex >>> 0;
  } else if (typeof hex === 'string') {
    const cleaned = hex.trim().replace(/^#+/, '');
    const parsed = Number.parseInt(cleaned, 16);
    if (Number.isFinite(parsed)) num = parsed;
  }
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

function classifyMeshKind(meshName, matName) {
  const n = (meshName || '').toLowerCase();
  const m = (matName || '').toLowerCase();
  if (n.startsWith('garment_')) return 'garment';
  if (n.includes('eyelash') || m.includes('eyelash')) return 'eyelash';
  if (
    n.includes('eye') ||
    m.includes('iris') ||
    m.includes('pupil') ||
    m.includes('human_eyes') ||
    m.includes('cornea') ||
    m.includes('sclera')
  ) {
    return 'eyes';
  }
  if (n.includes('hair') || m.includes('hair')) return 'hair';
  if (
    m.includes('mblab_skin') ||
    m.includes('mblab_generic') ||
    m.includes('skin') ||
    n.includes('body') ||
    n.includes('human') ||
    n.includes('female') ||
    n.includes('male')
  ) {
    return 'skin';
  }
  return 'body_other';
}

function sampleMaterialTexture(material) {
  const img = material?.map?.image;
  if (!img || typeof document === 'undefined') return null;
  const rawW = img.naturalWidth || img.videoWidth || img.width || 0;
  const rawH = img.naturalHeight || img.videoHeight || img.height || 0;
  if (!rawW || !rawH) return null;

  const size = 256;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    return { width: size, height: size, pixels: data, flipY: Boolean(material?.map?.flipY) };
  } catch {
    return null;
  }
}

function computeSmoothNormals(positions, indices, triCount) {
  const normals = new Float32Array(positions.length);
  for (let t = 0; t < triCount; t++) {
    const i0 = indices ? indices[t * 3] : t * 3;
    const i1 = indices ? indices[t * 3 + 1] : t * 3 + 1;
    const i2 = indices ? indices[t * 3 + 2] : t * 3 + 2;

    const p0 = i0 * 3;
    const p1 = i1 * 3;
    const p2 = i2 * 3;

    const ax = positions[p1] - positions[p0];
    const ay = positions[p1 + 1] - positions[p0 + 1];
    const az = positions[p1 + 2] - positions[p0 + 2];

    const bx = positions[p2] - positions[p0];
    const by = positions[p2 + 1] - positions[p0 + 1];
    const bz = positions[p2 + 2] - positions[p0 + 2];

    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    normals[p0] += nx;
    normals[p0 + 1] += ny;
    normals[p0 + 2] += nz;
    normals[p1] += nx;
    normals[p1 + 1] += ny;
    normals[p1 + 2] += nz;
    normals[p2] += nx;
    normals[p2 + 1] += ny;
    normals[p2 + 2] += nz;
  }

  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= len;
    normals[i + 1] /= len;
    normals[i + 2] /= len;
  }
  return normals;
}

/**
 * Extracts baked world-space geometry, normals, UVs, and small RGBA texture
 * maps from a loaded GLTF scene for zero-WebGL CPU 3D rendering.
 */
export function extractSoftwareSceneData(gltfScene) {
  if (!gltfScene) return null;
  gltfScene.updateMatrixWorld(true);

  const rawMeshes = [];
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  gltfScene.traverse((child) => {
    if (!child?.isMesh || !child.geometry?.attributes?.position) return;
    const geom = child.geometry;
    const posAttr = geom.attributes.position;
    const normAttr = geom.attributes.normal;
    const uvAttr = geom.attributes.uv;
    const mat = Array.isArray(child.material) ? child.material[0] : child.material;

    const vertexCount = posAttr.count;
    const positions = new Float32Array(vertexCount * 3);
    const mw = child.matrixWorld.elements;

    for (let i = 0; i < vertexCount; i++) {
      const lx = posAttr.getX(i);
      const ly = posAttr.getY(i);
      const lz = posAttr.getZ(i);

      const wx = mw[0] * lx + mw[4] * ly + mw[8] * lz + mw[12];
      const wy = mw[1] * lx + mw[5] * ly + mw[9] * lz + mw[13];
      const wz = mw[2] * lx + mw[6] * ly + mw[10] * lz + mw[14];

      const off = i * 3;
      positions[off] = wx;
      positions[off + 1] = wy;
      positions[off + 2] = wz;

      if (wx < minX) minX = wx;
      if (wy < minY) minY = wy;
      if (wz < minZ) minZ = wz;
      if (wx > maxX) maxX = wx;
      if (wy > maxY) maxY = wy;
      if (wz > maxZ) maxZ = wz;
    }

    let indices = null;
    if (geom.index) {
      indices = geom.index.array;
    }
    const triCount = indices ? Math.floor(indices.length / 3) : Math.floor(vertexCount / 3);

    let normals;
    if (normAttr && normAttr.count === vertexCount) {
      normals = new Float32Array(vertexCount * 3);
      // Extract 3x3 upper-left normal transform (transpose-inverse approximation; uniform scale safe)
      for (let i = 0; i < vertexCount; i++) {
        const lnx = normAttr.getX(i);
        const lny = normAttr.getY(i);
        const lnz = normAttr.getZ(i);
        const wnx = mw[0] * lnx + mw[4] * lny + mw[8] * lnz;
        const wny = mw[1] * lnx + mw[5] * lny + mw[9] * lnz;
        const wnz = mw[2] * lnx + mw[6] * lny + mw[10] * lnz;
        const len = Math.hypot(wnx, wny, wnz) || 1;
        const off = i * 3;
        normals[off] = wnx / len;
        normals[off + 1] = wny / len;
        normals[off + 2] = wnz / len;
      }
    } else {
      normals = computeSmoothNormals(positions, indices, triCount);
    }

    let uvs = null;
    if (uvAttr && uvAttr.count === vertexCount) {
      uvs = new Float32Array(vertexCount * 2);
      for (let i = 0; i < vertexCount; i++) {
        uvs[i * 2] = uvAttr.getX(i);
        uvs[i * 2 + 1] = uvAttr.getY(i);
      }
    }

    const baseColor = mat?.color
      ? [mat.color.r, mat.color.g, mat.color.b]
      : [0.85, 0.85, 0.85];

    rawMeshes.push({
      name: child.name || 'mesh',
      materialName: mat?.name || '',
      kind: classifyMeshKind(child.name, mat?.name),
      vertexCount,
      triCount,
      positions,
      normals,
      uvs,
      indices,
      baseColor,
      texture: sampleMaterialTexture(mat),
      doubleSided: Boolean(mat?.side === 2),
      projX: new Float32Array(vertexCount),
      projY: new Float32Array(vertexCount),
      projZ: new Float32Array(vertexCount),
      litR: new Float32Array(vertexCount),
      litG: new Float32Array(vertexCount),
      litB: new Float32Array(vertexCount),
    });
  });

  if (!rawMeshes.length || !Number.isFinite(minY)) return null;

  const rawHeight = Math.max(0.001, maxY - minY);
  const cx = (minX + maxX) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  const unitScale = 1.75 / rawHeight;

  // Normalize all meshes so feet stand at y = 0 and total height is ~1.75m
  for (const mesh of rawMeshes) {
    const pos = mesh.positions;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] = (pos[i] - cx) * unitScale;
      pos[i + 1] = (pos[i + 1] - minY) * unitScale;
      pos[i + 2] = (pos[i + 2] - cz) * unitScale;
    }
  }

  return {
    meshes: rawMeshes,
    baseHeight: 1.75,
  };
}

/**
 * Reusable CPU framebuffer holder to prevent typed-array allocation churn
 * during interactive 360-degree dragging and auto-rotation.
 */
export function createSoftwareFrameBuffers() {
  return {
    width: 0,
    height: 0,
    zBuf: null,
    colorBuf: null,
    imageData: null,
    offscreenCanvas: null,
    offscreenCtx: null,
  };
}

function ensureFrameBuffers(buffers, targetW, targetH) {
  if (
    buffers.width === targetW &&
    buffers.height === targetH &&
    buffers.zBuf &&
    buffers.colorBuf &&
    buffers.offscreenCtx
  ) {
    return buffers;
  }

  const pixelCount = targetW * targetH;
  buffers.width = targetW;
  buffers.height = targetH;
  buffers.zBuf = new Float32Array(pixelCount);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(targetW, targetH);

  buffers.offscreenCanvas = canvas;
  buffers.offscreenCtx = ctx;
  buffers.imageData = imageData;
  buffers.colorBuf = new Uint32Array(imageData.data.buffer);
  return buffers;
}

function getLightingPalette(lightingMode, lightingPreset) {
  if (lightingMode === 'runway' || lightingMode === 'dark') {
    return {
      bgTop: [16, 17, 22],
      bgBot: [24, 26, 34],
      ambientR: 0.34,
      ambientG: 0.36,
      ambientB: 0.42,
      keyIntensity: 0.90,
      rimIntensity: 0.34,
      podiumRim: [234, 48, 31],
      podiumFill: [26, 27, 34],
    };
  }
  if (lightingMode === 'warm') {
    return {
      bgTop: [27, 23, 21],
      bgBot: [38, 31, 26],
      ambientR: 0.38,
      ambientG: 0.34,
      ambientB: 0.30,
      keyIntensity: 0.88,
      rimIntensity: 0.32,
      podiumRim: [212, 175, 55],
      podiumFill: [38, 32, 28],
    };
  }
  // Default Zara Studio (atelier) editorial daylight
  const bg = parseHexToRgb01(lightingPreset?.bgColor ?? 0xf4f4f1);
  return {
    bgTop: [Math.round(bg[0] * 255), Math.round(bg[1] * 255), Math.round(bg[2] * 255)],
    bgBot: [Math.round(bg[0] * 238), Math.round(bg[1] * 238), Math.round(bg[2] * 241)],
    ambientR: 0.42,
    ambientG: 0.42,
    ambientB: 0.44,
    keyIntensity: 0.86,
    rimIntensity: 0.24,
    podiumRim: [95, 95, 102],
    podiumFill: [222, 222, 218],
  };
}

function packAbgr(r, g, b, a = 255) {
  const cr = r < 0 ? 0 : r > 255 ? 255 : r | 0;
  const cg = g < 0 ? 0 : g > 255 ? 255 : g | 0;
  const cb = b < 0 ? 0 : b > 255 ? 255 : b | 0;
  return ((a & 255) << 24) | (cb << 16) | (cg << 8) | cr;
}

function drawBackgroundAndPodium(buffers, cosPitch, sinPitch, focalLen, halfW, halfH, targetY, zoomDist, palette) {
  const { width, height, colorBuf, zBuf } = buffers;
  zBuf.fill(Infinity);

  // Clean vertical editorial studio backdrop gradient
  for (let y = 0; y < height; y++) {
    const t = y / Math.max(1, height - 1);
    const r = palette.bgTop[0] + (palette.bgBot[0] - palette.bgTop[0]) * t;
    const g = palette.bgTop[1] + (palette.bgBot[1] - palette.bgTop[1]) * t;
    const b = palette.bgTop[2] + (palette.bgBot[2] - palette.bgTop[2]) * t;
    const rowCol = packAbgr(r, g, b);
    const rowStart = y * width;
    colorBuf.fill(rowCol, rowStart, rowStart + width);
  }

  // Project subtle 3D architectural floor ring at y = 0
  const fillCol = packAbgr(palette.podiumFill[0], palette.podiumFill[1], palette.podiumFill[2]);
  const rimCol = packAbgr(palette.podiumRim[0], palette.podiumRim[1], palette.podiumRim[2]);
  const steps = 64;
  const radius = 0.72;

  for (let s = 0; s < steps; s++) {
    const a0 = (s / steps) * Math.PI * 2;
    const a1 = ((s + 1) / steps) * Math.PI * 2;
    const x0 = Math.cos(a0) * radius;
    const z0 = Math.sin(a0) * radius;
    const x1 = Math.cos(a1) * radius;
    const z1 = Math.sin(a1) * radius;

    // Project floor point (x, 0, z) around target (0, targetY, 0)
    const py0 = -targetY;
    const vy0 = py0 * cosPitch - z0 * sinPitch;
    const vz0 = zoomDist - (py0 * sinPitch + z0 * cosPitch);

    const vy1 = py0 * cosPitch - z1 * sinPitch;
    const vz1 = zoomDist - (py0 * sinPitch + z1 * cosPitch);

    if (vz0 <= 0.2 || vz1 <= 0.2) continue;

    const sx0 = Math.round(halfW + (x0 / vz0) * focalLen);
    const sy0 = Math.round(halfH - (vy0 / vz0) * focalLen);
    const sx1 = Math.round(halfW + (x1 / vz1) * focalLen);
    const sy1 = Math.round(halfH - (vy1 / vz1) * focalLen);

    // Subtle rim dots around podium edge
    const segSteps = Math.max(1, Math.max(Math.abs(sx1 - sx0), Math.abs(sy1 - sy0)));
    for (let k = 0; k <= segSteps; k++) {
      const f = k / segSteps;
      const px = Math.round(sx0 + (sx1 - sx0) * f);
      const py = Math.round(sy0 + (sy1 - sy0) * f);
      const pz = vz0 + (vz1 - vz0) * f;
      if (px >= 0 && px < width && py >= 0 && py < height && pz < zBuf[py * width + px]) {
        zBuf[py * width + px] = pz;
        colorBuf[py * width + px] = rimCol;
      }
    }
  }

  // Soft contact shadow disk right beneath avatar feet
  const footDepth = Math.max(0.4, zoomDist - (-targetY * sinPitch));
  const footCenterY = Math.round(halfH - ((-targetY * cosPitch) / footDepth) * focalLen);
  const footRadiusX = Math.round((0.36 / zoomDist) * focalLen);
  const footRadiusY = Math.max(3, Math.round(footRadiusX * Math.max(0.18, Math.abs(sinPitch) + 0.14)));
  for (let dy = -footRadiusY; dy <= footRadiusY; dy++) {
    const py = footCenterY + dy;
    if (py < 0 || py >= height) continue;
    const normY = dy / footRadiusY;
    const spanX = Math.floor(footRadiusX * Math.sqrt(Math.max(0, 1 - normY * normY)));
    for (let dx = -spanX; dx <= spanX; dx++) {
      const px = Math.round(halfW + dx);
      if (px < 0 || px >= width) continue;
      const dist = Math.hypot(dx / footRadiusX, dy / footRadiusY);
      if (dist <= 1) {
        const idx = py * width + px;
        if (dist > 0.85) {
          colorBuf[idx] = fillCol;
        } else {
          // Gentle contact occlusion near shoes
          const c = colorBuf[idx];
          const shade = 0.82 + dist * 0.18;
          const r = (c & 255) * shade;
          const g = ((c >> 8) & 255) * shade;
          const b = ((c >> 16) & 255) * shade;
          colorBuf[idx] = packAbgr(r, g, b);
        }
      }
    }
  }
}

function getMeshTintAndFlags(mesh, skinToneRgb, visibleGarments) {
  if (mesh.kind === 'garment') {
    const entry = visibleGarments?.[mesh.name];
    if (!entry) return null;
    const rgb = parseHexToRgb01(entry.hex ?? entry);
    return {
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
      useTexture: false,
      texBlend: 0,
      rimScale: 0.45,
      doubleSided: true,
    };
  }
  if (mesh.kind === 'skin') {
    return {
      r: skinToneRgb[0],
      g: skinToneRgb[1],
      b: skinToneRgb[2],
      useTexture: Boolean(mesh.texture),
      texBlend: mesh.texture ? 0.38 : 0,
      multiplySkinTex: true,
      rimScale: 0.35,
      doubleSided: mesh.doubleSided,
    };
  }
  if (mesh.kind === 'eyelash') {
    return {
      r: 0.10,
      g: 0.08,
      b: 0.08,
      useTexture: false,
      texBlend: 0,
      rimScale: 0.08,
      doubleSided: true,
    };
  }
  if (mesh.kind === 'eyes') {
    return {
      r: 0.94,
      g: 0.94,
      b: 0.94,
      useTexture: Boolean(mesh.texture),
      texBlend: 0.95,
      rimScale: 0.25,
      doubleSided: mesh.doubleSided,
    };
  }
  // Hair or other body detail (dark natural sheen so hair reads rich, never washed grey)
  return {
    r: mesh.baseColor[0] * 0.52,
    g: mesh.baseColor[1] * 0.48,
    b: mesh.baseColor[2] * 0.45,
    useTexture: Boolean(mesh.texture),
    texBlend: mesh.texture ? 0.65 : 0,
    rimScale: 0.14,
    doubleSided: mesh.doubleSided || mesh.kind === 'hair',
  };
}

function rasterizeTriangleGouraud(
  width,
  height,
  zBuf,
  colorBuf,
  x0,
  y0,
  z0,
  r0,
  g0,
  b0,
  x1,
  y1,
  z1,
  r1,
  g1,
  b1,
  x2,
  y2,
  z2,
  r2,
  g2,
  b2
) {
  // Sort vertices vertically (y0 <= y1 <= y2)
  if (y0 > y1) {
    [x0, x1] = [x1, x0];
    [y0, y1] = [y1, y0];
    [z0, z1] = [z1, z0];
    [r0, r1] = [r1, r0];
    [g0, g1] = [g1, g0];
    [b0, b1] = [b1, b0];
  }
  if (y1 > y2) {
    [x1, x2] = [x2, x1];
    [y1, y2] = [y2, y1];
    [z1, z2] = [z2, z1];
    [r1, r2] = [r2, r1];
    [g1, g2] = [g2, g1];
    [b1, b2] = [b2, b1];
  }
  if (y0 > y1) {
    [x0, x1] = [x1, x0];
    [y0, y1] = [y1, y0];
    [z0, z1] = [z1, z0];
    [r0, r1] = [r1, r0];
    [g0, g1] = [g1, g0];
    [b0, b1] = [b1, b0];
  }

  const iy0 = Math.ceil(y0);
  const iy2 = Math.floor(y2);
  if (iy2 < 0 || iy0 >= height || iy2 < iy0) return;

  const totalH = y2 - y0;
  if (totalH < 0.01) return;

  const startY = iy0 < 0 ? 0 : iy0;
  const endY = iy2 >= height ? height - 1 : iy2;
  const upperH = y1 - y0;
  const lowerH = y2 - y1;

  for (let y = startY; y <= endY; y++) {
    const tLong = (y - y0) / totalH;
    let lx = x0 + (x2 - x0) * tLong;
    let lz = z0 + (z2 - z0) * tLong;
    let lr = r0 + (r2 - r0) * tLong;
    let lg = g0 + (g2 - g0) * tLong;
    let lb = b0 + (b2 - b0) * tLong;

    let rx;
    let rz;
    let rr;
    let rg;
    let rb;

    if (y < y1) {
      if (upperH < 0.001) continue;
      const tShort = (y - y0) / upperH;
      rx = x0 + (x1 - x0) * tShort;
      rz = z0 + (z1 - z0) * tShort;
      rr = r0 + (r1 - r0) * tShort;
      rg = g0 + (g1 - g0) * tShort;
      rb = b0 + (b1 - b0) * tShort;
    } else {
      if (lowerH < 0.001) {
        rx = x1;
        rz = z1;
        rr = r1;
        rg = g1;
        rb = b1;
      } else {
        const tShort = (y - y1) / lowerH;
        rx = x1 + (x2 - x1) * tShort;
        rz = z1 + (z2 - z1) * tShort;
        rr = r1 + (r2 - r1) * tShort;
        rg = g1 + (g2 - g1) * tShort;
        rb = b1 + (b2 - b1) * tShort;
      }
    }

    if (lx > rx) {
      [lx, rx] = [rx, lx];
      [lz, rz] = [rz, lz];
      [lr, rr] = [rr, lr];
      [lg, rg] = [rg, lg];
      [lb, rb] = [rb, lb];
    }

    const startX = Math.max(0, Math.ceil(lx));
    const endX = Math.min(width - 1, Math.floor(rx));
    if (endX < startX) continue;

    const span = rx - lx;
    const invSpan = span > 0.001 ? 1 / span : 0;
    const dz = (rz - lz) * invSpan;
    const dr = (rr - lr) * invSpan;
    const dg = (rg - lg) * invSpan;
    const db = (rb - lb) * invSpan;

    const pre = startX - lx;
    let pz = lz + dz * pre;
    let pr = lr + dr * pre;
    let pg = lg + dg * pre;
    let pb = lb + db * pre;

    const rowOffset = y * width;
    for (let x = startX; x <= endX; x++) {
      const idx = rowOffset + x;
      if (pz < zBuf[idx]) {
        zBuf[idx] = pz;
        colorBuf[idx] = packAbgr(pr, pg, pb);
      }
      pz += dz;
      pr += dr;
      pg += dg;
      pb += db;
    }
  }
}

/**
 * Renders one full interactive 3D frame from `sceneData` into the visible `<canvas>`.
 */
export function renderSoftware3DFrame({
  canvas,
  buffers,
  sceneData,
  options,
}) {
  if (!canvas || !buffers || !sceneData?.meshes?.length) return false;

  const rect = canvas.getBoundingClientRect();
  const displayW = Math.max(320, Math.round(rect.width || canvas.clientWidth || 720));
  const displayH = Math.max(360, Math.round(rect.height || canvas.clientHeight || 720));
  if (canvas.width !== displayW || canvas.height !== displayH) {
    canvas.width = displayW;
    canvas.height = displayH;
  }

  // Cap internal raster buffer resolution (~0.72x max 620px tall) for crisp ~60fps CPU drag
  const renderScale = Math.min(1, 620 / displayH);
  const w = Math.max(240, Math.round(displayW * renderScale));
  const h = Math.max(280, Math.round(displayH * renderScale));
  ensureFrameBuffers(buffers, w, h);

  const {
    lightingMode = 'atelier',
    lightingPreset = null,
    skinToneHex = '#d4a383',
    isDefaultSkin = true,
    heightCm = 175,
    baseHeight = 175,
    bodyBuild = 1.0,
    selectedSize = 'M',
    yaw = 0.5,
    pitch = 0.06,
    zoomDist = 3.16,
    visibleGarments = {},
  } = options || {};

  const palette = getLightingPalette(lightingMode, lightingPreset);
  const skinToneRgb = parseHexToRgb01(skinToneHex);

  const sizeMultiplierMap = { XS: 0.985, S: 0.995, M: 1.0, L: 1.015, XL: 1.03, '32': 0.99, '34': 0.995, '36': 1.0, '38': 1.01, '40': 1.02, '42': 1.03, '44': 1.045, '46': 1.06 };
  const garmentEase = sizeMultiplierMap[String(selectedSize || 'M').toUpperCase()] || 1.0;

  const heightScale = Math.max(0.84, Math.min(1.18, Number(heightCm || baseHeight) / (baseHeight || 175)));
  const widthScale = Math.max(0.84, Math.min(1.22, Number(bodyBuild || 1.0)));

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const fovRad = (38 * Math.PI) / 180;
  const focalLen = (h * 0.5) / Math.tan(fovRad * 0.5);
  const halfW = w * 0.5;
  const halfH = h * 0.5;
  const targetY = 0.92 * heightScale;

  drawBackgroundAndPodium(buffers, cosP, sinP, focalLen, halfW, halfH, targetY, zoomDist, palette);

  // Normalized key & rim light directions in view space so avatar stays softly sculpted
  const kx = 0.44;
  const ky = 0.66;
  const kz = 0.61;
  const rx = -0.62;
  const ry = 0.35;
  const rz = -0.7;

  const { zBuf, colorBuf } = buffers;

  for (let m = 0; m < sceneData.meshes.length; m++) {
    const mesh = sceneData.meshes[m];
    const tint = getMeshTintAndFlags(mesh, skinToneRgb, visibleGarments);
    if (!tint) continue;

    const ease = mesh.kind === 'garment' ? garmentEase : 1.0;
    const sx = widthScale * ease;
    const sy = heightScale;
    const sz = widthScale * ease;

    const {
      vertexCount,
      triCount,
      positions,
      normals,
      uvs,
      indices,
      texture,
      projX,
      projY,
      projZ,
      litR,
      litG,
      litB,
    } = mesh;

    const texW = texture ? texture.width : 0;
    const texH = texture ? texture.height : 0;
    const texPx = texture ? texture.pixels : null;
    const texFlipY = texture ? Boolean(texture.flipY) : false;
    const useTex = tint.useTexture && texPx && uvs;
    const blend = tint.multiplySkinTex ? (isDefaultSkin ? 0.92 : 0.42) : tint.texBlend;

    // 1. Transform & shade vertices once per mesh
    for (let v = 0; v < vertexCount; v++) {
      const pOff = v * 3;
      const px = positions[pOff] * sx;
      const py = positions[pOff + 1] * sy - targetY;
      const pz = positions[pOff + 2] * sz;

      // Y-axis orbit rotation (camera around avatar)
      const rx1 = px * cosY - pz * sinY;
      const rz1 = px * sinY + pz * cosY;

      // X-axis pitch tilt + camera forward distance (+Z faces camera -> closer depth is smaller)
      const vy = py * cosP - rz1 * sinP;
      const camZ = py * sinP + rz1 * cosP;
      const vz = zoomDist - camZ;

      projZ[v] = vz;
      if (vz > 0.15) {
        const invZ = focalLen / vz;
        projX[v] = halfW + rx1 * invZ;
        projY[v] = halfH - vy * invZ;
      } else {
        projX[v] = -9999;
        projY[v] = -9999;
      }

      // Rotate normal with model (inverse-transpose scaling omitted for tiny anisotropy; re-normalize)
      const nx = normals[pOff];
      const ny = normals[pOff + 1];
      const nz = normals[pOff + 2];

      const rnx = nx * cosY - nz * sinY;
      const rnz = nx * sinY + nz * cosY;
      const vny = ny * cosP - rnz * sinP;
      const vnz = ny * sinP + rnz * cosP;

      const ndlKey = Math.max(0, rnx * kx + vny * ky + vnz * kz);
      const ndlFill = Math.max(0, -rnx * 0.65 + vny * 0.25 + vnz * 0.72);
      const ndlRim = Math.max(0, rnx * rx + vny * ry + vnz * rz);
      const rimScale = tint.rimScale ?? 0.35;
      const fresnelRim = Math.pow(Math.max(0, 1 - Math.abs(vnz)), 2.4) * rimScale;

      const lightR = palette.ambientR * 1.12 + ndlKey * palette.keyIntensity + ndlFill * 0.24 + ndlRim * palette.rimIntensity + fresnelRim * 0.45;
      const lightG = palette.ambientG * 1.12 + ndlKey * palette.keyIntensity + ndlFill * 0.24 + ndlRim * palette.rimIntensity + fresnelRim * 0.45;
      const lightB = palette.ambientB * 1.12 + ndlKey * palette.keyIntensity * 0.96 + ndlFill * 0.25 + ndlRim * palette.rimIntensity + fresnelRim * 0.50;

      let baseR = tint.r;
      let baseG = tint.g;
      let baseB = tint.b;

      if (useTex) {
        let u = uvs[v * 2] % 1;
        let vv = uvs[v * 2 + 1] % 1;
        if (u < 0) u += 1;
        if (vv < 0) vv += 1;
        const sampledV = texFlipY ? 1 - vv : vv;
        const tx = Math.min(texW - 1, Math.floor(u * texW));
        const ty = Math.min(texH - 1, Math.floor(sampledV * texH));
        const tIdx = (ty * texW + tx) * 4;
        const tr = texPx[tIdx] / 255;
        const tg = texPx[tIdx + 1] / 255;
        const tb = texPx[tIdx + 2] / 255;
        if (tint.multiplySkinTex) {
          // Preserve facial contours/lips/brows from skin texture while faithfully tracking selected skin tone
          const luma = 0.299 * tr + 0.587 * tg + 0.114 * tb;
          const detailGain = Math.max(0.55, Math.min(1.38, luma / 0.48));
          const texWeight = isDefaultSkin ? 0.48 : 0.30;
          baseR = baseR * (1 - texWeight) + Math.min(1, tint.r * detailGain) * texWeight;
          baseG = baseG * (1 - texWeight) + Math.min(1, tint.g * detailGain) * texWeight;
          baseB = baseB * (1 - texWeight) + Math.min(1, tint.b * detailGain) * texWeight;
        } else {
          baseR = baseR * (1 - blend) + tr * blend;
          baseG = baseG * (1 - blend) + tg * blend;
          baseB = baseB * (1 - blend) + tb * blend;
        }
      }

      litR[v] = Math.min(255, Math.pow(Math.max(0, baseR * lightR), 0.9) * 255);
      litG[v] = Math.min(255, Math.pow(Math.max(0, baseG * lightG), 0.9) * 255);
      litB[v] = Math.min(255, Math.pow(Math.max(0, baseB * lightB), 0.9) * 255);
    }

    // 2. Rasterize front-facing triangles into the Z-buffer
    const cullBack = !tint.doubleSided;
    for (let t = 0; t < triCount; t++) {
      const i0 = indices ? indices[t * 3] : t * 3;
      const i1 = indices ? indices[t * 3 + 1] : t * 3 + 1;
      const i2 = indices ? indices[t * 3 + 2] : t * 3 + 2;

      const z0 = projZ[i0];
      const z1 = projZ[i1];
      const z2 = projZ[i2];
      if (z0 <= 0.25 || z1 <= 0.25 || z2 <= 0.25) continue;

      const x0 = projX[i0];
      const y0 = projY[i0];
      const x1 = projX[i1];
      const y1 = projY[i1];
      const x2 = projX[i2];
      const y2 = projY[i2];

      // Screen-space signed area (Y-down coordinates: counter-clockwise in 3D projects to negative 2D winding)
      const area2 = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
      if (cullBack && area2 >= -0.001) continue;
      if (!cullBack && Math.abs(area2) < 0.001) continue;

      // Bounding box trivial reject
      const minBx = x0 < x1 ? (x0 < x2 ? x0 : x2) : (x1 < x2 ? x1 : x2);
      const maxBx = x0 > x1 ? (x0 > x2 ? x0 : x2) : (x1 > x2 ? x1 : x2);
      if (maxBx < 0 || minBx >= w) continue;

      const minBy = y0 < y1 ? (y0 < y2 ? y0 : y2) : (y1 < y2 ? y1 : y2);
      const maxBy = y0 > y1 ? (y0 > y2 ? y0 : y2) : (y1 > y2 ? y1 : y2);
      if (maxBy < 0 || minBy >= h) continue;

      rasterizeTriangleGouraud(
        w,
        h,
        zBuf,
        colorBuf,
        x0,
        y0,
        z0,
        litR[i0],
        litG[i0],
        litB[i0],
        x1,
        y1,
        z1,
        litR[i1],
        litG[i1],
        litB[i1],
        x2,
        y2,
        z2,
        litR[i2],
        litG[i2],
        litB[i2]
      );
    }
  }

  buffers.offscreenCtx.putImageData(buffers.imageData, 0, 0);
  const dstCtx = canvas.getContext('2d');
  if (!dstCtx) return false;
  dstCtx.imageSmoothingEnabled = true;
  dstCtx.imageSmoothingQuality = 'high';
  dstCtx.drawImage(buffers.offscreenCanvas, 0, 0, displayW, displayH);
  return true;
}
