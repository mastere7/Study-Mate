import React, { useState } from "react";
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  Clock,
  RefreshCw,
  Plus,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  Brain,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Quiz, QuizQuestion, Subject } from "../../types";
import { apiService } from "../../services/api";
import { audioSynth } from "../../services/audioSynth";

interface QuizSectionProps {
  quizzes: Quiz[];
  subjects: Subject[];
  onSaveQuizzes: (quizzes: Quiz[]) => void;
  initialTopic?: string;
  initialText?: string;
}

export const QuizSection: React.FC<QuizSectionProps> = ({
  quizzes,
  subjects,
  onSaveQuizzes,
  initialTopic = "",
  initialText = "",
}) => {
  const [activeTab, setActiveTab] = useState<"arena" | "generator" | "history">("arena");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Generator State
  const [topic, setTopic] = useState(initialTopic || "Computer Networks");
  const [sourceText, setSourceText] = useState(initialText || "");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("Medium");
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Test State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Trigger AI Quiz Generation
  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const quizRes = await apiService.generateQuiz(
        topic,
        sourceText,
        questionCount,
        difficulty,
        ["multiple_choice", "true_false"]
      );

      const newQuiz: Quiz = {
        id: `qz_${Date.now()}`,
        userId: "u_student_1",
        title: quizRes.title || `Quiz: ${topic}`,
        description: quizRes.description || `AI Generated practice quiz on ${topic}`,
        totalQuestions: quizRes.questions?.length || 5,
        questions: (quizRes.questions || []).map((q: any, idx: number) => ({
          id: q.id || `q_${idx}`,
          questionText: q.questionText,
          type: q.type || "multiple_choice",
          options: q.options || ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      };

      const updated = [newQuiz, ...quizzes];
      onSaveQuizzes(updated);
      setSelectedQuiz(newQuiz);
      setCurrentQuestionIdx(0);
      setUserAnswers({});
      setIsSubmitted(false);
      setScore(null);
      setActiveTab("arena");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Select option in active test
  const handleSelectOption = (questionId: string, answer: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Submit test and evaluate score
  const handleSubmitTest = () => {
    if (!selectedQuiz) return;
    let correctCount = 0;

    const evaluatedQuestions = selectedQuiz.questions.map((q) => {
      const userAns = userAnswers[q.id] || "";
      const isCorrect = userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (isCorrect) correctCount++;
      return { ...q, userAnswer: userAns, isCorrect };
    });

    const finalScorePercent = Math.round((correctCount / selectedQuiz.questions.length) * 100);
    setScore(finalScorePercent);
    setIsSubmitted(true);

    // Save history score
    const completedQuiz: Quiz = {
      ...selectedQuiz,
      questions: evaluatedQuestions,
      score: finalScorePercent,
      completedAt: new Date().toISOString(),
    };

    const updated = quizzes.map((q) => (q.id === completedQuiz.id ? completedQuiz : q));
    onSaveQuizzes(updated);

    // Audio chime & confetti
    if (finalScorePercent >= 70) {
      audioSynth.playChime("success");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      audioSynth.playChime("bell");
    }
  };

  const handleRestartQuiz = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setCurrentQuestionIdx(0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            <span>AI Quiz Arena</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Practice AI-generated tests with detailed answer explanations & performance tracking
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("arena")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "arena"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Take Quiz
          </button>
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "generator"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            + Create AI Quiz
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Quiz History
          </button>
        </div>
      </div>

      {/* TAB 1: Quiz Generator Form */}
      {activeTab === "generator" && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                Generate Custom AI Practice Quiz
              </h3>
              <p className="text-xs text-slate-500">
                Specify a topic or paste study notes to generate multiple choice and short answer questions
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Topic or Subject Name
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. TCP/IP Protocol Layers, Organic Chemistry Mechanisms, World War II"
                className="mt-1 w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Optional Study Text or Notes Content
              </label>
              <textarea
                rows={5}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste notes or document text to generate quiz questions specifically based on this material..."
                className="mt-1 w-full p-3 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value={3}>3 Questions (Quick)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Full Test)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="Easy">Easy (Fundamentals)</option>
                  <option value="Medium">Medium (Standard Exam)</option>
                  <option value="Hard">Hard (Advanced Reasoning)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={!topic.trim() || isGenerating}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? "Generating AI Quiz..." : "Generate AI Quiz Now"}</span>
          </button>
        </div>
      )}

      {/* TAB 2: Quiz Arena (Taking Test) */}
      {activeTab === "arena" && (
        <div className="space-y-6">
          {selectedQuiz ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Quiz Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedQuiz.title}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedQuiz.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Question {currentQuestionIdx + 1} of {selectedQuiz.questions.length}
                  </span>
                  {score !== null && (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        score >= 80
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}
                    >
                      Score: {score}%
                    </span>
                  )}
                </div>
              </div>

              {/* Score Results Card Banner */}
              {isSubmitted && score !== null && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-8 h-8 text-amber-300" />
                      <div>
                        <h4 className="font-extrabold text-lg">Quiz Completed!</h4>
                        <p className="text-xs text-indigo-100">
                          {score >= 80 ? "Stellar performance! High mastery demonstrated." : "Good effort! Review the explanations below."}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-3xl font-black">{score}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleRestartQuiz}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("generator")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Quiz</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Single Question Display */}
              {selectedQuiz.questions[currentQuestionIdx] && (
                <div className="space-y-6">
                  {/* Question Text */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                      Question #{currentQuestionIdx + 1}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {selectedQuiz.questions[currentQuestionIdx].questionText}
                    </h4>
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="space-y-3">
                    {selectedQuiz.questions[currentQuestionIdx].options?.map((option, idx) => {
                      const qId = selectedQuiz.questions[currentQuestionIdx].id;
                      const isSelected = userAnswers[qId] === option;
                      const isCorrect =
                        isSubmitted &&
                        option.trim().toLowerCase() ===
                          selectedQuiz.questions[currentQuestionIdx].correctAnswer.trim().toLowerCase();
                      const isWrongChoice = isSubmitted && isSelected && !isCorrect;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(qId, option)}
                          disabled={isSubmitted}
                          className={`w-full text-left flex items-center justify-between p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
                            isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200"
                              : isWrongChoice
                              ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-950 dark:text-rose-200"
                              : isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </div>

                          {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                          {isWrongChoice && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Step-by-Step Answer Explanation (After Submission) */}
                  {isSubmitted && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
                      <span className="font-bold text-xs text-amber-800 dark:text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" /> Answer Explanation:
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {selectedQuiz.questions[currentQuestionIdx].explanation}
                      </p>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIdx === 0}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                    >
                      Previous Question
                    </button>

                    {!isSubmitted ? (
                      <button
                        onClick={handleSubmitTest}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20"
                      >
                        Submit Quiz
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setCurrentQuestionIdx((prev) =>
                            Math.min(selectedQuiz.questions.length - 1, prev + 1)
                          )
                        }
                        disabled={currentQuestionIdx === selectedQuiz.questions.length - 1}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white disabled:opacity-50"
                      >
                        Next Question
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No active quiz</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate an AI practice quiz or pick one from your quiz history to test your knowledge!
              </p>
              <button
                onClick={() => setActiveTab("generator")}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                + Create Quiz Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Quiz History */}
      {activeTab === "history" && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Quiz History & Performance
          </h3>

          <div className="space-y-3">
            {quizzes.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No quiz history recorded yet.
              </p>
            ) : (
              quizzes.map((q) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQuiz(q);
                    setActiveTab("arena");
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {q.title}
                    </h4>
                    <p className="text-xs text-slate-500">{q.questions.length} Questions</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {q.score !== undefined && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                        Score: {q.score}%
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
