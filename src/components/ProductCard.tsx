import { Box, Heart, ShoppingBag, Star } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import type { Product } from '../types.ts';

export function ProductCard({ product }: { product: Product }) {
  const { navigate, addToCart, toggleWishlist, user, guestWishlist } = useStore();
  const [imgFailed, setImgFailed] = useState(false);

  const wishlist = user && user.role === 'customer' ? user.wishlist : guestWishlist;
  const wishlisted = wishlist.includes(product.id);
  const discountPct =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141416] transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/40">
      {/* Image Container (65-75% lead visual) */}
      <div
        onClick={() => navigate('product', { productId: product.id })}
        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-[#1B1B1F]"
      >
        {!imgFailed && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1E1B16] to-[#111114] p-6 text-center">
            <Box className="mb-2 h-8 w-8 text-[#D4AF37]" />
            <span className="font-display text-lg text-[#F5F3EE]">{product.name}</span>
          </div>
        )}

        {/* Single subtle action overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('studio', { productId: product.id });
            }}
            title="Inspect in 3D Studio"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#0A0A0B]/85 text-[#E5C56B] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
          >
            <Box className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            title={wishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#0A0A0B]/85 text-[#F5F3EE] transition-colors hover:border-[#D4AF37]"
          >
            <Heart className={`h-4 w-4 ${wishlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Clean unboxed metadata */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#9E9A90]">
          <span className="truncate">{product.category}</span>
          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#E5C56B] shrink-0">
            <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('product', { productId: product.id })}
          className="mt-2 text-left text-base font-semibold leading-snug text-[#F5F3EE] transition-colors hover:text-[#E5C56B]"
        >
          {product.name}
        </button>

        <p className="mt-1.5 text-xs text-[#8D8980]">{product.materialSpec}</p>

        {/* Color swatch dots */}
        <div className="mt-3 flex items-center gap-2">
          {product.colors.slice(0, 4).map((c) => (
            <span
              key={c.name}
              title={c.name}
              style={{ backgroundColor: c.hex }}
              className="h-3.5 w-3.5 rounded-full border border-white/25"
            />
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-semibold tabular-nums text-[#F5F3EE]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {discountPct > 0 && (
              <>
                <span className="font-mono text-xs tabular-nums text-[#6F6B63] line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-medium text-[#D4AF37]">-{discountPct}%</span>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock === 0}
            onClick={() => addToCart(product, 1, product.colors[0])}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-[#0A0A0B] transition-colors hover:bg-[#E5C56B] disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {product.stock === 0 ? 'Sold Out' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
