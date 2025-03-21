import { useTranslation as useI18nTranslation } from 'react-i18next';

export type SafeTranslationFunction = (key: string, defaultValue?: string, options?: any) => string;

export const useTranslation = (): { t: SafeTranslationFunction } => {
  const { t: originalT } = useI18nTranslation();
  
  // Güvenli çeviri fonksiyonu
  const safeTranslate: SafeTranslationFunction = (key: string, defaultValue?: string, options?: any) => {
    try {
      // Eğer ikinci parametre options ise (defaultValue değilse)
      if (typeof defaultValue === 'object' && options === undefined) {
        // @ts-ignore
        const result = originalT(key, defaultValue);
        return typeof result === 'string' ? result : String(result) || key;
      }
      
      // Eğer üç parametre varsa (key, defaultValue, options)
      if (options !== undefined) {
        // React-i18next t fonksiyonu parametreleri şöyle alır:
        // t(key, { defaultValue, ...diğer_opsiyonlar })
        
        // @ts-ignore
        const result = originalT(key, { defaultValue });
        let translatedText = typeof result === 'string' ? result : String(result);
        
        // Eğer çeviri bulunamazsa, varsayılan değeri kullan ve içindeki placeholderları doldur
        if (!translatedText || translatedText === key) {
          translatedText = defaultValue || key;
        }
        
        // Placeholder değişimi yap ({0}, {1}, ... -> gerçek değerler)
        if (translatedText && options) {
          Object.keys(options).forEach((optionKey) => {
            const regex = new RegExp(`\\{${optionKey}\\}`, 'g');
            translatedText = translatedText.replace(regex, options[optionKey]);
          });
        }
        
        return translatedText;
      }
      
      // Sadece key ve defaultValue varsa
      // @ts-ignore
      const result = originalT(key, { defaultValue });
      const translatedText = typeof result === 'string' ? result : String(result);
      return translatedText || defaultValue || key;
    } catch (error) {
      console.error(`Çeviri hatası: ${key}`, error);
      return defaultValue || key;
    }
  };
  
  return { t: safeTranslate };
};
