"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Bell, X, Check } from "lucide-react";
import {
  subscribeToPush,
  isPushSupported,
  getNotificationPermission,
  isIOSSafari,
  getExistingSubscription,
  unsubscribeFromPush,
  subscriptionToJson,
  refreshSubscription,
} from "@/lib/push-client";
import { cn } from "@/lib/utils";

// Get locale from URL path
function getLocaleFromPath(): string {
  if (typeof window === "undefined") return "fr";
  const path = window.location.pathname;
  const match = path.match(/^\/(en|es|ar)\//);
  return match ? match[1] : "fr";
}

// Inline translations to avoid SSR issues with next-intl in client components
const pushTranslations: Record<string, Record<string, string>> = {
  fr: {
    promptTitle: "Notifications",
    promptSubtitle: "Restez informé de l'actualité sportive",
    promptDescription:
      "Recevez les dernières nouvelles du football africain directement sur votre appareil.",
    notNow: "Pas maintenant",
    enableNotifications: "Activer",
    subscribing: "Activation...",
    subscribed: "Activé",
    blocked: "Bloqué",
    permissionDenied: "Notifications bloquées par le navigateur",
    subscriptionError: "Erreur lors de l'activation",
    close: "Fermer",
    subscribe: "S'abonner",
  },
  en: {
    promptTitle: "Notifications",
    promptSubtitle: "Stay updated on sports news",
    promptDescription:
      "Get the latest African football news delivered straight to your device.",
    notNow: "Not now",
    enableNotifications: "Enable",
    subscribing: "Enabling...",
    subscribed: "Enabled",
    blocked: "Blocked",
    permissionDenied: "Notifications blocked by browser",
    subscriptionError: "Error enabling notifications",
    close: "Close",
    subscribe: "Subscribe",
  },
  es: {
    promptTitle: "Notificaciones",
    promptSubtitle: "Mantente al día con las noticias deportivas",
    promptDescription:
      "Recibe las últimas noticias del fútbol africano directamente en tu dispositivo.",
    notNow: "Ahora no",
    enableNotifications: "Activar",
    subscribing: "Activando...",
    subscribed: "Activado",
    blocked: "Bloqueado",
    permissionDenied: "Notificaciones bloqueadas por el navegador",
    subscriptionError: "Error al activar las notificaciones",
    close: "Cerrar",
    subscribe: "Suscribirse",
  },
  ar: {
    promptTitle: "الإشعارات",
    promptSubtitle: "ابق على اطلاع بأخبار الرياضة",
    promptDescription:
      "احصل على آخر أخبار كرة القدم الأفريقية مباشرة على جهازك.",
    notNow: "ليس الآن",
    enableNotifications: "تفعيل",
    subscribing: "جارٍ التفعيل...",
    subscribed: "مفعل",
    blocked: "محظور",
    permissionDenied: "الإشعارات محظورة من المتصفح",
    subscriptionError: "خطأ في تفعيل الإشعارات",
    close: "إغلاق",
    subscribe: "اشترك",
  },
};

interface PushNotificationPromptProps {
  className?: string;
  showAsButton?: boolean;
}

export function PushNotificationPrompt({
  className,
  showAsButton = false,
}: PushNotificationPromptProps) {
  const [locale, setLocale] = useState("fr");
  const pathname = usePathname();
  const hasInitialized = useRef(false);

  const t = useCallback(
    (key: string) => {
      return pushTranslations[locale]?.[key] || pushTranslations.fr[key] || key;
    },
    [locale]
  );

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check support and permission on mount
  useEffect(() => {
    const checkPushSupport = async () => {
      if (typeof window === "undefined") return;

      setLocale(getLocaleFromPath());

      // iOS Safari: push not supported outside PWA mode
      if (isIOSSafari()) return;

      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        const currentPermission = getNotificationPermission();
        setPermission(currentPermission);

        // Check if already subscribed
        const existingSubscription = await getExistingSubscription();
        if (existingSubscription && currentPermission === "granted") {
          setIsSubscribed(true);
          // Silently re-sync subscription with server
          refreshSubscription(getLocaleFromPath(), ["news", "general"]).catch(
            () => {}
          );
        }

        // Show prompt if permission not yet decided
        if (currentPermission === "default") {
          const hasDeclined = localStorage.getItem("push_prompt_declined");
          if (!hasDeclined) {
            setTimeout(() => {
              setShowPrompt(true);
            }, 5000);
          }
        }
      }
    };

    checkPushSupport();
    hasInitialized.current = true;
  }, []);

  // Refresh subscription on route change
  useEffect(() => {
    if (!hasInitialized.current) return;
    if (!isSubscribed || permission !== "granted") return;

    refreshSubscription(getLocaleFromPath(), ["news", "general"]).catch(
      () => {}
    );
  }, [pathname, isSubscribed, permission]);

  const handleSubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await subscribeToPush(locale, ["news", "general"]);

      if (result.success) {
        setIsSubscribed(true);
        setShowPrompt(false);
        setPermission("granted");
      } else {
        setPermission(getNotificationPermission());
        if (getNotificationPermission() === "denied") {
          setError(t("permissionDenied"));
        } else if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setError(t("subscriptionError"));
    } finally {
      setIsLoading(false);
    }
  }, [locale, t]);

  const handleDecline = useCallback(() => {
    localStorage.setItem("push_prompt_declined", "true");
    setShowPrompt(false);
  }, []);

  const handleUnsubscribe = useCallback(async () => {
    try {
      const subscription = await getExistingSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: subscriptionToJson(subscription),
          }),
        });
        await unsubscribeFromPush();
      }
    } catch (err) {
      console.error("Unsubscribe error:", err);
    }

    setIsSubscribed(false);
  }, []);

  if (!isSupported) return null;

  // Button mode (for settings or header)
  if (showAsButton) {
    if (isSubscribed) {
      return (
        <button
          onClick={handleUnsubscribe}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-green-100 text-green-700 hover:bg-green-200",
            "transition-colors duration-200",
            className
          )}
        >
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{t("subscribed")}</span>
        </button>
      );
    }

    if (permission === "denied") {
      return (
        <button
          disabled
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-gray-100 text-gray-400 cursor-not-allowed",
            className
          )}
          title={t("permissionDenied")}
        >
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">{t("blocked")}</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full",
          "bg-[#9DFF20] text-[#345C00] hover:bg-[#8BE01C]",
          "transition-colors duration-200",
          isLoading && "opacity-50 cursor-wait",
          className
        )}
      >
        <Bell className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isLoading ? t("subscribing") : t("subscribe")}
        </span>
      </button>
    );
  }

  // Floating prompt
  if (!showPrompt || isSubscribed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-50",
        "bg-white rounded-2xl shadow-2xl border border-gray-100",
        "animate-in slide-in-from-bottom-4 duration-500",
        className
      )}
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-[#9DFF20]/15 rounded-xl sm:rounded-2xl shrink-0">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-[#345C00]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                {t("promptTitle")}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mt-0.5 sm:mt-1">
                {t("promptSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            aria-label={t("close")}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-600 mt-3 sm:mt-4">
          {t("promptDescription")}
        </p>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 mt-2 sm:mt-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-6">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            {t("notNow")}
          </button>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base font-medium text-[#345C00] bg-[#9DFF20] rounded-xl",
              "hover:bg-[#8BE01C] transition-colors",
              isLoading && "opacity-50 cursor-wait"
            )}
          >
            {isLoading ? t("subscribing") : t("enableNotifications")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PushNotificationPrompt;
