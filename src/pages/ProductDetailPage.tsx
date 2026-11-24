import { ArrowLeft, Box, Check, Expand, Heart, Minus, Plus, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Keychain3DViewer } from '../components/Keychain3DViewer.tsx';
import { useStore } from '../context/StoreContext.tsx';
import type { Keychain3DConfig, KeychainColorOption } from '../types.ts';

export function ProductDetailPage() {
  const {
    selectedProduct,
    navigate,
    addToCart,
    toggleWishlist,
    user,
    guestWishlist,
    setStudioConfig,
  } = useStore();

  const [viewMode, setViewMode] = useState<'3d' | 'photos'>('3d');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<KeychainColorOption | null>(null);
  const [customText, setCustomText] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedColor(selectedProduct.colors[0] ?? null);
      setCustomText(selectedProduct.default3D.engravingText || '');
      setActiveImageIdx(0);
      setQuantity(1);
    }
  }, [selectedProduct]);

  if (!selectedProduct) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-20 text-center">
        <p className="font-display text-3xl text-[#F5F3EE]">Keychain not found</p>
        <button
          type="button"
          onClick={() => navigate('shop')}
          className="mt-4 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B]"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const activeColor = selectedColor ?? selectedProduct.colors[0];
  const live3DConfig: Keychain3DConfig = {
    ...selectedProduct.default3D,
    material: activeColor?.material ?? selectedProduct.default3D.material,
    primaryColor: activeColor?.hex ?? selectedProduct.default3D.primaryColor,
    engravingText: customText || selectedProduct.default3D.engravingText,
  };

  const wishlist = user && user.role === 'customer' ? user.wishlist : guestWishlist;
  const isWishlisted = wishlist.includes(selectedProduct.id);
  const discountPct =
    selectedProduct.originalPrice > selectedProduct.price
      ? Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <button
        type="button"
        onClick={() => navigate('shop')}
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-[#A39E93] hover:text-[#E5C56B]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Keychain Collections
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Sticky Visual Module (2D Gallery + Live 3D Viewer) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-white/10 bg-[#141416] p-1">
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === '3d' ? 'bg-[#D4AF37] text-[#0A0A0B]' : 'text-[#B5B0A6] hover:text-white'
                }`}
              >
                <Box className="h-3.5 w-3.5" />
                Interactive 3D Model
              </button>
              <button
                type="button"
                onClick={() => setViewMode('photos')}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'photos' ? 'bg-[#D4AF37] text-[#0A0A0B]' : 'text-[#B5B0A6] hover:text-white'
                }`}
              >
                Studio Photography ({selectedProduct.images.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setStudioConfig(live3DConfig);
                navigate('ar');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/50 bg-[#141416] px-3.5 py-2 text-xs font-medium text-[#E5C56B] hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
            >
              <Expand className="h-3.5 w-3.5" />
              View in AR
            </button>
          </div>

          {viewMode === '3d' ? (
            <Keychain3DViewer
              config={live3DConfig}
              heightClass="h-[480px]"
              onLaunchAR={() => {
                setStudioConfig(live3DConfig);
                navigate('ar');
              }}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141416]">
              <img
                src={selectedProduct.images[activeImageIdx] || selectedProduct.images[0]}
                alt={selectedProduct.name}
                referrerPolicy="no-referrer"
                className="h-[480px] w-full object-cover"
              />
            </div>
          )}

          {/* Thumbnails */}
          <div className="flex items-center gap-3">
            {selectedProduct.images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => {
                  setViewMode('photos');
                  setActiveImageIdx(i);
                }}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  viewMode === 'photos' && activeImageIdx === i
                    ? 'border-[#D4AF37]'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img
                  src={img}
                  alt={`${selectedProduct.name} view ${i + 1}`}
                  referrerPolicy="no-referrer"
                  className="h-16 w-20 object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-[#141416] p-7">
            <div className="flex items-center justify-between gap-2 text-xs text-[#A39E93]">
              <span>{selectedProduct.category}</span>
              <span className="inline-flex items-center gap-1 font-mono text-[#E5C56B]">
                <Star className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                {selectedProduct.rating.toFixed(1)} ({selectedProduct.reviewCount} reviews)
              </span>
            </div>

            <h1 className="mt-2 font-display text-3xl font-semibold text-[#F5F3EE]">
              {selectedProduct.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-semibold tabular-nums text-[#E5C56B]">
                ₹{selectedProduct.price.toLocaleString('en-IN')}
              </span>
              {discountPct > 0 && (
                <>
                  <span className="font-mono text-sm tabular-nums text-[#78746B] line-through">
                    ₹{selectedProduct.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-medium text-emerald-400">Save {discountPct}%</span>
                </>
              )}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#B5B0A6]">
              {selectedProduct.description}
            </p>

            {/* Technical Specs */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/10 py-4 text-xs">
              <div>
                <p className="text-[#78746B]">Material</p>
                <p className="mt-0.5 font-medium text-[#F5F3EE]">{selectedProduct.materialSpec}</p>
              </div>
              <div>
                <p className="text-[#78746B]">Dimensions & Weight</p>
                <p className="mt-0.5 font-medium text-[#F5F3EE]">
                  {selectedProduct.dimensions} · {selectedProduct.weightGrams}g
                </p>
              </div>
            </div>

            {/* Color Finish Options */}
            <div className="mt-5">
              <p className="text-xs font-medium text-[#C7C2B8]">
                Finish: <span className="text-[#E5C56B]">{activeColor?.name}</span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {selectedProduct.colors.map((c) => {
                  const selected = activeColor?.name === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        selected
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F5F3EE]'
                          : 'border-white/10 bg-[#0A0A0B] text-[#A39E93] hover:border-white/30'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: c.hex }}
                        className="h-3.5 w-3.5 rounded-full border border-white/25"
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Engraving Customization */}
            {selectedProduct.customizable && (
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#C7C2B8]">
                    Engraved Text (Updates 3D Live)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStudioConfig(live3DConfig);
                      navigate('customize');
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    Full 3D Customizer
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={18}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter name, initials, or date..."
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            )}

            {/* Stock & Quantity */}
            <div className="mt-5 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className={selectedProduct.stock > 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {selectedProduct.stock > 0
                    ? `In Stock (${selectedProduct.stock} ready to craft)`
                    : 'Out of Stock'}
                </span>
              </div>

              <div className="inline-flex items-center rounded-lg border border-white/10 bg-[#0A0A0B]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-[#A39E93] hover:text-white"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-3 font-mono text-xs tabular-nums text-[#F5F3EE]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(selectedProduct.stock || 1, q + 1))}
                  className="px-3 py-2 text-[#A39E93] hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Purchase CTAs */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={selectedProduct.stock === 0}
                onClick={() =>
                  addToCart(selectedProduct, quantity, activeColor, {
                    engravingText: customText,
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D4AF37] bg-transparent px-4 py-3 text-xs font-semibold text-[#E5C56B] transition-colors hover:bg-[#D4AF37]/10 disabled:opacity-40"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>
              <button
                type="button"
                disabled={selectedProduct.stock === 0}
                onClick={() => {
                  addToCart(selectedProduct, quantity, activeColor, {
                    engravingText: customText,
                  });
                  navigate('checkout');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-3 text-xs font-semibold text-[#0A0A0B] transition-colors hover:bg-[#E5C56B] disabled:opacity-40"
              >
                Buy Now
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toggleWishlist(selectedProduct.id)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-xs text-[#C7C2B8] hover:border-[#D4AF37]/50 hover:text-white"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`}
                />
                {isWishlisted ? 'Wishlisted' : 'Save to Wishlist'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudioConfig(live3DConfig);
                  navigate('ar');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-xs text-[#C7C2B8] hover:border-[#D4AF37]/50 hover:text-white"
              >
                <Expand className="h-3.5 w-3.5 text-[#D4AF37]" />
                View in AR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
