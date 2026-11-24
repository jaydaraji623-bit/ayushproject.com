import crypto from 'crypto';
import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SEED_COUPONS, SEED_ORDERS, SEED_PRODUCTS } from './server/seedData.ts';
import type { Coupon, CustomerUser, Inquiry, Order, Product } from './src/types.ts';

interface StoredUser extends CustomerUser {
  passwordHash: string;
}

interface AdminCredential {
  email: string;
  passwordHash: string;
  claimedAt: string;
}

interface StoreState {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  users: StoredUser[];
  inquiries: Inquiry[];
  adminCredential: AdminCredential | null;
}

const PORT = 3000;
const ROOT_DIR = process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'store.json');
const UPLOADS_DIR = path.resolve(ROOT_DIR, 'uploads');
const UPLOAD_IMAGES_DIR = path.resolve(UPLOADS_DIR, 'images');
const UPLOAD_MODELS_DIR = path.resolve(UPLOADS_DIR, 'models');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_IMAGES_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_MODELS_DIR, { recursive: true });

const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

interface TokenPayload {
  uid: string;
  role: 'customer' | 'admin';
  email: string;
  exp: number;
}

function signToken(payload: Omit<TokenPayload, 'exp'>): string {
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadStore(): StoreState {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      const existingProducts =
        Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : [...SEED_PRODUCTS];
      const existingIds = new Set(existingProducts.map((p) => p.id));
      const newSeedProducts = SEED_PRODUCTS.filter((p) => !existingIds.has(p.id));
      const mergedProducts =
        newSeedProducts.length > 0 ? [...newSeedProducts, ...existingProducts] : existingProducts;
      const loaded: StoreState = {
        products: mergedProducts,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [...SEED_ORDERS],
        coupons: Array.isArray(parsed.coupons) && parsed.coupons.length > 0 ? parsed.coupons : [...SEED_COUPONS],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
        adminCredential: parsed.adminCredential ?? null,
      };
      if (newSeedProducts.length > 0) {
        saveStore(loaded);
      }
      return loaded;
    } catch {
      // Fall back to fresh seed store if file is unreadable
    }
  }
  const initial: StoreState = {
    products: [...SEED_PRODUCTS],
    orders: [...SEED_ORDERS],
    coupons: [...SEED_COUPONS],
    users: [],
    inquiries: [],
    adminCredential: null,
  };
  saveStore(initial);
  return initial;
}

function saveStore(state: StoreState): void {
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

const store = loadStore();

function sanitizeUser(u: StoredUser): CustomerUser {
  const { passwordHash: _ignored, ...safe } = u;
  return safe;
}

interface AuthRequest extends Request {
  authUser?: TokenPayload;
}

function extractBearer(req: Request): TokenPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return verifyToken(header.slice(7).trim());
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const payload = extractBearer(req);
  if (!payload) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  req.authUser = payload;
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const payload = extractBearer(req);
  if (!payload || payload.role !== 'admin') {
    res.status(403).json({ error: 'Admin privileges required' });
    return;
  }
  req.authUser = payload;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // Serve safe uploaded product photos and GLB/GLTF 3D models
  app.use('/uploads', express.static(UPLOADS_DIR));

  // ---------- AUTH ROUTES ----------
  app.get('/api/auth/admin-status', (_req, res) => {
    const envPasscodeSet = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
    res.json({
      configured: envPasscodeSet || Boolean(store.adminCredential),
      mode: envPasscodeSet ? 'env' : store.adminCredential ? 'claimed' : 'unclaimed',
    });
  });

  app.post('/api/auth/admin-claim', (req, res) => {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      res.status(409).json({ error: 'Admin passcode is already managed by server configuration.' });
      return;
    }
    if (store.adminCredential) {
      res.status(409).json({ error: 'Admin credential has already been claimed.' });
      return;
    }
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'admin@shreeji.studio';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 8) {
      res.status(400).json({ error: 'Admin password must be at least 8 characters.' });
      return;
    }
    store.adminCredential = {
      email: email || 'admin@shreeji.studio',
      passwordHash: hashPassword(password),
      claimedAt: new Date().toISOString(),
    };
    saveStore(store);
    const token = signToken({ uid: 'admin-root', role: 'admin', email: store.adminCredential.email });
    res.json({
      token,
      user: {
        id: 'admin-root',
        name: 'Shreeji Atelier Admin',
        email: store.adminCredential.email,
        phone: '',
        role: 'admin',
        wishlist: [],
        addresses: [],
        createdAt: store.adminCredential.claimedAt,
      } satisfies CustomerUser,
    });
  });

  app.post('/api/auth/admin-login', (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();

    if (envPasscode) {
      const a = Buffer.from(password);
      const b = Buffer.from(envPasscode);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        res.status(401).json({ error: 'Invalid admin passcode.' });
        return;
      }
      const token = signToken({ uid: 'admin-root', role: 'admin', email: 'admin@shreeji.studio' });
      res.json({
        token,
        user: {
          id: 'admin-root',
          name: 'Shreeji Atelier Admin',
          email: 'admin@shreeji.studio',
          phone: '',
          role: 'admin',
          wishlist: [],
          addresses: [],
          createdAt: new Date().toISOString(),
        } satisfies CustomerUser,
      });
      return;
    }

    if (!store.adminCredential) {
      res.status(400).json({ error: 'No admin credential claimed yet. Please set up admin access first.' });
      return;
    }

    if (!verifyPassword(password, store.adminCredential.passwordHash)) {
      res.status(401).json({ error: 'Invalid admin credentials.' });
      return;
    }

    const token = signToken({ uid: 'admin-root', role: 'admin', email: store.adminCredential.email });
    res.json({
      token,
      user: {
        id: 'admin-root',
        name: 'Shreeji Atelier Admin',
        email: store.adminCredential.email,
        phone: '',
        role: 'admin',
        wishlist: [],
        addresses: [],
        createdAt: store.adminCredential.claimedAt,
      } satisfies CustomerUser,
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!name || !email || !email.includes('@') || password.length < 6) {
      res.status(400).json({ error: 'Provide a valid name, email, and password (6+ characters).' });
      return;
    }
    if (store.users.some((u) => u.email === email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      phone,
      role: 'customer',
      wishlist: [],
      addresses: [],
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password),
    };
    store.users.push(newUser);
    saveStore(store);

    const token = signToken({ uid: newUser.id, role: 'customer', email: newUser.email });
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    const found = store.users.find((u) => u.email === email);
    if (!found || !verifyPassword(password, found.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken({ uid: found.id, role: found.role, email: found.email });
    res.json({ token, user: sanitizeUser(found) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    const auth = req.authUser!;
    if (auth.role === 'admin' && auth.uid === 'admin-root') {
      res.json({
        user: {
          id: 'admin-root',
          name: 'Shreeji Atelier Admin',
          email: auth.email,
          phone: '',
          role: 'admin',
          wishlist: [],
          addresses: [],
          createdAt: store.adminCredential?.claimedAt ?? new Date().toISOString(),
        } satisfies CustomerUser,
      });
      return;
    }
    const found = store.users.find((u) => u.id === auth.uid);
    if (!found) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: sanitizeUser(found) });
  });

  // ---------- ACCOUNT ROUTES ----------
  app.put('/api/account/profile', requireAuth, (req: AuthRequest, res) => {
    const found = store.users.find((u) => u.id === req.authUser!.uid);
    if (!found) {
      res.status(404).json({ error: 'Customer profile not found' });
      return;
    }
    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      found.name = req.body.name.trim();
    }
    if (typeof req.body?.phone === 'string') {
      found.phone = req.body.phone.trim();
    }
    saveStore(store);
    res.json({ user: sanitizeUser(found) });
  });

  app.post('/api/account/wishlist', requireAuth, (req: AuthRequest, res) => {
    const productId = typeof req.body?.productId === 'string' ? req.body.productId : '';
    const found = store.users.find((u) => u.id === req.authUser!.uid);
    if (!found) {
      res.status(404).json({ error: 'Customer profile not found' });
      return;
    }
    if (found.wishlist.includes(productId)) {
      found.wishlist = found.wishlist.filter((id) => id !== productId);
    } else {
      found.wishlist.push(productId);
    }
    saveStore(store);
    res.json({ wishlist: found.wishlist });
  });

  app.post('/api/account/addresses', requireAuth, (req: AuthRequest, res) => {
    const found = store.users.find((u) => u.id === req.authUser!.uid);
    if (!found) {
      res.status(404).json({ error: 'Customer profile not found' });
      return;
    }
    const { label, fullName, phone, line1, city, state, pincode, isDefault } = req.body ?? {};
    if (!fullName || !line1 || !city || !state || !pincode) {
      res.status(400).json({ error: 'All address fields are required.' });
      return;
    }
    if (isDefault) {
      found.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }
    found.addresses.push({
      id: `addr-${crypto.randomUUID().slice(0, 8)}`,
      label: String(label || 'Home'),
      fullName: String(fullName).trim(),
      phone: String(phone || '').trim(),
      line1: String(line1).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      isDefault: Boolean(isDefault) || found.addresses.length === 0,
    });
    saveStore(store);
    res.status(201).json({ addresses: found.addresses });
  });

  app.delete('/api/account/addresses/:id', requireAuth, (req: AuthRequest, res) => {
    const found = store.users.find((u) => u.id === req.authUser!.uid);
    if (!found) {
      res.status(404).json({ error: 'Customer profile not found' });
      return;
    }
    found.addresses = found.addresses.filter((a) => a.id !== req.params.id);
    saveStore(store);
    res.json({ addresses: found.addresses });
  });

  // ---------- PRODUCTS ROUTES ----------
  app.get('/api/products', (_req, res) => {
    res.json({ products: store.products });
  });

  app.get('/api/products/:id', (req, res) => {
    const product = store.products.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Keychain not found' });
      return;
    }
    res.json({ product });
  });

  app.post('/api/products', requireAdmin, (req, res) => {
    const body = req.body ?? {};
    if (!body.name || !body.category || typeof body.price !== 'number') {
      res.status(400).json({ error: 'Name, category, and numeric price are required.' });
      return;
    }
    const id = `shj-${crypto.randomUUID().slice(0, 6)}`;
    const slug = String(body.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const product: Product = {
      id,
      name: String(body.name).trim(),
      slug: `${slug}-${id.slice(-3)}`,
      category: body.category,
      price: Math.max(99, Math.round(body.price)),
      originalPrice: Math.max(Math.round(body.price), Math.round(body.originalPrice || body.price * 1.25)),
      rating: typeof body.rating === 'number' ? body.rating : 4.9,
      reviewCount: typeof body.reviewCount === 'number' ? body.reviewCount : 1,
      stock: typeof body.stock === 'number' ? Math.max(0, Math.round(body.stock)) : 25,
      description: String(body.description || 'Handcrafted bespoke keychain from Shreeji Accessories.'),
      materialSpec: String(body.materialSpec || '316L Stainless Steel · Satin PVD'),
      dimensions: String(body.dimensions || '46mm × 28mm × 4mm'),
      weightGrams: typeof body.weightGrams === 'number' ? body.weightGrams : 32,
      images:
        Array.isArray(body.images) && body.images.length > 0
          ? body.images
          : ['/src/assets/images/keychain_custom_gold_1795510740809.jpg'],
      colors:
        Array.isArray(body.colors) && body.colors.length > 0
          ? body.colors
          : [
              { name: 'Champagne Gold', hex: '#D4AF37', material: 'brushed-gold' },
              { name: 'Obsidian Matte', hex: '#1E1E22', material: 'obsidian-metal' },
            ],
      default3D: body.default3D ?? {
        shape: 'bar',
        material: 'brushed-gold',
        primaryColor: '#D4AF37',
        accentColor: '#F5F3EE',
        engravingText: 'SHREEJI',
        backText: 'ATELIER',
        font: 'Cormorant Garamond',
        pattern: 'brushed',
        modelUrl: typeof body.modelUrl === 'string' ? body.modelUrl : undefined,
      },
      customizable: body.customizable !== false,
      supportsPhotoUpload: Boolean(body.supportsPhotoUpload),
      featured: Boolean(body.featured),
      createdAt: new Date().toISOString(),
    };
    store.products.unshift(product);
    saveStore(store);
    res.status(201).json({ product });
  });

  app.put('/api/products/:id', requireAdmin, (req, res) => {
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const existing = store.products[idx];
    const b = req.body ?? {};
    const updated: Product = {
      ...existing,
      name: typeof b.name === 'string' ? b.name.trim() : existing.name,
      category: b.category ?? existing.category,
      price: typeof b.price === 'number' ? Math.max(99, Math.round(b.price)) : existing.price,
      originalPrice:
        typeof b.originalPrice === 'number' ? Math.max(99, Math.round(b.originalPrice)) : existing.originalPrice,
      stock: typeof b.stock === 'number' ? Math.max(0, Math.round(b.stock)) : existing.stock,
      description: typeof b.description === 'string' ? b.description : existing.description,
      materialSpec: typeof b.materialSpec === 'string' ? b.materialSpec : existing.materialSpec,
      images: Array.isArray(b.images) && b.images.length > 0 ? b.images : existing.images,
      featured: typeof b.featured === 'boolean' ? b.featured : existing.featured,
      customizable: typeof b.customizable === 'boolean' ? b.customizable : existing.customizable,
      default3D: b.default3D ? { ...existing.default3D, ...b.default3D } : existing.default3D,
    };
    store.products[idx] = updated;
    saveStore(store);
    res.json({ product: updated });
  });

  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const before = store.products.length;
    store.products = store.products.filter((p) => p.id !== req.params.id);
    if (store.products.length === before) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    saveStore(store);
    res.json({ ok: true });
  });

  // ---------- FILE UPLOADS (Admin Photos & 3D GLB/GLTF Models) ----------
  app.post('/api/upload', requireAdmin, (req, res) => {
    const { filename, dataBase64, kind } = req.body ?? {};
    if (typeof filename !== 'string' || typeof dataBase64 !== 'string') {
      res.status(400).json({ error: 'Filename and file payload required.' });
      return;
    }
    const ext = path.extname(filename).toLowerCase();
    const isImage = kind === 'image' && ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    const isModel = kind === 'model' && ['.glb', '.gltf'].includes(ext);
    if (!isImage && !isModel) {
      res.status(400).json({ error: 'Unsupported file type. Upload JPG/PNG/WEBP images or GLB/GLTF 3D models.' });
      return;
    }

    const cleanBase64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0 || buffer.length > 15 * 1024 * 1024) {
      res.status(400).json({ error: 'File must be between 1 byte and 15 MB.' });
      return;
    }

    const safeName = `${crypto.randomUUID()}${ext}`;
    const targetDir = isImage ? UPLOAD_IMAGES_DIR : UPLOAD_MODELS_DIR;
    const resolvedPath = path.resolve(targetDir, safeName);
    if (!resolvedPath.startsWith(targetDir + path.sep)) {
      res.status(400).json({ error: 'Invalid upload path.' });
      return;
    }
    fs.writeFileSync(resolvedPath, buffer);
    const publicUrl = isImage ? `/uploads/images/${safeName}` : `/uploads/models/${safeName}`;
    res.status(201).json({ url: publicUrl });
  });

  // ---------- COUPONS ROUTES ----------
  app.get('/api/coupons', (_req, res) => {
    res.json({
      coupons: store.coupons.filter((c) => c.active),
    });
  });

  app.post('/api/coupons/validate', (req, res) => {
    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    const subtotal = typeof req.body?.subtotal === 'number' ? req.body.subtotal : 0;
    const coupon = store.coupons.find((c) => c.code === code && c.active);
    if (!coupon) {
      res.status(404).json({ error: 'Invalid or expired coupon code.' });
      return;
    }
    if (subtotal < coupon.minOrder) {
      res.status(400).json({ error: `Minimum order ₹${coupon.minOrder} required for ${coupon.code}.` });
      return;
    }
    const discountAmount =
      coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : Math.min(subtotal, coupon.value);
    res.json({ coupon, discountAmount });
  });

  app.post('/api/coupons', requireAdmin, (req, res) => {
    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    const type = req.body?.type === 'flat' ? 'flat' : 'percent';
    const value = Number(req.body?.value || 0);
    const minOrder = Number(req.body?.minOrder || 0);
    const description = String(req.body?.description || `${code} promotional discount`);
    if (!code || value <= 0) {
      res.status(400).json({ error: 'Valid coupon code and positive value required.' });
      return;
    }
    if (store.coupons.some((c) => c.code === code)) {
      res.status(409).json({ error: 'Coupon code already exists.' });
      return;
    }
    const created: Coupon = { code, type, value, minOrder, active: true, description };
    store.coupons.push(created);
    saveStore(store);
    res.status(201).json({ coupon: created });
  });

  app.patch('/api/coupons/:code', requireAdmin, (req, res) => {
    const code = req.params.code.toUpperCase();
    const coupon = store.coupons.find((c) => c.code === code);
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found.' });
      return;
    }
    coupon.active = typeof req.body?.active === 'boolean' ? req.body.active : !coupon.active;
    saveStore(store);
    res.json({ coupon });
  });

  app.delete('/api/coupons/:code', requireAdmin, (req, res) => {
    const code = req.params.code.toUpperCase();
    store.coupons = store.coupons.filter((c) => c.code !== code);
    saveStore(store);
    res.json({ ok: true });
  });

  // ---------- ORDERS ROUTES ----------
  app.post('/api/orders', (req: AuthRequest, res) => {
    const auth = extractBearer(req);
    const b = req.body ?? {};
    const items = Array.isArray(b.items) ? b.items : [];
    if (items.length === 0) {
      res.status(400).json({ error: 'Cart is empty.' });
      return;
    }
    if (!b.customerName || !b.customerEmail || !b.customerPhone || !b.shippingAddress?.line1) {
      res.status(400).json({ error: 'Complete customer name, contact details, and shipping address are required.' });
      return;
    }

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = store.products.find((p) => p.id === item.productId);
      if (!product) {
        res.status(400).json({ error: `Product ${item.productId} no longer exists.` });
        return;
      }
      const qty = Math.max(1, Math.min(25, Math.round(Number(item.quantity || 1))));
      if (product.stock < qty) {
        res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
        return;
      }
      // Custom engraving surcharge if personalized text or uploaded photo is included
      const hasCustom = Boolean(item.customization?.engravingText || item.customization?.photoDataUrl);
      const unitPrice = product.price + (hasCustom && !product.customizable ? 150 : 0);
      subtotal += unitPrice * qty;
      orderItems.push({
        productId: product.id,
        name: product.name,
        image: product.images[0] || '/src/assets/images/keychain_custom_gold_1795510740809.jpg',
        unitPrice,
        quantity: qty,
        colorName: String(item.selectedColor?.name || product.colors[0]?.name || 'Champagne Gold'),
        customizationSummary: item.customization
          ? [
              item.customization.engravingText ? `Text: "${item.customization.engravingText}"` : null,
              item.customization.shape ? `Shape: ${item.customization.shape}` : null,
              item.customization.font ? `Font: ${item.customization.font}` : null,
              item.customization.photoDataUrl ? 'Custom Photo Included' : null,
            ]
              .filter(Boolean)
              .join(' · ')
          : undefined,
      });
    }

    let discountCode: string | null = null;
    let discountAmount = 0;
    if (typeof b.discountCode === 'string' && b.discountCode.trim()) {
      const code = b.discountCode.trim().toUpperCase();
      const coupon = store.coupons.find((c) => c.code === code && c.active);
      if (coupon && subtotal >= coupon.minOrder) {
        discountCode = coupon.code;
        discountAmount =
          coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : Math.min(subtotal, coupon.value);
      }
    }

    const shippingFee = subtotal - discountAmount >= 999 ? 0 : 79;
    const total = Math.max(0, subtotal - discountAmount + shippingFee);

    // Decrement product inventory
    for (const oi of orderItems) {
      const prod = store.products.find((p) => p.id === oi.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - oi.quantity);
      }
    }

    const paymentMethod = b.paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : 'Demo Card / UPI';
    const orderNumber = 1044 + store.orders.length;
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: `SHJ-${orderNumber}`,
      userId: auth?.uid ?? null,
      customerName: String(b.customerName).trim(),
      customerEmail: String(b.customerEmail).trim(),
      customerPhone: String(b.customerPhone).trim(),
      shippingAddress: {
        line1: String(b.shippingAddress.line1).trim(),
        city: String(b.shippingAddress.city || '').trim(),
        state: String(b.shippingAddress.state || '').trim(),
        pincode: String(b.shippingAddress.pincode || '').trim(),
      },
      items: orderItems,
      subtotal,
      discountCode,
      discountAmount,
      shippingFee,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'COD Pending' : 'Demo Authorized',
      status: 'Placed',
      trackingNote: 'Order received by Shreeji Atelier; queued for artisan craftsmanship.',
      createdAt: now,
      updatedAt: now,
    };

    store.orders.unshift(newOrder);
    saveStore(store);
    res.status(201).json({ order: newOrder });
  });

  app.get('/api/orders/my', requireAuth, (req: AuthRequest, res) => {
    const auth = req.authUser!;
    const myOrders = store.orders.filter(
      (o) => o.userId === auth.uid || o.customerEmail.toLowerCase() === auth.email.toLowerCase()
    );
    res.json({ orders: myOrders });
  });

  app.get('/api/orders/track/:id', (req, res) => {
    const orderId = req.params.id.trim().toUpperCase();
    const found = store.orders.find((o) => o.id.toUpperCase() === orderId);
    if (!found) {
      res.status(404).json({ error: `No order found with ID ${orderId}.` });
      return;
    }
    res.json({
      order: {
        id: found.id,
        customerName: found.customerName.split(' ')[0] + ' ***',
        shippingCity: `${found.shippingAddress.city}, ${found.shippingAddress.state}`,
        items: found.items,
        subtotal: found.subtotal,
        discountCode: found.discountCode,
        discountAmount: found.discountAmount,
        shippingFee: found.shippingFee,
        total: found.total,
        paymentMethod: found.paymentMethod,
        paymentStatus: found.paymentStatus,
        status: found.status,
        trackingNote: found.trackingNote,
        createdAt: found.createdAt,
        updatedAt: found.updatedAt,
      },
    });
  });

  app.get('/api/orders', requireAdmin, (_req, res) => {
    res.json({ orders: store.orders });
  });

  app.patch('/api/orders/:id', requireAdmin, (req, res) => {
    const found = store.orders.find((o) => o.id === req.params.id);
    if (!found) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const allowedStatuses = ['Placed', 'Crafting', 'Quality Check', 'Shipped', 'Delivered', 'Cancelled'];
    if (typeof req.body?.status === 'string' && allowedStatuses.includes(req.body.status)) {
      found.status = req.body.status as Order['status'];
    }
    if (typeof req.body?.trackingNote === 'string') {
      found.trackingNote = req.body.trackingNote.trim();
    }
    found.updatedAt = new Date().toISOString();
    saveStore(store);
    res.json({ order: found });
  });

  // ---------- INQUIRIES & ADMIN OVERVIEW ----------
  app.post('/api/inquiries', (req, res) => {
    const { name, email, phone, subject, message } = req.body ?? {};
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required.' });
      return;
    }
    const inquiry: Inquiry = {
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone || '').trim(),
      subject: String(subject || 'Bespoke Inquiry').trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    };
    store.inquiries.unshift(inquiry);
    saveStore(store);
    res.status(201).json({ inquiry });
  });

  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const totalRevenue = store.orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    const lowStockProducts = store.products.filter((p) => p.stock <= 15);
    res.json({
      analytics: {
        totalRevenue,
        totalOrders: store.orders.length,
        totalProducts: store.products.length,
        totalCustomers: store.users.length,
        lowStockCount: lowStockProducts.length,
      },
      customers: store.users.map(sanitizeUser),
      coupons: store.coupons,
      inquiries: store.inquiries,
    });
  });

  // ---------- VITE DEV OR PROD STATIC SERVING ----------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SHREEJI ACCESSORIES server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
