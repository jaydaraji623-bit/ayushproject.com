import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { ARExperienceView } from './components/ARExperienceView.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { Footer } from './components/Footer.tsx';
import { Navbar } from './components/Navbar.tsx';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { AccountPage, AuthPage } from './pages/AuthAndAccountPages.tsx';
import { CartPage, CheckoutPage } from './pages/CartAndCheckoutPages.tsx';
import { CustomizePage } from './pages/CustomizePage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { Studio3DPage } from './pages/Studio3DPage.tsx';
import { AboutPage, ContactPage, TrackOrderPage } from './pages/TrackAboutContactPages.tsx';

function AppShell() {
  const {
    page,
    products,
    studioConfig,
    selectedProduct,
    setSelectedProductById,
    navigate,
    toast,
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<string>('All');

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0B] text-[#F5F3EE]">
      <Navbar />
      <CartDrawer />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {page === 'home' && <HomePage onSelectCategory={setActiveCategory} />}
            {page === 'shop' && (
              <ShopPage
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
              />
            )}
            {page === 'product' && <ProductDetailPage />}
            {page === 'studio' && <Studio3DPage />}
            {page === 'customize' && <CustomizePage />}
            {page === 'ar' && (
              <ARExperienceView
                products={products}
                activeConfig={studioConfig}
                selectedProduct={selectedProduct}
                onSelectProduct={(p) => setSelectedProductById(p.id)}
                onBackToShop={() => navigate('shop')}
              />
            )}
            {page === 'cart' && <CartPage />}
            {page === 'checkout' && <CheckoutPage />}
            {page === 'auth' && <AuthPage />}
            {page === 'account' && <AccountPage />}
            {page === 'track' && <TrackOrderPage />}
            {page === 'about' && <AboutPage />}
            {page === 'contact' && <ContactPage />}
            {page === 'admin' && <AdminDashboardPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer onSelectCategory={setActiveCategory} />

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 rounded-xl border border-[#D4AF37]/50 bg-[#141416] px-4 py-3 text-xs font-medium text-[#E5C56B] shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
