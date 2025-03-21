import React, { useState, useEffect } from 'react';
import './globals.css';
import { GameProvider, useGame } from './contexts/GameContext';
import GameContainer from './components/GameContainer';
import SplashScreen from './components/SplashScreen';
import { secureLocalStorage } from './utils/security';
import './i18n/config';
import { Toaster } from './components/ui/toaster';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  
  // LocalStorage'da daha önce gösterilip gösterilmediğini kontrol et
  useEffect(() => {
    try {
      const hasSeenSplash = secureLocalStorage.getItem<string | null>('hasSeenSplash', null);
      // Eğer uygulama son 1 saat içinde açıldıysa splash ekranını gösterme
      if (hasSeenSplash) {
        const lastSeen = parseInt(hasSeenSplash, 10);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        if (lastSeen > oneHourAgo) {
          setShowSplash(false);
        }
      }
    } catch (error) {
      console.error('Splash ekranı durumu kontrol edilirken hata oluştu:', error);
      // Hata durumunda splash ekranını göster
      setShowSplash(true);
    }

  }, []);
  
  const handleSplashComplete = () => {
    setShowSplash(false);
    // Splash ekranının gösterildiği zamanı kaydet
    try {
      secureLocalStorage.setItem('hasSeenSplash', Date.now().toString());
    } catch (error) {
      console.error('Splash ekranı durumu kaydedilirken hata oluştu:', error);
    }
  };

  return (
    <>
      <GameProvider>
        {showSplash ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : (
          <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <GameContainer />
          </div>
        )}
      </GameProvider>
      <Toaster />
    </>
  );
};

export default App;
