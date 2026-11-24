import { Expand, ImagePlus, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Keychain3DViewer } from '../components/Keychain3DViewer.tsx';
import { useStore } from '../context/StoreContext.tsx';
import type {
  EngravingFont,
  KeychainMaterialType,
  KeychainPattern,
  KeychainShape,
} from '../types.ts';

const SHAPES: { id: KeychainShape; label: string }[] = [
  { id: 'bar', label: 'Bar Tag' },
  { id: 'square', label: 'Square Tag' },
  { id: 'medallion', label: 'Medallion' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'heart', label: 'Heart' },
  { id: 'shield', label: 'Shield' },
  { id: 'oval', label: 'Oval' },
];

const MATERIALS: { id: KeychainMaterialType; label: string; defaultHex: string }[] = [
  { id: 'brushed-gold', label: 'Brushed 18K Gold', defaultHex: '#D4AF37' },
  { id: 'obsidian-metal', label: 'Obsidian Matte Steel', defaultHex: '#1E1E22' },
  { id: 'crystal-acrylic', label: 'Crystal Clear Acrylic', defaultHex: '#EEF3F8' },
  { id: 'smoky-resin', label: 'Smoky Archival Resin', defaultHex: '#3A3530' },
  { id: 'rose-brass', label: 'Rose Brass', defaultHex: '#C98A6B' },
  { id: 'sterling-chrome', label: 'Sterling Chrome', defaultHex: '#D8DCE3' },
  { id: 'leather-brass', label: 'Leather & Brass', defaultHex: '#231C18' },
];

const COLORS = [
  { name: 'Champagne Gold', hex: '#D4AF37' },
  { name: 'Obsidian Black', hex: '#1B1B1F' },
  { name: 'Crystal Pearl', hex: '#EEF3F8' },
  { name: 'Rose Copper', hex: '#C98A6B' },
  { name: 'Emerald Jade', hex: '#1D5E4C' },
  { name: 'Royal Sapphire', hex: '#213B6E' },
  { name: 'Crimson Ruby', hex: '#7C1D26' },
];

const FONTS: EngravingFont[] = [
  'Cormorant Garamond',
  'Plus Jakarta Sans',
  'IBM Plex Mono',
  'Georgia',
  'Impact',
];

const PATTERNS: { id: KeychainPattern; label: string }[] = [
  { id: 'brushed', label: 'Brushed Hairline' },
  { id: 'solid', label: 'Solid Satin' },
  { id: 'gold-foil', label: '24K Gold Foil' },
  { id: 'marble', label: 'Marble Vein' },
  { id: 'lattice', label: 'Geometric Lattice' },
];

export function CustomizePage() {
  const { products, studioConfig, setStudioConfig, addToCart, navigate, showToast } = useStore();
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  // Use Sovereign Bespoke Shield or Aurelia Bar as base SKU for custom order pricing
  const baseProduct =
    products.find((p) => p.id === 'shj-010') ??
    products.find((p) => p.customizable) ??
    products[0];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadErr('Please select a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadErr('Photo must be under 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setStudioConfig((prev) => ({ ...prev, photoDataUrl: reader.result as string }));
        showToast('Photo applied to 3D keychain');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomToBag = () => {
    if (!baseProduct) return;
    const matLabel = MATERIALS.find((m) => m.id === studioConfig.material)?.label || 'Bespoke Finish';
    addToCart(
      baseProduct,
      1,
      {
        name: `${matLabel} (${studioConfig.shape})`,
        hex: studioConfig.primaryColor,
        material: studioConfig.material,
      },
      { ...studioConfig }
    );
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
            Live 3D Bespoke Studio
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F3EE]">
            Customize Your Keychain
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#A39E93]">
            Personalize silhouette, material, surface color, pattern, typography, and even upload
            a photo — every change updates your 3D keychain instantaneously.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('ar')}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-[#141416] px-4 py-2.5 text-xs font-medium text-[#E5C56B] hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
        >
          <Expand className="h-4 w-4" />
          Preview Custom Piece in AR
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Live 3D Preview */}
        <div className="lg:col-span-7">
          <Keychain3DViewer
            config={studioConfig}
            heightClass="h-[540px]"
            onLaunchAR={() => navigate('ar')}
          />
        </div>

        {/* Clean Customization Panel */}
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#141416] p-6 lg:col-span-5">
          {/* 1. Custom Name & Reverse Text */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-[#C7C2B8]">Front Name / Initials</label>
              <input
                type="text"
                maxLength={16}
                value={studioConfig.engravingText}
                onChange={(e) =>
                  setStudioConfig((prev) => ({ ...prev, engravingText: e.target.value }))
                }
                placeholder="Your Name"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#C7C2B8]">Back Inscription</label>
              <input
                type="text"
                maxLength={18}
                value={studioConfig.backText || ''}
                onChange={(e) => setStudioConfig((prev) => ({ ...prev, backText: e.target.value }))}
                placeholder="Date or Motto"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Shape */}
          <div>
            <p className="text-xs font-medium text-[#C7C2B8]">Keychain Shape</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStudioConfig((prev) => ({ ...prev, shape: s.id }))}
                  className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                    studioConfig.shape === s.id
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0B]'
                      : 'border-white/10 bg-[#0A0A0B] text-[#B5B0A6] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Material & Font */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-[#C7C2B8]">Material</label>
              <select
                value={studioConfig.material}
                onChange={(e) => {
                  const mat = e.target.value as KeychainMaterialType;
                  const found = MATERIALS.find((m) => m.id === mat);
                  setStudioConfig((prev) => ({
                    ...prev,
                    material: mat,
                    primaryColor: found ? found.defaultHex : prev.primaryColor,
                  }));
                }}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
              >
                {MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#C7C2B8]">Engraving Font</label>
              <select
                value={studioConfig.font}
                onChange={(e) =>
                  setStudioConfig((prev) => ({ ...prev, font: e.target.value as EngravingFont }))
                }
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Color Swatches */}
          <div>
            <p className="text-xs font-medium text-[#C7C2B8]">Body Color Finish</p>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setStudioConfig((prev) => ({ ...prev, primaryColor: c.hex }))}
                  style={{ backgroundColor: c.hex }}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    studioConfig.primaryColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'border-[#F5F3EE] ring-2 ring-[#D4AF37]'
                      : 'border-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 5. Surface Pattern */}
          <div>
            <p className="text-xs font-medium text-[#C7C2B8]">Background Design</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PATTERNS.map((pat) => (
                <button
                  key={pat.id}
                  type="button"
                  onClick={() => setStudioConfig((prev) => ({ ...prev, pattern: pat.id }))}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    studioConfig.pattern === pat.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#E5C56B]'
                      : 'border-white/10 bg-[#0A0A0B] text-[#A39E93] hover:text-white'
                  }`}
                >
                  {pat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Photo Upload */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#C7C2B8]">Upload Photo (Photo Keychain)</p>
              {studioConfig.photoDataUrl && (
                <button
                  type="button"
                  onClick={() => setStudioConfig((prev) => ({ ...prev, photoDataUrl: undefined }))}
                  className="inline-flex items-center gap-1 text-xs text-red-400 hover:underline"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove Photo
                </button>
              )}
            </div>
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-[#0A0A0B] px-4 py-3 text-xs text-[#B5B0A6] transition-colors hover:border-[#D4AF37] hover:text-[#E5C56B]">
              <ImagePlus className="h-4 w-4 text-[#D4AF37]" />
              <span>{studioConfig.photoDataUrl ? 'Replace Uploaded Photo' : 'Upload Portrait or Graphic'}</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            {uploadErr && <p className="mt-1 text-xs text-red-400">{uploadErr}</p>}
          </div>

          {/* 7. Price & Add to Bag */}
          <div className="border-t border-white/10 pt-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-xs text-[#9E9A90]">Custom Studio Edition</span>
              <span className="font-mono text-xl font-semibold tabular-nums text-[#E5C56B]">
                ₹{(baseProduct?.price ?? 1399).toLocaleString('en-IN')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddCustomToBag}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-3 text-sm font-semibold text-[#0A0A0B] transition-colors hover:bg-[#E5C56B]"
            >
              <ShoppingBag className="h-4 w-4" />
              Add Customized Keychain to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
