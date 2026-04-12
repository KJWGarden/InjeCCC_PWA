import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "채플 출석",
  description: "인제대학교/가야대학교 CCC 채플 출석 관리 시스템",
  manifest: "/manifest.json",
  openGraph: {
    title: "채플 출석",
    description: "인제대학교/가야대학교 채플 출석 관리 시스템",
    images: [{ url: "/ogImage.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "채플 출석",
    description: "인제대학교/가야대학교 CCC 채플 출석 관리 시스템",
    images: ["/ogImage.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-geist-sans)]">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  );
}
