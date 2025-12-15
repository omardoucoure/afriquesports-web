import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics, CookieConsent } from "@/components/analytics";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

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
        url: "/og-image.jpg",
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
    images: ["/og-image.jpg"],
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#9DFF20" />
      </head>
      <body className={`${jakarta.variable} antialiased min-h-screen`}>
        {children}
        <CookieConsent />
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
