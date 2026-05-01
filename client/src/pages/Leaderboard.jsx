import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Crown, TrendingUp, Users, Award } from "lucide-react";
import { motion } from "framer-motion";

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const rankIcon = (rank) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-indigo-600" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-500" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="w-5 text-center text-sm font-semibold text-gray-500">{rank}</span>;
};

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  useEffect(() => {
    base44.leaderboard
      .list({ month: currentMonth })
      .then(setData)
      .catch((err) => setError(err?.error || err?.message || "Unable to load leaderboard"))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const leaders = data?.leaderboard || [];

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Monthly Leaderboard
          </h1>
          <p className="text-gray-500 mt-1">
            Attendance points and achievement ranking for {currentMonth}
          </p>
        </motion.div>

        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="animate-pulse text-gray-400">Loading leaderboard...</div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center text-rose-500">
              {error}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-5 border-0 shadow-sm bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Top Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Number(leaders[0]?.monthly_points || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                    <Trophy className="w-5 h-5" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-0 shadow-sm bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{leaders.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-0 shadow-sm bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Your Rank</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.me?.rank ? `#${data.me.rank}` : "-"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="space-y-3">
                  {leaders.map((employee, index) => (
                    <motion.div
                      key={employee.id || employee.email}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                          {rankIcon(employee.rank)}
                        </div>
                        <Avatar className="h-12 w-12 bg-indigo-100 text-indigo-600">
                          {employee.profile_photo ? (
                            <AvatarImage src={employee.profile_photo} alt={employee.full_name} />
                          ) : (
                            <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                              {getInitials(employee.full_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {employee.full_name}
                          </p>
                          <p className="truncate text-sm text-gray-500">
                            {employee.department || employee.email}
                          </p>
                        </div>
                      </div>
                      <Badge className="shrink-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-50">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {Number(employee.monthly_points || 0).toLocaleString()} pts
                      </Badge>
                    </motion.div>
                  ))}
                </div>
                {leaders.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    No leaderboard data yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
