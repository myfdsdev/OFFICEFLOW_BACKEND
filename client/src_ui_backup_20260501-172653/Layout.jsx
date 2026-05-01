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
  { name: "Leave Requests", page: "LeaveRequests", icon: FileText },
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
  { name: "Leave Requests", page: "LeaveRequests", icon: FileText },
  { name: "Projects", page: "Projects", icon: LayoutDashboard },
  { name: "Groups", page: "Groups", icon: Users },
  { name: "Direct Messages", page: "DirectMessages", icon: Users },
  { name: "My Profile", page: "MyProfile", icon: UserCircle },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

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

  const NavLinks = ({ onClick }) => (
    <div className="space-y-4">
      {user?.role === "admin" && (
        <div>
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-lime-100/45 uppercase tracking-wider">
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
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                      isActive
                        ? "bg-lime-400/10 text-lime-300 font-medium"
                        : "text-lime-100/55 hover:bg-lime-400/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-lime-300" : "text-lime-100/45"
                      }`}
                    />

                    <span className="flex-1 whitespace-nowrap">
                      {item.name}
                    </span>

                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        {user?.role === "admin" && (
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-lime-100/45 uppercase tracking-wider">
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
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                    isActive
                      ? "bg-lime-400/10 text-lime-300 font-medium"
                      : "text-lime-100/55 hover:bg-lime-400/10 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-lime-300" : "text-lime-100/45"
                    }`}
                  />

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
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationPermissionPrompt />

      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-72 bg-[#020806]/90 border-r border-lime-400/15 p-4">
        <div className="px-4 py-4 mb-6">
          <AppLogo size="md" />
        </div>

        <nav className="flex-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {user && (
          <div className="border-t border-lime-400/15 pt-4 mt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-lime-400/10 transition-colors">
                  <div className="relative">
                    <Avatar className="w-10 h-10 border border-lime-400/20">
                      {user.profile_photo ? (
                        <AvatarImage
                          src={user.profile_photo}
                          alt={user.full_name}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-[#061006]/80 text-lime-300 font-semibold">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="absolute -bottom-0.5 -right-0.5">
                      <OnlineStatusIndicator isOnline={true} size="sm" />
                    </div>
                  </div>

                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-lime-100/45 truncate">
                      {user.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#020806]/90 border-lime-400/15 text-white"
              >
                <DropdownMenuItem className="text-lime-100/45 text-xs focus:bg-lime-400/10">
                  {user.role === "admin" ? "Administrator" : "Employee"}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#061006]/80" />

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
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#020806]/90 backdrop-blur-md border-b border-lime-400/15 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <AppLogo size="sm" />

          <div className="flex items-center gap-2">
            {user && <NotificationBell userEmail={user.email} />}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-lime-100/75 hover:bg-[#061006]/80"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-72 p-0 bg-[#020806]/90 border-lime-400/15"
              >
                <div className="p-4 border-b border-lime-400/15">
                  {user && (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border border-lime-400/20">
                          {user.profile_photo ? (
                            <AvatarImage
                              src={user.profile_photo}
                              alt={user.full_name}
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-[#061006]/80 text-lime-300 font-semibold">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className="absolute -bottom-0.5 -right-0.5">
                          <OnlineStatusIndicator isOnline={true} size="sm" />
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-white">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-lime-100/45">
                          {user.role === "admin" ? "Admin" : "Employee"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <nav className="p-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                  <NavLinks onClick={() => setMobileMenuOpen(false)} />
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-lime-400/15 bg-[#020806]/90">
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

      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="min-h-screen bg-black">{children}</div>
      </main>
    </div>
  );
}