import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  AppPage,
  CartItem,
  CustomerUser,
  Keychain3DConfig,
  KeychainColorOption,
  Product,
} from '../types.ts';

interface StoreContextValue {
  page: AppPage;
  navigate: (nextPage: AppPage, options?: { productId?: string; orderId?: string }) => void;
  products: Product[];
  loadingProducts: boolean;
  refreshProducts: () => Promise<void>;
  selectedProduct: Product | null;
  setSelectedProductById: (id: string) => void;
  studioConfig: Keychain3DConfig;
  setStudioConfig: React.Dispatch<React.SetStateAction<Keychain3DConfig>>;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    quantity: number,
    color: KeychainColorOption,
    customization?: Partial<Keychain3DConfig>
  ) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  appliedCoupon: { code: string; discountAmount: number } | null;
  setAppliedCoupon: (coupon: { code: string; discountAmount: number } | null) => void;
  token: string | null;
  user: CustomerUser | null;
  setSession: (token: string | null, user: CustomerUser | null) => void;
  logout: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  guestWishlist: string[];
  trackOrderId: string;
  setTrackOrderId: (id: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const DEFAULT_STUDIO_CONFIG: Keychain3DConfig = {
  shape: 'bar',
  material: 'brushed-gold',
  primaryColor: '#D4AF37',
  accentColor: '#E8CFA0',
  engravingText: 'SHREEJI',
  backText: 'EST. 2026',
  font: 'Cormorant Garamond',
  pattern: 'brushed',
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<AppPage>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('shj-001');
  const [studioConfig, setStudioConfig] = useState<Keychain3DConfig>(DEFAULT_STUDIO_CONFIG);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);
  const [trackOrderId, setTrackOrderId] = useState('SHJ-1042');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ?? products[0] ?? null;

  const setSelectedProductById = useCallback(
    (id: string) => {
      setSelectedProductId(id);
      const found = products.find((p) => p.id === id);
      if (found) {
        setStudioConfig({ ...found.default3D });
      }
    },
    [products]
  );

  const navigate = useCallback(
    (nextPage: AppPage, options?: { productId?: string; orderId?: string }) => {
      if (options?.productId) {
        setSelectedProductById(options.productId);
      }
      if (options?.orderId) {
        setTrackOrderId(options.orderId);
      }
      setPage(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setSelectedProductById]
  );

  const addToCart = useCallback(
    (
      product: Product,
      quantity: number,
      color: KeychainColorOption,
      customization?: Partial<Keychain3DConfig>
    ) => {
      const sig = `${product.id}:${color.name}:${JSON.stringify(customization || {})}`;
      setCart((prev) => {
        const existing = prev.find((item) => item.cartItemId === sig);
        if (existing) {
          return prev.map((item) =>
            item.cartItemId === sig
              ? { ...item, quantity: Math.min(25, item.quantity + quantity) }
              : item
          );
        }
        return [
          ...prev,
          {
            cartItemId: sig,
            productId: product.id,
            name: product.name,
            category: product.category,
            image: product.images[0] || '',
            unitPrice: product.price,
            quantity,
            selectedColor: color,
            customization,
          },
        ];
      });
      setAppliedCoupon(null);
      setCartOpen(true);
      showToast(`${product.name} added to bag`);
    },
    [showToast]
  );

  const updateCartQuantity = useCallback((cartItemId: string, quantity: number) => {
    setAppliedCoupon(null);
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: Math.min(25, quantity) } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setAppliedCoupon(null);
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  const setSession = useCallback((newToken: string | null, newUser: CustomerUser | null) => {
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    showToast('Signed out');
    setPage('home');
  }, [showToast]);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!token || !user || user.role === 'admin') {
        setGuestWishlist((prev) =>
          prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
        );
        return;
      }
      try {
        const res = await fetch('/api/account/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          const data = await res.json();
          setUser((prev) => (prev ? { ...prev, wishlist: data.wishlist } : prev));
        }
      } catch {
        // Ignore network errors cleanly
      }
    },
    [token, user]
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        page,
        navigate,
        products,
        loadingProducts,
        refreshProducts,
        selectedProduct,
        setSelectedProductById,
        studioConfig,
        setStudioConfig,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        appliedCoupon,
        setAppliedCoupon,
        token,
        user,
        setSession,
        logout,
        toggleWishlist,
        guestWishlist,
        trackOrderId,
        setTrackOrderId,
        toast,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
