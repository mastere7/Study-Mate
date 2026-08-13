import { Assignment, StudySchedule, AppNotification, User } from "../types";
import { audioSynth } from "./audioSynth";

const SENT_TAGS_KEY = "studymate_sent_push_tags";

// Get already sent notification tags from localStorage to prevent duplicate push alerts
function getSentTags(): Set<string> {
  try {
    const raw = localStorage.getItem(SENT_TAGS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

function recordSentTag(tag: string) {
  try {
    const set = getSentTags();
    set.add(tag);
    localStorage.setItem(SENT_TAGS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn("Error saving sent notification tag:", e);
  }
}

export type PermissionState = "granted" | "default" | "denied" | "unsupported";

export class PushNotificationService {
  /**
   * Check if the browser supports the Notification API
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  /**
   * Get current Notification permission state
   */
  getPermission(): PermissionState {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission as PermissionState;
  }

  /**
   * Request push notification permission from the browser
   */
  async requestPermission(): Promise<PermissionState> {
    if (!this.isSupported()) return "unsupported";
    try {
      const result = await Notification.requestPermission();
      return result as PermissionState;
    } catch (e) {
      console.error("Error requesting notification permission:", e);
      return this.getPermission();
    }
  }

  /**
   * Fire a native browser push notification
   */
  sendNotification(
    title: string,
    options: {
      body?: string;
      icon?: string;
      tag?: string;
      playSound?: boolean;
      onClick?: () => void;
    } = {}
  ): boolean {
    const { body, icon = "/favicon.ico", tag, playSound = true, onClick } = options;

    // Play chime sound if enabled
    if (playSound) {
      audioSynth.playChime("bell");
    }

    if (!this.isSupported()) {
      console.warn("Notifications not supported in this browser.");
      return false;
    }

    if (Notification.permission === "granted") {
      try {
        const notif = new Notification(title, {
          body,
          icon,
          tag,
          requireInteraction: false,
        });

        notif.onclick = () => {
          if (typeof window !== "undefined") {
            window.focus();
          }
          if (onClick) onClick();
          notif.close();
        };
        return true;
      } catch (e) {
        console.error("Error creating native notification:", e);
        return false;
      }
    } else {
      console.info("Native push notification blocked (Permission:", Notification.permission, ")");
      return false;
    }
  }

  /**
   * Run automated background checks for upcoming assignment deadlines & study sessions
   */
  checkAndTriggerReminders(
    assignments: Assignment[],
    schedules: StudySchedule[],
    existingNotifications: AppNotification[],
    user: User,
    onAddNotification: (newNotif: AppNotification) => void
  ) {
    const sentTags = getSentTags();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const newAppNotifs: AppNotification[] = [];

    // --- 1. Check Assignment Deadlines ---
    assignments.forEach((assignment) => {
      if (assignment.status === "Completed") return;

      const tagDueToday = `assign_today_${assignment.id}_${todayStr}`;
      const tagDueTomorrow = `assign_tomorrow_${assignment.id}_${todayStr}`;
      const tagOverdue = `assign_overdue_${assignment.id}_${todayStr}`;

      // Due Today Alert
      if (assignment.dueDate === todayStr && !sentTags.has(tagDueToday)) {
        const title = `⚠️ Assignment Due Today: ${assignment.title}`;
        const body = `Priority: ${assignment.priority} | Due Date: Today! Don't forget to submit your work.`;

        this.sendNotification(title, {
          body,
          tag: tagDueToday,
          playSound: user.notificationSound,
        });

        recordSentTag(tagDueToday);

        const appNotif: AppNotification = {
          id: `notif_due_today_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: user.id,
          title,
          message: body,
          date: new Date().toISOString(),
          type: "assignment",
          isRead: false,
          targetId: assignment.id,
        };
        newAppNotifs.push(appNotif);
      }
      // Due Tomorrow Alert
      else if (assignment.dueDate === tomorrowStr && !sentTags.has(tagDueTomorrow)) {
        const title = `⏰ Assignment Due Tomorrow: ${assignment.title}`;
        const body = `Reminder: ${assignment.title} is due tomorrow (${assignment.dueDate}). Priority: ${assignment.priority}.`;

        this.sendNotification(title, {
          body,
          tag: tagDueTomorrow,
          playSound: user.notificationSound,
        });

        recordSentTag(tagDueTomorrow);

        const appNotif: AppNotification = {
          id: `notif_due_tom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: user.id,
          title,
          message: body,
          date: new Date().toISOString(),
          type: "assignment",
          isRead: false,
          targetId: assignment.id,
        };
        newAppNotifs.push(appNotif);
      }
      // Overdue Alert
      else if (assignment.dueDate < todayStr && !sentTags.has(tagOverdue)) {
        const title = `🚨 Overdue Assignment: ${assignment.title}`;
        const body = `This assignment was due on ${assignment.dueDate}. Mark as completed when done!`;

        this.sendNotification(title, {
          body,
          tag: tagOverdue,
          playSound: user.notificationSound,
        });

        recordSentTag(tagOverdue);

        const appNotif: AppNotification = {
          id: `notif_overdue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: user.id,
          title,
          message: body,
          date: new Date().toISOString(),
          type: "assignment",
          isRead: false,
          targetId: assignment.id,
        };
        newAppNotifs.push(appNotif);
      }
    });

    // --- 2. Check Scheduled Study Sessions ---
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    schedules.forEach((session) => {
      if (session.isCompleted) return;
      if (session.date !== todayStr) return;

      const [startHour, startMin] = session.startTime.split(":").map(Number);
      const sessionStartTotalMins = startHour * 60 + startMin;
      const minutesUntilStart = sessionStartTotalMins - currentMinutes;

      const tagSessionStart = `session_start_${session.id}_${todayStr}`;
      const tagSessionUpcoming = `session_15m_${session.id}_${todayStr}`;

      // Session Starts in 15 Minutes or Less
      if (minutesUntilStart > 0 && minutesUntilStart <= 15 && !sentTags.has(tagSessionUpcoming)) {
        const title = `📚 Study Session Starting Soon (${minutesUntilStart}m)!`;
        const body = `"${session.title}" starts at ${session.startTime}. Get your study materials ready!`;

        this.sendNotification(title, {
          body,
          tag: tagSessionUpcoming,
          playSound: user.notificationSound,
        });

        recordSentTag(tagSessionUpcoming);

        const appNotif: AppNotification = {
          id: `notif_sess_15m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: user.id,
          title,
          message: body,
          date: new Date().toISOString(),
          type: "session",
          isRead: false,
          targetId: session.id,
        };
        newAppNotifs.push(appNotif);
      }
      // Session Starting Now (0 to -10 minutes past start)
      else if (minutesUntilStart <= 0 && minutesUntilStart >= -10 && !sentTags.has(tagSessionStart)) {
        const title = `🔔 Study Session Starting Now!`;
        const body = `"${session.title}" scheduled for ${session.startTime} - ${session.endTime} is starting now!`;

        this.sendNotification(title, {
          body,
          tag: tagSessionStart,
          playSound: user.notificationSound,
        });

        recordSentTag(tagSessionStart);

        const appNotif: AppNotification = {
          id: `notif_sess_now_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: user.id,
          title,
          message: body,
          date: new Date().toISOString(),
          type: "session",
          isRead: false,
          targetId: session.id,
        };
        newAppNotifs.push(appNotif);
      }
    });

    // Notify caller if new notifications were generated
    newAppNotifs.forEach((n) => onAddNotification(n));
  }
}

export const pushNotificationService = new PushNotificationService();
