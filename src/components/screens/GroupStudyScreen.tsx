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
  BookOpen,
  Share2,
  X,
  Send,
  Flame,
  Lightbulb,
  CheckCircle2,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Tv,
  Trash2,
  Coffee,
  Headphones,
  Sliders,
  AlertCircle,
  HelpCircle,
  Radio,
  Clock,
  Layers,
  Sparkle,
  ShieldCheck,
  UserCheck,
  UserX,
  Lock,
} from "lucide-react";
import {
  GroupStudySession,
  GroupStudyParticipant,
  GroupStudyChatMessage,
  GroupJoinRequest,
  GroupRoomType,
  Subject,
  UserProfile,
  Note,
  Quiz,
  FlashcardDeck,
} from "../../types";
import { audioSynthService } from "../../services/audioSynth";
import { CreateRoomModal } from "./group/CreateRoomModal";
import { JoinCodeModal } from "./group/JoinCodeModal";
import { HostRequestsPanel } from "./group/HostRequestsPanel";
import { GroupRoomCard } from "./group/GroupRoomCard";

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [codeModalRoom, setCodeModalRoom] = useState<GroupStudySession | null>(null);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState<boolean>(false);

  // Active Room state
  const [activeRoomTab, setActiveRoomTab] = useState<"timer" | "notes" | "chat" | "screenshare" | "requests">("timer");
  const [sharedNotesPad, setSharedNotesPad] = useState<string>("");
  const [chatInput, setChatInput] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeAmbient, setActiveAmbient] = useState<string>("none");
  const [ambientVolume, setAmbientVolume] = useState<number>(0.3);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

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
      audioSynthService.playChime("bell");
      if (timerMode === "focus") {
        setTimerMode("break");
        setTimerSecondsLeft(5 * 60);
        showToast("Focus interval complete! Time for a 5-minute break. ☕");
      } else {
        setTimerMode("focus");
        setTimerSecondsLeft(25 * 60);
        showToast("Break over! Ready for the next focus sprint? ⚡");
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

  // Clean up media tracks & audio on unmount or room leave
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      audioSynthService.stopAmbient();
    };
  }, [screenStream]);

  // Handle Ambient Audio in active room
  const handleToggleAmbient = (soundType: string) => {
    if (activeAmbient === soundType) {
      audioSynthService.stopAmbient();
      setActiveAmbient("none");
    } else {
      audioSynthService.stopAmbient();
      if (soundType !== "none") {
        audioSynthService.playAmbient(soundType, ambientVolume);
      }
      setActiveAmbient(soundType);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    if (activeAmbient !== "none") {
      audioSynthService.setAmbientVolume(vol);
    }
  };

  // Handle Screen Sharing via Display Media API
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
        throw new Error("Display Media API is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: true,
      });

      setScreenStream(stream);
      setIsSharingScreen(true);
      setIsSimulatedScreen(false);
      setActiveRoomTab("screenshare");

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
          "Screen capture inside iframe previews is guarded by browser policies. You can open the app in a new tab for native WebRTC screen sharing, or launch the interactive Study Presenter mode."
        );
      } else if (err?.name !== "AbortError") {
        setScreenShareError(
          "Screen sharing was cancelled or unavailable. Use the interactive Study Presenter below."
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

  // Handle Joining a Session by Code (Instant admission)
  const handleJoinByCode = (codeToJoin?: string) => {
    const code = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!code) {
      setJoinCodeError("Please enter a 6-character room code (e.g. FOCUS-123 or BIO-404)");
      return;
    }

    const room = groupSessions.find(
      (r) => r.code.toUpperCase() === code || r.id.toUpperCase() === code
    );
    if (!room) {
      setJoinCodeError(`No active room found with code "${code}". Please verify and try again.`);
      return;
    }

    setJoinCodeError("");

    const existing = room.currentParticipants.find((p) => p.id === user.id);
    if (!existing) {
      const newParticipant: GroupStudyParticipant = {
        id: user.id || `u_${Date.now()}`,
        name: user.name || "Student",
        avatarUrl:
          user.avatarUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            user.name || "Student"
          )}`,
        role: "member",
        status: "studying",
        isMuted: false,
        joinedAt: new Date().toISOString(),
      };

      const systemMsg: GroupStudyChatMessage = {
        id: `sys_${Date.now()}`,
        senderId: "system",
        senderName: "StudyMate Bot",
        text: `${user.name || "Student"} joined the study room with Room Code! 🔑`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "system",
      };

      // Remove any pending join request for this user since they used the code
      const updatedPending = (room.pendingRequests || []).filter((r) => r.userId !== user.id);

      const updatedRoom: GroupStudySession = {
        ...room,
        currentParticipants: [...room.currentParticipants, newParticipant],
        pendingRequests: updatedPending,
        chatMessages: [...room.chatMessages, systemMsg],
      };

      const updatedList = groupSessions.map((r) => (r.id === room.id ? updatedRoom : r));
      onSaveGroupSessions(updatedList);
    }

    setActiveRoomId(room.id);
    setJoinCodeInput("");
    setIsJoinCodeModalOpen(false);
    setCodeModalRoom(null);
    showToast(`Joined "${room.title}"!`);
  };

  // Handle Request to Join (When room requires host approval)
  const handleRequestToJoin = (room: GroupStudySession) => {
    // If open access, join directly
    if (room.requireApproval === false) {
      handleJoinByCode(room.code);
      return;
    }

    // Check if already a member
    if (room.currentParticipants.some((p) => p.id === user.id)) {
      setActiveRoomId(room.id);
      return;
    }

    // Check if already pending
    const existingReq = (room.pendingRequests || []).find((r) => r.userId === user.id);
    if (existingReq && existingReq.status === "pending") {
      showToast(`Your join request is already pending approval by host ${room.hostName}. ⏳`);
      return;
    }

    const newRequest: GroupJoinRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: user.id || `u_${Date.now()}`,
      userName: user.name || "Student",
      userAvatar: user.avatarUrl,
      userEmail: user.email,
      requestedAt: new Date().toISOString(),
      status: "pending",
    };

    const updatedRoom: GroupStudySession = {
      ...room,
      pendingRequests: [...(room.pendingRequests || []).filter((r) => r.userId !== user.id), newRequest],
    };

    const updatedList = groupSessions.map((r) => (r.id === room.id ? updatedRoom : r));
    onSaveGroupSessions(updatedList);
    showToast(`Join request sent to host ${room.hostName}! Waiting for approval.`);
  };

  // Host: Accept Student Join Request
  const handleAcceptRequest = (req: GroupJoinRequest) => {
    if (!activeRoom) return;

    const newParticipant: GroupStudyParticipant = {
      id: req.userId,
      name: req.userName,
      avatarUrl: req.userAvatar,
      role: "member",
      status: "studying",
      isMuted: false,
      joinedAt: new Date().toISOString(),
    };

    const systemMsg: GroupStudyChatMessage = {
      id: `sys_adm_${Date.now()}`,
      senderId: "system",
      senderName: "StudyMate Bot",
      text: `${req.userName} was accepted into the study room by ${user.name || "Host"}! 👋`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "system",
    };

    const updatedPending = (activeRoom.pendingRequests || []).filter((r) => r.id !== req.id);
    const updatedParticipants = [...activeRoom.currentParticipants, newParticipant];

    const updatedRoom: GroupStudySession = {
      ...activeRoom,
      currentParticipants: updatedParticipants,
      pendingRequests: updatedPending,
      chatMessages: [...activeRoom.chatMessages, systemMsg],
    };

    const updatedList = groupSessions.map((r) => (r.id === activeRoom.id ? updatedRoom : r));
    onSaveGroupSessions(updatedList);
    showToast(`Admitted ${req.userName} to the study session.`);
  };

  // Host: Decline Student Join Request
  const handleDeclineRequest = (reqId: string, reqName: string) => {
    if (!activeRoom) return;

    const updatedPending = (activeRoom.pendingRequests || []).filter((r) => r.id !== reqId);
    const updatedRoom: GroupStudySession = {
      ...activeRoom,
      pendingRequests: updatedPending,
    };

    const updatedList = groupSessions.map((r) => (r.id === activeRoom.id ? updatedRoom : r));
    onSaveGroupSessions(updatedList);
    showToast(`Declined join request from ${reqName}.`);
  };

  // Host: Remove / Kick a participant
  const handleKickParticipant = (participantId: string, participantName: string) => {
    if (!activeRoom) return;
    if (participantId === activeRoom.hostId) return;

    if (confirm(`Remove ${participantName} from this study session?`)) {
      const updatedParticipants = activeRoom.currentParticipants.filter((p) => p.id !== participantId);
      const kickMsg: GroupStudyChatMessage = {
        id: `sys_kick_${Date.now()}`,
        senderId: "system",
        senderName: "StudyMate Bot",
        text: `${participantName} was removed from the session by the host.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "system",
      };

      const updatedRoom: GroupStudySession = {
        ...activeRoom,
        currentParticipants: updatedParticipants,
        chatMessages: [...activeRoom.chatMessages, kickMsg],
      };

      const updatedList = groupSessions.map((r) => (r.id === activeRoom.id ? updatedRoom : r));
      onSaveGroupSessions(updatedList);
      showToast(`${participantName} has been removed.`);
    }
  };

  // Handle Room Created from Modal
  const handleRoomCreated = (newRoom: GroupStudySession) => {
    const updatedList = [newRoom, ...groupSessions];
    onSaveGroupSessions(updatedList);
    setActiveRoomId(newRoom.id);
    showToast(`Live room "${newRoom.title}" launched successfully!`);
  };

  // Quick 1-Click Room Preset Creation
  const handleQuickCreatePreset = (type: GroupRoomType, title: string, duration: number) => {
    const generatedCode = `FOCUS-${Math.floor(100 + Math.random() * 900)}`;
    const hostParticipant: GroupStudyParticipant = {
      id: user.id || `u_${Date.now()}`,
      name: user.name || "Study Host",
      avatarUrl:
        user.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          user.name || "Host"
        )}`,
      role: "host",
      status: "studying",
      isMuted: false,
      joinedAt: new Date().toISOString(),
    };

    const initialSystemMsg: GroupStudyChatMessage = {
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "StudyMate Bot",
      text: `Live Study Room launched. Share code "${generatedCode}" with study partners!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "system",
    };

    const newRoom: GroupStudySession = {
      id: `room_${Date.now()}`,
      code: generatedCode,
      title: title,
      subjectId: subjects[0]?.id || "s_general",
      subjectName: subjects[0]?.name || "General Coursework",
      description: `Instant ${duration}-minute collaborative ${type} sprint.`,
      hostId: user.id || `u_${Date.now()}`,
      hostName: user.name || "Study Host",
      hostAvatar:
        user.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          user.name || "Host"
        )}`,
      roomType: type,
      maxParticipants: 10,
      currentParticipants: [hostParticipant],
      isLive: true,
      requireApproval: true,
      pendingRequests: [],
      createdDate: new Date().toISOString(),
      sharedNotesPad: `# ${title}\n\nType key study notes, formulas, or questions here!`,
      timerState: {
        isRunning: false,
        mode: "focus",
        secondsLeft: duration * 60,
      },
      chatMessages: [initialSystemMsg],
    };

    const updatedList = [newRoom, ...groupSessions];
    onSaveGroupSessions(updatedList);
    setActiveRoomId(newRoom.id);
    showToast(`Launched "${newRoom.title}"!`);
  };

  // Delete / End a Live Room
  const handleDeleteRoom = (roomId: string, roomTitle: string) => {
    if (confirm(`Are you sure you want to end and delete the room "${roomTitle}"?`)) {
      if (activeRoomId === roomId) {
        setActiveRoomId(null);
      }
      const updated = groupSessions.filter((r) => r.id !== roomId);
      onSaveGroupSessions(updated);
      showToast(`Room "${roomTitle}" has been closed.`);
    }
  };

  // Clear All Live Rooms
  const handleClearAllRooms = () => {
    if (confirm("Are you sure you want to remove all live study rooms? You can create new ones anytime.")) {
      setActiveRoomId(null);
      onSaveGroupSessions([]);
      showToast("All live study rooms have been removed.");
    }
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
      text: `${user.name || "Student"} left the study room.`,
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
      senderId: user.id || "u_student",
      senderName: user.name || "Student",
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

  // Save shared pad to personal smart notes
  const handleSavePadToNotes = () => {
    if (!activeRoom || !sharedNotesPad.trim()) return;

    const newNote: Note = {
      id: `note_group_${Date.now()}`,
      userId: user.id,
      subjectId: activeRoom.subjectId || subjects[0]?.id || "s_general",
      title: `Group Notes: ${activeRoom.title}`,
      content: sharedNotesPad,
      isPinned: true,
      tags: ["Group Study", activeRoom.subjectName, `Room: ${activeRoom.code}`],
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0],
    };

    onSaveNotes([newNote, ...notes]);
    showToast("Saved group notes to your Smart Notes library! 📝");
  };

  // Copy Code to Clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`Copied room code "${code}" to clipboard!`);
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
      (room.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.subjectName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.code || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || room.roomType === filterType;
    return matchesSearch && matchesFilter;
  });

  // -------------------------------------------------------------
  // VIEW 1: ACTIVE GROUP ROOM EXPERIENCE (Inside a Joined Room)
  // -------------------------------------------------------------
  if (activeRoom) {
    const isHost = activeRoom.hostId === user.id || activeRoom.currentParticipants[0]?.id === user.id;
    const pendingRequests = (activeRoom.pendingRequests || []).filter((r) => r.status === "pending");

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
        {/* Notification Toast */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Room Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-5 sm:p-6 text-white border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/10 cursor-pointer"
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
              {isHost && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Host
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <span>{activeRoom.title}</span>
            </h2>
            <p className="text-xs text-indigo-200/80 max-w-2xl">{activeRoom.description}</p>
          </div>

          {/* Join Code Badge & Controls */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-900/80 border border-indigo-400/40">
              <div className="text-left">
                <p className="text-[9px] uppercase font-bold text-indigo-300">Room Code</p>
                <p className="text-sm font-mono font-extrabold tracking-wider text-white">
                  {activeRoom.code}
                </p>
              </div>
              <button
                onClick={() => handleCopyCode(activeRoom.code)}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all ml-1 cursor-pointer"
                title="Copy Join Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleToggleScreenShare}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all border cursor-pointer ${
                isSharingScreen
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30 animate-pulse"
                  : "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30"
              }`}
            >
              {isSharingScreen ? <MonitorOff className="w-4 h-4 text-rose-300" /> : <Monitor className="w-4 h-4 text-indigo-300" />}
              <span>{isSharingScreen ? "Stop Share" : "Share Screen"}</span>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all border cursor-pointer ${
                isMuted
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isMuted ? "Muted" : "Mic Live"}</span>
            </button>

            {isHost && (
              <button
                onClick={() => handleDeleteRoom(activeRoom.id, activeRoom.title)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white font-bold text-xs transition-all cursor-pointer"
                title="End session and delete this room"
              >
                <Trash2 className="w-4 h-4" />
                <span>End Room</span>
              </button>
            )}
          </div>
        </div>

        {/* Host Alert Banner for Pending Requests */}
        {isHost && pendingRequests.length > 0 && (
          <HostRequestsPanel
            room={activeRoom}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
          />
        )}

        {/* Main Room Workspace Grid (Left: Active Tab Content, Right: Roster & Live Chat) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Workspace Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setActiveRoomTab("timer")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all relative cursor-pointer ${
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

              {isHost && (
                <button
                  onClick={() => setActiveRoomTab("requests")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition-all relative cursor-pointer ${
                    activeRoomTab === "requests"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Requests ({pendingRequests.length})</span>
                  {pendingRequests.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              )}
            </div>

            {/* TAB 1: GROUP POMODORO & FOCUS TIMER */}
            {activeRoomTab === "timer" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    {timerMode === "focus" ? "Synced Focus Sprint" : "Group Rest Interval (5 mins)"}
                  </span>
                </div>

                {/* Big Timer Circle Display */}
                <div className="relative w-56 h-56 mx-auto flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-800 dark:to-indigo-950/50 border-4 border-indigo-500/30 shadow-inner">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                    {formatTimer(timerSecondsLeft)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2">
                    {timerRunning ? "Studying Together 🧠" : "Timer Paused"}
                  </span>
                </div>

                {/* Timer Controls */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all cursor-pointer active:scale-95"
                  >
                    {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                    <span>{timerRunning ? "Pause Timer" : "Start Focus Session"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSecondsLeft(timerMode === "focus" ? 25 * 60 : 5 * 60);
                    }}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  {/* Mode switcher */}
                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      if (timerMode === "focus") {
                        setTimerMode("break");
                        setTimerSecondsLeft(5 * 60);
                      } else {
                        setTimerMode("focus");
                        setTimerSecondsLeft(25 * 60);
                      }
                    }}
                    className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Switch to {timerMode === "focus" ? "Break" : "Focus"}</span>
                  </button>
                </div>

                {/* Ambient Sound Presets */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Background Soundscape</span>
                    </h4>
                    {activeAmbient !== "none" && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[11px] text-slate-400">Volume:</span>
                        <input
                          type="range"
                          min="0.05"
                          max="0.8"
                          step="0.05"
                          value={ambientVolume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-20 accent-indigo-600 h-1.5 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "rain", label: "🌧️ Rainfall", desc: "Gentle rain" },
                      { id: "brown", label: "🌊 Brown Noise", desc: "Deep focus" },
                      { id: "white", label: "📻 White Noise", desc: "Block speech" },
                      { id: "binaural", label: "🧘 Binaural", desc: "Alpha waves" },
                    ].map((snd) => (
                      <button
                        key={snd.id}
                        onClick={() => handleToggleAmbient(snd.id)}
                        className={`p-2.5 rounded-xl text-left transition-all border text-xs cursor-pointer ${
                          activeAmbient === snd.id
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <p className="font-bold">{snd.label}</p>
                        <p className={`text-[10px] ${activeAmbient === snd.id ? "text-indigo-100" : "text-slate-400"}`}>
                          {snd.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Member Status Grid */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
                  <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-3 tracking-wider flex items-center justify-between">
                    <span>Active Study Members ({activeRoom.currentParticipants.length})</span>
                    <span className="text-[11px] text-slate-400 lowercase font-normal">
                      max {activeRoom.maxParticipants}
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeRoom.currentParticipants.map((p) => {
                      const isHostMember = p.id === activeRoom.hostId || p.role === "host";
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                p.avatarUrl ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name)}`
                              }
                              alt={p.name}
                              className="w-8 h-8 rounded-full object-cover border border-indigo-400"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                <span>{p.name}</span>
                                {isHostMember && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                                {p.id === user.id && (
                                  <span className="text-[10px] px-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold">
                                    You
                                  </span>
                                )}
                              </p>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active Studying
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {p.isMuted ? "Muted" : "Mic Live"}
                            </span>
                            {isHost && p.id !== user.id && (
                              <button
                                onClick={() => handleKickParticipant(p.id, p.name)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                                title={`Remove ${p.name} from room`}
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SHARED COLLABORATIVE STUDY NOTES */}
            {activeRoomTab === "notes" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Collaborative Shared Note Pad</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Type real-time shared notes, formulas, and bullet points with all members.
                    </p>
                  </div>
                  <button
                    onClick={handleSavePadToNotes}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save to My Smart Notes</span>
                  </button>
                </div>

                <textarea
                  value={sharedNotesPad}
                  onChange={(e) => setSharedNotesPad(e.target.value)}
                  placeholder="Type shared study notes, key definitions, or quiz questions here..."
                  className="w-full h-80 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                />

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>{sharedNotesPad.split(/\s+/).filter(Boolean).length} words • {sharedNotesPad.length} characters</span>
                  <span>Auto-saved to live session state</span>
                </div>
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 cursor-pointer"
                      >
                        {isScreenFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        <span>{isScreenFullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                      </button>
                    )}

                    <button
                      onClick={handleToggleScreenShare}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
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
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>Open App in New Tab</span>
                      </button>
                      <button
                        onClick={handleStartSimulatedPresenter}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
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
                        <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl my-2">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold uppercase">
                                Slide {presenterSlide} / 3
                              </span>
                              <h5 className="font-bold text-sm text-slate-100">
                                {presenterSlide === 1 && `${activeRoom.subjectName}: Core Concepts`}
                                {presenterSlide === 2 && "Key Formulas & Problem Breakdown"}
                                {presenterSlide === 3 && "Group Q&A & Discussion Sandbox"}
                              </h5>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setPresenterSlide((s) => Math.max(1, s - 1))}
                                disabled={presenterSlide === 1}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold disabled:opacity-40 cursor-pointer"
                              >
                                Prev
                              </button>
                              <button
                                onClick={() => setPresenterSlide((s) => Math.min(3, s + 1))}
                                disabled={presenterSlide === 3}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold disabled:opacity-40 cursor-pointer"
                              >
                                Next
                              </button>
                            </div>
                          </div>

                          <div className="p-6 bg-slate-900 rounded-xl space-y-3 text-left">
                            {presenterSlide === 1 && (
                              <>
                                <h6 className="font-bold text-indigo-400 text-base">{activeRoom.title}</h6>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  {activeRoom.description}
                                </p>
                                <div className="p-3 bg-indigo-950/60 rounded-lg border border-indigo-800/50 text-xs text-indigo-200">
                                  💡 <strong>Host Tip:</strong> Review key notes in the Shared Notes tab while following along here.
                                </div>
                              </>
                            )}
                            {presenterSlide === 2 && (
                              <>
                                <h6 className="font-bold text-indigo-400 text-base">Key Problem Solutions</h6>
                                <div className="space-y-2 text-xs text-slate-300">
                                  <p>1. Identify the fundamental formula or theorem</p>
                                  <p>2. Break complex multi-step problems into modular components</p>
                                  <p>3. Verify edge cases and validate results with classmates</p>
                                </div>
                              </>
                            )}
                            {presenterSlide === 3 && (
                              <>
                                <h6 className="font-bold text-indigo-400 text-base">Interactive Group Brainstorm</h6>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  Use the live chat on the right to post questions or request step-by-step walkthroughs from study partners.
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <Tv className="w-12 h-12 text-slate-700 mx-auto" />
                      <h4 className="font-bold text-base text-slate-300">Screen Sharing Inactive</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Click "Start Sharing Screen" above to broadcast your notes, textbook, or code window to all participants.
                      </p>
                      <button
                        onClick={handleToggleScreenShare}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Monitor className="w-4 h-4" />
                        <span>Start Screen Share</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: HOST MANAGE REQUESTS */}
            {activeRoomTab === "requests" && isHost && (
              <div className="space-y-4">
                <HostRequestsPanel
                  room={activeRoom}
                  onAcceptRequest={handleAcceptRequest}
                  onDeclineRequest={handleDeclineRequest}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar: Live Chat & Participants (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col h-[600px] justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Live Room Chat
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    {activeRoom.currentParticipants.length} online
                  </span>
                </div>

                {/* Quick Reaction Emotes */}
                <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
                  <button
                    onClick={() => handleSendEmote("💡", "Idea / Question")}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-bold transition-all cursor-pointer shrink-0"
                    title="Post Idea"
                  >
                    💡 Idea
                  </button>
                  <button
                    onClick={() => handleSendEmote("👏", "Great job!")}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-bold transition-all cursor-pointer shrink-0"
                    title="Clap"
                  >
                    👏 Bravo
                  </button>
                  <button
                    onClick={() => handleSendEmote("🔥", "On fire!")}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-bold transition-all cursor-pointer shrink-0"
                    title="On Fire"
                  >
                    🔥 Fire
                  </button>
                  <button
                    onClick={() => handleSendEmote("❓", "Need clarification")}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-bold transition-all cursor-pointer shrink-0"
                    title="Help"
                  >
                    ❓ Help
                  </button>
                </div>

                {/* Messages Container */}
                <div className="h-[380px] overflow-y-auto space-y-3 pr-1 text-xs">
                  {activeRoom.chatMessages.map((msg) => {
                    const isMe = msg.senderId === user.id;
                    const isSystem = msg.type === "system";

                    if (isSystem) {
                      return (
                        <div
                          key={msg.id}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-center text-slate-500 dark:text-slate-400 text-[11px] italic"
                        >
                          {msg.text}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                            {isMe ? "You" : msg.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-tr-none shadow-sm font-medium"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type message to room..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-all cursor-pointer shrink-0"
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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
            Set up your custom live study rooms, sync Pomodoro focus timers, share screens, and collaborate with classmates in real time!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Set Up Your Live Room</span>
          </button>

          {groupSessions.length > 0 && (
            <button
              onClick={handleClearAllRooms}
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-rose-500/30 text-white font-bold text-xs transition-all border border-white/15 cursor-pointer"
              title="Remove all live rooms"
            >
              <Trash2 className="w-4 h-4 text-rose-300" />
              <span>Clear All Rooms</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK LAUNCH 1-CLICK PRESET TEMPLATES */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick 1-Click Room Setup</span>
          </h4>
          <span className="text-[11px] text-slate-400">Launch an instant room with pre-configured focus parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleQuickCreatePreset("pomodoro", "⚡ 25-Min Pomodoro Sprint", 25)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
              <Timer className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">Pomodoro Sprint</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">25m synced interval + 5m rest</p>
          </button>

          <button
            onClick={() => handleQuickCreatePreset("discussion", "💬 Group Discussion & Q&A", 45)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">Discussion & Q&A</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">Active collaboration & mic on</p>
          </button>

          <button
            onClick={() => handleQuickCreatePreset("quiz_challenge", "🎯 Quiz & Flashcard Arena", 30)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">Quiz & Flashcard Arena</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">Rapid question drills & testing</p>
          </button>

          <button
            onClick={() => handleQuickCreatePreset("silent_focus", "🤫 Silent Study Hall", 60)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-2 group-hover:scale-110 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">Silent Study Hall</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">60m distraction-free library</p>
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
                Enter your classmate’s 6-character room code to join immediately without waiting
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
              placeholder="e.g. FOCUS-123 or BIO-890"
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700"
            />
            <button
              onClick={() => handleJoinByCode()}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4" />
              <span>Join Session</span>
            </button>
          </div>
        </div>
        {joinCodeError && (
          <p className="text-xs text-rose-500 font-semibold mt-2 pl-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{joinCodeError}</span>
          </p>
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
            placeholder="Search live rooms by title, course topic, or host..."
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
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
          <div className="col-span-full text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                No Live Study Rooms Active
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                All live rooms are empty. Set up your custom study room above or join your classmates using their 6-character room code!
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Set Up Your Live Room</span>
              </button>
              <button
                onClick={() => {
                  setCodeModalRoom(null);
                  setIsJoinCodeModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Join with Code</span>
              </button>
            </div>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <GroupRoomCard
              key={room.id}
              room={room}
              user={user}
              onEnterRoom={(id) => setActiveRoomId(id)}
              onRequestJoin={handleRequestToJoin}
              onOpenCodeModal={(r) => {
                setCodeModalRoom(r);
                setIsJoinCodeModalOpen(true);
              }}
              onDeleteRoom={handleDeleteRoom}
            />
          ))
        )}
      </div>

      {/* CREATE LIVE ROOM MODAL */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
        subjects={subjects}
        onRoomCreated={handleRoomCreated}
      />

      {/* JOIN WITH CODE MODAL */}
      <JoinCodeModal
        isOpen={isJoinCodeModalOpen}
        onClose={() => {
          setIsJoinCodeModalOpen(false);
          setCodeModalRoom(null);
        }}
        room={codeModalRoom}
        onJoinSuccess={handleJoinByCode}
      />
    </div>
  );
};
