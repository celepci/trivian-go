import { serverTimestamp } from 'firebase/firestore';
import { signInAndAddToFirestore } from './firebase';
import { Question } from '../types';

export interface ErrorReport {
  questionId: string | number;
  question: string;
  category: string;
  language: string;
  reportedAt?: any; // Firebase Timestamp
  status: 'pending' | 'reviewed' | 'fixed' | 'rejected';
  description?: string; // Kullanıcı tarafından girilen açıklama
  deviceInfo?: any;
}

/**
 * Soru için hata bildirimi oluşturur
 * @param question Hata bildirilen soru
 * @param description Kullanıcı tarafından girilen açıklama
 * @param notes İsteğe bağlı notlar
 * @returns Başarılı olursa rapor ID'si, başarısız olursa null
 */
export const reportQuestionError = async (
  question: Question,
  description?: string
): Promise<string | null> => {
  try {
    console.log('Hata raporu oluşturuluyor...', {
      questionId: question.id,
      question: question.question,
      category: question.category,
      language: question.language,
      description
    });
    
    // Cihaz bilgilerini topla
    const deviceInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timestamp: new Date().toISOString()
    };
    
    // Hata raporu verisi
    const errorReportData: ErrorReport = {
      questionId: question.id,
      question: question.question,
      category: question.category,
      language: question.language,
      status: 'pending',
      description,
      deviceInfo
    };

    console.log('Hata raporu Firestore\'a gönderiliyor...');
    
    // Firebase'e giriş yap ve veriyi ekle
    const reportId = await signInAndAddToFirestore(errorReportData, 'QuestionReport');
    
    if (reportId) {
      console.log('Hata bildirimi kaydedildi:', reportId);
      return reportId;
    } else {
      console.error('Hata bildirimi kaydedilemedi!');
      return null;
    }
  } catch (error) {
    console.error('Hata bildirimi kaydedilirken bir hata oluştu:', error);
    if (error instanceof Error) {
      console.error('Hata detayı:', error.message);
      console.error('Hata stack:', error.stack);
    }
    return null;
  }
};
