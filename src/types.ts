export const KEYCHAIN_CATEGORIES = [
  'Custom Name Keychains',
  'Acrylic Keychains',
  'Resin Keychains',
  'Couple Keychains',
  'Photo Keychains',
  'Cartoon Keychains',
  'Initial Letter Keychains',
  'Handmade Keychains',
  'Metal Keychains',
  'Personalized Keychains',
] as const;

export type KeychainCategory = (typeof KEYCHAIN_CATEGORIES)[number];

export type KeychainShape =
  | 'bar'
  | 'square'
  | 'medallion'
  | 'hexagon'
  | 'heart'
  | 'shield'
  | 'oval';

export type KeychainMaterialType =
  | 'brushed-gold'
  | 'obsidian-metal'
  | 'crystal-acrylic'
  | 'smoky-resin'
  | 'rose-brass'
  | 'sterling-chrome'
  | 'leather-brass';

export type KeychainPattern =
  | 'solid'
  | 'brushed'
  | 'gold-foil'
  | 'marble'
  | 'lattice';

export type EngravingFont =
  | 'Cormorant Garamond'
  | 'Plus Jakarta Sans'
  | 'IBM Plex Mono'
  | 'Georgia'
  | 'Impact';

export interface KeychainColorOption {
  name: string;
  hex: string;
  material: KeychainMaterialType;
}

export interface Keychain3DConfig {
  shape: KeychainShape;
  material: KeychainMaterialType;
  primaryColor: string;
  accentColor: string;
  engravingText: string;
  backText?: string;
  font: EngravingFont;
  pattern: KeychainPattern;
  photoDataUrl?: string;
  modelUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: KeychainCategory;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  stock: number;
  description: string;
  materialSpec: string;
  dimensions: string;
  weightGrams: number;
  images: string[];
  colors: KeychainColorOption[];
  default3D: Keychain3DConfig;
  customizable: boolean;
  supportsPhotoUpload: boolean;
  featured: boolean;
  createdAt: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  category: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedColor: KeychainColorOption;
  customization?: Partial<Keychain3DConfig>;
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  wishlist: string[];
  addresses: SavedAddress[];
  createdAt: string;
}

export type OrderStatus =
  | 'Placed'
  | 'Crafting'
  | 'Quality Check'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  colorName: string;
  customizationSummary?: string;
}

export interface Order {
  id: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'Demo Card / UPI' | 'Cash on Delivery';
  paymentStatus: 'Demo Authorized' | 'COD Pending';
  status: OrderStatus;
  trackingNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder: number;
  active: boolean;
  description: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
}

export type AppPage =
  | 'home'
  | 'shop'
  | 'product'
  | 'studio'
  | 'customize'
  | 'ar'
  | 'cart'
  | 'checkout'
  | 'auth'
  | 'account'
  | 'track'
  | 'about'
  | 'contact'
  | 'admin';
