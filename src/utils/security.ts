/**
 * Güvenlik yardımcı fonksiyonları
 * Bu dosya, uygulamada kullanılan güvenlik önlemlerini içerir
 */

// Uygulama için unique bir prefix
export const STORAGE_PREFIX = 'trivian_night_v1_';

/**
 * Kullanıcı girdisini temizler ve XSS saldırılarına karşı koruma sağlar
 * @param input Temizlenecek girdi
 * @returns Temizlenmiş girdi
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // HTML özel karakterlerini dönüştür
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * LocalStorage'a güvenli bir şekilde veri kaydeder
 * @param key Anahtar
 * @param value Değer
 */
export const secureLocalStorage = {
  setItem: (key: string, value: any): void => {
    try {
      // Prefix ekle
      const prefixedKey = `${STORAGE_PREFIX}${key}`;
      
      // Değeri JSON'a dönüştür
      const jsonValue = JSON.stringify(value);
      
      // LocalStorage'a kaydet
      localStorage.setItem(prefixedKey, jsonValue);
    } catch (error) {
      console.error('LocalStorage kaydetme hatası:', error);
    }
  },
  
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      // Prefix ekle
      const prefixedKey = `${STORAGE_PREFIX}${key}`;
      
      // LocalStorage'dan değeri al
      const value = localStorage.getItem(prefixedKey);
      
      // Değer yoksa varsayılan değeri döndür
      if (!value) return defaultValue;
      
      // JSON'dan dönüştür
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('LocalStorage okuma hatası:', error);
      return defaultValue;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      // Prefix ekle
      const prefixedKey = `${STORAGE_PREFIX}${key}`;
      
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error('LocalStorage silme hatası:', error);
    }
  },
  
  // Tüm uygulama verilerini temizle
  clearAll: (): void => {
    try {
      // LocalStorage'daki tüm anahtarları al
      const keys = Object.keys(localStorage);
      
      // Prefix ile başlayan tüm anahtarları sil
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('LocalStorage temizleme hatası:', error);
    }
  }
};

/**
 * Güvenli bir şekilde URL'leri doğrular
 * @param url Doğrulanacak URL
 * @returns URL güvenli ise true, değilse false
 */
export const isUrlSafe = (url: string): boolean => {
  // URL boş ise güvenli değil
  if (!url) return false;
  
  try {
    // URL'yi ayrıştır
    const parsedUrl = new URL(url);
    
    // Sadece http ve https protokollerine izin ver
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    // URL ayrıştırılamadıysa güvenli değil
    return false;
  }
};

/**
 * Güvenli bir şekilde JSON verisini doğrular
 * @param jsonString JSON verisi
 * @returns Doğrulanmış JSON verisi veya null
 */
export const validateJSON = <T>(jsonString: string): T | null => {
  try {
    // JSON verisini ayrıştır
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('JSON doğrulama hatası:', error);
    return null;
  }
};
