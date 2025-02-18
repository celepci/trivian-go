import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Category, GameState, Language, Question, Group, Player } from '../types';

interface GameContextType {
  state: GameState;
  startGame: (groups: { name: string; players: Player[] }[], language: Language) => void;
  answerQuestion: (answer: string) => void;
  useJoker: () => boolean;
  nextGroup: () => void;
  endGame: () => void;
  joker: boolean;
  dispatch: React.Dispatch<GameAction>;
}

const getInitialState = (): GameState => {
  const savedState = localStorage.getItem('gameState');
  if (savedState) {
    return JSON.parse(savedState);
  }

  // Get language from localStorage or use TR as fallback
  const savedLanguage = localStorage.getItem('selectedLanguage');
  const initialLanguage = savedLanguage === 'en' ? Language.EN : Language.TR;
  return {
    groups: [],
    currentGroupIndex: 0,
    currentQuestion: null,
    timeRemaining: 30,
    language: initialLanguage,
    isGameStarted: false,
    winner: null,
    joker: false,
  };
};

type GameAction =
  | { type: 'START_GAME'; payload: { groups: Group[]; language: Language } }
  | { type: 'SET_QUESTION'; payload: Question }
  | { type: 'ANSWER_QUESTION'; payload: { correct: boolean; category: Category } }
  | { type: 'USE_JOKER' }
  | { type: 'NEXT_GROUP' }
  | { type: 'SET_WINNER'; payload: Group }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'END_GAME' };

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        groups: action.payload.groups,
        language: action.payload.language,
        isGameStarted: true,
        currentGroupIndex: 0,
        winner: null,
        joker: false,
      };

    case 'SET_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload,
        timeRemaining: 30,
      };

    case 'ANSWER_QUESTION': {
      const currentGroup = state.groups[state.currentGroupIndex];

      // Doğru cevap verildiğinde ve rozet daha önce alınmamışsa rozeti ekle
      // Ayrıca doğru/yanlış sayılarını güncelle
      const updatedGroup = {
        ...currentGroup,
        badges: action.payload.correct && !currentGroup.badges.includes(action.payload.category)
          ? [...currentGroup.badges, action.payload.category]
          : currentGroup.badges,
        correctAnswers: action.payload.correct 
          ? (currentGroup.correctAnswers || 0) + 1 
          : (currentGroup.correctAnswers || 0),
        wrongAnswers: !action.payload.correct 
          ? (currentGroup.wrongAnswers || 0) + 1 
          : (currentGroup.wrongAnswers || 0)
      };

      // Check if this group has won
      if (updatedGroup.badges.length === Object.keys(Category).length) {
        return {
          ...state,
          groups: state.groups.map((g) =>
            g.id === updatedGroup.id ? updatedGroup : g
          ),
          currentQuestion: null,
          winner: updatedGroup,
        };
      }

      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === updatedGroup.id ? updatedGroup : g
        ),
        currentQuestion: null
      };
    }

    case 'USE_JOKER': {
      const currentGroup = state.groups[state.currentGroupIndex];
      
      // Grubun jokeri yoksa işlemi iptal et
      if (currentGroup.jokers <= 0) {
        return state;
      }

      // Jokeri azalt
      const updatedGroup = {
        ...currentGroup,
        jokers: currentGroup.jokers - 1
      };

      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === updatedGroup.id ? updatedGroup : g
        ),
        joker: true
      };
    }

    case 'NEXT_GROUP':
      return {
        ...state,
        currentGroupIndex: (state.currentGroupIndex + 1) % state.groups.length,
        currentQuestion: null,
      };

    case 'SET_TIME':
      return {
        ...state,
        timeRemaining: action.payload,
      };

    case 'END_GAME':
      return {
        ...getInitialState(),
        isGameStarted: false,
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
    localStorage.setItem('gameState', JSON.stringify(state));
  }, [state]);

  const endGame = () => {
    dispatch({ type: 'END_GAME' });
    localStorage.removeItem('gameState'); // Oyun durumunu temizle
  };

  const startGame = (
    groups: { name: string; players: Player[] }[],
    language: Language
  ) => {
    const formattedGroups: Group[] = groups.map((group, index) => ({
      id: Date.now().toString() + index,
      name: group.name,
      players: group.players,
      badges: [],
      currentPlayerIndex: 0,
      jokers: 1,
      position: index + 1,
      correctAnswers: 0,
      wrongAnswers: 0,
    }));

    dispatch({
      type: 'START_GAME',
      payload: { groups: formattedGroups, language },
    });
  };

  const answerQuestion = (answer: string) => {
    if (!state.currentQuestion) return;

    const isCorrect = answer === 'correct';

    dispatch({
      type: 'ANSWER_QUESTION',
      payload: { 
        correct: isCorrect, 
        category: state.currentQuestion.category 
      },
    });

    // Yanlış cevap verildiğinde otomatik olarak sırayı değiştir
    if (!isCorrect) {
      dispatch({ type: 'NEXT_GROUP' });
    }
  };

  const useJoker = () => {
    if (state.groups[state.currentGroupIndex]?.jokers > 0) {
      dispatch({ type: 'USE_JOKER' });
      return true;
    }
    return false;
  };

  const nextGroup = () => {
    dispatch({ type: 'NEXT_GROUP' });
  };

  return (
    <GameContext.Provider
      value={{
        state,
        startGame,
        answerQuestion,
        useJoker,
        nextGroup,
        endGame,
        joker: state.joker,
        dispatch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
