import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { AppAlertHost } from "@/components/ui/app-alert";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import NavigationTracker from "@/lib/NavigationTracker";
import { pagesConfig } from "./pages.config";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { AppSettingsProvider } from "@/lib/AppSettingsContext";
import { ActivityTrackerProvider } from "@/lib/ActivityTracker";

const { Pages, Layout, mainPage } = pagesConfig;

const mainPageKey = mainPage ?? Object.keys(Pages)[0];

const PUBLIC_PAGES = [
  "Welcome",
  "Login",
  "Register",
  "PrivacyPolicy",
  "AccessDenied",
  "ResetPassword",
];

const NO_LAYOUT_PAGES = [
  "Welcome",
  "Login",
  "Register",
  "CompleteProfile",
  "AccessDenied",
  "ResetPassword",
];

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
};

const LayoutWrapper = ({ children, currentPageName }) => {
  if (NO_LAYOUT_PAGES.includes(currentPageName)) {
    return <>{children}</>;
  }

  return Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  );
};

const getUserRedirectPage = (user) => {
  if (!user) return "/Welcome";

  const isProfileComplete =
    user.mobile_number && user.employee_id && user.department;

  if (!isProfileComplete) {
    return "/CompleteProfile";
  }

  if (user.role === "admin") {
    return "/AdminDashboard";
  }

  return `/${mainPageKey || "Dashboard"}`;
};

const ProtectedRoute = ({ pageName, Page }) => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  const isPublicPage = PUBLIC_PAGES.includes(pageName);

  if (isPublicPage) {
    return (
      <LayoutWrapper currentPageName={pageName}>
        <Page />
      </LayoutWrapper>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/Welcome" state={{ from: location }} replace />;
  }

  if (pageName !== "CompleteProfile") {
    const isProfileComplete =
      user?.mobile_number && user?.employee_id && user?.department;

    if (!isProfileComplete) {
      return <Navigate to="/CompleteProfile" replace />;
    }
  }

  return (
    <LayoutWrapper currentPageName={pageName}>
      <Page />
    </LayoutWrapper>
  );
};

const RootRoute = () => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/Welcome" replace />;
  }

  return <Navigate to={getUserRedirectPage(user)} replace />;
};

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />

      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={<ProtectedRoute pageName={path} Page={Page} />}
        />
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <ActivityTrackerProvider>
              <AuthenticatedApp />
            </ActivityTrackerProvider>
          </Router>
          <Toaster />
          <HotToaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#020806",
                color: "#fff",
                border: "1px solid rgba(163, 230, 53, 0.18)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
              },
              success: { iconTheme: { primary: "#a3e635", secondary: "#020806" } },
              error: { iconTheme: { primary: "#fb7185", secondary: "#020806" } },
            }}
          />
          <AppAlertHost />
        </QueryClientProvider>
      </AuthProvider>
    </AppSettingsProvider>
  );
}

export default App;
