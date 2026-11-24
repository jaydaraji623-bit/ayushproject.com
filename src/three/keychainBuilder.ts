import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { Keychain3DConfig, KeychainMaterialType, KeychainPattern, KeychainShape } from '../types.ts';

export interface KeychainAssembly {
  root: THREE.Group;
  parts: {
    ring: THREE.Object3D;
    clasp: THREE.Object3D;
    bail: THREE.Object3D;
    bezel: THREE.Object3D;
    body: THREE.Object3D;
    frontFace: THREE.Object3D;
    backFace: THREE.Object3D;
  };
  dispose: () => void;
}

function createShapeContour(shapeType: KeychainShape): THREE.Shape {
  const s = new THREE.Shape();
  switch (shapeType) {
    case 'bar': {
      const w = 0.62;
      const h = 1.48;
      const r = 0.14;
      s.moveTo(-w + r, -h);
      s.lineTo(w - r, -h);
      s.quadraticCurveTo(w, -h, w, -h + r);
      s.lineTo(w, h - r);
      s.quadraticCurveTo(w, h, w - r, h);
      s.lineTo(-w + r, h);
      s.quadraticCurveTo(-w, h, -w, h - r);
      s.lineTo(-w, -h + r);
      s.quadraticCurveTo(-w, -h, -w + r, -h);
      break;
    }
    case 'square': {
      const w = 1.02;
      const h = 1.02;
      const r = 0.1;
      s.moveTo(-w + r, -h);
      s.lineTo(w - r, -h);
      s.quadraticCurveTo(w, -h, w, -h + r);
      s.lineTo(w, h - r);
      s.quadraticCurveTo(w, h, w - r, h);
      s.lineTo(-w + r, h);
      s.quadraticCurveTo(-w, h, -w, h - r);
      s.lineTo(-w, -h + r);
      s.quadraticCurveTo(-w, -h, -w + r, -h);
      break;
    }
    case 'medallion': {
      s.absarc(0, 0, 1.05, 0, Math.PI * 2, false);
      break;
    }
    case 'oval': {
      const rx = 0.86;
      const ry = 1.24;
      s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
      break;
    }
    case 'hexagon': {
      const radius = 1.08;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      }
      s.closePath();
      break;
    }
    case 'heart': {
      s.moveTo(0, -0.92);
      s.bezierCurveTo(0.2, -0.78, 1.15, -0.15, 1.08, 0.48);
      s.bezierCurveTo(1.02, 0.96, 0.36, 1.12, 0, 0.62);
      s.bezierCurveTo(-0.36, 1.12, -1.02, 0.96, -1.08, 0.48);
      s.bezierCurveTo(-1.15, -0.15, -0.2, -0.78, 0, -0.92);
      break;
    }
    case 'shield': {
      s.moveTo(0, -1.25);
      s.quadraticCurveTo(0.95, -0.82, 0.95, 0.25);
      s.lineTo(0.95, 0.98);
      s.quadraticCurveTo(0, 1.18, -0.95, 0.98);
      s.lineTo(-0.95, 0.25);
      s.quadraticCurveTo(-0.95, -0.82, 0, -1.25);
      break;
    }
  }
  return s;
}

function getBodyTopY(shape: KeychainShape): number {
  switch (shape) {
    case 'bar':
      return 1.48;
    case 'oval':
      return 1.24;
    case 'square':
      return 1.02;
    case 'medallion':
    case 'hexagon':
      return 1.06;
    case 'heart':
      return 0.85;
    case 'shield':
      return 1.08;
  }
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pattern: KeychainPattern,
  baseColor: string,
  accentColor: string
) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  if (pattern === 'brushed') {
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, y, w, 1);
    }
  } else if (pattern === 'gold-foil') {
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.65);
    grad.addColorStop(0, 'rgba(212,175,55,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 65; i++) {
      const x = ((i * 79) % 100) * (w / 100);
      const y = ((i * 53) % 100) * (h / 100);
      const sz = 4 + (i % 9) * 2;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(229,197,107,0.7)' : 'rgba(212,175,55,0.45)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + sz, y + sz * 0.4);
      ctx.lineTo(x + sz * 0.3, y + sz);
      ctx.closePath();
      ctx.fill();
    }
  } else if (pattern === 'marble') {
    ctx.strokeStyle = 'rgba(212,175,55,0.28)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 6) * i);
      ctx.bezierCurveTo(w * 0.3, (h / 6) * i + 45, w * 0.7, (h / 6) * i - 55, w, (h / 6) * i + 20);
      ctx.stroke();
    }
  } else if (pattern === 'lattice') {
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 2;
    const step = 36;
    for (let x = -h; x < w + h; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + h, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

async function createEngravingTexture(
  config: Keychain3DConfig,
  side: 'front' | 'back',
  maxAnisotropy: number
): Promise<THREE.CanvasTexture> {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  const baseCol = new THREE.Color(config.primaryColor);
  const luminance = 0.2126 * baseCol.r + 0.7152 * baseCol.g + 0.0722 * baseCol.b;
  const isLightBody = config.material === 'crystal-acrylic' || luminance > 0.42;

  drawPattern(ctx, canvas.width, canvas.height, config.pattern, config.primaryColor, config.accentColor);

  // If front side and user uploaded a photo, draw photo clipped nicely inside frame
  if (side === 'front' && config.photoDataUrl) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        const pad = 70;
        const size = canvas.width - pad * 2;
        ctx.beginPath();
        ctx.roundRect(pad, pad, size, size, 32);
        ctx.clip();
        const scale = Math.max(size / img.width, size / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
        ctx.restore();

        // Subtle gold border around photo
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(pad, pad, size, size, 32);
        ctx.stroke();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = config.photoDataUrl!;
    });
  }

  // Subtle double hairline perimeter border
  ctx.strokeStyle = isLightBody ? 'rgba(30,26,20,0.38)' : 'rgba(229,197,107,0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

  const label = (side === 'front' ? config.engravingText : config.backText || 'SHREEJI ATELIER').trim();
  if (label) {
    const textColor =
      config.material === 'crystal-acrylic'
        ? '#FFFFFF'
        : isLightBody
          ? '#1A1712'
          : '#F4DF9A';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Subtle engraved shadow for depth
    const fontSize = label.length <= 2 ? 158 : label.length <= 7 ? 96 : 64;
    ctx.font = `600 ${fontSize}px "${config.font}", Georgia, serif`;

    const yPos = side === 'front' && config.photoDataUrl ? canvas.height * 0.78 : canvas.height * 0.5;
    if (side === 'front' && config.photoDataUrl) {
      ctx.fillStyle = 'rgba(10, 10, 12, 0.72)';
      ctx.fillRect(110, yPos - 54, canvas.width - 220, 108);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText(label, canvas.width / 2 + 2, yPos + 3, canvas.width - 140);

    ctx.fillStyle = textColor;
    ctx.fillText(label, canvas.width / 2, yPos, canvas.width - 140);
  }

  // Micro hallmark at bottom
  ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = isLightBody ? 'rgba(24,24,27,0.55)' : 'rgba(212,175,55,0.65)';
  ctx.fillText('SHREEJI · 316L', canvas.width / 2, canvas.height - 86);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, maxAnisotropy);
  tex.needsUpdate = true;
  return tex;
}

function buildBodyMaterial(
  matType: KeychainMaterialType,
  primaryColor: string,
  isSoftwareGl: boolean
): THREE.MeshPhysicalMaterial {
  const color = new THREE.Color(primaryColor);
  switch (matType) {
    case 'brushed-gold':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.94,
        roughness: 0.22,
        anisotropy: 0.75,
        clearcoat: 0.35,
        clearcoatRoughness: 0.2,
      });
    case 'rose-brass':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.92,
        roughness: 0.24,
        anisotropy: 0.65,
        clearcoat: 0.3,
      });
    case 'sterling-chrome':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.98,
        roughness: 0.12,
        clearcoat: 0.4,
      });
    case 'obsidian-metal':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.78,
        roughness: 0.38,
        clearcoat: 0.2,
      });
    case 'crystal-acrylic':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.02,
        roughness: 0.06,
        transmission: isSoftwareGl ? 0 : 0.92,
        transparent: true,
        opacity: isSoftwareGl ? 0.52 : 1,
        ior: 1.49,
        thickness: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
      });
    case 'smoky-resin':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.05,
        roughness: 0.12,
        transmission: isSoftwareGl ? 0 : 0.62,
        transparent: true,
        opacity: isSoftwareGl ? 0.78 : 0.96,
        ior: 1.54,
        thickness: 0.85,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
      });
    case 'leather-brass':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.08,
        roughness: 0.72,
        sheen: 0.45,
        sheenRoughness: 0.6,
      });
  }
}

export async function buildProceduralKeychain(
  config: Keychain3DConfig,
  options: { isSoftwareGl?: boolean; maxAnisotropy?: number } = {}
): Promise<KeychainAssembly> {
  const isSoftwareGl = Boolean(options.isSoftwareGl);
  const maxAnisotropy = options.maxAnisotropy ?? 4;

  const root = new THREE.Group();
  root.name = 'ShreejiKeychainAssembly';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const hardwareColor =
    config.material === 'sterling-chrome'
      ? 0xdce1e8
      : config.material === 'rose-brass'
        ? 0xc98a6b
        : config.material === 'obsidian-metal'
          ? 0x2b2b30
          : 0xd4af37;

  const hardwareMat = new THREE.MeshPhysicalMaterial({
    color: hardwareColor,
    metalness: 0.96,
    roughness: 0.16,
    anisotropy: 0.7,
    clearcoat: 0.35,
  });
  materials.push(hardwareMat);

  const topY = getBodyTopY(config.shape);

  // 1. Double-coil Split Ring
  const ringGroup = new THREE.Group();
  const ringGeo1 = new THREE.TorusGeometry(0.46, 0.065, 20, 64);
  const ringGeo2 = new THREE.TorusGeometry(0.46, 0.062, 20, 64);
  geometries.push(ringGeo1, ringGeo2);
  const ringMesh1 = new THREE.Mesh(ringGeo1, hardwareMat);
  ringMesh1.position.z = 0.028;
  ringMesh1.castShadow = true;
  const ringMesh2 = new THREE.Mesh(ringGeo2, hardwareMat);
  ringMesh2.position.z = -0.028;
  ringMesh2.castShadow = true;
  ringGroup.add(ringMesh1, ringMesh2);
  ringGroup.position.set(0, topY + 0.98, 0);
  root.add(ringGroup);

  // 2. Swivel Clasp & Collar
  const claspGroup = new THREE.Group();
  const collarGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.24, 24);
  const pinGeo = new THREE.TorusGeometry(0.15, 0.045, 16, 36);
  geometries.push(collarGeo, pinGeo);
  const collarMesh = new THREE.Mesh(collarGeo, hardwareMat);
  collarMesh.castShadow = true;
  const pinMesh = new THREE.Mesh(pinGeo, hardwareMat);
  pinMesh.position.y = -0.18;
  pinMesh.rotation.y = Math.PI / 2;
  pinMesh.castShadow = true;
  claspGroup.add(collarMesh, pinMesh);
  claspGroup.position.set(0, topY + 0.44, 0);
  root.add(claspGroup);

  // 3. Bail / Leather Loop
  const bailGroup = new THREE.Group();
  if (config.material === 'leather-brass') {
    const leatherMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(config.primaryColor),
      roughness: 0.78,
      metalness: 0.05,
      sheen: 0.5,
    });
    materials.push(leatherMat);
    const strapGeo = new THREE.BoxGeometry(0.42, 0.48, 0.18);
    geometries.push(strapGeo);
    const strapMesh = new THREE.Mesh(strapGeo, leatherMat);
    strapMesh.castShadow = true;
    bailGroup.add(strapMesh);
  } else {
    const bailGeo = new THREE.TorusGeometry(0.18, 0.055, 16, 36);
    geometries.push(bailGeo);
    const bailMesh = new THREE.Mesh(bailGeo, hardwareMat);
    bailMesh.castShadow = true;
    bailGroup.add(bailMesh);
  }
  bailGroup.position.set(0, topY + 0.08, 0);
  root.add(bailGroup);

  // 4. Outer Chamfered Bezel Frame
  const contour = createShapeContour(config.shape);
  const bodyGeo = new THREE.ExtrudeGeometry(contour, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.035,
    bevelSegments: 4,
    curveSegments: 32,
  });
  bodyGeo.center();
  bodyGeo.computeTangents();
  geometries.push(bodyGeo);

  const bezelGeo = bodyGeo.clone();
  bezelGeo.scale(1.04, 1.03, 0.78);
  geometries.push(bezelGeo);

  const bezelMesh = new THREE.Mesh(bezelGeo, hardwareMat);
  bezelMesh.castShadow = true;
  bezelMesh.receiveShadow = true;
  root.add(bezelMesh);

  // 5. Core Pendant Body
  const bodyMat = buildBodyMaterial(config.material, config.primaryColor, isSoftwareGl);
  materials.push(bodyMat);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // 6 & 7. Front & Back Engraved Face Plates (normalized planar UVs)
  const faceGeo = new THREE.ShapeGeometry(contour, 32);
  faceGeo.center();
  faceGeo.computeBoundingBox();
  const bb = faceGeo.boundingBox!;
  const spanX = Math.max(0.001, bb.max.x - bb.min.x);
  const spanY = Math.max(0.001, bb.max.y - bb.min.y);
  const posAttr = faceGeo.attributes.position;
  const uvs = new Float32Array(posAttr.count * 2);
  for (let i = 0; i < posAttr.count; i++) {
    uvs[i * 2] = (posAttr.getX(i) - bb.min.x) / spanX;
    uvs[i * 2 + 1] = (posAttr.getY(i) - bb.min.y) / spanY;
  }
  faceGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  faceGeo.scale(0.92, 0.92, 1);
  geometries.push(faceGeo);

  const [frontTex, backTex] = await Promise.all([
    createEngravingTexture(config, 'front', maxAnisotropy),
    createEngravingTexture(config, 'back', maxAnisotropy),
  ]);
  textures.push(frontTex, backTex);

  const isTranslucent = config.material === 'crystal-acrylic' || config.material === 'smoky-resin';

  const frontMat = new THREE.MeshPhysicalMaterial({
    map: frontTex,
    roughness: isTranslucent ? 0.14 : 0.28,
    metalness: isTranslucent ? 0.05 : 0.68,
    clearcoat: 0.5,
    transparent: isTranslucent,
    opacity: isTranslucent ? 0.88 : 1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const backMat = new THREE.MeshPhysicalMaterial({
    map: backTex,
    roughness: isTranslucent ? 0.14 : 0.28,
    metalness: isTranslucent ? 0.05 : 0.68,
    clearcoat: 0.5,
    transparent: isTranslucent,
    opacity: isTranslucent ? 0.88 : 1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  materials.push(frontMat, backMat);

  const frontFace = new THREE.Mesh(faceGeo, frontMat);
  frontFace.position.z = 0.125;
  root.add(frontFace);

  const backFace = new THREE.Mesh(faceGeo, backMat);
  backFace.position.z = -0.125;
  backFace.rotation.y = Math.PI;
  root.add(backFace);

  // Center entire assembly vertically around origin
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.children.forEach((child) => {
    child.position.y -= center.y;
  });

  // Record base positions for exploded-view damping
  [ringGroup, claspGroup, bailGroup, bezelMesh, bodyMesh, frontFace, backFace].forEach((part) => {
    part.userData.basePos = part.position.clone();
  });

  return {
    root,
    parts: {
      ring: ringGroup,
      clasp: claspGroup,
      bail: bailGroup,
      bezel: bezelMesh,
      body: bodyMesh,
      frontFace,
      backFace,
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}

export async function exportKeychainToGLB(config: Keychain3DConfig): Promise<string> {
  // Export an opaque metallic/resin PBR GLB suitable for Android Scene Viewer, WebXR & iOS Quick Look
  const assembly = await buildProceduralKeychain(config, { isSoftwareGl: true, maxAnisotropy: 2 });
  // Scale to realistic keychain size (~0.08m tall) for real-world AR scale
  assembly.root.scale.setScalar(0.025);
  assembly.root.updateMatrixWorld(true);

  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      assembly.root,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('Expected binary GLB output.'));
        }
      },
      (err) => reject(err),
      { binary: true }
    );
  });

  assembly.dispose();
  const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
  return URL.createObjectURL(blob);
}
