'use client';

import { useTranslations } from 'next-intl';

interface StatisticsTabProps {
  matchData: any;
}

interface StatBarProps {
  homeValue: number;
  awayValue: number;
  label: string;
}

function StatBar({ homeValue, awayValue, label }: StatBarProps) {
  const total = homeValue + awayValue || 1;
  const homePercentage = (homeValue / total) * 100;
  const awayPercentage = (awayValue / total) * 100;

  return (
    <div className="space-y-2.5 p-3 rounded-lg bg-gradient-to-r from-blue-50 via-white to-red-50 border border-gray-100">
      <div className="text-center">
        <span className="text-xs text-gray-700 font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center justify-between text-sm gap-3">
        <span className="font-black text-blue-600 w-12 text-left text-base">{homeValue}</span>
        <div className="flex-1 h-3 rounded-full overflow-hidden bg-gray-200 shadow-inner">
          <div className="flex h-full">
            <div
              className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 h-full transition-all duration-500 shadow-sm"
              style={{ width: `${homePercentage}%` }}
            />
            <div
              className="bg-gradient-to-l from-red-600 via-red-500 to-red-400 h-full transition-all duration-500 shadow-sm"
              style={{ width: `${awayPercentage}%` }}
            />
          </div>
        </div>
        <span className="font-black text-red-600 w-12 text-right text-base">{awayValue}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
        <span>{homePercentage.toFixed(0)}%</span>
        <span>{awayPercentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export function StatisticsTab({ matchData }: StatisticsTabProps) {
  const t = useTranslations('can2025.match.stats');

  // Get stats from boxscore.teams (primary source) or fallback to header.competitions
  const boxscoreTeams = matchData.boxscore?.teams || [];
  const homeBoxscoreTeam = boxscoreTeams.find((t: any) => t.homeAway === 'home') || boxscoreTeams[0];
  const awayBoxscoreTeam = boxscoreTeams.find((t: any) => t.homeAway === 'away') || boxscoreTeams[1];

  // Fallback to header competitors if boxscore not available
  const competition = matchData.header?.competitions?.[0];
  const homeCompetitor = competition?.competitors?.find((c: any) => c.homeAway === 'home') || competition?.competitors?.[0];
  const awayCompetitor = competition?.competitors?.find((c: any) => c.homeAway === 'away') || competition?.competitors?.[1];

  // Use boxscore stats first, then competitor stats
  const homeStats = homeBoxscoreTeam?.statistics || homeCompetitor?.statistics || [];
  const awayStats = awayBoxscoreTeam?.statistics || awayCompetitor?.statistics || [];

  const getStat = (stats: any[], name: string) => {
    // Try multiple possible field names
    const possibleNames = [name, name.toLowerCase()];
    if (name === 'fouls') possibleNames.push('foulsCommitted');
    if (name === 'corners') possibleNames.push('wonCorners');

    for (const n of possibleNames) {
      const stat = stats.find((s: any) => s.name === n || s.name?.toLowerCase() === n.toLowerCase());
      if (stat) return parseFloat(stat.displayValue) || 0;
    }
    return 0;
  };

  const hasStats = homeStats.length > 0 || awayStats.length > 0;

  if (!hasStats) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-500 text-sm">{t('noStatsAvailable')}</p>
        <p className="text-gray-400 text-xs mt-1">{t('statsAvailableDuringMatch')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatBar
        homeValue={getStat(homeStats, 'possessionPct')}
        awayValue={getStat(awayStats, 'possessionPct')}
        label={`⚽ ${t('possession')}`}
      />

      <StatBar
        homeValue={getStat(homeStats, 'totalShots')}
        awayValue={getStat(awayStats, 'totalShots')}
        label={`🎯 ${t('totalShots')}`}
      />

      <StatBar
        homeValue={getStat(homeStats, 'shotsOnTarget')}
        awayValue={getStat(awayStats, 'shotsOnTarget')}
        label={`🔥 ${t('shotsOnTarget')}`}
      />

      <StatBar
        homeValue={getStat(homeStats, 'totalPasses')}
        awayValue={getStat(awayStats, 'totalPasses')}
        label={`👟 ${t('totalPasses')}`}
      />

      <StatBar
        homeValue={getStat(homeStats, 'accuratePasses')}
        awayValue={getStat(awayStats, 'accuratePasses')}
        label={`✅ ${t('accuratePasses')}`}
      />

      <StatBar
        homeValue={getStat(homeStats, 'fouls')}
        awayValue={getStat(awayStats, 'fouls')}
        label={`⚠️ ${t('fouls')}`}
      />

      <StatBar
        homeValue={getStat(homeStats, 'corners')}
        awayValue={getStat(awayStats, 'corners')}
        label={`🚩 ${t('corners')}`}
      />

      {/* Cards */}
      <div className="pt-4 border-t-2 border-gray-200 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-600">{getStat(homeStats, 'yellowCards')}</span>
            <span className="text-lg">🟨</span>
          </div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">{t('yellowCards')}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">🟨</span>
            <span className="text-2xl font-black text-red-600">{getStat(awayStats, 'yellowCards')}</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border border-red-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-600">{getStat(homeStats, 'redCards')}</span>
            <span className="text-lg">🟥</span>
          </div>
          <span className="text-xs font-bold text-red-700 uppercase tracking-wide">{t('redCards')}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">🟥</span>
            <span className="text-2xl font-black text-red-600">{getStat(awayStats, 'redCards')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
