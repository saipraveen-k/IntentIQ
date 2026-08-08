import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { CartDrawer } from '../components/cart/CartDrawer';
import { PrivacyModal } from '../components/privacy/PrivacyModal';
import { SemanticSearchModal } from '../components/search/SemanticSearchModal';
import { Providers } from '../components/providers/Providers';

export const metadata: Metadata = {
  title: 'IntentIQ — AI Powered Multi-Intent Discovery Engine',
  description: 'Understanding Shopper Intent, Not Just Shopper History. Real-time vector inference, FAISS similarity, and explainable recommendations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#FAFAFA] text-[#1D1D1F] min-h-screen flex flex-col antialiased selection:bg-[#007AFF] selection:text-white" suppressHydrationWarning>
        <Providers>
          <Header />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-12">
            {children}
          </main>
          <Footer />

          {/* Global Drawers & Modals */}
          <CartDrawer />
          <PrivacyModal />
          <SemanticSearchModal />
        </Providers>
      </body>
    </html>
  );
}
