import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { HomeDashboard } from "./components/screens/HomeDashboard";
import { AITutorChat } from "./components/screens/AITutorChat";
import { NotesScreen } from "./components/screens/NotesScreen";
import { DocumentsScreen } from "./components/screens/DocumentsScreen";
import { QuizSection } from "./components/screens/QuizSection";
import { FlashcardsScreen } from "./components/screens/FlashcardsScreen";
import { StudyPlannerScreen } from "./components/screens/StudyPlannerScreen";
import { QuestionScanner } from "./components/screens/QuestionScanner";
import { VoiceAssistant } from "./components/screens/VoiceAssistant";
import { PomodoroTimer } from "./components/screens/PomodoroTimer";
import { ProgressAnalytics } from "./components/screens/ProgressAnalytics";
import { NotificationsDrawer } from "./components/screens/NotificationsDrawer";
import { GroupStudyScreen } from "./components/screens/GroupStudyScreen";
import { CurriculumMapScreen } from "./components/screens/CurriculumMapScreen";
import { AuthModal } from "./components/auth/AuthModal";

import {
  storageService,
  DEFAULT_USER,
  DEFAULT_SUBJECTS,
  DEFAULT_NOTES,
  DEFAULT_DOCUMENTS,
  DEFAULT_QUIZZES,
  DEFAULT_DECKS,
  DEFAULT_ASSIGNMENTS,
  DEFAULT_SCHEDULES,
  DEFAULT_SESSIONS,
  DEFAULT_NOTIFICATIONS,
} from "./services/storage";
import {
  UserProfile,
  Subject,
  Note,
  DocumentItem,
  Quiz,
  FlashcardDeck,
  Assignment,
  StudySchedule,
  PomodoroSession,
  AppNotification,
  GroupStudySession,
} from "./types";
import { Plus, Trash2, X, ArrowLeft, Home, ChevronRight } from "lucide-react";
import { pushNotificationService } from "./services/pushNotificationService";
import { SUPPORTED_LANGUAGES } from "./services/i18n";
import {
  auth,
  onAuthStateChanged,
  fetchUserData,
  syncUserDoc,
  syncFullCollection,
  syncItemToFirestore,
  deleteItemFromFirestore,
} from "./services/firebase";

const tabNames: Record<string, string> = {
  dashboard: "Home Dashboard",
  curriculum: "Curriculum Mind Map",
  group_study: "Group Study & Live Rooms",
  tutor: "AI Tutor Chat",
  notes: "Smart Notes & Summarizer",
  documents: "PDF, Word & Image File Uploader",
  quiz: "Quiz Generator",
  flashcards: "Flashcard Decks",
  planner: "Study Planner & Tasks",
  scanner: "AI Problem Scanner",
  voice: "Voice Assistant",
  pomodoro: "Pomodoro Focus Timer",
  progress: "Analytics & Progress",
  notifications: "Notifications",
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(
    () => {
      const saved = localStorage.getItem("studymate_theme_mode");
      if (saved === "light" || saved === "dark" || saved === "system") return saved;
      // fallback legacy check
      const legacy = localStorage.getItem("studymate_theme");
      if (legacy === "light") return "light";
      return "dark";
    }
  );

  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem("studymate_language") || "en";
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleSelectTab = (newTab: string) => {
    if (newTab === "menu_toggle_trigger") {
      setIsMobileMenuOpen((prev) => !prev);
      return;
    }
    setIsMobileMenuOpen(false);
    if (newTab === currentTab) return;
    setTabHistory((prev) => [...prev, currentTab]);
    setCurrentTab(newTab);
  };

  const handleGoBack = () => {
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory((prevHistory) => prevHistory.slice(0, -1));
      setCurrentTab(prev);
    } else {
      setCurrentTab("dashboard");
    }
  };

  const handleGoHome = () => {
    setTabHistory([]);
    setCurrentTab("dashboard");
  };
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState<boolean>(false);
  const [isFullScreenMode, setIsFullScreenMode] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // App Centralized State
  const [user, setUser] = useState<UserProfile>(() => storageService.getUser() || DEFAULT_USER);
  const [subjects, setSubjects] = useState<Subject[]>(() => storageService.getSubjects());
  const [notes, setNotes] = useState<Note[]>(() => storageService.getNotes());
  const [documents, setDocuments] = useState<DocumentItem[]>(() => storageService.getDocuments());
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => storageService.getQuizzes());
  const [decks, setDecks] = useState<FlashcardDeck[]>(() => storageService.getDecks());
  const [assignments, setAssignments] = useState<Assignment[]>(() => storageService.getAssignments());
  const [schedules, setSchedules] = useState<StudySchedule[]>(() => storageService.getSchedules());
  const [sessions, setSessions] = useState<PomodoroSession[]>(() => storageService.getSessions());
  const [notifications, setNotifications] = useState<AppNotification[]>(
    () => storageService.getNotifications()
  );
  const [groupSessions, setGroupSessions] = useState<GroupStudySession[]>(
    () => storageService.getGroupSessions()
  );

  // Firebase Authentication State
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState<boolean>(() => Boolean(auth.currentUser));
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsFirebaseAuthenticated(true);
        // Fetch user data from Firestore
        const data = await fetchUserData(firebaseUser.uid);
        if (data) {
          if (data.profile) {
            setUser(data.profile);
            storageService.saveUser(data.profile);
          } else {
            const fallbackProfile: UserProfile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Student User",
              email: firebaseUser.email || "",
              avatarUrl:
                firebaseUser.photoURL ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  firebaseUser.displayName || firebaseUser.email || "Student"
                )}`,
              gradeLevel: "Undergraduate Student",
              major: "General Studies",
              createdDate: new Date().toISOString(),
              dailyGoalHours: 3.0,
              notificationSound: true,
              reminderFrequency: "15m",
              quietHoursStart: "23:00",
              quietHoursEnd: "07:00",
              themePreference: "system",
            };
            setUser(fallbackProfile);
            storageService.saveUser(fallbackProfile);
          }

          if (data.subjects && data.subjects.length > 0) {
            setSubjects(data.subjects);
            storageService.saveSubjects(data.subjects);
          }
          if (data.notes && data.notes.length > 0) {
            setNotes(data.notes);
            storageService.saveNotes(data.notes);
          }
          if (data.documents && data.documents.length > 0) {
            setDocuments(data.documents);
            storageService.saveDocuments(data.documents);
          }
          if (data.assignments && data.assignments.length > 0) {
            setAssignments(data.assignments);
            storageService.saveAssignments(data.assignments);
          }
          if (data.schedules && data.schedules.length > 0) {
            setSchedules(data.schedules);
            storageService.saveSchedules(data.schedules);
          }
          if (data.quizzes && data.quizzes.length > 0) {
            setQuizzes(data.quizzes);
            storageService.saveQuizzes(data.quizzes);
          }
          if (data.decks && data.decks.length > 0) {
            setDecks(data.decks);
            storageService.saveDecks(data.decks);
          }
          if (data.sessions && data.sessions.length > 0) {
            setSessions(data.sessions);
            storageService.saveSessions(data.sessions);
          }
          if (data.notifications && data.notifications.length > 0) {
            setNotifications(data.notifications);
            storageService.saveNotifications(data.notifications);
          }
        }
      } else {
        setIsFirebaseAuthenticated(false);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Cross-component Deep-linking pre-fill parameters
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string | null>(null);
  const [quizPreTopic, setQuizPreTopic] = useState("");
  const [quizPreText, setQuizPreText] = useState("");
  const [flashcardPreTopic, setFlashcardPreTopic] = useState("");
  const [flashcardPreText, setFlashcardPreText] = useState("");

  // New Subject Form
  const [newSubName, setNewSubName] = useState("");
  const [newSubColor, setNewSubColor] = useState("bg-indigo-600 text-white");

  // Theme Mode (Light / Dark / System) Sync
  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (themeMode === "dark") {
        isDark = true;
      } else if (themeMode === "light") {
        isDark = false;
      } else {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();
    localStorage.setItem("studymate_theme_mode", themeMode);

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [themeMode]);

  // Language & Direction Sync
  useEffect(() => {
    localStorage.setItem("studymate_language", language);
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    document.documentElement.dir = langObj?.dir || "ltr";
    document.documentElement.lang = language;
  }, [language]);

  // Automated Background Push Notification Engine for Assignments and Schedules
  useEffect(() => {
    const triggerCheck = () => {
      pushNotificationService.checkAndTriggerReminders(
        assignments,
        schedules,
        notifications,
        user,
        (newNotif) => {
          setNotifications((prev) => {
            const updated = [newNotif, ...prev];
            storageService.saveNotifications(updated);
            if (auth.currentUser) {
              syncFullCollection(auth.currentUser.uid, "notifications", updated);
            }
            return updated;
          });
        }
      );
    };

    triggerCheck();
    const interval = setInterval(triggerCheck, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [assignments, schedules, user]);

  const toggleDarkMode = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Persistence Handlers with Firestore Cloud Synchronization
  const handleSaveUser = (updated: UserProfile) => {
    setUser(updated);
    storageService.saveUser(updated);
    if (auth.currentUser) {
      syncUserDoc(auth.currentUser.uid, updated);
    }
  };

  const handleSaveNotes = (updated: Note[]) => {
    setNotes(updated);
    storageService.saveNotes(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "notes", updated);
    }
  };

  const handleSaveDocuments = (updated: DocumentItem[]) => {
    setDocuments(updated);
    storageService.saveDocuments(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "documents", updated);
    }
  };

  const handleSaveQuizzes = (updated: Quiz[]) => {
    setQuizzes(updated);
    storageService.saveQuizzes(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "quizzes", updated);
    }
  };

  const handleSaveDecks = (updated: FlashcardDeck[]) => {
    setDecks(updated);
    storageService.saveDecks(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "decks", updated);
    }
  };

  const handleSaveAssignments = (updated: Assignment[]) => {
    setAssignments(updated);
    storageService.saveAssignments(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "assignments", updated);
    }
  };

  const handleSaveSchedules = (updated: StudySchedule[]) => {
    setSchedules(updated);
    storageService.saveSchedules(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "schedules", updated);
    }
  };

  const handleSaveSessions = (updated: PomodoroSession[]) => {
    setSessions(updated);
    storageService.saveSessions(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "sessions", updated);
    }
  };

  const handleSaveNotifications = (updated: AppNotification[]) => {
    setNotifications(updated);
    storageService.saveNotifications(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "notifications", updated);
    }
  };

  const handleSaveGroupSessions = (updated: GroupStudySession[]) => {
    setGroupSessions(updated);
    storageService.saveGroupSessions(updated);
  };

  // Subject Management
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    const newSub: Subject = {
      id: `sub_${Date.now()}`,
      name: newSubName.trim(),
      color: newSubColor,
    };
    const updated = [...subjects, newSub];
    setSubjects(updated);
    storageService.saveSubjects(updated);
    if (auth.currentUser) {
      syncItemToFirestore(auth.currentUser.uid, "subjects", newSub.id, newSub);
    }
    setNewSubName("");
  };

  const handleDeleteSubject = (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    setSubjects(updated);
    storageService.saveSubjects(updated);
    if (auth.currentUser) {
      deleteItemFromFirestore(auth.currentUser.uid, "subjects", id);
    }
  };

  // Cross-Navigation Generators
  const handleTriggerQuizFromText = (topic: string, text: string) => {
    setQuizPreTopic(topic);
    setQuizPreText(text);
    handleSelectTab("quiz");
  };

  const handleTriggerFlashcardsFromText = (topic: string, text: string) => {
    setFlashcardPreTopic(topic);
    setFlashcardPreText(text);
    handleSelectTab("flashcards");
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        user={user}
        unreadNotificationsCount={unreadCount}
        isDarkMode={themeMode === "dark" || (themeMode === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)}
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
        onToggleDarkMode={toggleDarkMode}
        currentLanguage={language}
        onLanguageChange={setLanguage}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onOpenNotifications={() => handleSelectTab("notifications")}
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
        isFullScreenMode={isFullScreenMode}
        onToggleFullScreen={() => setIsFullScreenMode(!isFullScreenMode)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isFirebaseAuthenticated={isFirebaseAuthenticated}
        onNavigateScreen={handleSelectTab}
      />

      {/* Main Container Layout */}
      <div className="flex pt-16 min-h-[calc(100vh-64px)]">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={currentTab}
          onTabSelect={handleSelectTab}
          unreadNotificationsCount={unreadCount}
          subjects={subjects}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed || isFullScreenMode}
          currentLanguage={language}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-300 overflow-x-hidden pb-8 ${
            isFullScreenMode
              ? "p-2 sm:p-4 md:p-6 lg:ml-16 max-w-none"
              : isSidebarCollapsed
              ? "p-4 sm:p-6 md:p-8 lg:ml-16"
              : "p-4 sm:p-6 md:p-8 lg:ml-64"
          }`}
        >
          {/* Universal Backward Navigation Bar */}
          {currentTab !== "dashboard" && (
            <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in transition-all">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
                  title="Go to previous view"
                >
                  <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleGoHome}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all"
                  title="Return to Home Dashboard"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium ml-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                  <span>Home</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {tabNames[currentTab] || currentTab}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <span className="hidden xs:inline">Current View:</span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold text-[11px]">
                  {tabNames[currentTab] || currentTab}
                </span>
              </div>
            </div>
          )}

          {currentTab === "dashboard" && (
            <HomeDashboard
              user={user}
              subjects={subjects}
              assignments={assignments}
              schedules={schedules}
              quizzes={quizzes}
              notes={notes}
              isFullScreenMode={isFullScreenMode}
              onTabSelect={(tab) => setCurrentTab(tab)}
              onUpdateUser={handleSaveUser}
            />
          )}

          {currentTab === "curriculum" && (
            <CurriculumMapScreen
              subjects={subjects}
              activeSubjectFilter={activeSubjectFilter}
              onSelectSubjectFilter={(subId) => setActiveSubjectFilter(subId)}
              onNavigateToNotes={(subjectId) => {
                if (subjectId) setActiveSubjectFilter(subjectId);
                setCurrentTab("notes");
              }}
              onNavigateToQuiz={(topicTitle) => {
                if (topicTitle) {
                  setQuizPreTopic(topicTitle);
                }
                setCurrentTab("quiz");
              }}
            />
          )}

          {currentTab === "group_study" && (
            <GroupStudyScreen
              user={user}
              subjects={subjects}
              notes={notes}
              quizzes={quizzes}
              decks={decks}
              groupSessions={groupSessions}
              onSaveGroupSessions={handleSaveGroupSessions}
              onSaveNotes={handleSaveNotes}
            />
          )}

          {currentTab === "tutor" && <AITutorChat subjects={subjects} />}

          {currentTab === "notes" && (
            <NotesScreen
              notes={notes}
              subjects={subjects}
              onSaveNotes={handleSaveNotes}
              onGenerateQuizFromText={handleTriggerQuizFromText}
              onGenerateFlashcardsFromText={handleTriggerFlashcardsFromText}
            />
          )}

          {currentTab === "documents" && (
            <DocumentsScreen
              documents={documents}
              onSaveDocuments={handleSaveDocuments}
              onGenerateQuizFromText={handleTriggerQuizFromText}
            />
          )}

          {currentTab === "quiz" && (
            <QuizSection
              quizzes={quizzes}
              subjects={subjects}
              onSaveQuizzes={handleSaveQuizzes}
              initialTopic={quizPreTopic}
              initialText={quizPreText}
            />
          )}

          {currentTab === "flashcards" && (
            <FlashcardsScreen
              decks={decks}
              subjects={subjects}
              onSaveDecks={handleSaveDecks}
              initialTopic={flashcardPreTopic}
              initialText={flashcardPreText}
            />
          )}

          {currentTab === "planner" && (
            <StudyPlannerScreen
              assignments={assignments}
              schedules={schedules}
              subjects={subjects}
              onSaveAssignments={handleSaveAssignments}
              onSaveSchedules={handleSaveSchedules}
            />
          )}

          {currentTab === "scanner" && <QuestionScanner />}

          {currentTab === "voice" && <VoiceAssistant />}

          {currentTab === "pomodoro" && (
            <PomodoroTimer sessions={sessions} onSaveSessions={handleSaveSessions} />
          )}

          {currentTab === "progress" && (
            <ProgressAnalytics
              quizzes={quizzes}
              assignments={assignments}
              sessions={sessions}
              subjects={subjects}
            />
          )}

          {currentTab === "notifications" && (
            <NotificationsDrawer
              notifications={notifications}
              assignments={assignments}
              schedules={schedules}
              subjects={subjects}
              user={user}
              onSaveNotifications={handleSaveNotifications}
              onSaveUser={handleSaveUser}
              onNavigateScreen={handleSelectTab}
            />
          )}
        </main>
      </div>

      {/* User Auth & Profile Modal */}
      <AuthModal
        currentUser={user}
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onUpdateUser={handleSaveUser}
        isFirebaseAuthenticated={isFirebaseAuthenticated}
        onLogout={() => {
          handleSaveUser(DEFAULT_USER);
          setSubjects(DEFAULT_SUBJECTS);
          setNotes(DEFAULT_NOTES);
          setDocuments(DEFAULT_DOCUMENTS);
          setQuizzes(DEFAULT_QUIZZES);
          setDecks(DEFAULT_DECKS);
          setAssignments(DEFAULT_ASSIGNMENTS);
          setSchedules(DEFAULT_SCHEDULES);
          setSessions(DEFAULT_SESSIONS);
          setNotifications(DEFAULT_NOTIFICATIONS);
          setIsAuthOpen(false);
        }}
      />

      {/* Subject Manager Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Manage Course Subjects
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Subjects List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${sub.color.split(" ")[0]}`} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubject(sub.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Subject Form */}
            <form onSubmit={handleAddSubject} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                + Add New Course Subject
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none font-semibold"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
