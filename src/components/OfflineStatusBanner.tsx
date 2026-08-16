import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw, CheckCircle2, X } from "lucide-react";

export function OfflineStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true;
  });
  const [showReconnectedAlert, setShowReconnectedAlert] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);
      setShowReconnectedAlert(true);
      const timer = setTimeout(() => {
        setShowReconnectedAlert(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
      setShowReconnectedAlert(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnectedAlert) {
    return null;
  }

  if (isDismissed && !showReconnectedAlert) {
    return null;
  }

  return (
    <aside
      aria-label="Network connectivity status"
      className="fixed bottom-16 lg:bottom-4 left-3 right-3 sm:left-auto sm:right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300"
    >
      {!isOnline ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/90 dark:bg-slate-900/95 backdrop-blur-md border border-amber-500/40 text-amber-100 shadow-2xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black tracking-wide uppercase text-amber-300">
                ⚡ Offline Mode Active
              </span>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-amber-400/80 hover:text-amber-200 p-0.5 rounded-lg transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
              Study resources are cached. You can review notes, flashcards, study schedules, and run the Pomodoro timer without internet.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-emerald-950/90 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 text-emerald-100 shadow-2xl flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Back Online — Full AI & Cloud Sync Active
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
