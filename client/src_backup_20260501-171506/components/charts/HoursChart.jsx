import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

export default function HoursChart({ data = [] }) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Hours Per Day
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                }}
                formatter={(value) => [`${value}h`, "Hours"]}
                labelFormatter={(label) => `Day ${label}`}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
