import React, { useState } from "react";
import { Users, X, Sparkles, Shield, Lock, Globe, Dices } from "lucide-react";
import { GroupRoomType, Subject, UserProfile, GroupStudySession, GroupStudyParticipant, GroupStudyChatMessage } from "../../../types";

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
  const [createTitle, setCreateTitle] = useState("");
  const [createSubjectId, setCreateSubjectId] = useState(subjects[0]?.id || "custom");
  const [createCustomSubjectName, setCreateCustomSubjectName] = useState("");
  const [createRoomType, setCreateRoomType] = useState<GroupRoomType>("pomodoro");
  const [createMaxParticipants, setCreateMaxParticipants] = useState<number>(8);
  const [createDescription, setCreateDescription] = useState("");
  const [createCustomCode, setCreateCustomCode] = useState("");
  const [createTimerDuration, setCreateTimerDuration] = useState<number>(25);
  const [createRequireApproval, setCreateRequireApproval] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleGenerateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateCustomCode(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    let subjectName = "General Study";
    if (createSubjectId === "custom" && createCustomSubjectName.trim()) {
      subjectName = createCustomSubjectName.trim();
    } else {
      const selected = subjects.find((s) => s.id === createSubjectId);
      if (selected) subjectName = selected.name;
    }

    const generatedCode =
      createCustomCode.trim().toUpperCase() ||
      `${subjectName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "STUDY"}-${Math.floor(
        100 + Math.random() * 900
      )}`;

    const hostParticipant: GroupStudyParticipant = {
      id: user.id || `u_${Date.now()}`,
      name: user.name || "Study Host",
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || "Host")}`,
      role: "host",
      status: "studying",
      isMuted: false,
      joinedAt: new Date().toISOString(),
    };

    const initialSystemMsg: GroupStudyChatMessage = {
      id: `sys_${Date.now()}`,
      senderId: "system",
      senderName: "StudyMate Bot",
      text: `Live Study Room launched by ${user.name || "Host"}. Share room code "${generatedCode}" with classmates!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "system",
    };

    const newRoom: GroupStudySession = {
      id: `room_${Date.now()}`,
      code: generatedCode,
      title: createTitle.trim(),
      subjectId: createSubjectId,
      subjectName: subjectName,
      description: createDescription.trim() || `Collaborative ${createRoomType} study session.`,
      hostId: user.id || `u_${Date.now()}`,
      hostName: user.name || "Study Host",
      hostAvatar: user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || "Host")}`,
      roomType: createRoomType,
      maxParticipants: Number(createMaxParticipants) || 8,
      currentParticipants: [hostParticipant],
      isLive: true,
      requireApproval: createRequireApproval,
      pendingRequests: [],
      createdDate: new Date().toISOString(),
      sharedNotesPad: `# ${createTitle}\n\n**Topic:** ${subjectName}\n**Host:** ${user.name || "Student"}\n\nCollaboratively type study notes and key takeaways here. All members can edit in real time!`,
      timerState: {
        isRunning: false,
        mode: "focus",
        secondsLeft: createTimerDuration * 60,
      },
      chatMessages: [initialSystemMsg],
    };

    onRoomCreated(newRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Set Up Your Live Study Room
              </h3>
              <p className="text-[11px] text-slate-400">Configure parameters, access security, and invite classmates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="e.g. Calculus Midterm Problem Set Sprint"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Subject Select or Custom Subject */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-500">
              Course Subject
            </label>
            <div className="grid grid-cols-2 gap-3">
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
                <option value="custom">+ Custom Subject Name</option>
              </select>

              {createSubjectId === "custom" ? (
                <input
                  type="text"
                  value={createCustomSubjectName}
                  onChange={(e) => setCreateCustomSubjectName(e.target.value)}
                  placeholder="e.g. Molecular Biology"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
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
              )}
            </div>
          </div>

          {createSubjectId === "custom" && (
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
          )}

          {/* Focus Duration & Max Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Focus Interval (Minutes)
              </label>
              <select
                value={createTimerDuration}
                onChange={(e) => setCreateTimerDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={15}>15 Minutes</option>
                <option value={25}>25 Minutes (Standard)</option>
                <option value={45}>45 Minutes</option>
                <option value={50}>50 Minutes (Deep Focus)</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes (Ultradian)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Max Capacity (Students)
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={createMaxParticipants}
                onChange={(e) => setCreateMaxParticipants(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Access & Approval Controls */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/50 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Join Security & Approval Mode
              </label>
            </div>
            
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors">
                <input
                  type="radio"
                  name="approvalMode"
                  checked={createRequireApproval === true}
                  onChange={() => setCreateRequireApproval(true)}
                  className="mt-0.5 accent-indigo-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Host Approval Required (or use Room Code)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Classmates request entry and must be accepted by you as host, OR they can enter the secret Room Code to join immediately.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors">
                <input
                  type="radio"
                  name="approvalMode"
                  checked={createRequireApproval === false}
                  onChange={() => setCreateRequireApproval(false)}
                  className="mt-0.5 accent-indigo-600"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Open Access (Anyone can join directly)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Any student can join without waiting for creator approval.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Room Code */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase text-slate-500">
                Room Join Code
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
              placeholder="e.g. FOCUS-77 or BIO-EXAM"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Study Goals / Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Session Goal & Agenda (Optional)
            </label>
            <textarea
              rows={2}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="What topics or practice problems will you focus on during this session?"
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Submit / Cancel Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              Launch Live Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
