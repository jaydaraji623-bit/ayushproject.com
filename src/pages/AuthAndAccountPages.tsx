import { Heart, LogOut, MapPin, Package, Shield, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import type { Order } from '../types.ts';

export function AuthPage() {
  const { setSession, navigate, showToast } = useStore();
  const [tab, setTab] = useState<'login' | 'register' | 'admin'>('login');
  const [adminStatus, setAdminStatus] = useState<{ configured: boolean; mode: string } | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@shreeji.studio');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/admin-status')
      .then((r) => r.json())
      .then((d) => setAdminStatus(d))
      .catch(() => {});
  }, []);

  const submitCustomerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = tab === 'register' ? { name, email, phone, password } : { email, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
      } else {
        setSession(data.token, data.user);
        showToast(`Welcome, ${data.user.name}`);
        navigate('account');
      }
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  };

  const submitAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const isUnclaimed = adminStatus?.mode === 'unclaimed';
      const endpoint = isUnclaimed ? '/api/auth/admin-claim' : '/api/auth/admin-login';
      const payload = isUnclaimed
        ? { email: adminEmail, password: adminPassword }
        : { password: adminPassword };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Admin authentication failed');
      } else {
        setSession(data.token, data.user);
        showToast('Admin studio unlocked');
        navigate('admin');
      }
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-[#141416] p-7">
        <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
          SHREEJI ACCESSORIES
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#F5F3EE]">
          {tab === 'login' ? 'Member Sign In' : tab === 'register' ? 'Create Account' : 'Admin Access'}
        </h1>

        <div className="mt-5 grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-[#0A0A0B] p-1">
          {(['login', 'register', 'admin'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError(null);
              }}
              className={`rounded-md py-2 text-xs font-medium capitalize transition-colors ${
                tab === t ? 'bg-[#D4AF37] text-[#0A0A0B]' : 'text-[#A39E93] hover:text-white'
              }`}
            >
              {t === 'admin' ? 'Admin' : t}
            </button>
          ))}
        </div>

        {tab !== 'admin' ? (
          <form onSubmit={submitCustomerAuth} className="mt-6 space-y-4">
            {tab === 'register' && (
              <>
                <div>
                  <label className="text-xs text-[#C7C2B8]">Full Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#C7C2B8]">Phone Number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98XXXXXXXX"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-xs text-[#C7C2B8]">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#C7C2B8]">Password</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#D4AF37] py-3 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C56B] disabled:opacity-50"
            >
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitAdminAuth} className="mt-6 space-y-4">
            {adminStatus?.mode === 'unclaimed' && (
              <div className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3 text-xs text-[#E5C56B]">
                First-time setup: claim your Admin Dashboard password (8+ characters). Once set,
                this setup locks permanently.
              </div>
            )}
            {adminStatus?.mode === 'unclaimed' && (
              <div>
                <label className="text-xs text-[#C7C2B8]">Admin Email</label>
                <input
                  required
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-[#C7C2B8]">
                {adminStatus?.mode === 'unclaimed' ? 'Create Admin Password' : 'Admin Password / Passcode'}
              </label>
              <input
                required
                type="password"
                minLength={adminStatus?.mode === 'unclaimed' ? 8 : 4}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-3 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C56B] disabled:opacity-50"
            >
              <Shield className="h-4 w-4" />
              {adminStatus?.mode === 'unclaimed' ? 'Claim Admin Access' : 'Unlock Admin Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function AccountPage() {
  const { user, token, setSession, logout, products, addToCart, toggleWishlist, navigate, showToast } =
    useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'profile' | 'orders' | 'addresses' | 'wishlist'>('profile');

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');

  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPin, setAddrPin] = useState('');

  useEffect(() => {
    if (!token || !user || user.role === 'admin') return;
    fetch('/api/orders/my', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {});
  }, [token, user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="font-display text-3xl text-[#F5F3EE]">Sign in to view your account</p>
        <button
          type="button"
          onClick={() => navigate('auth')}
          className="mt-5 rounded-lg bg-[#D4AF37] px-6 py-2.5 text-xs font-semibold text-[#0A0A0B]"
        >
          Go to Login / Register
        </button>
      </div>
    );
  }

  const wishlistedProducts = products.filter((p) => user.wishlist.includes(p.id));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch('/api/account/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: profileName, phone: profilePhone }),
    });
    if (res.ok) {
      const data = await res.json();
      setSession(token, data.user);
      showToast('Profile updated');
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        label: addrLabel,
        fullName: user.name,
        phone: user.phone,
        line1: addrLine1,
        city: addrCity,
        state: addrState,
        pincode: addrPin,
        isDefault: user.addresses.length === 0,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSession(token, { ...user, addresses: data.addresses });
      setAddrLine1('');
      setAddrCity('');
      setAddrState('');
      setAddrPin('');
      showToast('Address saved');
    }
  };

  const deleteAddress = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/api/account/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setSession(token, { ...user, addresses: data.addresses });
    }
  };

  return (
    <div className="mx-auto max-w-[1160px] px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">My Account</p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-[#F5F3EE]">{user.name}</h1>
          <p className="text-xs text-[#9E9A90]">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0A0A0B]"
            >
              Open Admin Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-[#F5F3EE] hover:border-red-400 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { id: 'addresses', label: `Saved Addresses (${user.addresses.length})`, icon: MapPin },
          { id: 'wishlist', label: `Wishlist (${wishlistedProducts.length})`, icon: Heart },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                tab === item.id
                  ? 'bg-[#D4AF37] text-[#0A0A0B]'
                  : 'border border-white/10 bg-[#141416] text-[#B5B0A6] hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {tab === 'profile' && (
          <form
            onSubmit={saveProfile}
            className="max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#141416] p-6"
          >
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">Profile Details</h2>
            <div>
              <label className="text-xs text-[#C7C2B8]">Full Name</label>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE]"
              />
            </div>
            <div>
              <label className="text-xs text-[#C7C2B8]">Phone</label>
              <input
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F3EE]"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B]"
            >
              Save Profile
            </button>
          </form>
        )}

        {tab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#141416] p-10 text-center text-sm text-[#9E9A90]">
                No orders yet. Explore our keychain collections to place your first bespoke order.
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141416] p-5"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-[#E5C56B]">{ord.id}</p>
                    <p className="mt-1 text-xs text-[#A39E93]">
                      {ord.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-[#78746B]">Status: {ord.status}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-semibold tabular-nums text-[#F5F3EE]">
                      ₹{ord.total.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('track', { orderId: ord.id })}
                      className="rounded-lg border border-[#D4AF37]/50 px-3.5 py-2 text-xs text-[#E5C56B]"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'addresses' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              {user.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="flex items-start justify-between rounded-2xl border border-white/10 bg-[#141416] p-5"
                >
                  <div className="text-xs">
                    <p className="font-semibold text-[#E5C56B]">{addr.label}</p>
                    <p className="mt-1 text-sm text-[#F5F3EE]">{addr.line1}</p>
                    <p className="mt-0.5 text-[#9E9A90]">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAddress(addr.id)}
                    className="text-[#78746B] hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={addAddress}
              className="space-y-3 rounded-2xl border border-white/10 bg-[#141416] p-6"
            >
              <h3 className="font-display text-2xl font-semibold text-[#F5F3EE]">Add New Address</h3>
              <input
                required
                placeholder="Label (Home / Office)"
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE]"
              />
              <input
                required
                placeholder="Street / Apartment"
                value={addrLine1}
                onChange={(e) => setAddrLine1(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE]"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  required
                  placeholder="City"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE]"
                />
                <input
                  required
                  placeholder="State"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE]"
                />
                <input
                  required
                  placeholder="PIN"
                  value={addrPin}
                  onChange={(e) => setAddrPin(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE]"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B]"
              >
                Save Address
              </button>
            </form>
          </div>
        )}

        {tab === 'wishlist' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistedProducts.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#141416] p-10 text-center text-sm text-[#9E9A90]">
                No saved keychains in your wishlist yet.
              </div>
            ) : (
              wishlistedProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col rounded-2xl border border-white/10 bg-[#141416] p-4"
                >
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  <p className="mt-3 text-sm font-semibold text-[#F5F3EE]">{p.name}</p>
                  <p className="mt-1 font-mono text-xs text-[#E5C56B]">
                    ₹{p.price.toLocaleString('en-IN')}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => addToCart(p, 1, p.colors[0])}
                      className="flex-1 rounded-lg bg-[#D4AF37] py-2 text-xs font-semibold text-[#0A0A0B]"
                    >
                      Add to Bag
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.id)}
                      className="rounded-lg border border-white/15 px-3 py-2 text-xs text-[#A39E93]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
