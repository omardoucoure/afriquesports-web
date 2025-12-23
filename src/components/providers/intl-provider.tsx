"use client";

import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";
import { defaultTimeZone } from "@/i18n/config";

interface IntlProviderProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

export function IntlProvider({ children, locale, messages }: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={defaultTimeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
}
