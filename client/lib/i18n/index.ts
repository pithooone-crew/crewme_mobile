import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager, Platform } from "react-native";
import * as Localization from "expo-localization";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import zh from "./locales/zh.json";
import pt from "./locales/pt.json";
import de from "./locales/de.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import th from "./locales/th.json";
import vi from "./locales/vi.json";
import hi from "./locales/hi.json";
import ar from "./locales/ar.json";

export const LANGUAGE_STORAGE_KEY = "@crewme_language";

export const supportedLanguages = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", rtl: false },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", rtl: false },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", rtl: false },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", rtl: false },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", rtl: false },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", rtl: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", rtl: false },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", rtl: false },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭", rtl: false },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", rtl: false },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", rtl: false },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true },
] as const;

export type LanguageCode = typeof supportedLanguages[number]["code"];

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  th: { translation: th },
  vi: { translation: vi },
  hi: { translation: hi },
  ar: { translation: ar },
};

export const isRTLLanguage = (languageCode: string): boolean => {
  const lang = supportedLanguages.find((l) => l.code === languageCode);
  return lang?.rtl || false;
};

export const getDeviceLanguage = (): LanguageCode => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const deviceLang = locales[0].languageCode;
    if (deviceLang) {
      const supported = supportedLanguages.find((l) => l.code === deviceLang);
      if (supported) {
        return supported.code;
      }
    }
  }
  return "en";
};

export const initI18n = async () => {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const deviceLanguage = getDeviceLanguage();
  const defaultLanguage = savedLanguage || deviceLanguage;

  const shouldBeRTL = isRTLLanguage(defaultLanguage);
  if (Platform.OS !== "web" && I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: defaultLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
};

export const changeLanguage = async (languageCode: LanguageCode) => {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  await i18n.changeLanguage(languageCode);

  const shouldBeRTL = isRTLLanguage(languageCode);
  if (Platform.OS !== "web" && I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
};

export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language || "en") as LanguageCode;
};

export const isCurrentLanguageRTL = (): boolean => {
  return isRTLLanguage(getCurrentLanguage());
};

export default i18n;
