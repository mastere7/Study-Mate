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

  if (!userSnap.exists()) {
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

  return cred.user;
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
    console.error("Error seeding starter user data:", err);
  }
};

// Firestore User Data Fetchers
export const fetchUserData = async (userId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    const profile: User | null = userSnap.exists() ? (userSnap.data() as User) : null;

    // Fetch subcollections in parallel
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
      getDocs(collection(db, "users", userId, "subjects")),
      getDocs(collection(db, "users", userId, "notes")),
      getDocs(collection(db, "users", userId, "documents")),
      getDocs(collection(db, "users", userId, "assignments")),
      getDocs(collection(db, "users", userId, "schedules")),
      getDocs(collection(db, "users", userId, "quizzes")),
      getDocs(collection(db, "users", userId, "decks")),
      getDocs(collection(db, "users", userId, "sessions")),
      getDocs(collection(db, "users", userId, "notifications")),
      getDocs(collection(db, "users", userId, "topicNodes")),
      getDocs(collection(db, "users", userId, "topicEdges")),
      getDocs(collection(db, "users", userId, "chatSessions")),
      getDocs(collection(db, "users", userId, "studyLogs")),
      getDocs(collection(db, "users", userId, "roadmapBadges")),
    ]);

    return {
      profile,
      subjects: subjectsSnap.docs.map((d) => d.data() as Subject),
      notes: notesSnap.docs.map((d) => d.data() as Note),
      documents: documentsSnap.docs.map((d) => d.data() as DocumentItem),
      assignments: assignmentsSnap.docs.map((d) => d.data() as Assignment),
      schedules: schedulesSnap.docs.map((d) => d.data() as StudySchedule),
      quizzes: quizzesSnap.docs.map((d) => d.data() as Quiz),
      decks: decksSnap.docs.map((d) => d.data() as FlashcardDeck),
      sessions: sessionsSnap.docs.map((d) => d.data() as PomodoroSession),
      notifications: notificationsSnap.docs.map((d) => d.data() as AppNotification),
      topicNodes: topicNodesSnap.docs.map((d) => d.data() as TopicNode),
      topicEdges: topicEdgesSnap.docs.map((d) => d.data() as TopicEdge),
      chatSessions: chatSessionsSnap.docs.map((d) => d.data() as AIChatSession),
      studyLogs: logsSnap.docs.map((d) => d.data() as DailyStudyLog),
      roadmapBadges: badgesSnap.docs.map((d) => d.data() as RoadmapBadge),
    };
  } catch (err) {
    console.error("Failed to load user data from Firestore:", err);
    return null;
  }
};

// Generic Firestore Sync Helpers
export const syncUserDoc = async (userId: string, data: Partial<User>) => {
  try {
    await setDoc(doc(db, "users", userId), data, { merge: true });
  } catch (err) {
    console.error("Error syncing user profile to Firestore:", err);
  }
};

export const syncItemToFirestore = async (userId: string, collectionName: string, itemId: string, data: any) => {
  try {
    await setDoc(doc(db, "users", userId, collectionName, itemId), data, { merge: true });
  } catch (err) {
    console.error(`Error saving ${collectionName}/${itemId} to Firestore:`, err);
  }
};

export const deleteItemFromFirestore = async (userId: string, collectionName: string, itemId: string) => {
  try {
    await deleteDoc(doc(db, "users", userId, collectionName, itemId));
  } catch (err) {
    console.error(`Error deleting ${collectionName}/${itemId} from Firestore:`, err);
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
    console.error(`Error batch syncing ${collectionName} to Firestore:`, err);
  }
};
