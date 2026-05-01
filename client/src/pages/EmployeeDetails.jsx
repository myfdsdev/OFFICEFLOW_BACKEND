import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Shield,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import StatsCard from '../components/attendance/StatsCard';
import AttendanceHistory from '../components/attendance/AttendanceHistory';
import LeaveRequestList from '../components/leave/LeaveRequestList';
import ManageUserCard from '../components/admin/ManageUserCard';

function EmployeePerformanceRadar({ metrics }) {
  const size = 320;
  const center = size / 2;
  const maxRadius = 115;
  const levels = [25, 50, 75, 100];

  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
    const radius = (value / 100) * maxRadius;

    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const getLevelPoints = (level) =>
    metrics
      .map((_, index) => {
        const point = getPoint(index, level);
        return `${point.x},${point.y}`;
      })
      .join(" ");

  const performancePoints = metrics
    .map((item, index) => {
      const point = getPoint(index, item.value);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Employee Performance
            </h2>
            <p className="text-sm text-gray-500">
              Monthly radar performance overview
            </p>
          </div>

          <div className="p-2 rounded-lg bg-indigo-50">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <div className="w-full flex justify-center">
          <svg
            width="100%"
            height="340"
            viewBox={`0 0 ${size} ${size + 20}`}
            className="max-w-[420px]"
          >
            {levels.map((level) => (
              <polygon
                key={level}
                points={getLevelPoints(level)}
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1"
              />
            ))}

            {metrics.map((_, index) => {
              const point = getPoint(index, 100);

              return (
                <line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={point.x}
                  y2={point.y}
                  stroke="#d1d5db"
                  strokeWidth="1"
                />
              );
            })}

            <polygon
              points={performancePoints}
              fill="rgba(99, 102, 241, 0.45)"
              stroke="#a3e635"
              strokeWidth="3"
            />

            {metrics.map((item, index) => {
              const point = getPoint(index, item.value);
              const labelPoint = getPoint(index, 116);

              return (
                <g key={item.label}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#a3e635"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  <text
                    x={labelPoint.x}
                    y={labelPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-gray-600 text-[12px] font-medium"
                  >
                    {item.label}
                  </text>

                  <text
                    x={point.x}
                    y={point.y - 10}
                    textAnchor="middle"
                    className="fill-gray-900 text-[10px] font-bold"
                  >
                    {Math.round(item.value)}%
                  </text>
                </g>
              );
            })}

            <text
              x={center}
              y={center + 5}
              textAnchor="middle"
              className="fill-gray-400 text-[11px]"
            >
              Score
            </text>
          </svg>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {metrics.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-100 bg-gray-50 p-3"
            >
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-bold text-gray-900">
                {Math.round(item.value)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployeeDetails() {
  const [currentUser, setCurrentUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const employeeId = urlParams.get('id');

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: employeeId });
      return users[0];
    },
    enabled: !!employeeId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['employeeAttendance', employee?.email],
    queryFn: () =>
      base44.entities.Attendance.filter(
        { employee_email: employee.email },
        '-date',
        30
      ),
    enabled: !!employee?.email,
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['employeeLeaves', employee?.email],
    queryFn: () =>
      base44.entities.LeaveRequest.filter(
        { employee_email: employee.email },
        '-created_date',
        10
      ),
    enabled: !!employee?.email,
  });

  const getInitials = (name) => {
    if (!name) return "?";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const thisMonthAttendance = attendance.filter((a) =>
    a.date.startsWith(format(new Date(), 'yyyy-MM'))
  );

  const presentDays = thisMonthAttendance.filter(
    (a) => a.status === 'present'
  ).length;

  const lateDays = thisMonthAttendance.filter(
    (a) => a.status === 'late'
  ).length;

  const absentDays = thisMonthAttendance.filter(
    (a) => a.status === 'absent'
  ).length;

  const totalHours = thisMonthAttendance.reduce(
    (sum, a) => sum + (a.total_work_hours || a.work_hours || 0),
    0
  );

  const approvedLeaves = leaveRequests.filter(
    (l) => l.status === 'approved'
  ).length;

  const totalRecords = thisMonthAttendance.length;

  const presentScore = Math.min((presentDays / 26) * 100, 100);
  const hoursScore = Math.min((totalHours / 180) * 100, 100);
  const punctualityScore = Math.max(100 - lateDays * 10, 0);
  const leaveScore = Math.max(100 - approvedLeaves * 10, 0);
  const consistencyScore =
    totalRecords > 0 ? Math.min((presentDays / totalRecords) * 100, 100) : 0;

  const overallScore = Math.round(
    (presentScore +
      hoursScore +
      punctualityScore +
      leaveScore +
      consistencyScore) /
      5
  );

  const performanceMetrics = [
    { label: "Present", value: presentScore },
    { label: "Hours", value: hoursScore },
    { label: "Punctuality", value: punctualityScore },
    { label: "Leaves", value: leaveScore },
    { label: "Consistency", value: consistencyScore },
    { label: "Overall", value: overallScore },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-lime-100/35">Loading...</div>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-lime-100/50 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loadingEmployee || !employee) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-lime-100/35">Loading employee data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("AdminDashboard")}>
            <Button variant="ghost" className="mb-4 text-lime-100/65 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <Card className="border border-lime-400/15 bg-black">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-24 h-24 bg-lime-400/15 text-lime-300">
                  {employee.profile_photo ? (
                    <AvatarImage
                      src={employee.profile_photo}
                      alt={employee.full_name}
                    />
                  ) : (
                    <AvatarFallback className="bg-lime-400/15 text-lime-300 text-2xl font-semibold">
                      {getInitials(employee.full_name)}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {employee.full_name}
                  </h1>
                  <p className="text-lime-100/50 flex items-center justify-center md:justify-start gap-2 mt-2">
                    <Mail className="w-4 h-4" />
                    {employee.email}
                  </p>

                  {employee.department && (
                    <p className="text-lime-100/50 text-sm mt-1">{employee.department} • {employee.employee_id}</p>
                  )}

                  <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                    {employee.role === 'admin' ? (
                      <span className="inline-flex items-center px-3 py-1 bg-lime-400/10 text-lime-300 rounded-full text-sm font-medium">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-[#061006]/80 text-lime-100/65 rounded-full text-sm font-medium">
                        <User className="w-3 h-3 mr-1" />
                        Employee
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Present Days"
            value={presentDays}
            subtitle="This month"
            icon={CheckCircle2}
            color="green"
            delay={0.1}
          />

          <StatsCard
            title="Total Hours"
            value={totalHours.toFixed(1)}
            subtitle="This month"
            icon={Clock}
            color="indigo"
            delay={0.2}
          />

          <StatsCard
            title="Absent Days"
            value={absentDays}
            subtitle="This month"
            icon={XCircle}
            color="rose"
            delay={0.3}
          />

          <StatsCard
            title="Approved Leaves"
            value={approvedLeaves}
            subtitle="All time"
            icon={Calendar}
            color="blue"
            delay={0.4}
          />
        </div>

        <div className="mb-6">
          <ManageUserCard employee={employee} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <AttendanceHistory attendance={attendance} />
          <LeaveRequestList requests={leaveRequests} />
        </div>
      </div>
    </div>
  );
}