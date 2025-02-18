export enum Category {
  HISTORY = 'history',
  GEOGRAPHY = 'geography',
  SCIENCE = 'science',
  SPORTS = 'sports',
  ART = 'art',
  ENTERTAINMENT = 'entertainment'
}

export enum Language {
  TR = 'tr',
  EN = 'en',
}

export interface Question {
  id: string;
  category: Category;
  question: string;
  answer: string;
  language: Language;
}

export interface Player {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  players: Player[];
  currentPlayerIndex: number;
  jokers: number;
  badges: Category[];
  position: number;
  correctAnswers: number;
  wrongAnswers: number;
}

export interface GameState {
  joker: boolean;
  groups: Group[];
  currentGroupIndex: number;
  currentQuestion: Question | null;
  timeRemaining: number;
  language: Language;
  isGameStarted: boolean;
  winner: Group | null;
}
