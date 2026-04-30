import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  FileText,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

import LeaveRequestForm from '../components/leave/LeaveRequestForm';
import LeaveRequestList from '../components/leave/LeaveRequestList';
import NotificationBell from '../components/notifications/NotificationBell';
import AttendanceReminderPopup from '../components/attendance/AttendanceReminderPopup';
import { useCheckInOutReminders } from '../components/hooks/useCheckInOutReminders';
<<<<<<< HEAD
import SmartTimer from '../components/dashboard/SmartTimer';
=======

function LiveTimer({ firstCheckIn, lastCheckOut }) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!firstCheckIn || lastCheckOut) {
      if (lastCheckOut && firstCheckIn) {
        const diffSeconds = Math.floor(
          (new Date(lastCheckOut) - new Date(firstCheckIn)) / 1000
        );

        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;

        setElapsed(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      } else {
        setElapsed('00:00:00');
      }
      return;
    }

    const updateTimer = () => {
      const diffSeconds = Math.floor(
        (new Date() - new Date(firstCheckIn)) / 1000
      );

      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;

      setElapsed(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [firstCheckIn, lastCheckOut]);

  return (
    <div className="text-5xl font-bold text-gray-900 font-mono">
      {elapsed}
    </div>
  );
}
>>>>>>> 617214efd7bb28f37dbb08d56a2cb0a11203c940

function EmployeePerformanceGraph({ data = [] }) {
  const width = 900;
  const height = 340;
  const padding = { top: 35, right: 30, bottom: 50, left: 55 };

  const safeData =
    data.length > 0
      ? data
      : [
          { label: "Mon", value: 0 },
          { label: "Tue", value: 0 },
          { label: "Wed", value: 0 },
          { label: "Thu", value: 0 },
          { label: "Fri", value: 0 },
          { label: "Sat", value: 0 },
          { label: "Sun", value: 0 },
        ];

  const values = safeData.map((item) => Number(item.value || 0));
  const maxValue = Math.max(...values, 8);
  const niceMax = Math.ceil(maxValue / 4) * 4;
  const step = niceMax / 4;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const bottomY = padding.top + chartHeight;

  const points = safeData.map((item, index) => {
    const x =
      safeData.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (safeData.length - 1)) * chartWidth;

    const y =
      padding.top +
      chartHeight -
      (Number(item.value || 0) / niceMax) * chartHeight;

    return {
      x,
      y,
      label: item.label,
      value: Number(item.value || 0),
    };
  });

  const buildSmoothPath = (items) => {
    if (items.length === 0) return "";
    if (items.length === 1) return `M ${items[0].x},${items[0].y}`;

    let path = `M ${items[0].x},${items[0].y}`;

    for (let i = 0; i < items.length - 1; i++) {
      const current = items[i];
      const next = items[i + 1];
      const midX = (current.x + next.x) / 2;

      path += ` C ${midX},${current.y} ${midX},${next.y} ${next.x},${next.y}`;
    }

    return path;
  };

  const linePath = buildSmoothPath(points);

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x},${bottomY} L ${points[0].x},${bottomY} Z`
      : "";

  const yLabels = [niceMax, niceMax - step, niceMax - step * 2, step, 0];

  return (
    <Card className="p-6 border-0 shadow-sm bg-white mb-6 overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Employee Performance
            </h2>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Last 7 days working hour trend based on attendance records.
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[720px] h-[340px]"
        >
          <defs>
            <linearGradient id="performanceAreaWhite" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {yLabels.map((label) => {
            const y = padding.top + chartHeight - (label / niceMax) * chartHeight;

            return (
              <g key={`y-${label}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                />

                <text
                  x={padding.left - 10}
                  y={y + 5}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize="13"
                >
                  {Number(label).toFixed(label % 1 === 0 ? 0 : 1)}
                </text>
              </g>
            );
          })}

          {points.map((point) => (
            <line
              key={`x-grid-${point.label}`}
              x1={point.x}
              y1={padding.top}
              x2={point.x}
              y2={bottomY}
              stroke="#eef2ff"
              strokeWidth="1"
              strokeDasharray="5 5"
            />
          ))}

          <path d={areaPath} fill="url(#performanceAreaWhite)" />

          <path
            d={linePath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point) => (
            <g key={`dot-${point.label}`}>
              <circle cx={point.x} cy={point.y} r="5" fill="#6366f1" />
              <circle cx={point.x} cy={point.y} r="10" fill="#6366f1" opacity="0.12" />
              <title>{`${point.label}: ${point.value.toFixed(1)}h`}</title>
            </g>
          ))}

          {points.map((point) => (
            <text
              key={`label-${point.label}`}
              x={point.x}
              y={height - 18}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="14"
              fontWeight="600"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </Card>
  );
}


export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showAttendanceReminder, setShowAttendanceReminder] = useState(false);

  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: myAttendance = [] } = useQuery({
    queryKey: ['myAttendance', user?.email],
    queryFn: () =>
      base44.entities.Attendance.filter(
        { employee_email: user.email },
        '-date',
        30
      ),
    enabled: !!user?.email,
  });

  const { data: myLeaves = [] } = useQuery({
    queryKey: ['myLeaves', user?.email],
    queryFn: () =>
      base44.entities.LeaveRequest.filter(
        { employee_email: user.email },
        '-created_date',
        10
      ),
    enabled: !!user?.email,
  });

  const todayAttendance = myAttendance.find((a) => a.date === today);

  useCheckInOutReminders(user, todayAttendance);

  useEffect(() => {
    if (todayAttendance === undefined && user?.email) {
      const timer = setTimeout(() => {
        if (!todayAttendance) setShowAttendanceReminder(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [todayAttendance, user]);

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const existingAttendance = await base44.entities.Attendance.filter({
        employee_email: user.email,
        date: today,
      });

      if (existingAttendance.length > 0) {
        throw new Error('Attendance already marked for today');
      }

      const approvedLeaves = await base44.entities.LeaveRequest.filter({
        employee_email: user.email,
        status: 'approved',
      });

      const hasLeaveToday = approvedLeaves.some((leave) => {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        const todayDate = new Date(today);

        return todayDate >= startDate && todayDate <= endDate;
      });

      if (hasLeaveToday) {
        throw new Error(
          'You have an approved leave for today. Please contact admin to cancel the leave first.'
        );
      }

      const now = new Date();
      const clockInTime = format(now, 'HH:mm');
<<<<<<< HEAD
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      
=======
      const totalMinutes = now.getHours() * 60 + now.getMinutes();

>>>>>>> 617214efd7bb28f37dbb08d56a2cb0a11203c940
      let status = 'present';
      if (totalMinutes > 615) status = 'late';

      const attendance = await base44.entities.Attendance.create({
        employee_id: user.id,
        employee_email: user.email,
        employee_name: user.full_name,
        date: today,
        first_check_in: new Date().toISOString(),
        status,
        has_active_session: true,
      });

      await base44.entities.Notification.create({
        user_email: user.email,
        title: 'Check-in Successful',
        message: `You checked in at ${clockInTime}${status === 'late' ? ' (Late Entry)' : ''}`,
        type: 'check_in',
        related_id: attendance.id,
      });

      if (status === 'late') {
        await base44.entities.Notification.create({
          user_email: user.email,
          title: 'Late Entry Alert',
          message: `Your check-in at ${clockInTime} is after office time. Please contact HR if needed.`,
          type: 'check_in',
          related_id: attendance.id,
        });
      }

      const allUsers = await base44.entities.User.list();
      const admins = allUsers.filter((u) => u.role === 'admin');

      for (const admin of admins) {
        await base44.entities.Notification.create({
          user_email: admin.email,
          title: 'Employee Checked In',
          message: `${user.full_name} has checked in at ${clockInTime} (${status})`,
          type: 'check_in',
          related_id: attendance.id,
        });
      }

      return attendance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
      alert('Check-in successful! ✓');
    },
    onError: (error) => {
      alert(error.message || 'Failed to check in. Please try again.');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const checkIn = new Date(todayAttendance.first_check_in);
      const workHours = (now - checkIn) / (1000 * 60 * 60);
<<<<<<< HEAD
      
=======

>>>>>>> 617214efd7bb28f37dbb08d56a2cb0a11203c940
      let finalStatus = todayAttendance.status;
      if (workHours < 4) finalStatus = 'half_day';

      const updated = await base44.entities.Attendance.update(todayAttendance.id, {
        last_check_out: now.toISOString(),
        total_work_hours: workHours,
        status: finalStatus,
        has_active_session: false,
      });

      const clockOutTimeStr = format(now, 'HH:mm');

      await base44.entities.Notification.create({
        user_email: user.email,
        title: 'Check-out Successful',
        message: `You checked out at ${clockOutTimeStr}. Total work hours: ${workHours.toFixed(1)}hrs`,
        type: 'check_in',
        related_id: todayAttendance.id,
      });

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
      alert('Check-out successful! ✓');
    },
    onError: (error) => {
      alert(error.message || 'Failed to check out. Please try again.');
    },
  });

  const leaveRequestMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.LeaveRequest.create({
        ...data,
        employee_id: user.id,
        employee_email: user.email,
        employee_name: user.full_name,
        status: 'pending',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      setShowLeaveForm(false);
    },
  });

  const thisMonthAttendance = myAttendance.filter((a) =>
    a.date?.startsWith(format(new Date(), 'yyyy-MM'))
  );

  const presentDays = thisMonthAttendance.filter((a) => a.status === 'present').length;
  const lateDays = thisMonthAttendance.filter((a) => a.status === 'late').length;

  const totalHours = thisMonthAttendance.reduce((sum, a) => {
    let hours = Number(a.total_work_hours || a.work_hours || 0);

    if (!hours && a.first_check_in && a.last_check_out) {
      const checkIn = new Date(a.first_check_in);
      const checkOut = new Date(a.last_check_out);
      hours = (checkOut - checkIn) / (1000 * 60 * 60);
    }

    return sum + Number(hours || 0);
  }, 0);

  const pendingLeaves = myLeaves.filter((l) => l.status === 'pending').length;
  const totalWorkingDays = thisMonthAttendance.length;

  const attendancePercentage =
    totalWorkingDays > 0
      ? ((presentDays / totalWorkingDays) * 100).toFixed(1)
      : '0';

  const getAttendanceHours = (attendance) => {
  if (!attendance) return 0;

  let hours = Number(attendance.total_work_hours || attendance.work_hours || 0);

  if (!hours && attendance.first_check_in) {
    const checkIn = new Date(attendance.first_check_in);
    const checkOut = attendance.last_check_out
      ? new Date(attendance.last_check_out)
      : new Date();

    hours = (checkOut - checkIn) / (1000 * 60 * 60);
  }

  return Number(hours > 0 ? hours : 0);
};

const safeGraphData = Array.from({ length: 7 }).map((_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - index));

  const dateKey = format(date, "yyyy-MM-dd");

  const attendance = myAttendance.find((item) => item.date === dateKey);

  return {
    label: format(date, "EEE"),
    value: Number(getAttendanceHours(attendance).toFixed(1)),
  };
});

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 pb-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="p-6 border-0 shadow-sm bg-white/80 backdrop-blur">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-4 border-indigo-100">
                {user.profile_photo ? (
                  <AvatarImage src={user.profile_photo} alt={user.full_name} />
                ) : (
                  <AvatarFallback className="bg-indigo-600 text-white text-xl font-bold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {user.full_name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <NotificationBell userEmail={user.email} />
                <div className="text-right hidden md:block">
                  <div className="text-3xl font-bold text-indigo-600">
                    {attendancePercentage}%
                  </div>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <Card className="p-8 md:p-12 border-0 shadow-lg bg-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col items-center">
                <p className="text-gray-400 text-sm uppercase tracking-wide mb-6">
                  {!todayAttendance?.first_check_in
                    ? 'Ready to Start?'
                    : todayAttendance?.last_check_out
                    ? 'Great Job Today!'
                    : 'Currently Working'}
                </p>

                {!todayAttendance?.first_check_in && (
                  <button
                    onClick={() => clockInMutation.mutate()}
                    disabled={clockInMutation.isPending}
                    className="relative w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-2xl hover:shadow-indigo-300 hover:scale-105 transition-all duration-300 group disabled:opacity-50"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <LogIn className="w-12 h-12 text-white mb-3 group-hover:scale-110 transition-transform" />
                      <span className="text-white font-bold text-2xl">Check In</span>
                    </div>
                  </button>
                )}

                {todayAttendance?.first_check_in && !todayAttendance?.last_check_out && (
                  <button
                    onClick={() => setShowCheckoutConfirm(true)}
                    disabled={clockOutMutation.isPending}
                    className="relative w-64 h-64 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 shadow-2xl hover:shadow-rose-300 hover:scale-105 transition-all duration-300 group disabled:opacity-50"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <LogOut className="w-12 h-12 text-white mb-3 group-hover:scale-110 transition-transform" />
                      <span className="text-white font-bold text-2xl">Check Out</span>
                    </div>
                  </button>
                )}

                {todayAttendance?.last_check_out && (
                  <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl">
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-white mb-3" />
                      <span className="text-white font-bold text-2xl">Completed</span>
                    </div>
                  </div>
                )}

<<<<<<< HEAD
                {/* SmartTimer — countdown to office end, then overtime */}
                <div className="mt-8">
                  <SmartTimer
=======
                <div className="mt-8 text-center">
                  <p className="text-gray-400 text-sm mb-2">Time Elapsed</p>
                  <LiveTimer
>>>>>>> 617214efd7bb28f37dbb08d56a2cb0a11203c940
                    firstCheckIn={todayAttendance?.first_check_in}
                    lastCheckOut={todayAttendance?.last_check_out}
                    userShift={user?.shift_id}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <Card className="p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Today's Hours</span>
                  </div>

                  <p className="text-4xl font-bold text-gray-900">
                    {todayAttendance?.total_work_hours
                      ? `${Math.floor(todayAttendance.total_work_hours)}h ${Math.round(
                          (todayAttendance.total_work_hours % 1) * 60
                        )}m`
                      : '0h 0m'}
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    {todayAttendance?.first_check_in
                      ? format(new Date(todayAttendance.first_check_in), 'HH:mm')
                      : '00:00:00'}
                  </p>
                </Card>

                <Card className="p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Status</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        todayAttendance?.first_check_in && !todayAttendance?.last_check_out
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-2xl font-bold text-gray-900">
                      {todayAttendance?.first_check_in && !todayAttendance?.last_check_out
                        ? 'Online'
                        : 'Offline'}
                    </span>
                  </div>
                </Card>

                {todayAttendance?.first_check_in && (
                  <Card className="p-6 border border-gray-200 shadow-sm bg-indigo-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LogIn className="w-4 h-4" />
                        <span>
                          Check In: {format(new Date(todayAttendance.first_check_in), 'HH:mm')}
                        </span>
                      </div>

                      {todayAttendance.last_check_out && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <LogOut className="w-4 h-4" />
                          <span>
                            Check Out: {format(new Date(todayAttendance.last_check_out), 'HH:mm')}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Present</p>
                <p className="text-2xl font-bold text-gray-900">{presentDays}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Late</p>
                <p className="text-2xl font-bold text-gray-900">{lateDays}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(0)}</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Pending Leaves</p>
                <p className="text-2xl font-bold text-gray-900">{pendingLeaves}</p>
              </div>
              <div className="p-2 rounded-lg bg-rose-50">
                <FileText className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
          <EmployeePerformanceGraph data={safeGraphData} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
          <div className="flex justify-end">
            <Button
              onClick={() => setShowLeaveForm(true)}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
            >
              <FileText className="w-5 h-5 mr-2" />
              Request Leave
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <LeaveRequestList requests={myLeaves.slice(0, 5)} />
        </motion.div>

        <LeaveRequestForm
          open={showLeaveForm}
          onClose={() => setShowLeaveForm(false)}
          onSubmit={(data) => leaveRequestMutation.mutate(data)}
          isLoading={leaveRequestMutation.isPending}
        />

        <AlertDialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Check Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to check out? This will record your work time for today.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowCheckoutConfirm(false);
                  clockOutMutation.mutate();
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Yes, Check Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AttendanceReminderPopup
          isOpen={showAttendanceReminder && !todayAttendance}
          onDismiss={() => setShowAttendanceReminder(false)}
          onCheckIn={() => {
            setShowAttendanceReminder(false);
            clockInMutation.mutate();
          }}
        />
      </div>
    </div>
  );
}