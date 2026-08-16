import React from "react";
import { Users, Check, X, Clock, ShieldCheck, UserCheck } from "lucide-react";
import { GroupJoinRequest, GroupStudySession } from "../../../types";

interface HostRequestsPanelProps {
  room: GroupStudySession;
  onAcceptRequest: (req: GroupJoinRequest) => void;
  onDeclineRequest: (reqId: string, reqName: string) => void;
}

export const HostRequestsPanel: React.FC<HostRequestsPanelProps> = ({
  room,
  onAcceptRequest,
  onDeclineRequest,
}) => {
  const pending = (room.pendingRequests || []).filter((r) => r.status === "pending");

  if (pending.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
          No Pending Join Requests
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          All students have been reviewed. Share your room code <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{room.code}</span> with classmates to let them join directly!
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            <span>Incoming Join Requests ({pending.length})</span>
          </h4>
        </div>
        <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
          Creator Approval Required
        </span>
      </div>

      <div className="space-y-2">
        {pending.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-xs gap-3 flex-wrap sm:flex-nowrap"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  req.userAvatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.userName)}`
                }
                alt={req.userName}
                className="w-9 h-9 rounded-full object-cover border-2 border-amber-400"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {req.userName}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  {req.userEmail && <span>{req.userEmail}</span>}
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(req.requestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onAcceptRequest(req)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => onDeclineRequest(req.id, req.userName)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 hover:text-rose-500 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
