import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Question, Category, Language } from '../types';

export const getRandomQuestion = async (
  category: Category,
  language: Language
): Promise<Question | null> => {
  try {
    const questionsRef = collection(db, 'questions');
    const q = query(
      questionsRef,
      where('category', '==', category),
      where('language', '==', language)
    );

    const querySnapshot = await getDocs(q);
    const questions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Question[];

    if (questions.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  } catch (error) {
    console.error('Error fetching question:', error);
    return null;
  }
};

export const addQuestion = async (question: Omit<Question, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, 'questions'), question);
    return docRef.id;
  } catch (error) {
    console.error('Error adding question:', error);
    return null;
  }
};
