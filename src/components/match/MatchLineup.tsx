"use client";

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface Player {
  number: number;
  name: string;
  position: string;
  image?: string;
}

interface MatchLineupProps {
  homeTeam: {
    name: string;
    logo: string;
    formation: string;
    lineup: Player[];
    substitutes?: Player[];
  };
  awayTeam: {
    name: string;
    logo: string;
    formation: string;
    lineup: Player[];
    substitutes?: Player[];
  };
}

export function MatchLineup({ homeTeam, awayTeam }: MatchLineupProps) {
  const tMatchStats = useTranslations("matchStats");
  // Parse formation to get player rows (e.g., "4-3-3" -> [1, 4, 3, 3])
  const parseFormation = (formation: string): number[] => {
    const lines = formation.split('-').map(n => parseInt(n, 10));
    return [1, ...lines]; // Add goalkeeper
  };

  const renderLineup = (team: typeof homeTeam, isHome: boolean) => {
    const formation = parseFormation(team.formation);
    const players = [...team.lineup];

    return (
      <div className="w-full">
        {/* Pitch */}
        <div className={`relative bg-gradient-to-b ${isHome ? 'from-green-600/20 to-green-800/20' : 'from-blue-600/20 to-blue-800/20'} rounded-lg p-4 min-h-[400px]`}>
          {/* Pitch lines */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Center line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30"></div>
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full border border-white/30"></div>
          </div>

          {/* Players by formation lines */}
          <div className="relative flex flex-col justify-around h-full py-2 gap-2">
            {formation.map((playersInLine, lineIndex) => (
              <div key={lineIndex} className="flex justify-around items-center">
                {players.slice(0, playersInLine).map((player) => {
                  players.shift(); // Remove from array
                  return (
                    <div key={player.number} className="flex flex-col items-center">
                      {/* Player circle */}
                      <div className={`relative w-10 h-10 rounded-full ${isHome ? 'bg-[#04453f]' : 'bg-blue-600'} border-2 border-white shadow-lg flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">{player.number}</span>
                      </div>
                      {/* Player name */}
                      <span className="text-[10px] font-medium text-gray-700 mt-1 text-center max-w-[60px] truncate">
                        {player.name.split(' ').pop()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPlayerList = (team: typeof homeTeam, isHome: boolean) => {
    return (
      <div className="space-y-3">
        {/* Starting XI */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Image src={team.logo} alt={team.name} width={24} height={24} className="object-contain" />
            <h3 className="font-semibold text-sm">{team.name}</h3>
            <span className="text-xs text-gray-500 ml-auto">{team.formation}</span>
          </div>

          <div className="space-y-1">
            {team.lineup.map((player) => (
              <div key={player.number} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors">
                <div className={`w-6 h-6 rounded-full ${isHome ? 'bg-[#04453f]' : 'bg-blue-600'} text-white text-xs flex items-center justify-center font-bold`}>
                  {player.number}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{player.name}</div>
                  <div className="text-xs text-gray-500">{player.position}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Substitutes */}
        {team.substitutes && team.substitutes.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">{tMatchStats("substitutes")}</h4>
            <div className="space-y-1">
              {team.substitutes.map((player) => (
                <div key={player.number} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors opacity-75">
                  <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-bold">
                    {player.number}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{player.name}</div>
                    <div className="text-xs text-gray-500">{player.position}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Formation View - Desktop */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Image src={homeTeam.logo} alt={homeTeam.name} width={20} height={20} className="object-contain" />
            {homeTeam.name} ({homeTeam.formation})
          </h3>
          {renderLineup(homeTeam, true)}
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Image src={awayTeam.logo} alt={awayTeam.name} width={20} height={20} className="object-contain" />
            {awayTeam.name} ({awayTeam.formation})
          </h3>
          {renderLineup(awayTeam, false)}
        </div>
      </div>

      {/* List View - All Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderPlayerList(homeTeam, true)}
        {renderPlayerList(awayTeam, false)}
      </div>
    </div>
  );
}
