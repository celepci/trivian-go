import React, { useState, useEffect, useRef, useReducer } from "react";
import { useGame } from "../contexts/GameContext";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import {
  Scroll,
  Globe2,
  FlaskConical,
  Dumbbell,
  Paintbrush2,
  Popcorn as PopcornIcon,
  Check,
  X as XIcon,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";
import { Toaster } from "./ui/toaster";
import { Category, Language, Question } from "../types";
import { cn } from "../lib/utils";
import { WinnerModal } from "./WinnerModal";
import { useTranslation, SafeTranslationFunction } from "../hooks/use-translation";
import { reportQuestionError } from "../services/errorReportService";
import { sanitizeInput } from "../utils/security";
import { WheelOfCategories } from "./WheelOfCategories";

interface Settings {
  answerTime: string;
  showOptions: boolean;
  soundEnabled: boolean;
}

const defaultSettings: Settings = {
  answerTime: "30",
  showOptions: false,
  soundEnabled: true
};

const getSettings = (): Settings => {
  const settingsStr = localStorage.getItem('gameSettings');
  if (!settingsStr) {
    localStorage.setItem('gameSettings', JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  try {
    const settings = JSON.parse(settingsStr);
    return {
      answerTime: settings.answerTime || '30',
      showOptions: settings.showOptions ?? false,
      soundEnabled: settings.soundEnabled ?? true,
    };
  } catch {
    return defaultSettings;
  }
};

const categories = [
  {
    name: Category.HISTORY,
    color: "bg-yellow-600",
    icon: Scroll,
    file: "history",
  },
  {
    name: Category.GEOGRAPHY,
    color: "bg-blue-600",
    icon: Globe2,
    file: "geography",
  },
  {
    name: Category.SCIENCE,
    color: "bg-green-600",
    icon: FlaskConical,
    file: "science",
  },
  {
    name: Category.SPORTS,
    color: "bg-orange-600",
    icon: Dumbbell,
    file: "sports",
  },
  { name: Category.ART, color: "bg-red-600", icon: Paintbrush2, file: "art" },
  {
    name: Category.ENTERTAINMENT,
    color: "bg-pink-600",
    icon: PopcornIcon,
    file: "entertainment",
  },
];

interface HandleChangeQuestionButtonProps {
  onQuestionChange: () => void;
  hasJoker: boolean;
  selectedAnswer: string | null;
}

const HandleChangeQuestionButton: React.FC<HandleChangeQuestionButtonProps> = ({
  onQuestionChange,
  hasJoker,
  selectedAnswer,
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const safeT = t as SafeTranslationFunction;

  const handleChangeQuestion = () => {
    if (!hasJoker) {
      toast({
        title: safeT("gameBoard.noJoker", "No Joker Available"),
        className: "bg-red-500 border-red-500 text-white",
      });
      return;
    }
    onQuestionChange();
  };

  return (
    <Button
      variant="outline"
      onClick={handleChangeQuestion}
      disabled={!hasJoker || selectedAnswer !== null}
      className="w-32"
    >
      {safeT("gameBoard.changeQuestion", "Change Question")}
    </Button>
  );
};

export const GameBoard: React.FC = () => {
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const { t } = useTranslation();
  const safeT = t as SafeTranslationFunction;
  const [settings, setSettings] = useState<Settings>(getSettings());
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);
  const jokerSoundRef = useRef<HTMLAudioElement | null>(null);
  const winnerSoundRef = useRef<HTMLAudioElement | null>(null);

  // Ses dosyalarını yükle
  useEffect(() => {
    correctSoundRef.current = new Audio('/correct.mp3');
    wrongSoundRef.current = new Audio('/wrong.mp3');
    jokerSoundRef.current = new Audio('/joker.mp3');
    winnerSoundRef.current = new Audio('/winner.mp3');
  }, []);

  // Ayarlar değiştiğinde state'i güncelle
  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(getSettings());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showClassicAnswer, setShowClassicAnswer] = useState(false);
  const [newBadge, setNewBadge] = useState<Category | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorDescription, setErrorDescription] = useState("");
  const [isEndGameDialogOpen, setIsEndGameDialogOpen] = useState(false);

  useEffect(() => {
    // Eğer state'de selectedCategory varsa ve currentQuestion yoksa, o kategoriyi seç
    if (state.selectedCategory && !state.currentQuestion && !selectedCategory) {
      handleCategorySelect(state.selectedCategory as Category);
    }
  }, [state.selectedCategory, state.currentQuestion, selectedCategory]);

  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    setIsTimeUp(false);

    // Seçilen kategoriyi state'e kaydet
    dispatch({ type: "SET_SELECTED_CATEGORY", payload: category });

    try {
      // Dynamic import for JSON files
      const questionsModule = await import(
        `../questions/${state.language.toLowerCase()}/${category.toLowerCase()}.json`
      );
      const data = questionsModule.default;

      // Veriyi doğru tipte dönüştürelim
      const typedQuestions: Question[] = data.map((q: any) => ({
        id: q.id,
        question: q.question,
        category: category,
        language: state.language,
        options: q.options || null, // options varsa kullan, yoksa null olarak ayarla
        answer: q.answer,
      }));

      setQuestions(typedQuestions);
      const newQuestion = selectRandomQuestion(
        typedQuestions,
        state.currentQuestion?.id
      );

      if (newQuestion) {

        dispatch({
          type: "SET_QUESTION",
          payload: {
            ...newQuestion,
            category: category,
            language: state.language,
          },
        });

        // Soru yüklendikten sonra geri sayımı başlat
        dispatch({
          type: "SET_TIME_REMAINING",
          payload: parseInt(settings.answerTime),
        });

        // Soru yüklendikten sonra göster
        setTimeout(() => {
          setShowQuestion(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast({
        title: safeT("gameBoard.error", "Error"),
        description: safeT(
          "gameBoard.questionLoadError",
          "Error fetching questions: {0}",
          { 0: errorMessage }
        ),
        className: "bg-red-500 border-red-500 text-white",
      });
    }
  };

  const selectRandomQuestion = (
    questions: Question[],
    currentQuestionId?: string | number
  ) => {
    // Mevcut soruyu hariç tut
    const availableQuestions = currentQuestionId
      ? questions.filter((q) => q.id !== currentQuestionId)
      : questions;

    if (availableQuestions.length === 0) {
      toast({
        title: safeT("gameBoard.error", "Error"),
        description: safeT(
          "gameBoard.noCategoryQuestion",
          "No more questions in this category."
        ),
        className: "bg-red-500 border-red-500 text-white",
      });
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  };

  // const handleAnswerQuestion = (answer: string) => {
  //   if (!state.currentQuestion) return;

  //   const isCorrect = answer === state.currentQuestion.answer;
  //   dispatch({
  //     type: "ANSWER_QUESTION",
  //     payload: { correct: isCorrect, category: state.currentQuestion.category },
  //   });

  //   // Cevabı göster ve sonraki gruba geç
  //   setShowAnswer(true);
  //   setSelectedAnswer(answer);

  //   setTimeout(() => {
  //     setShowAnswer(false);
  //     setSelectedAnswer(null);
  //     setSelectedCategory(null);

  //   }, 2000);
  // };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    setShowAnswer(true);
  };

  const loadNewQuestion = async () => {
    if (selectedCategory) {
      try {
        // Mevcut kategoriyi loglayalım
        console.log("Soru seçerken kullanılan kategori:", selectedCategory);
        
        const questionsModule = await import(
          `../questions/${state.language.toLowerCase()}/${selectedCategory.toLowerCase()}.json`
        );
        const categoryQuestions: Question[] = questionsModule.default;

        // Mevcut grup için cevaplanmış soruları filtrele
        const currentGroup = state.groups[state.currentGroupIndex];
        const answeredQuestionIds =
          currentGroup.answeredQuestions?.map((q) => q.id) || [];

        // Sadece mevcut grubun cevaplamadığı soruları filtrele
        const availableQuestions = categoryQuestions.filter(
          (q) => !answeredQuestionIds.includes(q.id)
        );

        if (availableQuestions.length === 0) {
          toast({
            title: safeT("gameBoard.error", "Error"),
            description: safeT(
              "gameBoard.noCategoryQuestion",
              "No more questions in this category."
            ),
            className: "bg-red-500 border-red-500 text-white",
          });
          return;
        }

        // Rastgele bir soru seç
        const randomIndex = Math.floor(
          Math.random() * availableQuestions.length
        );
        const newQuestion = availableQuestions[randomIndex];

        // Soruyu ayarla ve kategoriyi mutlaka belirt
        dispatch({ 
          type: "SET_QUESTION", 
          payload: {
            ...newQuestion,
            category: selectedCategory,
            language: state.language
          }
        });

        // Zamanlayıcıyı sıfırla
        dispatch({
          type: "SET_TIME_REMAINING",
          payload: parseInt(settings.answerTime),
        });

        // UI durumunu sıfırla
        setShowAnswer(false);
        setIsTimeUp(false);
      } catch (error) {
        console.error("Error loading questions:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast({
          title: safeT("gameBoard.error", "Error"),
          description: safeT(
            "gameBoard.questionLoadError",
            "Error fetching questions: {0}",
            { 0: errorMessage }
          ),
          className: "bg-red-500 border-red-500 text-white",
        });
      }
    }
  };

  const handleCloseWinnerModal = () => {
    setShowWinnerModal(false);
    window.location.reload();
  };

  // Hata bildirim fonksiyonu
  const handleErrorReport = async () => {
    if (state.currentQuestion) {
      try {
        // Hata bildirimini Firebase'e kaydet
        const reportId = await reportQuestionError(
          state.currentQuestion, 
          errorDescription
        );
        
        if (reportId) {
          toast({
            title: safeT("gameBoard.reportError", "Hata Bildirildi"),
            description: safeT(
              "gameBoard.reportErrorDescription",
              "Bu soru için hata bildiriminiz alındı. Teşekkür ederiz!"
            ),
            className: "bg-green-500 border-green-500 text-white",
          });
        } else {
          toast({
            title: safeT("gameBoard.error", "Hata"),
            description: safeT(
              "gameBoard.errorReportFailed",
              "Hata bildirimi kaydedilemedi. Lütfen daha sonra tekrar deneyin."
            ),
            className: "bg-red-500 border-red-500 text-white",
          });
        }
        
        // Dialog'u kapat ve açıklamayı temizle
        setIsErrorDialogOpen(false);
        setErrorDescription("");
      } catch (error) {
        console.error("Hata bildirimi gönderilirken bir hata oluştu:", error);
        toast({
          title: safeT("gameBoard.error", "Hata"),
          description: safeT(
            "gameBoard.errorReportFailed",
            "Hata bildirimi kaydedilemedi. Lütfen daha sonra tekrar deneyin."
          ),
          className: "bg-red-500 border-red-500 text-white",
        });
      }
    }
  };

  useEffect(() => {
    if (state.currentQuestion) {
      setIsTimeUp(false);
      dispatch({
        type: "SET_TIME_REMAINING",
        payload: parseInt(settings.answerTime),
      });
    }
  }, [state.currentQuestion, settings.answerTime]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.currentQuestion && state.timeRemaining > 0 && !showAnswer) {
      timer = setInterval(() => {
        dispatch({
          type: "SET_TIME_REMAINING",
          payload: state.timeRemaining - 1,
        });
        if (state.timeRemaining === 1) {
          setIsTimeUp(true);
          toast({
            title: safeT("gameBoard.timeUp", "Time Up"),
            className: "bg-red-500 border-red-500 text-white",
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.currentQuestion, state.timeRemaining, showAnswer]);

  const useJoker = () => {
    // Eğer mevcut soru yoksa veya kullanıcı zaten cevaplamışsa işlem yapma
    if (!state.currentQuestion || selectedAnswer) {
      toast({
        title: safeT("gameBoard.error", "Error"),
        description: safeT(
          "gameBoard.invalidJokerUse",
          "You cannot use joker now."
        ),
        className: "bg-red-500 border-red-500 text-white",
      });
      return;
    }

    // Doğrudan state'ten güncel groups ve currentGroupIndex değerlerini kullan
    const currentGroup = state.groups[state.currentGroupIndex];

    if (currentGroup.jokers > 0) {
      // Kategoriyi joker kullanımıyla kaybetmemek için current question'dan alalım
      const currentCategory = state.currentQuestion.category;
      console.log("Joker kullanılıyor. Mevcut kategori:", currentCategory);
      
      // Joker kullanımını dispatch et
      dispatch({
        type: "USE_JOKER",
        payload: currentGroup.id,
      });

      // Joker kullanıldığında ses çal
      if (settings.soundEnabled && jokerSoundRef.current) {
        jokerSoundRef.current.currentTime = 0;
        jokerSoundRef.current.play().catch(err => console.error("Joker sesi çalınamadı:", err));
      }

      toast({
        title: safeT("gameBoard.questionChanged", "Question Changed"),
        description: safeT(
          "gameBoard.jokerUsedDescription",
          `${currentGroup.name} used a joker to change the question.`
        ),
        className: "bg-blue-500 border-blue-500 text-white",
      });
      
      // Eğer şu an bir kategori seçilmemişse state'ten kategoriyi ayarlayalım
      if (!selectedCategory && currentCategory) {
        console.log("Kategori state'e eklenecek:", currentCategory);
        setSelectedCategory(currentCategory);
        
        // Diğer state değişkenlerini sıfırla
        setSelectedAnswer(null);
        setShowAnswer(false);
      }
      
      loadNewQuestion();
    } else {
      toast({
        title: safeT("gameBoard.noJoker", "No Joker Available"),
        description: safeT(
          "gameBoard.noJokerDescription",
          "This group has no jokers left."
        ),
        className: "bg-red-500 border-red-500 text-white",
      });
    }
  };

  useEffect(() => {
    const winnerListener = (event: CustomEvent) => {
      // Kazananı ayarla
      dispatch({
        type: "SET_WINNER",
        payload: event.detail
      });
      
      // Kazanan modalını göster
      setShowWinnerModal(true);

      // Kazanan sesi çal
      if (settings.soundEnabled && winnerSoundRef.current) {
        winnerSoundRef.current.currentTime = 0;
        winnerSoundRef.current.play().catch(err => console.error("Kazanan sesi çalınamadı:", err));
      }
    };

    // Kazanan olayını dinle
    window.addEventListener('gameWinner', winnerListener as EventListener);
    
    return () => {
      window.removeEventListener('gameWinner', winnerListener as EventListener);
    };
  }, [dispatch, settings.soundEnabled]);

  // Oyunu bitir butonu için onay ekranı
  const confirmEndGame = () => {
    setIsEndGameDialogOpen(true);
  };

  // Oyunu gerçekten sonlandır
  const handleEndGame = () => {
    dispatch({ type: "END_GAME" });
    setIsEndGameDialogOpen(false);
  };

  // Oyun başlamadıysa gösterme
  if (!state.isGameStarted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 relative overflow-x-hidden">
        {showWinnerModal && state.winner && (
        <WinnerModal
          winner={state.winner}
          onClose={handleCloseWinnerModal}
          language={state.language}
        />
      )}
      {/* Oyun Alanı */}
      {/* <img src="/logo.png" alt="Trivia Night" className="w-64 mb-12 mx-auto" /> */}

      <div className="space-y-6">
        {/* Soru ve Cevap Alanı */}
        {/* <code>{JSON.stringify(state)}</code> */}
        {!state.currentQuestion && (
          <WheelOfCategories onSelectCategory={handleCategorySelect} />
        )}

        {state.currentQuestion && (
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-3 py-1 text-md",
                          selectedCategory === Category.HISTORY
                            ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                            : selectedCategory === Category.GEOGRAPHY
                            ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                            : selectedCategory === Category.SCIENCE
                            ? "bg-green-500/20 text-green-500 border-green-500/30"
                            : selectedCategory === Category.SPORTS
                            ? "bg-orange-500/20 text-orange-500 border-orange-500/30"
                            : selectedCategory === Category.ART
                            ? "bg-red-500/20 text-red-500 border-red-500/30"
                            : selectedCategory === Category.ENTERTAINMENT
                            ? "bg-pink-500/20 text-pink-500 border-pink-500/30"
                            : "bg-gray-500/20 text-gray-500 border-gray-500/30"
                        )}
                      >
                        {selectedCategory &&
                          safeT(
                            `categories.${selectedCategory.toLowerCase()}`,
                            selectedCategory.toLowerCase()
                          )}
                      </Badge>
                      {state.timeRemaining !== null && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full border-2 w-9 h-9 flex items-center justify-center text-md font-bold",
                            state.timeRemaining > 10
                              ? "bg-green-500/20 text-green-600 border-green-600"
                              : state.timeRemaining > 5
                              ? "bg-amber-500/20 text-amber-600 border-amber-600"
                              : "bg-red-500/20 text-red-600 border-red-600"
                          )}
                        >
                          {state.timeRemaining}
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => {
                          if (state.currentQuestion) {
                            // Hata bildirimini aç
                            setIsErrorDialogOpen(true);
                          } else {
                            toast({
                              title: safeT("gameBoard.error", "Hata"),
                              description: safeT(
                                "gameBoard.noQuestionSelected",
                                "Bildirilecek bir soru bulunamadı."
                              ),
                              className: "bg-red-500 border-red-500 text-white",
                            });
                          }
                        }}
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {safeT("gameBoard.reportError", "Hata Bildir")}
                      </Button>
                    </div>
                    <HandleChangeQuestionButton
                      onQuestionChange={useJoker}
                      hasJoker={
                        state.currentGroupIndex >= 0 &&
                        state.groups.length > 0 &&
                        state.groups[state.currentGroupIndex]?.jokers > 0
                      }
                      selectedAnswer={selectedAnswer}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {state.currentQuestion.question}
                  </h2>
                  {isTimeUp && (
                    <p className="text-red-400">
                      {safeT(
                        "gameBoard.timeUpMessage",
                        "Time Up! Please answer"
                      )}
                    </p>
                  )}
                  {settings.showOptions && state.currentQuestion?.options && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {Object.entries(state.currentQuestion.options).map(
                          ([key, value]) => (
                            <button
                              key={key}
                              onClick={() => {
                                if (selectedAnswer !== null) return;

                                // Cevabı seç
                                const isCorrect = key === state.currentQuestion?.answer;
                                const questionCategory = state.currentQuestion?.category || Category.HISTORY;
                                
                                setSelectedAnswer(key);
                                setShowAnswer(true);

                                // Doğru/yanlış ses çal
                                if (settings.soundEnabled) {
                                  if (isCorrect && correctSoundRef.current) {
                                    correctSoundRef.current.currentTime = 0;
                                    correctSoundRef.current.play().catch(err => console.error("Doğru cevap sesi çalınamadı:", err));
                                  } else if (!isCorrect && wrongSoundRef.current) {
                                    wrongSoundRef.current.currentTime = 0;
                                    wrongSoundRef.current.play().catch(err => console.error("Yanlış cevap sesi çalınamadı:", err));
                                  }
                                }

                                // Doğru cevap verildiyse ve kategori rozeti kazanıldıysa, yeni rozeti ayarla
                                if (isCorrect) {
                                  const currentGroup = state.groups[state.currentGroupIndex];

                                  // Eğer bu rozet daha önce kazanılmadıysa
                                  if (!currentGroup.badges.includes(questionCategory)) {
                                    setNewBadge(questionCategory);
                                    // 2 saniye sonra animasyonu kaldır
                                    setTimeout(() => {
                                      setNewBadge(null);
                                    }, 2000);
                                  }
                                }
                                
                                dispatch({
                                  type: "UPDATE_BADGES",
                                  payload: {
                                    correct: isCorrect,
                                    category: questionCategory,
                                  },
                                });
                                // 3 saniye sonra çarka dön
                                setTimeout(() => {
                                  // ANSWER_QUESTION dispatch et (klasik sorudaki gibi)
                                  dispatch({
                                    type: "ANSWER_QUESTION",
                                    payload: {
                                      correct: isCorrect,
                                      category: questionCategory,
                                    },
                                  });

                                  setShowAnswer(false);
                                  setSelectedAnswer(null);
                                  setSelectedCategory(null);

                                  // Çarka dönüş için mevcut soruyu kaldır
                                  dispatch({
                                    type: "RESET_QUESTION",
                                  });
                                  dispatch({
                                    type: "SET_SELECTED_CATEGORY",
                                    payload: null
                                  });
                                }, 3000);
                              }}
                              disabled={selectedAnswer !== null}
                              className={cn(
                                "p-4 rounded-lg text-left transition-all",
                                selectedAnswer === null
                                  ? "bg-gray-700/50 hover:bg-gray-700/70"
                                  : selectedAnswer === key &&
                                    key === state.currentQuestion?.answer
                                  ? "bg-green-700 text-white"
                                  : selectedAnswer === key
                                  ? "bg-red-700 text-white"
                                  : key === state.currentQuestion?.answer
                                  ? "bg-green-700 text-white"
                                  : "bg-gray-700/50",
                                "disabled:cursor-not-allowed"
                              )}
                            >
                              <span className="font-semibold">
                                {key.toUpperCase()})
                              </span>{" "}
                              {/* Kullanıcı girdisini temizle */}
                              <span dangerouslySetInnerHTML={{ __html: sanitizeInput(value) }} />
                            </button>
                          )
                        )}
                      </div>
                    </>
                  )}
                  {(!settings.showOptions ||
                    !state.currentQuestion?.options) && (
                    <div className="flex flex-col items-center justify-center mt-8">
                      {!showClassicAnswer ? (
                        <Button
                          variant="default"
                          onClick={() => setShowClassicAnswer(true)}
                          className="w-64 h-12 text-lg bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                        >
                          {safeT("gameBoard.showAnswer", "Cevabı Göster")}
                        </Button>
                      ) : (
                        <>
                          <div className="mb-6 text-center p-4 bg-gray-700/50 rounded-lg w-full">
                            <h3 className="text-xl font-semibold mb-2 text-gray-300">
                              {safeT("gameBoard.answer", "Cevap")}:
                            </h3>
                            <p className="text-2xl text-white font-bold">
                              {state.currentQuestion?.options 
                                ? state.currentQuestion.options[state.currentQuestion.answer as keyof typeof state.currentQuestion.options]
                                : state.currentQuestion?.answer}
                            </p>
                          </div>
                          <div className="flex items-center justify-center space-x-4 w-full">
                            <Button
                              variant="default"
                              onClick={() => {
                                if (state.currentQuestion !== null) {
                                  // Değişkeni şimdi sakla, setTimeout içinde kullanmak için
                                  const questionCategory = state.currentQuestion.category;
                                  if (settings.soundEnabled && correctSoundRef.current) {
                                    correctSoundRef.current.currentTime = 0;
                                    correctSoundRef.current.play().catch(err => console.error("Ses çalınamadı:", err));
                                  }
                                  dispatch({
                                    type: "ANSWER_QUESTION",
                                    payload: {
                                      correct: true,
                                      category: questionCategory,
                                    },
                                  });
                                 
                                  // 3 saniye sonra çarka dön
                                  setTimeout(() => {
                                    setShowClassicAnswer(false);
                                    dispatch({
                                      type: "RESET_QUESTION",
                                    });
                                    dispatch({
                                      type: "SET_SELECTED_CATEGORY",
                                      payload: null
                                    });
                                  }, 2000);
                                }
                              }}
                              className="w-full h-16 text-lg bg-green-500 hover:bg-green-600 text-white border-green-500"
                            >
                              {safeT("gameBoard.correct", "Doğru")}
                            </Button>
                            <Button
                              variant="default"
                              onClick={() => {
                                if (state.currentQuestion) {
                                  // Değişkeni şimdi sakla, setTimeout içinde kullanmak için
                                  const questionCategory = state.currentQuestion.category;
                                  
                                  dispatch({
                                    type: "ANSWER_QUESTION",
                                    payload: {
                                      correct: false,
                                      category: questionCategory,
                                    },
                                  });

                                  if (settings.soundEnabled && wrongSoundRef.current) {
                                    wrongSoundRef.current.currentTime = 0;
                                    wrongSoundRef.current.play().catch(err => console.error("Ses çalınamadı:", err));
                                  }

                                  // 3 saniye sonra çarka dön
                                  setTimeout(() => {
                                    setShowClassicAnswer(false);
                                    dispatch({
                                      type: "RESET_QUESTION",
                                    });
                                    dispatch({
                                      type: "SET_SELECTED_CATEGORY",
                                      payload: null
                                    });
                                  }, 2000);
                                }
                              }}
                              className="w-full h-16 text-lg bg-red-500 hover:bg-red-600 text-white border-red-500"
                            >
                              {safeT("gameBoard.wrong", "Yanlış")}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gruplar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {state.groups.map((group, index) => (
            <Card
              key={index}
              className={cn(
                "bg-gray-800/30 border-gray-700 transition-all duration-300",
                state.currentGroupIndex === index && "ring-2 ring-primary"
              )}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white">
                            {group.name}
                          </h3>
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
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-700",
                            isEarned ? category.color : "bg-gray-600/50",
                            "group hover:scale-110",
                            newBadge === category.name && isEarned ? "animate-pulse scale-125" : ""
                          )}
                          title={category.name}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              isEarned ? "text-white" : "text-gray-400",
                              "transition-colors duration-200"
                            )}
                          />
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
            onClick={confirmEndGame}
            className="bg-red-500 hover:bg-red-600 px-6 py-2 text-sm font-medium"
          >
            {safeT("gameBoard.endGame")}
          </Button>
        </div>

        <Toaster />
        
        {/* Hata Bildirim Dialog'u */}
        <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle>{safeT("gameBoard.reportError", "Hata Bildir")}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {state.currentQuestion && (
                  <>
                    {safeT(
                      "gameBoard.reportErrorDialogDescription",
                      "Şu numaralı soru için hata bildiriyorsunuz: {0}",
                      { 0: `${state.currentQuestion.question}` }
                    )}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Textarea
                placeholder={safeT(
                  "gameBoard.errorDescriptionPlaceholder",
                  "Lütfen hatayı açıklayın..."
                )}
                className="min-h-[120px]"
                value={errorDescription}
                onChange={(e) => setErrorDescription(e.target.value)}
              />
            </div>
            
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-gray-300 bg-gray-700 hover:bg-gray-600"
                >
                  {safeT("gameBoard.cancel", "İptal")}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleErrorReport}
                disabled={!errorDescription.trim()}
              >
                {safeT("gameBoard.send", "Gönder")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Oyunu Bitir Onay Dialog'u */}
        <Dialog open={isEndGameDialogOpen} onOpenChange={setIsEndGameDialogOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle>{safeT("gameBoard.confirmEndGame", "Oyunu Bitir")}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {safeT(
                  "gameBoard.confirmEndGameDescription",
                  "Oyunu bitirmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                )}
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="sm:justify-end mt-4">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-gray-300 bg-gray-700 hover:bg-gray-600"
                >
                  {safeT("gameBoard.cancel", "İptal")}
                </Button>
              </DialogClose>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleEndGame}
              >
                {safeT("gameBoard.confirmEnd", "Evet, Oyunu Bitir")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
