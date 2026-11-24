import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../context/StoreContext.tsx';
import type { AppPage } from '../types.ts';

const NAV_ITEMS: { label: string; page: AppPage }[] = [
  { label: 'Shop', page: 'shop' },
  { label: '3D Studio', page: 'studio' },
  { label: 'Customize', page: 'customize' },
  { label: 'AR View', page: 'ar' },
  { label: 'Account', page: 'account' },
];

export function Navbar() {
  const { page, navigate, cartCount, setCartOpen, user } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (target: AppPage) => {
    setMobileMenuOpen(false);
    if (target === 'account' && !user) {
      navigate('auth');
      return;
    }
    if (target === 'account' && user?.role === 'admin') {
      navigate('admin');
      return;
    }
    navigate(target);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0B]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-display text-xl font-semibold tracking-[0.14em] text-[#F5F3EE] transition-colors hover:text-[#D4AF37] whitespace-nowrap shrink-0"
        >
          SHREEJI ACCESSORIES
        </button>

        {/* Zone 2: 5 concise single-line text links */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              page === item.page ||
              (item.page === 'account' && (page === 'auth' || page === 'admin'));
            const displayLabel =
              item.page === 'account' && user?.role === 'admin'
                ? 'Admin'
                : item.page === 'account' && user
                  ? user.name.split(' ')[0]
                  : item.label;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => handleNav(item.page)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active ? 'text-[#E5C56B]' : 'text-[#C7C2B8] hover:text-[#F5F3EE]'
                }`}
              >
                {displayLabel}
                {active && (
                  <span className="absolute right-0 -bottom-0.5 left-0 h-px bg-[#D4AF37]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0A0A0B] transition-colors hover:bg-[#E5C56B] whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Bag ({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-[#F5F3EE] md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0F0F12] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.page}
                type="button"
                onClick={() => handleNav(item.page)}
                className="py-2 text-left text-sm font-medium text-[#F5F3EE]"
              >
                {item.label}
              </button>
            ))}
            <div className="mt-2 flex flex-wrap gap-4 border-t border-white/10 pt-3 text-xs text-[#A39E93]">
              <button type="button" onClick={() => handleNav('track')}>
                Track Order
              </button>
              <button type="button" onClick={() => handleNav('about')}>
                About Us
              </button>
              <button type="button" onClick={() => handleNav('contact')}>
                Contact
              </button>
              <button type="button" onClick={() => handleNav('admin')}>
                Admin Console
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
