import React from "react";
import {
  LayoutDashboard,
  Bot,
  FileText,
  Users,
  Grid,
  Sparkles,
  HelpCircle,
  Layers,
  CalendarCheck,
  Timer,
  BarChart3,
  GitFork,
  Menu,
} from "lucide-react";
import { getTranslation } from "../services/i18n";

interface MobileBottomNavProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
  onOpenMobileMenu: () => void;
  unreadNotificationsCount?: number;
  currentLanguage?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabSelect,
  onOpenMobileMenu,
  unreadNotificationsCount = 0,
  currentLanguage = "en",
}) => {
  const primaryTabs = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "tutor", label: "AI Tutor", icon: Bot, isAi: true },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "group_study", label: "Live Rooms", icon: Users, isLive: true },
  ];

  const isMoreActive = !primaryTabs.some((t) => t.id === activeTab);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-2xl transition-colors duration-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0.5rem)" }}
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const label = getTranslation(currentLanguage || "en", tab.id, tab.label);

          return (
            <button
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl min-w-[56px] min-h-[44px] transition-all relative cursor-pointer active:scale-95 ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110 text-indigo-600 dark:text-indigo-400" : ""
                  }`}
                />
                {tab.isLive && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
                {tab.isAi && (
                  <span className="absolute -top-1 -right-1.5 text-[8px] font-black px-1 rounded-full bg-indigo-600 text-white leading-tight">
                    AI
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[62px]">
                {label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}

        {/* More / Menu Drawer trigger */}
        <button
          onClick={onOpenMobileMenu}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl min-w-[56px] min-h-[44px] transition-all relative cursor-pointer active:scale-95 ${
            isMoreActive
              ? "text-indigo-600 dark:text-indigo-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
          }`}
          aria-label="Open Full Navigation Menu"
        >
          <div className="relative">
            <Grid
              className={`w-5 h-5 transition-transform ${
                isMoreActive ? "scale-110 text-indigo-600 dark:text-indigo-400" : ""
              }`}
            />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[62px]">
            {getTranslation(currentLanguage || "en", "menu", "Menu")}
          </span>
          {isMoreActive && (
            <div className="w-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
