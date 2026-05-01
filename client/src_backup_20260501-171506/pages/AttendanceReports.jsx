import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileSpreadsheet, Calendar, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function AttendanceReports() {
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    base44.auth.me().then((userData) => {
      setUser(userData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  // Strategy: fetch all attendance for current 12 months once,
  // then filter client-side. Avoids date-format edge cases.
  const { data: allAttendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['allMonthlyAttendance'],
    queryFn: async () => {
      try {
        const records = await base44.entities.Attendance.list('-date', 5000);
        return records || [];
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
        return [];
      }
    },
    enabled: !!user && user.role === 'admin',
  });

  // Filter by month CLIENT-SIDE
  const attendance = allAttendance.filter(a => 
    a.date && a.date.startsWith(selectedMonth)
  );

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

  const calculateEmployeeStats = (employeeEmail) => {
    const employeeAttendance = attendance.filter(a => a.employee_email === employeeEmail);
    const presentCount = employeeAttendance.filter(a => a.status === 'present').length;
    const lateCount = employeeAttendance.filter(a => a.status === 'late').length;
    const halfDayCount = employeeAttendance.filter(a => a.status === 'half_day').length;
    const leaveCount = employeeAttendance.filter(a => a.status === 'on_leave').length;
    const totalDays = employeeAttendance.length;
    const totalHours = employeeAttendance.reduce((sum, a) => sum + (a.work_hours || 0), 0);
    const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : '0';
    
    // Attendance % counts present + late + half_day as "showed up"
    const attendedDays = presentCount + lateCount + halfDayCount;
    const attendancePercentage = totalDays > 0 
      ? ((attendedDays / totalDays) * 100).toFixed(1) 
      : '0';

    return {
      presentCount,
      lateCount,
      halfDayCount,
      leaveCount,
      totalDays,
      totalHours: totalHours.toFixed(1),
      avgHours,
      attendancePercentage,
    };
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportAttendanceReport', {
        month: selectedMonth,
        format: 'pdf',
      });
      
      // Handle both blob and data wrapper responses
      const blobData = response instanceof Blob ? response : (response?.data || response);
      const blob = new Blob([blobData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${selectedMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('PDF exported');
    } catch (error) {
      console.error('Export PDF failed:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportAttendanceReport', {
        month: selectedMonth,
        format: 'excel',
      });
      
      const blobData = response instanceof Blob ? response : (response?.data || response);
      const blob = new Blob([blobData], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Excel exported');
    } catch (error) {
      console.error('Export Excel failed:', error);
      toast.error('Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">Only administrators can access attendance reports.</p>
        </div>
      </div>
    );
  }

  const employeeUsers = employees.filter(e => e.role === 'user');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Attendance Reports
          </h1>
          <p className="text-gray-500 mt-1">View and export monthly attendance reports</p>
        </motion.div>

        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={exporting || attendance.length === 0}
                  className="gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={exporting || attendance.length === 0}
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Employee Attendance Summary</span>
              <span className="text-sm font-normal text-gray-500">
                {attendance.length} record{attendance.length !== 1 ? 's' : ''} this month
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAttendance ? (
              <div className="text-center py-12 text-gray-400">Loading attendance...</div>
            ) : employeeUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No employees found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">Half Day</TableHead>
                      <TableHead className="text-center">Leave</TableHead>
                      <TableHead className="text-center">Total Days</TableHead>
                      <TableHead className="text-center">Total Hours</TableHead>
                      <TableHead className="text-center">Avg Hours</TableHead>
                      <TableHead className="text-center">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeUsers.map((employee) => {
                      const stats = calculateEmployeeStats(employee.email);
                      const percentage = parseFloat(stats.attendancePercentage);
                      const percentageColor = 
                        percentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
                        percentage >= 75 ? 'bg-amber-100 text-amber-700' :
                        percentage > 0 ? 'bg-rose-100 text-rose-700' :
                        'bg-gray-100 text-gray-500';

                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{employee.full_name}</p>
                              <p className="text-xs text-gray-500">{employee.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{stats.presentCount}</TableCell>
                          <TableCell className="text-center">{stats.lateCount}</TableCell>
                          <TableCell className="text-center">{stats.halfDayCount}</TableCell>
                          <TableCell className="text-center">{stats.leaveCount}</TableCell>
                          <TableCell className="text-center font-medium">{stats.totalDays}</TableCell>
                          <TableCell className="text-center">{stats.totalHours}h</TableCell>
                          <TableCell className="text-center">{stats.avgHours}h</TableCell>
                          <TableCell className="text-center">
                            <Badge className={percentageColor}>
                              {stats.attendancePercentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}