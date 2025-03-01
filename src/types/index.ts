export enum Category {
  HISTORY = "history",
  GEOGRAPHY = "geography",
  SCIENCE = "science",
  SPORTS = "sports",
  ART = "art",
  ENTERTAINMENT = "entertainment",
}

export enum Language {
  TR = "tr",
  EN = "en",
}

// Soru tipi
export interface Question {
  correctAnswerKey: string;
  id: string | number;
  question: string;
  category: Category;
  language: Language;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  answer: string;
  type?: "multiple_choice" | "classic"; // İsteğe bağlı tip bilgisi, geriye dönük uyumluluk için
}

// Oyuncu
export interface Player {
  id: string;
  name: string;
}

// Grup
export interface Group {
  id: string;
  name: string;
  score: number;
  jokers: number;
  players: Player[];
  badges: Category[];
  correctAnswers: number;
  wrongAnswers: number;
  position: number;
  answeredQuestions?: Question[];
}

// Oyun durumu
export interface GameState {
  selectedCategory: Category | null;
  isGameStarted: boolean;
  currentQuestion: Question | null;
  currentGroupIndex: number;
  winner: Group | null;
  language: Language;
  groups: Group[];
  timeRemaining: number;
}

// Oyun aksiyonları
export type GameAction =
  | { type: "START_GAME"; payload: Group[] }
  | { type: "SET_QUESTION"; payload: Question }
  | { type: "ANSWER_QUESTION"; payload: { correct: boolean; category: Category } }
  | { type: "USE_JOKER"; payload: string }
  | { type: "SET_WINNER"; payload: Group }
  | { type: "SET_LANGUAGE"; payload: Language }
  | { type: "SET_TIME_REMAINING"; payload: number }
  | { type: "END_GAME" };
