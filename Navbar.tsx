import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Search,
  Bell,
  Flame,
  Moon,
  Sun,
  Laptop,
  Globe,
  Check,
  Clock,
  Wifi,
  WifiOff,
  User as UserIcon,
  X,
  BookOpen,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  Menu,
  GraduationCap,
} from "lucide-react";
import { UserProfile, AppNotification } from "../types";
import { storageService, DEFAULT_USER } from "../services/storage";
import { SUPPORTED_LANGUAGES, getTranslation, Language } from "../services/i18n";

interface NavbarProps {
  user: UserProfile;
  unreadNotificationsCount?: number;
  isDarkMode?: boolean;
  themeMode?: "light" | "dark" | "system";
  onThemeModeChange?: (mode: "light" | "dark" | "system") => void;
  onToggleDarkMode?: () => void;
  currentLanguage?: string;
  onLanguageChange?: (langCode: string) => void;
  onOpenAuthModal?: () => void;
  onOpenNotifications?: () => void;
  onOpenSubjectModal?: () => void;
  isFullScreenMode?: boolean;
  onToggleFullScreen?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  // Legacy or alternative props support
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onNavigateScreen?: (screen: string) => void;
  currentScreen?: string;
  theme?: "light" | "dark" | "system";
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  unreadNotificationsCount = 0,
  isDarkMode = false,
  themeMode = "dark",
  onThemeModeChange,
  onToggleDarkMode,
  currentLanguage = "en",
  onLanguageChange,
  onOpenAuthModal,
  onOpenNotifications,
  onOpenSubjectModal,
  isFullScreenMode = false,
  onToggleFullScreen,
  isSidebarCollapsed = false,
  onToggleSidebar,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  onOpenProfile,
  onNavigateScreen,
  onToggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    () => storageService.getNotifications()
  );

  const themeRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMode = (mode: "light" | "dark" | "system") => {
    if (onThemeModeChange) {
      onThemeModeChange(mode);
    } else if (onToggleDarkMode) {
      onToggleDarkMode();
    } else if (onToggleTheme) {
      onToggleTheme();
    }
    setShowThemeMenu(false);
  };

  const handleSelectLanguage = (langCode: string) => {
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
    setShowLangMenu(false);
  };

  const handleOpenAuth = () => {
    if (onOpenAuthModal) onOpenAuthModal();
    else if (onOpenProfile) onOpenProfile();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onNavigateScreen) {
      onNavigateScreen("notes");
    }
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    storageService.saveNotifications(updated);
  };

  const actualUnread = unreadNotificationsCount || notifications.filter((n) => !n.isRead).length;

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(currentLanguage, key);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-full px-2 sm:px-4">
        {/* Left Side: Sidebar Toggle & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Toggle Button */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
              aria-label="Toggle Mobile Navigation Menu"
              title="Toggle Mobile Menu"
            >
              <Menu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </button>
          )}

          {/* Desktop Sidebar Collapse Toggle Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
              title={isSidebarCollapsed ? "Expand Sidebar Menu" : "Collapse Sidebar Navigation"}
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-500" />
              )}
            </button>
          )}

          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onNavigateScreen && onNavigateScreen("dashboard")}
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 hidden sm:inline-block">
              StudyMate
            </span>
          </div>
        </div>

        {/* Center: Search Bar (Bento Pill Style) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2.5 pl-11 pr-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-medium"
          />
        </form>

        {/* Right Side: Quick Action Pills */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Full Screen Mode Button */}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-xs transition-all border shadow-xs ${
                isFullScreenMode
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={isFullScreenMode ? t("exitFullScreen") : t("fullScreen")}
            >
              {isFullScreenMode ? (
                <>
                  <Minimize2 className="w-4 h-4 text-white" />
                  <span className="hidden md:inline">{t("exitFullScreen")}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden md:inline">{t("fullScreen")}</span>
                </>
              )}
            </button>
          )}

          {/* Subject Modal Button */}
          {onOpenSubjectModal && (
            <button
              onClick={onOpenSubjectModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t("subjects")}</span>
            </button>
          )}

          {/* Study Streak Pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-xs shadow-sm cursor-pointer"
            onClick={() => onNavigateScreen && onNavigateScreen("progress")}
          >
            <span className="text-sm">🔥</span>
            <span>{t("streak")}</span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowThemeMenu(false);
                setShowNotifDropdown(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all shadow-xs"
              title={t("selectLanguage")}
            >
              <span className="text-base leading-none">{currentLangObj.flag}</span>
              <span className="uppercase text-[11px] font-extrabold">{currentLangObj.code}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    {t("language")}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">i18n</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = lang.code === currentLanguage;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg leading-none">{lang.flag}</span>
                          <div className="flex flex-col text-left">
                            <span>{lang.nativeName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{lang.name}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Mode Selector Dropdown */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                setShowLangMenu(false);
                setShowNotifDropdown(false);
              }}
              className="p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
              title={t("themeMode")}
            >
              {themeMode === "light" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : themeMode === "dark" ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Laptop className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t("themeMode")}</p>
                </div>
                <button
                  onClick={() => handleSelectMode("light")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    themeMode === "light"
                      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{t("lightMode")}</span>
                  </div>
                  {themeMode === "light" && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                </button>

                <button
                  onClick={() => handleSelectMode("dark")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    themeMode === "dark"
                      ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>{t("darkMode")}</span>
                  </div>
                  {themeMode === "dark" && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>

                <button
                  onClick={() => handleSelectMode("system")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    themeMode === "system"
                      ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-slate-500" />
                    <span>{t("systemMode")}</span>
                  </div>
                  {themeMode === "system" && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowThemeMenu(false);
                setShowLangMenu(false);
              }}
              className="relative p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              <Bell className="w-4 h-4" />
              {actualUnread > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-slate-950">
                  {actualUnread}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t("notifications")}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {actualUnread > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        {t("markAllRead")}
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifDropdown(false)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 font-medium">{t("noNotifications")}</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                          <span>{notif.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(notif.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Pill */}
          <button
            onClick={handleOpenAuth}
            className="flex items-center gap-2 py-1.5 px-2.5 sm:px-3 rounded-full bg-indigo-50/90 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all shadow-xs cursor-pointer group"
            title={`Logged in as ${user.name} - Open Profile`}
          >
            <img
              src={user.avatarUrl || DEFAULT_USER.avatarUrl}
              alt={user.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0"
            />
            <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200 max-w-[110px] sm:max-w-[160px] truncate">
              {user.name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
