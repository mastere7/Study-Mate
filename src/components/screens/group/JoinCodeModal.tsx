import React, { useState } from "react";
import { KeyRound, X, AlertCircle, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { GroupStudySession } from "../../../types";

interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: GroupStudySession | null;
  onJoinSuccess: (code: string) => void | Promise<void>;
}

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({
  isOpen,
  onClose,
  room,
  onJoinSuccess,
}) => {
  const [inputCode, setInputCode] = useState(room ? room.code : "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
    setIsSubmitting(true);
    try {
      await onJoinSuccess(clean);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to locate room with this code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Join with Room Code
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {room ? `Instant access for "${room.title}"` : "Enter 6-character room PIN code"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Enter Secret Room Code
            </label>
            <input
              type="text"
              required
              autoFocus
              disabled={isSubmitting}
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setError("");
              }}
              placeholder={room ? `e.g. ${room.code}` : "e.g. FOCUS-123 or BIO-890"}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 text-sm font-mono uppercase font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-300 dark:border-slate-700 disabled:opacity-50 transition-all shadow-xs"
            />
            {error && (
              <p className="text-xs text-rose-500 font-semibold mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Entering a valid room code connects directly to the live study room without waiting for host approval!</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inputCode.trim()}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Enter Room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
