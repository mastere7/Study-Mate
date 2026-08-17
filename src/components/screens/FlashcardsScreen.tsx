import React, { useState, useEffect } from "react";
import {
  Layers,
  Sparkles,
  Plus,
  RotateCw,
  Check,
  ChevronLeft,
  ChevronRight,
  Brain,
  Award,
  BookOpen,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  HelpCircle,
  Download,
  FileDown,
  Trophy,
  Flame,
  Target,
  Zap,
  RotateCcw,
  Shuffle,
  BarChart2,
  CheckCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { FlashcardDeck, Flashcard, Subject, User } from "../../types";
import { apiService } from "../../services/api";
import { exportService } from "../../services/exportService";
import { audioSynth } from "../../services/audioSynth";
import { storageService } from "../../services/storage";

interface FlashcardsScreenProps {
  decks: FlashcardDeck[];
  subjects: Subject[];
  onSaveDecks: (decks: FlashcardDeck[]) => void;
  user?: User;
  onUpdateUser?: (user: User) => void;
  initialTopic?: string;
  initialText?: string;
}

interface CardReviewStatus {
  cardId: string;
  status: "correct" | "partial" | "incorrect" | "easy" | "medium" | "hard";
  pointsAwarded: number;
  scoreMatch?: number;
}

export const FlashcardsScreen: React.FC<FlashcardsScreenProps> = ({
  decks,
  subjects,
  onSaveDecks,
  user,
  onUpdateUser,
  initialTopic = "",
  initialText = "",
}) => {
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(
    decks.length > 0 ? decks[0] : null
  );

  // Practice state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Gamification & Points State
  const [sessionPoints, setSessionPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [cardReviewStatuses, setCardReviewStatuses] = useState<Record<string, CardReviewStatus>>({});
  const [pointsNotification, setPointsNotification] = useState<{
    points: number;
    reason: string;
    id: number;
  } | null>(null);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);

  // Answer Submission & Verification State
  const [userAnswer, setUserAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<{
    isChecked: boolean;
    isCorrect: boolean;
    isPartial: boolean;
    score: number;
    expectedAnswer: string;
    submittedAnswer: string;
  } | null>(null);

  // Deck Builder State
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [deckTitle, setDeckTitle] = useState(initialTopic || "");
  const [deckSourceText, setDeckSourceText] = useState(initialText || "");
  const [deckSubjectId, setDeckSubjectId] = useState(subjects[0]?.id || "");

  // Update active deck if initial decks change or on initial mount
  useEffect(() => {
    if (!activeDeck && decks.length > 0) {
      setActiveDeck(decks[0]);
    }
  }, [decks, activeDeck]);

  // Award Points Helper
  const awardPoints = (points: number, reason: string, isSuccessful: boolean) => {
    if (points <= 0) return;

    setSessionPoints((prev) => prev + points);

    // Update Streak
    if (isSuccessful) {
      setCurrentStreak((prev) => {
        const next = prev + 1;
        setBestStreak((b) => Math.max(b, next));
        // Streak milestones sound and confetti
        if (next === 3 || next === 5 || next === 10) {
          confetti({
            particleCount: 50 + next * 5,
            spread: 60,
            origin: { y: 0.6 },
          });
          audioSynth.playChime("success");
        }
        return next;
      });
      audioSynth.playChime("success");
    } else {
      setCurrentStreak(0);
      audioSynth.playChime("ping");
    }

    // Floating Points Notification Popup
    const notifId = Date.now();
    setPointsNotification({ points, reason, id: notifId });
    setTimeout(() => {
      setPointsNotification((curr) => (curr?.id === notifId ? null : curr));
    }, 2400);

    // Update Persistent User Points if available
    if (user && onUpdateUser) {
      const updatedUser: User = {
        ...user,
        totalPoints: (user.totalPoints || 0) + points,
      };
      onUpdateUser(updatedUser);
      storageService.saveUser(updatedUser);
    }
  };

  // Export Handlers
  const handleExportDeckMD = (deckToExport: FlashcardDeck) => {
    const subName = subjects.find((s) => s.id === deckToExport.subjectId)?.name;
    exportService.exportDeckToMarkdown(deckToExport, subName);
  };

  const handleExportDeckPDF = (deckToExport: FlashcardDeck) => {
    const subName = subjects.find((s) => s.id === deckToExport.subjectId)?.name;
    exportService.exportDeckToPDF(deckToExport, subName);
  };

  // Reset answer states on card change
  const resetCardAnswerState = () => {
    setUserAnswer("");
    setAnswerResult(null);
    setIsFlipped(false);
  };

  // Switch Active Deck
  const handleSelectDeck = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setCurrentCardIdx(0);
    resetCardAnswerState();
    setSessionPoints(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setCardReviewStatuses({});
    setShowCompletionSummary(false);
  };

  // Navigate to Next Card
  const handleNextCard = () => {
    if (!activeDeck || activeDeck.cards.length === 0) return;
    resetCardAnswerState();

    if (currentCardIdx === activeDeck.cards.length - 1) {
      // Reached the end of the deck
      setShowCompletionSummary(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
      audioSynth.playChime("success");
    } else {
      setCurrentCardIdx((prev) => prev + 1);
    }
  };

  // Navigate to Previous Card
  const handlePrevCard = () => {
    if (!activeDeck || activeDeck.cards.length === 0) return;
    resetCardAnswerState();
    setCurrentCardIdx((prev) => Math.max(0, prev - 1));
  };

  // Jump to specific card index
  const handleJumpToCard = (idx: number) => {
    if (!activeDeck || idx < 0 || idx >= activeDeck.cards.length) return;
    resetCardAnswerState();
    setCurrentCardIdx(idx);
    setShowCompletionSummary(false);
  };

  // Flip card
  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // Compare and evaluate typed answer
  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeDeck) return;
    const currentCard = activeDeck.cards[currentCardIdx];
    if (!currentCard || !userAnswer.trim()) return;

    const cleanInput = userAnswer.trim().toLowerCase();
    const cleanExpected = currentCard.back.trim().toLowerCase();

    // Calculate similarity score
    let score = 0;
    if (cleanInput === cleanExpected) {
      score = 100;
    } else {
      const inputWords = cleanInput.replace(/[^\w\s]/gi, "").split(/\s+/).filter(Boolean);
      const expectedWords = cleanExpected.replace(/[^\w\s]/gi, "").split(/\s+/).filter(Boolean);

      let matchCount = 0;
      inputWords.forEach((word) => {
        if (expectedWords.includes(word) && word.length > 2) {
          matchCount++;
        }
      });

      if (expectedWords.length > 0) {
        score = Math.min(100, Math.round((matchCount / Math.max(inputWords.length, expectedWords.length)) * 100));
      }

      // Direct substring match boost
      if (cleanExpected.includes(cleanInput) || cleanInput.includes(cleanExpected)) {
        score = Math.max(score, 75);
      }
    }

    const isCorrect = score >= 65;
    const isPartial = !isCorrect && score >= 35;

    setAnswerResult({
      isChecked: true,
      isCorrect,
      isPartial,
      score,
      expectedAnswer: currentCard.back,
      submittedAnswer: userAnswer.trim(),
    });

    setIsFlipped(true);

    // Calculate Points Reward
    let pointsAwarded = 0;
    let status: CardReviewStatus["status"] = "incorrect";

    // Streak Multiplier bonus
    const streakBonus = currentStreak >= 5 ? 10 : currentStreak >= 3 ? 5 : 0;

    if (score >= 90) {
      pointsAwarded = 25 + streakBonus;
      status = "correct";
      awardPoints(pointsAwarded, streakBonus > 0 ? `+${pointsAwarded} pts! (Exact Match + Streak 🔥)` : `+${pointsAwarded} pts! Perfect Recall 🎯`, true);
    } else if (isCorrect) {
      pointsAwarded = 18 + streakBonus;
      status = "correct";
      awardPoints(pointsAwarded, `+${pointsAwarded} pts! Great Answer ✅`, true);
    } else if (isPartial) {
      pointsAwarded = 8;
      status = "partial";
      awardPoints(pointsAwarded, `+${pointsAwarded} pts! Close Recall 💡`, false);
    } else {
      pointsAwarded = 3;
      status = "incorrect";
      awardPoints(pointsAwarded, `+${pointsAwarded} pts! Practice Effort 📚`, false);
    }

    // Record review result
    setCardReviewStatuses((prev) => ({
      ...prev,
      [currentCard.id]: {
        cardId: currentCard.id,
        status,
        pointsAwarded,
        scoreMatch: score,
      },
    }));
  };

  // Self-grade adjustment
  const handleSelfGradeCorrect = () => {
    if (!activeDeck || !answerResult) return;
    const currentCard = activeDeck.cards[currentCardIdx];
    if (!currentCard) return;

    setAnswerResult({
      ...answerResult,
      isCorrect: true,
      isPartial: false,
      score: 100,
    });

    const bonusPoints = 15;
    awardPoints(bonusPoints, `+${bonusPoints} pts! Self-Graded Correct ✨`, true);

    setCardReviewStatuses((prev) => ({
      ...prev,
      [currentCard.id]: {
        cardId: currentCard.id,
        status: "correct",
        pointsAwarded: (prev[currentCard.id]?.pointsAwarded || 0) + bonusPoints,
        scoreMatch: 100,
      },
    }));
  };

  // Spaced Repetition Rating
  const handleRateCard = (rating: "easy" | "medium" | "hard") => {
    if (!activeDeck) return;

    const currentCard = activeDeck.cards[currentCardIdx];
    if (!currentCard) return;

    const updatedCards = [...activeDeck.cards];
    updatedCards[currentCardIdx] = {
      ...currentCard,
      rating,
      intervalDays: rating === "easy" ? 7 : rating === "medium" ? 3 : 1,
    };

    const updatedDeck: FlashcardDeck = {
      ...activeDeck,
      cards: updatedCards,
      lastStudied: new Date().toISOString(),
    };

    const updatedDecks = decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d));
    onSaveDecks(updatedDecks);
    setActiveDeck(updatedDeck);

    // Award Points based on recall difficulty if not already heavily rewarded via typed answer
    let pts = 0;
    const isSuccess = rating !== "hard";
    if (rating === "easy") {
      pts = 20;
      awardPoints(pts, `+${pts} pts! Mastered (Easy) 🌟`, true);
    } else if (rating === "medium") {
      pts = 12;
      awardPoints(pts, `+${pts} pts! Good Recall (Medium) 👍`, true);
    } else {
      pts = 5;
      awardPoints(pts, `+${pts} pts! Queued for Review (Hard) 🔄`, false);
    }

    setCardReviewStatuses((prev) => ({
      ...prev,
      [currentCard.id]: {
        cardId: currentCard.id,
        status: rating,
        pointsAwarded: (prev[currentCard.id]?.pointsAwarded || 0) + pts,
      },
    }));

    // Advance to next card
    handleNextCard();
  };

  // Restart Active Deck
  const handleRestartDeck = () => {
    setCurrentCardIdx(0);
    resetCardAnswerState();
    setSessionPoints(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setCardReviewStatuses({});
    setShowCompletionSummary(false);
  };

  // Shuffle & Practice Deck
  const handleShuffleDeck = () => {
    if (!activeDeck) return;
    const shuffledCards = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    const shuffledDeck: FlashcardDeck = {
      ...activeDeck,
      cards: shuffledCards,
    };
    setActiveDeck(shuffledDeck);
    handleRestartDeck();
  };

  // Generate Deck with AI
  const handleGenerateAiDeck = async () => {
    if (!deckTitle.trim()) return;
    setIsGenerating(true);
    try {
      const res = await apiService.generateFlashcards(
        deckTitle,
        deckSourceText,
        8,
        subjects.find((s) => s.id === deckSubjectId)?.name
      );

      const newDeck: FlashcardDeck = {
        id: `deck_${Date.now()}`,
        userId: "u_student_1",
        subjectId: deckSubjectId,
        title: res.title || `Flashcards: ${deckTitle}`,
        description: `AI Generated high-yield active recall flashcard deck`,
        totalCards: res.cards?.length || 5,
        cards: (res.cards || []).map((c: any, idx: number) => ({
          id: `fc_${Date.now()}_${idx}`,
          front: c.front,
          back: c.back,
          tags: c.tags || [deckTitle],
        })),
        lastStudied: new Date().toISOString(),
      };

      const updated = [newDeck, ...decks];
      onSaveDecks(updated);
      handleSelectDeck(newDeck);
      setShowBuilderModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteDeck = (id: string) => {
    const updated = decks.filter((d) => d.id !== id);
    onSaveDecks(updated);
    if (activeDeck?.id === id) {
      setActiveDeck(updated.length > 0 ? updated[0] : null);
      setCurrentCardIdx(0);
      resetCardAnswerState();
      setSessionPoints(0);
      setCardReviewStatuses({});
      setShowCompletionSummary(false);
    }
  };

  // Review Progress Calculations
  const totalCards = activeDeck?.cards.length || 0;
  const reviewsList: CardReviewStatus[] = Object.values(cardReviewStatuses);
  const reviewedCount = reviewsList.length;
  const progressPercent = totalCards > 0 ? Math.round(((currentCardIdx + 1) / totalCards) * 100) : 0;
  const correctReviews = reviewsList.filter(
    (s) => s.status === "correct" || s.status === "easy"
  ).length;
  const accuracyPercent = reviewedCount > 0 ? Math.round((correctReviews / reviewedCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-500" />
            <span>Spaced Repetition Flashcards</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active recall flashcards with gamified points scoring and Leitner interval scheduling
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Lifetime / Profile Points Counter */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-xs shadow-xs">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Total XP: {user?.totalPoints || 0} pts</span>
          </div>

          <button
            onClick={() => setShowBuilderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>+ Generate AI Deck</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Deck Library vs Active Practice Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deck Selector */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Flashcard Decks ({decks.length})
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {decks.reduce((acc, d) => acc + d.cards.length, 0)} Total Cards
              </span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {decks.length === 0 ? (
                <div className="text-center py-8 px-4 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">
                    No flashcard decks yet. Create your first custom deck or generate one using AI!
                  </p>
                </div>
              ) : (
                decks.map((deck) => {
                  const subject = subjects.find((s) => s.id === deck.subjectId);
                  const isSelected = activeDeck?.id === deck.id;
                  return (
                    <div
                      key={deck.id}
                      onClick={() => handleSelectDeck(deck)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs"
                          : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-1 truncate pr-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${subject?.color || "bg-indigo-500 text-white"}`}>
                          {subject?.name || "General"}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {deck.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{deck.cards.length} Cards</span>
                          {deck.lastStudied && <span>• Studied {new Date(deck.lastStudied).toLocaleDateString()}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Export PDF Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportDeckPDF(deck);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Export Deck as PDF Worksheet"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Export Markdown Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportDeckMD(deck);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Export Deck as Markdown (.md)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeck(deck.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete Deck"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Flashcard Practice Interactive Canvas */}
        <div className="lg:col-span-2 space-y-5">
          {activeDeck && activeDeck.cards.length > 0 ? (
            <div className="space-y-5">
              {/* Top Dashboard: Review Progress Bar & Gamification Points Counter */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                {/* Score & Streak Stats Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Deck Review
                      </span>
                      <span className="text-xs text-slate-400 font-bold">•</span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                        {activeDeck.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Card {currentCardIdx + 1} of {totalCards} ({progressPercent}% Completed)
                    </p>
                  </div>

                  {/* Points, Streak, Accuracy Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Session Points Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>+{sessionPoints} pts</span>
                    </div>

                    {/* Streak Badge */}
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl border font-extrabold text-xs transition-all ${
                      currentStreak >= 3
                        ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}>
                      <Flame className={`w-4 h-4 ${currentStreak >= 3 ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} />
                      <span>{currentStreak} Streak</span>
                    </div>

                    {/* Accuracy Badge */}
                    {reviewedCount > 0 && (
                      <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{accuracyPercent}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500 ease-out shadow-xs"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Card Dot Navigation Stepper */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none">
                    {activeDeck.cards.map((card, idx) => {
                      const isCurrent = idx === currentCardIdx;
                      const review = cardReviewStatuses[card.id];
                      let dotColor = "bg-slate-200 dark:bg-slate-700 text-slate-500";

                      if (review) {
                        if (review.status === "correct" || review.status === "easy") {
                          dotColor = "bg-emerald-500 text-white font-bold";
                        } else if (review.status === "partial" || review.status === "medium") {
                          dotColor = "bg-amber-500 text-white font-bold";
                        } else {
                          dotColor = "bg-rose-500 text-white font-bold";
                        }
                      }

                      return (
                        <button
                          key={card.id || idx}
                          onClick={() => handleJumpToCard(idx)}
                          title={`Card ${idx + 1}: ${review?.status || "Unreviewed"}`}
                          className={`w-6 h-6 rounded-lg text-[10px] font-mono flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                            isCurrent
                              ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 bg-indigo-600 text-white font-bold scale-110 shadow-sm"
                              : dotColor
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Completion Summary Card (if deck finished) */}
              {showCompletionSummary ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-500 mb-1 ring-8 ring-amber-500/5">
                      <Trophy className="w-10 h-10 animate-bounce" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                      Deck Review Completed! 🎉
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Splendid active recall session! Reviewing spaced repetition cards strengthens long-term memory pathways.
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center space-y-1">
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Points Earned</p>
                      <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">+{sessionPoints}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-1">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Mastered</p>
                      <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                        {correctReviews} / {totalCards}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-center space-y-1">
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Accuracy</p>
                      <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                        {accuracyPercent}%
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center space-y-1">
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Best Streak</p>
                      <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 font-mono">
                        🔥 {bestStreak}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                    <button
                      onClick={handleRestartDeck}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Review Again</span>
                    </button>

                    <button
                      onClick={handleShuffleDeck}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <Shuffle className="w-4 h-4 text-indigo-500" />
                      <span>Shuffle & Practice</span>
                    </button>

                    <button
                      onClick={() => handleJumpToCard(0)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                    >
                      <span>Review Cards Individually</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Flippable Flashcard Canvas */}
                  <div className="relative">
                    {/* Floating Point Animation Banner */}
                    {pointsNotification && (
                      <div className="absolute top-4 right-4 z-20 animate-bounce duration-500 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-amber-300 border border-amber-400/50 shadow-xl text-xs font-extrabold backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                        <span>{pointsNotification.reason}</span>
                      </div>
                    )}

                    <div
                      className={`group perspective min-h-[300px] sm:min-h-[360px] rounded-3xl text-white p-6 sm:p-10 shadow-2xl flex flex-col justify-between border transition-all select-none ${
                        answerResult?.isChecked
                          ? answerResult.isCorrect
                            ? "bg-gradient-to-tr from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/60 shadow-emerald-500/10"
                            : answerResult.isPartial
                            ? "bg-gradient-to-tr from-amber-950 via-slate-900 to-slate-950 border-amber-500/60 shadow-amber-500/10"
                            : "bg-gradient-to-tr from-rose-950 via-slate-900 to-slate-950 border-rose-500/60 shadow-rose-500/10"
                          : "bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/30 hover:border-indigo-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                          {isFlipped ? "Back (Answer)" : "Front (Question Prompt)"}
                        </span>
                        <button
                          onClick={handleFlipCard}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all cursor-pointer font-semibold"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Flip Card</span>
                        </button>
                      </div>

                      {/* Question & Answer Card Body */}
                      <div className="my-auto space-y-4 py-4">
                        <h3 className="text-lg sm:text-2xl font-bold leading-relaxed text-center">
                          {isFlipped
                            ? activeDeck.cards[currentCardIdx].back
                            : activeDeck.cards[currentCardIdx].front}
                        </h3>

                        {/* Verification Feedback Result Banner */}
                        {answerResult?.isChecked && (
                          <div
                            className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 animate-in fade-in transition-all ${
                              answerResult.isCorrect
                                ? "bg-emerald-900/40 border-emerald-500/50 text-emerald-200"
                                : answerResult.isPartial
                                ? "bg-amber-900/40 border-amber-500/50 text-amber-200"
                                : "bg-rose-900/40 border-rose-500/50 text-rose-200"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <div className="flex items-center gap-2">
                                {answerResult.isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                ) : answerResult.isPartial ? (
                                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                                )}
                                <span className="text-sm">
                                  {answerResult.isCorrect
                                    ? "Correct! Points awarded."
                                    : answerResult.isPartial
                                    ? "Partially Correct / Close!"
                                    : "Incorrect answer."}
                                </span>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-xs bg-white/10 font-mono font-bold">
                                {answerResult.score}% Match
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs pt-1 border-t border-white/10">
                              <p>
                                <span className="font-semibold text-slate-400">Your Typed Answer:</span>{" "}
                                <span className="italic font-medium text-white">
                                  "{answerResult.submittedAnswer}"
                                </span>
                              </p>
                              <p>
                                <span className="font-semibold text-slate-400">Expected Answer:</span>{" "}
                                <span className="font-semibold text-white">
                                  "{answerResult.expectedAnswer}"
                                </span>
                              </p>
                            </div>

                            {!answerResult.isCorrect && (
                              <div className="pt-1 flex justify-end">
                                <button
                                  onClick={handleSelfGradeCorrect}
                                  className="text-[11px] font-bold underline hover:text-white text-emerald-300 cursor-pointer"
                                >
                                  Self-Grade: Mark as Correct (+15 pts)
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          Tags: {activeDeck.cards[currentCardIdx].tags?.join(", ") || "General"}
                        </span>
                        <span className="text-indigo-300 font-semibold">
                          {isFlipped ? "Grade recall below" : "Enter answer below or flip"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Answer Input Box */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <form onSubmit={handleCheckAnswer} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-indigo-500" />
                          <span>Test your recall: Type your answer for points</span>
                        </label>
                        {answerResult && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserAnswer("");
                              setAnswerResult(null);
                            }}
                            className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            Clear Answer
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type what you think the answer is..."
                          className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none font-medium focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={!userAnswer.trim()}
                          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Check Answer</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Spaced Repetition Rating Buttons */}
                  <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-center">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Rate Recall Difficulty to Earn Points & Schedule Review:
                    </p>
                    <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                      <button
                        onClick={() => handleRateCard("hard")}
                        className="py-2.5 px-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer flex flex-col items-center gap-0.5"
                      >
                        <span>Hard (+5 pts)</span>
                        <span className="text-[10px] font-normal opacity-80">1 day interval</span>
                      </button>
                      <button
                        onClick={() => handleRateCard("medium")}
                        className="py-2.5 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all cursor-pointer flex flex-col items-center gap-0.5"
                      >
                        <span>Medium (+12 pts)</span>
                        <span className="text-[10px] font-normal opacity-80">3 day interval</span>
                      </button>
                      <button
                        onClick={() => handleRateCard("easy")}
                        className="py-2.5 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer flex flex-col items-center gap-0.5"
                      >
                        <span>Easy (+20 pts)</span>
                        <span className="text-[10px] font-normal opacity-80">7 day interval</span>
                      </button>
                    </div>
                  </div>

                  {/* Prev / Next controls */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevCard}
                      disabled={currentCardIdx === 0}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 transition-all shadow-xs cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-indigo-500" />
                      <span>Previous Card</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCompletionSummary(true)}
                        className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold px-2 py-1"
                      >
                        Finish Review
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextCard}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      <span>{currentCardIdx === totalCards - 1 ? "Complete Deck" : "Next Card"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No active deck selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate an AI flashcard deck or select one from your library to start practice and earn XP points.
              </p>
              <button
                onClick={() => setShowBuilderModal(true)}
                className="mt-2 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                + Generate Flashcards
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Deck Builder Modal */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Generate AI Flashcards</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Topic or Chapter Title
                </label>
                <input
                  type="text"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  placeholder="e.g. TCP Layer Protocols, Organic Chemistry Reactions"
                  className="mt-1 w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subject Category
                </label>
                <select
                  value={deckSubjectId}
                  onChange={(e) => setDeckSubjectId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Optional Material / Text Source
                </label>
                <textarea
                  rows={4}
                  value={deckSourceText}
                  onChange={(e) => setDeckSourceText(e.target.value)}
                  placeholder="Paste notes or document text here..."
                  className="mt-1 w-full p-3 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowBuilderModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAiDeck}
                disabled={!deckTitle.trim() || isGenerating}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                {isGenerating ? "Generating..." : "Generate Deck"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
