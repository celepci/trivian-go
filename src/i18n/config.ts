import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { TFunction } from 'i18next';
import { translationEN, translationTR } from './locales';

const getInitialLanguage = () => {
  // Önce localStorage'da kayıtlı dili kontrol et
  const savedLanguage = localStorage.getItem('selectedLanguage');
  if (savedLanguage) {
    return savedLanguage;
  }

  // localStorage'da kayıtlı dil yoksa tarayıcı dilini kullan
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('tr') ? 'tr' : 'en';
};

const resources = {
  en: { translation: translationEN },
  tr: { translation: translationTR },
} as const;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof resources;
  }
}

// Özel t fonksiyonu tipi
export type SafeTranslationFunction = {
  (key: string, defaultValue?: string): string;
  (key: string[], defaultValue?: string): string;
  (key: string, defaultValue: string, options: any): string;
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    defaultNS: 'translation',
    ns: ['translation'],
    react: {
      useSuspense: false
    }
  });

export default i18n;
