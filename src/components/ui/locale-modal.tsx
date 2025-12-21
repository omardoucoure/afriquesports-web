"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";

const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

const localeMessages: Record<Locale, { title: string; message: string; stay: string; switch: string }> = {
  fr: {
    title: "Changer de langue ?",
    message: "Votre navigateur est configuré en français. Voulez-vous continuer en français ?",
    stay: "Rester en",
    switch: "Passer en",
  },
  en: {
    title: "Change language?",
    message: "Your browser is set to English. Would you like to switch to English?",
    stay: "Stay in",
    switch: "Switch to",
  },
  es: {
    title: "¿Cambiar idioma?",
    message: "Su navegador está configurado en español. ¿Le gustaría cambiar a español?",
    stay: "Quedarse en",
    switch: "Cambiar a",
  },
};

export function LocaleModal() {
  const [showModal, setShowModal] = useState(false);
  const [detectedLocale, setDetectedLocale] = useState<Locale | null>(null);
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user has already made a choice
    const localePreference = localStorage.getItem("locale-preference-dismissed");
    if (localePreference) {
      return;
    }

    // Check if user has a saved locale preference
    const savedLocale = localStorage.getItem("locale-preference");
    if (savedLocale) {
      return;
    }

    // Detect browser language
    const browserLang = navigator.language.split("-")[0];

    // Check if browser language is a supported locale and different from current
    if (
      locales.includes(browserLang as Locale) &&
      browserLang !== currentLocale
    ) {
      setDetectedLocale(browserLang as Locale);
      setShowModal(true);
    }
  }, [currentLocale]);

  const handleStay = () => {
    // Save current locale as preference
    localStorage.setItem("locale-preference", currentLocale);
    localStorage.setItem("locale-preference-dismissed", "true");
    setShowModal(false);
  };

  const handleSwitch = () => {
    if (!detectedLocale) return;

    // Save detected locale as preference
    localStorage.setItem("locale-preference", detectedLocale);
    localStorage.setItem("locale-preference-dismissed", "true");

    setShowModal(false);

    // Use next-intl's router.replace with locale option
    // This properly handles the locale switching without manual path manipulation
    router.replace(pathname, { locale: detectedLocale });
  };

  if (!showModal || !detectedLocale) {
    return null;
  }

  const messages = localeMessages[detectedLocale];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#04453f] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{messages.title}</h2>
        </div>

        {/* Message */}
        <p className="text-gray-600 mb-6">{messages.message}</p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleStay}
            className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            {messages.stay} {localeNames[currentLocale]}
          </button>
          <button
            onClick={handleSwitch}
            className="flex-1 px-4 py-3 bg-[#04453f] text-white font-semibold rounded-lg hover:bg-[#022a27] transition-colors"
          >
            {messages.switch} {localeNames[detectedLocale]}
          </button>
        </div>
      </div>
    </div>
  );
}
