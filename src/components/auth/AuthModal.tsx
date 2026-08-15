import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  KeyRound,
  Mail,
  GraduationCap,
  Trophy,
  LogOut,
  Flame,
  X,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Send,
  Camera,
} from "lucide-react";
import { UserProfile } from "../../types";
import { storageService } from "../../services/storage";
import { AvatarSelector } from "./AvatarSelector";
import {
  auth,
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  resetUserPassword,
  sendVerificationEmail,
  syncUserDoc,
} from "../../services/firebase";

interface AuthModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
  isFirebaseAuthenticated?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateUser,
  onLogout,
  isFirebaseAuthenticated = false,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "login" | "register" | "forgot">(
    isFirebaseAuthenticated ? "profile" : "login"
  );

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [name, setName] = useState(currentUser.name || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [gradeLevel, setGradeLevel] = useState(currentUser.gradeLevel || "");
  const [major, setMajor] = useState(currentUser.major || "");
  const [studyGoal, setStudyGoal] = useState(currentUser.studyGoal || "");
  
  // UI feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registeredEmailSent, setRegisteredEmailSent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      setGradeLevel(currentUser.gradeLevel || "");
      setMajor(currentUser.major || "");
      setStudyGoal(currentUser.studyGoal || "");
      setErrorMessage(null);
      setSuccessMessage(null);
      if (auth.currentUser) {
        setActiveTab("profile");
      } else {
        setActiveTab("login");
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRegisteredEmailSent(null);
  };

  const parseFirebaseError = (err: any): string => {
    const code = err?.code || "";
    if (code === "auth/operation-not-allowed") {
      return "Email/Password sign-in is currently disabled in your Firebase project. Please enable Email/Password provider in the Firebase Console (Authentication > Sign-in method) or sign in with Google.";
    }
    if (code === "auth/email-already-in-use") return "This email is already registered. Please Sign In.";
    if (code === "auth/invalid-email") return "Please enter a valid email address.";
    if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
      return "Invalid email or password. Please check your credentials.";
    }
    if (code === "auth/weak-password") return "Password should be at least 6 characters.";
    if (code === "auth/too-many-requests") return "Too many requests. Please wait a moment before trying again.";
    if (code === "auth/popup-closed-by-user") return "Google Sign-In popup was closed before finishing.";
    return err?.message || "An unexpected authentication error occurred. Please try again.";
  };

  const handleSelectAvatar = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
    const updated: UserProfile = {
      ...currentUser,
      avatarUrl: newAvatarUrl,
    };
    onUpdateUser(updated);
    storageService.saveUser(updated);
    if (auth.currentUser) {
      syncUserDoc(auth.currentUser.uid, updated);
    }
    setSuccessMessage("Avatar updated!");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // 1. Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      const updated: UserProfile = {
        ...currentUser,
        name: name.trim() || currentUser.name,
        avatarUrl: avatarUrl || currentUser.avatarUrl,
        gradeLevel: gradeLevel.trim() || currentUser.gradeLevel,
        major: major.trim() || currentUser.major,
        studyGoal: studyGoal.trim() || currentUser.studyGoal,
      };

      if (auth.currentUser) {
        await syncUserDoc(auth.currentUser.uid, updated);
      }
      onUpdateUser(updated);
      setSuccessMessage("Profile saved successfully!");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const userCred = await loginWithEmail(email.trim(), password);
      const firstName = storageService.extractFirstName(userCred.displayName, email.trim()) || "Student";
      storageService.setUserFirstName(firstName);
      storageService.setAuthStatus("returning_user");
      setSuccessMessage(`Welcome back, ${firstName}! You are now signed in.`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Email Register (Sends verification email upon creation)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const targetEmail = email.trim();
      const chosenName = registerName.trim() || targetEmail.split("@")[0] || "Student";
      const newProfile = await registerWithEmail(
        targetEmail,
        password,
        chosenName,
        "Undergraduate Student",
        "General Studies"
      );
      const firstName = storageService.extractFirstName(chosenName, targetEmail) || "Student";
      storageService.setUserFirstName(firstName);
      storageService.setAuthStatus("new_account");
      onUpdateUser(newProfile);
      setRegisteredEmailSent(targetEmail);
      setSuccessMessage(`Welcome, ${firstName}! A verification link has been sent to ${targetEmail}.`);
    } catch (err: any) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Email Verification
  const handleResendVerification = async () => {
    clearMessages();
    setIsResendingEmail(true);
    try {
      await sendVerificationEmail();
      setSuccessMessage("Verification link sent! Please check your inbox and spam folder.");
    } catch (err: any) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsResendingEmail(false);
    }
  };

  // 4. Google Sign-In
  const handleGoogleSignIn = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      const result = await loginWithGoogle();
      const googleUser = result.user;
      const firstName = storageService.extractFirstName(googleUser.displayName, googleUser.email) || "Student";
      storageService.setUserFirstName(firstName);
      
      if (result.isNewAccount) {
        storageService.setAuthStatus("new_account");
        setSuccessMessage(`Welcome, ${firstName}! Signed in with Google.`);
      } else {
        storageService.setAuthStatus("returning_user");
        setSuccessMessage(`Welcome back, ${firstName}! Signed in with Google.`);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Password Reset
  const handleForgotPass = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim()) {
      setErrorMessage("Please enter your email to send a reset link.");
      return;
    }

    setIsLoading(true);
    try {
      await resetUserPassword(email.trim());
      setSuccessMessage("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        setActiveTab("login");
      }, 3000);
    } catch (err: any) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Sign Out
  const handleSignOut = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await logoutUser();
      onLogout();
      setSuccessMessage("Signed out successfully.");
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const isUserLoggedIn = Boolean(auth.currentUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Top Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                {activeTab === "profile"
                  ? "Student Profile & Avatar"
                  : activeTab === "register"
                  ? "Create Account"
                  : activeTab === "forgot"
                  ? "Reset Password"
                  : "Sign In"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isUserLoggedIn ? "Synced with Cloud Database" : "Customize your avatar & save study records"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Sub-tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab("profile");
              clearMessages();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "profile"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Profile & Avatar
          </button>
          <button
            onClick={() => {
              setActiveTab("login");
              clearMessages();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "login"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              clearMessages();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "register"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* VIEW 1: Active Student Profile & Avatar Customizer */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Avatar & Photo Customizer Section */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <AvatarSelector
                currentAvatarUrl={avatarUrl || currentUser.avatarUrl}
                userName={name || currentUser.name}
                userEmail={currentUser.email}
                onSelectAvatar={handleSelectAvatar}
              />
            </div>

            {/* Gamification Stats Bar */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Study Streak</span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {currentUser.streakDays || 5} Days
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Study Points</span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {currentUser.totalPoints || 420} XP
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Degree / Level</label>
                <input
                  type="text"
                  placeholder="e.g. Undergraduate"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Major / Field</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Academic Goal</label>
              <input
                type="text"
                placeholder="e.g. Maintain 3.8+ GPA and Ace Finals"
                value={studyGoal}
                onChange={(e) => setStudyGoal(e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Email Verification Status Card */}
            {auth.currentUser?.email && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{auth.currentUser.email}</span>
                  </span>
                  {auth.currentUser.emailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-extrabold text-[10px]">
                      Unverified
                    </span>
                  )}
                </div>

                {!auth.currentUser.emailVerified && (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Verify your email to secure your study records.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResendingEmail}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {isResendingEmail ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>Resend Link</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: Login */}
        {activeTab === "login" && (
          <div className="space-y-4">
            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">or sign in with email</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Student Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("forgot");
                    clearMessages();
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Sign In to StudyMate</span>
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: Register (Simplified strictly for Email & Password with Email Verification) */}
        {activeTab === "register" && (
          <div className="space-y-4">
            {registeredEmailSent ? (
              <div className="p-5 rounded-3xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-center space-y-3.5 animate-in fade-in">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Mail className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Verify Your Email
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    We sent a verification link to:
                  </p>
                  <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 break-all">
                    {registeredEmailSent}
                  </p>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-white/70 dark:bg-slate-900/70 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                  Please check your inbox and click the verification link to confirm your student email. Don't forget to check your spam/junk folder if it doesn't arrive immediately.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResendingEmail}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    {isResendingEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Resend Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("profile");
                      clearMessages();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
                  >
                    Continue to Profile
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Google Sign-Up Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign Up with Google</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">or sign up with email</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Name / First Name</span>
                    </label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Student Email</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span>Password</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="mt-1 w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span>Confirm Password</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="mt-1 w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Create Free Student Account</span>
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* VIEW 4: Forgot Password */}
        {activeTab === "forgot" && (
          <form onSubmit={handleForgotPass} className="space-y-4 text-xs">
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Enter your student email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Student Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  clearMessages();
                }}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Send Reset Link</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
