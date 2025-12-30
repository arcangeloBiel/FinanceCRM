import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested/modern standard
import "./globals.css";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinanceCRM",
  description: "Sistema Financeiro Completo",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 min-h-screen pb-20`}>
        {/* We can conditionally render Header/Navbar inside them or here. 
            Navbar already handles its own visibility. 
            Let's assume Header should also only show on non-auth pages. 
            However, we can't use usePathname in Server Component (Layout). 
            We'll wrap them in a client component or just render them and let them hide themselves.
            Or better, the Navbar and Header are Client Components.
        */}
        <HeaderWrapper />
        <main className="p-4 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <Navbar />
      </body>
    </html>
  );
}

// Simple wrapper to handle Header visibility logic if needed, 
// matching Navbar's client-side logic.
// For now, let's just use Header directly and modify Header to be client-side conditional if needed.
// Actually, I'll modify Header.tsx in a moment to hide on login page if I didn't already?
// I didn't. I should.
function HeaderWrapper() {
  return <HeaderLogic />;
}

import HeaderLogic from "@/components/Header";

