import React, { useState, useEffect } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle,
  Coffee,
  Brain,
} from "lucide-react";
import { PomodoroSession } from "../../types";
import { audioSynth } from "../../services/audioSynth";

interface PomodoroTimerProps {
  sessions: PomodoroSession[];
  onSaveSessions: (sessions: PomodoroSession[]) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  sessions,
  onSaveSessions,
}) => {
  const [mode, setMode] = useState<"work" | "shortBreak" | "longBreak">("work");
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeSound, setActiveSound] = useState<"none" | "rain" | "whitenoise" | "waves" | "cafe">("none");
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  // Set mode times
  const getModeDuration = (m: "work" | "shortBreak" | "longBreak") => {
    switch (m) {
      case "work":
        return 25 * 60;
      case "shortBreak":
        return 5 * 60;
      case "longBreak":
        return 15 * 60;
    }
  };

  const handleSwitchMode = (newMode: "work" | "shortBreak" | "longBreak") => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(getModeDuration(newMode));
  };

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      audioSynth.playChime("bell");

      if (mode === "work") {
        setCompletedCycles((prev) => prev + 1);
        const newSession: PomodoroSession = {
          id: `pomo_${Date.now()}`,
          userId: "u_student_1",
          durationMinutes: 25,
          timestamp: new Date().toISOString(),
          type: "focus",
        };
        onSaveSessions([newSession, ...sessions]);
        handleSwitchMode("shortBreak");
      } else {
        handleSwitchMode("work");
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleSound = (sound: "none" | "rain" | "whitenoise" | "waves" | "cafe") => {
    if (activeSound === sound || sound === "none") {
      audioSynth.stopAmbientSound();
      setActiveSound("none");
    } else {
      const mappedSound = sound === "cafe" ? "lofi" : sound;
      audioSynth.startAmbientSound(mappedSound as any);
      setActiveSound(sound);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const totalDuration = getModeDuration(mode);
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Timer className="w-6 h-6 text-rose-500" />
          <span>Pomodoro Focus Timer & Ambient Generator</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Boost focus with timed study intervals & relaxing background audio synthesizers
        </p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xl space-y-8 text-center flex flex-col items-center justify-center">
        {/* Mode Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleSwitchMode("work")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === "work"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Brain className="w-4 h-4" /> Focus (25m)
          </button>
          <button
            onClick={() => handleSwitchMode("shortBreak")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === "shortBreak"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Coffee className="w-4 h-4" /> Short Break (5m)
          </button>
          <button
            onClick={() => handleSwitchMode("longBreak")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === "longBreak"
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Coffee className="w-4 h-4" /> Long Break (15m)
          </button>
        </div>

        {/* Large Timer Circle Visual */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center shadow-inner">
          <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
            {formattedTime}
          </span>
          <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
            {mode === "work" ? "Focus Interval" : "Rest Period"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center justify-center w-14 h-14 rounded-2xl font-bold text-white shadow-lg transition-all ${
              isRunning
                ? "bg-amber-500 shadow-amber-500/30"
                : "bg-indigo-600 shadow-indigo-500/30 hover:bg-indigo-700"
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(getModeDuration(mode));
            }}
            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient Sound Synthesizer Selector */}
        <div className="w-full max-w-xl pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Ambient Background Audio:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "rain", label: "Soft Rain" },
              { id: "whitenoise", label: "White Noise" },
              { id: "waves", label: "Ocean Waves" },
              { id: "cafe", label: "Cozy Cafe" },
            ].map((snd) => {
              const isActive = activeSound === snd.id;
              return (
                <button
                  key={snd.id}
                  onClick={() => toggleSound(snd.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{snd.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
