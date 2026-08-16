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
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  Menu,
  GraduationCap,
  CheckCheck,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { UserProfile, AppNotification, Subject } from "../types";
import { storageService, DEFAULT_USER } from "../services/storage";
import { SUPPORTED_LANGUAGES, getTranslation, Language } from "../services/i18n";
import { getDefaultAvatar } from "../utils/imageUtils";

interface NavbarProps {
  user?: UserProfile;
  notifications?: AppNotification[];
  onSaveNotifications?: (notifications: AppNotification[]) => void;
  unreadNotificationsCount?: number;
  subjects?: Subject[];
  isDarkMode?: boolean;
  themeMode?: "light" | "dark" | "system";
  onThemeModeChange?: (mode: "light" | "dark" | "system") => void;
  onToggleDarkMode?: () => void;
  currentLanguage?: string;
  onLanguageChange?: (langCode: string) => void;
  onOpenAuthModal?: () => void;
  onOpenNotifications?: () => void;
  onOpenSubjectModal?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  isFirebaseAuthenticated?: boolean;
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
  notifications: propNotifications,
  onSaveNotifications,
  unreadNotificationsCount,
  subjects = [],
  isDarkMode = false,
  themeMode = "dark",
  onThemeModeChange,
  onToggleDarkMode,
  currentLanguage = "en",
  onLanguageChange,
  onOpenAuthModal,
  onOpenNotifications,
  onOpenSubjectModal,
  isSidebarCollapsed = false,
  onToggleSidebar,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  isFirebaseAuthenticated = false,
  onOpenProfile,
  onNavigateScreen,
  onToggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<AppNotification[]>(
    () => storageService.getNotifications()
  );

  const currentNotifications = propNotifications !== undefined ? propNotifications : localNotifications;

  // Actual unread count strictly reflects unread items
  const actualUnread = currentNotifications.filter((n) => !n.isRead).length;

  const themeRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
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
    const updated = currentNotifications.map((n) => ({ ...n, isRead: true }));
    if (onSaveNotifications) {
      onSaveNotifications(updated);
    }
    setLocalNotifications(updated);
    storageService.saveNotifications(updated);
  };

  const handleMarkSingleRead = (id: string) => {
    const updated = currentNotifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    if (onSaveNotifications) {
      onSaveNotifications(updated);
    }
    setLocalNotifications(updated);
    storageService.saveNotifications(updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = currentNotifications.filter((n) => n.id !== id);
    if (onSaveNotifications) {
      onSaveNotifications(updated);
    }
    setLocalNotifications(updated);
    storageService.saveNotifications(updated);
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(currentLanguage, key);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md px-3 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-full">
        {/* Left Side: Brand Logo & Desktop Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => onNavigateScreen && onNavigateScreen("dashboard")}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md shadow-indigo-500/20 shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              StudyMate
            </span>
          </div>
        </div>

        {/* Center: Search Bar (Bento Pill Style) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-2 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-medium"
          />
        </form>

        {/* Right Side: Quick Action Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Study Streak Pill */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-xs shadow-xs cursor-pointer select-none"
            onClick={() => onNavigateScreen && onNavigateScreen("progress")}
            title="Study Streak"
          >
            <span className="text-xs sm:text-sm leading-none">🔥</span>
            <span className="text-[11px] sm:text-xs">{t("streak")}</span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowThemeMenu(false);
                setShowNotifDropdown(false);
              }}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all shadow-xs"
              title={t("selectLanguage")}
            >
              <span className="text-sm sm:text-base leading-none">{currentLangObj.flag}</span>
              <span className="uppercase text-[10px] sm:text-[11px] font-extrabold hidden xs:inline">{currentLangObj.code}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-52 sm:w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1">
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
                          <span className="text-base sm:text-lg leading-none">{lang.flag}</span>
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
              className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
              title={t("themeMode")}
            >
              {themeMode === "light" ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              ) : themeMode === "dark" ? (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
              ) : (
                <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-44 sm:w-48 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1">
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
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowThemeMenu(false);
                setShowLangMenu(false);
              }}
              className="relative p-2 sm:p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {actualUnread > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 text-[9px] sm:text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-slate-950 animate-in zoom-in">
                  {actualUnread}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 z-50 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {t("notifications")}
                      </h3>
                      {actualUnread > 0 ? (
                        <p className="text-[11px] font-semibold text-rose-500">
                          {actualUnread} unread alert{actualUnread > 1 ? "s" : ""}
                        </p>
                      ) : (
                        <p className="text-[11px] font-semibold text-emerald-500">
                          All caught up!
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {actualUnread > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg transition-all"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>{t("markAllRead")}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifDropdown(false)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {currentNotifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-medium">{t("noNotifications")}</p>
                    </div>
                  ) : (
                    currentNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.isRead && handleMarkSingleRead(notif.id)}
                        className={`group relative p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                          !notif.isRead
                            ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 cursor-pointer shadow-xs"
                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/60 opacity-80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                            )}
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">
                              {notif.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {new Date(notif.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40 opacity-90">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {notif.type.replace("_", " ")}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {!notif.isRead ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkSingleRead(notif.id);
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 text-[10px] font-bold"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>Mark read</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                Read
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notif.id);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {onOpenNotifications && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      onClick={() => {
                        setShowNotifDropdown(false);
                        onOpenNotifications();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>Open Notification & Reminders Drawer</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Auth Section: Log In / Sign In button OR Authenticated User with First Name & Avatar */}
          {(() => {
            const isAuthenticated = Boolean(
              isFirebaseAuthenticated ||
              (user?.name && user.name.trim() !== "" && user.name !== "Alex Rivera") ||
              (user?.email && user.email.trim() !== "" && user.email !== "alex.rivera@university.edu")
            );

            const firstName = storageService.extractFirstName(user?.name, user?.email) || "Student";
            const userAvatarUrl = user?.avatarUrl || getDefaultAvatar(firstName, user?.email);

            if (!isAuthenticated) {
              return (
                <div className="flex items-center gap-1.5">
                  {user?.avatarUrl && (
                    <button
                      onClick={handleOpenAuth}
                      className="p-0.5 rounded-full border-2 border-indigo-400 hover:border-indigo-600 transition-all cursor-pointer"
                      title="Profile Avatar"
                    >
                      <img
                        src={user.avatarUrl}
                        alt="Profile Avatar"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(firstName);
                        }}
                      />
                    </button>
                  )}
                  <button
                    id="nav-login-btn"
                    onClick={handleOpenAuth}
                    className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer select-none shrink-0"
                    title="Sign In or Log In"
                  >
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Log In / Sign In</span>
                    <span className="sm:hidden">Log In</span>
                  </button>
                </div>
              );
            }

            return (
              <button
                id="nav-user-profile-btn"
                onClick={handleOpenAuth}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer shadow-xs select-none shrink-0 group"
                title={`Logged in as ${user?.name || user?.email || firstName} (Click to change avatar & profile)`}
              >
                <div className="relative shrink-0">
                  <img
                    src={userAvatarUrl}
                    alt={firstName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-xs group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(firstName, user?.email);
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>
                <div className="hidden xs:flex flex-col text-left pr-0.5">
                  <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200 truncate max-w-[70px] sm:max-w-[110px]">
                    {firstName}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold -mt-0.5 hidden sm:inline">
                    {user?.gradeLevel || "Student"}
                  </span>
                </div>
              </button>
            );
          })()}
        </div>
      </div>
    </header>
  );
};

