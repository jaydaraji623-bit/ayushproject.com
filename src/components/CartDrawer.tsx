import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    appliedCoupon,
    setAppliedCoupon,
    navigate,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  if (!cartOpen) return null;

  const discount = appliedCoupon?.discountAmount ?? 0;
  const taxable = Math.max(0, cartSubtotal - discount);
  const shippingFee = taxable === 0 ? 0 : taxable >= 999 ? 0 : 79;
  const total = taxable + shippingFee;

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal: cartSubtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || 'Unable to apply coupon');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.coupon.code, discountAmount: data.discountAmount });
        setCouponInput('');
      }
    } catch {
      setCouponError('Network error while checking coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
      <div className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0F0F12]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-4 w-4 text-[#D4AF37]" />
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">Your Bag</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="rounded-lg p-1.5 text-[#A39E93] transition-colors hover:bg-white/5 hover:text-[#F5F3EE]"
            aria-label="Close Cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-4 h-10 w-10 text-[#3D3A32]" />
              <p className="font-display text-2xl text-[#F5F3EE]">Your bag is empty</p>
              <p className="mt-2 max-w-xs text-xs text-[#9E9A90]">
                Explore our handcrafted keychains or design your own personalized piece in 3D.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('shop');
                }}
                className="mt-5 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B]"
              >
                Explore Keychains
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex gap-4 rounded-xl border border-white/10 bg-[#141416] p-3.5"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-[#F5F3EE]">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-[#78746B] hover:text-red-400"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-[#9E9A90]">{item.selectedColor.name}</p>
                    {item.customization?.engravingText && (
                      <p className="mt-1 text-xs text-[#E5C56B]">
                        Engraving: &ldquo;{item.customization.engravingText}&rdquo;
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-white/10 bg-[#0A0A0B]">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                          className="px-2 py-1 text-[#A39E93] hover:text-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-medium tabular-nums text-[#F5F3EE]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                          className="px-2 py-1 text-[#A39E93] hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-mono text-sm font-medium tabular-nums text-[#F5F3EE]">
                        ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-white/10 bg-[#141416] px-6 py-5">
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#9E9A90]" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon (e.g. SHREEJI10)"
                  className="w-full rounded-lg border border-white/10 bg-[#0A0A0B] py-2 pr-3 pl-8 text-xs text-[#F5F3EE] placeholder:text-[#6B6760] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={applyCoupon}
                disabled={validatingCoupon}
                className="rounded-lg border border-[#D4AF37]/50 px-3.5 py-2 text-xs font-medium text-[#E5C56B] hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
              >
                {validatingCoupon ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="mb-2 text-xs text-red-400">{couponError}</p>}
            {appliedCoupon && (
              <div className="mb-2 flex items-center justify-between text-xs text-emerald-400">
                <span>Coupon {appliedCoupon.code} applied</span>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-[#9E9A90] underline"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-[#A39E93]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#F5F3EE]">
                  ₹{cartSubtotal.toLocaleString('en-IN')}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping {shippingFee === 0 ? '(Free above ₹999)' : ''}</span>
                <span className="font-mono tabular-nums text-[#F5F3EE]">
                  {shippingFee === 0 ? 'Complimentary' : `₹${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-semibold text-[#F5F3EE]">
                <span>Total (INR)</span>
                <span className="font-mono tabular-nums text-[#E5C56B]">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('cart');
                }}
                className="rounded-lg border border-white/15 py-2.5 text-xs font-medium text-[#F5F3EE] hover:border-[#D4AF37]"
              >
                View Full Bag
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('checkout');
                }}
                className="rounded-lg bg-[#D4AF37] py-2.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C56B]"
              >
                Checkout Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
