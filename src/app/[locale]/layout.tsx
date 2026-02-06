import { notFound } from "next/navigation";
import Script from 'next/script';
import { getMessages } from "next-intl/server";
import { IntlProvider, ActiriseProvider } from "@/components/providers";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { SessionTracker } from "@/components/tracking/SessionTracker";
import { ScrollTracker } from "@/components/tracking/ScrollTracker";
import { PostHogPageView } from "@/components/tracking/PostHogPageView";
import { LanguageDetector } from "@/components/layout";
import { GoogleAnalytics, Clarity } from "@/components/analytics";
import { PushProvider } from "@/components/push/push-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
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
        {/* Note: Images are served from same domain (www.afriquesports.net) for SEO */}
        <link rel="preconnect" href="https://i0.wp.com" />

        {/* Preconnect for Actirise ads - critical for revenue */}
        <link rel="preconnect" href="https://www.flashb.id" />
        {/* Preconnect for FAST_CMP */}
        <link rel="preconnect" href="https://static.fastcmp.com" />

        {/* DNS prefetch for non-critical third parties (less blocking than preconnect) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://us-assets.i.posthog.com" />

        {/* Organization Schema - appears on all pages */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

        {/* FAST_CMP - Consent Management Platform (must load BEFORE ad scripts) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.FAST_CMP_OPTIONS={domainUid:'56c99eb1-db10-5b6e-9f60-6965559e579b',countryCode:'SN',jurisdiction:'tcfeuv2',policyUrl:'https://www.afriquesports.net/en/confidentialite',displaySynchronous:false,publisherName:'afriquesports.net',publisherLogo:function(c){return c.createElement('img',{src:'https://www.afriquesports.net/_next/image?url=%2Flogo.jpg&w=256&q=75',height:'40'});},bootstrap:{excludedIABVendors:[],excludedGoogleVendors:[]},custom:{vendors:[]}};(function(){var e={484:function(e){window.FAST_CMP_T0=Date.now();window.FAST_CMP_QUEUE={};window.FAST_CMP_QUEUE_ID=0;function t(){var e=Array.prototype.slice.call(arguments);if(!e.length)return Object.values(window.FAST_CMP_QUEUE);else if(e[0]==="ping"){if(typeof e[2]==="function")e[2]({cmpLoaded:false,cmpStatus:"stub",apiVersion:"2.0",cmpId:parseInt("388",10)})}else window.FAST_CMP_QUEUE[window.FAST_CMP_QUEUE_ID++]=e}e.exports={name:"light",handler:t}}};var t={};function a(r){var n=t[r];if(n!==void 0)return n.exports;var o=t[r]={exports:{}};e[r](o,o.exports,a);return o.exports}function r(e){"@babel/helpers - typeof";return r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},r(e)}var n=a(484);var o="__tcfapiLocator";var i=window;var s=i;var f;function c(){var e=i.document;var t=!!i.frames[o];if(!t)if(e.body){var a=e.createElement("iframe");a.style.cssText="display:none";a.name=o;e.body.appendChild(a)}else setTimeout(c,5);return!t}function l(e){var t=typeof e.data==="string";var a={};if(t)try{a=JSON.parse(e.data)}catch(e){}else a=e.data;var n=r(a)==="object"?a.__tcfapiCall:null;if(n)window.__tcfapi(n.command,n.version,function(a,r){var o={__tcfapiReturn:{returnValue:a,success:r,callId:n.callId}};if(e&&e.source&&e.source.postMessage)e.source.postMessage(t?JSON.stringify(o):o,"*")},n.parameter)}while(s){try{if(s.frames[o]){f=s;break}}catch(e){}if(s===i.top)break;s=s.parent}if(i.FAST_CMP_HANDLER!=="custom"){if(!f){c();i.__tcfapi=n.handler;i.FAST_CMP_HANDLER=n.name;i.addEventListener("message",l,false)}else{i.__tcfapi=n.handler;i.FAST_CMP_HANDLER=n.name}for(var p in window.FAST_CMP_QUEUE||{})i.__tcfapi.apply(null,window.FAST_CMP_QUEUE[p])}})();`
          }}
        />
        <script src="https://static.fastcmp.com/fast-cmp-stub.js" async />

        {/* Actirise SDK - Direct in head for fastest possible loading */}
        <script dangerouslySetInnerHTML={{ __html: 'window._hbdbrk = window._hbdbrk || [];' }} />
        <script src="https://www.flashb.id/universal/dd48961b-e435-5e07-9a1d-840e902ac82e.js" async />

      </head>
      <body className={`${rubikClassName} antialiased min-h-screen`} style={{ fontFamily: "'Product Sans', var(--font-rubik), system-ui, sans-serif" }}>
        <AnalyticsProvider locale={locale}>
          <ActiriseProvider locale={locale}>
            <IntlProvider locale={locale} messages={messages}>
              {children}
              <LanguageDetector />
              <SessionTracker />
              <ScrollTracker />
              <PostHogPageView />
              <PushProvider />
              <ServiceWorkerRegister />
            </IntlProvider>
          </ActiriseProvider>
        </AnalyticsProvider>
        <GoogleAnalytics />
        <Clarity />

        {/* PostHog Analytics - afterInteractive for reliable event tracking */}
        <Script
          id="posthog-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var isProduction = window.location.hostname === 'www.afriquesports.net' || window.location.hostname === 'afriquesports.net';
              if (isProduction) {
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+=\".\"+a),t||(e+=\" (stub)\"),e},u.people.toString=function(){return u.toString(1)+\".people (stub)\"},o=\"init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug\".split(\" \"),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('phc_LkUTD4Zu5u6oy15Dn6F9QwxEUbcjxCvmR17cglP4cjy',{api_host:'https://us.i.posthog.com',person_profiles:'identified_only',capture_pageview:true,capture_pageleave:true,autocapture:true,advanced_disable_decide:true,advanced_disable_feature_flags:true});
              }
            `
          }}
        />

        {/* Grow Journey Integration - Commented out */}
        {/* <Script
          id="grow-journey"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !(function(){
                window.growMe||((window.growMe=function(e){window.growMe._.push(e);}),(window.growMe._=[]));
                var e=document.createElement("script");
                e.type="text/javascript";
                e.src="https://faves.grow.me/main.js";
                e.defer=!0;
                e.setAttribute("data-grow-faves-site-id","U2l0ZTplZTc0NGMyZC0xMzlmLTQxMjItYWZiNy1hZDI5MTAwNDIwYjA=");
                var t=document.getElementsByTagName("script")[0];
                t.parentNode.insertBefore(e,t);
              })();
            `
          }}
        /> */}

      </body>
    </html>
  );
}
