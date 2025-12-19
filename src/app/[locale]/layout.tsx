import { notFound } from "next/navigation";
import { getMessages, setRequestLocale } from "next-intl/server";
import { IntlProvider } from "@/components/providers";
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

  // Enable static rendering
  await setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <IntlProvider locale={locale} messages={messages}>
      {children}
      <LocaleModal />
    </IntlProvider>
  );
}
