'use client';

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Goal icon - Soccer ball with net
export const GoalIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#goalGradient)" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#1a5d1a"/>
    <path d="M12 7l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 10.5l3.5-.5L12 7z" fill="white"/>
    <defs>
      <linearGradient id="goalGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#22c55e"/>
        <stop offset="1" stopColor="#15803d"/>
      </linearGradient>
    </defs>
  </svg>
);

// Yellow card icon
export const YellowCardIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="2" fill="url(#yellowGradient)" stroke="#b45309" strokeWidth="1.5"/>
    <path d="M9 8h6M9 12h6M9 16h4" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round"/>
    <defs>
      <linearGradient id="yellowGradient" x1="5" y1="2" x2="19" y2="22">
        <stop stopColor="#fde047"/>
        <stop offset="1" stopColor="#facc15"/>
      </linearGradient>
    </defs>
  </svg>
);

// Red card icon
export const RedCardIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="2" fill="url(#redGradient)" stroke="#991b1b" strokeWidth="1.5"/>
    <path d="M9 9l6 6M15 9l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="redGradient" x1="5" y1="2" x2="19" y2="22">
        <stop stopColor="#ef4444"/>
        <stop offset="1" stopColor="#dc2626"/>
      </linearGradient>
    </defs>
  </svg>
);

// Substitution icon
export const SubstitutionIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#subGradient)"/>
    <path d="M8 12l3-3v2h5v2h-5v2l-3-3z" fill="white"/>
    <path d="M16 12l-3 3v-2H8v-2h5V9l3 3z" fill="white" opacity="0.6"/>
    <defs>
      <linearGradient id="subGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#6366f1"/>
        <stop offset="1" stopColor="#4f46e5"/>
      </linearGradient>
    </defs>
  </svg>
);

// Foul icon
export const FoulIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#foulGradient)"/>
    <path d="M12 8v5M12 15v1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="foulGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#f97316"/>
        <stop offset="1" stopColor="#ea580c"/>
      </linearGradient>
    </defs>
  </svg>
);

// Corner icon
export const CornerIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="2" fill="url(#cornerGradient)"/>
    <path d="M6 18V8c0-1.1.9-2 2-2h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="6" cy="18" r="2" fill="white"/>
    <defs>
      <linearGradient id="cornerGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#14b8a6"/>
        <stop offset="1" stopColor="#0d9488"/>
      </linearGradient>
    </defs>
  </svg>
);

// Save icon (goalkeeper gloves)
export const SaveIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#saveGradient)"/>
    <path d="M8 14c0-2 1-4 4-4s4 2 4 4M10 10V8M14 10V8M12 14v3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <defs>
      <linearGradient id="saveGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#06b6d4"/>
        <stop offset="1" stopColor="#0891b2"/>
      </linearGradient>
    </defs>
  </svg>
);

// Shot icon (target)
export const ShotIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#shotGradient)"/>
    <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="1.5" fill="none"/>
    <circle cx="12" cy="12" r="2" fill="white"/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <defs>
      <linearGradient id="shotGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#8b5cf6"/>
        <stop offset="1" stopColor="#7c3aed"/>
      </linearGradient>
    </defs>
  </svg>
);

// VAR icon
export const VARIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" fill="url(#varGradient)"/>
    <text x="12" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">VAR</text>
    <defs>
      <linearGradient id="varGradient" x1="2" y1="4" x2="22" y2="20">
        <stop stopColor="#3b82f6"/>
        <stop offset="1" stopColor="#2563eb"/>
      </linearGradient>
    </defs>
  </svg>
);

// Offside icon
export const OffsideIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#offsideGradient)"/>
    <path d="M6 12h12M12 6v12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="15" cy="9" r="2" fill="white"/>
    <defs>
      <linearGradient id="offsideGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#64748b"/>
        <stop offset="1" stopColor="#475569"/>
      </linearGradient>
    </defs>
  </svg>
);

// Penalty icon
export const PenaltyIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="6" width="20" height="14" rx="2" fill="url(#penaltyGradient)"/>
    <circle cx="12" cy="16" r="2" fill="white"/>
    <path d="M4 8h16M8 8v6M16 8v6" stroke="white" strokeWidth="1.5"/>
    <defs>
      <linearGradient id="penaltyGradient" x1="2" y1="6" x2="22" y2="20">
        <stop stopColor="#a855f7"/>
        <stop offset="1" stopColor="#9333ea"/>
      </linearGradient>
    </defs>
  </svg>
);

// Commentary icon (microphone)
export const CommentaryIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#commentaryGradient)"/>
    <rect x="9" y="5" width="6" height="10" rx="3" fill="white"/>
    <path d="M8 12c0 2.21 1.79 4 4 4s4-1.79 4-4M12 16v3M9 19h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <defs>
      <linearGradient id="commentaryGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#ec4899"/>
        <stop offset="1" stopColor="#db2777"/>
      </linearGradient>
    </defs>
  </svg>
);

// Analysis icon (chart)
export const AnalysisIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#analysisGradient)"/>
    <path d="M6 16l4-4 3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="16" r="1.5" fill="white"/>
    <circle cx="10" cy="12" r="1.5" fill="white"/>
    <circle cx="13" cy="15" r="1.5" fill="white"/>
    <circle cx="18" cy="9" r="1.5" fill="white"/>
    <defs>
      <linearGradient id="analysisGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#10b981"/>
        <stop offset="1" stopColor="#059669"/>
      </linearGradient>
    </defs>
  </svg>
);

// Highlight icon (star)
export const HighlightIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#highlightGradient)"/>
    <path d="M12 4l2.5 5 5.5.8-4 3.9.9 5.3-4.9-2.6-4.9 2.6.9-5.3-4-3.9 5.5-.8L12 4z" fill="white"/>
    <defs>
      <linearGradient id="highlightGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#f59e0b"/>
        <stop offset="1" stopColor="#d97706"/>
      </linearGradient>
    </defs>
  </svg>
);

// Info icon
export const InfoIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#infoGradient)"/>
    <path d="M12 8v1M12 11v5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="infoGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#6b7280"/>
        <stop offset="1" stopColor="#4b5563"/>
      </linearGradient>
    </defs>
  </svg>
);

// Kickoff icon
export const KickoffIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#kickoffGradient)"/>
    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <defs>
      <linearGradient id="kickoffGradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#9DFF20"/>
        <stop offset="1" stopColor="#345C00"/>
      </linearGradient>
    </defs>
  </svg>
);

// Map event type to icon component
export const getEventIcon = (type: string, size: number = 28): React.ReactNode => {
  const iconMap: Record<string, React.FC<IconProps>> = {
    goal: GoalIcon,
    yellowCard: YellowCardIcon,
    redCard: RedCardIcon,
    substitution: SubstitutionIcon,
    foul: FoulIcon,
    corner: CornerIcon,
    save: SaveIcon,
    shot: ShotIcon,
    varCheck: VARIcon,
    offside: OffsideIcon,
    penaltyAwarded: PenaltyIcon,
    penaltyMissed: PenaltyIcon,
    penalty: PenaltyIcon,
    commentary: CommentaryIcon,
    analysis: AnalysisIcon,
    highlight: HighlightIcon,
    info: InfoIcon,
    kickoff: KickoffIcon,
  };

  const IconComponent = iconMap[type] || InfoIcon;
  return <IconComponent size={size} />;
};

// Get background style for event type
export const getEventStyle = (type: string, isScoring: boolean): string => {
  if (isScoring) {
    return 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-l-4 border-emerald-500 shadow-lg shadow-emerald-100';
  }

  const styleMap: Record<string, string> = {
    goal: 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-l-4 border-emerald-500 shadow-lg shadow-emerald-100',
    yellowCard: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400',
    redCard: 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500',
    substitution: 'bg-gradient-to-r from-indigo-50 to-violet-50 border-l-4 border-indigo-500',
    foul: 'bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-400',
    corner: 'bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500',
    save: 'bg-gradient-to-r from-cyan-50 to-sky-50 border-l-4 border-cyan-500',
    shot: 'bg-gradient-to-r from-purple-50 to-violet-50 border-l-4 border-purple-500',
    varCheck: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500',
    offside: 'bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-400',
    penaltyAwarded: 'bg-gradient-to-r from-purple-50 to-fuchsia-50 border-l-4 border-purple-500',
    penaltyMissed: 'bg-gradient-to-r from-purple-50 to-fuchsia-50 border-l-4 border-purple-400',
    commentary: 'bg-gradient-to-r from-pink-50 to-rose-50 border-l-4 border-pink-400',
    analysis: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-400',
    highlight: 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500',
    info: 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-300',
    kickoff: 'bg-gradient-to-r from-lime-50 to-green-50 border-l-4 border-lime-500',
  };

  return styleMap[type] || 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-300';
};

// Get time badge color for event type
export const getTimeBadgeStyle = (type: string, isScoring: boolean): string => {
  if (isScoring) {
    return 'bg-emerald-600 text-white';
  }

  const badgeMap: Record<string, string> = {
    goal: 'bg-emerald-600 text-white',
    yellowCard: 'bg-amber-500 text-white',
    redCard: 'bg-red-600 text-white',
    substitution: 'bg-indigo-600 text-white',
    foul: 'bg-orange-500 text-white',
    corner: 'bg-teal-600 text-white',
    save: 'bg-cyan-600 text-white',
    shot: 'bg-purple-600 text-white',
    varCheck: 'bg-blue-600 text-white',
    offside: 'bg-slate-500 text-white',
    penaltyAwarded: 'bg-purple-600 text-white',
    penaltyMissed: 'bg-purple-500 text-white',
    commentary: 'bg-pink-500 text-white',
    analysis: 'bg-emerald-500 text-white',
    highlight: 'bg-amber-600 text-white',
    info: 'bg-gray-500 text-white',
    kickoff: 'bg-lime-600 text-white',
  };

  return badgeMap[type] || 'bg-gray-500 text-white';
};
