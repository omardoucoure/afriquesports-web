'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CompositionTabProps {
  matchData: any;
}

interface PlayerPosition {
  jersey: string;
  name: string;
  position: string;
  captain?: boolean;
  x: number; // 0-100 (left to right)
  y: number; // 0-100 (top to bottom)
}

export function CompositionTab({ matchData }: CompositionTabProps) {
  const t = useTranslations('can2025.match');
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');

  const competition = matchData.header.competitions[0];
  const homeTeam = competition.competitors[0];
  const awayTeam = competition.competitors[1];

  const homeRoster = matchData.rosters?.find((r: any) => r.team.id === homeTeam.team.id);
  const awayRoster = matchData.rosters?.find((r: any) => r.team.id === awayTeam.team.id);

  const currentRoster = selectedTeam === 'home' ? homeRoster : awayRoster;
  const currentTeam = selectedTeam === 'home' ? homeTeam : awayTeam;

  if (!currentRoster) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">👥</div>
        <p className="text-gray-500 text-sm">{t('noLineupAvailable')}</p>
      </div>
    );
  }

  const starters = currentRoster.roster?.filter((p: any) => p.starter) || [];
  const substitutes = currentRoster.roster?.filter((p: any) => !p.starter) || [];

  // Parse formation (e.g., "4-4-2", "4-3-3")
  const formation = currentRoster.formation || '4-4-2';
  const formationLines = formation.split('-').map(Number);

  // Position players on pitch based on formation
  const getPlayerPositions = (): PlayerPosition[] => {
    const positions: PlayerPosition[] = [];

    // Goalkeeper (always at bottom)
    const goalkeeper = starters.find((p: any) =>
      p.position?.abbreviation === 'GK' || p.position?.name?.includes('Goalkeeper')
    );

    if (goalkeeper) {
      positions.push({
        jersey: goalkeeper.jersey || '1',
        name: goalkeeper.athlete?.displayName || 'GK',
        position: 'GK',
        captain: goalkeeper.captain,
        x: 50,
        y: 95
      });
    }

    // Position outfield players by formation lines
    const outfieldPlayers = starters.filter((p: any) =>
      p.position?.abbreviation !== 'GK' && !p.position?.name?.includes('Goalkeeper')
    );

    let playerIndex = 0;
    const yPositions = [75, 55, 35, 15]; // Defenders, midfielders, forwards

    formationLines.forEach((playersInLine: number, lineIndex: number) => {
      const yPos = yPositions[lineIndex] || 50;
      const spacing = 100 / (playersInLine + 1);

      for (let i = 0; i < playersInLine && playerIndex < outfieldPlayers.length; i++) {
        const player = outfieldPlayers[playerIndex];
        positions.push({
          jersey: player.jersey || `${playerIndex + 2}`,
          name: player.athlete?.displayName || 'Player',
          position: player.position?.abbreviation || '',
          captain: player.captain,
          x: spacing * (i + 1),
          y: yPos
        });
        playerIndex++;
      }
    });

    return positions;
  };

  const playerPositions = getPlayerPositions();

  return (
    <div className="space-y-4">
      {/* Team Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setSelectedTeam('home')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
            selectedTeam === 'home'
              ? 'bg-white text-primary-dark shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <img
            src={homeTeam.team.logos?.[0]?.href || '/images/team-placeholder.png'}
            alt={homeTeam.team.displayName}
            className="w-4 h-4 object-contain"
          />
          <span className="truncate">{homeTeam.team.abbreviation || homeTeam.team.displayName}</span>
        </button>
        <button
          onClick={() => setSelectedTeam('away')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
            selectedTeam === 'away'
              ? 'bg-white text-primary-dark shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <img
            src={awayTeam.team.logos?.[0]?.href || '/images/team-placeholder.png'}
            alt={awayTeam.team.displayName}
            className="w-4 h-4 object-contain"
          />
          <span className="truncate">{awayTeam.team.abbreviation || awayTeam.team.displayName}</span>
        </button>
      </div>

      {/* Formation Badge */}
      {formation && (
        <div className="bg-primary/5 rounded-lg p-2 text-center">
          <span className="text-xs font-bold text-primary-dark">
            {formation}
          </span>
        </div>
      )}

      {/* Football Pitch Visualization */}
      <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-lg p-3 aspect-[3/4]">
        {/* Pitch markings */}
        <div className="absolute inset-0 opacity-30">
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white rounded-full" />
          {/* Penalty boxes */}
          <div className="absolute bottom-0 left-1/4 right-1/4 h-12 border-2 border-t-white border-l-white border-r-white border-b-0" />
          <div className="absolute top-0 left-1/4 right-1/4 h-12 border-2 border-b-white border-l-white border-r-white border-t-0" />
          {/* Goal boxes */}
          <div className="absolute bottom-0 left-1/3 right-1/3 h-6 border-2 border-t-white border-l-white border-r-white border-b-0" />
          <div className="absolute top-0 left-1/3 right-1/3 h-6 border-2 border-b-white border-l-white border-r-white border-t-0" />
        </div>

        {/* Players positioned on pitch */}
        <div className="absolute inset-0 p-2">
          {playerPositions.map((player, index) => (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${player.x}%`,
                top: `${player.y}%`
              }}
            >
              {/* Player circle */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="relative">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-primary-dark">
                    <span className="text-xs font-bold text-primary-dark">
                      {player.jersey}
                    </span>
                  </div>
                  {player.captain && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center border border-yellow-600">
                      <span className="text-[8px] font-bold text-yellow-900">C</span>
                    </div>
                  )}
                </div>
                {/* Player name */}
                <div className="bg-black/70 px-1.5 py-0.5 rounded text-white text-[9px] font-medium whitespace-nowrap max-w-[60px] truncate">
                  {player.name.split(' ').pop()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Team logo watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
          <img
            src={currentTeam.team.logos?.[0]?.href || '/images/team-placeholder.png'}
            alt={currentTeam.team.displayName}
            className="w-24 h-24 object-contain"
          />
        </div>
      </div>

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
            {t('substitutes')}
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {substitutes.slice(0, 8).map((player: any, index: number) => (
              <div
                key={player.athlete?.id || index}
                className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded border border-gray-100 text-xs"
              >
                <span className="flex items-center justify-center w-5 h-5 bg-gray-400 text-white text-[10px] font-bold rounded-full flex-shrink-0">
                  {player.jersey || index + 12}
                </span>
                <span className="truncate font-medium text-gray-700">
                  {player.athlete?.displayName?.split(' ').pop() || 'Player'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
