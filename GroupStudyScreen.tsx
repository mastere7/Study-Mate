import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Plus,
  Search,
  KeyRound,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  FileText,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ArrowLeft,
  Crown,
  Sparkles,
  Zap,
  Timer,
  HelpCircle,
  Radio,
  BookOpen,
  Share2,
  X,
  ShieldCheck,
  Send,
  Flame,
  Lightbulb,
  CheckCircle2,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Tv,
  Video,
  VideoOff,
} from "lucide-react";
import {
  GroupStudySession,
  GroupStudyParticipant,
  GroupStudyChatMessage,
  GroupRoomType,
  Subject,
  UserProfile,
  Note,
  Quiz,
  FlashcardDeck,
} from "../../types";

interface GroupStudyScreenProps {
  user: UserProfile;
  subjects: Subject[];
  notes: Note[];
  quizzes: Quiz[];
  decks: FlashcardDeck[];
  groupSessions: GroupStudySession[];
  onSaveGroupSessions: (sessions: GroupStudySession[]) => void;
  onSaveNotes: (notes: Note[]) => void;
}

export const GroupStudyScreen: React.FC<GroupStudyScreenProps> = ({
  user,
  subjects,
  notes,
  quizzes,
  decks,
  groupSessions,
  onSaveGroupSessions,
  onSaveNotes,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [joinCodeError, setJoinCodeError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createTitle, setCreateTitle] = useState<string>("");
  const [createSubjectId, setCreateSubjectId] = useState<string>(subjects[0]?.id || "");
  const [createRoomType, setCreateRoomType] = useState<GroupRoomType>("pomodoro");
  const [createMaxParticipants, setCreateMaxParticipants] = useState<number>(8);
  const [createDescription, setCreateDescription] = useState<string>("");
  const [createCustomCode, setCreateCustomCode] = useState<string>("");

  // Active Room state
  const [activeRoomTab, setActiveRoomTab] = useState<"timer" | "notes" | "chat" | "screenshare">("timer");
  const [sharedNotesPad, setSharedNotesPad] = useState<string>("");
  const [chatInput, setChatInput] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Screen Share State
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false);
  const [isSimulatedScreen, setIsSimulatedScreen] = useState<boolean>(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [isScreenFullScreen, setIsScreenFullScreen] = useState<boolean>(false);
  const [presenterSlide, setPresenterSlide] = useState<number>(1);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Group Timer State
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(25 * 60);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeRoom = groupSessions.find((r) => r.id === activeRoomId);

  // Sync room states on join
  useEffect(() => {
    if (activeRoom) {
      setSharedNotesPad(activeRoom.sharedNotesPad || "");
      if (activeRoom.timerState) {
        setTimerRunning(activeRoom.timerState.isRunning);
        setTimerMode(activeRoom.timerState.mode);
        setTimerSecondsLeft(activeRoom.timerState.secondsLeft);
      }
    }
  }, [activeRoomId]);

  // Group Timer interval effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && timerRunning) {
      setTimerRunning(false);
      // Switch mode
      if (timerMode === "focus") {
        setTimerMode("break");
        setTimerSecondsLeft(5 * 60);
      } else {
        setTimerMode("focus");
        setTimerSecondsLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSecondsLeft, timerMode]);

  // Attach screen stream to video element when active
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, activeRoomTab]);

  // Clean up media tracks on unmount or room leave
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [screenStream]);

  // Handle Start / Stop Screen Sharing via WebRTC / Display Media API
  const handleToggleScreenShare = async () => {
    if (isSharingScreen) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setScreenStream(null);
      setIsSharingScreen(false);
      setIsSimulatedScreen(false);
      return;
    }

    setScreenShareError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Display Media API is not supported in this browser version.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: true,
      });

      setScreenStream(stream);
      setIsSharingScreen(true);
      setIsSimulatedScreen(false);
      setActiveRoomTab("screenshare");

      // Handle native browser "Stop sharing" bar click
      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setIsSharingScreen(false);
        setIsSimulatedScreen(false);
      };
    } catch (err: any) {
      console.warn("Screen share notice:", err);
      const errMessage = String(err?.message || err);
      const isPolicyRestriction =
        errMessage.includes("permissions policy") ||
        errMessage.includes("display-capture") ||
        err?.name === "NotAllowedError" ||
        err?.name === "SecurityError";

      if (isPolicyRestriction) {
        setScreenShareError(
          "Screen capture is restricted inside embedded iframe previews by browser security policies. You can open the app in a new tab for native WebRTC screen sharing, or launch the interactive Study Presenter below."
        );
      } else if (err?.name !== "AbortError") {
        setScreenShareError(
          "Screen sharing permission was not granted. You can open the app in a new tab or use the interactive study presenter."
        );
      }
    }
  };

  const handleStartSimulatedPresenter = () => {
    setIsSharingScreen(true);
    setIsSimulatedScreen(true);
    setScreenShareError(null);
    setActiveRoomTab("screenshare");
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.chatMessages]);

  // Handle Joining a Session by Code or Click
  const handleJoinByCode = (codeToJoin?: string) => {
    const code = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!code) {
      setJoinCodeError("Please enter a room code (e.g. CS101-SYNC)");
      return;
    }

    const room = groupSessions.find((r) => r.code.toUpperCase() === code || r.id === code);
    if (!room) {
      setJoinCodeError(`No active room found with code "${code}". Check code and try again.`);
      return;
    }

    setJoinCodeError("");

    // Check if student is already in participants
    const existing = room.currentParticipants.find((p) => p.id === user.id);
    if (!existing) {
      const newParticipant: GroupStudyParticipant = {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: "member",
        status: "studying",
        isMuted: false,
        joinedAt: new Date().toISOString(),
      };

      const systemMsg: GroupStudyChatMessage = {
        id: `sys_${Date.now()}`,
        senderId: "system",
        senderName: "StudyMate Bot",
        text: `${user.name} joined the study room! 👋`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "system",
      };

      const updatedRoom: GroupStudySession = {
        ...room,
        currentParticipants: [...room.currentParticipants, newParticipant],
        chatMessages: [...room.chatMessages, systemMsg],
      };

      const updatedList = groupSessions.map((r) => (r.id === room.id ? updatedRoom : r));
      onSaveGroupSessions(updatedList);
    }

    setActiveRoomId(room.id);
    setJoinCodeInput("");
  };

  // Handle Creating a New Group Session
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    const selectedSubject = subjects.find((s) => s.id === createSubjectId);
    const generatedCode =
      createCustomCode.trim().toUpperCase() ||
      `${selectedSubject?.name.substring(0, 3).toUpperCase() || "STUDY"}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const hostParticipant: GroupStudyParticipant = {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: "host",
      status: "studying",
      isMuted: false,
      joinedAt: new Date().toISOString(),
    };

    const initialSystemMsg: GroupStudyChatMessage = {
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "StudyMate Bot",
      text: `Group Study Room created by ${user.name}. Share code "${generatedCode}" with classmates!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "system",
    };

    const newRoom: GroupStudySession = {
      id: `room_${Date.now()}`,
      code: generatedCode,
      title: createTitle.trim(),
      subjectId: createSubjectId,
      subjectName: selectedSubject?.name || "General Study",
      description: createDescription.trim() || "Collaborative student study section.",
      hostId: user.id,
      hostName: user.name,
      hostAvatar: user.avatarUrl,
      roomType: createRoomType,
      maxParticipants: Number(createMaxParticipants),
      currentParticipants: [hostParticipant],
      isLive: true,
      createdDate: new Date().toISOString(),
      sharedNotesPad: `# ${createTitle}\n\nWelcome to our group study room! Collaboratively type study notes and key points here.`,
      timerState: {
        isRunning: false,
        mode: "focus",
        secondsLeft: 25 * 60,
      },
      chatMessages: [initialSystemMsg],
    };

    const updatedList = [newRoom, ...groupSessions];
    onSaveGroupSessions(updatedList);
    setIsCreateModalOpen(false);

    // Reset Form
    setCreateTitle("");
    setCreateDescription("");
    setCreateCustomCode("");

    // Join the newly created room immediately
    setActiveRoomId(newRoom.id);
  };

  // Leave active room
  const handleLeaveRoom = () => {
    if (!activeRoom) {
      setActiveRoomId(null);
      return;
    }

    const updatedParticipants = activeRoom.currentParticipants.filter((p) => p.id !== user.id);
    const leaveMsg: GroupStudyChatMessage = {
      id: `sys_leave_${Date.now()}`,
      senderId: "system",
      senderName: "StudyMate Bot",
      text: `${user.name} left the study room.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "system",
    };

    const updatedRoom: GroupStudySession = {
      ...activeRoom,
      currentParticipants: updatedParticipants,
      chatMessages: [...activeRoom.chatMessages, leaveMsg],
    };

    const updatedList = groupSessions.map((r) => (r.id === activeRoom.id ? updatedRoom : r));
    onSaveGroupSessions(updatedList);
    setActiveRoomId(null);
  };

  // Send message in room chat
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || !activeRoom) return;

    const newMsg: GroupStudyChatMessage = {
      id: `m_${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "chat",
    };

    const updatedRoom: GroupStudySession = {
      ...activeRoom,
      chatMessages: [...activeRoom.chatMessages, newMsg],
    };

    const updatedList = groupSessions.map((r) => (r.id === activeRoom.id ? updatedRoom : r));
    onSaveGroupSessions(updatedList);
    setChatInput("");
  };

  // Quick Emote reactions
  const handleSendEmote = (emoji: string, label: string) => {
    handleSendMessage(`${emoji} ${label}`);
  };

  // Save shared pad to my personal smart notes
  const handleSavePadToNotes = () => {
    if (!activeRoom || !sharedNotesPad.trim()) return;

    const newNote: Note = {
      id: `note_group_${Date.now()}`,
      userId: user.id,
      subjectId: activeRoom.subjectId || subjects[0]?.id || "s_cs101",
      title: `Group Study Notes: ${activeRoom.title}`,
      content: sharedNotesPad,
      isPinned: true,
      tags: ["Group Study", activeRoom.subjectName, `Room: ${activeRoom.code}`],
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0],
    };

    onSaveNotes([newNote, ...notes]);
    alert(`Saved group study notes to your personal Smart Notes! 📝`);
  };

  // Copy Code to Clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Format Timer output
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Filtered rooms list for directory view
  const filteredRooms = groupSessions.filter((room) => {
    const matchesSearch =
      room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || room.roomType === filterType;
    return matchesSearch && matchesFilter;
  });

  // -------------------------------------------------------------
  // VIEW 1: ACTIVE GROUP ROOM EXPERIENCE (Inside a Joined Room)
  // -------------------------------------------------------------
  if (activeRoom) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Room Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-5 sm:p-6 text-white border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Room</span>
              </button>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Session
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/30 text-indigo-200 text-xs font-semibold">
                {activeRoom.subjectName}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <span>{activeRoom.title}</span>
            </h2>
            <p className="text-xs text-indigo-200/80 max-w-2xl">{activeRoom.description}</p>
          </div>

          {/* Join Code Badge & Controls */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-900/80 border border-indigo-400/40">
              <div className="text-left">
                <p className="text-[9px] uppercase font-bold text-indigo-300">Room Join Code</p>
                <p className="text-sm font-mono font-extrabold tracking-wider text-white">
                  {activeRoom.code}
                </p>
              </div>
              <button
                onClick={() => handleCopyCode(activeRoom.code)}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all ml-1"
                title="Copy Join Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleToggleScreenShare}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border ${
                isSharingScreen
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30 animate-pulse"
                  : "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30"
              }`}
            >
              {isSharingScreen ? <MonitorOff className="w-4 h-4 text-rose-300" /> : <Monitor className="w-4 h-4 text-indigo-300" />}
              <span>{isSharingScreen ? "Stop Sharing" : "Share Screen"}</span>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all border ${
                isMuted
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isMuted ? "Muted" : "Mic Live"}</span>
            </button>
          </div>
        </div>

        {/* Main Room Workspace Grid (Left: Active Tab Content, Right: Roster & Live Chat) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Workspace Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setActiveRoomTab("timer")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
                  activeRoomTab === "timer"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                }`}
              >
                <Timer className="w-4 h-4" />
                <span>Focus Timer</span>
              </button>

              <button
                onClick={() => setActiveRoomTab("notes")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
                  activeRoomTab === "notes"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Shared Notes</span>
              </button>

              <button
                onClick={() => setActiveRoomTab("screenshare")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all relative ${
                  activeRoomTab === "screenshare"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Live Screen Share</span>
                {isSharingScreen && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse absolute top-2 right-2" />
                )}
              </button>
            </div>

            {/* TAB 1: GROUP POMODORO & FOCUS TIMER */}
            {activeRoomTab === "timer" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {timerMode === "focus" ? "25-Minute Synced Focus Session" : "5-Minute Group Break"}
                  </span>
                </div>

                {/* Big Timer Circle Display */}
                <div className="relative w-56 h-56 mx-auto flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-800 dark:to-indigo-950/50 border-4 border-indigo-500/30 shadow-inner">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                    {formatTimer(timerSecondsLeft)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2">
                    {timerRunning ? "Focusing Together 🧠" : "Timer Paused"}
                  </span>
                </div>

                {/* Timer Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all"
                  >
                    {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                    <span>{timerRunning ? "Pause Timer" : "Start Group Session"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSecondsLeft(timerMode === "focus" ? 25 * 60 : 5 * 60);
                    }}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                {/* Live Member Status Grid */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
                  <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-3 tracking-wider">
                    Member Live Focus Status
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeRoom.currentParticipants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.avatarUrl ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                            }
                            alt={p.name}
                            className="w-8 h-8 rounded-full object-cover border border-indigo-400"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              <span>{p.name}</span>
                              {p.role === "host" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                            </p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active Studying
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {p.isMuted ? "Muted" : "Audio On"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SHARED COLLABORATIVE STUDY NOTES */}
            {activeRoomTab === "notes" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Collaborative Room Note Pad</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Type real-time shared notes, formulas, and bullet points with all members.
                    </p>
                  </div>
                  <button
                    onClick={handleSavePadToNotes}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save to My Notes</span>
                  </button>
                </div>

                <textarea
                  value={sharedNotesPad}
                  onChange={(e) => setSharedNotesPad(e.target.value)}
                  placeholder="Type shared study notes here..."
                  className="w-full h-80 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                />
              </div>
            )}

            {/* TAB 3: LIVE SCREEN SHARE & PRESENTATION CANVAS */}
            {activeRoomTab === "screenshare" && (
              <div className="bg-slate-950 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4 text-white">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Tv className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Live Screen Presentation</span>
                        {isSharingScreen && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            Broadcasting Live
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Share your entire screen, application window, or browser tab with study members.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSharingScreen && (
                      <button
                        onClick={() => setIsScreenFullScreen(!isScreenFullScreen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700"
                      >
                        {isScreenFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        <span>{isScreenFullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                      </button>
                    )}

                    <button
                      onClick={handleToggleScreenShare}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                        isSharingScreen
                          ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                      }`}
                    >
                      {isSharingScreen ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                      <span>{isSharingScreen ? "Stop Screen Share" : "Start Sharing Screen"}</span>
                    </button>
                  </div>
                </div>

                {screenShareError && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-medium space-y-3">
                    <p className="leading-relaxed">{screenShareError}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => window.open(window.location.href, "_blank")}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>Open App in New Tab</span>
                      </button>
                      <button
                        onClick={handleStartSimulatedPresenter}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 flex items-center gap-1.5"
                      >
                        <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Launch Study Presenter Mode</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Video / Presenter Viewport */}
                <div
                  className={`relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center transition-all ${
                    isScreenFullScreen ? "fixed inset-4 z-50 h-auto bg-slate-950" : "min-h-[380px] sm:min-h-[440px]"
                  }`}
                >
                  {isSharingScreen ? (
                    <div className="w-full h-full relative flex flex-col items-center justify-center p-4">
                      {screenStream ? (
                        <video
                          ref={screenVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full max-h-[500px] object-contain rounded-2xl"
                        />
                      ) : (
                        /* Interactive Simulated Presenter Canvas for Embedded Frame Preview */
                        <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl my-2">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold uppercase">
                                Slide {presenterSlide} / 3
                              </span>
                              <h5 className="font-bold text-sm text-slate-100">
                                {presenterSlide === 1 && "Computer Science 101: Data Structures"}
                                {presenterSlide === 2 && "Algorithm Complexity & Big O Analysis"}
                                {presenterSlide === 3 && "Live Code Workspace & Pseudocode Sandbox"}
                              </h5>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setPresenterSlide((s) => Math.max(1, s - 1))}
                                disabled={presenterSlide === 1}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold disabled:opacity-40"
                              >
                                Prev
                              </button>
                              <button
                                onClick={() => setPresenterSlide((s) => Math.min(3, s + 1))}
                                disabled={presenterSlide === 3}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold disabled:opacity-40"
                              >
                                Next
                              </button>
                            </div>
                          </div>

                          {presenterSlide === 1 && (
                            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                              <div className="p-3 bg-indigo-950/50 border border-indigo-800/40 rounded-xl text-indigo-200">
                                💡 <strong>Core Concept:</strong> Binary Search Trees require O(log n) time complexity for search, insertion, and deletion when balanced.
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-slate-400">
                                <li>Root node contains key greater than left subtree keys</li>
                                <li>Right subtree keys are strictly greater than root key</li>
                                <li>In-order traversal yields sorted sequence in ascending order</li>
                              </ul>
                            </div>
                          )}

                          {presenterSlide === 2 && (
                            <div className="space-y-3 text-xs text-slate-300">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">Time Complexity</p>
                                  <p className="text-base font-extrabold text-emerald-400 mt-1">O(n log n)</p>
                                  <p className="text-[10px] text-slate-400">MergeSort / QuickSort</p>
                                </div>
                                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">Space Complexity</p>
                                  <p className="text-base font-extrabold text-indigo-400 mt-1">O(n)</p>
                                  <p className="text-[10px] text-slate-400">Auxiliary Array Space</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {presenterSlide === 3 && (
                            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 space-y-1">
                              <p className="text-slate-500">// Live Pseudocode Demonstration</p>
                              <p><span className="text-rose-400">function</span> <span className="text-yellow-300">binarySearch</span>(arr, target) &#123;</p>
                              <p className="pl-4"><span className="text-rose-400">let</span> left = 0, right = arr.length - 1;</p>
                              <p className="pl-4"><span className="text-rose-400">while</span> (left &lt;= right) &#123; ... &#125;</p>
                              <p>&#123;</p>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 text-center pt-2">
                            ✨ Study Presenter Broadcasting active to all room members
                          </div>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold text-white">
                        <img
                          src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                          alt={user.name}
                          className="w-5 h-5 rounded-full object-cover border border-indigo-400"
                        />
                        <span>{user.name} ({screenStream ? "Presenting Live Screen" : "Presenting Study Canvas"})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 space-y-4 max-w-md mx-auto">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                        <Monitor className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white">No Screen Currently Being Shared</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Click <strong className="text-indigo-300">"Start Sharing Screen"</strong> to present slides, code editor, or documents to all room members in real-time.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={handleToggleScreenShare}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                        >
                          <Monitor className="w-4 h-4" />
                          <span>Share Screen</span>
                        </button>
                        <button
                          onClick={handleStartSimulatedPresenter}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700"
                        >
                          <Tv className="w-4 h-4 text-indigo-400" />
                          <span>Study Presenter Canvas</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Active Room Chat & Participant Roster (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Room Chat Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col h-[560px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Live Room Chat
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {activeRoom.currentParticipants.length} Online
                </span>
              </div>

              {/* Chat Messages Scroll Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {activeRoom.chatMessages.map((msg) => {
                  if (msg.type === "system" || msg.type === "timer_alert") {
                    return (
                      <div
                        key={msg.id}
                        className="text-center my-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 py-1.5 px-3 rounded-full border border-indigo-200/50 dark:border-indigo-800/50"
                      >
                        ⚡ {msg.text}
                      </div>
                    );
                  }

                  const isMe = msg.senderId === user.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[9px] text-slate-400 mb-0.5 font-medium px-1">
                        {msg.senderName} • {msg.timestamp}
                      </span>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-tr-none shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Reactions Bar */}
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                <button
                  onClick={() => handleSendEmote("🔥", "Great focus!")}
                  className="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-all"
                  title="Flame reaction"
                >
                  🔥
                </button>
                <button
                  onClick={() => handleSendEmote("👏", "Awesome job!")}
                  className="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-all"
                >
                  👏
                </button>
                <button
                  onClick={() => handleSendEmote("💡", "Got a key insight!")}
                  className="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-all"
                >
                  💡
                </button>
                <button
                  onClick={() => handleSendEmote("❓", "Quick question!")}
                  className="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-all"
                >
                  ❓
                </button>
                <button
                  onClick={() => handleSendEmote("⏱️", "Pomodoro break!")}
                  className="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-all"
                >
                  ⏱️
                </button>
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type message..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: GROUP STUDY DIRECTORY & ROOM CREATOR / JOINER HUB
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
              Student Virtual Study Rooms
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Group Study & Collaborative Rooms</span>
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl leading-relaxed">
            Create or join virtual study rooms with your classmates. Sync focus timers, collaborate on live study notes, and share quizzes in real time!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Study Room</span>
          </button>
        </div>
      </div>

      {/* QUICK JOIN BAR BY CODE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Have a Room Code?
              </h4>
              <p className="text-xs text-slate-500">
                Enter your classmate’s 6-character study code to join immediately
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => {
                setJoinCodeInput(e.target.value);
                setJoinCodeError("");
              }}
              placeholder="e.g. CS101-SYNC or SQL-8920"
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700"
            />
            <button
              onClick={() => handleJoinByCode()}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all shrink-0"
            >
              Join Session
            </button>
          </div>
        </div>
        {joinCodeError && (
          <p className="text-xs text-rose-500 font-semibold mt-2 pl-2">{joinCodeError}</p>
        )}
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active study rooms by subject, topic, or host..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        {/* Room Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: "all", label: "All Rooms" },
            { id: "pomodoro", label: "Focus (Pomodoro)" },
            { id: "discussion", label: "Collaborative" },
            { id: "quiz_challenge", label: "Quiz Arena" },
            { id: "silent_focus", label: "Silent Study" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === type.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* ROOMS DIRECTORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
              No Group Study Rooms Found
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Be the first student to create a live study room and invite classmates!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Room</span>
            </button>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isFull = room.currentParticipants.length >= room.maxParticipants;
            const isMember = room.currentParticipants.some((p) => p.id === user.id);

            return (
              <div
                key={room.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Tags */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase">
                      {room.subjectName}
                    </span>

                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE NOW
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-2">
                    {room.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {room.description}
                  </p>

                  {/* Host & Avatars */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          room.hostAvatar ||
                          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                        }
                        alt={room.hostName}
                        className="w-7 h-7 rounded-full object-cover border border-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Host: {room.hostName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        {room.currentParticipants.length} / {room.maxParticipants}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Join Action */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg">
                    Code: {room.code}
                  </span>

                  <button
                    onClick={() => handleJoinByCode(room.code)}
                    disabled={isFull && !isMember}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isMember
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : isFull
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    }`}
                  >
                    {isMember ? "Enter Active Room" : isFull ? "Room Full" : "Join Room"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE GROUP ROOM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Create Group Study Room
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              {/* Room Title */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Room Title *
                </label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Computer Networks TCP Handshake Session"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Subject Select */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Course Subject
                  </label>
                  <select
                    value={createSubjectId}
                    onChange={(e) => setCreateSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Room Type
                  </label>
                  <select
                    value={createRoomType}
                    onChange={(e) => setCreateRoomType(e.target.value as GroupRoomType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pomodoro">Pomodoro Focus Room</option>
                    <option value="discussion">Discussion & Q&A</option>
                    <option value="quiz_challenge">Quiz & Flashcard Arena</option>
                    <option value="silent_focus">Silent Background Study</option>
                  </select>
                </div>
              </div>

              {/* Max Capacity & Custom Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="25"
                    value={createMaxParticipants}
                    onChange={(e) => setCreateMaxParticipants(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Custom Room Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={createCustomCode}
                    onChange={(e) => setCreateCustomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CS101-ROOM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Study Goals & Description
                </label>
                <textarea
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="What topics will you be covering in this session?"
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
                >
                  Launch Study Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
