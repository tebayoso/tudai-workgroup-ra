import { SupabaseProvider } from "@/components/supabase-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TPManager - Gestión de Trabajos Prácticos",
  description: "Plataforma de gestión colaborativa de trabajos prácticos",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={
          inter.className +
          " bg-gradient-to-br from-[#F5F5F5] to-[#FFFFFF] min-h-screen flex flex-col"
        }
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <Navbar />
            <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-6 flex-1">
              {children}
            </main>
            <Toaster />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
