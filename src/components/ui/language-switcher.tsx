"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

const localeNames: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    // Save language preference to localStorage to prevent modal from showing
    localStorage.setItem("locale-preference", newLocale);
    localStorage.setItem("locale-preference-dismissed", "true");

    // Strip current locale from pathname
    let pathWithoutLocale = pathname;

    // Remove locale prefix if it exists
    for (const loc of locales) {
      const localePrefix = `/${loc}`;
      if (pathname === localePrefix) {
        pathWithoutLocale = "/";
        break;
      } else if (pathname.startsWith(`${localePrefix}/`)) {
        pathWithoutLocale = pathname.slice(localePrefix.length);
        break;
      }
    }

    // Build new path with the selected locale
    // In production with "as-needed", French has no prefix
    const isDev = process.env.NODE_ENV === "development";
    let newPath;

    if (isDev) {
      // In dev, always use locale prefix
      newPath = `/${newLocale}${pathWithoutLocale}`;
    } else {
      // In prod, only add prefix for non-French locales
      newPath = newLocale === "fr"
        ? pathWithoutLocale
        : `/${newLocale}${pathWithoutLocale}`;
    }

    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            locale === loc
              ? "bg-[#04453f] text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
