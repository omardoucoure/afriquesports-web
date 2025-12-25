'use client';

import { useEffect, useState } from 'react';

export default function TestMatchPage() {
  const [commentaries, setCommentaries] = useState<any[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch match data
        const matchRes = await fetch('/api/can2025/test-match');
        const matchJson = await matchRes.json();
        setMatchData(matchJson.events?.[0] || null);

        // Fetch commentaries
        const commRes = await fetch('/api/can2025/live-commentary?match_id=test-brazil-france-2006');
        const commJson = await commRes.json();
        setCommentaries(commJson.commentary || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Test Match Not Found</h1>
        <p>The test match is not currently active.</p>
      </div>
    );
  }

  const homeCompetitor = matchData.competitions[0].competitors[0];
  const awayCompetitor = matchData.competitions[0].competitors[1];
  const homeTeam = homeCompetitor.team.displayName;
  const awayTeam = awayCompetitor.team.displayName;
  const homeScore = homeCompetitor.score;
  const awayScore = awayCompetitor.score;
  const status = matchData.status.type.description;
  const clock = matchData.status.displayClock;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Match Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-2">
              {matchData.season.displayName} - Quarter-Final
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {matchData.competitions[0].venue.fullName}, {matchData.competitions[0].venue.address.city}
            </div>
          </div>

          {/* Teams and Score */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold mb-2">{homeTeam}</div>
              <div className="text-4xl font-bold text-[#9DFF20]">{homeScore}</div>
            </div>

            <div className="px-4 text-center">
              <div className="text-sm text-gray-600">vs</div>
            </div>

            <div className="flex-1 text-center">
              <div className="text-2xl font-bold mb-2">{awayTeam}</div>
              <div className="text-4xl font-bold text-[#9DFF20]">{awayScore}</div>
            </div>
          </div>

          {/* Match Status */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              <span className="font-semibold">{status} - {clock}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Commentaries - Left Side (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Commentaires en Direct
                </h2>
                <div className="text-sm text-gray-600">
                  {commentaries.length} {commentaries.length === 1 ? 'commentaire' : 'commentaires'}
                </div>
              </div>

              {commentaries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">⏳</div>
                  <p>En attente des commentaires...</p>
                  <p className="text-sm mt-2">L'agent autonome génère des commentaires toutes les 15 secondes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commentaries.map((comment: any, index: number) => (
                    <div
                      key={comment.id}
                      className={`border-l-4 pl-4 py-3 ${
                        comment.is_scoring
                          ? 'border-[#9DFF20] bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{comment.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-gray-700">
                              {comment.time}
                            </span>
                            {comment.type && (
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {comment.type}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team Formations - Right Side (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Home Team Formation */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-center border-b pb-2">
                {homeTeam} ({homeCompetitor.formation})
              </h3>
              <div className="space-y-2">
                {homeCompetitor.lineup.starters.map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="w-8 h-8 bg-[#345C00] text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {player.number}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-gray-500">{player.position}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t text-center text-sm text-gray-600">
                <span className="font-semibold">Coach:</span> {homeCompetitor.lineup.coach}
              </div>
            </div>

            {/* Away Team Formation */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-center border-b pb-2">
                {awayTeam} ({awayCompetitor.formation})
              </h3>
              <div className="space-y-2">
                {awayCompetitor.lineup.starters.map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="w-8 h-8 bg-[#0055a4] text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {player.number}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-gray-500">{player.position}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t text-center text-sm text-gray-600">
                <span className="font-semibold">Coach:</span> {awayCompetitor.lineup.coach}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-refresh notice */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🤖 Cette page est mise à jour automatiquement par l'agent autonome</p>
          <p className="mt-1">Rafraîchissez la page pour voir les nouveaux commentaires</p>
        </div>
      </div>
    </div>
  );
}
