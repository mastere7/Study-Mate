import React, { useState } from "react";
import { Users, Lock, Globe, KeyRound, Crown, Trash2, Copy, Check, Clock, UserPlus, ArrowRight, Sparkles, Share2 } from "lucide-react";
import { GroupStudySession, UserProfile } from "../../../types";

interface GroupRoomCardProps {
  room: GroupStudySession;
  user: UserProfile;
  onEnterRoom: (roomId: string) => void;
  onRequestJoin: (room: GroupStudySession) => void;
  onOpenCodeModal: (room: GroupStudySession) => void;
  onDeleteRoom: (roomId: string, title: string) => void;
}

export const GroupRoomCard: React.FC<GroupRoomCardProps> = ({
  room,
  user,
  onEnterRoom,
  onRequestJoin,
  onOpenCodeModal,
  onDeleteRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const isFull = room.currentParticipants.length >= room.maxParticipants;
  const isMember = room.currentParticipants.some((p) => p.id === user.id);
  const isHost = room.hostId === user.id || room.currentParticipants[0]?.id === user.id;
  const pendingRequests = (room.pendingRequests || []).filter((r) => r.status === "pending");
  const myPendingRequest = (room.pendingRequests || []).find(
    (r) => r.userId === user.id && r.status === "pending"
  );

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?tab=group_study&room=${encodeURIComponent(
      room.code
    )}`;
    navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-wide">
            {room.subjectName}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>

            {/* Approval / Open Security Badge */}
            {room.requireApproval !== false ? (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                title="Creator approval or secret code required to join"
              >
                <Lock className="w-3 h-3" />
                <span>Approval / Code</span>
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                title="Open to everyone"
              >
                <Globe className="w-3 h-3 text-emerald-500" />
                <span>Open</span>
              </span>
            )}

            {isHost && (
              <button
                onClick={() => onDeleteRoom(room.id, room.title)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer ml-1"
                title="End & Delete room"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Room Title & Description */}
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
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(room.hostName)}`
              }
              alt={room.hostName}
              className="w-7 h-7 rounded-full object-cover border border-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <span>{room.hostName}</span>
              {isHost && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-0.5">
                  <Crown className="w-2.5 h-2.5" />
                  You
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              {room.currentParticipants.length} / {room.maxParticipants}
            </span>
          </div>
        </div>

        {/* Host alert for pending requests */}
        {isHost && pendingRequests.length > 0 && (
          <div className="mt-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              {pendingRequests.length} pending request{pendingRequests.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={() => onEnterRoom(room.id)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer"
            >
              Review
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Room Code Badge & Share */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] text-slate-500 font-medium">Code:</span>
              <span className="text-[11px] font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                {room.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-0.5 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer ml-1"
                title="Copy code"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>
            <button
              onClick={handleShareLink}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer"
              title="Copy share link"
            >
              {shared ? <Check className="w-3 h-3 text-emerald-500" /> : <Share2 className="w-3 h-3" />}
            </button>
          </div>

          {/* Join Buttons Logic */}
          {isMember || isHost ? (
            <button
              onClick={() => onEnterRoom(room.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <span>Enter Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : myPendingRequest ? (
            <div className="flex items-center gap-1.5">
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Pending Host</span>
              </span>
              <button
                onClick={() => onOpenCodeModal(room)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                title="Use room code for instant access"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isFull ? (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs">
              Room Full
            </span>
          ) : room.requireApproval !== false ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onRequestJoin(room)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Request Join</span>
              </button>
              <button
                onClick={() => onOpenCodeModal(room)}
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Join immediately with Room Code"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onEnterRoom(room.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <span>Join Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
