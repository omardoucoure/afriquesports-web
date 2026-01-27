"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

interface MatchStatsProps {
  stats: {
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    shotsOnTarget: { home: number; away: number };
    corners: { home: number; away: number };
    fouls: { home: number; away: number };
    yellowCards: { home: number; away: number };
    redCards: { home: number; away: number };
    offsides: { home: number; away: number };
    passAccuracy: { home: number; away: number };
  };
  homeTeamName: string;
  awayTeamName: string;
}

export function MatchStats({ stats, homeTeamName, awayTeamName }: MatchStatsProps) {
  const tMatchStats = useTranslations("matchStats");
  const StatBar = ({ label, home, away, isPercentage = false }: { label: string; home: number; away: number; isPercentage?: boolean }) => {
    const total = home + away || 1;
    const homePercentage = (home / total) * 100;
    const awayPercentage = (away / total) * 100;

    return (
      <div className="py-4 border-b border-gray-100 last:border-0">
        {/* Values */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">{isPercentage ? `${home}%` : home}</span>
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</span>
          <span className="text-sm font-semibold text-gray-900">{isPercentage ? `${away}%` : away}</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 h-2">
          {/* Home team bar */}
          <div className="flex-1 h-full bg-gray-100 rounded-full overflow-hidden flex justify-end">
            <div
              className="bg-[#04453f] h-full rounded-full transition-all duration-500"
              style={{ width: `${isPercentage ? home : homePercentage}%` }}
            ></div>
          </div>

          {/* Away team bar */}
          <div className="flex-1 h-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${isPercentage ? away : awayPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-6 space-y-2">
      <StatBar label={tMatchStats("possession")} home={stats.possession.home} away={stats.possession.away} isPercentage />
      <StatBar label={tMatchStats("shots")} home={stats.shots.home} away={stats.shots.away} />
      <StatBar label={tMatchStats("shotsOnTarget")} home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
      <StatBar label={tMatchStats("corners")} home={stats.corners.home} away={stats.corners.away} />
      <StatBar label={tMatchStats("fouls")} home={stats.fouls.home} away={stats.fouls.away} />
      <StatBar label={tMatchStats("yellowCards")} home={stats.yellowCards.home} away={stats.yellowCards.away} />
      {(stats.redCards.home > 0 || stats.redCards.away > 0) && (
        <StatBar label={tMatchStats("redCards")} home={stats.redCards.home} away={stats.redCards.away} />
      )}
      <StatBar label={tMatchStats("offside")} home={stats.offsides.home} away={stats.offsides.away} />
      <StatBar label={tMatchStats("passesCompleted")} home={stats.passAccuracy.home} away={stats.passAccuracy.away} isPercentage />
    </div>
  );
}
