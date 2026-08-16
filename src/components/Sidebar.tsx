import React from "react";
import {
  LayoutDashboard,
  Bot,
  FileText,
  FolderKanban,
  HelpCircle,
  Layers,
  CalendarCheck,
  ScanLine,
  Mic,
  Timer,
  BarChart3,
  Bell,
  Sparkles,
  ChevronRight,
  Users,
  GitFork,
  X,
  Menu,
  GraduationCap,
  Plus,
  Settings,
  BookOpen,
} from "lucide-react";
import { Subject } from "../types";
import { getTranslation } from "../services/i18n";

interface SidebarProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
  unreadNotificationsCount?: number;
  subjects?: Subject[];
  activeSubjectFilter?: string | null;
  onSelectSubjectFilter?: (subjectId: string | null) => void;
  onOpenSubjectModal?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  currentLanguage?: string;
}

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { id: "curriculum", label: "Curriculum Mind Map", icon: GitFork, badge: "Interactive" },
  { id: "group_study", label: "Group Study & Live Rooms", icon: Users, badge: "Live" },
  { id: "tutor", label: "AI Tutor Assistant", icon: Bot, badge: "AI" },
  { id: "documents", label: "Upload & Summarize Files", icon: FolderKanban, badge: "PDF/DOC" },
  { id: "notes", label: "Smart Notes", icon: FileText, badge: null },
  { id: "quiz", label: "AI Quiz Arena", icon: HelpCircle, badge: "Auto" },
  { id: "flashcards", label: "Flashcards Deck", icon: Layers, badge: null },
  { id: "planner", label: "Study Planner", icon: CalendarCheck, badge: null },
  { id: "scanner", label: "Question Scanner", icon: ScanLine, badge: "AI" },
  { id: "voice", label: "Voice Assistant", icon: Mic, badge: "Audio" },
  { id: "pomodoro", label: "Pomodoro Timer", icon: Timer, badge: "Focus" },
  { id: "progress", label: "Progress Analytics", icon: BarChart3, badge: null },
  { id: "notifications", label: "Reminders & Alerts", icon: Bell, badge: null },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabSelect,
  unreadNotificationsCount = 0,
  subjects = [],
  activeSubjectFilter,
  onSelectSubjectFilter,
  onOpenSubjectModal,
  isOpenMobile = false,
  onCloseMobile = () => {},
  isCollapsed = false,
  currentLanguage = "en",
}) => {
  const activeSubjectObj = subjects.find((s) => s.id === activeSubjectFilter);
  const currentDisplayCourse = activeSubjectObj?.name || subjects[0]?.name || "General Focus";
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Bento Styled Main Sidebar */}
      <aside
        className={`fixed lg:sticky top-[61px] left-0 z-50 lg:z-40 h-[calc(100vh-61px)] shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out p-3 space-y-4 ${
          isOpenMobile
            ? "translate-x-0 w-72 shadow-2xl"
            : "-translate-x-full lg:translate-x-0 " + (isCollapsed ? "lg:w-16 lg:items-center" : "lg:w-64")
        }`}
      >
        <div className="overflow-y-auto space-y-4 flex-1 w-full pr-0.5 custom-scrollbar">
          {/* Brand/Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              {(!isCollapsed || isOpenMobile) && (
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  StudyMate
                </span>
              )}
            </div>
            {/* Close Button on Mobile Drawer */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close Mobile Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 w-full">
            {(!isCollapsed || isOpenMobile) && (
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                {getTranslation(currentLanguage || "en", "navigation", "Navigation")}
              </p>
            )}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isNotif = item.id === "notifications" && unreadNotificationsCount > 0;
              const showExpanded = !isCollapsed || isOpenMobile;
              const localizedLabel = getTranslation(currentLanguage || "en", item.id as any, item.label);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabSelect(item.id);
                    onCloseMobile();
                  }}
                  title={!showExpanded ? localizedLabel : undefined}
                  className={`w-full flex items-center ${
                    !showExpanded ? "justify-center py-3" : "justify-between px-3.5 py-2.5"
                  } rounded-2xl font-semibold text-xs transition-all relative ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <div className={`flex items-center ${!showExpanded ? "justify-center" : "space-x-3"}`}>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                    {showExpanded && <span className="truncate">{localizedLabel}</span>}
                  </div>
                  {showExpanded && (
                    <>
                      {isNotif ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                          {unreadNotificationsCount}
                        </span>
                      ) : item.badge ? (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                  {!showExpanded && isNotif && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Subjects Filter List (If expanded) */}
          {(!isCollapsed || isOpenMobile) && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {getTranslation(currentLanguage || "en", "myCourses", "My Courses")} {subjects.length > 0 ? `(${subjects.length})` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {activeSubjectFilter && (
                    <button
                      onClick={() => onSelectSubjectFilter && onSelectSubjectFilter(null)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold px-1"
                    >
                      {getTranslation(currentLanguage || "en", "clear", "Clear")}
                    </button>
                  )}
                  {onOpenSubjectModal && (
                    <button
                      onClick={onOpenSubjectModal}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title="Manage Course Subjects"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {subjects.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5 mx-1">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {getTranslation(currentLanguage || "en", "noCoursesAddedYet", "No courses added yet")}
                  </p>
                  {onOpenSubjectModal && (
                    <button
                      onClick={onOpenSubjectModal}
                      className="w-full py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{getTranslation(currentLanguage || "en", "setUpCourses", "Set Up Your Courses")}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
                  {subjects.map((sub) => {
                    const isSelected = activeSubjectFilter === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectSubjectFilter && onSelectSubjectFilter(isSelected ? null : sub.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/70 font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] shrink-0 ${sub.color || "bg-indigo-600 text-white"}`}>
                            {sub.icon || "📚"}
                          </span>
                          <div className="text-left truncate">
                            <p className="truncate font-bold leading-tight">{sub.name}</p>
                            {sub.code && <p className="text-[9px] font-mono text-slate-400">{sub.code}</p>}
                          </div>
                        </div>
                        <ChevronRight className={`w-3 h-3 shrink-0 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                      </button>
                    );
                  })}

                  {onOpenSubjectModal && (
                    <button
                      onClick={onOpenSubjectModal}
                      className="w-full py-1.5 text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 cursor-pointer pt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{getTranslation(currentLanguage || "en", "addCourse", "Add Course")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bento Dark Box - Current Active Session Widget */}
        {!isCollapsed || isOpenMobile ? (
          <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-md w-full">
            <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">
              {getTranslation(currentLanguage || "en", "activeCourse", "Active Course")}
            </p>
            <p className="text-xs font-bold truncate text-slate-100">{currentDisplayCourse}</p>
            <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-2/3 rounded-full"></div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md" title={currentDisplayCourse}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </aside>
    </>
  );
};
