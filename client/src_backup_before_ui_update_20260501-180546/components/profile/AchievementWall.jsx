import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Award,
  Clock,
  Crown,
  Dumbbell,
  Flame,
  Handshake,
  Star,
  Target,
  Trophy,
} from "lucide-react";

const BADGE_META = {
  perfect_attendance: { label: "Perfect Attendance", icon: Trophy, color: "text-indigo-600 bg-indigo-50" },
  early_bird: { label: "Early Bird", icon: Clock, color: "text-blue-600 bg-blue-50" },
  streak_master: { label: "Streak Master", icon: Flame, color: "text-rose-600 bg-rose-50" },
  overtime_hero: { label: "Overtime Hero", icon: Dumbbell, color: "text-purple-600 bg-purple-50" },
  rising_star: { label: "Rising Star", icon: Star, color: "text-amber-600 bg-amber-50" },
  employee_of_the_month: { label: "Employee of the Month", icon: Crown, color: "text-indigo-600 bg-indigo-50" },
  goal_crusher: { label: "Goal Crusher", icon: Target, color: "text-emerald-600 bg-emerald-50" },
  team_player: { label: "Team Player", icon: Handshake, color: "text-cyan-600 bg-cyan-50" },
};

const ALL_BADGES = Object.keys(BADGE_META);

export default function AchievementWall({ initialBadges = [] }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    base44.leaderboard
      .me()
      .then((data) => {
        if (mounted) setAchievements(data.achievements || []);
      })
      .catch(() => {
        if (mounted) setAchievements([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const earnedTypes = new Set([
    ...initialBadges,
    ...achievements.map((achievement) => achievement.badge_type),
  ]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Achievement Wall</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ALL_BADGES.map((badgeType) => {
            const meta = BADGE_META[badgeType];
            const Icon = meta.icon || Award;
            const earned = earnedTypes.has(badgeType);

            return (
              <div
                key={badgeType}
                className={`rounded-xl p-3 text-center transition ${
                  earned ? "bg-gray-50" : "bg-gray-50 text-gray-400 opacity-70"
                }`}
              >
                <div
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${
                    earned ? meta.color : "bg-white text-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-2 text-sm font-semibold leading-tight">
                  {meta.label}
                </p>
              </div>
            );
          })}
        </div>
        {loading && <p className="mt-4 text-sm text-gray-400">Loading awards...</p>}
      </CardContent>
    </Card>
  );
}
