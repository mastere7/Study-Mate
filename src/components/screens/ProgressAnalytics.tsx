import React from "react";
import {
  BarChart2,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Quiz, Assignment, PomodoroSession, Subject } from "../../types";

interface ProgressAnalyticsProps {
  quizzes: Quiz[];
  assignments: Assignment[];
  sessions: PomodoroSession[];
  subjects: Subject[];
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  quizzes,
  assignments,
  sessions,
  subjects,
}) => {
  // Chart Data: Quiz score performance over time
  const scoredQuizzes = quizzes.filter((q) => q.score !== undefined);
  const quizTrendData = scoredQuizzes
    .slice(-7)
    .map((q) => ({
      name: q.title.length > 12 ? q.title.slice(0, 10) + "..." : q.title,
      score: q.score || 0,
    }));

  // Calculate real focus hours from Pomodoro sessions
  const totalFocusMinutes = sessions
    .filter((s) => s.type === "focus")
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // Compute real study hours per day for the last 7 days
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const last7Days: { day: string; dateStr: string; hours: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = daysOfWeek[d.getDay()];
    
    // Sum pomodoro sessions for this date
    const daySessionsMins = sessions
      .filter((s) => s.type === "focus" && s.timestamp && s.timestamp.startsWith(dateStr))
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    last7Days.push({
      day: dayName,
      dateStr,
      hours: parseFloat((daySessionsMins / 60).toFixed(1)),
    });
  }
  const studyHoursData = last7Days;

  const totalAssCount = assignments.length;
  const completedAssCount = assignments.filter((a) => a.status === "Completed").length;
  const assCompletionPercent = totalAssCount > 0 ? Math.round((completedAssCount / totalAssCount) * 100) : 0;

  const avgQuizScore =
    scoredQuizzes.length > 0
      ? Math.round(
          scoredQuizzes.reduce((acc, q) => acc + (q.score || 0), 0) / scoredQuizzes.length
        )
      : 0;

  // Determine smart AI recommendation
  const lowestScoringQuiz = scoredQuizzes.length > 0
    ? [...scoredQuizzes].sort((a, b) => (a.score || 0) - (b.score || 0))[0]
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span>Progress & Learning Analytics</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Track academic performance, study time investments, subject proficiencies, and AI recommendations
        </p>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Avg Quiz Score
            </span>
            <Award className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {scoredQuizzes.length > 0 ? `${avgQuizScore}%` : "—"}
          </p>
          <p className="text-[11px] text-slate-400">
            {scoredQuizzes.length > 0 ? `${scoredQuizzes.length} quiz${scoredQuizzes.length === 1 ? "" : "zes"} completed` : "No quizzes taken yet"}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tasks Completed
            </span>
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {completedAssCount}/{totalAssCount} {totalAssCount > 0 ? `(${assCompletionPercent}%)` : ""}
          </p>
          <p className="text-[11px] text-slate-400">
            {totalAssCount > 0 ? "Assignments completed" : "No assignments added"}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Focus Hours
            </span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {totalFocusHours} hrs
          </p>
          <p className="text-[11px] text-slate-400">Logged via Pomodoro timer</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Subjects
            </span>
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {subjects.length} {subjects.length === 1 ? "Subject" : "Subjects"}
          </p>
          <p className="text-[11px] text-slate-400">Coursework enrolled</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Score History Chart */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Quiz Performance Trend</span>
          </h3>

          <div className="h-64 flex items-center justify-center">
            {quizTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={quizTrendData}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 space-y-2">
                <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No quiz scores recorded yet</p>
                <p className="text-[11px] text-slate-400">Generate or take an AI Quiz to track your mastery scores over time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Study Hours Bar Chart */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            <span>Weekly Study Investment (Hours)</span>
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyHoursData}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Performance Recommendation Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>StudyMate AI Learning Insights</span>
        </div>
        {lowestScoringQuiz ? (
          <>
            <h4 className="font-extrabold text-lg">Recommended Review: {lowestScoringQuiz.title}</h4>
            <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
              Based on your latest score ({lowestScoringQuiz.score}%), generating flashcards or summarizing related course materials will help boost your comprehension and retention.
            </p>
          </>
        ) : (
          <>
            <h4 className="font-extrabold text-lg">Personalized AI Study Insights</h4>
            <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
              As you create notes, set deadline reminders, and complete Pomodoro focus sessions, StudyMate AI will analyze your learning velocity to provide targeted study recommendations.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
