import React, { useState, useEffect } from 'react';
import { useAppSettings } from '@/lib/AppSettingsContext';
import { Flame, Clock, CheckCircle2 } from 'lucide-react';

/**
 * Smart timer:
 * - Before office_end_time: counts DOWN remaining office time (blue)
 * - After office_end_time: counts UP overtime (orange/red, with flame icons)
 * - When checked out: shows total worked time (green)
 * - When not checked in: shows --:--:--
 */
export default function SmartTimer({ firstCheckIn, lastCheckOut }) {
  const { settings } = useAppSettings();
  const [display, setDisplay] = useState('00:00:00');
  const [mode, setMode] = useState('idle'); // idle | countdown | overtime | completed

  // Helper: parse "HH:mm" string to today's Date object
  const parseTimeToday = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Helper: format milliseconds → HH:MM:SS
  const formatTime = (ms) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    // ============ STATE 1: Not checked in yet ============
    if (!firstCheckIn) {
      setDisplay('--:--:--');
      setMode('idle');
      return;
    }

    // ============ STATE 2: Already checked out ============
    if (lastCheckOut) {
      const checkIn = new Date(firstCheckIn);
      const checkOut = new Date(lastCheckOut);
      setDisplay(formatTime(checkOut - checkIn));
      setMode('completed');
      return;
    }

    // ============ STATE 3: Active session (countdown OR overtime) ============
    const updateTimer = () => {
      const now = new Date();
      const officeEnd = parseTimeToday(settings.office_end_time);

      if (!officeEnd) {
        // Fallback: count up from check-in
        const checkIn = new Date(firstCheckIn);
        setDisplay(formatTime(now - checkIn));
        setMode('countdown');
        return;
      }

      if (now < officeEnd) {
        // BEFORE office end → COUNT DOWN remaining time
        setDisplay(formatTime(officeEnd - now));
        setMode('countdown');
      } else {
        // AFTER office end → COUNT UP overtime
        setDisplay(formatTime(now - officeEnd));
        setMode('overtime');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [firstCheckIn, lastCheckOut, settings.office_end_time]);

  return (
    <div className="text-center">
      {/* Status Label */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {mode === 'idle' && (
          <p className="text-gray-400 text-sm">Not checked in</p>
        )}
        {mode === 'countdown' && (
          <>
            <Clock className="w-4 h-4 text-indigo-500" />
            <p className="text-indigo-500 text-sm font-medium">Office time remaining</p>
          </>
        )}
        {mode === 'overtime' && (
          <>
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <p className="text-orange-500 text-sm font-bold">OVERTIME</p>
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          </>
        )}
        {mode === 'completed' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-green-500 text-sm font-medium">Total Hours Today</p>
          </>
        )}
      </div>

      {/* Timer Display */}
      <div
        className={`text-5xl font-bold font-mono transition-colors ${
          mode === 'overtime'
            ? 'text-orange-500'
            : mode === 'completed'
            ? 'text-green-600'
            : 'text-gray-900'
        }`}
      >
        {display}
      </div>

      {/* Helper text */}
      {mode === 'countdown' && settings.office_end_time && (
        <p className="text-xs text-gray-400 mt-2">
          Until {formatDisplayTime(settings.office_end_time)}
        </p>
      )}
      {mode === 'overtime' && settings.office_end_time && (
        <p className="text-xs text-orange-400 mt-2">
          Past {formatDisplayTime(settings.office_end_time)}
        </p>
      )}
    </div>
  );
}

// Helper: convert "18:00" to "6:00 PM"
function formatDisplayTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}