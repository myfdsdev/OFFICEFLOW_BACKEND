// import React, { useState, useEffect } from 'react';
// import { base44 } from '@/api/base44Client';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { format } from 'date-fns';
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Calendar, Clock, CheckCircle2, LogIn, LogOut, FileText, TrendingUp } from "lucide-react";
// import { motion } from "framer-motion";

// import LeaveRequestForm from '../components/leave/LeaveRequestForm';
// import LeaveRequestList from '../components/leave/LeaveRequestList';
// import NotificationBell from '../components/notifications/NotificationBell';
// import AttendanceReminderPopup from '../components/attendance/AttendanceReminderPopup';
// import { useCheckInOutReminders } from '../components/hooks/useCheckInOutReminders';

// // Live Timer Component
// function LiveTimer({ firstCheckIn, lastCheckOut }) {
//   const [elapsed, setElapsed] = useState('00:00:00');

//   useEffect(() => {
//     if (!firstCheckIn || lastCheckOut) {
//       // If not clocked in or already clocked out, show static time
//       if (lastCheckOut && firstCheckIn) {
//         const checkIn = new Date(firstCheckIn);
//         const checkOut = new Date(lastCheckOut);
//         const diffMs = checkOut - checkIn;
//         const diffSeconds = Math.floor(diffMs / 1000);
        
//         const hours = Math.floor(diffSeconds / 3600);
//         const minutes = Math.floor((diffSeconds % 3600) / 60);
//         const seconds = diffSeconds % 60;
//         setElapsed(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
//       } else {
//         setElapsed('00:00:00');
//       }
//       return;
//     }

//     // Calculate and update elapsed time every second
//     const updateTimer = () => {
//       const now = new Date();
//       const checkIn = new Date(firstCheckIn);
      
//       const diffMs = now - checkIn;
//       const diffSeconds = Math.floor(diffMs / 1000);
      
//       const hours = Math.floor(diffSeconds / 3600);
//       const minutes = Math.floor((diffSeconds % 3600) / 60);
//       const seconds = diffSeconds % 60;
      
//       setElapsed(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
//     };

//     updateTimer();
//     const interval = setInterval(updateTimer, 1000);

//     return () => clearInterval(interval);
//   }, [firstCheckIn, lastCheckOut]);

//   return (
//     <div className="text-5xl font-bold text-gray-900 font-mono">
//       {elapsed}
//     </div>
//   );
// }

// export default function Dashboard() {
//   const [user, setUser] = useState(null);
//   const [showLeaveForm, setShowLeaveForm] = useState(false);
//   const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
//   const [showAttendanceReminder, setShowAttendanceReminder] = useState(false);
//   const queryClient = useQueryClient();
//   const today = format(new Date(), 'yyyy-MM-dd');

//   useEffect(() => {
//     base44.auth.me().then(setUser);
//   }, []);

//   const { data: myAttendance = [], isLoading: loadingAttendance } = useQuery({
//     queryKey: ['myAttendance', user?.email],
//     queryFn: () => base44.entities.Attendance.filter({ employee_email: user.email }, '-date', 30),
//     enabled: !!user?.email,
//   });

//   const { data: myLeaves = [], isLoading: loadingLeaves } = useQuery({
//     queryKey: ['myLeaves', user?.email],
//     queryFn: () => base44.entities.LeaveRequest.filter({ employee_email: user.email }, '-created_date', 10),
//     enabled: !!user?.email,
//   });

//   const todayAttendance = myAttendance.find(a => a.date === today);

//   // Enable desktop reminders for check-in/check-out
//   useCheckInOutReminders(user, todayAttendance);

//   // Show attendance reminder when app loads if no check-in today
//   useEffect(() => {
//     if (todayAttendance === undefined && user?.email) {
//       // Wait a bit for data to load
//       const timer = setTimeout(() => {
//         if (!todayAttendance) {
//           setShowAttendanceReminder(true);
//         }
//       }, 2000);
//       return () => clearTimeout(timer);
//     }
//   }, [todayAttendance, user]);

//   const clockInMutation = useMutation({
//     mutationFn: async () => {
//       // Check for duplicate attendance
//       const existingAttendance = await base44.entities.Attendance.filter({
//         employee_email: user.email,
//         date: today
//       });

//       if (existingAttendance.length > 0) {
//         throw new Error('Attendance already marked for today');
//       }

//       // Check for approved leave on this date
//       const approvedLeaves = await base44.entities.LeaveRequest.filter({
//         employee_email: user.email,
//         status: 'approved'
//       });

//       const hasLeaveToday = approvedLeaves.some(leave => {
//         const startDate = new Date(leave.start_date);
//         const endDate = new Date(leave.end_date);
//         const todayDate = new Date(today);
//         return todayDate >= startDate && todayDate <= endDate;
//       });

//       if (hasLeaveToday) {
//         throw new Error('You have an approved leave for today. Please contact admin to cancel the leave first.');
//       }

//       const now = new Date();
//       const clockInTime = format(now, 'HH:mm');
//       const hours = now.getHours();
//       const minutes = now.getMinutes();
//       const totalMinutes = hours * 60 + minutes;
      
//       // Determine status based on check-in time
//       // Before 10:00 AM (600 minutes) → Present
//       // After 10:15 AM (615 minutes) → Late
//       // Between 10:00 and 10:15 → Present (grace period)
//       let status = 'present';
//       if (totalMinutes > 615) {
//         status = 'late';
//       }
      
//       const attendance = await base44.entities.Attendance.create({
//         employee_id: user.id,
//         employee_email: user.email,
//         employee_name: user.full_name,
//         date: today,
//         first_check_in: new Date().toISOString(),
//         status: status,
//         has_active_session: true,
//       });

//       // Send success notification to employee
//       await base44.entities.Notification.create({
//         user_email: user.email,
//         title: 'Check-in Successful',
//         message: `You checked in at ${clockInTime}${status === 'late' ? ' (Late Entry)' : ''}`,
//         type: 'check_in',
//         related_id: attendance.id,
//       });

//       // If late, send late entry alert
//       if (status === 'late') {
//         await base44.entities.Notification.create({
//           user_email: user.email,
//           title: 'Late Entry Alert',
//           message: `Your check-in at ${clockInTime} is after office time. Please contact HR if needed.`,
//           type: 'check_in',
//           related_id: attendance.id,
//         });
//       }

//       // Get all admins and notify them
//       const allUsers = await base44.entities.User.list();
//       const admins = allUsers.filter(u => u.role === 'admin');

//       for (const admin of admins) {
//         await base44.entities.Notification.create({
//           user_email: admin.email,
//           title: 'Employee Checked In',
//           message: `${user.full_name} has checked in at ${clockInTime} (${status})`,
//           type: 'check_in',
//           related_id: attendance.id,
//         });
//       }

//       return attendance;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
//       alert('Check-in successful! ✓');
//     },
//     onError: (error) => {
//       alert(error.message || 'Failed to check in. Please try again.');
//     },
//   });

//   const clockOutMutation = useMutation({
//     mutationFn: async () => {
//       const now = new Date();
//       const checkIn = new Date(todayAttendance.first_check_in);
//       const workHours = (now - checkIn) / (1000 * 60 * 60);
      
//       // Determine final status based on work hours
//       // If less than 4 hours → Half Day
//       let finalStatus = todayAttendance.status;
//       if (workHours < 4) {
//         finalStatus = 'half_day';
//       }
      
//       const updated = await base44.entities.Attendance.update(todayAttendance.id, {
//         last_check_out: now.toISOString(),
//         total_work_hours: workHours,
//         status: finalStatus,
//         has_active_session: false,
//       });

//       // Send success notification to employee
//       const clockOutTimeStr = format(now, 'HH:mm');
//       await base44.entities.Notification.create({
//         user_email: user.email,
//         title: 'Check-out Successful',
//         message: `You checked out at ${clockOutTimeStr}. Total work hours: ${workHours.toFixed(1)}hrs`,
//         type: 'check_in',
//         related_id: todayAttendance.id,
//       });

//       return updated;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
//       alert('Check-out successful! ✓');
//     },
//     onError: (error) => {
//       alert(error.message || 'Failed to check out. Please try again.');
//     },
//   });

//   const leaveRequestMutation = useMutation({
//     mutationFn: (data) => base44.entities.LeaveRequest.create({
//       ...data,
//       employee_id: user.id,
//       employee_email: user.email,
//       employee_name: user.full_name,
//       status: 'pending',
//     }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
//       setShowLeaveForm(false);
//     },
//   });

//   const thisMonthAttendance = myAttendance.filter(a => 
//     a.date.startsWith(format(new Date(), 'yyyy-MM'))
//   );
//   const presentDays = thisMonthAttendance.filter(a => a.status === 'present').length;
//   const lateDays = thisMonthAttendance.filter(a => a.status === 'late').length;
//   const totalHours = thisMonthAttendance.reduce((sum, a) => sum + (a.total_work_hours || 0), 0);
//   const pendingLeaves = myLeaves.filter(l => l.status === 'pending').length;
//   const totalWorkingDays = thisMonthAttendance.length;
//   const attendancePercentage = totalWorkingDays > 0 
//     ? ((presentDays / totalWorkingDays) * 100).toFixed(1) 
//     : '0';

//   const getInitials = (name) => {
//     if (!name) return "?";
//     return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
//   };

//   if (!user) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="animate-pulse text-gray-400">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
//       <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 pb-20">
//         {/* Welcome Header */}
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mb-6"
//         >
//           <Card className="p-6 border-0 shadow-sm bg-white/80 backdrop-blur">
//             <div className="flex items-center gap-4">
//               <Avatar className="w-16 h-16 border-4 border-indigo-100">
//                 {user.profile_photo ? (
//                   <AvatarImage src={user.profile_photo} alt={user.full_name} />
//                 ) : (
//                   <AvatarFallback className="bg-indigo-600 text-white text-xl font-bold">
//                     {getInitials(user.full_name)}
//                   </AvatarFallback>
//                 )}
//               </Avatar>
//               <div className="flex-1">
//                 <h1 className="text-2xl font-bold text-gray-900">
//                   Welcome, {user.full_name?.split(' ')[0]}!
//                 </h1>
//                 <p className="text-gray-500 text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
//               </div>
//               <div className="flex items-center gap-4">
//                 <NotificationBell userEmail={user.email} />
//                 <div className="text-right hidden md:block">
//                   <div className="text-3xl font-bold text-indigo-600">{attendancePercentage}%</div>
//                   <p className="text-xs text-gray-500">This Month</p>
//                 </div>
//               </div>
//             </div>
//           </Card>
//         </motion.div>

//         {/* Large Check-In/Out Buttons */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//           className="mb-6"
//         >
//           <Card className="p-8 md:p-12 border-0 shadow-lg bg-white">
//             <div className="grid md:grid-cols-2 gap-8 items-center">
//               {/* Left Side - Check In/Out Button */}
//               <div className="flex flex-col items-center">
//                 <p className="text-gray-400 text-sm uppercase tracking-wide mb-6">
//                   {!todayAttendance?.first_check_in ? 'Ready to Start?' : todayAttendance?.last_check_out ? 'Great Job Today!' : 'Currently Working'}
//                 </p>
                
//                 {!todayAttendance?.first_check_in && (
//                   <button
//                     onClick={() => clockInMutation.mutate()}
//                     disabled={clockInMutation.isPending}
//                     className="relative w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-2xl hover:shadow-indigo-300 hover:scale-105 transition-all duration-300 group disabled:opacity-50"
//                   >
//                     <div className="absolute inset-0 flex flex-col items-center justify-center">
//                       <LogIn className="w-12 h-12 text-white mb-3 group-hover:scale-110 transition-transform" />
//                       <span className="text-white font-bold text-2xl">Check In</span>
//                     </div>
//                   </button>
//                 )}

//                 {todayAttendance?.first_check_in && !todayAttendance?.last_check_out && (
//                   <button
//                     onClick={() => setShowCheckoutConfirm(true)}
//                     disabled={clockOutMutation.isPending}
//                     className="relative w-64 h-64 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 shadow-2xl hover:shadow-rose-300 hover:scale-105 transition-all duration-300 group disabled:opacity-50"
//                   >
//                     <div className="absolute inset-0 flex flex-col items-center justify-center">
//                       <LogOut className="w-12 h-12 text-white mb-3 group-hover:scale-110 transition-transform" />
//                       <span className="text-white font-bold text-2xl">Check Out</span>
//                     </div>
//                   </button>
//                 )}

//                 {todayAttendance?.last_check_out && (
//                   <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl">
//                     <div className="absolute inset-0 flex flex-col items-center justify-center">
//                       <CheckCircle2 className="w-12 h-12 text-white mb-3" />
//                       <span className="text-white font-bold text-2xl">Completed</span>
//                     </div>
//                   </div>
//                 )}

//                 <div className="mt-8 text-center">
//                   <p className="text-gray-400 text-sm mb-2">Time Elapsed</p>
//                   <LiveTimer 
//                     firstCheckIn={todayAttendance?.first_check_in}
//                     lastCheckOut={todayAttendance?.last_check_out}
//                   />
//                 </div>
//               </div>

//               {/* Right Side - Stats */}
//               <div className="space-y-6">
//                 <Card className="p-6 border border-gray-200 shadow-sm">
//                   <div className="flex items-center gap-3 mb-2">
//                     <div className="p-2 rounded-lg bg-indigo-50">
//                       <Clock className="w-5 h-5 text-indigo-600" />
//                     </div>
//                     <span className="text-gray-600 font-medium">Today's Hours</span>
//                   </div>
//                   <p className="text-4xl font-bold text-gray-900">
//                     {todayAttendance?.total_work_hours 
//                       ? `${Math.floor(todayAttendance.total_work_hours)}h ${Math.round((todayAttendance.total_work_hours % 1) * 60)}m`
//                       : '0h 0m'
//                     }
//                   </p>
//                   <p className="text-sm text-gray-400 mt-1">
//                     {todayAttendance?.first_check_in ? format(new Date(todayAttendance.first_check_in), 'HH:mm') : '00:00:00'}
//                   </p>
//                 </Card>

//                 <Card className="p-6 border border-gray-200 shadow-sm">
//                   <div className="flex items-center gap-3 mb-2">
//                     <div className="p-2 rounded-lg bg-purple-50">
//                       <CheckCircle2 className="w-5 h-5 text-purple-600" />
//                     </div>
//                     <span className="text-gray-600 font-medium">Status</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className={`w-3 h-3 rounded-full ${
//                       todayAttendance?.first_check_in && !todayAttendance?.last_check_out 
//                         ? 'bg-green-500' 
//                         : 'bg-gray-300'
//                     }`} />
//                     <span className="text-2xl font-bold text-gray-900">
//                       {todayAttendance?.first_check_in && !todayAttendance?.last_check_out 
//                         ? 'Online' 
//                         : 'Offline'
//                       }
//                     </span>
//                   </div>
//                 </Card>

//                 {todayAttendance?.first_check_in && (
//                   <Card className="p-6 border border-gray-200 shadow-sm bg-indigo-50">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2 text-sm text-gray-600">
//                         <LogIn className="w-4 h-4" />
//                         <span>Check In: {format(new Date(todayAttendance.first_check_in), 'HH:mm')}</span>
//                       </div>
//                       {todayAttendance.last_check_out && (
//                         <div className="flex items-center gap-2 text-sm text-gray-600">
//                           <LogOut className="w-4 h-4" />
//                           <span>Check Out: {format(new Date(todayAttendance.last_check_out), 'HH:mm')}</span>
//                         </div>
//                       )}
//                     </div>
//                   </Card>
//                 )}
//               </div>
//             </div>
//           </Card>
//         </motion.div>

//         {/* Stats Grid */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//           className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
//         >
//           <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
//             <div className="flex items-start justify-between">
//               <div>
//                 <p className="text-gray-500 text-xs font-medium mb-1">Present</p>
//                 <p className="text-2xl font-bold text-gray-900">{presentDays}</p>
//               </div>
//               <div className="p-2 rounded-lg bg-emerald-50">
//                 <CheckCircle2 className="w-5 h-5 text-emerald-600" />
//               </div>
//             </div>
//           </Card>

//           <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
//             <div className="flex items-start justify-between">
//               <div>
//                 <p className="text-gray-500 text-xs font-medium mb-1">Late</p>
//                 <p className="text-2xl font-bold text-gray-900">{lateDays}</p>
//               </div>
//               <div className="p-2 rounded-lg bg-amber-50">
//                 <Clock className="w-5 h-5 text-amber-600" />
//               </div>
//             </div>
//           </Card>

//           <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
//             <div className="flex items-start justify-between">
//               <div>
//                 <p className="text-gray-500 text-xs font-medium mb-1">Total Hours</p>
//                 <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(0)}</p>
//               </div>
//               <div className="p-2 rounded-lg bg-indigo-50">
//                 <TrendingUp className="w-5 h-5 text-indigo-600" />
//               </div>
//             </div>
//           </Card>

//           <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
//             <div className="flex items-start justify-between">
//               <div>
//                 <p className="text-gray-500 text-xs font-medium mb-1">Pending Leaves</p>
//                 <p className="text-2xl font-bold text-gray-900">{pendingLeaves}</p>
//               </div>
//               <div className="p-2 rounded-lg bg-rose-50">
//                 <FileText className="w-5 h-5 text-rose-600" />
//               </div>
//             </div>
//           </Card>
//         </motion.div>

//         {/* Quick Actions */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//           className="mb-6"
//         >
//           <div className="flex justify-end">
//             <Button
//               onClick={() => setShowLeaveForm(true)}
//               size="lg"
//               className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
//             >
//               <FileText className="w-5 h-5 mr-2" />
//               Request Leave
//             </Button>
//           </div>
//         </motion.div>

//         {/* Recent Leaves */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4 }}
//         >
//           <LeaveRequestList requests={myLeaves.slice(0, 5)} />
//         </motion.div>

//         <LeaveRequestForm
//           open={showLeaveForm}
//           onClose={() => setShowLeaveForm(false)}
//           onSubmit={(data) => leaveRequestMutation.mutate(data)}
//           isLoading={leaveRequestMutation.isPending}
//         />

//         {/* Checkout Confirmation Dialog */}
//         <AlertDialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
//           <AlertDialogContent>
//             <AlertDialogHeader>
//               <AlertDialogTitle>Confirm Check Out</AlertDialogTitle>
//               <AlertDialogDescription>
//                 Are you sure you want to check out? This will record your work time for today.
//               </AlertDialogDescription>
//             </AlertDialogHeader>
//             <AlertDialogFooter>
//               <AlertDialogCancel>Cancel</AlertDialogCancel>
//               <AlertDialogAction
//                 onClick={() => {
//                   setShowCheckoutConfirm(false);
//                   clockOutMutation.mutate();
//                 }}
//                 className="bg-indigo-600 hover:bg-indigo-700"
//               >
//                 Yes, Check Out
//               </AlertDialogAction>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialog>

//         {/* Attendance Reminder Popup */}
//         <AttendanceReminderPopup
//           isOpen={showAttendanceReminder && !todayAttendance}
//           onDismiss={() => setShowAttendanceReminder(false)}
//           onCheckIn={() => {
//             setShowAttendanceReminder(false);
//             clockInMutation.mutate();
//           }}
//         />
//       </div>
//     </div>
//   );
// }

























import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  differenceInSeconds,
  startOfWeek,
  isWithinInterval,
  subDays,
} from 'date-fns';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  CalendarDays,
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  FileText,
  Activity,
  AlertCircle,
  Check,
  TrendingUp,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Components
import LeaveRequestForm from '../components/leave/LeaveRequestForm';
import LeaveRequestList from '../components/leave/LeaveRequestList';
import NotificationBell from '../components/notifications/NotificationBell';

const THEME = {
  bg: "#000000",
  surface: "#040700",
  surface2: "#070b00",
  border: "#1B211A",
  borderSoft: "#1c2505",
  accent: "#a3d312",
  accentSoft: "#b7ea20",
  accentTextDark: "#0a0d00",
  muted: "#8a9472",
  muted2: "#66704f",
  text: "#f4f7ea",
  danger: "#ff6b6b",
};

function useRealTimeStats(firstCheckIn, lastCheckOut) {
  const [elapsed, setElapsed] = useState('00:00:00');
  const [liveHours, setLiveHours] = useState('0h 0m');

  const formatTime = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(
      Math.floor((s % 3600) / 60)
    ).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const formatHours = (s) =>
    `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

  useEffect(() => {
    if (!firstCheckIn || lastCheckOut) {
      if (lastCheckOut && firstCheckIn) {
        const diff = differenceInSeconds(
          new Date(lastCheckOut),
          new Date(firstCheckIn)
        );
        setElapsed(formatTime(diff));
        setLiveHours(formatHours(diff));
      } else {
        setElapsed('00:00:00');
        setLiveHours('0h 0m');
      }
      return;
    }

    const interval = setInterval(() => {
      const diff = differenceInSeconds(new Date(), new Date(firstCheckIn));
      setElapsed(formatTime(diff));
      setLiveHours(formatHours(diff));
    }, 1000);

    return () => clearInterval(interval);
  }, [firstCheckIn, lastCheckOut]);

  return { elapsed, liveHours };
}

function formatDateTime(value) {
  if (!value) return '--';
  try {
    return format(new Date(value), 'hh:mm a');
  } catch {
    return '--';
  }
}

function getSessionDurationSeconds(entry) {
  if (!entry?.first_check_in) return 0;
  const start = new Date(entry.first_check_in);
  const end = entry.last_check_out ? new Date(entry.last_check_out) : new Date();
  return Math.max(0, differenceInSeconds(end, start));
}

function formatHoursFromSeconds(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function downloadCsv(filename, rows) {
  const processValue = (value) => {
    const stringValue = value == null ? '' : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const csvContent = rows.map((row) => row.map(processValue).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SectionCard({ className = "", children }) {
  return (
    <Card
      className={`rounded-[28px] border shadow-none ${className} `}
      style={{
        background: THEME.bg,
        borderColor: THEME.border,
      }}
    >
      {children}
    </Card>
  );
}

function MetricMiniCard({ label, value, icon: Icon }) {
  return (
    <div
      className="rounded-[22px] p-4"
      style={{
        background: THEME.surface2,
        border: `1px solid ${THEME.borderSoft}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[12px] uppercase tracking-[0.18em] mb-2"
            style={{ color: THEME.muted }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-semibold tracking-[-0.03em]"
            style={{ color: THEME.text }}
          >
            {value}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(163,211,18,0.08)",
            border: `1px solid ${THEME.border}`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: THEME.accent }} />
        </div>
      </div>
    </div>
  );
}

function SessionActionButton({ type, loading, onClick }) {
  const isCheckIn = type === 'checkin';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={loading}
      className="relative rounded-full flex flex-col items-center justify-center overflow-hidden transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        width: 190,
        height: 190,
        background: THEME.accent,
        color: THEME.accentTextDark,
        boxShadow: "none",
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px solid rgba(0,0,0,0.08)`,
        }}
      />
      <motion.div
        animate={loading ? { rotate: 360 } : { rotate: 0 }}
        transition={loading ? { repeat: Infinity, duration: 1.2, ease: "linear" } : { duration: 0.2 }}
        className="relative z-10"
      >
        {isCheckIn ? (
          <LogIn className="w-10 h-10 mb-3" />
        ) : (
          <LogOut className="w-10 h-10 mb-3" />
        )}
      </motion.div>

      <span className="relative z-10 text-[28px] font-semibold tracking-[-0.03em] leading-none">
        {loading ? (isCheckIn ? 'Checking In...' : 'Checking Out...') : (isCheckIn ? 'Check In' : 'Check Out')}
      </span>

      <span className="relative z-10 text-sm mt-3 opacity-80">
        {isCheckIn ? 'Start your session' : 'End today’s session'}
      </span>
    </motion.button>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [showAllLeaveRequests, setShowAllLeaveRequests] = useState(false);

  const [feedback, setFeedback] = useState({
    type: '',
    message: '',
  });

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        setAuthLoading(true);
        setAuthError('');
        const currentUser = await base44.auth.me();
        if (mounted) setUser(currentUser);
      } catch (error) {
        if (mounted) {
          setAuthError('Failed to load user profile. Please refresh the page.');
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!feedback.message) return;
    const timer = setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);

    return () => clearTimeout(timer);
  }, [feedback]);

  const {
    data: myAttendance = [],
    isLoading: attendanceLoading,
    isError: attendanceIsError,
    error: attendanceError,
  } = useQuery({
    queryKey: ['myAttendance', user?.email],
    queryFn: () =>
      base44.entities.Attendance.filter(
        { employee_email: user.email },
        '-date',
        60
      ),
    enabled: !!user?.email,
  });

  const {
    data: myLeaves = [],
    isLoading: leavesLoading,
    isError: leavesIsError,
    error: leavesError,
  } = useQuery({
    queryKey: ['myLeaves', user?.email],
    queryFn: () =>
      base44.entities.LeaveRequest.filter(
        { employee_email: user.email },
        '-created_date',
        20
      ),
    enabled: !!user?.email,
  });

  const todayAttendance = myAttendance.find((entry) => entry.date === today);

  const isCurrentlyActive =
    !!todayAttendance?.first_check_in && !todayAttendance?.last_check_out;

  const { elapsed, liveHours } = useRealTimeStats(
    todayAttendance?.first_check_in,
    todayAttendance?.last_check_out
  );

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const weeklyHours = useMemo(() => {
    const totalSeconds = myAttendance
      .filter((entry) => {
        if (!entry?.date) return false;
        const entryDate = new Date(entry.date);
        return isWithinInterval(entryDate, {
          start: weekStart,
          end: new Date(),
        });
      })
      .reduce((sum, entry) => sum + getSessionDurationSeconds(entry), 0);

    return formatHoursFromSeconds(totalSeconds);
  }, [myAttendance, weekStart]);

  const performanceChartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const day = subDays(new Date(), 6 - index);
      const dateKey = format(day, 'yyyy-MM-dd');
      const entry = myAttendance.find((item) => item.date === dateKey);
      const seconds = entry ? getSessionDurationSeconds(entry) : 0;

      return {
        day: format(day, 'EEE'),
        hours: Number((seconds / 3600).toFixed(1)),
      };
    });
  }, [myAttendance]);

  const presentDays = myAttendance.filter((entry) => entry.status === 'present').length;
  const lateDays = myAttendance.filter((entry) => entry.status === 'late').length;
  const pendingLeaves = myLeaves.filter((entry) => entry.status === 'pending').length;

  const visibleLeaves = showAllLeaveRequests ? myLeaves : myLeaves.slice(0, 3);

  const clockInMutation = useMutation({
    mutationFn: async () => {
      if (todayAttendance?.first_check_in) {
        throw new Error('You have already checked in today.');
      }

      return base44.entities.Attendance.create({
        employee_id: user.id,
        employee_email: user.email,
        employee_name: user.full_name,
        date: today,
        first_check_in: new Date().toISOString(),
        status: 'present',
        has_active_session: true,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
      setFeedback({
        type: 'success',
        message: 'Checked in successfully.',
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: error?.message || 'Check-in failed. Please try again.',
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!todayAttendance?.id) {
        throw new Error('No active attendance record found for today.');
      }

      if (todayAttendance?.last_check_out) {
        throw new Error('You have already checked out today.');
      }

      return base44.entities.Attendance.update(todayAttendance.id, {
        last_check_out: new Date().toISOString(),
        has_active_session: false,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
      setShowCheckoutConfirm(false);
      setFeedback({
        type: 'success',
        message: 'Checked out successfully.',
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: error?.message || 'Check-out failed. Please try again.',
      });
    },
  });

  const handleDownloadReport = () => {
    if (!myAttendance.length) {
      setFeedback({
        type: 'error',
        message: 'No attendance data available to download.',
      });
      return;
    }

    const rows = [
      ['Date', 'Status', 'First Check-In', 'Last Check-Out', 'Session Duration'],
      ...myAttendance.map((entry) => [
        entry.date || '--',
        entry.status || '--',
        formatDateTime(entry.first_check_in),
        entry.last_check_out
          ? formatDateTime(entry.last_check_out)
          : entry.first_check_in && !entry.last_check_out
          ? 'Active'
          : '--',
        formatHoursFromSeconds(getSessionDurationSeconds(entry)),
      ]),
    ];

    downloadCsv(`attendance-report-${today}.csv`, rows);

    setFeedback({
      type: 'success',
      message: 'Attendance report downloaded successfully.',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: THEME.bg }}>
        <div className="text-center">
          <div
            className="w-10 h-10 mx-auto rounded-full border-2 animate-spin mb-4"
            style={{ borderColor: `${THEME.border} ${THEME.border} ${THEME.accent} ${THEME.border}` }}
          />
          <p className="text-sm" style={{ color: THEME.muted }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (authError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: THEME.bg }}>
        <SectionCard className="w-full max-w-md p-6 ">
          <div className="flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,107,107,0.08)", border: `1px solid ${THEME.border}` }}
            >
              <AlertCircle className="w-5 h-5" style={{ color: THEME.danger }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: THEME.text }}>
                Unable to Load Dashboard
              </h2>
              <p className="text-sm" style={{ color: THEME.muted }}>
                {authError || 'User session not found.'}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ background: THEME.bg, color: THEME.text }}>
      <div className="max-w-7xl mx-auto space-y-6 ">

        {feedback.message && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm font-medium "
            style={{
              borderColor: feedback.type === 'success' ? `${THEME.accent}33` : `rgba(255,107,107,0.2)`,
              background: feedback.type === 'success' ? `rgba(163,211,18,0.08)` : `rgba(255,107,107,0.08)`,
              color: feedback.type === 'success' ? THEME.accentSoft : THEME.danger,
            }}
          >
            <div className="flex items-center gap-2 ">
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{feedback.message}</span>
            </div>
          </div>
        )}

        {(attendanceIsError || leavesIsError) && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: `rgba(255,107,107,0.2)`,
              background: `rgba(255,107,107,0.08)`,
              color: THEME.danger,
            }}
          >
            {attendanceIsError && (
              <div className="mb-1">
                Attendance load failed: {attendanceError?.message || 'Unknown error'}
              </div>
            )}
            {leavesIsError && (
              <div>
                Leave requests load failed: {leavesError?.message || 'Unknown error'}
              </div>
            )}
          </div>
        )}

        {/* Minimal Header */}
        <SectionCard className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                className="h-12 w-12"
                style={{
                  border: `1px solid ${THEME.border}`,
                  background: THEME.surface2,
                }}
              >
                <AvatarFallback
                  className="text-xl font-semibold"
                  style={{ color: THEME.accent, background: THEME.surface2 }}
                >
                  {user.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="leading-tight space-y-1">
                <h1
                  className="text-[18px] md:text-[20px] font-semibold tracking-[-0.02em]"
                  style={{ color: THEME.text }}
                >
                  Welcome back, <span style={{ color: THEME.accent }}>{user.full_name?.split(" ")[0]}</span>
                </h1>
                <p className="text-[13px] md:text-[14px]" style={{ color: THEME.muted }}>
                  Track your session & attendance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-[16px] text-sm"
                style={{ border: `1px solid ${THEME.border}`, background: THEME.surface2, color: THEME.text }}
              >
                <CalendarDays className="w-4 h-4" style={{ color: THEME.accent }} />
                {format(new Date(), "MMM d")}
              </div>

              <div
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-[16px] text-sm"
                style={{ border: `1px solid ${THEME.border}`, background: THEME.surface2, color: THEME.text }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: isCurrentlyActive ? THEME.accent : THEME.muted2 }}
                />
                {isCurrentlyActive ? "Active" : "Offline"}
              </div>

              <div
                className="p-2.5 rounded-[16px]"
                style={{ border: `1px solid ${THEME.border}`, background: THEME.surface2 }}
              >
                <NotificationBell userEmail={user.email} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-6 items-start">
          {/* Left */}
          <div className="flex flex-col items-center justify-start gap-6 pt-2">
            <AnimatePresence mode="wait">
              {!todayAttendance?.first_check_in ? (
                <SessionActionButton
                  key="checkin"
                  type="checkin"
                  loading={clockInMutation.isPending}
                  onClick={() => clockInMutation.mutate()}
                />
              ) : todayAttendance?.last_check_out ? (
                <motion.div
                  initial={{ scale: 0.94, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative rounded-full flex flex-col items-center justify-center overflow-hidden"
                  style={{
                    width: 190,
                    height: 190,
                    border: `1px solid ${THEME.border}`,
                    background: THEME.surface,
                    color: THEME.text,
                  }}
                >
                  <CheckCircle2 className="w-10 h-10 mb-3" style={{ color: THEME.accent }} />
                  <span className="text-xl font-semibold tracking-[-0.02em]">Day Closed</span>
                  <span className="text-xs mt-2" style={{ color: THEME.muted }}>
                    Session completed
                  </span>
                </motion.div>
              ) : (
                <SessionActionButton
                  key="checkout"
                  type="checkout"
                  loading={clockOutMutation.isPending}
                  onClick={() => setShowCheckoutConfirm(true)}
                />
              )}
            </AnimatePresence>

            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: THEME.muted2 }}>
                Session Timer
              </p>
              <p className="text-3xl md:text-4xl font-semibold tracking-[-0.03em]" style={{ color: THEME.text }}>
                {elapsed}
              </p>
            </div>
          </div>

          {/* Right */}
          <SectionCard className="p-6 md:p-7">
            <div className="space-y-6">
              <div>
                <p className="text-sm mb-3" style={{ color: THEME.muted }}>
                  Today’s Hours
                </p>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <h2
                    className="text-5xl md:text-6xl font-semibold leading-none tracking-[-0.05em]"
                    style={{ color: THEME.text }}
                  >
                    {liveHours}
                  </h2>

                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border w-fit"
                    style={{
                      background: isCurrentlyActive ? `rgba(163,211,18,0.08)` : THEME.surface2,
                      color: isCurrentlyActive ? THEME.accentSoft : THEME.text,
                      borderColor: isCurrentlyActive ? `${THEME.accent}33` : THEME.border,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: isCurrentlyActive ? THEME.accent : THEME.muted2 }}
                    />
                    {isCurrentlyActive ? 'Session Active' : 'Currently Offline'}
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: THEME.border }} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricMiniCard
                  label="First Check-In"
                  value={formatDateTime(todayAttendance?.first_check_in)}
                  icon={LogIn}
                />
                <MetricMiniCard
                  label="Last Check-Out"
                  value={isCurrentlyActive ? 'Active' : formatDateTime(todayAttendance?.last_check_out)}
                  icon={LogOut}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: 'Present Days',
              value: presentDays,
              icon: CheckCircle2,
            },
            {
              label: 'Late Days',
              value: lateDays,
              icon: Clock,
            },
            {
              label: 'Pending Leaves',
              value: pendingLeaves,
              icon: FileText,
            },
            {
              label: 'Weekly Hours',
              value: weeklyHours,
              icon: Activity,
            },
          ].map((item, index) => (
            <SectionCard key={index} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="text-[11px] uppercase tracking-[0.18em] mb-2"
                    style={{ color: THEME.muted }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-2xl md:text-3xl font-semibold tracking-[-0.03em]"
                    style={{ color: THEME.text }}
                  >
                    {item.value}
                  </p>
                </div>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: THEME.surface2,
                    border: `1px solid ${THEME.border}`,
                  }}
                >
                  <item.icon className="w-4 h-4" style={{ color: THEME.accent }} />
                </div>
              </div>
            </SectionCard>
          ))}
        </div>

        {/* Performance */}
        <SectionCard className="p-6 md:p-7">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" style={{ color: THEME.accent }} />
              <h2 className="text-xl font-semibold tracking-[-0.02em]" style={{ color: THEME.text }}>
                Employee Performance
              </h2>
            </div>
            <p className="text-sm" style={{ color: THEME.muted }}>
              Last 7 days working hour trend based on attendance records.
            </p>
          </div>

          <div className="h-[320px]">
            {performanceChartData.every((item) => item.hours === 0) ? (
              <div
                className="h-full rounded-[22px] flex items-center justify-center text-sm"
                style={{
                  border: `1px solid ${THEME.border}`,
                  background: THEME.surface2,
                  color: THEME.muted,
                }}
              >
                No working hour data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={performanceChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="hoursFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME.accent} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={THEME.accent} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.borderSoft} />
                  <XAxis dataKey="day" stroke={THEME.muted} tickLine={false} axisLine={false} />
                  <YAxis stroke={THEME.muted} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: THEME.surface,
                      border: `1px solid ${THEME.border}`,
                      borderRadius: 16,
                      color: THEME.text,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke={THEME.accent}
                    strokeWidth={3}
                    fill="url(#hoursFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        {/* Leave Requests */}
        <SectionCard className="p-6 md:p-7">
          <div className="flex items-center justify-between mb-5 gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em]" style={{ color: THEME.text }}>
                Recent Leave Requests
              </h2>
              <p className="text-sm" style={{ color: THEME.muted }}>
                Track your latest leave activity
              </p>
            </div>

            <Button
              variant="link"
              onClick={() => setShowAllLeaveRequests((prev) => !prev)}
              className="p-0 h-auto font-medium"
              style={{ color: THEME.accent }}
            >
              {showAllLeaveRequests ? 'Show Less' : 'View All'}
            </Button>
          </div>

          {leavesLoading ? (
            <div
              className="rounded-[22px] p-5 text-sm"
              style={{
                border: `1px solid ${THEME.border}`,
                background: THEME.surface2,
                color: THEME.muted,
              }}
            >
              Loading leave activity...
            </div>
          ) : visibleLeaves.length === 0 ? (
            <div
              className="rounded-[22px] p-5 text-sm"
              style={{
                border: `1px solid ${THEME.border}`,
                background: THEME.surface2,
                color: THEME.muted,
              }}
            >
              No leave requests yet.
            </div>
          ) : (
            <LeaveRequestList requests={visibleLeaves} />
          )}
        </SectionCard>

        <LeaveRequestForm
          open={showLeaveForm}
          onClose={() => setShowLeaveForm(false)}
        />

        <AlertDialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
          <AlertDialogContent
            className="rounded-3xl"
            style={{
              border: `1px solid ${THEME.border}`,
              background: THEME.surface,
              color: THEME.text,
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: THEME.text }}>
                Confirm Check Out
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: THEME.muted }}>
                This will end your active session for today.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel
                className="rounded-xl border border-lime-400/15"
                style={{ background: THEME.surface2, color: THEME.text }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clockOutMutation.mutate()}
                className="rounded-xl"
                style={{ background: THEME.accent, color: THEME.accentTextDark }}
              >
                Confirm Check Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={showAttendanceHistory}
          onOpenChange={setShowAttendanceHistory}
        >
          <AlertDialogContent
            className="max-w-3xl rounded-3xl"
            style={{
              border: `1px solid ${THEME.border}`,
              background: THEME.surface,
              color: THEME.text,
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: THEME.text }}>
                Attendance History
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: THEME.muted }}>
                Your recent attendance records
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
              {attendanceLoading ? (
                <div
                  className="rounded-[22px] p-4 text-sm"
                  style={{
                    border: `1px solid ${THEME.border}`,
                    background: THEME.surface2,
                    color: THEME.muted,
                  }}
                >
                  Loading attendance history...
                </div>
              ) : myAttendance.length === 0 ? (
                <div
                  className="rounded-[22px] p-4 text-sm"
                  style={{
                    border: `1px solid ${THEME.border}`,
                    background: THEME.surface2,
                    color: THEME.muted,
                  }}
                >
                  No attendance history found.
                </div>
              ) : (
                myAttendance.slice(0, 15).map((entry) => {
                  const active = !!entry.first_check_in && !entry.last_check_out;

                  return (
                    <div
                      key={entry.id}
                      className="rounded-[22px] p-4"
                      style={{
                        border: `1px solid ${THEME.border}`,
                        background: THEME.surface2,
                      }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-medium" style={{ color: THEME.text }}>
                            {format(new Date(entry.date), 'dd MMM yyyy')}
                          </p>
                          <p className="text-sm" style={{ color: THEME.muted }}>
                            Status: {entry.status || 'N/A'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:flex md:items-center gap-4 text-sm">
                          <div>
                            <p style={{ color: THEME.muted }}>In</p>
                            <p style={{ color: THEME.text }}>{formatDateTime(entry.first_check_in)}</p>
                          </div>

                          <div>
                            <p style={{ color: THEME.muted }}>Out</p>
                            <p style={{ color: THEME.text }}>
                              {active ? 'Active' : formatDateTime(entry.last_check_out)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                className="rounded-xl border border-lime-400/15"
                style={{ background: THEME.surface2, color: THEME.text }}
              >
                Close
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}