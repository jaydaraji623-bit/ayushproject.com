import '@google/model-viewer';
import { Camera, Download, Eye, Info, Maximize2, RotateCw, ShieldAlert, Smartphone, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Keychain3DConfig, Product } from '../types.ts';
import { buildProceduralKeychain, exportKeychainToGLB } from '../three/keychainBuilder.ts';
import { Keychain3DViewer } from './Keychain3DViewer.tsx';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'shadow-intensity'?: string;
        exposure?: string;
        'environment-image'?: string;
        'ios-src'?: string;
      };
    }
  }
}

interface ARExperienceViewProps {
  products: Product[];
  activeConfig: Keychain3DConfig;
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
  onBackToShop: () => void;
}

export function ARExperienceView({
  products,
  activeConfig,
  selectedProduct,
  onSelectProduct,
  onBackToShop,
}: ARExperienceViewProps) {
  const [glbUrl, setGlbUrl] = useState<string>('');
  const [buildingGlb, setBuildingGlb] = useState(true);
  const [webXrSupported, setWebXrSupported] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [arScale, setArScale] = useState(1);
  const [arOffset, setArOffset] = useState({ x: 0, y: 0 });
  const [fallback3D, setFallback3D] = useState(false);

  const modelViewerRef = useRef<HTMLElement & { activateAR?: () => void }>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const arCanvasMountRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ dragging: boolean; lastX: number; lastY: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  // Check real WebXR immersive-ar support without triggering camera permission
  useEffect(() => {
    let mounted = true;
    if (typeof navigator !== 'undefined' && 'xr' in navigator && navigator.xr) {
      navigator.xr
        .isSessionSupported('immersive-ar')
        .then((ok) => {
          if (mounted) setWebXrSupported(ok);
        })
        .catch(() => {
          if (mounted) setWebXrSupported(false);
        });
    } else {
      setWebXrSupported(false);
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Generate real binary .glb from the active keychain configuration (or use admin-uploaded GLB URL)
  useEffect(() => {
    let revoked = false;
    let createdBlobUrl = '';

    async function prepareModel() {
      setBuildingGlb(true);
      if (activeConfig.modelUrl && activeConfig.modelUrl.endsWith('.glb')) {
        setGlbUrl(activeConfig.modelUrl);
        setBuildingGlb(false);
        return;
      }
      try {
        createdBlobUrl = await exportKeychainToGLB(activeConfig);
        if (!revoked) {
          setGlbUrl(createdBlobUrl);
        }
      } catch {
        setGlbUrl('');
      } finally {
        if (!revoked) setBuildingGlb(false);
      }
    }

    prepareModel();

    return () => {
      revoked = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [activeConfig]);

  const stopCameraAR = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Only request camera permission AFTER the user clicks the AR Camera button
  const startCameraAR = async () => {
    setCameraError(null);
    setFallback3D(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by this browser. Switching to interactive 3D studio fallback.');
      setFallback3D(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera permission was declined. Use the Interactive 3D Fallback below or allow camera access in browser settings.'
          : 'No physical camera stream detected on this device. Interactive 3D fallback is ready below.';
      setCameraError(msg);
      setFallback3D(true);
    }
  };

  useEffect(() => {
    return () => {
      stopCameraAR();
    };
  }, []);

  // Transparent Three.js keychain overlay when Live Camera AR is active
  useEffect(() => {
    if (!cameraActive || !arCanvasMountRef.current) return;
    const container = arCanvasMountRef.current;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 0, 6);

    const key = new THREE.DirectionalLight(0xfff1d6, 2.8);
    key.position.set(4, 6, 5);
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x26221c, 0.9));

    let disposed = false;
    let assemblyDispose: (() => void) | null = null;
    let pivot: THREE.Group | null = null;

    buildProceduralKeychain(activeConfig, { maxAnisotropy: 4 }).then((asm) => {
      if (disposed) {
        asm.dispose();
        return;
      }
      pivot = asm.root;
      assemblyDispose = asm.dispose;
      scene.add(pivot);
    });

    const clock = new THREE.Clock();
    let frameId = 0;

    const tick = () => {
      if (disposed) return;
      const dt = clock.getDelta();
      if (pivot) {
        pivot.rotation.y += dt * 0.7;
        pivot.scale.setScalar(arScale);
        pivot.position.set(arOffset.x, arOffset.y, 0);
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      if (assemblyDispose) assemblyDispose();
      env.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cameraActive, activeConfig, arScale, arOffset]);

  const triggerNativeAR = () => {
    const el = modelViewerRef.current;
    if (el && typeof el.activateAR === 'function') {
      el.activateAR();
    } else {
      startCameraAR();
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
            Augmented Reality Showcase
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F3EE] sm:text-5xl">
            Experience Your Keychain in Real Space
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#A39E93]">
            Powered by real binary GLB 3D export, Google Model Viewer (Android Scene Viewer / iOS Quick Look / WebXR),
            and live browser camera spatial preview. Camera access is requested only when you click an AR trigger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={triggerNativeAR}
            disabled={buildingGlb || !glbUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0A0A0B] transition-colors hover:bg-[#E5C56B] disabled:opacity-50"
          >
            <Smartphone className="h-4 w-4" />
            View in AR (Native / WebXR)
          </button>
          <button
            type="button"
            onClick={cameraActive ? stopCameraAR : startCameraAR}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#141416] px-4 py-2.5 text-sm font-medium text-[#F5F3EE] transition-colors hover:border-[#D4AF37]/60"
          >
            {cameraActive ? <VideoOff className="h-4 w-4 text-[#D4AF37]" /> : <Camera className="h-4 w-4 text-[#D4AF37]" />}
            {cameraActive ? 'Stop Camera AR' : 'Start Live Camera AR'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main AR Stage */}
        <div className="lg:col-span-8">
          {cameraActive ? (
            <div
              className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-black"
              onPointerDown={(e) => {
                dragState.current = { dragging: true, lastX: e.clientX, lastY: e.clientY };
              }}
              onPointerMove={(e) => {
                if (!dragState.current.dragging) return;
                const dx = (e.clientX - dragState.current.lastX) * 0.01;
                const dy = -(e.clientY - dragState.current.lastY) * 0.01;
                dragState.current.lastX = e.clientX;
                dragState.current.lastY = e.clientY;
                setArOffset((prev) => ({
                  x: Math.max(-2, Math.min(2, prev.x + dx)),
                  y: Math.max(-1.6, Math.min(1.6, prev.y + dy)),
                }));
              }}
              onPointerUp={() => {
                dragState.current.dragging = false;
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div ref={arCanvasMountRef} className="absolute inset-0 cursor-move" />

              <div className="absolute bottom-4 left-1/2 flex w-[min(92%,460px)] -translate-x-1/2 items-center justify-between gap-4 rounded-xl border border-white/15 bg-[#0A0A0B]/85 px-4 py-2.5 text-xs">
                <span className="text-[#D4AF37]">Live Camera Overlay · Drag to move</span>
                <label className="flex items-center gap-2 text-[#F5F3EE]">
                  <span>Scale</span>
                  <input
                    type="range"
                    min={0.5}
                    max={1.8}
                    step={0.05}
                    value={arScale}
                    onChange={(e) => setArScale(Number(e.target.value))}
                    className="w-24 accent-[#D4AF37]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setArScale(1);
                    setArOffset({ x: 0, y: 0 });
                  }}
                  className="text-[#C7C2B8] hover:text-white"
                  title="Reset position"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : fallback3D ? (
            <div className="space-y-3">
              {cameraError && (
                <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/30 bg-[#141416] p-4 text-sm text-[#D8D3C8]">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
                  <div>
                    <p className="font-medium text-[#F5F3EE]">Camera Unavailable — Interactive 3D Fallback Active</p>
                    <p className="mt-1 text-xs text-[#9E9A90]">{cameraError}</p>
                  </div>
                </div>
              )}
              <Keychain3DViewer config={activeConfig} heightClass="h-[500px]" />
            </div>
          ) : (
            <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111114]">
              {buildingGlb ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
                    <p className="text-xs tracking-wider text-[#A39E93] uppercase">
                      Compiling Binary .GLB for AR
                    </p>
                  </div>
                </div>
              ) : (
                <model-viewer
                  ref={modelViewerRef}
                  src={glbUrl}
                  alt={selectedProduct?.name || 'Shreeji Custom 3D Keychain'}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  auto-rotate
                  shadow-intensity="1"
                  exposure="1.1"
                  style={{ width: '100%', height: '100%', backgroundColor: '#111114' }}
                >
                  <button
                    slot="ar-button"
                    className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-xs font-semibold text-[#0A0A0B] shadow-lg"
                  >
                    <Maximize2 className="h-4 w-4" />
                    Place in Your Space (AR)
                  </button>
                </model-viewer>
              )}

              <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0A0A0B]/80 px-3 py-1.5 text-xs text-[#C7C2B8]">
                <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>
                  {webXrSupported
                    ? 'WebXR AR Ready on this device'
                    : 'Model Viewer Ready (Use Mobile for Scene Viewer / Quick Look, or Live Camera AR)'}
                </span>
              </div>
            </div>
          )}

          {/* Honest Platform Capabilities Banner */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#141416] p-4">
              <p className="text-xs font-semibold text-[#E5C56B]">Android & WebXR</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9E9A90]">
                Launches Google Scene Viewer or WebXR ARCore surface placement directly from the generated `.glb` binary.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#141416] p-4">
              <p className="text-xs font-semibold text-[#E5C56B]">iOS Safari</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9E9A90]">
                Supports Quick Look conversion from Model Viewer and live Safari camera overlay fallback.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#141416] p-4">
              <p className="text-xs font-semibold text-[#E5C56B]">Desktop Fallback</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9E9A90]">
                Uses webcam live spatial overlay (`getUserMedia`) or seamless 360° interactive Three.js inspection.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Select Model & Export GLB */}
        <div className="space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-white/10 bg-[#141416] p-5">
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">Active AR Keychain</h2>
            <p className="mt-1 text-xs text-[#9E9A90]">
              {selectedProduct ? selectedProduct.name : 'Custom Studio Keychain'} · Engraving:{' '}
              <span className="text-[#E5C56B]">{activeConfig.engravingText || 'SHREEJI'}</span>
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              {glbUrl && (
                <a
                  href={glbUrl}
                  download={`shreeji-${(activeConfig.engravingText || 'keychain').toLowerCase().replace(/\s+/g, '-')}.glb`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#1C1C20] px-4 py-2.5 text-xs font-medium text-[#F5F3EE] transition-colors hover:border-[#D4AF37]"
                >
                  <Download className="h-4 w-4 text-[#D4AF37]" />
                  Download 3D .GLB File
                </a>
              )}
              <button
                type="button"
                onClick={() => setFallback3D((v) => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-[#B5B0A6] transition-colors hover:text-[#F5F3EE]"
              >
                <Info className="h-4 w-4" />
                {fallback3D ? 'Switch to Model Viewer AR' : 'Open Interactive 3D Fallback'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141416] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F5F3EE]">Preview Any Catalog Keychain</h3>
              <button type="button" onClick={onBackToShop} className="text-xs text-[#D4AF37] hover:underline">
                Browse All
              </button>
            </div>
            <div className="max-h-[290px] space-y-2 overflow-y-auto pr-1">
              {products.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectProduct(p)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                        : 'border-white/5 bg-[#1A1A1E] hover:border-white/20'
                    }`}
                  >
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#F5F3EE]">{p.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#9E9A90]">{p.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
