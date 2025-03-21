import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Category, GameState, Language, Question, Group, Player } from '../types';
import { secureLocalStorage } from '../utils/security';

interface GameContextType {
  state: GameState;
  startGame: (groups: Group[], language: Language) => void;
  answerQuestion: (answer: string) => void;
  useJoker: (groupId: string) => void;
  nextGroup: () => void;
  endGame: () => void;
  dispatch: React.Dispatch<GameAction>;
}

const getInitialState = (): GameState => {
  try {
    // LocalStorage'dan güvenli bir şekilde veriyi al
    const savedState = secureLocalStorage.getItem<GameState | null>('gameState', null);
    if (savedState) {
      return savedState;
    }
    
    // Get language from localStorage or use TR as fallback
    const savedLanguage = secureLocalStorage.getItem<string | null>('selectedLanguage', null);
    const initialLanguage = savedLanguage === 'en' ? Language.EN : Language.TR;
    
    return {
      isGameStarted: false,
      currentQuestion: null,
      currentGroupIndex: 0,
      winner: null,
      language: initialLanguage,
      groups: [],
      timeRemaining: 30,
      selectedCategory: null
    };
  } catch (error) {
    console.error('Oyun durumu yüklenirken hata oluştu:', error);
    // Hata durumunda varsayılan değerleri döndür
    return {
      isGameStarted: false,
      currentQuestion: null,
      currentGroupIndex: 0,
      winner: null,
      language: Language.TR,
      groups: [],
      timeRemaining: 30,
      selectedCategory: null
    };
  }
};

type GameAction =
  | { type: 'START_GAME'; payload: Group[] }
  | { type: 'SET_QUESTION'; payload: Question }
  | { type: 'ANSWER_QUESTION'; payload: { correct: boolean; category: Category } }
  | { type: 'UPDATE_BADGES'; payload: { correct: boolean; category: Category } }
  | { type: 'USE_JOKER'; payload: string }
  | { type: 'NEXT_GROUP' }
  | { type: 'SET_WINNER'; payload: Group }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_TIME_REMAINING'; payload: number }
  | { type: 'RESET_QUESTION' }
  | { type: 'END_GAME' }
  | { type: 'SET_SELECTED_CATEGORY'; payload: Category | null };

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "START_GAME":
      return {
        ...state,
        groups: action.payload,
        isGameStarted: true,
        currentGroupIndex: 0,
        selectedCategory: null,
        winner: null,
      };

    case "SET_QUESTION":
      return {
        ...state,
        currentQuestion: action.payload,
      };
      
    case "UPDATE_BADGES":
      const updatedGroups = state.groups.map((group, index) => {
        if (index === state.currentGroupIndex) {
          // Grubu güncelle
          const updatedBadges = action.payload.correct 
            ? [...new Set([...group.badges, action.payload.category])]
            : group.badges;

          // Eğer grup tüm 6 rozeti topladıysa kazanan olarak ayarla
          if (updatedBadges.length >= 6) {
            dispatchEvent(new CustomEvent('gameWinner', { detail: group }));

          }

          return {
            ...group,
            score: action.payload.correct ? group.score + 1 : group.score,
            correctAnswers: action.payload.correct ? group.correctAnswers + 1 : group.correctAnswers,
            wrongAnswers: !action.payload.correct ? group.wrongAnswers + 1 : group.wrongAnswers,
            badges: updatedBadges,
            answeredQuestions: state.currentQuestion 
              ? [...(group.answeredQuestions || []), state.currentQuestion] 
              : (group.answeredQuestions || [])
          };
        }
        return group;
      });

      return {
        ...state,
        groups: updatedGroups
      };

    case "ANSWER_QUESTION":
      return {
        ...state,
        // Sadece yanlış cevap verildiğinde diğer gruba geç
        currentGroupIndex: !action.payload.correct 
          ? (state.currentGroupIndex + 1) % state.groups.length
          : state.currentGroupIndex,
        currentQuestion: null
      };

    case "USE_JOKER":
      return {
        ...state,
        groups: state.groups.map(group => 
          group.id === action.payload
            ? { ...group, jokers: group.jokers - 1 }
            : group
        )
      };

    case "SET_WINNER":
      return {
        ...state,
        winner: action.payload,
        isGameStarted: true // Oyun durumunu açık tutalım, böylece modal gösterilebilir
      };

    case "SET_LANGUAGE":
      return {
        ...state,
        language: action.payload
      };

    case "SET_TIME_REMAINING":
      return {
        ...state,
        timeRemaining: action.payload
      };

    case "RESET_QUESTION":
      return {
        ...state,
        currentQuestion: null
      };

    case "END_GAME":
      return {
        ...state,
        isGameStarted: false,
        currentQuestion: null,
        selectedCategory: null
      };

    case "NEXT_GROUP":
      return {
        ...state,
        currentGroupIndex: (state.currentGroupIndex + 1) % state.groups.length,
        currentQuestion: null
      };

    case "SET_SELECTED_CATEGORY":
      return {
        ...state,
        selectedCategory: action.payload
      };

    default:
      return state;
  }
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(gameReducer, getInitialState());

  // Oyun durumunu localStorage'a kaydet
  useEffect(() => {
    try {
      secureLocalStorage.setItem('gameState', state);
    } catch (error) {
      console.error('Oyun durumu kaydedilirken hata oluştu:', error);
    }
  }, [state]);

  const endGame = () => {
    dispatch({ type: 'END_GAME' });
    secureLocalStorage.removeItem('gameState'); // Oyun durumunu temizle
  };

  const startGame = (
    groups: Group[],
    language: Language
  ) => {
    dispatch({
      type: 'START_GAME',
      payload: groups,
    });
  };

  const answerQuestion = (answer: string) => {
    if (state.currentQuestion) {
      const isCorrect = answer === state.currentQuestion.answer;
      dispatch({
        type: 'ANSWER_QUESTION',
        payload: {
          correct: isCorrect,
          category: state.currentQuestion.category,
        },
      });
    }
  };

  const useJoker = (groupId: string) => {
    dispatch({ type: 'USE_JOKER', payload: groupId });
  };

  const nextGroup = () => {
    dispatch({ type: "NEXT_GROUP" });
  };

  const value = {
    state,
    startGame,
    answerQuestion,
    useJoker,
    nextGroup,
    endGame,
    dispatch,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
