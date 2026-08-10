import React, { useState } from "react";
import { User, KeyRound, Mail, GraduationCap, Trophy, LogOut, Flame, X, Check } from "lucide-react";
import { UserProfile } from "../../types";

interface AuthModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "login" | "register" | "forgot">("profile");

  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(currentUser.name);
  const [gradeLevel, setGradeLevel] = useState(currentUser.gradeLevel);
  const [studyGoal, setStudyGoal] = useState(currentUser.studyGoal);
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name,
      gradeLevel,
      studyGoal,
    });
    onClose();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      email: email || currentUser.email,
      name: name || "Student User",
    });
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      email: email || "student@university.edu",
      name: name || "New Student",
      gradeLevel: gradeLevel || "Computer Science B.S.",
    });
    onClose();
  };

  const handleForgotPass = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setActiveTab("login");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Student Profile & Auth
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Sub-tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "profile" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "login" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "register" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
            }`}
          >
            Register
          </button>
        </div>

        {/* VIEW 1: Active Student Profile */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Gamification Stats Bar */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Study Streak</span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{currentUser.streakDays} Days</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Study Points</span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{currentUser.totalPoints} XP</p>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Student Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Degree / Major / Grade Level</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Primary Academic Goal</label>
              <input
                type="text"
                value={studyGoal}
                onChange={(e) => setStudyGoal(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: Login */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Student Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.student@university.edu"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab("forgot")}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
            >
              Sign In to StudyMate
            </button>
          </form>
        )}

        {/* VIEW 3: Register */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Student Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.student@university.edu"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
            >
              Create Free Student Account
            </button>
          </form>
        )}

        {/* VIEW 4: Forgot Password */}
        {activeTab === "forgot" && (
          <form onSubmit={handleForgotPass} className="space-y-4 text-xs">
            {forgotSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-semibold text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Password reset link sent to your email!
              </div>
            ) : (
              <>
                <p className="text-slate-500 text-[11px]">
                  Enter your student email to receive a password recovery link.
                </p>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Student Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.student@university.edu"
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Send Reset Link
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
