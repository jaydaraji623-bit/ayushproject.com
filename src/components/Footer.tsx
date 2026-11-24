import { useStore } from '../context/StoreContext.tsx';
import { KEYCHAIN_CATEGORIES } from '../types.ts';

export function Footer({ onSelectCategory }: { onSelectCategory?: (cat: string) => void }) {
  const { navigate } = useStore();

  return (
    <footer className="mt-20 border-t border-white/10 bg-[#080809]">
      <div className="mx-auto max-w-[1280px] px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <p className="font-display text-2xl font-semibold tracking-[0.12em] text-[#F5F3EE]">
              SHREEJI ACCESSORIES
            </p>
            <p className="mt-2 text-xs tracking-[0.16em] text-[#D4AF37] uppercase">
              Your Style. Your Keychain. Your Identity.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-[#8D8980]">
              An exclusive Indian luxury keychain atelier crafting personalized stainless steel,
              cast optical acrylic, gold-leaf resin, and handcrafted leather fobs with live 3D & AR
              visualization.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-[#F5F3EE] uppercase">
              Keychain Collections
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-[#9E9A90]">
              {KEYCHAIN_CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory?.(cat);
                      navigate('shop');
                    }}
                    className="hover:text-[#D4AF37]"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-[#F5F3EE] uppercase">
              More Keychains
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-[#9E9A90]">
              {KEYCHAIN_CATEGORIES.slice(5).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory?.(cat);
                      navigate('shop');
                    }}
                    className="hover:text-[#D4AF37]"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-[#F5F3EE] uppercase">
              Atelier & Support
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-[#9E9A90]">
              <li>
                <button type="button" onClick={() => navigate('studio')} className="hover:text-[#D4AF37]">
                  3D Product Studio
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('customize')} className="hover:text-[#D4AF37]">
                  Customize Your Keychain
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('ar')} className="hover:text-[#D4AF37]">
                  AR Experience
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('track')} className="hover:text-[#D4AF37]">
                  Order Tracking
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('about')} className="hover:text-[#D4AF37]">
                  About Us
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('contact')} className="hover:text-[#D4AF37]">
                  Contact Us
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('admin')} className="text-[#D4AF37] hover:underline">
                  Admin Dashboard
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#6F6B63]">
          <p>© {new Date().getFullYear()} SHREEJI ACCESSORIES. Exclusively Keychains.</p>
          <p>Handcrafted in India · Worldwide Shipping · Complimentary Delivery above ₹999</p>
        </div>
      </div>
    </footer>
  );
}
