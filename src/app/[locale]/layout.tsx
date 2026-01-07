import { notFound } from "next/navigation";
import Script from 'next/script';
import { getMessages } from "next-intl/server";
import { IntlProvider, ActiriseProvider } from "@/components/providers";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { SessionTracker } from "@/components/tracking/SessionTracker";
import { ScrollTracker } from "@/components/tracking/ScrollTracker";
import { PostHogPageView } from "@/components/tracking/PostHogPageView";
import { LocaleModal } from "@/components/ui";
import { GoogleAnalytics, Clarity } from "@/components/analytics";
import { generateOrganizationJsonLd } from "@/lib/seo";
import { locales, type Locale } from "@/i18n/config";
import { rubikClassName, rubikVariable } from "../layout";

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Organization JSON-LD for all pages
const organizationJsonLd = generateOrganizationJsonLd();

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  // Determine if locale uses RTL
  const isRTL = locale === 'ar';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning className={rubikVariable}>
      <head>
        {/* Meta description - explicit for SEO */}
        <meta name="description" content="Toute l'actualité du football africain : CAN 2025 au Maroc, mercato, résultats, classements. Mohamed Salah, Victor Osimhen, Achraf Hakimi. Suivez le Sénégal, Maroc, Algérie, Cameroun, Nigeria." />

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

        {/* Resource hints - ONLY for LCP-critical resources */}
        {/* Preconnect to WordPress image CDN (critical for LCP) */}
        <link rel="preconnect" href="https://cms.realdemadrid.com" />
        <link rel="preconnect" href="https://i0.wp.com" />

        {/* DNS prefetch for non-critical third parties (less blocking than preconnect) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://us-assets.i.posthog.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.flashb.id" />

        {/* Ad scripts moved to body with lazyOnload for better performance */}

        {/* Organization Schema - appears on all pages */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

      </head>
      <body className={`${rubikClassName} antialiased min-h-screen`} style={{ fontFamily: "'Product Sans', var(--font-rubik), system-ui, sans-serif" }}>
        <AnalyticsProvider locale={locale}>
          <ActiriseProvider locale={locale}>
            <IntlProvider locale={locale} messages={messages}>
              {children}
              <LocaleModal />
              <SessionTracker />
              <ScrollTracker />
              <PostHogPageView />
            </IntlProvider>
          </ActiriseProvider>
        </AnalyticsProvider>
        <GoogleAnalytics />
        <Clarity />

        {/* Actirise SDK - Deferred with lazyOnload for better LCP */}
        <Script
          id="actirise-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: 'window._hbdbrk = window._hbdbrk || [];'
          }}
        />
        <Script
          id="actirise-sdk"
          src="https://www.flashb.id/universal/dd48961b-e435-5e07-9a1d-840e902ac82e.js"
          strategy="lazyOnload"
        />

        {/* Google AdSense - Deferred with lazyOnload for better LCP */}
        <Script
          id="google-adsense"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4765538302983367"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />

        {/* PostHog Analytics - Deferred to lazyOnload for best LCP (loads after page is fully loaded) */}
        <Script
          id="posthog-analytics"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              var isProduction = window.location.hostname === 'www.afriquesports.net' || window.location.hostname === 'afriquesports.net';
              if (isProduction) {
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+=\".\"+a),t||(e+=\" (stub)\"),e},u.people.toString=function(){return u.toString(1)+\".people (stub)\"},o=\"init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug\".split(\" \"),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('phc_LkUTD4Zu5u6oy15Dn6F9QwxEUbcjxCvmR17cglP4cjy',{api_host:'https://us.i.posthog.com',person_profiles:'identified_only',capture_pageview:false,capture_pageleave:true,autocapture:true,advanced_disable_decide:true,advanced_disable_feature_flags:true});
              }
            `
          }}
        />

      </body>
    </html>
  );
}
