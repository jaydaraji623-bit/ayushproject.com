import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ChevronDown, ChevronUp, Expand, RotateCcw, Sparkles } from 'lucide-react';
import type { Keychain3DConfig } from '../types.ts';
import { buildProceduralKeychain, type KeychainAssembly } from '../three/keychainBuilder.ts';

type CameraPreset = 'front' | 'back' | 'iso' | 'ring';
type LightingPreset = 'champagne' | 'obsidian' | 'daylight';

interface Keychain3DViewerProps {
  config: Keychain3DConfig;
  className?: string;
  autoRotate?: boolean;
  showDock?: boolean;
  heightClass?: string;
  onLaunchAR?: () => void;
}

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  front: { pos: [0, 0.15, 5.2], target: [0, 0, 0] },
  back: { pos: [0, 0.15, -5.2], target: [0, 0, 0] },
  iso: { pos: [3.2, 1.8, 4.1], target: [0, 0, 0] },
  ring: { pos: [1.4, 2.2, 2.8], target: [0, 1.15, 0] },
};

export function Keychain3DViewer({
  config,
  className = '',
  autoRotate = true,
  showDock = true,
  heightClass = 'h-[480px]',
  onLaunchAR,
}: Keychain3DViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [explode, setExplode] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('champagne');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [loadingModel, setLoadingModel] = useState(true);
  const [contextLost, setContextLost] = useState(false);

  const explodeRef = useRef(0);
  const autoRotateRef = useRef(autoRotate);
  const lightingRef = useRef<LightingPreset>('champagne');
  const cameraTweenRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESETS.iso.pos),
    target: new THREE.Vector3(...CAMERA_PRESETS.iso.target),
  });

  const sceneRefs = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    assembly?: KeychainAssembly | null;
    uploadedModel?: THREE.Object3D | null;
    keyLight?: THREE.DirectionalLight;
    hemiLight?: THREE.HemisphereLight;
    rimLight?: THREE.DirectionalLight;
    isSoftwareGl?: boolean;
  }>({});

  useEffect(() => {
    explodeRef.current = explode;
  }, [explode]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (sceneRefs.current.controls && !sceneRefs.current.isSoftwareGl) {
      sceneRefs.current.controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    lightingRef.current = lightingPreset;
    const { keyLight, hemiLight, rimLight, scene } = sceneRefs.current;
    if (!keyLight || !hemiLight || !rimLight || !scene) return;
    if (lightingPreset === 'champagne') {
      keyLight.color.setHex(0xfff0d4);
      keyLight.intensity = 2.6;
      hemiLight.color.setHex(0xcbd5e1);
      hemiLight.groundColor.setHex(0x1f1b16);
      rimLight.color.setHex(0xd4af37);
      rimLight.intensity = 1.9;
    } else if (lightingPreset === 'obsidian') {
      keyLight.color.setHex(0xe2e8f0);
      keyLight.intensity = 2.2;
      hemiLight.color.setHex(0x64748b);
      hemiLight.groundColor.setHex(0x09090b);
      rimLight.color.setHex(0xf8fafc);
      rimLight.intensity = 2.4;
    } else {
      keyLight.color.setHex(0xffffff);
      keyLight.intensity = 3.0;
      hemiLight.color.setHex(0xf1f5f9);
      hemiLight.groundColor.setHex(0x334155);
      rimLight.color.setHex(0xfde68a);
      rimLight.intensity = 1.4;
    }
  }, [lightingPreset]);

  const selectPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    const p = CAMERA_PRESETS[preset];
    cameraTweenRef.current = {
      active: true,
      pos: new THREE.Vector3(...p.pos),
      target: new THREE.Vector3(...p.target),
    };
  };

  // Initialize Three.js WebGL stage once inside isolated empty div
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(container.clientHeight, 300);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 60);
    camera.position.set(...CAMERA_PRESETS.iso.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 2.4;
    controls.maxDistance = 9.5;
    controls.autoRotate = !isSoftwareGl && autoRotateRef.current;
    controls.autoRotateSpeed = 1.35;
    controls.addEventListener('start', () => {
      cameraTweenRef.current.active = false;
    });

    // Studio 3-point lighting rig
    const keyLight = new THREE.DirectionalLight(0xfff0d4, 2.6);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xcbd5e1, 0x1f1b16, 0.9);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 1.9);
    rimLight.position.set(-4, 3, -5);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xfff4dd, 3.2, 4, 2);
      softbox.position.set(0, 4.5, 3);
      softbox.lookAt(0, 0, 0);
      scene.add(softbox);
    }

    // Soft radial contact shadow plane beneath keychain
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0,0,0,0.65)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.22)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 4.4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.75 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.1;
    scene.add(shadowPlane);

    sceneRefs.current = {
      renderer,
      scene,
      camera,
      controls,
      assembly: null,
      uploadedModel: null,
      keyLight,
      hemiLight,
      rimLight,
      isSoftwareGl,
    };

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Smoothly damp camera preset transitions
      if (cameraTweenRef.current.active) {
        camera.position.lerp(cameraTweenRef.current.pos, 1 - Math.exp(-6 * delta));
        controls.target.lerp(cameraTweenRef.current.target, 1 - Math.exp(-6 * delta));
        if (camera.position.distanceTo(cameraTweenRef.current.pos) < 0.03) {
          cameraTweenRef.current.active = false;
        }
      }

      // Gentle float & exploded-view layer separation
      const asm = sceneRefs.current.assembly;
      if (asm) {
        asm.root.position.y = Math.sin(elapsed * 1.4) * 0.05;
        const ex = explodeRef.current;
        const dampFactor = 1 - Math.exp(-10 * delta);

        const applyOffset = (obj: THREE.Object3D, dx: number, dy: number, dz: number) => {
          const base = obj.userData.basePos as THREE.Vector3 | undefined;
          if (!base) return;
          obj.position.x = THREE.MathUtils.lerp(obj.position.x, base.x + dx * ex, dampFactor);
          obj.position.y = THREE.MathUtils.lerp(obj.position.y, base.y + dy * ex, dampFactor);
          obj.position.z = THREE.MathUtils.lerp(obj.position.z, base.z + dz * ex, dampFactor);
        };

        applyOffset(asm.parts.ring, 0, 0.85, 0);
        applyOffset(asm.parts.clasp, 0, 0.55, 0);
        applyOffset(asm.parts.bail, 0, 0.25, 0);
        applyOffset(asm.parts.bezel, 0, 0, -0.35);
        applyOffset(asm.parts.body, 0, 0, 0);
        applyOffset(asm.parts.frontFace, 0, 0, 0.55);
        applyOffset(asm.parts.backFace, 0, 0, -0.68);
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 280);
      const h = Math.max(container.clientHeight, 260);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      if (sceneRefs.current.assembly) {
        sceneRefs.current.assembly.dispose();
      }
      shadowPlane.geometry.dispose();
      (shadowPlane.material as THREE.Material).dispose();
      shadowTex.dispose();
      envTex.dispose();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rebuild or swap 3D model cleanly whenever customization config or uploaded GLB changes
  useEffect(() => {
    let cancelled = false;
    const { scene, renderer, isSoftwareGl } = sceneRefs.current;
    if (!scene || !renderer) return;

    setLoadingModel(true);

    const clearCurrent = () => {
      if (sceneRefs.current.assembly) {
        scene.remove(sceneRefs.current.assembly.root);
        sceneRefs.current.assembly.dispose();
        sceneRefs.current.assembly = null;
      }
      if (sceneRefs.current.uploadedModel) {
        scene.remove(sceneRefs.current.uploadedModel);
        sceneRefs.current.uploadedModel = null;
      }
    };

    if (config.modelUrl) {
      const loader = new GLTFLoader();
      loader.load(
        config.modelUrl,
        (gltf) => {
          if (cancelled) return;
          clearCurrent();
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z, 0.001);
          model.position.sub(center);
          model.scale.setScalar(2.8 / maxDim);
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          scene.add(model);
          sceneRefs.current.uploadedModel = model;
          setLoadingModel(false);
        },
        undefined,
        async () => {
          if (cancelled) return;
          const asm = await buildProceduralKeychain(config, {
            isSoftwareGl,
            maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
          });
          if (cancelled) {
            asm.dispose();
            return;
          }
          clearCurrent();
          scene.add(asm.root);
          sceneRefs.current.assembly = asm;
          setLoadingModel(false);
        }
      );
    } else {
      buildProceduralKeychain(config, {
        isSoftwareGl,
        maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
      }).then((asm) => {
        if (cancelled) {
          asm.dispose();
          return;
        }
        clearCurrent();
        scene.add(asm.root);
        sceneRefs.current.assembly = asm;
        setLoadingModel(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [config]);

  return (
    <div
      className={`relative w-full ${heightClass} overflow-hidden rounded-2xl border border-white/10 bg-radial from-[#1E1B16] via-[#0F0F12] to-[#080809] ${className}`}
    >
      {/* Isolated WebGL canvas mount */}
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {/* Loading overlay */}
      {loadingModel && !contextLost && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0A0A0B]/70">
          <div className="text-center">
            <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            <p className="text-xs tracking-wider text-[#C7C2B8] uppercase">Rendering 3D Mesh</p>
          </div>
        </div>
      )}

      {/* WebGL fallback state */}
      {contextLost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F0F12] p-6 text-center">
          <p className="font-display text-2xl text-[#F5F3EE]">3D Viewport Paused</p>
          <p className="mt-2 max-w-sm text-sm text-[#9E9A90]">
            WebGL graphics context was interrupted. Reload the studio or switch to gallery view.
          </p>
        </div>
      )}

      {/* Top minimal hint */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-[#A39E93]">
        <span>Drag to rotate 360° · Scroll to zoom</span>
        {onLaunchAR && (
          <button
            type="button"
            onClick={onLaunchAR}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/50 bg-[#141416] px-3 py-1.5 text-xs font-medium text-[#E5C56B] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
          >
            <Expand className="h-3.5 w-3.5" />
            View in AR
          </button>
        )}
      </div>

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      {showDock && (
        <div className="absolute bottom-4 left-1/2 z-10 w-[min(94%,740px)] -translate-x-1/2">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setDockCollapsed((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-white/10 bg-[#141416] px-3 py-1 text-[11px] font-medium text-[#C7C2B8] transition-colors hover:text-[#F5F3EE]"
            >
              {dockCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {dockCollapsed ? 'Show Studio Controls' : 'Hide Controls'}
            </button>
          </div>

          {!dockCollapsed && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141416]/95 px-4 py-2.5 shadow-2xl">
              {/* Camera views */}
              <div className="flex items-center gap-1">
                {(['iso', 'front', 'back', 'ring'] as CameraPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                      cameraPreset === preset
                        ? 'bg-[#D4AF37] text-[#0A0A0B]'
                        : 'text-[#B5B0A6] hover:bg-white/5 hover:text-[#F5F3EE]'
                    }`}
                  >
                    {preset === 'iso' ? '3/4 View' : preset === 'ring' ? 'Ring Detail' : preset}
                  </button>
                ))}
              </div>

              {/* Exploded slider */}
              <label className="flex items-center gap-2 text-xs text-[#C7C2B8]">
                <span className="whitespace-nowrap">Explode</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explode}
                  onChange={(e) => setExplode(Number(e.target.value))}
                  className="h-1.5 w-24 accent-[#D4AF37]"
                />
              </label>

              {/* Lighting presets + Reset */}
              <div className="flex items-center gap-1.5">
                {(['champagne', 'obsidian', 'daylight'] as LightingPreset[]).map((lp) => (
                  <button
                    key={lp}
                    type="button"
                    onClick={() => setLightingPreset(lp)}
                    title={`Studio Lighting: ${lp}`}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs capitalize transition-colors whitespace-nowrap shrink-0 ${
                      lightingPreset === lp
                        ? 'border border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#E5C56B]'
                        : 'text-[#9E9A90] hover:text-[#F5F3EE]'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {lp}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setExplode(0);
                    selectPreset('iso');
                  }}
                  title="Reset view"
                  className="rounded-md p-1.5 text-[#9E9A90] transition-colors hover:bg-white/5 hover:text-[#F5F3EE]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
