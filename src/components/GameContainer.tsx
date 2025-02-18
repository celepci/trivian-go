import React from 'react';
import { useGame } from '../contexts/GameContext';
import { GameBoard } from './GameBoard';
import { StartScreen } from './StartScreen';

const GameContainer: React.FC = () => {
  const { state } = useGame();
  const { isGameStarted } = state;

  return isGameStarted ? <GameBoard /> : <StartScreen />;
};

export default GameContainer;
