"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Header, Footer } from "@/components/layout";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowLeft, Share2, Users, TrendingUp, Activity } from "lucide-react";
import { MatchLineup } from "@/components/match/MatchLineup";
import { MatchStats } from "@/components/match/MatchStats";
import { YouTubeLiveStream } from "@/components/match/YouTubeLiveStream";

// Interfaces
interface Commentary {
  time: string;
  timeSeconds: number;
  text: string;
  type: string;
  team?: string;
  icon: string;
  playerName?: string;
  playerImage?: string;
  isScoring: boolean;
  source?: string;
}

interface Match {
  eventId: string;
  teams: {
    home: { name: string; nameKey: string; logo: string };
    away: { name: string; nameKey: string; logo: string };
  };
  score: { home: number; away: number };
  status: string;
  statusDetail: string;
  date: string;
  competition: string;
  venue?: string;
  city?: string;
  matchType?: string;
}

interface Player {
  number: number;
  name: string;
  position: string;
}

interface MatchData {
  success: boolean;
  language: string;
  match: Match;
  commentary: Commentary[];
  preMatchAnalysis?: {
    headToHead?: string;
    recentForm?: string;
    keyPlayers?: string;
    tacticalPreview?: string;
    prediction?: string;
    homeFormation?: string;
    awayFormation?: string;
    homeLineup?: Player[];
    awayLineup?: Player[];
    homeSubstitutes?: Player[];
    awaySubstitutes?: Player[];
    generatedAt?: string;
  };
}

type Tab = 'overview' | 'lineups' | 'stats' | 'video';

export default function MatchEnDirectPage() {
  const t = useTranslations();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(12543);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const locale = window.location.pathname.split('/')[1] || 'fr';
        const response = await fetch(`/api/match-commentary-ai?locale=${locale}`);
        const data = await response.json();
        setMatchData(data);

        const matchStatus = data.match.status.toLowerCase();
        const isRecentMatch = data.match.matchType === "recent";
        setIsLive(
          !isRecentMatch &&
            (matchStatus.includes("half") || matchStatus.includes("playing") || matchStatus.includes("live"))
        );
        setLoading(false);
      } catch (error) {
        console.error("Error fetching match data:", error);
        setLoading(false);
      }
    };

    fetchMatchData();
    const interval = setInterval(() => {
      setViewers((prev) => prev + Math.floor(Math.random() * 100) - 50);
      fetchMatchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !matchData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pt-header min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-gray-600">{t("common.loading")}</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { match, commentary, preMatchAnalysis } = matchData;

  const getTeamName = (nameKey: string, fallback: string) => {
    try {
      return t(`nextMatch.teams.${nameKey}`);
    } catch {
      return fallback;
    }
  };

  // Build lineup data from AI scheduler (no mock data)
  const hasLineupData = preMatchAnalysis?.homeLineup && preMatchAnalysis?.awayLineup;

  const lineupData = hasLineupData ? {
    homeTeam: {
      name: getTeamName(match.teams.home.nameKey, match.teams.home.name),
      logo: match.teams.home.logo,
      formation: preMatchAnalysis.homeFormation || "4-3-3",
      lineup: preMatchAnalysis.homeLineup!,
      substitutes: preMatchAnalysis.homeSubstitutes || [],
    },
    awayTeam: {
      name: getTeamName(match.teams.away.nameKey, match.teams.away.name),
      logo: match.teams.away.logo,
      formation: preMatchAnalysis.awayFormation || "4-3-3",
      lineup: preMatchAnalysis.awayLineup!,
      substitutes: preMatchAnalysis.awaySubstitutes || [],
    },
  } : null;

  // Stats data (will be populated from ESPN API when match is live)
  const statsData = {
    possession: { home: 0, away: 0 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 },
    redCards: { home: 0, away: 0 },
    offsides: { home: 0, away: 0 },
    passAccuracy: { home: 0, away: 0 },
  };

  const currentMinute = match.status.toLowerCase().includes("finished") ? "FT" : match.statusDetail;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pt-header min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 text-[#04453f] hover:text-[#022a27] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{t("common.backToHome")}</span>
          </Link>

          {/* Sticky Match Scoreboard */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 sticky top-20 z-40 mb-6">
            <div className="bg-gradient-to-br from-[#04453f] via-[#022a27] to-[#04453f] text-white p-4 sm:p-6">
              {/* Match status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isLive ? (
                    <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      <span className="text-xs font-bold uppercase">{t("matchCommentary.live")}</span>
                    </div>
                  ) : (
                    <div className="bg-gray-700 px-3 py-1.5 rounded-full">
                      <span className="text-xs font-medium uppercase">{match.status}</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-300">{match.competition}</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">{t("common.share")}</span>
                </button>
              </div>

              {/* Score */}
              <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className="text-center flex-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 relative">
                    <Image
                      src={match.teams.home.logo}
                      alt={getTeamName(match.teams.home.nameKey, match.teams.home.name)}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold">
                    {getTeamName(match.teams.home.nameKey, match.teams.home.name)}
                  </h3>
                </div>

                {/* Score */}
                <div className="text-center px-4 sm:px-8">
                  <div className="text-4xl sm:text-6xl font-bold flex items-center gap-3 sm:gap-4">
                    <span>{match.score.home}</span>
                    <span className="text-2xl sm:text-3xl text-gray-400">-</span>
                    <span>{match.score.away}</span>
                  </div>
                  <div className="mt-2 text-sm sm:text-base font-medium text-[#9DFF20]">{currentMinute}</div>
                </div>

                {/* Away Team */}
                <div className="text-center flex-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 relative">
                    <Image
                      src={match.teams.away.logo}
                      alt={getTeamName(match.teams.away.nameKey, match.teams.away.name)}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold">
                    {getTeamName(match.teams.away.nameKey, match.teams.away.name)}
                  </h3>
                </div>
              </div>

              {/* Venue */}
              {match.venue && (
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <span className="text-xs text-gray-300">{match.venue}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {(['overview', 'lineups', 'stats', 'video'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[100px] px-4 py-3 sm:py-4 text-sm font-semibold transition-colors relative ${
                    activeTab === tab
                      ? 'text-[#04453f] border-b-2 border-[#04453f] bg-green-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'overview' && t("can2025.match.matchPreview")}
                  {tab === 'lineups' && 'Compositions'}
                  {tab === 'stats' && 'Statistiques'}
                  {tab === 'video' && 'Vidéo'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Pre-match Analysis */}
                  {match.matchType === 'upcoming' && commentary.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 via-lime-50 to-green-50 rounded-xl shadow-lg p-6 border-2 border-[#9DFF20]/30">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#04453f] to-[#022a27] text-white rounded-full text-sm font-semibold">
                          <span>📊</span>
                          <span>{t("can2025.match.preMatchAnalysis")}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {commentary.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-[#9DFF20]/20">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{item.icon}</span>
                              <span className="text-xs font-semibold text-[#04453f] uppercase">{item.time}</span>
                            </div>
                            <p className="text-sm sm:text-base text-gray-800 leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Commentary Timeline - L'Équipe Style */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                      <h2 className="text-lg font-bold text-gray-900">{t("matchCommentary.commentaryTitle")}</h2>
                    </div>

                    {commentary.length === 0 ? (
                      <div className="text-center py-16 px-6">
                        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-base font-medium">{t("matchCommentary.notStarted")}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {commentary.map((item, index) => {
                          // Determine color scheme based on event type
                          const getEventStyle = (type: string, isScoring: boolean) => {
                            if (isScoring || type === 'goal') {
                              return {
                                bgColor: 'bg-blue-50',
                                borderColor: 'border-l-blue-600',
                                timeBg: 'bg-blue-600',
                                iconBg: 'bg-blue-100'
                              };
                            }
                            if (type === 'yellow_card') {
                              return {
                                bgColor: 'bg-yellow-50',
                                borderColor: 'border-l-yellow-500',
                                timeBg: 'bg-yellow-500',
                                iconBg: 'bg-yellow-100'
                              };
                            }
                            if (type === 'red_card') {
                              return {
                                bgColor: 'bg-red-50',
                                borderColor: 'border-l-red-600',
                                timeBg: 'bg-red-600',
                                iconBg: 'bg-red-100'
                              };
                            }
                            if (type === 'substitution') {
                              return {
                                bgColor: 'bg-purple-50',
                                borderColor: 'border-l-purple-500',
                                timeBg: 'bg-purple-500',
                                iconBg: 'bg-purple-100'
                              };
                            }
                            return {
                              bgColor: 'bg-white',
                              borderColor: 'border-l-gray-300',
                              timeBg: 'bg-gray-700',
                              iconBg: 'bg-gray-100'
                            };
                          };

                          const style = getEventStyle(item.type, item.isScoring);

                          return (
                            <div
                              key={index}
                              className={`flex items-start gap-4 px-6 py-4 ${style.bgColor} border-l-4 ${style.borderColor} hover:bg-opacity-80 transition-all`}
                            >
                              {/* Time Badge */}
                              <div className="flex-shrink-0 w-14">
                                <div className={`${style.timeBg} text-white text-center rounded-md px-2 py-1.5 text-sm font-bold`}>
                                  {item.time}
                                </div>
                              </div>

                              {/* Icon */}
                              <div className={`flex-shrink-0 w-10 h-10 ${style.iconBg} rounded-full flex items-center justify-center text-xl`}>
                                {item.icon}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pt-1">
                                {item.playerName && (
                                  <div className="font-bold text-gray-900 mb-1 text-base">
                                    {item.playerName}
                                  </div>
                                )}
                                <p className="text-gray-700 leading-relaxed text-base">
                                  {item.text}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lineups Tab */}
              {activeTab === 'lineups' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  {lineupData ? (
                    <MatchLineup homeTeam={lineupData.homeTeam} awayTeam={lineupData.awayTeam} />
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium mb-2">
                        {t("can2025.match.noDataYet")}
                      </p>
                      <p className="text-sm text-gray-500">
                        Les compositions seront disponibles 2 heures avant le match.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <MatchStats
                  stats={statsData}
                  homeTeamName={getTeamName(match.teams.home.nameKey, match.teams.home.name)}
                  awayTeamName={getTeamName(match.teams.away.nameKey, match.teams.away.name)}
                />
              )}

              {/* Video Tab */}
              {activeTab === 'video' && (
                <div>
                  <YouTubeLiveStream channelUrl="https://www.youtube.com/@afriquesports/streams" />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Live Info */}
              <div className="bg-gradient-to-br from-[#04453f] to-[#022a27] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">{t("matchCommentary.information")}</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-white/70">{t("matchCommentary.viewers")}</span>
                    <span className="font-semibold">{viewers.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-white/10">
                    <span className="text-white/70">{t("matchCommentary.status")}</span>
                    <span className="font-semibold">{match.status}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-white/70">Score</span>
                    <span className="font-semibold text-base">
                      {match.score.home} - {match.score.away}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
