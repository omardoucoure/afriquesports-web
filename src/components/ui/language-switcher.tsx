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

  const handleChange = (newLocale: string) => {
    // Save language preference to localStorage to prevent modal from showing
    localStorage.setItem("locale-preference", newLocale);
    localStorage.setItem("locale-preference-dismissed", "true");

    // Remove current locale prefix if present
    let newPath = pathname;
    for (const loc of locales) {
      if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
        newPath = pathname.replace(`/${loc}`, "") || "/";
        break;
      }
    }

    // Add new locale prefix if not default (fr)
    if (newLocale !== "fr") {
      newPath = `/${newLocale}${newPath}`;
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
