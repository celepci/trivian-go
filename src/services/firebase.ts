import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyBtYTqpQqplY6aCM7m8PRGyiilUFc6Gdsc",
  authDomain: "trivia-night-d19e9.firebaseapp.com",
  projectId: "trivia-night-d19e9",
  storageBucket: "trivia-night-d19e9.appspot.com",
  messagingSenderId: "1029110716771",
  appId: "1:1029110716771:web:bcbc55c16b7722b80d5b56",
  measurementId: "G-GNYG5YHW47"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Firestore veritabanını başlat
export const db = getFirestore(app);

// Authentication başlatma
export const auth = getAuth(app);

// Environment variables'dan kullanıcı ID'sini al
export const USER_ID = process.env.REACT_APP_USER_ID;

// Oturum açık mı kontrolü
export const isSignedIn = (): boolean => {
  return !!auth.currentUser;
};

// Admin kimlik bilgilerini environment variables'dan al
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

// Auth işlemi ve Firestore'a yazma
export const signInAndAddToFirestore = async (data: any, collectionName: string = 'QuestionReport'): Promise<string | null> => {
  try {
    // Kullanıcı oturum açmış mı kontrol et
    if (!auth.currentUser) {
      try {
        // Kimlik bilgilerini kontrol et
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
          console.error('Admin kimlik bilgileri bulunamadı. Lütfen .env dosyasını kontrol edin.');
          return null;
        }
        
        console.log('Oturum açılıyor...');
        // Kimlik doğrulama işlemi - TypeScript'e bunların kesinlikle string olduğunu söylüyoruz
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL as string, ADMIN_PASSWORD as string);
        console.log('Oturum açıldı');
      } catch (authError) {
        console.error('Oturum açılamadı:', authError);
        return null;
      }
    }
    
    // USER_ID kontrolü
    if (!USER_ID) {
      console.error('USER_ID bulunamadı. Lütfen .env dosyasını kontrol edin.');
      return null;
    }
    
    // Koleksiyona veri ekle
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, {
      ...data,
      userId: USER_ID as string,
      timestamp: serverTimestamp()
    });
    
    console.log(`Veri ${collectionName} koleksiyonuna eklendi:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Veri eklenemedi:', error);
    return null;
  }
};
