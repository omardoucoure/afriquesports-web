import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { IntlProvider, ActiriseProvider } from "@/components/providers";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { SessionTracker } from "@/components/tracking/SessionTracker";
import { ScrollTracker } from "@/components/tracking/ScrollTracker";
import { PostHogPageView } from "@/components/tracking/PostHogPageView";
import { LocaleModal } from "@/components/ui";
import { locales, type Locale } from "@/i18n/config";

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
