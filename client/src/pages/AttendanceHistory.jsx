import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths, lastDayOfMonth } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Filter } from "lucide-react";
import { motion } from "framer-motion";

import AttendanceHistory from '../components/attendance/AttendanceHistory';
import StatsCard from '../components/attendance/StatsCard';

export default function AttendanceHistoryPage() {
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    base44.auth.me().then((u) => {
      console.log('[AttendanceHistory] Current user:', u);
      setUser(u);
    }).catch(() => setUser(null));
  }, []);

  // STRATEGY: Try simple email-only filter first, then filter dates client-side
  // This is more robust against date-format issues
  const { data: allAttendance = [], isLoading } = useQuery({
    queryKey: ['myFullAttendance', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      console.log('[AttendanceHistory] Fetching for:', user.email);
      
      try {
        // Get ALL attendance for this user (no date filter at backend)
        const records = await base44.entities.Attendance.filter({
          employee_email: user.email,
        }, '-date', 1000);
        
        console.log('[AttendanceHistory] Got records:', records?.length, records);
        return records || [];
      } catch (error) {
        console.error('[AttendanceHistory] Failed:', error);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  // Filter by month CLIENT-SIDE (avoids date format issues)
  const monthAttendance = allAttendance.filter(a => {
    if (!a.date) return false;
    // a.date is "YYYY-MM-DD" — check if it starts with selected month
    return a.date.startsWith(selectedMonth);
  });

  // Filter by status
  const filteredAttendance = statusFilter === 'all' 
    ? monthAttendance 
    : monthAttendance.filter(a => a.status === statusFilter);

  // Stats — uses correct backend field name 'work_hours'
  const presentDays = monthAttendance.filter(a => 
    a.status === 'present' || a.status === 'late' || a.status === 'half_day'
  ).length;
  const totalHours = monthAttendance.reduce((sum, a) => sum + (a.work_hours || 0), 0);
  const avgHours = presentDays > 0 ? (totalHours / presentDays).toFixed(1) : '0';

  console.log('[AttendanceHistory] Stats:', { 
    selectedMonth, 
    totalRecords: allAttendance.length, 
    monthRecords: monthAttendance.length,
    presentDays,
    totalHours
  });

  const generateMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
      });
    }
    return options;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            My Attendance History
          </h1>
          <p className="text-gray-500 mt-1">View your complete attendance records</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Present"
            value={presentDays}
            subtitle="This month"
            icon={Calendar}
            color="green"
            delay={0.1}
          />
          <StatsCard
            title="Total Hours"
            value={totalHours.toFixed(1)}
            icon={Clock}
            color="indigo"
            delay={0.2}
          />
          <StatsCard
            title="Avg. Hours"
            value={avgHours}
            subtitle="Per day"
            icon={Clock}
            color="blue"
            delay={0.3}
          />
        </div>

        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonthOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="animate-pulse text-gray-400">Loading attendance...</div>
            </CardContent>
          </Card>
        ) : allAttendance.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No attendance records yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your attendance history will appear here after you check in.
              </p>
            </CardContent>
          </Card>
        ) : monthAttendance.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No records for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Try selecting a different month — you have {allAttendance.length} record(s) total.
              </p>
            </CardContent>
          </Card>
        ) : (
          <AttendanceHistory attendance={filteredAttendance} />
        )}
      </div>
    </div>
  );
}