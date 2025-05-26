import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = "width=device-width, initial-scale=1";

export const metadata: Metadata = {
  title: "SubsBase - サブスクリプション管理プラットフォーム",
  description: "モダンで安全なサブスクリプション管理を簡単に。プロフェッショナルなSaaSテンプレート。",
  keywords: "サブスクリプション, SaaS, Stripe, Next.js, React",
  authors: [{ name: "SubsBase Team" }],
  themeColor: "#667eea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
