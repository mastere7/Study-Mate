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
import { CourseSubjectModal } from "./components/CourseSubjectModal";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { OfflineStatusBanner } from "./components/OfflineStatusBanner";

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
import { SUPPORTED_LANGUAGES, LanguageProvider, getTranslation } from "./services/i18n";
import {
  auth,
  onAuthStateChanged,
  fetchUserData,
  logoutUser,
  syncUserDoc,
  syncFullCollection,
  syncItemToFirestore,
  deleteItemFromFirestore,
  subscribeToGroupSessions,
  saveGroupSessionToFirestore,
  deleteGroupSessionFromFirestore,
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
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("room") || params.get("code") || params.get("join") || null;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("room") || params.get("code") || params.get("join") || params.get("tab") === "group_study") {
        return "group_study";
      }
      if (params.get("tab") && tabNames[params.get("tab")!]) {
        return params.get("tab")!;
      }
    } catch {}
    return "dashboard";
  });
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
            const extractedFirst = storageService.extractFirstName(data.profile.name, data.profile.email);
            if (extractedFirst) {
              storageService.setUserFirstName(extractedFirst);
            }
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
            const extractedFirst = storageService.extractFirstName(fallbackProfile.name, fallbackProfile.email);
            if (extractedFirst) {
              storageService.setUserFirstName(extractedFirst);
            }
          }

          if (!localStorage.getItem("studymate_auth_status")) {
            storageService.setAuthStatus("returning_user");
          }

          const userSubjects = data.subjects || [];
          setSubjects(userSubjects);
          storageService.saveSubjects(userSubjects);

          const userNotes = data.notes || [];
          setNotes(userNotes);
          storageService.saveNotes(userNotes);

          const userDocs = data.documents || [];
          setDocuments(userDocs);
          storageService.saveDocuments(userDocs);

          const userAssignments = data.assignments || [];
          setAssignments(userAssignments);
          storageService.saveAssignments(userAssignments);

          const userSchedules = data.schedules || [];
          setSchedules(userSchedules);
          storageService.saveSchedules(userSchedules);

          const userQuizzes = data.quizzes || [];
          setQuizzes(userQuizzes);
          storageService.saveQuizzes(userQuizzes);

          const userDecks = data.decks || [];
          setDecks(userDecks);
          storageService.saveDecks(userDecks);

          const userSessions = data.sessions || [];
          setSessions(userSessions);
          storageService.saveSessions(userSessions);

          const userNotifications = data.notifications || [];
          setNotifications(userNotifications);
          storageService.saveNotifications(userNotifications);
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
  const [tutorPrePrompt, setTutorPrePrompt] = useState("");
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
    // 1. Sync reminders to Service Worker so reminders trigger even when tab is in background/minimized
    pushNotificationService.syncRemindersToServiceWorker(assignments, schedules);

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

    // Also check immediately when user switches back to the tab or device unlocks
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerCheck();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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

  // Live real-time listener for Group Study sessions across all users
  useEffect(() => {
    const unsub = subscribeToGroupSessions((remoteSessions) => {
      if (remoteSessions && Array.isArray(remoteSessions)) {
        const clean = remoteSessions.filter(
          (r) => r && r.id && !r.id.startsWith("sample_") && r.isLive !== false
        );
        setGroupSessions(clean);
        storageService.saveGroupSessions(clean);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveNotifications = (updated: AppNotification[]) => {
    setNotifications(updated);
    storageService.saveNotifications(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "notifications", updated);
    }
  };

  const handleSaveGroupSessions = (updated: GroupStudySession[]) => {
    const currentIds = new Set(updated.map((s) => s.id));
    groupSessions.forEach((oldSession) => {
      if (!currentIds.has(oldSession.id)) {
        deleteGroupSessionFromFirestore(oldSession.id);
      }
    });

    setGroupSessions(updated);
    storageService.saveGroupSessions(updated);

    updated.forEach((session) => {
      saveGroupSessionToFirestore(session);
    });
  };

  // Subject Management
  const handleSaveSubjects = (updated: Subject[]) => {
    setSubjects(updated);
    storageService.saveSubjects(updated);
    if (auth.currentUser) {
      syncFullCollection(auth.currentUser.uid, "subjects", updated);
    }
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    const newSub: Subject = {
      id: `sub_${Date.now()}`,
      name: newSubName.trim(),
      color: newSubColor,
      icon: "📚",
    };
    const updated = [...subjects, newSub];
    handleSaveSubjects(updated);
    setNewSubName("");
  };

  const handleDeleteSubject = (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    handleSaveSubjects(updated);
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
    <LanguageProvider initialLanguage={language} onLanguageChange={setLanguage}>
      <div className="h-screen max-h-screen flex flex-col bg-slate-100 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          user={user}
          notifications={notifications}
          onSaveNotifications={handleSaveNotifications}
          unreadNotificationsCount={unreadCount}
          subjects={subjects}
          isDarkMode={themeMode === "dark" || (themeMode === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)}
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          onToggleDarkMode={toggleDarkMode}
          currentLanguage={language}
          onLanguageChange={setLanguage}
          onOpenAuthModal={() => setIsAuthOpen(true)}
          onOpenNotifications={() => handleSelectTab("notifications")}
          onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isFirebaseAuthenticated={isFirebaseAuthenticated}
          onNavigateScreen={handleSelectTab}
        />

        {/* Main Container Layout - Fully responsive for mobile, tablets, and laptops */}
        <div className="flex w-full flex-1 min-h-0 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <Sidebar
            activeTab={currentTab}
            onTabSelect={handleSelectTab}
            unreadNotificationsCount={unreadCount}
            subjects={subjects}
            activeSubjectFilter={activeSubjectFilter}
            onSelectSubjectFilter={setActiveSubjectFilter}
            onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            isCollapsed={isSidebarCollapsed}
            currentLanguage={language}
          />

          {/* Main Content Area */}
          <main
            className={`flex-1 min-w-0 w-full ${
              currentTab === "tutor"
                ? "p-1.5 sm:p-2.5 md:p-3 flex flex-col h-full overflow-hidden"
                : "p-3 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-12 overflow-y-auto overflow-x-hidden h-full"
            } transition-all duration-300`}
          >
            {/* Universal Backward Navigation Bar (Hidden on tutor to give maximum reading height) */}
            {currentTab !== "dashboard" && currentTab !== "tutor" && (
              <div
                className="mb-6 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0 animate-in fade-in transition-all"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGoBack}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
                    title="Go to previous view"
                  >
                    <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{getTranslation(language, "back", "Back")}</span>
                  </button>

                  <button
                    onClick={handleGoHome}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all"
                    title="Return to Home Dashboard"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>{getTranslation(language, "home", "Home")}</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium ml-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                    <span>{getTranslation(language, "home", "Home")}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {getTranslation(language, currentTab, tabNames[currentTab] || currentTab)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="hidden xs:inline">{getTranslation(language, "currentView", "Current View")}:</span>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold text-[11px]">
                    {getTranslation(language, currentTab, tabNames[currentTab] || currentTab)}
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
              groupSessions={groupSessions}
              onTabSelect={(tab) => setCurrentTab(tab)}
              onStartTutorPrompt={(prompt) => {
                setTutorPrePrompt(prompt);
                setCurrentTab("tutor");
              }}
              onUpdateUser={handleSaveUser}
              onSaveAssignments={handleSaveAssignments}
              onOpenAuthModal={() => setIsAuthOpen(true)}
              onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
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
              initialJoinCode={initialRoomCode}
              onClearInitialJoinCode={() => setInitialRoomCode(null)}
              onSaveGroupSessions={handleSaveGroupSessions}
              onSaveNotes={handleSaveNotes}
            />
          )}

          {currentTab === "tutor" && (
            <div className="flex-1 min-h-0 h-full w-full overflow-hidden">
              <AITutorChat
                subjects={subjects}
                initialPrompt={tutorPrePrompt}
                onClearInitialPrompt={() => setTutorPrePrompt("")}
                onGoBack={handleGoBack}
                onGoHome={handleGoHome}
              />
            </div>
          )}

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
              user={user}
              decks={decks}
              subjects={subjects}
              onSaveDecks={handleSaveDecks}
              onUpdateUser={handleSaveUser}
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
        onLogout={async () => {
          await logoutUser();
          handleSaveUser(DEFAULT_USER);
          setSubjects(DEFAULT_SUBJECTS);
          storageService.saveSubjects(DEFAULT_SUBJECTS);
          setNotes(DEFAULT_NOTES);
          storageService.saveNotes(DEFAULT_NOTES);
          setDocuments(DEFAULT_DOCUMENTS);
          storageService.saveDocuments(DEFAULT_DOCUMENTS);
          setQuizzes(DEFAULT_QUIZZES);
          storageService.saveQuizzes(DEFAULT_QUIZZES);
          setDecks(DEFAULT_DECKS);
          storageService.saveDecks(DEFAULT_DECKS);
          setAssignments(DEFAULT_ASSIGNMENTS);
          storageService.saveAssignments(DEFAULT_ASSIGNMENTS);
          setSchedules(DEFAULT_SCHEDULES);
          storageService.saveSchedules(DEFAULT_SCHEDULES);
          setSessions(DEFAULT_SESSIONS);
          storageService.saveSessions(DEFAULT_SESSIONS);
          setNotifications(DEFAULT_NOTIFICATIONS);
          storageService.saveNotifications(DEFAULT_NOTIFICATIONS);
          storageService.saveActivities([]);
          setIsAuthOpen(false);
        }}
      />

      {/* Course Subject Manager Modal */}
      <CourseSubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        subjects={subjects}
        assignments={assignments}
        onSaveSubjects={handleSaveSubjects}
        activeSubjectFilter={activeSubjectFilter}
        onSelectSubjectFilter={setActiveSubjectFilter}
        currentUserId={user.id}
      />

      {/* Mobile Bottom Navigation Bar for Ergonomic Phone Thumb Access */}
      <MobileBottomNav
        activeTab={currentTab}
        onTabSelect={handleSelectTab}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
        currentLanguage={language}
      />

      {/* Offline Status & Service Worker Indicator */}
      <OfflineStatusBanner />
    </div>
  </LanguageProvider>
  );
}
