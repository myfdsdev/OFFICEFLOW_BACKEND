import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, CalendarDays } from "lucide-react";

const intensityClass = {
  0: "bg-gray-100",
  1: "bg-indigo-100",
  2: "bg-indigo-200",
  3: "bg-indigo-400",
  4: "bg-indigo-600",
};

export default function AttendanceChart({ trend = [], heatmap = [] }) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Attendance Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                formatter={(value, name) => [
                  name === "attendanceRate" ? `${value}%` : value,
                  name === "attendanceRate" ? "Attendance" : name,
                ]}
                contentStyle={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="attendanceRate"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: "#6366f1" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">Last 30 Days</p>
          </div>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(18px, 1fr))" }}
          >
            {heatmap.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.hours}h (${day.status})`}
                className={`aspect-square rounded-md ${intensityClass[day.intensity] || "bg-gray-100"}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
