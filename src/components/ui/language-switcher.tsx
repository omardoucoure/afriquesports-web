"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";

const localeNames: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
  ar: "عربي",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    // Save language preference to localStorage to prevent modal from showing
    localStorage.setItem("locale-preference", newLocale);
    localStorage.setItem("locale-preference-dismissed", "true");

    // Use next-intl's router.replace with locale option
    // This properly handles the locale switching without manual path manipulation
    router.replace(pathname, { locale: newLocale });
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
