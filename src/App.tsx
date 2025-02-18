import React from 'react';
import './globals.css';
import { GameProvider, useGame } from './contexts/GameContext';
import GameContainer from './components/GameContainer';
import './i18n/config';

const App: React.FC = () => {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <GameContainer />
      </div>
    </GameProvider>
  );
};

export default App;
