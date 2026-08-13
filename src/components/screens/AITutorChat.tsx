import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Subject, AIChatSession, AIChatMessage } from "../../types";
import { apiService } from "../../services/api";
import { audioSynth } from "../../services/audioSynth";
import { storageService } from "../../services/storage";

interface AITutorChatProps {
  subjects: Subject[];
  activeSubjectId?: string | null;
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

  // History panel & search states
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");

  // Rename modal / inline states
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState<string>("");

  // Delete confirmation state
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Chat UI state
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  // Send Message Logic
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading || !activeSession) return;

    const userMsg: AIChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mode: selectedMode,
    };

    // Check if title should be updated from "New Study Session"
    const isNewTitleNeeded =
      activeSession.title === "New Study Session" ||
      activeSession.messages.length <= 1;

    const newTitle = isNewTitleNeeded ? getAutoTitle(prompt) : activeSession.title;

    const updatedSessionWithUser: AIChatSession = {
      ...activeSession,
      title: newTitle,
      updatedAt: new Date().toISOString(),
      messages: [...activeSession.messages, userMsg],
    };

    // Update state immediately
    const nextSessions = sessions.map((s) =>
      s.id === activeSession.id ? updatedSessionWithUser : s
    );
    setSessions(nextSessions);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const history = activeSession.messages
        .filter((m) => !m.id.startsWith("msg_welcome"))
        .map((m) => ({ role: m.role, content: m.content }));

      const responseText = await apiService.askAITutor({
        prompt: prompt,
        mode: selectedMode as any,
        subject: selectedSubjectObj?.name,
        conversationHistory: history,
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
                messages: [...s.messages, aiMsg],
              }
            : s
        )
      );
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content:
          "I ran into an issue connecting to the tutor engine. Please check your connection or try again.",
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
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-7xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
      {/* Top Main Navigation Header */}
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* History Sidebar Toggle Button */}
          <button
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
              isHistoryOpen
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            }`}
            title={isHistoryOpen ? "Collapse Chat History" : "Expand Chat History"}
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline-block">History</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold">
              {sessions.length}
            </span>
          </button>

          <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Bot className="w-5 h-5" />
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
                    className="px-2 py-0.5 text-xs font-bold rounded bg-white dark:bg-slate-800 border border-indigo-500 text-slate-900 dark:text-slate-100 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveRename(activeSession.id)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingSessionId(null)}
                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0">
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                    {activeSession?.title || "AI Study Tutor"}
                  </h2>
                  <button
                    onClick={(e) => activeSession && handleStartRename(activeSession, e)}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md"
                    title="Rename chat session"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {activeSession?.messages.length || 0} messages • Created{" "}
              {activeSession ? formatSessionDate(activeSession.createdAt) : "Today"}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Subject Context Selector */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Subject:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 outline-none"
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
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Export Chat Transcript"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline-block">Export</span>
          </button>

          {/* New Session Quick Button */}
          <button
            onClick={handleCreateNewSession}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline-block">New Session</span>
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
          <div className="w-72 sm:w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col transition-all">
            {/* Sidebar Search & New Chat Header */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
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
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500"
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
        )}

        {/* CHAT MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 p-2.5 overflow-x-auto border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 pr-2">
            {PRESET_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                  title={mode.desc}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Stream Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {activeSession?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 max-w-3xl ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md"
                  }`}
                >
                  {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="group relative space-y-1 max-w-[85%] sm:max-w-[90%]">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
                        : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Message Footer Actions */}
                  <div
                    className={`flex items-center gap-2 text-[10px] text-slate-400 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.role === "assistant" && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => handleToggleSpeak(msg.id, msg.content)}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3 h-3 text-amber-500" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                          <span>{speakingId === msg.id ? "Stop Voice" : "Read Aloud"}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 max-w-xl mr-auto">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white animate-spin">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>StudyMate AI is generating your response...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
              Try:
            </span>
            {QUICK_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(promptText)}
                className="px-2.5 py-1 rounded-full text-xs bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 whitespace-nowrap transition-all"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input Form Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Input Mic Button */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                }`}
                title="Voice input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={`Ask StudyMate AI (${PRESET_MODES.find((m) => m.id === selectedMode)?.label})...`}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="flex items-center justify-center p-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-2">Send</span>
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
