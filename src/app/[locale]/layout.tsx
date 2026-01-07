import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getMessages } from "next-intl/server";
import { IntlProvider, ActiriseProvider } from "@/components/providers";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { locales, type Locale } from "@/i18n/config";

// Lazy-load tracking components to improve initial page load
const SessionTracker = dynamic(
  () => import("@/components/tracking/SessionTracker").then(m => ({ default: m.SessionTracker })),
  { ssr: false }
);
const ScrollTracker = dynamic(
  () => import("@/components/tracking/ScrollTracker").then(m => ({ default: m.ScrollTracker })),
  { ssr: false }
);
const PostHogPageView = dynamic(
  () => import("@/components/tracking/PostHogPageView").then(m => ({ default: m.PostHogPageView })),
  { ssr: false }
);
const LocaleModal = dynamic(
  () => import("@/components/ui").then(m => ({ default: m.LocaleModal })),
  { ssr: false }
);

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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
    <div lang={locale} dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen">
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
    </div>
  );
}
