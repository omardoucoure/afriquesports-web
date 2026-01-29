"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

const STORAGE_KEY = "afriquesports-locale-pref";
const AUTO_DISMISS_MS = 10_000;

/** Flag emoji for each supported locale */
const localeFlags: Record<Locale, string> = {
  fr: "\uD83C\uDDEB\uD83C\uDDF7",
  en: "\uD83C\uDDEC\uD83C\uDDE7",
  es: "\uD83C\uDDEA\uD83C\uDDF8",
  ar: "\uD83C\uDDF8\uD83C\uDDE6",
};

/** Locale display names */
const localeNames: Record<Locale, string> = {
  fr: "Fran\u00E7ais",
  en: "English",
  es: "Espa\u00F1ol",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
};

/** Messages shown in the DETECTED language */
const detectedMessages: Record<
  Locale,
  { text: string; switchLabel: string }
> = {
  fr: {
    text: "Il semble que vous parlez fran\u00E7ais. Voulez-vous passer \u00E0 la version fran\u00E7aise\u00A0?",
    switchLabel: "Changer",
  },
  en: {
    text: "It looks like you speak English. Would you like to switch to the English version?",
    switchLabel: "Switch",
  },
  es: {
    text: "\u00BFParece que hablas espa\u00F1ol. \u00BFTe gustar\u00EDa cambiar a la versi\u00F3n en espa\u00F1ol?",
    switchLabel: "Cambiar",
  },
  ar: {
    text: "\u064A\u0628\u062F\u0648 \u0623\u0646\u0643 \u062A\u062A\u062D\u062F\u062B \u0627\u0644\u0639\u0631\u0628\u064A\u0629. \u0647\u0644 \u062A\u0631\u064A\u062F \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629\u061F",
    switchLabel: "\u062A\u0628\u062F\u064A\u0644",
  },
};

/**
 * Map a browser language string (e.g. "fr-FR", "en-US") to a supported locale.
 * Returns null if no match is found.
 */
function mapBrowserLanguage(browserLang: string): Locale | null {
  const primary = browserLang.split("-")[0].toLowerCase();
  if ((locales as readonly string[]).includes(primary)) {
    return primary as Locale;
  }
  return null;
}

/**
 * LanguageDetector
 *
 * Non-intrusive bottom banner that suggests switching to the user's browser
 * language when it differs from the current page locale.
 *
 * - Only appears once (controlled via localStorage key "afriquesports-locale-pref")
 * - Auto-dismisses after 10 seconds without saving a preference
 * - Respects prior user choice stored in localStorage
 */
export function LanguageDetector() {
  const [visible, setVisible] = useState(false);
  const [detectedLocale, setDetectedLocale] = useState<Locale | null>(null);
  const [dismissing, setDismissing] = useState(false);

  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();

  // Dismiss with slide-down animation
  const dismiss = useCallback((saveCurrentLocale: boolean) => {
    setDismissing(true);
    if (saveCurrentLocale) {
      try {
        localStorage.setItem(STORAGE_KEY, currentLocale);
      } catch {
        // localStorage might be unavailable in private browsing
      }
    }
    // Wait for the animation to complete before hiding
    setTimeout(() => {
      setVisible(false);
      setDismissing(false);
    }, 300);
  }, [currentLocale]);

  // Detection logic on mount
  useEffect(() => {
    try {
      // If user already has a preference saved, do nothing
      const savedPref = localStorage.getItem(STORAGE_KEY);
      if (savedPref) {
        return;
      }
    } catch {
      // localStorage unavailable, skip detection
      return;
    }

    const browserLang = navigator.language;
    const mapped = mapBrowserLanguage(browserLang);

    // Only show if we detected a supported locale that differs from the current one
    if (mapped && mapped !== currentLocale) {
      setDetectedLocale(mapped);
      setVisible(true);
    }
  }, [currentLocale]);

  // Auto-dismiss after 10 seconds (do NOT save any preference)
  useEffect(() => {
    if (!visible || dismissing) return;

    const timer = setTimeout(() => {
      setDismissing(true);
      setTimeout(() => {
        setVisible(false);
        setDismissing(false);
      }, 300);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [visible, dismissing]);

  // Handle the "Switch" button
  const handleSwitch = useCallback(() => {
    if (!detectedLocale) return;

    try {
      localStorage.setItem(STORAGE_KEY, detectedLocale);
      // Also set the NEXT_LOCALE cookie for middleware
      const maxAge = 365 * 24 * 60 * 60;
      document.cookie = `NEXT_LOCALE=${detectedLocale}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch {
      // Ignore
    }

    setVisible(false);

    // Build the full absolute URL and navigate
    const currentPath = pathname || "/";
    const origin = window.location.origin;
    let newUrl: string;

    if (detectedLocale === defaultLocale) {
      // French - no prefix needed
      newUrl = `${origin}${currentPath}`;
    } else {
      // Other locales - add prefix
      newUrl = `${origin}/${detectedLocale}${currentPath}`;
    }

    window.location.replace(newUrl);
  }, [detectedLocale, pathname]);

  // Handle the close button
  const handleClose = useCallback(() => {
    dismiss(true);
  }, [dismiss]);

  if (!visible || !detectedLocale) {
    return null;
  }

  const messages = detectedMessages[detectedLocale];
  const flag = localeFlags[detectedLocale];
  const isRTL = detectedLocale === "ar";

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-[90] flex justify-center pointer-events-none transition-transform duration-300 ease-out ${
        dismissing ? "translate-y-full" : "translate-y-0 animate-slide-up"
      }`}
      role="alert"
      aria-live="polite"
      suppressHydrationWarning
    >
      <div
        className="pointer-events-auto w-full md:max-w-lg md:mb-4 md:mx-4 md:rounded-xl rounded-t-xl bg-[#04453f] text-white shadow-2xl"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Flag */}
          <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">
            {flag}
          </span>

          {/* Message */}
          <p className="flex-1 text-sm leading-relaxed">
            {messages.text}
          </p>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Action button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleSwitch}
            className="w-full py-2.5 bg-[#9DFF20] text-[#04453f] font-semibold text-sm rounded-lg hover:bg-[#8ae619] active:bg-[#7bcc16] transition-colors"
          >
            {messages.switchLabel} &middot; {localeNames[detectedLocale]}
          </button>
        </div>
      </div>
    </div>
  );
}
