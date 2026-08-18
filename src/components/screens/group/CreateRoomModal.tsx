import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  X,
  Sparkles,
  Shield,
  Lock,
  Globe,
  Dices,
  BookOpen,
  Timer,
  FileText,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Play,
  Zap,
  MessageSquare,
  Headphones,
} from "lucide-react";
import {
  GroupRoomType,
  Subject,
  UserProfile,
  GroupStudySession,
  GroupStudyParticipant,
  GroupStudyChatMessage,
} from "../../../types";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  subjects: Subject[];
  onRoomCreated: (newRoom: GroupStudySession) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  user,
  subjects,
  onRoomCreated,
}) => {
  const initialSubjectName = subjects && subjects.length > 0 ? subjects[0].name : "General Coursework";
  const initialSubjectId = subjects && subjects.length > 0 ? subjects[0].id : "s_general";

  const [createTitle, setCreateTitle] = useState(`${initialSubjectName} Focus Sprint`);
  const [createSubjectId, setCreateSubjectId] = useState(initialSubjectId);
  const [createCustomSubjectName, setCreateCustomSubjectName] = useState("");
  const [createRoomType, setCreateRoomType] = useState<GroupRoomType>("pomodoro");
  const [createMaxParticipants, setCreateMaxParticipants] = useState<number>(8);
  const [createDescription, setCreateDescription] = useState("");
  const [createCustomCode, setCreateCustomCode] = useState("");
  const [createTimerDuration, setCreateTimerDuration] = useState<number>(25);
  const [createRequireApproval, setCreateRequireApproval] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Initialize smart default title when opened
  useEffect(() => {
    if (isOpen) {
      setIsLaunching(false);
      setErrorMessage("");
      const subName = subjects && subjects.length > 0 ? subjects[0].name : "General Coursework";
      if (!createTitle.trim()) {
        setCreateTitle(`${subName} Focus Sprint`);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickPresets = [
    {
      type: "pomodoro" as GroupRoomType,
      label: "⚡ 25m Pomodoro Sprint",
      duration: 25,
      icon: Zap,
    },
    {
      type: "discussion" as GroupRoomType,
      label: "💬 Group Discussion & Q&A",
      duration: 45,
      icon: MessageSquare,
    },
    {
      type: "quiz_challenge" as GroupRoomType,
      label: "🎯 Quiz & Flashcards",
      duration: 30,
      icon: Sparkles,
    },
    {
      type: "silent_focus" as GroupRoomType,
      label: "🤫 Silent Study Hall",
      duration: 60,
      icon: Headphones,
    },
  ];

  const quickTitleSuggestions = [
    "⚡ Midterm Review Sprint",
    "📚 Problem Set & Homework Hub",
    "🧠 Active Recall & Flashcards",
    "💬 Group Discussion & Q&A",
    "🚀 Deep Work Focus Block",
  ];

  const handleApplyPreset = (preset: typeof quickPresets[0]) => {
    setCreateRoomType(preset.type);
    setCreateTimerDuration(preset.duration);
    const subName =
      createSubjectId === "custom"
        ? createCustomSubjectName || "Study"
        : subjects?.find((s) => s.id === createSubjectId)?.name || "Coursework";
    setCreateTitle(`${subName}: ${preset.label.replace(/^[^a-zA-Z0-9]+/, "")}`);
    setErrorMessage("");
  };

  const handleGenerateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateCustomCode(result);
  };

  const handleSubjectChange = (newSubjectId: string) => {
    setCreateSubjectId(newSubjectId);
    setErrorMessage("");
    if (newSubjectId !== "custom") {
      const selected = subjects?.find((s) => s.id === newSubjectId);
      if (selected) {
        setCreateTitle(`${selected.name} Focus Sprint`);
      }
    }
  };

  const handleLaunchRoom = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isLaunching) return;
    setErrorMessage("");

    try {
      setIsLaunching(true);

      let subjectName = "General Coursework";
      if (createSubjectId === "custom") {
        subjectName = createCustomSubjectName.trim() || "Custom Study Group";
      } else {
        const selected = subjects?.find((s) => s.id === createSubjectId);
        if (selected) {
          subjectName = selected.name;
        }
      }

      // Automatically fallback to smart title if empty so creation never fails
      const finalTitle = createTitle.trim() || `${subjectName} Live Study Room`;

      const generatedCode =
        createCustomCode.trim().toUpperCase() ||
        `${subjectName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "FOCUS"}-${Math.floor(
          100 + Math.random() * 900
        )}`;

      const hostParticipant: GroupStudyParticipant = {
        id: user?.id || `u_${Date.now()}`,
        name: user?.name || "Study Host",
        avatarUrl:
          user?.avatarUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "Host")}`,
        role: "host",
        status: "studying",
        isMuted: false,
        joinedAt: new Date().toISOString(),
      };

      const initialSystemMsg: GroupStudyChatMessage = {
        id: `sys_${Date.now()}`,
        senderId: "system",
        senderName: "StudyMate Bot",
        text: `Live Study Room launched by ${user?.name || "Host"}. Share room code "${generatedCode}" with classmates!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "system",
      };

      const newRoom: GroupStudySession = {
        id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        code: generatedCode,
        title: finalTitle,
        subjectId: createSubjectId,
        subjectName: subjectName,
        description: createDescription.trim() || `Collaborative ${createRoomType} study session.`,
        hostId: user?.id || `u_${Date.now()}`,
        hostName: user?.name || "Study Host",
        hostAvatar:
          user?.avatarUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "Host")}`,
        roomType: createRoomType,
        maxParticipants: Number(createMaxParticipants) || 8,
        currentParticipants: [hostParticipant],
        isLive: true,
        requireApproval: createRequireApproval,
        pendingRequests: [],
        createdDate: new Date().toISOString(),
        sharedNotesPad: `# ${finalTitle}\n\n**Topic:** ${subjectName}\n**Host:** ${user?.name || "Student"}\n\nCollaboratively type study notes and key takeaways here. All members can edit in real time!`,
        timerState: {
          isRunning: false,
          mode: "focus",
          secondsLeft: createTimerDuration * 60,
        },
        chatMessages: [initialSystemMsg],
      };

      onRoomCreated(newRoom);
      onClose();
    } catch (err: any) {
      console.error("Error launching room:", err);
      setErrorMessage(err?.message || "Failed to launch room. Please try again.");
      setIsLaunching(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95">
        
        {/* Sticky Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 sm:p-6 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Set Up Your Live Study Room
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Sync focus timers, share notes, and study with classmates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 custom-scrollbar">
          
          {/* Quick Preset Buttons for Instant 1-Click Setup */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick 1-Click Room Presets:</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Auto-fills configuration</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickPresets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = createRoomType === preset.type && createTimerDuration === preset.duration;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2.5 rounded-xl text-left transition-all text-xs font-bold flex flex-col items-start gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-indigo-500"}`} />
                    <span className="leading-tight text-[11px]">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 1: ROOM TITLE */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-indigo-500/30 dark:border-indigo-500/40 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Room Title</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ml-1">
                  Required
                </span>
              </label>
            </div>

            <input
              ref={titleInputRef}
              type="text"
              value={createTitle}
              onChange={(e) => {
                setCreateTitle(e.target.value);
                setErrorMessage("");
              }}
              placeholder="e.g. Calculus Midterm Problem Set Sprint"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-xs"
            />

            {/* Quick Title Suggestion Pills */}
            <div className="pt-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Quick Title Presets:
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickTitleSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setCreateTitle(suggestion);
                      setErrorMessage("");
                    }}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: COURSE SUBJECT & ROOM TYPE */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Course Subject & Room Type</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Select category
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Subject Category
                </label>
                <select
                  value={createSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects && subjects.length > 0 ? (
                    subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  ) : (
                    <option value="s_general">General Coursework</option>
                  )}
                  <option value="custom">+ Custom Subject Name</option>
                </select>
              </div>

              {createSubjectId === "custom" ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Custom Subject Name
                  </label>
                  <input
                    type="text"
                    value={createCustomSubjectName}
                    onChange={(e) => {
                      setCreateCustomSubjectName(e.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="e.g. Molecular Biology"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Format & Activity
                  </label>
                  <select
                    value={createRoomType}
                    onChange={(e) => setCreateRoomType(e.target.value as GroupRoomType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pomodoro">Pomodoro Focus Room</option>
                    <option value="discussion">Discussion & Q&A</option>
                    <option value="quiz_challenge">Quiz & Flashcard Arena</option>
                    <option value="silent_focus">Silent Background Study</option>
                  </select>
                </div>
              )}
            </div>

            {createSubjectId === "custom" && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Format & Activity
                </label>
                <select
                  value={createRoomType}
                  onChange={(e) => setCreateRoomType(e.target.value as GroupRoomType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pomodoro">Pomodoro Focus Room</option>
                  <option value="discussion">Discussion & Q&A</option>
                  <option value="quiz_challenge">Quiz & Flashcard Arena</option>
                  <option value="silent_focus">Silent Background Study</option>
                </select>
              </div>
            )}
          </div>

          {/* SECTION 3: FOCUS DURATION & CAPACITY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Timer className="w-3.5 h-3.5 text-amber-500" />
                <span>Timer Duration</span>
              </label>
              <select
                value={createTimerDuration}
                onChange={(e) => setCreateTimerDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
              >
                <option value={15}>15 Minutes (Sprint)</option>
                <option value={25}>25 Minutes (Standard Pomodoro)</option>
                <option value={45}>45 Minutes (Extended Block)</option>
                <option value={50}>50 Minutes (Deep Focus)</option>
                <option value={60}>60 Minutes (Hour Sprint)</option>
                <option value={90}>90 Minutes (Deep Mastery)</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>Max Capacity</span>
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={createMaxParticipants}
                onChange={(e) => setCreateMaxParticipants(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
              />
            </div>
          </div>

          {/* SECTION 4: ACCESS SECURITY & APPROVAL MODE */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Join Security & Privacy Mode
              </label>
            </div>

            <div className="space-y-2 pt-1">
              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                !createRequireApproval
                  ? "bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 shadow-xs"
                  : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400"
              }`}>
                <input
                  type="radio"
                  name="approvalMode"
                  checked={createRequireApproval === false}
                  onChange={() => setCreateRequireApproval(false)}
                  className="mt-0.5 accent-indigo-600 w-4 h-4"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Open Access (Direct 1-Click Entry)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                    Classmates can click and join your study room immediately without needing host confirmation.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                createRequireApproval
                  ? "bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 shadow-xs"
                  : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400"
              }`}>
                <input
                  type="radio"
                  name="approvalMode"
                  checked={createRequireApproval === true}
                  onChange={() => setCreateRequireApproval(true)}
                  className="mt-0.5 accent-indigo-600 w-4 h-4"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Host Approval Required (or enter secret Room PIN)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                    Students submit a join request for you to approve, or they enter the 6-character room PIN.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION 5: CUSTOM ROOM JOIN CODE */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                <span>Room PIN / Join Code</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateRandomCode}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Generate Random PIN</span>
              </button>
            </div>
            <input
              type="text"
              value={createCustomCode}
              onChange={(e) => setCreateCustomCode(e.target.value.toUpperCase())}
              placeholder="e.g. FOCUS-77 or BIO-EXAM (or leave empty for auto-generated code)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* SECTION 6: STUDY GOALS / AGENDA */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Session Agenda / Study Goals (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="e.g. Reviewing chapters 4-6, practicing past midterm MCQs and proofs."
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Sticky Actions Bar - ALWAYS VISIBLE AT BOTTOM */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Ready to launch live room</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLaunching}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleLaunchRoom(e)}
              disabled={isLaunching}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{isLaunching ? "Launching Live Room..." : "Launch Live Room"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

