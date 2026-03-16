import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karet Dashboard - Personal Finance Companion",
  description: "A playful personal finance dashboard with bunny/carrot theme. Track your spending, visualize trends, and manage your finances with joy.",
  keywords: ["personal finance", "spending tracker", "budget", "dashboard", "karet"],
  icons: { icon: "/karet-logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="min-h-screen bg-soft-cream p-3 sm:p-4 lg:p-3 lg:px-4 lg:max-w-[1200px] lg:mx-auto xl:max-w-[1400px] xl:px-8 xl:py-5">
          <div className="mb-3 lg:mb-4">
            <Header />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
