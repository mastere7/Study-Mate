import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  Plus,
  Minus,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Award,
  AlertCircle,
  FileText,
  Layers,
  ChevronRight,
  Play,
  RotateCcw,
  UploadCloud,
  FolderKanban,
  FileUp,
  Users,
  GripVertical,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Check,
  Target,
  Edit3,
  X,
  Trophy,
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Zap,
} from "lucide-react";
import { UserProfile, Subject, Note, Assignment, StudySchedule, Quiz } from "../../types";
import { storageService } from "../../services/storage";

export interface StudyTip {
  id: string;
  title: string;
  category: "Memory & Recall" | "Focus & Time" | "Exam Prep" | "Learning Method";
  summary: string;
  evidence: string;
  actionText: string;
  actionScreen?: string;
  actionPomodoro?: boolean;
}

export const STUDY_TIPS: StudyTip[] = [
  {
    id: "active_recall",
    title: "Active Recall over Passive Rereading",
    category: "Memory & Recall",
    summary: "Testing yourself without looking at notes forces your brain to retrieve knowledge, forging durable synaptic neural pathways.",
    evidence: "Roediger & Karpicke (2006) demonstrated that active self-testing yields over 50% higher long-term retrieval compared to re-reading notes.",
    actionText: "Practice Flashcards",
    actionScreen: "flashcards",
  },
  {
    id: "feynman",
    title: "The Feynman Technique",
    category: "Learning Method",
    summary: "Explain a concept in plain, simple terms as if teaching a 10-year-old child. Whenever you hit a gap, review source material to fix blind spots.",
    evidence: "Cognitive elaboration forces deep semantic processing rather than surface-level rote memorization.",
    actionText: "Try Feynman in AI Tutor",
    actionScreen: "tutor",
  },
  {
    id: "spaced_rep",
    title: "Spaced Repetition Intervals",
    category: "Memory & Recall",
    summary: "Review key concepts at expanding time intervals (1 day, 3 days, 7 days, 14 days) right before memory decay sets in.",
    evidence: "Based on Ebbinghaus's Forgetting Curve research, spaced testing flattens the exponential rate of memory loss.",
    actionText: "Check Curriculum Map",
    actionScreen: "curriculum",
  },
  {
    id: "interleaving",
    title: "Interleaving Topics vs. Blocking",
    category: "Exam Prep",
    summary: "Switch between different subjects or problem types during a single session instead of spending hours on just one topic.",
    evidence: "Taylor & Rohrer (2010) found students who interleaved problem types scored 43% higher on delayed tests.",
    actionText: "View Planner",
    actionScreen: "planner",
  },
  {
    id: "blurting",
    title: "The Blurting Method",
    category: "Memory & Recall",
    summary: "Read a chapter for 5 minutes, close the book, and write down every single fact you remember on a blank paper. Highlight gaps in red.",
    evidence: "High-yield retrieval technique proven for rapid STEM, law, and medical subject mastery.",
    actionText: "Create a Blurting Note",
    actionScreen: "notes",
  },
  {
    id: "pomodoro",
    title: "Interval Focus (52/17 or 25/5)",
    category: "Focus & Time",
    summary: "Work with 100% focused attention for 25 to 50 minutes, followed by a strict 5 to 17 minute screen-free break.",
    evidence: "Rest restores prefrontal cortex glucose reserves and prevents cognitive burn-out during high-intensity sessions.",
    actionText: "Start Focus Timer",
    actionPomodoro: true,
  },
  {
    id: "dual_coding",
    title: "Dual Coding (Text + Diagrams)",
    category: "Learning Method",
    summary: "Combine text explanations with visual flowcharts, mind maps, or diagrams to encode information into two separate brain channels.",
    evidence: "Allan Paivio's Dual-Coding Theory shows that visual-verbal associations double total cognitive retention pathways.",
    actionText: "Upload / Scan Diagram",
    actionScreen: "documents",
  },
  {
    id: "metacognition",
    title: "Metacognitive Calibration",
    category: "Exam Prep",
    summary: "Rate your confidence level (1-5) on every flashcard or chapter. Spend 80% of study time on low-confidence (1-2) items.",
    evidence: "Prevents the 'illusion of competence' where learners waste time reviewing comfortable, easy material.",
    actionText: "Review Analytics",
    actionScreen: "analytics",
  },
];

const WIDGET_ORDER_STORAGE_KEY = "studymate_dashboard_widget_order_v1";

export type WidgetId =
  | "ai_tutor"
  | "quick_tip"
  | "learning_progress"
  | "pomodoro"
  | "streak"
  | "doc_uploader"
  | "flashcards"
  | "group_study"
  | "deadlines"
  | "recent_note";

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  "ai_tutor",
  "quick_tip",
  "learning_progress",
  "pomodoro",
  "streak",
  "doc_uploader",
  "flashcards",
  "group_study",
  "deadlines",
  "recent_note",
];

const WIDGET_TITLES: Record<WidgetId, string> = {
  ai_tutor: "AI Tutor Assistant",
  quick_tip: "Quick Tip of the Day (Study Techniques)",
  learning_progress: "Daily Study Goal & Progress Ring",
  pomodoro: "Focus Mode (Pomodoro)",
  streak: "Study Streak",
  doc_uploader: "PDF / Word / Image Uploader",
  flashcards: "Smart Flashcards",
  group_study: "Group Study & Live Rooms",
  deadlines: "Upcoming Deadlines",
  recent_note: "Recent Smart Note",
};

interface HomeDashboardProps {
  user: UserProfile;
  subjects: Subject[];
  notes: Note[];
  assignments: Assignment[];
  schedules: StudySchedule[];
  quizzes: Quiz[];
  isFullScreenMode?: boolean;
  onTabSelect?: (tab: string) => void;
  onNavigateScreen?: (screen: string) => void;
  onQuickStartQuiz?: () => void;
  onQuickNewNote?: () => void;
  onQuickPomodoro?: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  subjects,
  notes,
  assignments,
  schedules,
  quizzes,
  isFullScreenMode = false,
  onTabSelect,
  onNavigateScreen,
  onQuickStartQuiz,
  onQuickNewNote,
  onQuickPomodoro,
  onUpdateUser,
}) => {
  const [quickAiInput, setQuickAiInput] = useState("");
  const [isCustomizingLayout, setIsCustomizingLayout] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<WidgetId | null>(null);

  // Daily Goal & Progress state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalInputHours, setGoalInputHours] = useState<number>(user.dailyGoalHours || 3.0);
  const [goalToastMsg, setGoalToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user.dailyGoalHours) {
      setGoalInputHours(user.dailyGoalHours);
    }
  }, [user.dailyGoalHours]);

  // Calculate today's study minutes
  const todayStr = new Date().toISOString().split("T")[0];
  const studyLogs = storageService.getStudyLogs();
  const todayLog = studyLogs.find((l) => l.date === todayStr);
  const loggedMinutes = todayLog ? todayLog.minutesFocused : 105; // default ~1.75h if no log

  const pomodoroSessions = storageService.getSessions();
  const todayPomodoroMins = pomodoroSessions
    .filter((s) => s.type === "focus" && s.timestamp && s.timestamp.startsWith(todayStr))
    .reduce((acc, s) => acc + (s.durationMinutes || 25), 0);

  const totalTodayMinutes = Math.max(loggedMinutes, todayPomodoroMins);
  const studiedHours = totalTodayMinutes / 60;
  const currentGoalHours = user.dailyGoalHours || 3.0;

  const remainingHours = Math.max(0, currentGoalHours - studiedHours);
  const remainingMinsTotal = Math.round(remainingHours * 60);
  const remHours = Math.floor(remainingMinsTotal / 60);
  const remMins = remainingMinsTotal % 60;

  let timeRemainingText = "";
  if (remainingMinsTotal <= 0) {
    timeRemainingText = "Target Met! 🎉";
  } else if (remHours > 0) {
    timeRemainingText = `${remHours}h ${remMins}m left`;
  } else {
    timeRemainingText = `${remMins}m left`;
  }

  const goalPercent = Math.min(100, Math.round((studiedHours / currentGoalHours) * 100));

  const handleSaveDailyGoal = (newGoalVal: number) => {
    const validGoal = Math.max(0.5, Math.min(16, parseFloat(newGoalVal.toFixed(1))));
    setGoalInputHours(validGoal);
    const updatedUser: UserProfile = {
      ...user,
      dailyGoalHours: validGoal,
    };
    storageService.saveUser(updatedUser);
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    setIsGoalModalOpen(false);
    setGoalToastMsg(`Daily study goal updated to ${validGoal} hrs/day! 🎯`);
    setTimeout(() => setGoalToastMsg(null), 3500);
  };

  // Quick Tip of the Day State
  const [selectedTipCategory, setSelectedTipCategory] = useState<string>("All");
  const [activeTipIndex, setActiveTipIndex] = useState<number>(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return dayOfYear % STUDY_TIPS.length;
  });
  const [savedTipIds, setSavedTipIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("studymate_saved_tips_v1");
      return saved ? JSON.parse(saved) : ["active_recall"];
    } catch {
      return ["active_recall"];
    }
  });

  const filteredTips = STUDY_TIPS.filter(
    (t) => selectedTipCategory === "All" || t.category === selectedTipCategory
  );

  const currentTip = filteredTips[activeTipIndex % filteredTips.length] || STUDY_TIPS[0];

  const handleNextTip = () => {
    setActiveTipIndex((prev) => (prev + 1) % filteredTips.length);
  };

  const toggleSaveTip = (tipId: string) => {
    setSavedTipIds((prev) => {
      const updated = prev.includes(tipId)
        ? prev.filter((id) => id !== tipId)
        : [...prev, tipId];
      try {
        localStorage.setItem("studymate_saved_tips_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save tips to storage:", e);
      }
      return updated;
    });
  };

  // Initialize widget order from localStorage or default
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGET_ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WidgetId[];
        // Ensure all default widgets exist in parsed array
        const valid = parsed.filter((id) => DEFAULT_WIDGET_ORDER.includes(id));
        DEFAULT_WIDGET_ORDER.forEach((id) => {
          if (!valid.includes(id)) valid.push(id);
        });
        return valid;
      }
    } catch (e) {
      console.warn("Failed to load widget order from storage:", e);
    }
    return DEFAULT_WIDGET_ORDER;
  });

  // Save layout changes to localStorage
  const saveWidgetOrder = (newOrder: WidgetId[]) => {
    setWidgetOrder(newOrder);
    try {
      localStorage.setItem(WIDGET_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
    } catch (e) {
      console.warn("Failed to save widget order to storage:", e);
    }
  };

  const resetLayout = () => {
    saveWidgetOrder(DEFAULT_WIDGET_ORDER);
  };

  const moveWidget = (id: WidgetId, direction: "up" | "down") => {
    const idx = widgetOrder.indexOf(id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= widgetOrder.length) return;

    const updated = [...widgetOrder];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    saveWidgetOrder(updated);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: WidgetId) => {
    setDraggedWidgetId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: WidgetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: WidgetId) => {
    e.preventDefault();
    const sourceId = (e.dataTransfer.getData("text/plain") || draggedWidgetId) as WidgetId;
    if (!sourceId || sourceId === targetId) {
      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
      return;
    }

    const sourceIdx = widgetOrder.indexOf(sourceId);
    const targetIdx = widgetOrder.indexOf(targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const updated = [...widgetOrder];
      const [removed] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, removed);
      saveWidgetOrder(updated);
    }

    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const navigate = (screen: string) => {
    if (onTabSelect) onTabSelect(screen);
    if (onNavigateScreen) onNavigateScreen(screen);
  };

  const pendingAssignments = assignments.filter((a) => a.status !== "Completed");
  const completedAssignmentsCount = assignments.filter((a) => a.status === "Completed").length;
  const recentNote = notes[0];

  const handleQuickAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAiInput.trim()) {
      navigate("tutor");
    }
  };

  // Render individual widget tile by ID
  const renderWidgetContent = (id: WidgetId) => {
    switch (id) {
      case "ai_tutor":
        return (
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    StudyMate AI Assistant
                  </h2>
                </div>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-full font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                  GEMINI 1.5 FLASH
                </span>
              </div>

              {/* Chat Preview Window */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3.5 border border-slate-100 dark:border-slate-800 max-h-56 overflow-y-auto">
                <div className="flex space-x-2.5">
                  <div className="w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0">
                    AI
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 leading-relaxed">
                    How can I help you study today? You can ask me to explain any topic, summarize notes, or solve practice problems!
                  </div>
                </div>

                <div className="flex space-x-2.5 justify-end">
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-xs leading-relaxed max-w-[80%] font-medium">
                    Explain Dijkstra's shortest path algorithm simply with an example.
                  </div>
                </div>

                <div className="flex space-x-2.5">
                  <div className="w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0">
                    AI
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 leading-relaxed">
                    Think of Dijkstra's algorithm like finding the quickest route on Google Maps. It explores starting from your location, recording tentative distances...
                  </div>
                </div>
              </div>
            </div>

            {/* Quick AI Input Prompt */}
            <form onSubmit={handleQuickAiSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                value={quickAiInput}
                onChange={(e) => setQuickAiInput(e.target.value)}
                placeholder="Type your study question here..."
                className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        );

      case "quick_tip": {
        const isSaved = savedTipIds.includes(currentTip.id);

        return (
          <div className="flex flex-col justify-between h-full space-y-3.5 relative z-10">
            {/* Header: Title, Evidence Tag & Controls */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  <Lightbulb className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-slate-900 dark:text-white font-black text-sm sm:text-base">
                      Quick Tip of the Day
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300/60 dark:border-amber-700/60">
                      Evidence-Based
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Technique {(activeTipIndex % filteredTips.length) + 1} of {filteredTips.length} • {currentTip.category}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Next Tip & Save */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleSaveTip(currentTip.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isSaved
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs font-black"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                  title={isSaved ? "Saved to favorites" : "Save this tip"}
                >
                  {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-slate-950" /> : <Bookmark className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{isSaved ? "Saved" : "Save"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextTip}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Show another study technique"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Next Tip</span>
                </button>
              </div>
            </div>

            {/* Tip Detail Card */}
            <div className="space-y-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                  {currentTip.title}
                </h4>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold border border-indigo-200 dark:border-indigo-800/80 shrink-0">
                  {currentTip.category}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {currentTip.summary}
              </p>

              {/* Science / Evidence Box */}
              <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 text-amber-950 dark:text-amber-200 text-xs space-y-1">
                <div className="font-black flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Cognitive Research Evidence:</span>
                </div>
                <p className="italic text-[11px] leading-relaxed">
                  "{currentTip.evidence}"
                </p>
              </div>
            </div>

            {/* Category Filter Pills & Quick Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                {(["All", "Memory & Recall", "Focus & Time", "Exam Prep", "Learning Method"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedTipCategory(cat);
                      setActiveTipIndex(0);
                    }}
                    className={`px-2 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      selectedTipCategory === cat
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs"
                        : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (currentTip.actionPomodoro) {
                    if (onQuickPomodoro) onQuickPomodoro();
                    else navigate("pomodoro");
                  } else if (currentTip.actionScreen) {
                    navigate(currentTip.actionScreen);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>{currentTip.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      }

      case "learning_progress":
        return (
          <div className="flex flex-col justify-between h-full relative overflow-hidden space-y-4">
            {/* Header with Title and Set Goal Button */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/10 text-cyan-200 border border-white/20">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-indigo-100 text-xs font-bold uppercase tracking-wider">
                    Daily Study Goal & Target
                  </h3>
                  <p className="text-[11px] text-indigo-200/90 font-medium">
                    Target: <span className="font-bold text-white">{currentGoalHours.toFixed(1)} hrs/day</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setGoalInputHours(currentGoalHours);
                  setIsGoalModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 shadow-xs cursor-pointer"
                title="Set or edit your Daily Study Goal in hours"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Set Goal</span>
              </button>
            </div>

            {/* Main Section: Progress Details & Animated Circular Ring */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
              {/* Left Column: Metrics & Time Remaining */}
              <div className="space-y-2 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    {studiedHours.toFixed(1)} <span className="text-lg text-indigo-200 font-semibold">/ {currentGoalHours.toFixed(1)} hrs</span>
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-cyan-300" />
                  <span>
                    {remainingMinsTotal <= 0 ? (
                      <span className="text-emerald-300 font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Goal Reached!
                      </span>
                    ) : (
                      <>Time remaining: <strong className="text-cyan-200">{timeRemainingText}</strong></>
                    )}
                  </span>
                </div>

                <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                  {goalPercent >= 100
                    ? "🎉 Fantastic effort! You've achieved your study target for today."
                    : `Completed ${totalTodayMinutes} mins today (${goalPercent}% of target). ${timeRemainingText} to go.`}
                </p>

                {/* Stepper buttons for instant goal modification */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Adjust Target:</span>
                  <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/15">
                    <button
                      type="button"
                      onClick={() => handleSaveDailyGoal(Math.max(0.5, currentGoalHours - 0.5))}
                      className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                      title="Decrease target goal by 0.5h"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-extrabold text-white px-2 font-mono">
                      {currentGoalHours.toFixed(1)}h
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveDailyGoal(Math.min(16, currentGoalHours + 0.5))}
                      className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                      title="Increase target goal by 0.5h"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Progress Ring Visualization */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="goalProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                    <linearGradient id="goalCompletedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  {/* Background Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="currentColor"
                    strokeWidth="9"
                    className="text-white/15"
                    fill="transparent"
                  />
                  {/* Foreground Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke={goalPercent >= 100 ? "url(#goalCompletedGradient)" : "url(#goalProgressGradient)"}
                    strokeWidth="9"
                    strokeDasharray={301.59}
                    strokeDashoffset={301.59 - (goalPercent / 100) * 301.59}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Center text inside Progress Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                  <span className="text-2xl font-black text-white tracking-tight leading-none">
                    {goalPercent}%
                  </span>
                  <span className="text-[10px] font-bold text-indigo-100 mt-0.5">
                    {studiedHours.toFixed(1)} / {currentGoalHours.toFixed(1)}h
                  </span>
                  <span className={`text-[9px] font-black mt-1 px-2 py-0.5 rounded-full ${
                    goalPercent >= 100 
                      ? "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/30" 
                      : "bg-white/20 text-cyan-200"
                  }`}>
                    {goalPercent >= 100 ? "GOAL MET 🎉" : timeRemainingText}
                  </span>
                </div>
              </div>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        );

      case "pomodoro":
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-3 h-full my-auto">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent flex items-center justify-center animate-spin-slow">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">25:00</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Focus Mode</p>
              <p className="text-[11px] text-slate-400 font-medium">Pomodoro Technique</p>
            </div>
            <button
              onClick={() => (onQuickPomodoro ? onQuickPomodoro() : navigate("pomodoro"))}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" />
              <span>Start Session</span>
            </button>
          </div>
        );

      case "streak":
        return (
          <div className="flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div className="bg-amber-400 text-slate-900 p-2.5 rounded-2xl shadow-sm text-lg font-bold">
                🔥
              </div>
              <span className="text-amber-800 dark:text-amber-300 font-bold text-sm bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                5 Day Streak
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-amber-950 dark:text-amber-200 font-extrabold">Active Study Streak</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">Top 10% Consistency</p>
            </div>
          </div>
        );

      case "doc_uploader":
        return (
          <div className="flex flex-col justify-between h-full text-white">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UploadCloud className={`${isFullScreenMode ? "w-4 h-4" : "w-5 h-5"} text-indigo-400`} />
                  <h3 className={`font-bold text-white ${isFullScreenMode ? "text-xs" : "text-sm"}`}>
                    Upload PDF / Word / Image
                  </h3>
                </div>
                <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                  AI Summarizer
                </span>
              </div>
              <p className={`text-indigo-200/90 font-medium leading-relaxed mt-1 ${isFullScreenMode ? "text-[11px] line-clamp-2" : "text-xs"}`}>
                Upload PDF documents, Word (.docx) files, or problem images for instant AI summary & key point extraction.
              </p>

              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">.PDF</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-500/40">.DOCX</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-500/40">Images</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/30 text-slate-200 border border-slate-500/40">.TXT</span>
              </div>
            </div>

            <button
              onClick={() => navigate("documents")}
              className={`bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 transition-all text-center w-full flex items-center justify-center gap-1.5 rounded-full ${
                isFullScreenMode ? "mt-3 py-1.5 px-3 text-[11px]" : "mt-4 py-2.5 px-4 text-xs"
              }`}
            >
              <FolderKanban className={isFullScreenMode ? "w-3.5 h-3.5" : "w-4 h-4"} />
              <span>Open Document Upload Hub</span>
            </button>
          </div>
        );

      case "flashcards":
        return (
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className={`${isFullScreenMode ? "w-4 h-4" : "w-5 h-5"} text-emerald-600 dark:text-emerald-400`} />
                <h3 className={`font-bold text-emerald-950 dark:text-emerald-100 ${isFullScreenMode ? "text-xs" : "text-sm"}`}>
                  Smart Flashcards
                </h3>
              </div>
              <p className={`text-emerald-700 dark:text-emerald-300 font-medium mt-1 ${isFullScreenMode ? "text-[11px]" : "text-xs"}`}>
                {quizzes.length + 12} cards due for active recall review today
              </p>
            </div>
            <button
              onClick={() => navigate("flashcards")}
              className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all text-center w-full rounded-full ${
                isFullScreenMode ? "mt-3 py-1.5 px-3 text-[11px]" : "mt-4 py-2.5 px-4 text-xs"
              }`}
            >
              Start Practice
            </button>
          </div>
        );

      case "group_study":
        return (
          <div className="flex flex-col justify-between h-full text-white">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className={`${isFullScreenMode ? "w-4 h-4" : "w-5 h-5"} text-violet-400`} />
                  <h3 className={`font-bold text-white ${isFullScreenMode ? "text-xs" : "text-sm"}`}>
                    Group Study & Live Rooms
                  </h3>
                </div>
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                  Live Now
                </span>
              </div>
              <p className={`text-violet-200/90 font-medium leading-relaxed mt-1 ${isFullScreenMode ? "text-[11px] line-clamp-2" : "text-xs"}`}>
                Study together with classmates! Create rooms, join via 6-digit codes, sync focus timers, and collaborate on live study notes.
              </p>
            </div>

            <button
              onClick={() => navigate("group_study")}
              className={`bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-md shadow-violet-600/30 transition-all text-center w-full flex items-center justify-center gap-1.5 rounded-full ${
                isFullScreenMode ? "mt-3 py-1.5 px-3 text-[11px]" : "mt-4 py-2.5 px-4 text-xs"
              }`}
            >
              <Users className={isFullScreenMode ? "w-3.5 h-3.5" : "w-4 h-4"} />
              <span>Join or Create Study Room</span>
            </button>
          </div>
        );

      case "deadlines":
        return (
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  Upcoming Deadlines
                </h3>
                <button
                  onClick={() => navigate("planner")}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold underline hover:text-indigo-700"
                >
                  View Calendar
                </button>
              </div>

              <div className="space-y-3">
                {pendingAssignments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No pending assignments due soon!</p>
                ) : (
                  pendingAssignments.slice(0, 2).map((ass) => {
                    const subject = subjects.find((s) => s.id === ass.subjectId);
                    return (
                      <div
                        key={ass.id}
                        className="flex items-center space-x-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl transition-all border border-slate-100 dark:border-slate-800"
                      >
                        <div className={`w-2.5 h-10 ${ass.priority === "High" ? "bg-rose-500" : "bg-amber-500"} rounded-full shrink-0`} />
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                            {ass.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {subject?.name || "General"} • Due {ass.dueDate} • {ass.priority} Priority
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );

      case "recent_note":
        return (
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Recent Note</h3>
                <FileText className="w-4 h-4 text-indigo-500" />
              </div>
              {recentNote ? (
                <>
                  <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">
                    {recentNote.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 italic">
                    "{recentNote.content || recentNote.summary || "Smart notes with AI summary..."}"
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400 italic">No notes created yet.</p>
              )}
            </div>

            <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium">Updated recently</span>
              <button
                onClick={() => navigate("notes")}
                className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper for card CSS classes & span settings
  const getWidgetWrapperClasses = (id: WidgetId) => {
    switch (id) {
      case "ai_tutor":
        return "md:col-span-2 lg:col-span-2 lg:row-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800";
      case "quick_tip":
        return "md:col-span-2 lg:col-span-2 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-amber-500/10 dark:from-amber-950/40 dark:via-slate-900 dark:to-indigo-950/30 rounded-[2rem] p-6 shadow-sm border border-amber-300/40 dark:border-amber-700/40 relative overflow-hidden";
      case "learning_progress":
        return "md:col-span-2 lg:col-span-2 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 dark:from-indigo-700 dark:to-blue-900 rounded-[2rem] p-6 text-white shadow-lg shadow-indigo-500/10";
      case "pomodoro":
        return "bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800";
      case "streak":
        return "bg-amber-50 dark:bg-amber-950/40 rounded-[2rem] p-6 border border-amber-200/60 dark:border-amber-900/40 shadow-sm";
      case "doc_uploader":
        return `bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-[2rem] border border-indigo-500/30 shadow-md ${
          isFullScreenMode ? "p-4 font-sans" : "p-6"
        }`;
      case "flashcards":
        return `bg-emerald-50 dark:bg-emerald-950/40 rounded-[2rem] border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm ${
          isFullScreenMode ? "p-4" : "p-6"
        }`;
      case "group_study":
        return `bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 rounded-[2rem] border border-violet-500/30 shadow-md ${
          isFullScreenMode ? "p-4" : "p-6"
        }`;
      case "deadlines":
        return "md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800";
      case "recent_note":
        return "bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800";
      default:
        return "bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Bento Grid Header / Greeting & Layout Customizer Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Welcome back, {user.name.split(" ")[0]}! <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Here's your personalized study overview and AI learning dashboard for today.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Customizer Mode Toggle Button */}
          <button
            onClick={() => setIsCustomizingLayout(!isCustomizingLayout)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all border ${
              isCustomizingLayout
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
            <span>{isCustomizingLayout ? "Done Prioritizing" : "Customize Layout"}</span>
          </button>

          {isCustomizingLayout && (
            <button
              onClick={resetLayout}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all"
              title="Reset to default widget layout"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={() => (onQuickPomodoro ? onQuickPomodoro() : navigate("pomodoro"))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/10"
          >
            <Clock className="w-4 h-4" />
            <span>25m Focus Mode</span>
          </button>

          <button
            onClick={() => (onQuickStartQuiz ? onQuickStartQuiz() : navigate("quiz"))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Quiz</span>
          </button>
        </div>
      </div>

      {/* Notice Banner when in Customization Mode */}
      {isCustomizingLayout && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-800 dark:text-indigo-200 text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-indigo-500 shrink-0" />
            <span>
              <strong>Drag & Drop Priority Mode Active:</strong> Click and drag any card handle, or use the <strong>▲ ▼ arrows</strong> on each tile to rearrange widgets to your liking! Your layout saves automatically.
            </span>
          </div>
          <button
            onClick={() => setIsCustomizingLayout(false)}
            className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all shrink-0"
          >
            Save & Close
          </button>
        </div>
      )}

      {/* Main Bento Grid Container (Dynamically Ordered Widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {widgetOrder.map((widgetId, index) => {
          const isDragging = draggedWidgetId === widgetId;
          const isOver = dragOverWidgetId === widgetId;

          return (
            <div
              key={widgetId}
              draggable
              onDragStart={(e) => handleDragStart(e, widgetId)}
              onDragOver={(e) => handleDragOver(e, widgetId)}
              onDrop={(e) => handleDrop(e, widgetId)}
              onDragEnd={handleDragEnd}
              className={`relative transition-all duration-200 group ${getWidgetWrapperClasses(
                widgetId
              )} ${
                isDragging
                  ? "opacity-40 scale-95 border-2 border-dashed border-indigo-500"
                  : isOver
                  ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-[1.01]"
                  : ""
              } ${isCustomizingLayout ? "hover:border-indigo-400 cursor-grab active:cursor-grabbing" : ""}`}
            >
              {/* Widget Drag & Priority Header Toolbar */}
              <div
                className={`flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80 transition-opacity ${
                  isCustomizingLayout ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <GripVertical className="w-4 h-4 cursor-grab" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    #{index + 1} {WIDGET_TITLES[widgetId]}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveWidget(widgetId, "up")}
                    disabled={index === 0}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:opacity-30 transition-all"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveWidget(widgetId, "down")}
                    disabled={index === widgetOrder.length - 1}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:opacity-30 transition-all"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Widget Content */}
              {renderWidgetContent(widgetId)}
            </div>
          );
        })}
      </div>

      {/* MODAL: Set Daily Study Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden space-y-5">
            <button
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Set Daily Study Goal
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Define your target study hours per day to build consistency.
                </p>
              </div>
            </div>

            {/* Live Progress Ring Preview inside modal */}
            {(() => {
              const previewPercent = Math.min(100, Math.round((studiedHours / Math.max(0.5, goalInputHours)) * 100));
              const prevRemHours = Math.max(0, goalInputHours - studiedHours);
              const prevRemMinsTotal = Math.round(prevRemHours * 60);
              const prevRemH = Math.floor(prevRemMinsTotal / 60);
              const prevRemM = prevRemMinsTotal % 60;
              const prevRemText = prevRemMinsTotal <= 0 ? "Target Met! 🎉" : prevRemH > 0 ? `${prevRemH}h ${prevRemM}m remaining` : `${prevRemM}m remaining`;

              return (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-4">
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="10" className="text-slate-200 dark:text-slate-700" fill="transparent" />
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        stroke={previewPercent >= 100 ? "#10b981" : "#6366f1"}
                        strokeWidth="10"
                        strokeDasharray={301.59}
                        strokeDashoffset={301.59 - (previewPercent / 100) * 301.59}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{previewPercent}%</span>
                    </div>
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Target Preview</div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white">
                      {studiedHours.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ {goalInputHours.toFixed(1)} hours today</span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {prevRemText}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Stepper Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Target Hours per Day:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGoalInputHours((prev) => Math.max(0.5, parseFloat((prev - 0.5).toFixed(1))))}
                  className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-lg transition-all cursor-pointer"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="16"
                    value={goalInputHours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setGoalInputHours(val);
                    }}
                    className="w-full text-center bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/40 focus:border-indigo-600 rounded-2xl py-2.5 text-2xl font-black text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    hrs
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setGoalInputHours((prev) => Math.min(16, parseFloat((prev + 0.5).toFixed(1))))}
                  className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-lg transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Preset Targets:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1.0, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setGoalInputHours(preset)}
                    className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                      goalInputHours === preset
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {preset}h
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveDailyGoal(goalInputHours)}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Daily Goal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {goalToastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{goalToastMsg}</span>
        </div>
      )}
    </div>
  );
};

