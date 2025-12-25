import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import { Rubik } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics, Clarity } from "@/components/analytics";
import { generateOrganizationJsonLd } from "@/lib/seo";
import "./globals.css";

// Optimize Rubik font loading with next/font
const rubik = Rubik({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-rubik',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: true, // Prevents CLS
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#04453f",
};

export const metadata: Metadata = {
  title: {
    default: "Afrique Sports - Actualités Football Africain | CAN 2025, Mercato, Résultats",
    template: "%s | Afrique Sports",
  },
  description:
    "Toute l'actualité du football africain : CAN 2025 au Maroc, mercato, résultats, classements. Mohamed Salah, Victor Osimhen, Achraf Hakimi. Suivez le Sénégal, Maroc, Algérie, Cameroun, Nigeria et plus.",
  keywords: [
    // Primary keywords
    "football africain",
    "african football",
    "CAN 2025",
    "AFCON 2025",
    "Coupe d'Afrique des Nations",
    "Africa Cup of Nations",
    // Top players (high search volume)
    "Mohamed Salah",
    "Victor Osimhen",
    "Achraf Hakimi",
    "Sadio Mané",
    "Riyad Mahrez",
    "Nicolas Jackson",
    // Countries
    "Sénégal football",
    "Maroc football",
    "Algérie football",
    "Nigeria football",
    "Cameroun football",
    "Côte d'Ivoire football",
    "Égypte football",
    // Topics
    "mercato africain",
    "transferts joueurs africains",
    "résultats foot afrique",
    "classements CAN",
    "buteurs africains Europe",
    "CAF Champions League",
    "qualifications Coupe du Monde Afrique",
  ],
  authors: [{ name: "Afrique Sports", url: "https://www.afriquesports.net" }],
  creator: "Afrique Sports",
  publisher: "Afrique Sports",
  metadataBase: new URL("https://www.afriquesports.net"),
  category: "Sports News",
  classification: "African Football News",
  // Note: alternates (canonical, hreflang) are set per-page to avoid inheritance issues
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US", "es_ES"],
    url: "https://www.afriquesports.net",
    siteName: "Afrique Sports",
    title: "Afrique Sports - Actualités Football Africain | CAN 2025",
    description:
      "Toute l'actualité du football africain : CAN 2025 au Maroc, mercato, résultats, classements. Mohamed Salah, Victor Osimhen, Achraf Hakimi et plus.",
    images: [
      {
        url: "https://www.afriquesports.net/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Afrique Sports - Football Africain CAN 2025",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@afriquesports",
    creator: "@afriquesports",
    title: "Afrique Sports - Actualités Football Africain | CAN 2025",
    description:
      "Toute l'actualité du football africain : CAN 2025, mercato, résultats. Mohamed Salah, Victor Osimhen, Achraf Hakimi.",
    images: [{
      url: "https://www.afriquesports.net/opengraph-image",
      alt: "Afrique Sports",
    }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

// Organization JSON-LD for all pages
const organizationJsonLd = generateOrganizationJsonLd();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={rubik.variable}>
      <head>
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Preload critical local font */}
        <link
          rel="preload"
          href="/fonts/ProductSans-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />

        {/* Resource hints for critical third-party origins */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://us-assets.i.posthog.com" />
        <link rel="dns-prefetch" href="https://cms.realdemadrid.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />

        {/* Google AdSense with Auto ads support */}
        {/* IMPORTANT: Enable Auto ads in AdSense dashboard (Ads > Auto ads) for 10-15% revenue boost */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4765538302983367"
          crossOrigin="anonymous"
        />

        {/* Organization Schema - appears on all pages */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${rubik.className} antialiased min-h-screen`} style={{ fontFamily: "'Product Sans', var(--font-rubik), system-ui, sans-serif" }}>
        {children}
        <GoogleAnalytics />
        <Clarity />
        <Analytics />
        <SpeedInsights />

        {/* Grow.me Analytics - Deferred to lazyOnload for better performance */}
        <Script
          id="grow-me-analytics"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `!(function(){window.growMe||((window.growMe=function(e){window.growMe._.push(e);}),(window.growMe._=[]));var e=document.createElement("script");(e.type="text/javascript"),(e.src="https://faves.grow.me/main.js"),(e.defer=!0),e.setAttribute("data-grow-faves-site-id","U2l0ZTplZTc0NGMyZC0xMzlmLTQxMjItYWZiNy1hZDI5MTAwNDIwYjA=");var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t);})();`
          }}
        />
      </body>
    </html>
  );
}
