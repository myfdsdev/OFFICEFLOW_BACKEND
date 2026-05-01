import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  FileSpreadsheet,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wifi,
} from "lucide-react";
import { motion } from "framer-motion";

import StatsCard from "../components/attendance/StatsCard";
import EmployeeList from "../components/admin/EmployeeList";
import AttendanceReportTable from "../components/admin/AttendanceReportTable";
import LeaveRequestList from "../components/leave/LeaveRequestList";
import InviteUserDialog from "../components/admin/InviteUserDialog";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const { data: allAttendance = [] } = useQuery({
    queryKey: ["allAttendance", dateRange],
    queryFn: () =>
      base44.entities.Attendance.filter(
        { date: { $gte: dateRange.start, $lte: dateRange.end } },
        "-date"
      ),
    enabled: !!user,
  });

  const { data: todayAttendance = [] } = useQuery({
    queryKey: ["todayAttendance"],
    queryFn: () => base44.entities.Attendance.filter({ date: today }),
    enabled: !!user,
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ["leaveRequests"],
    queryFn: () => base44.entities.LeaveRequest.list("-createdAt"),
    enabled: !!user,
  });

  const editAttendanceMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can edit attendance");
      }

      let workHours = null;
      if (data.clock_in && data.clock_out) {
        const [inH, inM] = data.clock_in.split(":");
        const [outH, outM] = data.clock_out.split(":");
        const clockInMinutes = parseInt(inH) * 60 + parseInt(inM);
        const clockOutMinutes = parseInt(outH) * 60 + parseInt(outM);
        workHours = Math.max(0, (clockOutMinutes - clockInMinutes) / 60);
      }
      return base44.entities.Attendance.update(id, {
        ...data,
        work_hours: workHours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["todayAttendance"] });
      alert("Attendance updated successfully");
    },
    onError: (error) => {
      alert(error?.error || error?.message || "Failed to update attendance");
    },
  });

  // Backend handles attendance creation + notifications — we just update status
  const approveLeave = useMutation({
    mutationFn: async (request) => {
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can approve leave requests");
      }
      return base44.entities.LeaveRequest.update(request.id, {
        status: "approved",
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["allAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["todayAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["myAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      alert("Leave approved");
    },
    onError: (error) => {
      alert(error?.error || error?.message || "Failed to approve leave");
    },
  });

  const rejectLeave = useMutation({
    mutationFn: async (request) => {
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can reject leave requests");
      }
      return base44.entities.LeaveRequest.update(request.id, {
        status: "rejected",
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] });
      alert("Leave rejected");
    },
    onError: (error) => {
      alert(error?.error || error?.message || "Failed to reject leave");
    },
  });

  // ================================
  // STATS CALCULATIONS (fixed -1 bug)
  // ================================
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeTodayAttendance = Array.isArray(todayAttendance) ? todayAttendance : [];
  const safeLeaveRequests = Array.isArray(leaveRequests) ? leaveRequests : [];

  // Only count non-admin employees
  const nonAdminEmployees = safeEmployees.filter((e) => e && e.role === "user");
  const totalEmployees = nonAdminEmployees.length;
  const onlineUsers = nonAdminEmployees.filter((e) => e.is_online).length;
  const offlineUsers = Math.max(0, totalEmployees - onlineUsers);

  // Only count attendance of non-admin employees
  const nonAdminEmails = nonAdminEmployees.map((e) => e.email);
  const employeeAttendance = safeTodayAttendance.filter((a) =>
    nonAdminEmails.includes(a.employee_email)
  );

  const presentToday = employeeAttendance.filter((a) => a.status === "present").length;
  const lateToday = employeeAttendance.filter((a) => a.status === "late").length;
  const halfDayToday = employeeAttendance.filter((a) => a.status === "half_day").length;
  const onLeaveToday = employeeAttendance.filter((a) => a.status === "on_leave").length;
  const absentToday = Math.max(
    0,
    totalEmployees - (presentToday + lateToday + halfDayToday + onLeaveToday)
  );

  const pendingLeaves = safeLeaveRequests.filter((l) => l && l.status === "pending").length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            Only administrators can access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Comprehensive attendance and leave management
          </p>
        </motion.div>

        {/* Today's Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Total Employees"
            value={totalEmployees}
            icon={Users}
            color="indigo"
            delay={0.1}
          />
          <StatsCard
            title="Online Now"
            value={onlineUsers}
            subtitle={`${offlineUsers} offline`}
            icon={Wifi}
            color="green"
            delay={0.15}
          />
          <StatsCard
            title="Present"
            value={presentToday}
            icon={CheckCircle2}
            color="emerald"
            delay={0.2}
          />
          <StatsCard
            title="Late"
            value={lateToday}
            icon={Clock}
            color="amber"
            delay={0.3}
          />
          <StatsCard
            title="Half Day"
            value={halfDayToday}
            icon={Clock}
            color="blue"
            delay={0.4}
          />
          <StatsCard
            title="Absent"
            value={absentToday}
            icon={AlertCircle}
            color="rose"
            delay={0.5}
          />
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="bg-white shadow-sm border p-1 rounded-xl">
            <TabsTrigger
              value="employees"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 rounded-lg px-4"
            >
              <Users className="w-4 h-4 mr-2" />
              Employees
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 rounded-lg px-4"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 rounded-lg px-4"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Leaves
              {pendingLeaves > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingLeaves}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                {totalEmployees} team member{totalEmployees !== 1 ? "s" : ""} •{" "}
                {onlineUsers} online
              </p>
              <Button
                onClick={() => setInviteDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Invite Team Member
              </Button>
            </div>
            <EmployeeList
              employees={safeEmployees}
              todayAttendance={safeTodayAttendance}
            />
          </TabsContent>

          <TabsContent value="attendance">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">From:</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">To:</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="w-40"
                />
              </div>
            </div>
            <AttendanceReportTable
              attendance={allAttendance}
              onEdit={(id, data) => editAttendanceMutation.mutate({ id, data })}
              isEditing={editAttendanceMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="leaves">
            <LeaveRequestList
              requests={leaveRequests}
              isAdmin={true}
              onApprove={(request) => approveLeave.mutate(request)}
              onReject={(request) => rejectLeave.mutate(request)}
            />
          </TabsContent>
        </Tabs>

        {/* Invite User Dialog */}
        <InviteUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      </div>
    </div>
  );
}