import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css'; // CSS dosyasını import et

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      
      // Animasyon bittikten sonra onComplete çağrılacak
      setTimeout(onComplete, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center bg-slate-900 z-50"
        >
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
              }}
              transition={{ 
                duration: 1,
              }}
              className="h-64 neon-logo"
            >
              <img src="/logo.png" alt="Trivian Night Logo" className="w-full h-full" />
            </motion.div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
