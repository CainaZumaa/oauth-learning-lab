export type Locale = "en" | "pt";

export const LOCALES: {
  code: Locale;
  label: string;
  flag: string;
  htmlLang: string;
}[] = [
  { code: "en", label: "English", flag: "🇺🇸", htmlLang: "en" },
  { code: "pt", label: "Português", flag: "🇧🇷", htmlLang: "pt-BR" },
];

export const DEFAULT_LOCALE: Locale = "pt";
export const LOCALE_STORAGE_KEY = "oauth-lab-locale";
