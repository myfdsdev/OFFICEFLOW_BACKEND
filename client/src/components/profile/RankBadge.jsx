import React from "react";
import { Award, TrendingUp } from "lucide-react";

export default function RankBadge({ rank = 0, points = 0, className = "" }) {
  const rankLabel = rank ? `#${rank}` : "Unranked";

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
        <div className="flex items-center gap-2 text-amber-700">
          <Award className="h-4 w-4" />
          <span className="text-xs font-medium">Rank</span>
        </div>
        <p className="mt-1 text-lg font-bold text-amber-900">{rankLabel}</p>
      </div>
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
        <div className="flex items-center gap-2 text-emerald-700">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">Points</span>
        </div>
        <p className="mt-1 text-lg font-bold text-emerald-900">
          {Number(points || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
