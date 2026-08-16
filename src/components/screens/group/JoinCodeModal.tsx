import React, { useState } from "react";
import { KeyRound, X, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { GroupStudySession } from "../../../types";

interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: GroupStudySession | null;
  onJoinSuccess: (code: string) => void;
}

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({
  isOpen,
  onClose,
  room,
  onJoinSuccess,
}) => {
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      setError("Please enter the room code");
      return;
    }

    if (room && room.code.toUpperCase() !== clean && room.id !== clean) {
      setError(`Code "${clean}" is incorrect for "${room.title}".`);
      return;
    }

    setError("");
    onJoinSuccess(clean);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Join with Room Code
              </h3>
              <p className="text-[11px] text-slate-400">
                {room ? `Bypass approval for "${room.title}"` : "Enter 6-character room code"}
              </p>
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
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Enter Secret Room Code
            </label>
            <input
              type="text"
              required
              autoFocus
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setError("");
              }}
              placeholder={room ? `e.g. ${room.code}` : "e.g. FOCUS-123"}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm font-mono uppercase font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700"
            />
            {error && (
              <p className="text-xs text-rose-500 font-semibold mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Entering a valid room code grants instant access without waiting for host review!</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Enter Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
