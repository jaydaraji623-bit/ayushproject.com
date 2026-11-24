import { CheckCircle2, Mail, MapPin, PackageCheck, Phone, Search, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import type { OrderStatus } from '../types.ts';

interface TrackedOrder {
  id: string;
  customerName: string;
  shippingCity: string;
  items: {
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    colorName: string;
    customizationSummary?: string;
  }[];
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: OrderStatus;
  trackingNote: string;
  createdAt: string;
  updatedAt: string;
}

const STEPS: OrderStatus[] = ['Placed', 'Crafting', 'Quality Check', 'Shipped', 'Delivered'];

export function TrackOrderPage() {
  const { trackOrderId, setTrackOrderId } = useStore();
  const [queryId, setQueryId] = useState(trackOrderId || 'SHJ-1042');
  const [tracked, setTracked] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(idToFetch.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Order not found');
        setTracked(null);
      } else {
        setTracked(data.order);
      }
    } catch {
      setError('Network error while checking order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    lookup(queryId);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">Live Fulfillment</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F3EE]">Track Your Keychain</h1>
      <p className="mt-2 text-sm text-[#A39E93]">
        Enter your Order ID (sample IDs: <span className="font-mono text-[#E5C56B]">SHJ-1042</span> or{' '}
        <span className="font-mono text-[#E5C56B]">SHJ-1043</span>).
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTrackOrderId(queryId);
          lookup(queryId);
        }}
        className="mt-6 flex gap-3"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8D8980]" />
          <input
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            placeholder="Enter Order ID e.g. SHJ-1042"
            className="w-full rounded-lg border border-white/10 bg-[#141416] py-3 pr-4 pl-10 font-mono text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#D4AF37] px-6 py-3 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C56B]"
        >
          {loading ? 'Checking...' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {tracked && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#141416] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="font-mono text-xl font-semibold text-[#E5C56B]">{tracked.id}</p>
              <p className="mt-1 text-xs text-[#9E9A90]">
                Destination: {tracked.shippingCity} · {tracked.paymentMethod}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#8D8980]">Order Total</p>
              <p className="font-mono text-lg font-semibold tabular-nums text-[#F5F3EE]">
                ₹{tracked.total.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Fulfillment Stepper */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {STEPS.map((step, idx) => {
              const currentIdx = STEPS.indexOf(tracked.status);
              const done = tracked.status !== 'Cancelled' && idx <= currentIdx;
              return (
                <div
                  key={step}
                  className={`rounded-xl border p-3 ${
                    done ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-[#0A0A0B]'
                  }`}
                >
                  <PackageCheck
                    className={`h-4 w-4 ${done ? 'text-[#D4AF37]' : 'text-[#52504A]'}`}
                  />
                  <p className={`mt-2 text-xs font-semibold ${done ? 'text-[#F5F3EE]' : 'text-[#6F6B63]'}`}>
                    {step}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-[#0A0A0B] p-4 text-xs text-[#C7C2B8]">
            <span className="font-semibold text-[#E5C56B]">Atelier Update:</span> {tracked.trackingNote}
          </div>

          <div className="mt-6 space-y-3">
            {tracked.items.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-[#F5F3EE]">
                      {item.name} × {item.quantity}
                    </p>
                    <p className="text-[#8D8980]">{item.colorName}</p>
                    {item.customizationSummary && (
                      <p className="text-[#D4AF37]">{item.customizationSummary}</p>
                    )}
                  </div>
                </div>
                <span className="font-mono tabular-nums text-[#F5F3EE]">
                  ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AboutPage() {
  const { navigate } = useStore();
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-14">
      <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
        Our Craft Philosophy
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F3EE] sm:text-5xl">
        Exclusively Keychains. Engineered Like Fine Timepieces.
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#B5B0A6]">
        SHREEJI ACCESSORIES was founded on a singular conviction: the object you carry every single
        day deserves the same material integrity and bespoke artistry as luxury jewelry. We design
        and craft keychains exclusively—combining surgical 316L stainless steel, diamond-beveled
        cast acrylic, 24K gold-leaf resin, and full-grain vegetable-tanned leather.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#E5C56B]">01. Material Purity</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#9E9A90]">
            Every clasp, split ring, and charm body undergoes multi-stage PVD coating and salt-spray
            corrosion testing so finishes endure daily pocket carry.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#E5C56B]">02. Live 3D Precision</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#9E9A90]">
            Our in-browser Three.js studio lets you inspect both front and back engravings, exploded
            hardware tolerances, and metallic light reflections before crafting begins.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#E5C56B]">03. Augmented Reality</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#9E9A90]">
            True WebXR, Scene Viewer, and live camera spatial previews ensure your personalized
            silhouette and scale feel effortless in the real world.
          </p>
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <button
          type="button"
          onClick={() => navigate('customize')}
          className="rounded-lg bg-[#D4AF37] px-6 py-3 text-xs font-semibold text-[#0A0A0B]"
        >
          Design Your Own Keychain
        </button>
        <button
          type="button"
          onClick={() => navigate('shop')}
          className="rounded-lg border border-white/15 px-6 py-3 text-xs font-medium text-[#F5F3EE]"
        >
          Browse Collection
        </button>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Bespoke / Corporate Keychain Order');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, subject, message }),
    });
    if (res.ok) {
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      showToast('Inquiry sent to Shreeji Atelier');
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">Concierge</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F3EE]">Contact Shreeji Atelier</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-[#141416] p-6 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[#D4AF37]" />
              <div>
                <p className="font-semibold text-[#F5F3EE]">Design Studio & Engraving Lab</p>
                <p className="mt-1 text-xs text-[#9E9A90]">
                  14, Kala Ghoda Atelier Lane, Fort, Mumbai 400001, India
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-[#D4AF37]" />
              <div>
                <p className="font-semibold text-[#F5F3EE]">Studio Concierge</p>
                <p className="mt-1 font-mono text-xs text-[#9E9A90]">+91 22 4890 3310 (Mon–Sat, 10 AM – 7 PM)</p>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-[#D4AF37]" />
              <div>
                <p className="font-semibold text-[#F5F3EE]">Bespoke & Bulk Gifting</p>
                <p className="mt-1 text-xs text-[#9E9A90]">atelier@shreejiaccessories.in</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          {submitted ? (
            <div className="rounded-2xl border border-[#D4AF37]/40 bg-[#141416] p-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#D4AF37]" />
              <p className="font-display text-2xl text-[#F5F3EE]">Message Received</p>
              <p className="mt-2 text-xs text-[#9E9A90]">
                Our bespoke engraving team will respond within 24 business hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-5 rounded-lg bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0A0A0B]"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-2xl border border-white/10 bg-[#141416] p-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE]"
                />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE]"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  placeholder="Phone (Optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE]"
                />
                <input
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE]"
                />
              </div>
              <textarea
                required
                rows={4}
                placeholder="Tell us about your custom keychain order, event gifting, or question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-6 py-3 text-xs font-semibold text-[#0A0A0B]"
              >
                <Send className="h-4 w-4" />
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
