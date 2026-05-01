import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/lib/AuthContext";
import api from "@/api/apiClient";
import { getSocket, connectSocket } from "@/api/socketClient";
import AutoCheckoutWarning from "@/components/AutoCheckoutWarning";

const HEARTBEAT_INTERVAL_MS = 30_000;
const STATUS_REFRESH_MS = 60_000;
const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
];

const ActivityTrackerContext = createContext({ hasActiveSession: false });

export const useActivityTracker = () => useContext(ActivityTrackerContext);

export function ActivityTrackerProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [warning, setWarning] = useState(null); // { minutesLeft, checkoutAt }

  const lastSentRef = useRef(0);
  const dirtyRef = useRef(false);
  const intervalRef = useRef(null);
  const statusIntervalRef = useRef(null);

  const refreshStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get("/activity/status");
      setHasActiveSession(!!data.has_active_session);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated || document.hidden) return;
    if (!dirtyRef.current) return;
    if (Date.now() - lastSentRef.current < HEARTBEAT_INTERVAL_MS) return;

    dirtyRef.current = false;
    lastSentRef.current = Date.now();

    try {
      await api.post("/activity/heartbeat", { timestamp: Date.now() });
      // If a warning was showing, dismiss it — we're alive again
      setWarning(null);
    } catch {
      // ignore network blips
    }
  }, [isAuthenticated]);

  // Mark activity on user input
  useEffect(() => {
    if (!isAuthenticated) return;

    const onActivity = () => {
      dirtyRef.current = true;
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, onActivity, { passive: true }),
    );

    const onVisibilityChange = () => {
      if (!document.hidden) dirtyRef.current = true;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Mark dirty initially so the first tick fires a heartbeat
    dirtyRef.current = true;

    return () => {
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, onActivity),
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated]);

  // Heartbeat + status polling — only run when there's an active session
  useEffect(() => {
    if (!isAuthenticated) return;

    refreshStatus();
    statusIntervalRef.current = setInterval(refreshStatus, STATUS_REFRESH_MS);

    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [isAuthenticated, refreshStatus]);

  useEffect(() => {
    if (!isAuthenticated || !hasActiveSession) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, hasActiveSession, sendHeartbeat]);

  // Socket: listen for warning + auto-checkout-done from backend
  useEffect(() => {
    if (!isAuthenticated) return;

    let socket = getSocket();
    if (!socket) socket = connectSocket();
    if (!socket) return;

    const onWarning = (payload) => setWarning(payload);
    const onDone = () => {
      setWarning(null);
      refreshStatus();
    };

    socket.on("auto_checkout_warning", onWarning);
    socket.on("auto_checkout_done", onDone);

    return () => {
      socket.off("auto_checkout_warning", onWarning);
      socket.off("auto_checkout_done", onDone);
    };
  }, [isAuthenticated, refreshStatus, user?.email]);

  return (
    <ActivityTrackerContext.Provider value={{ hasActiveSession }}>
      {children}
      {warning && (
        <AutoCheckoutWarning
          minutesLeft={warning.minutesLeft}
          checkoutAt={warning.checkoutAt}
          onStayActive={() => {
            dirtyRef.current = true;
            sendHeartbeat();
            setWarning(null);
          }}
          onDismiss={() => setWarning(null)}
        />
      )}
    </ActivityTrackerContext.Provider>
  );
}
