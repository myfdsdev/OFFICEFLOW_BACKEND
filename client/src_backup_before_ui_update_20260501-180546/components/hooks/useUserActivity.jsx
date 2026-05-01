import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const ONLINE_PING_INTERVAL = 30_000; // refresh online status every 30s

// Tracks online/offline presence only.
// Auto-checkout (inactivity-based) is owned by the backend cron + ActivityTracker provider.
export function useUserActivity(user) {
  const timerRef = useRef(null);

  const setOnline = async (isOnline) => {
    if (!user?.email) return;
    try {
      await base44.auth.updateMe({
        is_online: isOnline,
        last_active_time: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!user?.email) return;

    setOnline(true);
    timerRef.current = setInterval(() => setOnline(true), ONLINE_PING_INTERVAL);

    const onVisibility = () => {
      setOnline(!document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onUnload = () => {
      navigator.sendBeacon?.(
        '/api/user/status',
        JSON.stringify({
          is_online: false,
          last_active_time: new Date().toISOString(),
        }),
      );
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onUnload);
      setOnline(false);
    };
  }, [user?.email]);
}
