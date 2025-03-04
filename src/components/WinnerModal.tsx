import React, { useState, useEffect, useRef } from "react";
import ReactConfetti from "react-confetti";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Trophy, Crown, Star, Users } from "lucide-react";
import { Group, Language } from "../types";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useTranslation } from "react-i18next";
import { SafeTranslationFunction } from "../i18n/config";
import { useGame } from "../contexts/GameContext";
import { getGameSettings } from "./SettingsModal";

interface WinnerModalProps {
  winner: Group;
  onClose: () => void;
  language: Language;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onClose, language }) => {
  const { t } = useTranslation();
  const safeT = t as SafeTranslationFunction;
  const { endGame } = useGame();
  const winnerSoundRef = useRef<HTMLAudioElement | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Ses dosyasını yükle
  useEffect(() => {
    winnerSoundRef.current = new Audio('/winner.mp3');
    
    // Ses ayarları açıksa ve ses dosyası yüklendiyse çal
    const settings = getGameSettings();
    if (settings.soundEnabled && winnerSoundRef.current) {
      winnerSoundRef.current.play().catch(err => console.error("Kazanma sesi çalınamadı:", err));
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <ReactConfetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={200}
        recycle={false}
        colors={["#f472b6", "#ec4899", "#db2777"]}
      />
      <Card className="w-full max-w-lg bg-gray-900/90 border-gray-800">
        <CardHeader>
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute -top-3 -left-3">
                <Star className="h-6 w-6 text-yellow-500 animate-pulse" />
              </div>
              <div className="absolute -top-3 -right-3">
                <Star className="h-6 w-6 text-yellow-500 animate-pulse" />
              </div>
              <Trophy className="h-20 w-20 text-yellow-500" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <Star className="h-6 w-6 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 text-transparent bg-clip-text">
                {safeT('winnerModal.gameOver', 'Game Over')}
              </h1>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="text-pink-400 text-lg">{safeT('winnerModal.winner', 'Winner')}</span>
              <div className="flex items-center space-x-3">
                <Crown className="h-8 w-8 text-yellow-500" />
                <h2 className="text-4xl font-bold text-white">{winner.name}</h2>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="text-pink-400 text-lg">{safeT('winnerModal.players', 'Players')}</span>
              <div className="flex items-center justify-center space-x-2 text-white">
                <Users className="h-5 w-5" />
                <p className="text-lg">
                  {winner.players.map((player) => player.name).join(", ")}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => {
                endGame();
                onClose();
              }}
              className={cn(
                "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
                "text-white font-semibold shadow-lg",
                "hover:shadow-pink-500/25",
                "transition-all duration-200",
                "text-lg px-8 py-6 rounded-xl"
              )}
            >
              {safeT('winnerModal.backToMenu', 'Back to Menu')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
