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
    return localStorage.getItem("app_theme") || "light";
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

  // Track user activity and update online status
  useUserActivity(user);

  // Enable auto check-in on first app open of the day
  useAutoCheckIn(user);

  // Enable desktop notifications
  useDesktopNotifications(user);

  // Enable message desktop notifications
  useMessageDesktopNotifications(user);

  // Enable project assignment notifications
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

  const renderNavItem = (item, onClick, compact = sidebarCollapsed) => {
    const Icon = item.icon;
    const isActive = currentPageName === item.page;

    return (
      <div key={item.page} className="relative">
        <Link
          to={createPageUrl(item.page)}
          onClick={onClick}
          title={sidebarCollapsed ? item.name : undefined}
          className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${
            compact ? "justify-center px-0 py-3" : "px-4 py-3"
          } ${
            isActive
              ? "bg-indigo-50 text-indigo-600 font-medium dark:bg-teal-500 dark:text-white"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white"
          }`}
        >
          <Icon
            className={`w-5 h-5 shrink-0 ${
              isActive ? "text-indigo-600 dark:text-white" : "text-gray-400 dark:text-gray-400"
            }`}
          />
          {!compact && (
            <>
              <span
                className={`flex-1 whitespace-nowrap ${item.name === "Direct Messages" ? "mr-8" : ""}`}
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
  };

  const NavLinks = ({ onClick, compact = false }) => (
    <div className={compact ? "space-y-4" : "space-y-4"}>
      {/* Admin Section */}
      {user?.role === "admin" && (
        <div>
          <div className={sidebarCollapsed && !onClick ? "px-0 py-2" : "px-4 py-2"}>
            <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider ${
            compact ? "text-center" : ""
            }`}>
              Admin Panel
            </p>
          </div>
          <div className="space-y-1">
            {adminNavItems.slice(0, 3).map((item) => renderNavItem(item, onClick, compact))}
          </div>
        </div>
      )}

      {/* Personal Section */}
      <div>
        {user?.role === "admin" && (
          <div className={sidebarCollapsed && !onClick ? "px-0 py-2" : "px-4 py-2"}>
            <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider ${
            compact ? "text-center" : ""
            }`}>
              My Account
            </p>
          </div>
        )}
        <div className="space-y-1">
          {(user?.role === "admin"
            ? adminNavItems.slice(3)
            : employeeNavItems
          ).map((item) => renderNavItem(item, onClick, compact))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-gray-100">
      <NotificationPermissionPrompt />
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-gray-100 p-4 transition-all duration-300 dark:bg-slate-950 dark:border-slate-800 ${
          sidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div className={`py-4 mb-4 flex items-center ${sidebarCollapsed ? "justify-center px-0" : "justify-between px-4"}`}>
          <AppLogo size="md" iconOnly={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse sidebar"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <PanelLeftClose className="w-5 h-5" />
            </Button>
          )}
        </div>

        {sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            title="Expand sidebar"
            className="absolute -right-3 top-8 flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-white shadow-md hover:bg-teal-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <nav className="flex-1">
          <NavLinks compact={sidebarCollapsed} />
        </nav>

        <div className={`border-t border-gray-100 pt-4 mt-4 dark:border-slate-800 ${sidebarCollapsed ? "space-y-2" : "space-y-3"}`}>
          <Button
            variant="ghost"
            size={sidebarCollapsed ? "icon" : "default"}
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={`text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white ${
              sidebarCollapsed ? "w-full" : "w-full justify-start"
            }`}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {!sidebarCollapsed && (
              <span className="ml-2">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            )}
          </Button>

        {user && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-3 w-full rounded-xl hover:bg-gray-50 transition-colors dark:hover:bg-slate-800 ${
                    sidebarCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"
                  }`}
                  title={sidebarCollapsed ? user.full_name : undefined}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10 bg-indigo-100 text-indigo-600">
                      {user.profile_photo ? (
                        <AvatarImage
                          src={user.profile_photo}
                          alt={user.full_name}
                        />
                      ) : (
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
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
                    <p className="font-medium text-gray-900 truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="text-gray-500 text-xs">
                  {user.role === "admin" ? "Administrator" : "Employee"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-rose-600"
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

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50 dark:bg-slate-950 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="px-2 py-2">
            <AppLogo size="md" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="dark:text-gray-100"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            {user && <NotificationBell userEmail={user.email} />}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 dark:bg-slate-950 dark:border-slate-800">
                <div className="p-4 border-b">
                  {user && (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 bg-indigo-100 text-indigo-600">
                          {user.profile_photo ? (
                            <AvatarImage
                              src={user.profile_photo}
                              alt={user.full_name}
                            />
                          ) : (
                            <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <OnlineStatusIndicator isOnline={true} size="sm" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role === "admin" ? "Admin" : "Employee"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <nav className="p-4">
                  <NavLinks onClick={() => setMobileMenuOpen(false)} compact={false} />
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
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

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 lg:pt-0 ${
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
      }`}>
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
