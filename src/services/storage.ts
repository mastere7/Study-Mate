import {
  User,
  Subject,
  Note,
  DocumentItem,
  Assignment,
  StudySchedule,
  Quiz,
  FlashcardDeck,
  AppNotification,
  PomodoroSession,
  DailyStudyLog,
  TopicNode,
  TopicEdge,
  GroupStudySession,
  AIChatSession,
  AIChatMessage,
  RoadmapBadge,
  ActivityItem,
} from "../types";

// Keys for local storage
const KEYS = {
  USER: "studymate_user",
  SUBJECTS: "studymate_subjects",
  NOTES: "studymate_notes",
  DOCUMENTS: "studymate_documents",
  ASSIGNMENTS: "studymate_assignments",
  SCHEDULES: "studymate_schedules",
  QUIZZES: "studymate_quizzes",
  FLASHCARD_DECKS: "studymate_flashcards",
  NOTIFICATIONS: "studymate_notifications",
  POMODORO_SESSIONS: "studymate_pomodoro",
  STUDY_LOGS: "studymate_logs",
  GROUP_SESSIONS: "studymate_group_sessions",
  TOPIC_NODES: "studymate_topic_nodes",
  TOPIC_EDGES: "studymate_topic_edges",
  CHAT_SESSIONS: "studymate_chat_sessions",
  ROADMAP_BADGES: "studymate_roadmap_badges",
  ACTIVITIES: "studymate_activities",
  THEME: "studymate_theme",
  STREAK: "studymate_streak",
};

// Default User (Guest / Unauthenticated initially)
export const DEFAULT_USER: User = {
  id: "u_guest",
  name: "",
  email: "",
  avatarUrl: "",
  gradeLevel: "",
  major: "",
  createdDate: new Date().toISOString(),
  dailyGoalHours: 0,
  notificationSound: true,
  reminderFrequency: "15m",
  quietHoursStart: "23:00",
  quietHoursEnd: "07:00",
  themePreference: "system",
};

// All course & learning data starts completely empty for the user to upload and generate
export const DEFAULT_SUBJECTS: Subject[] = [];
export const DEFAULT_NOTES: Note[] = [];
export const DEFAULT_ASSIGNMENTS: Assignment[] = [];
export const DEFAULT_SCHEDULES: StudySchedule[] = [];
export const DEFAULT_FLASHCARDS: FlashcardDeck[] = [];
export const DEFAULT_DOCUMENTS: DocumentItem[] = [];
export const DEFAULT_QUIZZES: Quiz[] = [];
export const DEFAULT_DECKS: FlashcardDeck[] = [];
export const DEFAULT_SESSIONS: PomodoroSession[] = [];
export const DEFAULT_GROUP_SESSIONS: GroupStudySession[] = [];
export const DEFAULT_TOPIC_NODES: TopicNode[] = [];
export const DEFAULT_TOPIC_EDGES: TopicEdge[] = [];
export const DEFAULT_CHAT_SESSIONS: AIChatSession[] = [];

// Default Notifications (starts empty for user to receive their own alerts)
export const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

// Storage Helper Engine
export const storageService = {
  getUser: (): User => {
    const data = localStorage.getItem(KEYS.USER);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.name === "Alex Rivera" || parsed.email === "alex.rivera@university.edu") {
          return DEFAULT_USER;
        }
        return parsed;
      } catch {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  },
  saveUser: (user: User) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  getSubjects: (): Subject[] => {
    const data = localStorage.getItem(KEYS.SUBJECTS);
    if (!data) return [];
    try {
      const parsed: Subject[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      // Clean out legacy sample placeholder subjects
      const legacyIds = new Set(["sub_1", "sub_2", "sub_3", "sub_4", "sub_bio", "sub_cs", "sub_math", "sub_hist"]);
      const legacyNames = new Set(["Biology 101", "Computer Science", "Calculus II", "World History"]);
      const filtered = parsed.filter(
        (s) => s && s.id && !legacyIds.has(s.id) && !legacyNames.has(s.name)
      );
      if (filtered.length !== parsed.length) {
        localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return [];
    }
  },
  saveSubjects: (subjects: Subject[]) => {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  },
  clearSubjects: () => {
    localStorage.removeItem(KEYS.SUBJECTS);
  },

  getNotes: (): Note[] => {
    const data = localStorage.getItem(KEYS.NOTES);
    if (!data) return [];
    try {
      const parsed: Note[] = JSON.parse(data);
      return parsed.filter((n) => {
        const titleLower = (n.title || "").toLowerCase();
        const contentLower = (n.content || "").toLowerCase();
        const tagsLower = (n.tags || []).join(" ").toLowerCase();
        return !titleLower.includes("wireshark") &&
               !titleLower.includes("whireshirk") &&
               !titleLower.includes("wireshirk") &&
               !contentLower.includes("wireshark") &&
               !tagsLower.includes("wireshark");
      });
    } catch {
      return [];
    }
  },
  saveNotes: (notes: Note[]) => {
    const cleaned = notes.filter((n) => {
      const titleLower = (n.title || "").toLowerCase();
      return !titleLower.includes("wireshark") && !titleLower.includes("whireshirk") && !titleLower.includes("wireshirk");
    });
    localStorage.setItem(KEYS.NOTES, JSON.stringify(cleaned));
  },

  getDocuments: (): DocumentItem[] => {
    const data = localStorage.getItem(KEYS.DOCUMENTS);
    if (!data) return [];
    try {
      const parsed: DocumentItem[] = JSON.parse(data);
      return parsed.filter((d) => {
        const titleLower = (d.title || "").toLowerCase();
        const fileLower = (d.fileName || "").toLowerCase();
        return !titleLower.includes("wireshark") &&
               !titleLower.includes("whireshirk") &&
               !titleLower.includes("wireshirk") &&
               !fileLower.includes("wireshark") &&
               !fileLower.includes("wireshirk");
      });
    } catch {
      return [];
    }
  },
  saveDocuments: (docs: DocumentItem[]) => {
    const cleaned = docs.filter((d) => {
      const titleLower = (d.title || "").toLowerCase();
      const fileLower = (d.fileName || "").toLowerCase();
      return !titleLower.includes("wireshark") && !titleLower.includes("whireshirk") && !fileLower.includes("wireshark");
    });
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(cleaned));
  },

  getAssignments: (): Assignment[] => {
    const data = localStorage.getItem(KEYS.ASSIGNMENTS);
    if (!data) return [];
    try {
      const parsed: Assignment[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const legacyIds = new Set(["asg_1", "asg_2", "asg_3", "asg_4", "asg_sample", "a_sample_1", "a_sample_2"]);
      const filtered = parsed.filter((a) => a && a.id && !legacyIds.has(a.id));
      if (filtered.length !== parsed.length) {
        localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return [];
    }
  },
  saveAssignments: (assignments: Assignment[]) => {
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  },

  getSchedules: (): StudySchedule[] => {
    const data = localStorage.getItem(KEYS.SCHEDULES);
    return data ? JSON.parse(data) : [];
  },
  saveSchedules: (schedules: StudySchedule[]) => {
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
  },

  getQuizzes: (): Quiz[] => {
    const data = localStorage.getItem(KEYS.QUIZZES);
    return data ? JSON.parse(data) : [];
  },
  saveQuizzes: (quizzes: Quiz[]) => {
    localStorage.setItem(KEYS.QUIZZES, JSON.stringify(quizzes));
  },

  getFlashcards: (): FlashcardDeck[] => {
    const data = localStorage.getItem(KEYS.FLASHCARD_DECKS);
    return data ? JSON.parse(data) : [];
  },
  getDecks: (): FlashcardDeck[] => {
    const data = localStorage.getItem(KEYS.FLASHCARD_DECKS);
    return data ? JSON.parse(data) : [];
  },
  saveFlashcards: (decks: FlashcardDeck[]) => {
    localStorage.setItem(KEYS.FLASHCARD_DECKS, JSON.stringify(decks));
  },
  saveDecks: (decks: FlashcardDeck[]) => {
    localStorage.setItem(KEYS.FLASHCARD_DECKS, JSON.stringify(decks));
  },

  getNotifications: (): AppNotification[] => {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!data) return [];
    try {
      const parsed: AppNotification[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const legacyIds = new Set(["notif_1", "notif_sample", "notif_welcome"]);
      const filtered = parsed.filter((n) => n && n.id && !legacyIds.has(n.id));
      if (filtered.length !== parsed.length) {
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return [];
    }
  },
  saveNotifications: (notifs: AppNotification[]) => {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  getPomodoroSessions: (): PomodoroSession[] => {
    const data = localStorage.getItem(KEYS.POMODORO_SESSIONS);
    return data ? JSON.parse(data) : [];
  },
  getSessions: (): PomodoroSession[] => {
    const data = localStorage.getItem(KEYS.POMODORO_SESSIONS);
    return data ? JSON.parse(data) : [];
  },
  savePomodoroSessions: (sessions: PomodoroSession[]) => {
    localStorage.setItem(KEYS.POMODORO_SESSIONS, JSON.stringify(sessions));
  },
  saveSessions: (sessions: PomodoroSession[]) => {
    localStorage.setItem(KEYS.POMODORO_SESSIONS, JSON.stringify(sessions));
  },

  getStudyLogs: (): DailyStudyLog[] => {
    const data = localStorage.getItem(KEYS.STUDY_LOGS);
    return data ? JSON.parse(data) : [];
  },
  saveStudyLogs: (logs: DailyStudyLog[]) => {
    localStorage.setItem(KEYS.STUDY_LOGS, JSON.stringify(logs));
  },

  getGroupSessions: (): GroupStudySession[] => {
    const data = localStorage.getItem(KEYS.GROUP_SESSIONS);
    if (!data) return [];
    try {
      const parsed: GroupStudySession[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((r) => {
        if (!r || !r.id) return false;
        const titleLower = (r.title || "").toLowerCase();
        const descLower = (r.description || "").toLowerCase();
        const codeLower = (r.code || "").toLowerCase();
        const isSampleOrLegacy =
          r.id.startsWith("sample_") ||
          r.id === "sample_room_1" ||
          r.id === "sample_room_2" ||
          titleLower.includes("wireshark") ||
          titleLower.includes("whireshirk") ||
          descLower.includes("wireshark") ||
          codeLower.includes("wireshark");
        return !isSampleOrLegacy && r.isLive !== false;
      });
    } catch {
      return [];
    }
  },
  saveGroupSessions: (sessions: GroupStudySession[]) => {
    const cleaned = (sessions || []).filter((r) => {
      if (!r || !r.id) return false;
      const titleLower = (r.title || "").toLowerCase();
      const descLower = (r.description || "").toLowerCase();
      return !titleLower.includes("wireshark") && !titleLower.includes("whireshirk") && !descLower.includes("wireshark");
    });
    localStorage.setItem(KEYS.GROUP_SESSIONS, JSON.stringify(cleaned));
  },
  clearGroupSessions: () => {
    localStorage.removeItem(KEYS.GROUP_SESSIONS);
  },

  getTopicNodes: (): TopicNode[] => {
    const data = localStorage.getItem(KEYS.TOPIC_NODES);
    return data ? JSON.parse(data) : [];
  },
  saveTopicNodes: (nodes: TopicNode[]) => {
    localStorage.setItem(KEYS.TOPIC_NODES, JSON.stringify(nodes));
  },

  getTopicEdges: (): TopicEdge[] => {
    const data = localStorage.getItem(KEYS.TOPIC_EDGES);
    return data ? JSON.parse(data) : [];
  },
  saveTopicEdges: (edges: TopicEdge[]) => {
    localStorage.setItem(KEYS.TOPIC_EDGES, JSON.stringify(edges));
  },

  getChatSessions: (): AIChatSession[] => {
    const data = localStorage.getItem(KEYS.CHAT_SESSIONS);
    return data ? JSON.parse(data) : [];
  },
  saveChatSessions: (sessions: AIChatSession[]) => {
    localStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
  },

  getUnlockedBadges: (): RoadmapBadge[] => {
    const data = localStorage.getItem(KEYS.ROADMAP_BADGES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },
  saveUnlockedBadges: (badges: RoadmapBadge[]) => {
    localStorage.setItem(KEYS.ROADMAP_BADGES, JSON.stringify(badges));
  },

  getActivities: (): ActivityItem[] => {
    const data = localStorage.getItem(KEYS.ACTIVITIES);
    if (!data) return [];
    try {
      const parsed: ActivityItem[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const legacyIds = new Set(["act_1", "act_2", "act_3", "act_sample"]);
      const filtered = parsed.filter((a) => {
        if (!a || !a.id || legacyIds.has(a.id) || a.id.startsWith("act_sample_")) return false;
        const titleLower = (a.title || "").toLowerCase();
        const descLower = (a.description || "").toLowerCase();
        return !titleLower.includes("wireshark") &&
               !titleLower.includes("whireshirk") &&
               !titleLower.includes("wireshirk") &&
               !descLower.includes("wireshark") &&
               !descLower.includes("wireshirk");
      });
      if (filtered.length !== parsed.length) {
        localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return [];
    }
  },
  saveActivities: (activities: ActivityItem[]) => {
    const cleaned = activities.filter((a) => {
      const titleLower = (a.title || "").toLowerCase();
      const descLower = (a.description || "").toLowerCase();
      return !titleLower.includes("wireshark") && !titleLower.includes("whireshirk") && !descLower.includes("wireshark");
    });
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(cleaned.slice(0, 50)));
  },
  addActivity: (item: Omit<ActivityItem, "id" | "timestamp">) => {
    const data = localStorage.getItem(KEYS.ACTIVITIES);
    const existing: ActivityItem[] = data ? JSON.parse(data) : [];
    const newActivity: ActivityItem = {
      ...item,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newActivity, ...existing].slice(0, 50);
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(updated));
    return updated;
  },

  extractFirstName: (name?: string | null, email?: string | null): string => {
    // 1. Direct name if valid and not a placeholder
    const cleanName = (name || "").trim();
    if (
      cleanName &&
      cleanName !== "Alex Rivera" &&
      cleanName !== "Student" &&
      cleanName !== "Student User" &&
      cleanName !== "User"
    ) {
      const first = cleanName.split(/\s+/)[0];
      if (first) {
        return first.charAt(0).toUpperCase() + first.slice(1);
      }
    }

    // 2. Saved local storage first name
    const stored = localStorage.getItem("studymate_user_first_name")?.trim();
    if (stored && stored !== "Student" && stored !== "User") {
      return stored.charAt(0).toUpperCase() + stored.slice(1);
    }

    // 3. Intelligently extract from email
    const cleanEmail = (email || "").trim();
    if (
      cleanEmail &&
      cleanEmail.includes("@") &&
      cleanEmail !== "alex.rivera@university.edu"
    ) {
      const handle = cleanEmail.split("@")[0];
      const parts = handle.split(/[._-]+/);
      if (parts.length > 1) {
        const first = parts[0].replace(/[0-9]+/g, "");
        if (first.length >= 2) {
          return first.charAt(0).toUpperCase() + first.slice(1);
        }
      }
      const alphaOnly = handle.replace(/[0-9]+/g, "");
      if (alphaOnly.length >= 2) {
        return alphaOnly.charAt(0).toUpperCase() + alphaOnly.slice(1);
      }
      return handle.charAt(0).toUpperCase() + handle.slice(1);
    }

    if (cleanName) {
      const first = cleanName.split(/\s+/)[0];
      if (first) return first.charAt(0).toUpperCase() + first.slice(1);
    }

    return "";
  },

  getAuthStatus: (): "new_account" | "returning_user" | "guest" => {
    const status = localStorage.getItem("studymate_auth_status");
    if (status === "new_account" || status === "returning_user") return status;
    return "guest";
  },

  setAuthStatus: (status: "new_account" | "returning_user") => {
    localStorage.setItem("studymate_auth_status", status);
  },

  setUserFirstName: (firstName: string) => {
    if (firstName) {
      localStorage.setItem("studymate_user_first_name", firstName);
    }
  },
};

