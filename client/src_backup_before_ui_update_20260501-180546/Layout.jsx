import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppLogo from "@/components/AppLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  Users,
  Clock,
  ChevronRight,
  UserCircle,
  BarChart3,
  Trophy,
  PanelLeftClose,
  Moon,
  Sun,
} from "lucide-react";
import NotificationBell from "./components/notifications/NotificationBell";
import NotificationPermissionPrompt from "./components/notifications/NotificationPermissionPrompt";
import { useUserActivity } from "./components/hooks/useUserActivity";
import { useAutoCheckIn } from "./components/hooks/useAutoCheckIn";
import { useDesktopNotifications } from "./components/hooks/useDesktopNotifications";
import { useMessageDesktopNotifications } from "./components/hooks/useMessageDesktopNotifications";
import { useProjectNotifications } from "./components/hooks/useProjectNotifications";
import OnlineStatusIndicator from "./components/admin/OnlineStatusIndicator";

const employeeNavItems = [
  { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { name: "Attendance History", page: "AttendanceHistory", icon: Clock },
  { name: "My Stats", page: "MyStats", icon: BarChart3 },
  { name: "Leave Requests", page: "LeaveRequests", icon: FileText },
  { name: "Leaderboard", page: "Leaderboard", icon: Trophy },
  { name: "Projects", page: "Projects", icon: LayoutDashboard },
  { name: "Groups", page: "Groups", icon: Users },
  { name: "Direct Messages", page: "DirectMessages", icon: Users },
  { name: "My Profile", page: "MyProfile", icon: UserCircle },
];

const adminNavItems = [
  { name: "Admin Dashboard", page: "AdminDashboard", icon: LayoutDashboard },
  { name: "Attendance Reports", page: "AttendanceReports", icon: BarChart3 },
  { name: "Settings", page: "Settings", icon: Settings },
  { name: "My Dashboard", page: "Dashboard", icon: Users },
  { name: "Attendance History", page: "AttendanceHistory", icon: Clock },
  { name: "My Stats", page: "MyStats", icon: BarChart3 },
  { name: "Leave Requests", page: "LeaveRequests", icon: FileText },
  { name: "Leaderboard", page: "Leaderboard", icon: Trophy },
  { name: "Projects", page: "Projects", icon: LayoutDashboard },
  { name: "Groups", page: "Groups", icon: Users },
  { name: "Direct Messages", page: "DirectMessages", icon: Users },
  { name: "My Profile", page: "MyProfile", icon: UserCircle },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app_theme") || "dark";
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useUserActivity(user);
  useAutoCheckIn(user);
  useDesktopNotifications(user);
  useMessageDesktopNotifications(user);
  useProjectNotifications(user);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const NavLinks = ({ onClick, compact = sidebarCollapsed }) => (
    <div className="space-y-4">
      {user?.role === "admin" && (
        <div>
          <div className={compact ? "px-0 py-2" : "px-4 py-2"}>
            <p className={`text-xs font-semibold text-black/40 uppercase tracking-wider dark:text-lime-100/45 ${compact ? "text-center" : ""}`}>
              Admin Panel
            </p>   
          </div>

          <div className="space-y-1">
            {adminNavItems.slice(0, 3).map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;

              return (
                <div key={item.page} className="relative">
                  <Link
                    to={createPageUrl(item.page)}
                    onClick={onClick}
                    title={compact ? item.name : undefined}
                    className={`flex items-center gap-3 rounded-2xl transition-all ${compact ? "justify-center px-0 py-3" : "px-4 py-3"} ${
                      isActive
                        ? "bg-black text-white font-medium dark:bg-lime-400/10 dark:text-lime-300"
                        : "text-black/60 hover:bg-black/5 hover:text-black dark:text-lime-100/55 dark:hover:bg-lime-400/10 dark:hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-white dark:text-lime-300" : "text-black/40 dark:text-lime-100/45"
                      }`}
                    />

                    {!compact && (
                      <>
                        <span className="flex-1 whitespace-nowrap">
                          {item.name}
                        </span>

                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        {user?.role === "admin" && (
          <div className={compact ? "px-0 py-2" : "px-4 py-2"}>
            <p className={`text-xs font-semibold text-black/40 uppercase tracking-wider dark:text-lime-100/45 ${compact ? "text-center" : ""}`}>
              My Account
            </p>
          </div>
        )}

        <div className="space-y-1">
          {(user?.role === "admin"
            ? adminNavItems.slice(3)
            : employeeNavItems
          ).map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;

            return (
              <div key={item.page} className="relative">
                <Link
                  to={createPageUrl(item.page)}
                  onClick={onClick}
                  title={compact ? item.name : undefined}
                  className={`flex items-center gap-3 rounded-2xl transition-all ${compact ? "justify-center px-0 py-3" : "px-4 py-3"} ${
                    isActive
                      ? "bg-black text-white font-medium dark:bg-lime-400/10 dark:text-lime-300"
                      : "text-black/60 hover:bg-black/5 hover:text-black dark:text-lime-100/55 dark:hover:bg-lime-400/10 dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-white dark:text-lime-300" : "text-black/40 dark:text-lime-100/45"
                    }`}
                  />

                  {!compact && (
                    <>
                      <span
                        className={`flex-1 whitespace-nowrap ${
                          item.name === "Direct Messages" ? "mr-8" : ""
                        }`}
                      >
                        {item.name}
                      </span>

                      {item.name === "Direct Messages" && user && (
                        <div className="pointer-events-auto">
                          <NotificationBell
                            userEmail={user.email}
                            notificationType="new_message"
                          />
                        </div>
                      )}

                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <NotificationPermissionPrompt />

      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-black/10 p-4 transition-all duration-300 dark:bg-[#020806]/90 dark:border-lime-400/15 ${sidebarCollapsed ? "w-20" : "w-72"}`}>
        <div className={`py-4 mb-6 flex items-center ${sidebarCollapsed ? "justify-center px-0" : "justify-between px-4"}`}>
          <AppLogo size="md" iconOnly={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(true)}
              className="text-black/55 hover:bg-black/5 hover:text-black dark:text-lime-100/55 dark:hover:bg-lime-400/10 dark:hover:text-lime-300"
            >
              <PanelLeftClose className="w-5 h-5" />
            </Button>
          )}
        </div>

        {sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="absolute -right-3 top-8 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white shadow-md hover:bg-black/80 dark:bg-lime-400 dark:text-black dark:hover:bg-lime-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <nav className="flex-1 overflow-y-auto">
          <NavLinks compact={sidebarCollapsed} />
        </nav>

        <div className="border-t border-black/10 pt-4 mt-4 dark:border-lime-400/15">
          <Button
            variant="ghost"
            size={sidebarCollapsed ? "icon" : "default"}
            onClick={toggleTheme}
            className={`mb-2 text-black/60 hover:bg-black/5 hover:text-black dark:text-lime-100/55 dark:hover:bg-lime-400/10 dark:hover:text-lime-300 ${sidebarCollapsed ? "w-full" : "w-full justify-start"}`}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!sidebarCollapsed && (
              <span className="ml-2">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            )}
          </Button>

        {user && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-3 w-full rounded-xl hover:bg-black/5 transition-colors dark:hover:bg-lime-400/10 ${sidebarCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}`}>
                  <div className="relative">
                    <Avatar className="w-10 h-10 border border-black/10 dark:border-lime-400/20">
                      {user.profile_photo ? (
                        <AvatarImage
                          src={user.profile_photo}
                          alt={user.full_name}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-black/5 text-black font-semibold dark:bg-[#061006]/80 dark:text-lime-300">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="absolute -bottom-0.5 -right-0.5">
                      <OnlineStatusIndicator isOnline={true} size="sm" />
                    </div>
                  </div>

                  {!sidebarCollapsed && (
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-black truncate dark:text-white">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-black/45 truncate dark:text-lime-100/45">
                      {user.email}
                    </p>
                  </div>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 bg-white border-black/10 text-black dark:bg-[#020806]/90 dark:border-lime-400/15 dark:text-white"
              >
                <DropdownMenuItem className="text-black/45 text-xs focus:bg-black/5 dark:text-lime-100/45 dark:focus:bg-lime-400/10">
                  {user.role === "admin" ? "Administrator" : "Employee"}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-black/10 dark:bg-[#061006]/80" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        </div>
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white backdrop-blur-md border-b border-black/10 z-50 dark:bg-[#020806]/90 dark:border-lime-400/15">
        <div className="flex items-center justify-between px-4 py-3">
          <AppLogo size="sm" />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-black/75 hover:bg-black/5 dark:text-lime-100/75 dark:hover:bg-[#061006]/80"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {user && <NotificationBell userEmail={user.email} />}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-black/75 hover:bg-black/5 dark:text-lime-100/75 dark:hover:bg-[#061006]/80"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-72 p-0 bg-white border-black/10 dark:bg-[#020806]/90 dark:border-lime-400/15"
              >
                <div className="p-4 border-b border-black/10 dark:border-lime-400/15">
                  {user && (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border border-black/10 dark:border-lime-400/20">
                          {user.profile_photo ? (
                            <AvatarImage
                              src={user.profile_photo}
                              alt={user.full_name}
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-black/5 text-black font-semibold dark:bg-[#061006]/80 dark:text-lime-300">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className="absolute -bottom-0.5 -right-0.5">
                          <OnlineStatusIndicator isOnline={true} size="sm" />
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-black dark:text-white">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-black/45 dark:text-lime-100/45">
                          {user.role === "admin" ? "Admin" : "Employee"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <nav className="p-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                  <NavLinks onClick={() => setMobileMenuOpen(false)} compact={false} />
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/10 bg-white dark:border-lime-400/15 dark:bg-[#020806]/90">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full text-rose-400 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/40"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className={`pt-16 transition-all duration-300 lg:pt-0 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}`}>
        <div className="min-h-screen bg-white dark:bg-black">{children}</div>
      </main>
    </div>
  );
}
