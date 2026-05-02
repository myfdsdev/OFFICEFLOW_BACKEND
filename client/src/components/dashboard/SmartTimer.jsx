import React, { useState, useEffect } from 'react';
import { useAppSettings } from '@/lib/AppSettingsContext';
import { Flame, Clock, CheckCircle2 } from 'lucide-react';

/**
 * Smart timer (live-clock edition):
 * - Big display: live current wall-clock time (HH:MM:SS), updates every second
 * - Subline: today's date
 * - Status line below: countdown / overtime / total worked / not checked in
 */
export default function SmartTimer({ firstCheckIn, lastCheckOut, userShift }) {
  const { settings } = useAppSettings();
  const [now, setNow] = useState(() => new Date());

  const effectiveEndTime = userShift?.end_time || settings.office_end_time;
  const shiftLabel = userShift?.name || null;

  // Tick once per second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const parseTimeToday = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatDuration = (ms) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Live current time — the big display
  const liveTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const liveDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Derive status info
  let mode = 'idle';
  let statusText = '';
  if (!firstCheckIn) {
    mode = 'idle';
  } else if (lastCheckOut) {
    mode = 'completed';
    statusText = formatDuration(new Date(lastCheckOut) - new Date(firstCheckIn));
  } else {
    const officeEnd = parseTimeToday(effectiveEndTime);
    if (!officeEnd) {
      mode = 'countdown';
      statusText = formatDuration(now - new Date(firstCheckIn));
    } else if (now < officeEnd) {
      mode = 'countdown';
      statusText = formatDuration(officeEnd - now);
    } else {
      mode = 'overtime';
      statusText = formatDuration(now - officeEnd);
    }
  }

  return (
    <div className="text-center">
      {/* Live wall clock — main display */}
      <div className="text-6xl font-bold font-mono tracking-tight text-gray-900 tabular-nums">
        {liveTime}
      </div>
      <p className="text-xs text-gray-400 mt-1">{liveDate}</p>

      {/* Status line (smart timer info) */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {mode === 'idle' && (
          <p className="text-gray-400 text-sm">Not checked in</p>
        )}
        {mode === 'countdown' && (
          <>
            <Clock className="w-4 h-4 text-indigo-500" />
            <p className="text-indigo-500 text-sm font-medium">
              Office time remaining: <span className="font-mono">{statusText}</span>
            </p>
          </>
        )}
        {mode === 'overtime' && (
          <>
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <p className="text-orange-500 text-sm font-bold">
              OVERTIME <span className="font-mono">{statusText}</span>
            </p>
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          </>
        )}
        {mode === 'completed' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-green-500 text-sm font-medium">
              Worked today: <span className="font-mono">{statusText}</span>
            </p>
          </>
        )}
      </div>

      {/* Helper text */}
      {mode === 'countdown' && effectiveEndTime && (
        <p className="text-xs text-gray-400 mt-1">
          Until {formatDisplayTime(effectiveEndTime)}
          {shiftLabel && <span className="ml-1">· {shiftLabel}</span>}
        </p>
      )}
      {mode === 'overtime' && effectiveEndTime && (
        <p className="text-xs text-orange-400 mt-1">
          Past {formatDisplayTime(effectiveEndTime)}
          {shiftLabel && <span className="ml-1">· {shiftLabel}</span>}
        </p>
      )}
    </div>
  );
}

// "18:00" → "6:00 PM"
function formatDisplayTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}
