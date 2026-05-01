import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Crown, TrendingUp } from "lucide-react";
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
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-orange-500" />;
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Monthly Leaderboard
              </h1>
              <p className="text-gray-500 mt-1">{currentMonth}</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-400 shadow-sm">
            Loading leaderboard...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-white p-8 text-center text-rose-500 shadow-sm">
            {error}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {leaders.map((employee) => (
                  <div
                    key={employee.id || employee.email}
                    className="flex items-center gap-3 px-4 py-4 md:px-6"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                      {rankIcon(employee.rank)}
                    </div>
                    <Avatar className="h-11 w-11">
                      {employee.profile_photo ? (
                        <AvatarImage src={employee.profile_photo} alt={employee.full_name} />
                      ) : (
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                          {getInitials(employee.full_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">
                        {employee.full_name}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {employee.department || employee.email}
                      </p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {Number(employee.monthly_points || 0).toLocaleString()} pts
                    </Badge>
                  </div>
                ))}
              </div>
              {leaders.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  No leaderboard data yet.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
