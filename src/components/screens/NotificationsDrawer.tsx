import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Trash2,
  Calendar,
  AlertTriangle,
  BookOpen,
  CheckCheck,
  Volume2,
  VolumeX,
  Send,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Zap,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
} from "lucide-react";
import { AppNotification, Assignment, StudySchedule, User, Subject } from "../../types";
import { pushNotificationService, PermissionState } from "../../services/pushNotificationService";
import { audioSynth } from "../../services/audioSynth";

interface NotificationsDrawerProps {
  notifications: AppNotification[];
  assignments?: Assignment[];
  schedules?: StudySchedule[];
  subjects?: Subject[];
  user?: User;
  onSaveNotifications: (updated: AppNotification[]) => void;
  onSaveUser?: (updated: User) => void;
  onNavigateScreen?: (screen: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  notifications,
  assignments = [],
  schedules = [],
  subjects = [],
  user,
  onSaveNotifications,
  onSaveUser,
  onNavigateScreen,
}) => {
  const [permissionState, setPermissionState] = useState<PermissionState>("default");
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "assignments" | "schedules">("all");

  useEffect(() => {
    setPermissionState(pushNotificationService.getPermission());
  }, []);

  const handleRequestPermission = async () => {
    const res = await pushNotificationService.requestPermission();
    setPermissionState(res);
    if (res === "granted") {
      pushNotificationService.sendNotification("🎉 Push Notifications Activated!", {
        body: "You will now receive automatic browser push reminders for upcoming assignment deadlines and study sessions.",
        playSound: user?.notificationSound ?? true,
      });
      setTestSentMessage("Push notifications successfully enabled! Test alert sent.");
      setTimeout(() => setTestSentMessage(null), 4000);
    }
  };

  const handleSendTestPush = () => {
    const success = pushNotificationService.sendNotification("🔔 StudyMate Test Push Notification", {
      body: "Browser push notifications are active! Deadline alerts and study schedule reminders will appear here.",
      playSound: user?.notificationSound ?? true,
    });

    if (success) {
      setTestSentMessage("Test push notification triggered! Check your desktop/browser notification banner.");
    } else {
      setTestSentMessage("Notification permission required. Click 'Enable Push Notifications' above.");
    }
    setTimeout(() => setTestSentMessage(null), 5000);
  };

  const handleToggleSound = () => {
    if (!user || !onSaveUser) return;
    const updated = { ...user, notificationSound: !user.notificationSound };
    onSaveUser(updated);
    if (updated.notificationSound) {
      audioSynth.playChime("bell");
    }
  };

  const handleTriggerAssignmentReminder = (assignment: Assignment) => {
    const title = `⚠️ Deadline Alert: ${assignment.title}`;
    const body = `Due Date: ${assignment.dueDate} | Priority: ${assignment.priority}. Keep up the great work!`;

    pushNotificationService.sendNotification(title, {
      body,
      playSound: user?.notificationSound ?? true,
    });

    const newAppNotif: AppNotification = {
      id: `notif_manual_${Date.now()}`,
      userId: user?.id || "u_student_1",
      title,
      message: body,
      date: new Date().toISOString(),
      type: "assignment",
      isRead: false,
      targetId: assignment.id,
    };

    onSaveNotifications([newAppNotif, ...notifications]);
    setTestSentMessage(`Push reminder sent for "${assignment.title}"`);
    setTimeout(() => setTestSentMessage(null), 4000);
  };

  const handleTriggerScheduleReminder = (session: StudySchedule) => {
    const title = `📚 Scheduled Study Session: ${session.title}`;
    const body = `Scheduled for ${session.date} (${session.startTime} - ${session.endTime}). Time to focus!`;

    pushNotificationService.sendNotification(title, {
      body,
      playSound: user?.notificationSound ?? true,
    });

    const newAppNotif: AppNotification = {
      id: `notif_manual_sched_${Date.now()}`,
      userId: user?.id || "u_student_1",
      title,
      message: body,
      date: new Date().toISOString(),
      type: "session",
      isRead: false,
      targetId: session.id,
    };

    onSaveNotifications([newAppNotif, ...notifications]);
    setTestSentMessage(`Push reminder sent for "${session.title}"`);
    setTimeout(() => setTestSentMessage(null), 4000);
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    onSaveNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    onSaveNotifications(updated);
  };

  const handleClearAll = () => {
    onSaveNotifications([]);
  };

  const pendingAssignments = assignments.filter((a) => a.status !== "Completed");
  const upcomingSchedules = schedules.filter((s) => !s.isCompleted);

  const getSubjectName = (subId?: string) => {
    const found = subjects.find((s) => s.id === subId);
    return found ? found.name : "General Study";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Browser Push Notifications & Reminders</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time automated alerts for upcoming assignment deadlines, study sessions, and goal milestones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Browser Push Permission & Controller Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/50 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                permissionState === "granted"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : permissionState === "denied"
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                  : "bg-amber-500/20 border-amber-500/40 text-amber-300"
              }`}
            >
              {permissionState === "granted" ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Browser Push Notification Engine</h3>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                    permissionState === "granted"
                      ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-200"
                      : permissionState === "denied"
                      ? "bg-rose-500/30 border-rose-500/50 text-rose-200"
                      : "bg-amber-500/30 border-amber-500/50 text-amber-200"
                  }`}
                >
                  {permissionState === "granted" && "Active & Granted"}
                  {permissionState === "default" && "Permission Needed"}
                  {permissionState === "denied" && "Blocked in Browser"}
                  {permissionState === "unsupported" && "Not Supported"}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {permissionState === "granted" && "Native desktop & mobile alerts are enabled for deadlines and study sessions."}
                {permissionState === "default" && "Grant permission to receive alerts even when you are working on other tabs."}
                {permissionState === "denied" && "Browser notifications are currently blocked for this site. Unblock in browser settings."}
                {permissionState === "unsupported" && "Your current browser does not support the Web Notification API."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {permissionState === "default" && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>Enable Push Notifications</span>
              </button>
            )}

            <button
              onClick={handleSendTestPush}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 border border-indigo-400/30"
            >
              <Send className="w-4 h-4 text-indigo-300" />
              <span>Send Test Push Alert</span>
            </button>

            {user && onSaveUser && (
              <button
                onClick={handleToggleSound}
                className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold ${
                  user.notificationSound
                    ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-200"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                title="Toggle Chime Sound"
              >
                {user.notificationSound ? <Volume2 className="w-4 h-4 text-indigo-300" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{user.notificationSound ? "Chime On" : "Muted"}</span>
              </button>
            )}
          </div>
        </div>

        {testSentMessage && (
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{testSentMessage}</span>
          </div>
        )}

        {permissionState === "denied" && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-start gap-2">
            <Info className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
            <div>
              <strong>How to enable blocked notifications:</strong> Click the lock or settings icon near the URL bar in your browser address line, change <em>Notifications</em> from "Block" to "Allow", and reload the page.
            </div>
          </div>
        )}
      </div>

      {/* Automated Upcoming Reminders Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Upcoming Assignment & Session Deadlines</span>
          </h3>

          {onNavigateScreen && (
            <button
              onClick={() => onNavigateScreen("planner")}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Manage Planner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending Assignment Deadlines */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Assignment Deadlines ({pendingAssignments.length})
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Auto Push Enabled</span>
            </div>

            {pendingAssignments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center font-medium">No pending assignment deadlines!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {pendingAssignments.map((assignment) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isDueToday = assignment.dueDate === todayStr;
                  const isOverdue = assignment.dueDate < todayStr;

                  return (
                    <div
                      key={assignment.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-300 transition-all"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {assignment.title}
                          </h4>
                          {isDueToday && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                              DUE TODAY
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Due: {assignment.dueDate} | Subject: {getSubjectName(assignment.subjectId)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleTriggerAssignmentReminder(assignment)}
                        className="shrink-0 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 font-bold text-[11px] transition-all flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                        title="Send Browser Push Alert Now"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Push Alert</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scheduled Study Sessions */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Scheduled Study Sessions ({upcomingSchedules.length})
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Auto Push Enabled</span>
            </div>

            {upcomingSchedules.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center font-medium">No upcoming study sessions scheduled!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {upcomingSchedules.map((session) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isToday = session.date === todayStr;

                  return (
                    <div
                      key={session.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-300 transition-all"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {session.title}
                          </h4>
                          {isToday && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                              TODAY
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {session.date} ({session.startTime} - {session.endTime}) | {getSubjectName(session.subjectId)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleTriggerScheduleReminder(session)}
                        className="shrink-0 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 font-bold text-[11px] transition-all flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                        title="Send Browser Push Alert Now"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Push Alert</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Activity History Log */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Notification History Log ({notifications.length})</span>
          </h3>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "all" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "assignments" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
              }`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "schedules" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
              }`}
            >
              Sessions
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              No recorded notifications yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications
              .filter((n) => {
                if (activeTab === "assignments") return n.type === "assignment";
                if (activeTab === "schedules") return n.type === "session";
                return true;
              })
              .map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${
                    notif.isRead
                      ? "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-slate-500"
                      : "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl text-white ${
                        notif.type === "assignment"
                          ? "bg-rose-500"
                          : notif.type === "exam"
                          ? "bg-amber-500"
                          : "bg-indigo-600"
                      }`}
                    >
                      {notif.type === "assignment" ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : notif.type === "exam" ? (
                        <Calendar className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-xs sm:text-sm">{notif.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(notif.date).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
