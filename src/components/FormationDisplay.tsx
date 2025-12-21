"use client";

import React from 'react';

interface FormationDisplayProps {
  formation: string; // e.g., "4-3-3", "4-2-3-1", "3-5-2"
  teamName: string;
  variant?: 'home' | 'away';
}

export function FormationDisplay({ formation, teamName, variant = 'home' }: FormationDisplayProps) {
  if (!formation) return null;

  // Parse formation string into lines (e.g., "4-3-3" -> [4, 3, 3])
  const lines = formation.split('-').map(num => parseInt(num, 10));

  // Color based on variant
  const dotColor = variant === 'home' ? 'bg-[#04453f]' : 'bg-blue-600';
  const pitchColor = variant === 'home' ? 'from-green-100/50 to-lime-100/50' : 'from-blue-100/50 to-cyan-100/50';

  return (
    <div className="w-full">
      {/* Formation label */}
      <div className="text-center mb-2">
        <span className="text-xs font-semibold text-gray-700">{teamName}</span>
        <div className="text-sm font-bold text-[#04453f]">{formation}</div>
      </div>

      {/* Football pitch */}
      <div className={`relative bg-gradient-to-b ${pitchColor} rounded-lg border-2 border-gray-300 p-3 aspect-[2/3]`}>
        {/* Pitch markings */}
        <div className="absolute inset-0 flex flex-col">
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40"></div>

          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 w-12 h-12 -ml-6 -mt-6 rounded-full border border-white/40"></div>

          {/* Penalty areas - top */}
          <div className="absolute top-0 left-1/4 right-1/4 h-8 border-l border-r border-b border-white/40"></div>

          {/* Penalty areas - bottom */}
          <div className="absolute bottom-0 left-1/4 right-1/4 h-8 border-l border-r border-t border-white/40"></div>
        </div>

        {/* Player positions */}
        <div className="relative h-full flex flex-col justify-around py-2">
          {/* Goalkeeper (always 1 at bottom) */}
          <div className="flex justify-center items-center">
            <div className={`w-3 h-3 rounded-full ${dotColor} border-2 border-white shadow-sm`}></div>
          </div>

          {/* Field players from back to front */}
          {lines.map((playersInLine, lineIndex) => (
            <div key={lineIndex} className="flex justify-around items-center px-2">
              {Array.from({ length: playersInLine }).map((_, playerIndex) => (
                <div
                  key={playerIndex}
                  className={`w-3 h-3 rounded-full ${dotColor} border-2 border-white shadow-sm`}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
