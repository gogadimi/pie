import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PIE — Pricing Intelligence Engine",
  description: "Monitor competitor prices, optimize your pricing strategy, and maximize revenue with AI-powered insights.",
};

import { PWARegistration } from '@/components/pwa/register';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <body className="min-h-screen bg-white dark:bg-slate-950">{children}
      <PWARegistration /></body>
      </html>
    </ClerkProvider>
  );
}
