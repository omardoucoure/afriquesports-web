import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import { Rubik } from 'next/font/google';
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
    google: "42ztUq_6M1oIgM8mQ5XOzhmpA_LqDFmInnBEc2gGYY4",
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
        <link rel="dns-prefetch" href="https://www.flashb.id" />

        {/* Actirise SDK - Universal script for ad monetization */}
        {/* IMPORTANT: Do not inject via GTM or control with CMP - Actirise handles this */}
        <script
          src="https://www.flashb.id/universal/dd48961b-e435-5e07-9a1d-840e902ac82e.js"
          async
          data-cfasync="false"
        />
        <script
          type="text/javascript"
          data-cfasync="false"
          dangerouslySetInnerHTML={{
            __html: 'window._hbdbrk = window._hbdbrk || [];'
          }}
        />

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

        {/* PostHog Analytics - Official snippet for event tracking */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
              posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}',{
                api_host:'${process.env.NEXT_PUBLIC_POSTHOG_HOST}',
                person_profiles:'identified_only',
                capture_pageview:false,
                capture_pageleave:true,
                autocapture:true,
                advanced_disable_decide:true,
                advanced_disable_feature_flags:true,
                loaded:function(ph){console.log('[PostHog] Loaded successfully');ph.capture('posthog_loaded',{timestamp:Date.now()});}
              });
            `
          }}
        />
      </head>
      <body className={`${rubik.className} antialiased min-h-screen`} style={{ fontFamily: "'Product Sans', var(--font-rubik), system-ui, sans-serif" }}>
        {children}
        <GoogleAnalytics />
        <Clarity />

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
