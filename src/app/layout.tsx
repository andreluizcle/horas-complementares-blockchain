import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { SolanaProviders } from "@/components/providers/wallet-providers";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Horas Complementares on-chain",
  description:
    "Credenciais verificáveis de horas complementares emitidas na Solana devnet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SolanaProviders>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <Toaster position="top-center" richColors />
        </SolanaProviders>
      </body>
    </html>
  );
}
