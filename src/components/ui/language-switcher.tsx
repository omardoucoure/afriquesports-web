"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";

const localeFlags: Record<Locale, string> = {
  fr: "\uD83C\uDDEB\uD83C\uDDF7",
  en: "\uD83C\uDDEC\uD83C\uDDE7",
  es: "\uD83C\uDDEA\uD83C\uDDF8",
  ar: "\uD83C\uDDF8\uD83C\uDDE6",
};

const localeCodes: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
  ar: "AR",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("language");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose]);

  const handleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      handleClose();
      return;
    }

    // Save language preference to localStorage to prevent modal from showing
    localStorage.setItem("locale-preference", newLocale);
    localStorage.setItem("locale-preference-dismissed", "true");

    // Save to cookie for middleware to read (1 year expiry)
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `locale-preference=${newLocale}; path=/; max-age=${maxAge}; SameSite=Lax`;

    // Use next-intl's router.replace with locale option
    router.replace(pathname, { locale: newLocale });
    handleClose();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#9DFF20]/50"
        aria-label={t("selectLanguage")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-base leading-none" role="img" aria-hidden="true">
          {localeFlags[locale]}
        </span>
        <span className="hidden sm:inline text-xs font-semibold tracking-wide">
          {localeCodes[locale]}
        </span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 top-full mt-1.5 w-44 bg-[#022a27] border border-white/10 rounded-lg shadow-xl z-[200] overflow-hidden transition-all duration-200 origin-top-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
        role="listbox"
        aria-label={t("selectLanguage")}
      >
        <div className="py-1">
          {locales.map((loc) => {
            const isActive = locale === loc;
            return (
              <button
                key={loc}
                onClick={() => handleChange(loc)}
                role="option"
                aria-selected={isActive}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[#9DFF20]/10 text-[#9DFF20]"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg leading-none" role="img" aria-hidden="true">
                  {localeFlags[loc]}
                </span>
                <span className="flex-1 text-left font-medium">
                  {t(loc)}
                </span>
                {isActive && (
                  <svg
                    className="w-4 h-4 text-[#9DFF20] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
