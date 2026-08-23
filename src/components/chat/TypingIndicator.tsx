import React, { useState, useEffect } from "react";
import { Bot, Sparkles, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      id="ai-typing-indicator"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-start gap-2.5 sm:gap-3.5 max-w-3xl mr-auto group"
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
            <motion.span
              animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0 }}
              className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block"
            />
            <motion.span
              animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.2 }}
              className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-cyan-400 inline-block"
            />
            <motion.span
              animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.4 }}
              className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-300 inline-block"
            />
          </div>

          {/* Cycling Status Label */}
          <div className="h-5 overflow-hidden flex items-center min-w-0">
            <AnimatePresence mode="wait">
              <motion.span
                key={statusIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate"
              >
                {STATUS_MESSAGES[statusIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
