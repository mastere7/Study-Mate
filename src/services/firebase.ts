import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
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
  AIChatSession,
  RoadmapBadge,
  GroupStudySession,
} from "../types";
import {
  DEFAULT_SUBJECTS,
  DEFAULT_NOTES,
  DEFAULT_ASSIGNMENTS,
  DEFAULT_SCHEDULES,
  DEFAULT_FLASHCARDS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_TOPIC_NODES,
  DEFAULT_TOPIC_EDGES,
  DEFAULT_CHAT_SESSIONS,
  storageService,
} from "./storage";

export { onAuthStateChanged };
export type { FirebaseUser };
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with configured database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Safe network fetch helpers to prevent offline/network-request errors from crashing UI
const safeGetDoc = async (docRef: any) => {
  try {
    return await getDoc(docRef);
  } catch (err: any) {
    console.warn(`Firestore getDoc offline/unreachable for ${docRef.path}:`, err?.message || err);
    return null;
  }
};

const safeGetDocs = async (colRef: any) => {
  try {
    return await getDocs(colRef);
  } catch (err: any) {
    console.warn(`Firestore getDocs offline/unreachable for ${colRef.path}:`, err?.message || err);
    return null;
  }
};

// Authentication Helpers
export const registerWithEmail = async (email: string, pass: string, name: string, gradeLevel?: string, major?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }

  // Send email verification to the newly registered student
  try {
    await sendEmailVerification(cred.user);
  } catch (err) {
    console.warn("Could not send initial verification email:", err);
  }

  const newUserProfile: User = {
    id: cred.user.uid,
    name: name || email.split("@")[0],
    email: email,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
    gradeLevel: gradeLevel || "Undergraduate Student",
    major: major || "General Studies",
    createdDate: new Date().toISOString(),
    dailyGoalHours: 3.0,
    notificationSound: true,
    reminderFrequency: "15m",
    quietHoursStart: "23:00",
    quietHoursEnd: "07:00",
    themePreference: "system",
  };

  // Save profile to firestore
  await setDoc(doc(db, "users", cred.user.uid), newUserProfile);
  // Seed initial starter data for the new user
  await seedInitialUserData(cred.user.uid);

  return newUserProfile;
};

export const sendVerificationEmail = async () => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  } else {
    throw new Error("No active user signed in.");
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
};

export const loginWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);
  const userDocRef = doc(db, "users", cred.user.uid);
  const userSnap = await getDoc(userDocRef);
  const isNewAccount = !userSnap.exists();

  if (isNewAccount) {
    const newUserProfile: User = {
      id: cred.user.uid,
      name: cred.user.displayName || "Student",
      email: cred.user.email || "",
      avatarUrl: cred.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cred.user.displayName || "Student")}`,
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
    await setDoc(userDocRef, newUserProfile);
    await seedInitialUserData(cred.user.uid);
  }

  return { user: cred.user, isNewAccount };
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetUserPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

// Seed starter data for brand new user
export const seedInitialUserData = async (userId: string) => {
  try {
    const batch = writeBatch(db);

    // Seed Subjects
    for (const sub of DEFAULT_SUBJECTS) {
      const ref = doc(db, "users", userId, "subjects", sub.id);
      batch.set(ref, sub);
    }

    // Seed Notes
    for (const note of DEFAULT_NOTES) {
      const ref = doc(db, "users", userId, "notes", note.id);
      batch.set(ref, { ...note, userId });
    }

    // Seed Assignments
    for (const a of DEFAULT_ASSIGNMENTS) {
      const ref = doc(db, "users", userId, "assignments", a.id);
      batch.set(ref, { ...a, userId });
    }

    // Seed Schedules
    for (const s of DEFAULT_SCHEDULES) {
      const ref = doc(db, "users", userId, "schedules", s.id);
      batch.set(ref, { ...s, userId });
    }

    // Seed Flashcards
    for (const d of DEFAULT_FLASHCARDS) {
      const ref = doc(db, "users", userId, "decks", d.id);
      batch.set(ref, { ...d, userId });
    }

    // Seed Topic Nodes
    for (const tn of DEFAULT_TOPIC_NODES) {
      const ref = doc(db, "users", userId, "topicNodes", tn.id);
      batch.set(ref, tn);
    }

    // Seed Topic Edges
    for (const te of DEFAULT_TOPIC_EDGES) {
      const ref = doc(db, "users", userId, "topicEdges", te.id);
      batch.set(ref, te);
    }

    // Seed Notifications
    for (const n of DEFAULT_NOTIFICATIONS) {
      const ref = doc(db, "users", userId, "notifications", n.id);
      batch.set(ref, { ...n, userId });
    }

    await batch.commit();
  } catch (err) {
    console.warn("Could not seed starter user data to Firestore (operating locally):", err);
  }
};

// Firestore User Data Fetchers with complete offline resilience
export const fetchUserData = async (userId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await safeGetDoc(userDocRef);
    const profile: User | null = userSnap && userSnap.exists() ? (userSnap.data() as User) : null;

    // Fetch subcollections in parallel with resilient error boundary
    const [
      subjectsSnap,
      notesSnap,
      documentsSnap,
      assignmentsSnap,
      schedulesSnap,
      quizzesSnap,
      decksSnap,
      sessionsSnap,
      notificationsSnap,
      topicNodesSnap,
      topicEdgesSnap,
      chatSessionsSnap,
      logsSnap,
      badgesSnap,
    ] = await Promise.all([
      safeGetDocs(collection(db, "users", userId, "subjects")),
      safeGetDocs(collection(db, "users", userId, "notes")),
      safeGetDocs(collection(db, "users", userId, "documents")),
      safeGetDocs(collection(db, "users", userId, "assignments")),
      safeGetDocs(collection(db, "users", userId, "schedules")),
      safeGetDocs(collection(db, "users", userId, "quizzes")),
      safeGetDocs(collection(db, "users", userId, "decks")),
      safeGetDocs(collection(db, "users", userId, "sessions")),
      safeGetDocs(collection(db, "users", userId, "notifications")),
      safeGetDocs(collection(db, "users", userId, "topicNodes")),
      safeGetDocs(collection(db, "users", userId, "topicEdges")),
      safeGetDocs(collection(db, "users", userId, "chatSessions")),
      safeGetDocs(collection(db, "users", userId, "studyLogs")),
      safeGetDocs(collection(db, "users", userId, "roadmapBadges")),
    ]);

    return {
      profile: profile || storageService.getUser(),
      subjects: subjectsSnap && subjectsSnap.docs.length > 0
        ? subjectsSnap.docs.map((d) => d.data() as Subject)
        : storageService.getSubjects(),
      notes: notesSnap && notesSnap.docs.length > 0
        ? notesSnap.docs.map((d) => d.data() as Note)
        : storageService.getNotes(),
      documents: documentsSnap && documentsSnap.docs.length > 0
        ? documentsSnap.docs.map((d) => d.data() as DocumentItem)
        : storageService.getDocuments(),
      assignments: assignmentsSnap && assignmentsSnap.docs.length > 0
        ? assignmentsSnap.docs.map((d) => d.data() as Assignment)
        : storageService.getAssignments(),
      schedules: schedulesSnap && schedulesSnap.docs.length > 0
        ? schedulesSnap.docs.map((d) => d.data() as StudySchedule)
        : storageService.getSchedules(),
      quizzes: quizzesSnap && quizzesSnap.docs.length > 0
        ? quizzesSnap.docs.map((d) => d.data() as Quiz)
        : storageService.getQuizzes(),
      decks: decksSnap && decksSnap.docs.length > 0
        ? decksSnap.docs.map((d) => d.data() as FlashcardDeck)
        : storageService.getDecks(),
      sessions: sessionsSnap && sessionsSnap.docs.length > 0
        ? sessionsSnap.docs.map((d) => d.data() as PomodoroSession)
        : storageService.getSessions(),
      notifications: notificationsSnap && notificationsSnap.docs.length > 0
        ? notificationsSnap.docs.map((d) => d.data() as AppNotification)
        : storageService.getNotifications(),
      topicNodes: topicNodesSnap && topicNodesSnap.docs.length > 0
        ? topicNodesSnap.docs.map((d) => d.data() as TopicNode)
        : storageService.getTopicNodes(),
      topicEdges: topicEdgesSnap && topicEdgesSnap.docs.length > 0
        ? topicEdgesSnap.docs.map((d) => d.data() as TopicEdge)
        : storageService.getTopicEdges(),
      chatSessions: chatSessionsSnap && chatSessionsSnap.docs.length > 0
        ? chatSessionsSnap.docs.map((d) => d.data() as AIChatSession)
        : storageService.getChatSessions(),
      studyLogs: logsSnap && logsSnap.docs.length > 0
        ? logsSnap.docs.map((d) => d.data() as DailyStudyLog)
        : storageService.getStudyLogs(),
      roadmapBadges: badgesSnap && badgesSnap.docs.length > 0
        ? badgesSnap.docs.map((d) => d.data() as RoadmapBadge)
        : storageService.getRoadmapBadges(),
    };
  } catch (err: any) {
    console.warn("Firestore operating in offline/local cache mode:", err?.message || err);
    return {
      profile: storageService.getUser(),
      subjects: storageService.getSubjects(),
      notes: storageService.getNotes(),
      documents: storageService.getDocuments(),
      assignments: storageService.getAssignments(),
      schedules: storageService.getSchedules(),
      quizzes: storageService.getQuizzes(),
      decks: storageService.getDecks(),
      sessions: storageService.getSessions(),
      notifications: storageService.getNotifications(),
      topicNodes: storageService.getTopicNodes(),
      topicEdges: storageService.getTopicEdges(),
      chatSessions: storageService.getChatSessions(),
      studyLogs: storageService.getStudyLogs(),
      roadmapBadges: storageService.getRoadmapBadges(),
    };
  }
};

// Generic Firestore Sync Helpers
export const syncUserDoc = async (userId: string, data: Partial<User>) => {
  try {
    await setDoc(doc(db, "users", userId), data, { merge: true });
  } catch (err) {
    console.warn("Firestore profile sync deferred (offline/cached):", err);
  }
};

export const syncItemToFirestore = async (userId: string, collectionName: string, itemId: string, data: any) => {
  try {
    await setDoc(doc(db, "users", userId, collectionName, itemId), data, { merge: true });
  } catch (err) {
    console.warn(`Firestore ${collectionName}/${itemId} sync deferred (offline/cached):`, err);
  }
};

export const deleteItemFromFirestore = async (userId: string, collectionName: string, itemId: string) => {
  try {
    await deleteDoc(doc(db, "users", userId, collectionName, itemId));
  } catch (err) {
    console.warn(`Firestore delete ${collectionName}/${itemId} deferred (offline/cached):`, err);
  }
};

export const syncFullCollection = async (userId: string, collectionName: string, items: { id: string; [key: string]: any }[]) => {
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      if (item.id) {
        const ref = doc(db, "users", userId, collectionName, item.id);
        batch.set(ref, item, { merge: true });
      }
    }
    await batch.commit();
  } catch (err) {
    console.warn(`Firestore batch sync ${collectionName} deferred (offline/cached):`, err);
  }
};

// ==========================================
// Group Study Sessions Firestore Sync & Live Listeners
// ==========================================

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const subscribeToGroupSessions = (onUpdate: (sessions: GroupStudySession[]) => void) => {
  const path = "groupSessions";
  try {
    const sessionsCol = collection(db, path);
    return onSnapshot(
      sessionsCol,
      (snapshot) => {
        const sessions: GroupStudySession[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            sessions.push({ ...docSnap.data(), id: docSnap.id } as GroupStudySession);
          }
        });
        onUpdate(sessions);
      },
      (error) => {
        console.warn("Could not listen to real-time groupSessions:", error);
      }
    );
  } catch (err) {
    console.warn("Could not attach groupSessions listener:", err);
    return () => {};
  }
};

export const fetchGroupSessionByIdOrCode = async (codeOrId: string): Promise<GroupStudySession | null> => {
  if (!codeOrId) return null;
  const rawClean = codeOrId.trim();
  const upperClean = rawClean.toUpperCase();
  const normalizedClean = upperClean.replace(/[^A-Z0-9]/g, "");

  try {
    // 1. Try direct doc ID lookup
    const docSnap = await getDoc(doc(db, "groupSessions", rawClean));
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as GroupStudySession;
    }

    // 2. Try doc ID lowercase / raw
    if (rawClean !== upperClean) {
      const docSnapUpper = await getDoc(doc(db, "groupSessions", upperClean));
      if (docSnapUpper.exists()) {
        return { ...docSnapUpper.data(), id: docSnapUpper.id } as GroupStudySession;
      }
    }

    // 3. Query by exact code
    const q1 = query(collection(db, "groupSessions"), where("code", "==", upperClean));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const match = snap1.docs[0];
      return { ...match.data(), id: match.id } as GroupStudySession;
    }

    // 4. Query by raw code
    if (rawClean !== upperClean) {
      const q2 = query(collection(db, "groupSessions"), where("code", "==", rawClean));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const match = snap2.docs[0];
        return { ...match.data(), id: match.id } as GroupStudySession;
      }
    }

    // 5. Fallback: Search all active rooms for flexible matching (e.g. FOCUS123 vs FOCUS-123)
    const snapAll = await getDocs(collection(db, "groupSessions"));
    for (const d of snapAll.docs) {
      const data = d.data() as GroupStudySession;
      const roomCode = (data.code || "").toUpperCase();
      const roomId = (data.id || "").toUpperCase();
      const normRoomCode = roomCode.replace(/[^A-Z0-9]/g, "");
      const normRoomId = roomId.replace(/[^A-Z0-9]/g, "");

      if (
        roomCode === upperClean ||
        roomId === upperClean ||
        (normalizedClean.length >= 4 && (normRoomCode === normalizedClean || normRoomId === normalizedClean))
      ) {
        return { ...data, id: d.id };
      }
    }

    return null;
  } catch (err) {
    console.warn("Could not query Firestore for room code:", err);
    return null;
  }
};

export const saveGroupSessionToFirestore = async (session: GroupStudySession) => {
  if (!session || !session.id) return;
  try {
    // Sanitize object to remove undefined values before writing to Firestore
    const cleanSession = JSON.parse(
      JSON.stringify(session, (key, value) => (value === undefined ? null : value))
    );
    await setDoc(doc(db, "groupSessions", session.id), cleanSession, { merge: true });
  } catch (err) {
    console.warn(`Could not save groupSession to Firestore:`, err);
  }
};

export const deleteGroupSessionFromFirestore = async (sessionId: string) => {
  if (!sessionId) return;
  try {
    await deleteDoc(doc(db, "groupSessions", sessionId));
  } catch (err) {
    console.warn(`Could not delete groupSession ${sessionId} from Firestore:`, err);
  }
};

