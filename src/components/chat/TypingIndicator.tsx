import React, { useState, useEffect } from "react";
import { Bot, Sparkles, BrainCircuit } from "lucide-react";

interface TypingIndicatorProps {
  modeName?: string;
}

const STATUS_MESSAGES = [
  "Formulating your explanation...",
  "Analyzing core concepts...",
  "Structuring study breakdown...",
  "Synthesizing key points...",
];

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  modeName = "AI Tutor",
}) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        setFade(true);
      }, 200);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="ai-typing-indicator"
      className="flex items-start gap-2.5 sm:gap-3.5 max-w-3xl mr-auto group animate-in fade-in duration-300"
    >
      {/* Bot Avatar */}
      <div
        id="ai-typing-indicator-avatar"
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md bg-gradient-to-tr from-indigo-500 to-cyan-500 relative"
      >
        <Bot className="w-4 h-4" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
        </span>
      </div>

      {/* Typing Bubble */}
      <div
        id="ai-typing-indicator-bubble"
        className="p-3.5 sm:p-4 rounded-2xl rounded-tl-none bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2.5 min-w-[220px] sm:min-w-[260px]"
      >
        {/* Header with Mode & Icon */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
            <span>StudyMate AI</span>
            <span className="text-slate-400 font-normal">•</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {modeName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
            <BrainCircuit className="w-3 h-3 text-indigo-400 animate-spin" />
            <span>Thinking</span>
          </div>
        </div>

        {/* Animated Bouncing Dots & Dynamic Text */}
        <div className="flex items-center gap-3 pt-0.5">
          {/* 3 Staggered Bouncing Dots */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 shrink-0">
            <span
              className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block animate-bounce"
              style={{ animationDuration: "0.9s", animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-cyan-400 inline-block animate-bounce"
              style={{ animationDuration: "0.9s", animationDelay: "180ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-300 inline-block animate-bounce"
              style={{ animationDuration: "0.9s", animationDelay: "360ms" }}
            />
          </div>

          {/* Cycling Status Label */}
          <div className="h-5 overflow-hidden flex items-center min-w-0">
            <span
              className={`text-xs text-slate-600 dark:text-slate-300 font-medium truncate transition-all duration-200 ${
                fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              }`}
            >
              {STATUS_MESSAGES[statusIndex]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
