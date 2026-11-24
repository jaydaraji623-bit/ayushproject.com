import {
  Box,
  IndianRupee,
  Layers,
  Package,
  Plus,
  Shield,
  Tag,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import {
  KEYCHAIN_CATEGORIES,
  type Coupon,
  type CustomerUser,
  type Inquiry,
  type KeychainCategory,
  type KeychainShape,
  type Order,
  type OrderStatus,
  type Product,
} from '../types.ts';

export function AdminDashboardPage() {
  const { user, token, products, refreshProducts, navigate, showToast } = useStore();
  const [tab, setTab] = useState<'analytics' | 'products' | 'orders' | 'customers' | 'coupons'>(
    'analytics'
  );
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockCount: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  // New / Edit Product form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState<KeychainCategory>('Custom Name Keychains');
  const [pPrice, setPPrice] = useState(1199);
  const [pOriginalPrice, setPOriginalPrice] = useState(1499);
  const [pStock, setPStock] = useState(30);
  const [pMaterial, setPMaterial] = useState('316L Stainless Steel · 18K PVD');
  const [pShape, setPShape] = useState<KeychainShape>('bar');
  const [pDesc, setPDesc] = useState('');
  const [pImageUrl, setPImageUrl] = useState('/src/assets/images/keychain_custom_gold_1795510740809.jpg');
  const [pModelUrl, setPModelUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Coupon form state
  const [cCode, setCCode] = useState('');
  const [cType, setCType] = useState<'percent' | 'flat'>('percent');
  const [cValue, setCValue] = useState(15);
  const [cMin, setCMin] = useState(999);

  const loadAdminData = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    const [ovRes, ordRes] = await Promise.all([
      fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (ovRes.ok) {
      const ov = await ovRes.json();
      setAnalytics(ov.analytics);
      setCustomers(ov.customers || []);
      setCoupons(ov.coupons || []);
      setInquiries(ov.inquiries || []);
    }
    if (ordRes.ok) {
      const od = await ordRes.json();
      setOrders(od.orders || []);
    }
  }, [token, user]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  if (!user || user.role !== 'admin' || !token) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <Shield className="mx-auto mb-4 h-10 w-10 text-[#D4AF37]" />
        <h1 className="font-display text-3xl font-semibold text-[#F5F3EE]">
          Admin Authentication Required
        </h1>
        <p className="mt-2 text-sm text-[#9E9A90]">
          Sign in with your Admin passcode or claim first-run Admin access to manage products, 3D
          models, inventory, and orders.
        </p>
        <button
          type="button"
          onClick={() => navigate('auth')}
          className="mt-6 rounded-lg bg-[#D4AF37] px-6 py-3 text-xs font-semibold text-[#0A0A0B]"
        >
          Open Admin Login
        </button>
      </div>
    );
  }

  const handleUpload = async (file: File, kind: 'image' | 'model') => {
    setUploadingFile(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Read failed'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filename: file.name, dataBase64, kind }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Upload failed');
      } else {
        if (kind === 'image') setPImageUrl(data.url);
        else setPModelUrl(data.url);
        showToast(`${kind === 'image' ? 'Photo' : '3D Model'} uploaded`);
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const resetProductForm = () => {
    setEditingId(null);
    setPName('');
    setPCategory('Custom Name Keychains');
    setPPrice(1199);
    setPOriginalPrice(1499);
    setPStock(30);
    setPMaterial('316L Stainless Steel · 18K PVD');
    setPShape('bar');
    setPDesc('');
    setPImageUrl('/src/assets/images/keychain_custom_gold_1795510740809.jpg');
    setPModelUrl('');
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: pName,
      category: pCategory,
      price: Number(pPrice),
      originalPrice: Number(pOriginalPrice),
      stock: Number(pStock),
      materialSpec: pMaterial,
      description: pDesc || 'Handcrafted bespoke keychain from Shreeji Accessories.',
      images: [pImageUrl],
      default3D: {
        shape: pShape,
        material: 'brushed-gold',
        primaryColor: '#D4AF37',
        accentColor: '#F5F3EE',
        engravingText: 'SHREEJI',
        backText: 'ATELIER',
        font: 'Cormorant Garamond',
        pattern: 'brushed',
        modelUrl: pModelUrl || undefined,
      },
      modelUrl: pModelUrl || undefined,
    };

    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await refreshProducts();
      await loadAdminData();
      resetProductForm();
      showToast(editingId ? 'Keychain updated' : 'Keychain published');
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setPName(p.name);
    setPCategory(p.category);
    setPPrice(p.price);
    setPOriginalPrice(p.originalPrice);
    setPStock(p.stock);
    setPMaterial(p.materialSpec);
    setPShape(p.default3D.shape);
    setPDesc(p.description);
    setPImageUrl(p.images[0] || '');
    setPModelUrl(p.default3D.modelUrl || '');
    setTab('products');
  };

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await refreshProducts();
      await loadAdminData();
      showToast('Keychain removed');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, trackingNote: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, trackingNote }),
    });
    if (res.ok) {
      await loadAdminData();
      showToast(`Order ${orderId} updated to ${status}`);
    }
  };

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        code: cCode,
        type: cType,
        value: cValue,
        minOrder: cMin,
        description: `${cValue}${cType === 'percent' ? '%' : '₹'} off min ₹${cMin}`,
      }),
    });
    if (res.ok) {
      setCCode('');
      await loadAdminData();
      showToast('Discount coupon created');
    }
  };

  const toggleCoupon = async (code: string) => {
    await fetch(`/api/coupons/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    await loadAdminData();
  };

  const deleteCoupon = async (code: string) => {
    await fetch(`/api/coupons/${code}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadAdminData();
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="border-b border-white/10 pb-6">
        <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
          Atelier Operations
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F3EE]">Admin Dashboard</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { id: 'analytics', label: 'Analytics', icon: IndianRupee },
          { id: 'products', label: `Products & 3D Models (${products.length})`, icon: Box },
          { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
          { id: 'coupons', label: `Discounts (${coupons.length})`, icon: Tag },
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

      {/* 1. ANALYTICS */}
      {tab === 'analytics' && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
              <p className="text-xs text-[#9E9A90]">Total Revenue</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#E5C56B]">
                ₹{analytics.totalRevenue.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
              <p className="text-xs text-[#9E9A90]">Orders Received</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#F5F3EE]">
                {analytics.totalOrders}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
              <p className="text-xs text-[#9E9A90]">Active Keychain SKUs</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#F5F3EE]">
                {products.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
              <p className="text-xs text-[#9E9A90]">Low Stock SKUs (≤15)</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#F5F3EE]">
                {products.filter((p) => p.stock <= 15).length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">
              Category Inventory Breakdown
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {KEYCHAIN_CATEGORIES.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                const stockSum = products
                  .filter((p) => p.category === cat)
                  .reduce((s, p) => s + p.stock, 0);
                return (
                  <div key={cat} className="rounded-xl border border-white/10 bg-[#0A0A0B] p-4">
                    <p className="truncate text-xs font-medium text-[#E5C56B]">{cat}</p>
                    <p className="mt-2 font-mono text-sm tabular-nums text-[#F5F3EE]">
                      {count} SKUs · {stockSum} units
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTS & 3D MODELS */}
      {tab === 'products' && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <form
            onSubmit={saveProduct}
            className="space-y-4 rounded-2xl border border-white/10 bg-[#141416] p-6 lg:col-span-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">
                {editingId ? 'Edit Keychain' : 'Add Keychain Product'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-xs text-[#D4AF37] hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div>
              <label className="text-xs text-[#C7C2B8]">Keychain Name *</label>
              <input
                required
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F3EE]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#C7C2B8]">Category</label>
                <select
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value as KeychainCategory)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE]"
                >
                  {KEYCHAIN_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#C7C2B8]">3D Base Silhouette</label>
                <select
                  value={pShape}
                  onChange={(e) => setPShape(e.target.value as KeychainShape)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE]"
                >
                  <option value="bar">Bar</option>
                  <option value="square">Square</option>
                  <option value="medallion">Medallion</option>
                  <option value="hexagon">Hexagon</option>
                  <option value="heart">Heart</option>
                  <option value="shield">Shield</option>
                  <option value="oval">Oval</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#C7C2B8]">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={pPrice}
                  onChange={(e) => setPPrice(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 font-mono text-xs text-[#F5F3EE]"
                />
              </div>
              <div>
                <label className="text-xs text-[#C7C2B8]">MRP (₹)</label>
                <input
                  type="number"
                  required
                  value={pOriginalPrice}
                  onChange={(e) => setPOriginalPrice(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 font-mono text-xs text-[#F5F3EE]"
                />
              </div>
              <div>
                <label className="text-xs text-[#C7C2B8]">Stock</label>
                <input
                  type="number"
                  required
                  value={pStock}
                  onChange={(e) => setPStock(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 font-mono text-xs text-[#F5F3EE]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#C7C2B8]">Material Specification</label>
              <input
                value={pMaterial}
                onChange={(e) => setPMaterial(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE]"
              />
            </div>

            <div>
              <label className="text-xs text-[#C7C2B8]">Description</label>
              <textarea
                rows={3}
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F3EE]"
              />
            </div>

            {/* File Uploads: Photo & GLB/GLTF */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-[#0A0A0B] px-3 py-2.5 text-xs text-[#E5C56B] hover:border-[#D4AF37]">
                <Upload className="h-3.5 w-3.5" />
                <span>{uploadingFile ? 'Uploading...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'image')}
                  className="hidden"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-[#0A0A0B] px-3 py-2.5 text-xs text-[#E5C56B] hover:border-[#D4AF37]">
                <Layers className="h-3.5 w-3.5" />
                <span>{pModelUrl ? 'GLB Attached' : 'Upload .GLB/.GLTF'}</span>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'model')}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-3 text-xs font-semibold text-[#0A0A0B]"
            >
              <Plus className="h-4 w-4" />
              {editingId ? 'Save Product Changes' : 'Publish Keychain'}
            </button>
          </form>

          {/* Product Inventory Table */}
          <div className="space-y-3 lg:col-span-7">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141416] p-4"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="h-14 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#F5F3EE]">{p.name}</p>
                    <p className="text-xs text-[#9E9A90]">
                      {p.category} · Stock: <span className="font-mono text-[#F5F3EE]">{p.stock}</span>
                      {p.default3D.modelUrl ? ' · Custom GLB' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-[#E5C56B]">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#F5F3EE] hover:border-[#D4AF37]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(p.id)}
                    className="rounded-lg p-1.5 text-[#78746B] hover:text-red-400"
                    aria-label="Delete product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ORDERS */}
      {tab === 'orders' && (
        <div className="mt-8 space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="rounded-2xl border border-white/10 bg-[#141416] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-base font-semibold text-[#E5C56B]">
                    {ord.id} · {ord.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-[#9E9A90]">
                    {ord.customerEmail} · {ord.customerPhone} · {ord.shippingAddress.city}
                  </p>
                  <p className="mt-1 text-xs text-[#C7C2B8]">
                    {ord.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-semibold tabular-nums text-[#F5F3EE]">
                    ₹{ord.total.toLocaleString('en-IN')}
                  </span>
                  <select
                    value={ord.status}
                    onChange={(e) =>
                      updateOrderStatus(ord.id, e.target.value as OrderStatus, ord.trackingNote)
                    }
                    className="rounded-lg border border-[#D4AF37]/40 bg-[#0A0A0B] px-3 py-1.5 text-xs font-medium text-[#E5C56B]"
                  >
                    {(['Placed', 'Crafting', 'Quality Check', 'Shipped', 'Delivered', 'Cancelled'] as OrderStatus[]).map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. CUSTOMERS & INQUIRIES */}
      {tab === 'customers' && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">
              Registered Customers ({customers.length})
            </h2>
            <div className="mt-4 space-y-3">
              {customers.length === 0 ? (
                <p className="text-xs text-[#8D8980]">No customer accounts registered yet.</p>
              ) : (
                customers.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A0A0B] p-3.5 text-xs"
                  >
                    <div>
                      <p className="font-medium text-[#F5F3EE]">{c.name}</p>
                      <p className="text-[#9E9A90]">{c.email}</p>
                    </div>
                    <span className="font-mono text-[#E5C56B]">{c.addresses.length} addresses</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">
              Concierge Inquiries ({inquiries.length})
            </h2>
            <div className="mt-4 space-y-3">
              {inquiries.length === 0 ? (
                <p className="text-xs text-[#8D8980]">No inquiries submitted yet.</p>
              ) : (
                inquiries.map((inq) => (
                  <div key={inq.id} className="rounded-xl border border-white/10 bg-[#0A0A0B] p-4 text-xs">
                    <p className="font-semibold text-[#E5C56B]">
                      {inq.subject} — {inq.name}
                    </p>
                    <p className="mt-1 text-[#A39E93]">{inq.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. COUPONS */}
      {tab === 'coupons' && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <form
            onSubmit={createCoupon}
            className="space-y-4 rounded-2xl border border-white/10 bg-[#141416] p-6 lg:col-span-4"
          >
            <h2 className="font-display text-2xl font-semibold text-[#F5F3EE]">Create Coupon</h2>
            <input
              required
              placeholder="Code (e.g. FESTIVE20)"
              value={cCode}
              onChange={(e) => setCCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 font-mono text-xs text-[#F5F3EE]"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={cType}
                onChange={(e) => setCType(e.target.value as 'percent' | 'flat')}
                className="rounded-lg border border-white/10 bg-[#0A0A0B] px-2 py-2 text-xs text-[#F5F3EE]"
              >
                <option value="percent">% Off</option>
                <option value="flat">₹ Flat</option>
              </select>
              <input
                type="number"
                required
                value={cValue}
                onChange={(e) => setCValue(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 font-mono text-xs text-[#F5F3EE]"
              />
              <input
                type="number"
                required
                value={cMin}
                onChange={(e) => setCMin(Number(e.target.value))}
                placeholder="Min ₹"
                className="rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 font-mono text-xs text-[#F5F3EE]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-xs font-semibold text-[#0A0A0B]"
            >
              Add Discount Code
            </button>
          </form>

          <div className="space-y-3 lg:col-span-8">
            {coupons.map((cp) => (
              <div
                key={cp.code}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141416] p-4 text-xs"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-[#E5C56B]">{cp.code}</p>
                  <p className="mt-0.5 text-[#9E9A90]">{cp.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCoupon(cp.code)}
                    className={`rounded-lg border px-3 py-1.5 text-xs ${
                      cp.active
                        ? 'border-emerald-500/40 text-emerald-400'
                        : 'border-white/10 text-[#78746B]'
                    }`}
                  >
                    {cp.active ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCoupon(cp.code)}
                    className="p-1.5 text-[#78746B] hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
