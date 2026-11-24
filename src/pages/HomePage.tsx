import { ArrowRight, Box, Expand, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Keychain3DViewer } from '../components/Keychain3DViewer.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { useStore } from '../context/StoreContext.tsx';
import { KEYCHAIN_CATEGORIES, type Keychain3DConfig } from '../types.ts';

const HERO_PRESETS: { label: string; config: Keychain3DConfig }[] = [
  {
    label: 'Champagne Gold Bar',
    config: {
      shape: 'bar',
      material: 'brushed-gold',
      primaryColor: '#D4AF37',
      accentColor: '#F4DF9A',
      engravingText: 'SHREEJI',
      backText: 'IDENTITY',
      font: 'Cormorant Garamond',
      pattern: 'brushed',
    },
  },
  {
    label: 'Crystal Acrylic Oval',
    config: {
      shape: 'oval',
      material: 'crystal-acrylic',
      primaryColor: '#EEF3F8',
      accentColor: '#D4AF37',
      engravingText: 'S / A',
      backText: '316L',
      font: 'Cormorant Garamond',
      pattern: 'solid',
    },
  },
  {
    label: '24K Resin Hexagon',
    config: {
      shape: 'hexagon',
      material: 'smoky-resin',
      primaryColor: '#3A3530',
      accentColor: '#D4AF37',
      engravingText: 'ATELIER',
      backText: '24K FOIL',
      font: 'Cormorant Garamond',
      pattern: 'gold-foil',
    },
  },
];

export function HomePage({ onSelectCategory }: { onSelectCategory: (cat: string) => void }) {
  const { products, navigate, setStudioConfig } = useStore();
  const [heroPresetIdx, setHeroPresetIdx] = useState(0);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 6);
  const activeHeroConfig = HERO_PRESETS[heroPresetIdx].config;

  return (
    <div>
      {/* 1. Cinematic 3D Animated Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-radial from-[#1F1B14] via-[#0B0B0D] to-[#0A0A0B]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-12 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-6"
          >
            <p className="text-xs font-medium tracking-[0.22em] text-[#D4AF37] uppercase">
              SHREEJI ACCESSORIES · Your Style. Your Keychain. Your Identity.
            </p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[1.06] tracking-tight text-[#F5F3EE] [text-wrap:balance] sm:text-5xl lg:text-6xl">
              UNIQUE KEYCHAINS. UNLIMITED PERSONALITY.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#B5B0A6]">
              Discover beautifully crafted and personalized keychains made just for you. Inspect
              every brushed bevel in 360° 3D, customize typography in real time, and preview your
              piece in Augmented Reality.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('shop')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0A0A0B] transition-colors hover:bg-[#E5C56B]"
              >
                SHOP NOW
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudioConfig(activeHeroConfig);
                  navigate('customize');
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#141416] px-6 py-3 text-sm font-medium text-[#F5F3EE] transition-colors hover:border-[#D4AF37] hover:text-[#E5C56B]"
              >
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                CUSTOMIZE YOUR KEYCHAIN
              </button>
            </div>

            {/* Interactive Finish Switcher for Hero 3D Keychain */}
            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="mb-3 text-xs font-medium text-[#8D8980]">
                Interactive Hero Finish Preview
              </p>
              <div className="flex flex-wrap gap-2">
                {HERO_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setHeroPresetIdx(idx)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      heroPresetIdx === idx
                        ? 'border border-[#D4AF37] bg-[#D4AF37]/15 text-[#E5C56B]'
                        : 'border border-white/10 bg-[#141416] text-[#A39E93] hover:text-[#F5F3EE]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Centerpiece Interactive 3D Floating Keychain */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-6"
          >
            <Keychain3DViewer
              config={activeHeroConfig}
              heightClass="h-[440px] lg:h-[520px]"
              onLaunchAR={() => {
                setStudioConfig(activeHeroConfig);
                navigate('ar');
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* 2. Featured Collection Grid */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
              Curated Keychain Atelier
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#F5F3EE] sm:text-4xl">
              Signature Keychain Editions
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('shop')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E5C56B] hover:underline"
          >
            View All 10 Collections
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Clean category selector bar */}
        <div className="mb-8 flex flex-wrap gap-2">
          {KEYCHAIN_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                onSelectCategory(category);
                navigate('shop');
              }}
              className="rounded-lg border border-white/10 bg-[#141416] px-3.5 py-2 text-xs font-medium text-[#C7C2B8] transition-colors hover:border-[#D4AF37]/60 hover:text-[#E5C56B] whitespace-nowrap shrink-0"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. Studio Craftsmanship & AR Experience Spotlight */}
      <section className="border-y border-white/10 bg-[#111114]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-stretch gap-8 px-6 py-16 lg:grid-cols-12">
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#141416] p-8 lg:col-span-6">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
                3D Visualization & Augmented Reality
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-[#F5F3EE] sm:text-4xl">
                Designed in 3D. Previewed in Your Hands.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#A39E93]">
                Every Shreeji keychain is engineered with surgical 316L stainless steel, diamond-beveled
                optical acrylic, or archival gold-leaf resin. Customize your silhouette in our
                live studio, inspect every hardware link in exploded 3D, and project it onto your desk
                via WebXR, Scene Viewer, or Live Camera AR.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('studio')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C56B]"
              >
                <Box className="h-4 w-4" />
                Open 3D Product Studio
              </button>
              <button
                type="button"
                onClick={() => navigate('ar')}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-xs font-medium text-[#F5F3EE] hover:border-[#D4AF37]"
              >
                <Expand className="h-4 w-4 text-[#D4AF37]" />
                Launch AR Experience
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-6">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141416]">
              <img
                src="/src/assets/images/keychain_couple_dual_1795510741659.jpg"
                alt="Couple Keychains Craftsmanship"
                referrerPolicy="no-referrer"
                className="h-full min-h-[220px] w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141416]">
              <img
                src="/src/assets/images/keychain_leather_metal_1795510741722.jpg"
                alt="Leather and Brass Keychain Detail"
                referrerPolicy="no-referrer"
                className="h-full min-h-[220px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
