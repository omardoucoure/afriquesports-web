import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics, CookieConsent, Clarity } from "@/components/analytics";
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
    default: "Afrique Sports - Actualités Football Africain",
    template: "%s | Afrique Sports",
  },
  description:
    "Toute l'actualité du football africain : CAN 2025, mercato, résultats, classements. Suivez vos équipes favorites du Sénégal, Maroc, Algérie, Cameroun et plus.",
  keywords: [
    "football africain",
    "CAN 2025",
    "actualités foot",
    "Sénégal",
    "Maroc",
    "Algérie",
    "Cameroun",
    "Côte d'Ivoire",
    "mercato",
    "résultats",
    "classements",
  ],
  authors: [{ name: "Afrique Sports" }],
  creator: "Afrique Sports",
  publisher: "Afrique Sports",
  metadataBase: new URL("https://www.afriquesports.net"),
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/",
      "en-US": "/en",
      "es-ES": "/es",
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US", "es_ES"],
    url: "https://www.afriquesports.net",
    siteName: "Afrique Sports",
    title: "Afrique Sports - Actualités Football Africain",
    description:
      "Toute l'actualité du football africain : CAN 2025, mercato, résultats, classements.",
    images: [
      {
        url: "https://www.afriquesports.net/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Afrique Sports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Afrique Sports - Actualités Football Africain",
    description:
      "Toute l'actualité du football africain : CAN 2025, mercato, résultats, classements.",
    images: ["https://www.afriquesports.net/opengraph-image"],
    creator: "@afriquesports",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
      </head>
      <body className="antialiased min-h-screen" style={{ fontFamily: "'Product Sans', 'Rubik', system-ui, sans-serif" }}>
        {children}
        <CookieConsent />
        <GoogleAnalytics />
        <Clarity />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
