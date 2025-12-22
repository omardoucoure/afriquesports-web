import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics, Clarity } from "@/components/analytics";
import { generateOrganizationJsonLd } from "@/lib/seo";
import "./globals.css";

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
    <html suppressHydrationWarning>
      <head>
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preload"
          href="/fonts/ProductSans-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />

        {/* Organization Schema - appears on all pages */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen" style={{ fontFamily: "'Product Sans', 'Rubik', system-ui, sans-serif" }}>
        {children}
        <GoogleAnalytics />
        <Clarity />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
