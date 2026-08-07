import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { CartDrawer } from "../components/cart/CartDrawer";
import { Providers } from "../components/providers/Providers";

export const metadata: Metadata = {
  title: "IntentIQ — Multi-Intent Product Discovery Platform",
  description: "Enterprise-grade real-time AI product personalization and discovery engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-gray-100 flex flex-col relative antialiased" suppressHydrationWarning>
        <Providers>
          {/* Ambient Top Radial Glow */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial-glow pointer-events-none z-0" />
          
          <Header />
          
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            {children}
          </main>

          <CartDrawer />

          <footer className="border-t border-gray-800/80 py-6 text-center text-xs text-gray-500 relative z-10">
            <p>© 2026 IntentIQ Platform. Built for AI Hackathon 2026 (Amazon Personalize Architecture Blueprint).</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
