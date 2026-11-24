import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProductCard } from '../components/ProductCard.tsx';
import { useStore } from '../context/StoreContext.tsx';
import { KEYCHAIN_CATEGORIES } from '../types.ts';

export function ShopPage({
  activeCategory,
  onSelectCategory,
}: {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}) {
  const { products, loadingProducts } = useStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchesCat = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.materialSpec.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') return [...list].sort((a, b) => b.rating - a.rating);
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [products, activeCategory, search, sortBy]);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12">
      <div className="border-b border-white/10 pb-8">
        <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
          Exclusively Keychains
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F3EE] sm:text-5xl">
          Shop All Keychain Collections
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[#A39E93]">
          Browse our 10 signature keychain categories. Every piece includes complimentary
          precision engraving preview in 3D and AR.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#8D8980]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keychains, materials..."
            className="w-full rounded-lg border border-white/10 bg-[#141416] py-2.5 pr-4 pl-10 text-sm text-[#F5F3EE] placeholder:text-[#6F6B63] focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 text-[#D4AF37]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-white/10 bg-[#141416] px-3.5 py-2 text-xs font-medium text-[#F5F3EE] focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelectCategory('All')}
          className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeCategory === 'All'
              ? 'bg-[#D4AF37] text-[#0A0A0B]'
              : 'border border-white/10 bg-[#141416] text-[#B5B0A6] hover:text-[#F5F3EE]'
          }`}
        >
          All Keychains ({products.length})
        </button>
        {KEYCHAIN_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === cat
                ? 'bg-[#D4AF37] text-[#0A0A0B]'
                : 'border border-white/10 bg-[#141416] text-[#B5B0A6] hover:text-[#F5F3EE]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loadingProducts ? (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 animate-pulse rounded-2xl border border-white/10 bg-[#141416]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-14 rounded-2xl border border-white/10 bg-[#141416] p-12 text-center">
          <p className="font-display text-2xl text-[#F5F3EE]">No matching keychains found</p>
          <p className="mt-2 text-sm text-[#9E9A90]">
            Try clearing your search filter or selecting a different keychain collection.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onSelectCategory('All');
            }}
            className="mt-5 rounded-lg bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0A0A0B]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
