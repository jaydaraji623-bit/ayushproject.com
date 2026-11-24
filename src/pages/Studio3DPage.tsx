import { Expand, Sparkles } from 'lucide-react';
import { Keychain3DViewer } from '../components/Keychain3DViewer.tsx';
import { useStore } from '../context/StoreContext.tsx';

export function Studio3DPage() {
  const { products, selectedProduct, setSelectedProductById, studioConfig, setStudioConfig, navigate } =
    useStore();

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
            360° Interactive Three.js Studio
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F3EE]">
            3D Product Visualization Studio
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#A39E93]">
            Inspect metallic anisotropy, optical acrylic refraction, front and back engravings, and
            exploded hardware assemblies across every keychain in our collection.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('customize')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-[#141416] px-4 py-2.5 text-xs font-medium text-[#E5C56B] hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
          >
            <Sparkles className="h-4 w-4" />
            Customize This Piece
          </button>
          <button
            type="button"
            onClick={() => navigate('ar')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C56B]"
          >
            <Expand className="h-4 w-4" />
            Launch AR View
          </button>
        </div>
      </div>

      {/* Unobstructed 3D Viewport with Collapsible Bottom Dock */}
      <Keychain3DViewer
        config={studioConfig}
        heightClass="h-[540px]"
        onLaunchAR={() => navigate('ar')}
      />

      {/* Catalog Selector Strip Below Viewport */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">
            Load Keychain Into Studio
          </h2>
          {selectedProduct && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedProduct.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() =>
                    setStudioConfig((prev) => ({
                      ...prev,
                      material: c.material,
                      primaryColor: c.hex,
                    }))
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#141416] px-3 py-1.5 text-xs text-[#C7C2B8] hover:border-[#D4AF37]"
                >
                  <span
                    style={{ backgroundColor: c.hex }}
                    className="h-3 w-3 rounded-full border border-white/25"
                  />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {products.map((p) => {
            const active = selectedProduct?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProductById(p.id)}
                className={`flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${
                  active
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-white/10 bg-[#141416] hover:border-white/30'
                }`}
              >
                <img
                  src={p.images[0]}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="h-24 w-full object-cover"
                />
                <div className="p-3">
                  <p className="truncate text-xs font-medium text-[#F5F3EE]">{p.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#9E9A90]">{p.category}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
