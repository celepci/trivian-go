import React, { useState, useEffect } from "react";
import { useGame } from "../contexts/GameContext";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  History,
  Globe2,
  Microscope,
  Dumbbell,
  Palette,
  Tv2,
  RotateCcw,
  Check,
  X as XIcon,
  Home,
  Crown,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";
import { Toaster } from "./ui/toaster";
import { Category, Language, Question } from "../types";
import { cn } from "../lib/utils";
import { WinnerModal } from "./WinnerModal";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { CustomTFunction } from "../i18n/config";

const categories = [
  {
    name: Category.HISTORY,
    color: "bg-red-500",
    icon: History,
    file: "history",
  },
  {
    name: Category.GEOGRAPHY,
    color: "bg-blue-500",
    icon: Globe2,
    file: "geography",
  },
  {
    name: Category.SCIENCE,
    color: "bg-green-500",
    icon: Microscope,
    file: "science",
  },
  {
    name: Category.SPORTS,
    color: "bg-yellow-500",
    icon: Dumbbell,
    file: "sports",
  },
  { name: Category.ART, color: "bg-purple-500", icon: Palette, file: "art" },
  {
    name: Category.ENTERTAINMENT,
    color: "bg-orange-500",
    icon: Tv2,
    file: "entertainment",
  },
];

const HandleChangeQuestionButton = () => {
  const { useJoker, state } = useGame();
  const { toast } = useToast();
  const { t: translate } = useTranslation();
  const t = translate as CustomTFunction;
  const currentGroup = state.groups[state.currentGroupIndex];
  const hasJoker = currentGroup.jokers > 0;

  const handleChangeQuestion = () => {
    if (!hasJoker) {
      toast({
        title: t("gameBoard.noJoker"),
        description: t("gameBoard.noJokerDescription"),
        className: "bg-gray-800 border-gray-700 text-white",
        variant: "destructive",
      });
      return;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useJoker();
    toast({
      title: t("gameBoard.questionChanged"),
      description: t("gameBoard.questionChangedDescription"),
      className: "bg-gray-800 border-gray-700 text-white",
    });
  };

  return (
    <Button
      onClick={handleChangeQuestion}
      disabled={!hasJoker}
      size="sm"
      variant="outline"
      className={cn(
        "border-red-500 text-red-500 hover:bg-red-500 hover:text-white",
        !hasJoker && "opacity-50 cursor-not-allowed"
      )}
    >
      {t("gameBoard.changeQuestion")}
    </Button>
  );
};

export const GameBoard: React.FC = () => {
  const { state, answerQuestion, useJoker, endGame, dispatch } = useGame();
  const { groups, currentGroupIndex, currentQuestion, winner, language } = state;
  const { toast } = useToast();
  const { t: translate } = useTranslation();
  const t = translate as CustomTFunction & TFunction;

  console.log("Mevcut dil:", language);
  console.log("Çeviri fonksiyonu:", t);

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [jokerUsed, setJokerUsed] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(true);
  const [highlightedCategory, setHighlightedCategory] = useState<Category | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);

  const styles = {
    categoryButton: `
      relative
      flex
      flex-col
      items-center
      justify-center
      p-4
      rounded-lg
      bg-gray-800
      hover:bg-gray-700
      transition-all
      duration-300
      ease-in-out
      cursor-pointer
      ${isSpinning ? 'pointer-events-none' : ''}
    `,
    highlighted: `
      bg-primary
      text-white
      transform
      scale-110
      transition-all
      duration-300
      ease-in-out
    `
  };

  // Test için useEffect ile ilk grubu winner olarak ayarla
  useEffect(() => {
    if (groups.length > 0) {
      const mockWinner = {
        ...groups[0],
        badges: Object.values(Category), // Tüm rozetleri ekle
      };
      dispatch({
        type: "SET_WINNER",
        payload: mockWinner,
      });
    }
  }, [groups]);

  const handleCloseWinnerModal = () => {
    setShowWinnerModal(false);
    window.location.reload();
  };

  // Rastgele soru seçme fonksiyonu
  const selectRandomQuestion = (
    questions: Question[],
    currentQuestionId?: string
  ) => {
    // Mevcut soruyu hariç tut
    const availableQuestions = currentQuestionId
      ? questions.filter((q) => q.id !== currentQuestionId)
      : questions;

    if (availableQuestions.length === 0) {
      toast({
        title: t("gameBoard.error"),
        description: t("gameBoard.noCategoryQuestion"),
        className: "bg-gray-800 border-gray-700 text-white",
        variant: "destructive",
      });
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (currentQuestion) {
      // Doğru cevabı GameContext'e gönder
      answerQuestion(isCorrect ? "correct" : "wrong");

      // Toast mesajı göster
      const nextGroup = groups[(currentGroupIndex + 1) % groups.length];
      toast({
        title: isCorrect ? t("gameBoard.correct") : t("gameBoard.wrong"),
        description: isCorrect
          ? t("gameBoard.correctAnswer")
          : t("gameBoard.wrongAnswer"),
        className: "bg-gray-800 border-gray-700 text-white",
        variant: isCorrect ? "default" : "destructive",
      });

      // Kategori seçimini sıfırla
      setSelectedCategory(null);

      // Eğer doğru cevap verildiyse ve henüz bu rozet alınmadıysa
      if (isCorrect && currentQuestion.category) {
        const currentGroup = groups[currentGroupIndex];
        // Tüm rozetlerin alınıp alınmadığını kontrol et
        const hasAllBadges = categories.every((category) =>
          currentGroup.badges.includes(category.name)
        );

        // Tüm rozetler toplandıysa oyunu bitir
        if (hasAllBadges) {
          endGame();
          setShowWinnerModal(true);
        }
      }
    }
  };

  useEffect(() => {
    const loadQuestions = async () => {
      if (selectedCategory) {
        try {
          const categoryData = categories.find(
            (cat) => cat.name === selectedCategory
          );
          if (!categoryData || !categoryData.file) {
            throw new Error(t("gameBoard.categoryNotFound"));
          }
          debugger;
          // Dinamik olarak soruları import et
          const questionsModule = await import(
            `../questions/${language}/${categoryData.file}.json`
          );
          const questions = questionsModule.default;

          if (!questions || !Array.isArray(questions)) {
            throw new Error(
              t("gameBoard.noCategoryQuestion")
            );
          }

          setQuestions(questions);

          // Rastgele bir soru seç
          const selectedQuestion = selectRandomQuestion(questions);
          if (selectedQuestion) {
            dispatch({
              type: "SET_QUESTION",
              payload: {
                ...selectedQuestion,
                category: selectedCategory,
                language: language,
              },
            });
          }
        } catch (error) {
          console.error("Sorular yüklenirken hata oluştu:", error);
          toast({
            title: t("gameBoard.error"),
            description: t("gameBoard.questionLoadError"),
            variant: "destructive",
          });
        }
      }
    };

    loadQuestions();
  }, [selectedCategory, language]);

  // Joker kullanıldığında yeni soru seç
  useEffect(() => {
    if (state.joker && currentQuestion && !jokerUsed) {
      setJokerUsed(true);
      const selectedQuestion = selectRandomQuestion(
        questions,
        currentQuestion.id
      );
      if (selectedQuestion) {
        dispatch({
          type: "SET_QUESTION",
          payload: {
            ...selectedQuestion,
            id: selectedQuestion.id,
            category: currentQuestion.category,
            language: language,
          },
        });
      }
    } else if (!state.joker) {
      setJokerUsed(false);
    }
  }, [state.joker, currentQuestion?.id]);

  const getRandomCategory = () => {
    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex];
  };

  const spinRandomCategory = () => {
    setIsSpinning(true);
    setShowQuestion(false);
    
    let spins = 0;
    const maxSpins = 15; // Toplam dönüş sayısı
    const spinInterval = 150; // Her dönüş arasındaki süre (ms)
    
    const spin = () => {
      const randomCategory = getRandomCategory();
      setHighlightedCategory(randomCategory.name);
      
      spins++;
      
      if (spins < maxSpins) {
        setTimeout(spin, spinInterval);
      } else {
        // Son kategori seçimi
        const finalCategory = getRandomCategory();
        setHighlightedCategory(finalCategory.name);
        setSelectedCategory(finalCategory.name);
        
        // 3 saniye sonra highlight'ı kaldır ve soruyu göster
        setTimeout(() => {
          setHighlightedCategory(null);
          setIsSpinning(false);
          setShowQuestion(true);
        }, 3000);
      }
    };
    
    spin();
  };

  if (!state.isGameStarted) {
    return null;
  }

  if (winner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 relative">
        {showWinnerModal && (
          <WinnerModal 
            winner={winner} 
            onClose={handleCloseWinnerModal} 
            language={language}
          />
        )}
       
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 relative overflow-x-hidden">
      {showWinnerModal && state.winner && (
        <WinnerModal 
          winner={state.winner} 
          onClose={handleCloseWinnerModal} 
          language={language}
        />
      )}
      {/* Oyun Alanı */}
      <img src="/logo.png" alt="Trivia Night" className="w-64 mb-12 mx-auto" />

      <div className="space-y-6">
        {/* Soru ve Cevap Alanı */}
        {!currentQuestion && (
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-bold text-white">{t("gameBoard.categorySelection")}</h2>
                <motion.div
                  className="grid grid-cols-3 gap-4 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {categories.map((category) => (
                    <motion.div
                      key={category.name}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-300",
                        highlightedCategory === category.name 
                          ? category.color
                          : "bg-gray-700",
                        highlightedCategory === category.name 
                          ? "ring-4 ring-white ring-opacity-50 scale-105" 
                          : "hover:opacity-90",
                        isSpinning && "cursor-not-allowed"
                      )}
                      onClick={() => !isSpinning && setSelectedCategory(category.name)}
                      whileHover={!isSpinning ? { scale: 1.05 } : {}}
                    >
                      <category.icon className={cn(
                        "w-6 h-6 mb-2",
                        highlightedCategory === category.name 
                          ? "text-white"
                          : "text-gray-300"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        highlightedCategory === category.name 
                          ? "text-white"
                          : "text-gray-300"
                      )}>
                        {t(`categories.${category.name}`)}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
                <Button
                  onClick={spinRandomCategory}
                  disabled={isSpinning}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSpinning ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                      {t("gameBoard.selecting")}
                    </>
                  ) : (
                    t("gameBoard.randomSelect")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentQuestion && (
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={cn(
                        "px-4 py-2 cursor-default",
                        categories.find(
                          (c) => c.name === currentQuestion.category
                        )?.color
                      )}
                    >
                      {t(`categories.${currentQuestion.category}`)}
                    </Badge>
                    <HandleChangeQuestionButton />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {currentQuestion.question}
                  </h2>
                  {showAnswer && (
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                      <p className="text-lg text-white">
                        {t("gameBoard.answer")}: {currentQuestion.answer}
                      </p>
                    </div>
                  )}
                </div>
                {!showAnswer ? (
                  <Button
                    onClick={() => setShowAnswer(true)}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {t("gameBoard.showAnswer")}
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => {
                        handleAnswer(true);
                        setShowAnswer(false);
                      }}
                      className="bg-green-500 hover:bg-green-600 flex-1"
                      size="lg"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      {t("gameBoard.correct")}
                    </Button>
                    <Button
                      onClick={() => {
                        handleAnswer(false);
                        setShowAnswer(false);
                      }}
                      className="bg-red-500 hover:bg-red-600 flex-1"
                      size="lg"
                    >
                      <XIcon className="w-5 h-5 mr-2" />
                      {t("gameBoard.wrong")}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gruplar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {groups.map((group, index) => (
            <Card 
              key={index} 
              className={cn(
                "bg-gray-800/30 border-gray-700 transition-all duration-300",
                currentGroupIndex === index && "ring-2 ring-primary"
              )}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white">{group.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            {group.players.map((player, idx) => (
                              <span key={player.id}>
                                {player.name}
                                {idx < group.players.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex  space-x-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "h-7 px-2.5 flex items-center justify-center",
                              "bg-green-500/10 text-green-500 border-green-500/20",
                              "font-medium"
                            )}
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            {group.correctAnswers || 0}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "h-7 px-2.5 flex items-center justify-center",
                              "bg-red-500/10 text-red-500 border-red-500/20",
                              "font-medium"
                            )}
                          >
                            <XIcon className="w-3.5 h-3.5 mr-1.5" />
                            {group.wrongAnswers || 0}
                          </Badge>
                          {group.jokers > 0 && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "h-7 px-2.5 flex items-center justify-center",
                                "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                "font-medium"
                              )}
                            >
                              <span className="text-base mr-1.5">★</span>
                              {group.jokers}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {categories.map((category) => {
                      const isEarned = group.badges.includes(category.name);
                      const Icon = category.icon;
                      return (
                        <div 
                          key={category.name}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                            isEarned ? category.color : "bg-gray-600/50",
                            "group hover:scale-110"
                          )}
                          title={t(`categories.${category.name}`)}
                        >
                          <Icon className={cn(
                            "w-5 h-5",
                            isEarned ? "text-white" : "text-gray-400",
                            "transition-colors duration-200"
                          )} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alt Butonlar */}
        <div className="fixed bottom-8 right-8">
          <Button
            onClick={endGame}
            className="bg-red-500 hover:bg-red-600 px-6 py-2 text-sm font-medium"
          >
            {t("gameBoard.endGame")}
          </Button>
        </div>

        <Toaster />
      </div>
    </div>
  );
};
