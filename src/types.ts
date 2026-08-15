/**
 * StudyMate - Data Types and Interfaces
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  gradeLevel?: string; // e.g., "Undergraduate", "High School Senior", "Graduate"
  major?: string; // e.g., "Computer Science", "Medicine", "Engineering"
  studyGoal?: string;
  streakDays?: number;
  totalPoints?: number;
  createdDate: string;
  dailyGoalHours: number; // e.g. 2.5
  notificationSound: boolean;
  reminderFrequency: "15m" | "30m" | "1h" | "off";
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string; // e.g. "07:00"
  themePreference: "light" | "dark" | "system";
}

export type UserProfile = User;

export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color or hex
  icon?: string;
  code?: string; // e.g. "CS101", "BIO200"
  description?: string;
  instructor?: string;
}

export interface Note {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  content: string;
  isPinned: boolean;
  tags: string[];
  summary?: string;
  imageAttachment?: string; // Base64 or image URL
  createdDate: string;
  updatedDate: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  fileName: string;
  fileType: string; // "pdf", "docx", "pptx", "image"
  fileSize: string;
  uploadDate: string;
  summary?: string;
  keyPoints?: string[];
  extractedText?: string;
  fileData?: string; // Base64 if cached locally
}

export type PriorityLevel = "High" | "Medium" | "Low";
export type TaskStatus = "To Do" | "In Progress" | "Completed";

export interface Assignment {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  priority: PriorityLevel;
  status: TaskStatus;
}

export interface StudySchedule {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isCompleted: boolean;
  type: "session" | "revision" | "exam";
}

export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "essay";

export interface QuizQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  options?: string[]; // 4 options for multiple choice
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface Quiz {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  score?: number;
  totalQuestions: number;
  completedAt?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags?: string[];
  intervalDays?: number;
  easeFactor?: number;
  nextReviewDate?: string;
  rating?: "easy" | "medium" | "hard";
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description: string;
  cards: Flashcard[];
  totalCards: number;
  lastStudied?: string;
}

export type NotificationType = "session" | "assignment" | "exam" | "daily_revision" | "break";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string; // ISO string
  type: NotificationType;
  isRead: boolean;
  targetId?: string;
}

export interface PomodoroSession {
  id: string;
  userId: string;
  durationMinutes: number;
  type: "focus" | "short_break" | "long_break";
  timestamp: string;
  subjectId?: string;
}

export interface DailyStudyLog {
  date: string; // YYYY-MM-DD
  minutesFocused: number;
  quizzesTaken: number;
  notesCreated: number;
  completedTasks: number;
}

export interface GroupStudyParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  role: "host" | "member";
  status: "online" | "studying" | "idle" | "away";
  isMuted?: boolean;
  joinedAt: string;
}

export interface GroupStudyChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  type?: "chat" | "system" | "note_share" | "timer_alert";
}

export type TopicNodeStatus = "not_started" | "in_progress" | "mastered";
export type SubTopicStatus = "not_started" | "in_progress" | "completed";

export interface SubTopicItem {
  id: string;
  title: string;
  status: SubTopicStatus;
}

export interface TopicNode {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  status: TopicNodeStatus;
  estimatedHours?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  x: number;
  y: number;
  tags?: string[];
  notes?: string;
  subTopics?: SubTopicItem[];
}

export interface TopicEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string; // e.g. "Prerequisite", "Leads to", "Subtopic", "Related"
  type?: "prerequisite" | "related" | "subtopic";
}


export type GroupRoomType = "pomodoro" | "discussion" | "quiz_challenge" | "silent_focus";

export interface GroupJoinRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface GroupStudySession {
  id: string;
  code: string; // e.g., "STUDY-892A"
  title: string;
  subjectId: string;
  subjectName: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  roomType: GroupRoomType;
  maxParticipants: number;
  currentParticipants: GroupStudyParticipant[];
  isLive: boolean;
  createdDate: string;
  requireApproval?: boolean; // If true, creator must approve join requests unless valid room code is entered
  pendingRequests?: GroupJoinRequest[]; // Join requests awaiting host review
  scheduledTime?: string;
  sharedNotesPad?: string;
  sharedDeckId?: string;
  timerState?: {
    isRunning: boolean;
    mode: "focus" | "break";
    secondsLeft: number;
  };
  chatMessages: GroupStudyChatMessage[];
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mode?: string;
}

export interface AIChatSession {
  id: string;
  title: string;
  subjectId?: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
  messages: AIChatMessage[];
  isPinned?: boolean;
}

export interface RoadmapBadge {
  id: string;
  threshold: number; // 25, 50, 75, 100
  title: string;
  subtitle: string;
  description: string;
  perk: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
  iconName: string;
  unlockedAt?: string;
  subjectId?: string;
}

export interface ActivityItem {
  id: string;
  type:
    | "deadline_created"
    | "deadline_completed"
    | "deadline_updated"
    | "note_created"
    | "note_updated"
    | "pomodoro_completed"
    | "quiz_completed"
    | "deck_created"
    | "goal_updated"
    | "subject_created";
  title: string;
  description?: string;
  timestamp: string;
  subjectName?: string;
}

