import { CheckCircle2, CreditCard, Minus, Plus, ShieldCheck, ShoppingBag, Tag, Trash2, Truck } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import type { Order } from '../types.ts';

export function CartPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    appliedCoupon,
    setAppliedCoupon,
    navigate,
  } = useStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponErr, setCouponErr] = useState<string | null>(null);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const taxable = Math.max(0, cartSubtotal - discount);
  const shippingFee = taxable === 0 ? 0 : taxable >= 999 ? 0 : 79;
  const total = taxable + shippingFee;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponErr(null);
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode.trim(), subtotal: cartSubtotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCouponErr(data.error || 'Invalid coupon');
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon({ code: data.coupon.code, discountAmount: data.discountAmount });
      setCouponCode('');
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <h1 className="font-display text-4xl font-semibold text-[#F5F3EE]">Shopping Bag</h1>
      <p className="mt-1 text-sm text-[#9E9A90]">
        Complimentary insured shipping across India on orders ₹999 and above.
      </p>

      {cart.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-[#141416] p-14 text-center">
          <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-[#D4AF37]" />
          <p className="font-display text-2xl text-[#F5F3EE]">Your bag is currently empty</p>
          <p className="mt-2 text-sm text-[#9E9A90]">
            Discover signature keychains or craft a personalized design in our 3D studio.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('shop')}
              className="rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B]"
            >
              Shop Keychains
            </button>
            <button
              type="button"
              onClick={() => navigate('customize')}
              className="rounded-lg border border-white/15 px-5 py-2.5 text-xs font-medium text-[#F5F3EE]"
            >
              Customize in 3D
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {cart.map((item) => (
              <div
                key={item.cartItemId}
                className="flex flex-wrap items-center gap-5 rounded-2xl border border-white/10 bg-[#141416] p-4 sm:flex-nowrap"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="h-24 w-28 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#9E9A90]">{item.category}</p>
                  <p className="mt-0.5 text-base font-semibold text-[#F5F3EE]">{item.name}</p>
                  <p className="mt-1 text-xs text-[#A39E93]">Finish: {item.selectedColor.name}</p>
                  {item.customization?.engravingText && (
                    <p className="mt-1 text-xs text-[#E5C56B]">
                      Custom Engraving: &ldquo;{item.customization.engravingText}&rdquo;
                      {item.customization.shape ? ` · ${item.customization.shape}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center rounded-lg border border-white/10 bg-[#0A0A0B]">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                      className="px-2.5 py-2 text-[#A39E93] hover:text-white"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 font-mono text-xs tabular-nums text-[#F5F3EE]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                      className="px-2.5 py-2 text-[#A39E93] hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-24 text-right font-mono text-sm font-semibold tabular-nums text-[#E5C56B]">
                    ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="p-1.5 text-[#78746B] hover:text-red-400"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
              <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">Order Summary</h2>

              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#9E9A90]" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="SHREEJI10 or WELCOME15"
                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0B] py-2 pr-3 pl-8 text-xs text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="rounded-lg border border-[#D4AF37]/50 px-3.5 py-2 text-xs font-medium text-[#E5C56B] hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
                >
                  Apply
                </button>
              </div>
              {couponErr && <p className="mt-2 text-xs text-red-400">{couponErr}</p>}
              {appliedCoupon && (
                <p className="mt-2 text-xs text-emerald-400">
                  Applied {appliedCoupon.code} (-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')})
                </p>
              )}

              <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs text-[#A39E93]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums text-[#F5F3EE]">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon Discount</span>
                    <span className="font-mono tabular-nums">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-mono tabular-nums text-[#F5F3EE]">
                    {shippingFee === 0 ? 'Free' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold text-[#F5F3EE]">
                  <span>Total</span>
                  <span className="font-mono tabular-nums text-[#E5C56B]">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('checkout')}
                className="mt-6 w-full rounded-lg bg-[#D4AF37] py-3 text-sm font-semibold text-[#0A0A0B] hover:bg-[#E5C56B]"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    appliedCoupon,
    user,
    token,
    clearCart,
    refreshProducts,
    navigate,
    showToast,
  } = useStore();

  const defaultAddr = user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0];

  const [customerName, setCustomerName] = useState(defaultAddr?.fullName || user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(defaultAddr?.phone || user?.phone || '');
  const [line1, setLine1] = useState(defaultAddr?.line1 || '');
  const [city, setCity] = useState(defaultAddr?.city || '');
  const [stateName, setStateName] = useState(defaultAddr?.state || '');
  const [pincode, setPincode] = useState(defaultAddr?.pincode || '');
  const [paymentMethod, setPaymentMethod] = useState<'Demo Card / UPI' | 'Cash on Delivery'>(
    'Demo Card / UPI'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const taxable = Math.max(0, cartSubtotal - discount);
  const shippingFee = taxable === 0 ? 0 : taxable >= 999 ? 0 : 79;
  const total = taxable + shippingFee;

  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-[#D4AF37]/40 bg-[#141416] p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#D4AF37]" />
          <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
            Order Confirmed
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F3EE]">
            Thank You, {confirmedOrder.customerName}
          </h1>
          <p className="mt-2 text-sm text-[#A39E93]">
            Order <span className="font-mono font-semibold text-[#E5C56B]">{confirmedOrder.id}</span>{' '}
            has been queued at the Shreeji Keychain Atelier.
          </p>

          <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-[#0A0A0B] p-5 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-[#8D8980]">Payment Method</span>
              <span className="text-[#F5F3EE]">
                {confirmedOrder.paymentMethod} ({confirmedOrder.paymentStatus})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8D8980]">Total Paid / Payable</span>
              <span className="font-mono font-semibold text-[#E5C56B]">
                ₹{confirmedOrder.total.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8D8980]">Delivery Destination</span>
              <span className="text-[#F5F3EE]">
                {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state} -{' '}
                {confirmedOrder.shippingAddress.pincode}
              </span>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('track', { orderId: confirmedOrder.id })}
              className="rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C56B]"
            >
              Track Order {confirmedOrder.id}
            </button>
            <button
              type="button"
              onClick={() => navigate('shop')}
              className="rounded-lg border border-white/15 px-5 py-2.5 text-xs font-medium text-[#F5F3EE]"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress: { line1, city, state: stateName, pincode },
          items: cart.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
            selectedColor: c.selectedColor,
            customization: c.customization,
          })),
          discountCode: appliedCoupon?.code ?? null,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not place order.');
      } else {
        clearCart();
        await refreshProducts();
        setConfirmedOrder(data.order);
        showToast(`Order ${data.order.id} placed!`);
      }
    } catch {
      setError('Network error while submitting order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="font-display text-3xl text-[#F5F3EE]">No items to check out</p>
        <button
          type="button"
          onClick={() => navigate('shop')}
          className="mt-4 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B]"
        >
          Shop Keychains
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <h1 className="font-display text-4xl font-semibold text-[#F5F3EE]">Checkout</h1>
      <p className="mt-1 text-sm text-[#9E9A90]">
        Secure shipping & gateway-ready order processing.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {user && user.addresses.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#141416] p-5">
              <p className="mb-3 text-xs font-semibold tracking-wider text-[#D4AF37] uppercase">
                Fill from Saved Addresses
              </p>
              <div className="flex flex-wrap gap-2">
                {user.addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setCustomerName(addr.fullName);
                      setCustomerPhone(addr.phone);
                      setLine1(addr.line1);
                      setCity(addr.city);
                      setStateName(addr.state);
                      setPincode(addr.pincode);
                    }}
                    className="rounded-lg border border-white/15 bg-[#0A0A0B] px-3 py-2 text-left text-xs text-[#F5F3EE] hover:border-[#D4AF37]"
                  >
                    <span className="font-semibold text-[#E5C56B]">{addr.label}</span> — {addr.city}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">
              Customer & Shipping Address
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-[#C7C2B8]">Full Name *</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#C7C2B8]">Email Address *</label>
                <input
                  required
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#C7C2B8]">Mobile Number *</label>
                <input
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-[#C7C2B8]">Street / Flat / Building *</label>
                <input
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#C7C2B8]">City *</label>
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#C7C2B8]">State *</label>
                <input
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#C7C2B8]">PIN Code *</label>
                <input
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">Payment Method</h2>
            <p className="mt-1 text-xs text-[#9E9A90]">
              Gateway-ready checkout: online card/UPI runs in Demo Authorization mode; Cash on
              Delivery confirms immediately.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Demo Card / UPI')}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  paymentMethod === 'Demo Card / UPI'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-white/10 bg-[#0A0A0B]'
                }`}
              >
                <CreditCard className="mt-0.5 h-5 w-5 text-[#D4AF37]" />
                <div>
                  <p className="text-xs font-semibold text-[#F5F3EE]">UPI / Card (Demo Gateway)</p>
                  <p className="mt-1 text-[11px] text-[#9E9A90]">
                    Instant simulated Razorpay/Stripe authorization without charging a real card.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-white/10 bg-[#0A0A0B]'
                }`}
              >
                <Truck className="mt-0.5 h-5 w-5 text-[#D4AF37]" />
                <div>
                  <p className="text-xs font-semibold text-[#F5F3EE]">Cash on Delivery (COD)</p>
                  <p className="mt-1 text-[11px] text-[#9E9A90]">
                    Pay in cash or UPI upon doorstep delivery. Free delivery above ₹999.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">Items ({cart.length})</h2>
            <div className="mt-4 space-y-3 border-b border-white/10 pb-4">
              {cart.map((item) => (
                <div key={item.cartItemId} className="flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#F5F3EE]">
                      {item.name} × {item.quantity}
                    </p>
                    <p className="text-[#8D8980]">{item.selectedColor.name}</p>
                  </div>
                  <span className="font-mono tabular-nums text-[#F5F3EE]">
                    ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-xs text-[#A39E93]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#F5F3EE]">
                  ₹{cartSubtotal.toLocaleString('en-IN')}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-mono tabular-nums">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-mono tabular-nums text-[#F5F3EE]">
                  {shippingFee === 0 ? 'Complimentary' : `₹${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold text-[#F5F3EE]">
                <span>Payable Total</span>
                <span className="font-mono tabular-nums text-[#E5C56B]">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-3 text-sm font-semibold text-[#0A0A0B] hover:bg-[#E5C56B] disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {submitting ? 'Confirming Order...' : `Confirm Order · ₹${total.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
