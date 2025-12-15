export const locales = ["fr", "en", "es"] as const;
export const defaultLocale = "fr" as const;

export type Locale = (typeof locales)[number];
