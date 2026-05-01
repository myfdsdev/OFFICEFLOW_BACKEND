import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StatsCard from "@/components/attendance/StatsCard";
import HoursChart from "@/components/charts/HoursChart";
import StatusPieChart from "@/components/charts/StatusPieChart";
import AttendanceChart from "@/components/charts/AttendanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Gauge,
  Target,
  TrendingUp,
  Umbrella,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

const insightText = (analytics) => {
  const diff = analytics?.insights?.weeklyDifference || 0;
  const direction = diff >= 0 ? "more" : "less";
  return [
    `You worked ${Math.abs(diff)}h ${direction} than last week`,
    `Average check-in time: ${analytics?.insights?.averageCheckInTime || "N/A"}`,
    `Most productive day: ${analytics?.insights?.mostProductiveDay || "N/A"}`,
    `Longest streak: ${analytics?.insights?.longestStreak || 0} days perfect attendance`,
  ];
};

export default function MyStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["myAnalytics"],
    queryFn: () => base44.analytics.me(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-rose-500">
            Failed to load analytics.
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            My Working Info
          </h1>
          <p className="text-gray-500 mt-1">
            Hours, attendance quality, trends, and weekly insights
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard title="Month Hours" value={stats.totalHoursMonth || 0} subtitle={`${stats.totalHoursAllTime || 0} all time`} icon={Clock} color="indigo" />
          <StatsCard title="Attendance" value={`${stats.attendancePercentage || 0}%`} subtitle="This month" icon={CheckCircle2} color="green" />
          <StatsCard title="Overtime" value={`${stats.overtimeHours || 0}h`} subtitle="This month" icon={Target} color="blue" />
          <StatsCard title="Score" value={stats.performanceScore || 0} subtitle="Performance" icon={Gauge} color="amber" />
          <StatsCard title="Present" value={stats.presentDays || 0} subtitle="Days" icon={Calendar} color="green" />
          <StatsCard title="Late" value={stats.lateDays || 0} subtitle="Days" icon={Clock} color="amber" />
          <StatsCard title="Absent" value={stats.absentDays || 0} subtitle="Days" icon={XCircle} color="rose" />
          <StatsCard title="Leaves" value={stats.totalLeavesTaken || 0} subtitle="Approved days" icon={Umbrella} color="blue" />
        </div>

        <Card className="border-0 shadow-sm bg-white mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Weekly Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-3">
              {insightText(data).map((insight) => (
                <div key={insight} className="rounded-xl bg-gray-50 p-4 text-sm font-medium text-gray-700">
                  {insight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <HoursChart data={charts.hoursPerDay || []} />
          <StatusPieChart data={charts.statusBreakdown || []} />
        </div>

        <AttendanceChart
          trend={charts.monthlyTrend || []}
          heatmap={charts.heatmap || []}
        />
      </div>
    </div>
  );
}
