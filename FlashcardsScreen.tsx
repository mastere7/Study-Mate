import React, { useState } from "react";
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
} from "lucide-react";
import { FlashcardDeck, Flashcard, Subject } from "../../types";
import { apiService } from "../../services/api";
import { exportService } from "../../services/exportService";

interface FlashcardsScreenProps {
  decks: FlashcardDeck[];
  subjects: Subject[];
  onSaveDecks: (decks: FlashcardDeck[]) => void;
  initialTopic?: string;
  initialText?: string;
}

export const FlashcardsScreen: React.FC<FlashcardsScreenProps> = ({
  decks,
  subjects,
  onSaveDecks,
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

  // Navigate to Next Card
  const handleNextCard = () => {
    if (!activeDeck || activeDeck.cards.length === 0) return;
    resetCardAnswerState();
    setCurrentCardIdx((prev) => (prev + 1) % activeDeck.cards.length);
  };

  // Navigate to Previous Card
  const handlePrevCard = () => {
    if (!activeDeck || activeDeck.cards.length === 0) return;
    resetCardAnswerState();
    setCurrentCardIdx((prev) => (prev - 1 + activeDeck.cards.length) % activeDeck.cards.length);
  };

  // Flip card
  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // Compare answer evaluation
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
      // Word overlap calculation
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

    // Advance to next card with state reset
    handleNextCard();
  };

  // Generate Deck with AI
  const handleGenerateAiDeck = async () => {
    if (!deckTitle.trim()) return;
    setIsGenerating(true);
    try {
      const res = await apiService.generateFlashcards(deckTitle, deckSourceText, 8, subjects.find((s) => s.id === deckSubjectId)?.name);

      const newDeck: FlashcardDeck = {
        id: `deck_${Date.now()}`,
        userId: "u_student_1",
        subjectId: deckSubjectId,
        title: res.title || `Flashcards: ${deckTitle}`,
        description: `AI Generated high-yield active recall flashcard deck`,
        totalCards: res.cards?.length || 5,
        cards: (res.cards || []).map((c: any, idx: number) => ({
          id: `fc_${idx}`,
          front: c.front,
          back: c.back,
          tags: c.tags || [deckTitle],
        })),
        lastStudied: new Date().toISOString(),
      };

      const updated = [newDeck, ...decks];
      onSaveDecks(updated);
      setActiveDeck(newDeck);
      setCurrentCardIdx(0);
      setIsFlipped(false);
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
    }
  };

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
            Active recall flashcards using Leitner interval scheduling for 2x memory retention
          </p>
        </div>

        <button
          onClick={() => setShowBuilderModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>+ Generate AI Deck</span>
        </button>
      </div>

      {/* Main Grid: Deck Library vs Active Practice Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deck Selector */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 px-1">
              Flashcard Decks ({decks.length})
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {decks.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No flashcard decks found. Create your first deck using AI!
                </p>
              ) : (
                decks.map((deck) => {
                  const subject = subjects.find((s) => s.id === deck.subjectId);
                  const isSelected = activeDeck?.id === deck.id;
                  return (
                    <div
                      key={deck.id}
                      onClick={() => {
                        setActiveDeck(deck);
                        setCurrentCardIdx(0);
                        resetCardAnswerState();
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700"
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
                        <p className="text-[10px] text-slate-500">{deck.cards.length} Cards</p>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Export PDF Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportDeckPDF(deck);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Export Deck as Markdown (.md)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeck(deck.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
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

        {/* Right 2 Columns: Flashcard Practice Interactive Card */}
        <div className="lg:col-span-2 space-y-6">
          {activeDeck && activeDeck.cards.length > 0 ? (
            <div className="space-y-6">
              {/* Header & Export Actions */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 flex-wrap gap-2">
                <span>
                  Card {currentCardIdx + 1} of {activeDeck.cards.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Deck: {activeDeck.title}</span>
                  <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                    <button
                      onClick={() => handleExportDeckPDF(activeDeck)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 font-bold text-[11px] flex items-center gap-1"
                      title="Export Deck as Printable PDF Worksheet"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleExportDeckMD(activeDeck)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 font-bold text-[11px] flex items-center gap-1"
                      title="Export Deck as Markdown (.md)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Markdown</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Flippable Flashcard Canvas */}
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
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full transition-all"
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
                              ? "Correct! Excellent recall."
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
                            onClick={() =>
                              setAnswerResult({
                                ...answerResult,
                                isCorrect: true,
                                isPartial: false,
                                score: 100,
                              })
                            }
                            className="text-[11px] font-bold underline hover:text-white text-emerald-300"
                          >
                            Self-Grade: Mark as Correct
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

              {/* Answer Input Box */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <form onSubmit={handleCheckAnswer} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-500" />
                      <span>Test your recall: Type your answer</span>
                    </label>
                    {answerResult && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserAnswer("");
                          setAnswerResult(null);
                        }}
                        className="text-[11px] font-bold text-slate-400 hover:text-indigo-600"
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
                      className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 shrink-0"
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
                  How well did you recall this card?
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => handleRateCard("hard")}
                    className="py-2.5 px-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all"
                  >
                    Hard (Review 1 day)
                  </button>
                  <button
                    onClick={() => handleRateCard("medium")}
                    className="py-2.5 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-all"
                  >
                    Medium (Review 3 days)
                  </button>
                  <button
                    onClick={() => handleRateCard("easy")}
                    className="py-2.5 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
                  >
                    Easy (Review 7 days)
                  </button>
                </div>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4 text-indigo-500" />
                  <span>Previous Card</span>
                </button>

                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                  {currentCardIdx + 1} / {activeDeck.cards.length}
                </div>

                <button
                  type="button"
                  onClick={handleNextCard}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all"
                >
                  <span>Next Card</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No active deck</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate an AI flashcard deck or select one from your library to start practice.
              </p>
              <button
                onClick={() => setShowBuilderModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                + Generate Flashcards
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Deck Builder Modal */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAiDeck}
                disabled={!deckTitle.trim() || isGenerating}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
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
