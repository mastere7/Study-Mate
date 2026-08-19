import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  Bot,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RefreshCw,
  Code,
  Lightbulb,
  HelpCircle,
  Brain,
  Mic,
  MicOff,
  User as UserIcon,
  History,
  Plus,
  Trash2,
  Edit3,
  Pin,
  PinOff,
  Search,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileText,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { Subject, AIChatSession, AIChatMessage } from "../../types";
import { apiService } from "../../services/api";
import { audioSynth } from "../../services/audioSynth";
import { storageService } from "../../services/storage";

interface AITutorChatProps {
  subjects: Subject[];
  activeSubjectId?: string | null;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

const PRESET_MODES = [
  { id: "standard", label: "Standard Tutor", icon: Bot, desc: "Balanced academic tutor guidance" },
  { id: "eli5", label: "ELI5 Simple", icon: Lightbulb, desc: "Explain like I am 5 years old" },
  { id: "detailed", label: "Deep Dive", icon: Brain, desc: "Comprehensive academic breakdown" },
  { id: "code", label: "Code Explainer", icon: Code, desc: "Line-by-line coding & bug help" },
  { id: "solver", label: "Step-by-Step Solver", icon: HelpCircle, desc: "Solve math & science problems" },
];

const QUICK_PROMPTS = [
  "Explain TCP 3-Way Handshake with an analogy",
  "How does Normalization (1NF to 3NF) work in Databases?",
  "Step-by-step: Solve derivative of f(x) = x^3 * e^(2x)",
  "What are the main differences between TCP and UDP?",
  "Explain Organic Chemistry SN1 vs SN2 reaction mechanisms",
];

const createWelcomeMessage = (): AIChatMessage => ({
  id: `msg_welcome_${Date.now()}`,
  role: "assistant",
  content:
    "Hello! I'm **StudyMate AI**, your 24/7 personal tutor. Ask me any question, paste code, request step-by-step problem solutions, or ask for simple analogies!",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
});

export const AITutorChat: React.FC<AITutorChatProps> = ({
  subjects,
  activeSubjectId,
  initialPrompt,
  onClearInitialPrompt,
  onGoBack,
}) => {
  // Load initial sessions from storage
  const [sessions, setSessions] = useState<AIChatSession[]>(() => {
    const loaded = storageService.getChatSessions();
    if (loaded && loaded.length > 0) return loaded;
    const initialSession: AIChatSession = {
      id: `session_${Date.now()}`,
      title: "New Study Session",
      subjectId: activeSubjectId || (subjects[0]?.id ?? undefined),
      mode: "standard",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [createWelcomeMessage()],
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const loaded = storageService.getChatSessions();
    return loaded && loaded.length > 0 ? loaded[0].id : `session_${Date.now()}`;
  });

  // Chat UI state
  const [inputPrompt, setInputPrompt] = useState(initialPrompt || "");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<{
    message: string;
    prompt: string;
    code?: number | string;
  } | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputPrompt(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // History panel & search states
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(() => {
    return typeof window !== "undefined" ? window.innerWidth >= 1280 : false;
  });
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");

  // Rename modal / inline states
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState<string>("");

  // Delete confirmation state
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Sync active session object
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const selectedSubjectId =
    activeSession?.subjectId || activeSubjectId || (subjects.length > 0 ? subjects[0].id : "");
  const selectedMode = activeSession?.mode || "standard";

  // Auto save sessions whenever state changes
  useEffect(() => {
    if (sessions.length > 0) {
      storageService.saveChatSessions(sessions);
    }
  }, [sessions]);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isLoading]);

  const selectedSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  // Handle switching active session
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsHistoryOpen(false);
    }
  };

  // Create a brand new session
  const handleCreateNewSession = () => {
    const newSession: AIChatSession = {
      id: `session_${Date.now()}`,
      title: "New Study Session",
      subjectId: activeSubjectId || (subjects[0]?.id ?? undefined),
      mode: "standard",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [createWelcomeMessage()],
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsHistoryOpen(false);
    }
  };

  // Rename session title
  const handleStartRename = (session: AIChatSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleInput(session.title);
  };

  const handleSaveRename = (sessionId: string) => {
    if (!editTitleInput.trim()) {
      setEditingSessionId(null);
      return;
    }
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, title: editTitleInput.trim(), updatedAt: new Date().toISOString() } : s
    );
    setSessions(updated);
    setEditingSessionId(null);
  };

  // Toggle Pin session
  const handleTogglePin = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s
    );
    setSessions(updated);
  };

  // Delete session
  const handleDeleteSession = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== sessionId);

    if (filtered.length === 0) {
      // If deleted last session, auto create a clean new session
      const fallbackSession: AIChatSession = {
        id: `session_${Date.now()}`,
        title: "New Study Session",
        subjectId: activeSubjectId || (subjects[0]?.id ?? undefined),
        mode: "standard",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [createWelcomeMessage()],
      };
      setSessions([fallbackSession]);
      setActiveSessionId(fallbackSession.id);
    } else {
      setSessions(filtered);
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
    }
    setDeletingSessionId(null);
  };

  // Change mode for active session
  const handleModeChange = (newMode: string) => {
    if (!activeSession) return;
    const updated = sessions.map((s) =>
      s.id === activeSession.id
        ? { ...s, mode: newMode, updatedAt: new Date().toISOString() }
        : s
    );
    setSessions(updated);
  };

  // Change subject for active session
  const handleSubjectChange = (newSubjectId: string) => {
    if (!activeSession) return;
    const updated = sessions.map((s) =>
      s.id === activeSession.id
        ? { ...s, subjectId: newSubjectId, updatedAt: new Date().toISOString() }
        : s
    );
    setSessions(updated);
  };

  // Auto-generate title from first user prompt if still default
  const getAutoTitle = (promptText: string): string => {
    const cleaned = promptText.trim().replace(/^[^a-zA-Z0-9]+/, "");
    if (!cleaned) return "Study Session";
    if (cleaned.length <= 32) return cleaned;
    return cleaned.slice(0, 32) + "...";
  };

  // Retry a failed prompt without duplicating user messages or losing conversation context
  const handleRetry = (promptToRetry: string, errorMsgId?: string) => {
    setErrorAlert(null);
    handleSendMessage(promptToRetry, true, errorMsgId);
  };

  // Generate instant offline Knowledge Core concept summary when requested from error state
  const handleInstantKnowledgeCore = (prompt: string, errorMsgId?: string) => {
    if (!activeSession) return;
    setErrorAlert(null);

    const fallbackContent = `### 💡 Concept Overview: ${prompt.trim()}

**1. Core Concept & Direct Answer**
When studying **"${prompt.trim().replace(/[?.]+$/, "")}"**, the essential concept involves mastering the underlying definitions, key relationships, and systematic rules in ${selectedSubjectObj?.name || "this subject"}.

**2. Detailed Breakdown & Principles**
- **Foundational Rules**: Follow the standard academic framework and step-by-step logic established for this topic.
- **Core Mechanics**: Examine how variables and inputs correlate with the final outcomes.
- **Key Distinctions**: Keep in mind edge cases and special boundary conditions.

**3. Practical Application & Example**
In practice, breaking complex problems down into step 1 (identify knowns), step 2 (apply formulas/rules), and step 3 (verify constraints) ensures accurate mastery.

**4. Key Takeaways & Exam Tip**
- **Memory Hook**: Master foundational terminology before moving to multi-step problem sets.
- **Self-Test**: Practice active recall by explaining this concept without reference notes.

*(⚡ Note: Generated via StudyMate Knowledge Core. All conversation history is safely preserved.)*`;

    const aiMsg: AIChatMessage = {
      id: `ai_offline_${Date.now()}`,
      role: "assistant",
      content: fallbackContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setSessions((prevSessions) =>
      prevSessions.map((s) => {
        if (s.id !== activeSession.id) return s;
        const cleanedMsgs = errorMsgId
          ? s.messages.filter((m) => m.id !== errorMsgId)
          : s.messages.filter((m) => !m.isError);
        return {
          ...s,
          updatedAt: new Date().toISOString(),
          messages: [...cleanedMsgs, aiMsg],
        };
      })
    );
  };

  // Dismiss a specific error message from chat
  const handleDismissError = (errorMsgId: string) => {
    setErrorAlert(null);
    setSessions((prevSessions) =>
      prevSessions.map((s) =>
        s.id === activeSession.id
          ? { ...s, messages: s.messages.filter((m) => m.id !== errorMsgId) }
          : s
      )
    );
  };

  // Send Message Logic with history-preserving retry support
  const handleSendMessage = async (
    textToSend?: string,
    isRetry = false,
    retryErrorMsgId?: string
  ) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading || !activeSession) return;

    setErrorAlert(null);

    // Prepare message list: if retrying, remove the previous error message and check if user message exists
    let updatedMessages = [...activeSession.messages];
    if (isRetry) {
      if (retryErrorMsgId) {
        updatedMessages = updatedMessages.filter((m) => m.id !== retryErrorMsgId);
      } else {
        updatedMessages = updatedMessages.filter((m) => !m.isError);
      }
    }

    // If this is a fresh prompt (or if last message isn't already the user prompt), append userMsg
    const lastMsg = updatedMessages[updatedMessages.length - 1];
    const alreadyHasUserMsg = isRetry && lastMsg && lastMsg.role === "user" && lastMsg.content === prompt;

    if (!alreadyHasUserMsg) {
      const userMsg: AIChatMessage = {
        id: `usr_${Date.now()}`,
        role: "user",
        content: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: selectedMode,
      };
      updatedMessages.push(userMsg);
    }

    // Auto-update session title if it is the first prompt
    const isNewTitleNeeded =
      activeSession.title === "New Study Session" ||
      updatedMessages.filter((m) => m.role === "user").length <= 1;

    const newTitle = isNewTitleNeeded ? getAutoTitle(prompt) : activeSession.title;

    const updatedSessionWithUser: AIChatSession = {
      ...activeSession,
      title: newTitle,
      updatedAt: new Date().toISOString(),
      messages: updatedMessages,
    };

    // Update state immediately to preserve history
    setSessions((prevSessions) =>
      prevSessions.map((s) => (s.id === activeSession.id ? updatedSessionWithUser : s))
    );
    if (!isRetry) {
      setInputPrompt("");
    }
    setIsLoading(true);

    try {
      // Build clean sequential conversation history (excluding welcome & errors)
      const conversationHistory = updatedMessages
        .filter((m) => !m.id.startsWith("msg_welcome") && !m.isError && m.content !== prompt)
        .map((m) => ({ role: m.role, content: m.content }));

      const responseText = await apiService.askAITutor({
        prompt: prompt,
        mode: selectedMode as any,
        subject: selectedSubjectObj?.name,
        conversationHistory: conversationHistory,
      });

      const aiMsg: AIChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                updatedAt: new Date().toISOString(),
                messages: [...s.messages.filter((m) => !m.isError), aiMsg],
              }
            : s
        )
      );
      setErrorAlert(null);
    } catch (err: any) {
      console.warn("AI Tutor caught error in component:", err);
      const errorCode = err?.status || err?.code || 503;

      setErrorAlert({
        message: "Request failed due to high demand. Your conversation history is safe.",
        prompt: prompt,
        code: errorCode,
      });

      const errorMsg: AIChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "Temporary high server traffic. Your conversation history is preserved.",
        isError: true,
        errorCode: errorCode,
        retryPrompt: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      audioSynth.stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      audioSynth.speak(text, () => setSpeakingId(null));
    }
  };

  // Voice Input Speech Recognition
  const handleToggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Export Chat Session Transcript
  const handleExportTranscript = () => {
    if (!activeSession) return;
    const lines = [
      `# StudyMate AI Tutor Transcript: ${activeSession.title}`,
      `Date: ${new Date(activeSession.createdAt).toLocaleDateString()}`,
      `Subject: ${selectedSubjectObj?.name || "General"}`,
      `Mode: ${selectedMode}`,
      `----------------------------------------\n`,
    ];

    activeSession.messages.forEach((msg) => {
      const sender = msg.role === "user" ? "You" : "StudyMate AI Tutor";
      lines.push(`[${msg.timestamp}] ${sender}:\n${msg.content}\n`);
    });

    const fullContent = lines.join("\n");
    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeSession.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotification("Transcript downloaded!");
    setTimeout(() => setExportNotification(null), 3000);
  };

  // Filtered Sessions for Sidebar
  const filteredSessions = sessions.filter((s) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(q);
    const msgMatch = s.messages.some((m) => m.content.toLowerCase().includes(q));
    const subMatch = subjects.find((sub) => sub.id === s.subjectId)?.name.toLowerCase().includes(q);
    return titleMatch || msgMatch || subMatch;
  });

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const unpinnedSessions = filteredSessions.filter((s) => !s.isPinned);

  // Helper date formatter
  const formatSessionDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffHours < 48) {
      return "Yesterday";
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="AITutorChat flex flex-col h-full w-full max-w-7xl mx-auto rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
      {/* Top Main Navigation Header - Sleek, compact, high contrast */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md flex-shrink-0 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Back to previous screen button */}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* History Sidebar Toggle Button */}
          <button
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 shrink-0 ${
              isHistoryOpen
                ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300"
            }`}
            title={isHistoryOpen ? "Collapse Chat History" : "Expand Chat History"}
          >
            <History className="w-4 h-4 text-indigo-500" />
            <span className="hidden md:inline-block">History</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-extrabold">
              {sessions.length}
            </span>
          </button>

          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 shrink-0 ring-2 ring-indigo-500/20">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" title="AI Tutor is online" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {editingSessionId === activeSession?.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editTitleInput}
                    onChange={(e) => setEditTitleInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveRename(activeSession.id)}
                    className="px-2 py-0.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border-2 border-indigo-500 text-slate-900 dark:text-slate-100 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveRename(activeSession.id)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingSessionId(null)}
                    className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0">
                  <h2 className="font-extrabold text-xs sm:text-sm md:text-base text-slate-900 dark:text-slate-100 truncate tracking-tight">
                    {activeSession?.title || "AI Study Tutor"}
                  </h2>
                  <button
                    onClick={(e) => activeSession && handleStartRename(activeSession, e)}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Rename chat session"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
              <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Tutor
              </span>
              <span>•</span>
              <span>{activeSession?.messages.length || 0} msgs</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions - Mode, Subject, Export, New */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Inline Persona / Mode Selector Dropdown */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hidden lg:inline">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-indigo-700 dark:text-indigo-300 outline-none cursor-pointer pr-1"
              title="Change AI Tutor Persona / Mode"
            >
              {PRESET_MODES.map((mode) => (
                <option key={mode.id} value={mode.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Context Selector */}
          <div className="hidden xl:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="px-2 py-1 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="">General Knowledge</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Export Transcript Button */}
          <button
            onClick={handleExportTranscript}
            className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Export Chat Transcript"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline-block">Export</span>
          </button>

          {/* New Session Quick Button */}
          <button
            onClick={handleCreateNewSession}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1 cursor-pointer active:scale-95"
            title="Start new study session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline-block">New</span>
          </button>
        </div>
      </div>

      {/* Export Notification Toast */}
      {exportNotification && (
        <div className="absolute top-16 right-4 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{exportNotification}</span>
        </div>
      )}

      {/* Main Container Layout: Sidebar + Main Chat Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* HISTORY SIDEBAR */}
        {isHistoryOpen && (
          <div className="fixed inset-0 z-40 xl:static xl:z-auto flex">
            {/* Mobile / Tablet backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs xl:hidden"
              onClick={() => setIsHistoryOpen(false)}
            />
            <div className="relative w-72 sm:w-80 h-full shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 xl:bg-slate-50/50 xl:dark:bg-slate-900/50 flex flex-col transition-all z-10 shadow-2xl xl:shadow-none">
              {/* Sidebar Search & New Chat Header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between xl:hidden mb-1">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-indigo-500" />
                    Chat History
                  </span>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleCreateNewSession}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Tutor Session</span>
                </button>

                {/* History Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search previous chats..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500"
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery("")}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-3">
                {filteredSessions.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      No chat history matches your search.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Pinned Sessions */}
                    {pinnedSessions.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Pin className="w-3 h-3 text-indigo-500" />
                          <span>Pinned Chats</span>
                        </div>
                        {pinnedSessions.map((session) => (
                          <SidebarSessionCard
                            key={session.id}
                            session={session}
                            isActive={session.id === activeSessionId}
                            subjects={subjects}
                            editingSessionId={editingSessionId}
                            editTitleInput={editTitleInput}
                            setEditTitleInput={setEditTitleInput}
                            onSelect={handleSelectSession}
                            onStartRename={handleStartRename}
                            onSaveRename={handleSaveRename}
                            onCancelRename={() => setEditingSessionId(null)}
                            onTogglePin={handleTogglePin}
                            onDelete={handleDeleteSession}
                          />
                        ))}
                      </div>
                    )}

                    {/* Recent Sessions */}
                    <div className="space-y-1">
                      {pinnedSessions.length > 0 && unpinnedSessions.length > 0 && (
                        <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Recent Chats
                        </div>
                      )}
                      {unpinnedSessions.map((session) => (
                        <SidebarSessionCard
                          key={session.id}
                          session={session}
                          isActive={session.id === activeSessionId}
                          subjects={subjects}
                          editingSessionId={editingSessionId}
                          editTitleInput={editTitleInput}
                          setEditTitleInput={setEditTitleInput}
                          onSelect={handleSelectSession}
                          onStartRename={handleStartRename}
                          onSaveRename={handleSaveRename}
                          onCancelRename={() => setEditingSessionId(null)}
                          onTogglePin={handleTogglePin}
                          onDelete={handleDeleteSession}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CHAT MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white dark:bg-slate-900 overflow-hidden relative">
          {/* Messages Stream Area - Dedicated scroll area with full vertical freedom */}
          <div className="flex-grow min-h-0 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
            {activeSession?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 sm:gap-3.5 max-w-4xl ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : msg.isError
                      ? "bg-amber-500 text-white shadow-md"
                      : "bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md"
                  }`}
                >
                  {msg.role === "user" ? (
                    <UserIcon className="w-4 h-4" />
                  ) : msg.isError ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                <div className="group relative space-y-1 max-w-[90%] sm:max-w-[92%] md:max-w-[95%]">
                  {msg.isError ? (
                    /* User-Friendly Request Failed Alert Card with History-Preserving Retry Actions */
                    <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-slate-800 dark:text-slate-100 rounded-tl-none space-y-3 shadow-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                              High Traffic Demand Detected
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ✓ Chat History Preserved
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                              {msg.errorCode === 503 ? "503 High Traffic" : `Code ${msg.errorCode || "503"}`}
                            </span>
                          </div>
                          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                            Upstream AI servers experienced temporary high volume. Your complete conversation history and question have been safely kept.
                          </p>
                          {msg.retryPrompt && (
                            <div className="text-[11px] font-mono bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl text-slate-700 dark:text-slate-300 border border-amber-200/60 dark:border-amber-800/40 truncate">
                              &ldquo;{msg.retryPrompt}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      {msg.retryPrompt && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleRetry(msg.retryPrompt!, msg.id)}
                            disabled={isLoading}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            title="Retry asking with live AI"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                            <span>Retry Request</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInstantKnowledgeCore(msg.retryPrompt!, msg.id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Get instant concept breakdown from StudyMate Knowledge Core"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Instant Study Breakdown</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInputPrompt(msg.retryPrompt!);
                              handleDismissError(msg.id);
                              inputRef.current?.focus();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-amber-200 dark:border-amber-800/60 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                          >
                            Edit Question
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissError(msg.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-auto"
                            title="Dismiss error notice"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "p-3.5 sm:p-4 bg-indigo-600 text-white rounded-tr-none shadow-md font-medium whitespace-pre-wrap"
                          : "p-4 sm:p-6 bg-white dark:bg-slate-850 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none shadow-xs"
                      }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <div className="markdown-body text-sm sm:text-[15px] text-slate-800 dark:text-slate-100 leading-relaxed break-words space-y-3.5 [&_p]:mb-3.5 [&_p]:last:mb-0 [&_p]:leading-relaxed [&_p]:text-slate-800 [&_p]:dark:text-slate-200 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3.5 [&_li]:my-1.5 [&_strong]:font-extrabold [&_strong]:text-slate-900 [&_strong]:dark:text-white [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-3.5 [&_pre]:border [&_pre]:border-slate-800 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-slate-100 [&_code]:dark:bg-slate-900 [&_code]:text-indigo-600 [&_code]:dark:text-indigo-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-slate-100 [&_pre_code]:p-0 [&_h1]:text-lg [&_h1]:font-extrabold [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:mt-3.5 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-indigo-600 [&_h3]:dark:text-indigo-400 [&_h3]:mt-3 [&_h3]:mb-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-3.5 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:dark:text-slate-300 [&_blockquote]:my-3 [&_hr]:my-4 [&_hr]:border-slate-200 [&_hr]:dark:border-slate-700">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Footer Actions */}
                  <div
                    className={`flex items-center gap-2 text-[10px] text-slate-400 pt-0.5 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="font-medium">{msg.timestamp}</span>
                    {msg.role === "assistant" && !msg.isError && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => handleToggleSpeak(msg.id, msg.content)}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          <span>{speakingId === msg.id ? "Stop Voice" : "Read Aloud"}</span>
                        </button>
                        {msg.content.includes("Knowledge Core") && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => {
                                const lastUserMsg = activeSession?.messages
                                  .slice()
                                  .reverse()
                                  .find((m) => m.role === "user");
                                if (lastUserMsg) {
                                  handleSendMessage(lastUserMsg.content);
                                }
                              }}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-bold transition-colors cursor-pointer"
                              title="Re-query with Live Gemini AI"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Re-query Live AI</span>
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* In-stream Suggested Questions when chat is newly started */}
            {activeSession?.messages.length <= 1 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3 max-w-3xl mx-auto my-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span>Suggested Study Questions to Try</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(promptText)}
                      className="p-2.5 text-left rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      &ldquo;{promptText}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-3 max-w-xl mr-auto">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white animate-spin shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-2.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>StudyMate AI is thinking & writing your response...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts Flyout Popover */}
          {showQuickPrompts && (
            <div className="absolute bottom-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-40 space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Suggested Questions
                </span>
                <button
                  onClick={() => setShowQuickPrompts(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {QUICK_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputPrompt(promptText);
                      setShowQuickPrompts(false);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 font-medium transition-all"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sticky Alert Notification Toast if recent request encountered 503 or error */}
          {errorAlert && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/80 border-t border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-100 shrink-0 transition-all">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-bold truncate">
                  High API traffic detected
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Chat History Saved
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRetry(errorAlert.prompt)}
                  disabled={isLoading}
                  className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Retry Question</span>
                </button>
                <button
                  type="button"
                  onClick={() => setErrorAlert(null)}
                  className="p-1 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 cursor-pointer"
                  title="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Input Form Bar - Elevated, high contrast, always pinned */}
          <div className="flex-shrink-0 shrink-0 w-full p-2 sm:p-2.5 md:p-3 border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0 z-30 shadow-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5 sm:gap-2 max-w-5xl mx-auto w-full flex-shrink-0"
            >
              {/* Quick Prompts Lightbulb Button */}
              <button
                type="button"
                onClick={() => setShowQuickPrompts((prev) => !prev)}
                className={`p-2 sm:p-2.5 rounded-xl border transition-all flex-shrink-0 shrink-0 cursor-pointer flex items-center justify-center ${
                  showQuickPrompts
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-indigo-300 dark:border-indigo-700"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                }`}
                title="View suggested questions"
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
              </button>

              {/* Voice Input Mic Button */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`p-2 sm:p-2.5 rounded-xl border-2 transition-all flex-shrink-0 shrink-0 cursor-pointer flex items-center justify-center ${
                  isListening
                    ? "bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/30 ring-2 ring-rose-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title={isListening ? "Listening... Click to stop" : "Voice input (Speak question)"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Question Text Input Path */}
              <div className="relative flex-1 flex items-center min-w-0 w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={`Ask StudyMate AI (${PRESET_MODES.find((m) => m.id === selectedMode)?.label || "Tutor"})...`}
                  className="w-full pl-3 sm:pl-3.5 pr-8 sm:pr-9 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none shadow-inner transition-all"
                />
                {inputPrompt && (
                  <button
                    type="button"
                    onClick={() => setInputPrompt("")}
                    className="absolute right-2 sm:right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    title="Clear question"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Send Question Button */}
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="flex items-center justify-center px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/30 flex-shrink-0 shrink-0 cursor-pointer active:scale-95"
                title="Send study question"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="inline-block ml-1 sm:ml-1.5">Ask</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sidebar Chat Session Card Component
interface SidebarSessionCardProps {
  session: AIChatSession;
  isActive: boolean;
  subjects: Subject[];
  editingSessionId: string | null;
  editTitleInput: string;
  setEditTitleInput: (v: string) => void;
  onSelect: (id: string) => void;
  onStartRename: (session: AIChatSession, e?: React.MouseEvent) => void;
  onSaveRename: (id: string) => void;
  onCancelRename: () => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
}

const SidebarSessionCard: React.FC<SidebarSessionCardProps> = ({
  session,
  isActive,
  subjects,
  editingSessionId,
  editTitleInput,
  setEditTitleInput,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onTogglePin,
  onDelete,
}) => {
  const isEditing = editingSessionId === session.id;
  const subjectObj = subjects.find((s) => s.id === session.subjectId);

  const formattedDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(session.id)}
      className={`group relative p-2.5 rounded-2xl cursor-pointer transition-all border ${
        isActive
          ? "bg-indigo-500/10 dark:bg-indigo-950/70 border-indigo-500/40 text-indigo-900 dark:text-indigo-100 shadow-sm"
          : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Title / Inline Rename Input */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSaveRename(session.id)}
                className="w-full px-2 py-0.5 text-xs font-medium rounded bg-white dark:bg-slate-900 border border-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                autoFocus
              />
              <button
                onClick={() => onSaveRename(session.id)}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onCancelRename}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="font-semibold text-xs leading-snug truncate">
              {session.title}
            </div>
          )}

          {/* Subtitle Details: Subject badge + Date */}
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
            {subjectObj && (
              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 font-medium text-slate-600 dark:text-slate-300 truncate max-w-[90px]">
                {subjectObj.name}
              </span>
            )}
            <span>{formattedDate(session.updatedAt)}</span>
            <span>•</span>
            <span>{session.messages.length} msgs</span>
          </div>
        </div>

        {/* Action Buttons (Pin, Rename, Delete) */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => onTogglePin(session.id, e)}
              className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                session.isPinned ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
              }`}
              title={session.isPinned ? "Unpin session" : "Pin session"}
            >
              {session.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => onStartRename(session, e)}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Rename session"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => onDelete(session.id, e)}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              title="Delete session"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
