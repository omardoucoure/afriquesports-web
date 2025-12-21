"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Header, Footer } from "@/components/layout";
import Image from "next/image";
import Link from "next/link";
import { Clock, MessageCircle, Users, ArrowLeft, Filter, Share2, BarChart3 } from "lucide-react";

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
    home: {
      name: string;
      nameKey: string;
      logo: string;
    };
    away: {
      name: string;
      nameKey: string;
      logo: string;
    };
  };
  score: {
    home: number;
    away: number;
  };
  status: string;
  statusDetail: string;
  date: string;
  competition: string;
  stage?: string;
  group?: string;
  venue?: string;
  city?: string;
  matchType?: string;
}

interface MatchData {
  success: boolean;
  language: string;
  match: Match;
  commentary: Commentary[];
  sources?: {
    espn?: string;
  };
}

export default function MatchEnDirectPage() {
  const t = useTranslations();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(12543);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const locale = window.location.pathname.split('/')[1] || 'fr';
        const response = await fetch(`/api/match-commentary-ai?locale=${locale}`);
        const data = await response.json();
        setMatchData(data);

        // Check if match is live
        const matchStatus = data.match.status.toLowerCase();
        const isRecentMatch = data.match.matchType === "recent";
        setIsLive(
          !isRecentMatch &&
            (matchStatus.includes("half") ||
              matchStatus.includes("playing") ||
              matchStatus.includes("live"))
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
      setLastUpdate(new Date());
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

  const { match, commentary } = matchData;

  // Get team name from translations or fallback
  const getTeamName = (nameKey: string, fallback: string) => {
    try {
      return t(`nextMatch.teams.${nameKey}`);
    } catch {
      return fallback;
    }
  };

  // Calculate end date (match date + 2 hours)
  const matchEndDate = new Date(
    new Date(match.date).getTime() + 7200000
  ).toISOString();

  // SportsEvent structured data
  const sportsEventSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "@id": `https://www.afriquesports.net/match-en-direct#${match.eventId}`,
    name: `${getTeamName(match.teams.home.nameKey, match.teams.home.name)} vs ${getTeamName(match.teams.away.nameKey, match.teams.away.name)}`,
    description: `${t("matchCommentary.description", {
      home: getTeamName(match.teams.home.nameKey, match.teams.home.name),
      away: getTeamName(match.teams.away.nameKey, match.teams.away.name),
      scoreHome: match.score.home,
      scoreAway: match.score.away,
    })}`,
    startDate: match.date,
    endDate: matchEndDate,
    eventStatus: match.status.toLowerCase().includes("finished")
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventLive",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: match.venue || "Stadium",
      address: {
        "@type": "PostalAddress",
        addressLocality: match.city || "",
        addressCountry: "MA",
      },
    },
    image: "https://www.afriquesports.net/opengraph-image",
    organizer: {
      "@type": "Organization",
      name: "CAF",
      url: "https://www.cafonline.com",
    },
    performer: [
      {
        "@type": "SportsTeam",
        name: getTeamName(match.teams.home.nameKey, match.teams.home.name),
        sport: "Football",
      },
      {
        "@type": "SportsTeam",
        name: getTeamName(match.teams.away.nameKey, match.teams.away.name),
        sport: "Football",
      },
    ],
    competitor: [
      {
        "@type": "SportsTeam",
        name: getTeamName(match.teams.home.nameKey, match.teams.home.name),
        sport: "Football",
      },
      {
        "@type": "SportsTeam",
        name: getTeamName(match.teams.away.nameKey, match.teams.away.name),
        sport: "Football",
      },
    ],
    homeTeam: {
      "@type": "SportsTeam",
      name: getTeamName(match.teams.home.nameKey, match.teams.home.name),
      sport: "Football",
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: getTeamName(match.teams.away.nameKey, match.teams.away.name),
      sport: "Football",
    },
  };

  // LiveBlogPosting structured data for commentary
  const liveBlogSchema = {
    "@context": "https://schema.org",
    "@type": "LiveBlogPosting",
    "@id": "https://www.afriquesports.net/match-en-direct#live",
    headline: `${getTeamName(match.teams.home.nameKey, match.teams.home.name)} vs ${getTeamName(match.teams.away.nameKey, match.teams.away.name)} - ${t("matchCommentary.liveTitle")}`,
    description: t("matchCommentary.liveDescription", {
      home: getTeamName(match.teams.home.nameKey, match.teams.home.name),
      away: getTeamName(match.teams.away.nameKey, match.teams.away.name),
    }),
    datePublished: match.date,
    dateModified: new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "Afrique Sports",
    },
    publisher: {
      "@type": "Organization",
      name: "Afrique Sports",
      logo: {
        "@type": "ImageObject",
        url: "https://www.afriquesports.net/opengraph-image",
      },
    },
    coverageStartTime: match.date,
    coverageEndTime: matchEndDate,
    about: {
      "@id": `https://www.afriquesports.net/match-en-direct#${match.eventId}`,
    },
    liveBlogUpdate: commentary.slice(0, 20).map((c, index) => ({
      "@type": "BlogPosting",
      headline: c.text,
      articleBody: c.text,
      datePublished: match.date,
      position: index + 1,
    })),
  };

  const filteredCommentaries =
    filterType === "all"
      ? commentary
      : commentary.filter((c) => {
          if (filterType === "shot") {
            return c.type.includes("shot");
          }
          return c.type === filterType || c.type.includes(filterType);
        });

  const getCommentaryStyle = (type: string, team?: string) => {
    if (type === "goal" || type.includes("goal")) {
      return "border-l-4 border-l-[#04453f] bg-green-50 shadow-sm";
    }
    if (
      type.includes("card") ||
      type === "yellow_card" ||
      type === "red_card"
    ) {
      return "border-l-4 border-l-yellow-500 bg-yellow-50";
    }
    if (type === "var") return "border-l-4 border-l-purple-500 bg-purple-50";
    if (type.includes("substitution") || type === "subst")
      return "border-l-4 border-l-blue-500 bg-blue-50";
    if (type.includes("shot")) return "border-l-4 border-l-blue-300 bg-blue-50";
    if (type.includes("foul")) return "border-l-4 border-l-red-300 bg-red-50";
    return "border-l-4 border-l-gray-300 bg-white";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      goal: "⚽ " + t("matchCommentary.filter.goals"),
      yellow_card: "🟨 " + t("matchCommentary.filter.yellowCard"),
      red_card: "🟥 " + t("matchCommentary.filter.redCard"),
      substitution: "🔄 " + t("matchCommentary.filter.substitution"),
      subst: "🔄 " + t("matchCommentary.filter.substitution"),
      var: "📺 VAR",
      shot_on_target: "🎯 " + t("matchCommentary.filter.shotOnTarget"),
      shot_off_target: "📋 " + t("matchCommentary.filter.shotOffTarget"),
      shot_blocked: "🚫 " + t("matchCommentary.filter.shotBlocked"),
      corner_kick: "🚩 " + t("matchCommentary.filter.corner"),
      foul: "⚠️ " + t("matchCommentary.filter.foul"),
    };
    return labels[type] || type.replace(/_/g, " ");
  };

  const currentMinute = match.status.toLowerCase().includes("finished")
    ? "FT"
    : match.statusDetail;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SportsEvent Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventSchema) }}
      />
      {/* LiveBlogPosting Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(liveBlogSchema) }}
      />
      <Header />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 pt-header min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-5" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-[#04453f] transition-colors">
                  {t("common.home")}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-300">/</span>
                <Link
                  href="/category/can-2025"
                  className="hover:text-[#04453f] transition-colors"
                >
                  {match.competition}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-gray-300">/</span>
                <span className="text-gray-900 font-medium">
                  {t("matchCommentary.breadcrumb")}
                </span>
              </li>
            </ol>
          </nav>

          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8 text-[#04453f] hover:text-[#022a27] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{t("common.backToHome")}</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Commentary Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Match Header */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-br from-[#04453f] via-[#022a27] to-[#04453f] text-white p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {isLive ? (
                        <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full animate-pulse shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                          <span className="text-xs font-medium uppercase tracking-wide">
                            {t("matchCommentary.live")}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-gray-700 px-3 py-1.5 rounded-full">
                          <span className="text-xs font-medium uppercase tracking-wide">
                            {match.status}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-gray-300 font-normal">
                        {new Date(match.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200">
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm font-medium hidden sm:inline">
                        {t("common.share")}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="text-center flex-1">
                      <div className="w-20 h-20 mx-auto mb-3 relative transform transition-transform hover:scale-110">
                        <Image
                          src={match.teams.home.logo}
                          alt={getTeamName(
                            match.teams.home.nameKey,
                            match.teams.home.name
                          )}
                          fill
                          className="object-contain drop-shadow-xl"
                        />
                      </div>
                      <h3 className="text-base font-semibold">
                        {getTeamName(
                          match.teams.home.nameKey,
                          match.teams.home.name
                        )}
                      </h3>
                    </div>

                    {/* Score */}
                    <div className="text-center px-8">
                      <div className="text-6xl font-bold flex items-center gap-4 tracking-tight">
                        <span>{match.score.home}</span>
                        <span className="text-3xl text-gray-400">-</span>
                        <span>{match.score.away}</span>
                      </div>
                      <div className="mt-3 text-base font-medium text-[#9DFF20]">
                        {currentMinute}
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="text-center flex-1">
                      <div className="w-20 h-20 mx-auto mb-3 relative transform transition-transform hover:scale-110">
                        <Image
                          src={match.teams.away.logo}
                          alt={getTeamName(
                            match.teams.away.nameKey,
                            match.teams.away.name
                          )}
                          fill
                          className="object-contain drop-shadow-xl"
                        />
                      </div>
                      <h3 className="text-base font-semibold">
                        {getTeamName(
                          match.teams.away.nameKey,
                          match.teams.away.name
                        )}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commentary Filter */}
              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    {t("matchCommentary.filterLabel")}
                  </span>
                  {["all", "goal", "yellow_card", "shot", "foul"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        filterType === type
                          ? "bg-[#04453f] text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {type === "all"
                        ? t("matchCommentary.filter.all")
                        : getTypeLabel(type)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-Match Analysis Section - Show prominently when match is upcoming */}
              {match.matchType === 'upcoming' && commentary.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 via-lime-50 to-green-50 rounded-xl shadow-lg p-4 sm:p-6 border-2 border-[#9DFF20]/30">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#04453f] to-[#022a27] text-white rounded-full text-sm font-semibold shadow-md">
                      <span>📊</span>
                      <span>{t("can2025.match.preMatchAnalysis")}</span>
                    </div>
                    <span className="text-xs text-[#04453f] font-medium">
                      {t("can2025.match.generatedAt")} {new Date(matchData.preMatchAnalysis?.generatedAt || '').toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-[#04453f]/80 mb-4">
                    {t("can2025.match.analysisDescription")}
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    {commentary.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-[#9DFF20]/20 hover:border-[#9DFF20]/40 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{item.icon}</span>
                          <span className="text-xs font-semibold text-[#04453f] uppercase tracking-wide">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commentary Timeline */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#04453f]" />
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {match.matchType === 'upcoming' ? 'Match Preview' : t("matchCommentary.commentaryTitle")}
                    </h2>
                  </div>
                  {commentary.length > 0 && commentary[0]?.source === 'ai' && match.matchType !== 'upcoming' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-medium shadow-sm">
                      <span className="animate-pulse">🤖</span>
                      <span>AI-Powered</span>
                    </div>
                  )}
                </div>

                {/* Show message if no commentary available */}
                {filteredCommentaries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-lime-100 mb-4">
                      <Clock className="h-8 w-8 text-[#04453f]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {match.matchType === 'upcoming' ? t("can2025.match.comingSoon") : t("matchCommentary.notStarted")}
                    </h3>
                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                      {match.matchType === 'upcoming'
                        ? t("can2025.match.comingSoonDescription")
                        : t("matchCommentary.notStartedDescription")
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredCommentaries.map((commentary, index) => {
                    const isGoal =
                      commentary.type === "goal" ||
                      commentary.type.includes("goal");
                    const isKeyEvent =
                      commentary.type === "goal" ||
                      commentary.type.includes("goal") ||
                      commentary.type.includes("card") ||
                      commentary.type === "subst" ||
                      commentary.type.includes("substitution");
                    const nextCommentary = filteredCommentaries[index + 1];
                    const nextIsKeyEvent =
                      nextCommentary &&
                      (nextCommentary.type === "goal" ||
                        nextCommentary.type.includes("goal") ||
                        nextCommentary.type.includes("card") ||
                        nextCommentary.type === "subst" ||
                        nextCommentary.type.includes("substitution"));
                    return (
                      <React.Fragment key={index}>
                        <div
                          className={`rounded-lg p-3 sm:p-4 transition-all duration-300 ${getCommentaryStyle(
                            commentary.type,
                            commentary.team
                          )} ${
                            isGoal
                              ? "hover:shadow-lg"
                              : isKeyEvent
                              ? "hover:shadow-lg"
                              : "hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            {/* Player Image or Icon */}
                            {commentary.playerImage ? (
                              <div
                                className={`relative flex-shrink-0 ${
                                  isGoal
                                    ? "w-14 h-14 sm:w-16 sm:h-16"
                                    : "w-12 h-12 sm:w-14 sm:h-14"
                                }`}
                              >
                                <Image
                                  src={commentary.playerImage}
                                  alt={commentary.playerName || "Player"}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <div
                                className={`flex-shrink-0 flex items-center justify-center ${
                                  isGoal
                                    ? "w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl"
                                    : "w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl opacity-60"
                                }`}
                              >
                                {commentary.icon}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                <span className="inline-flex items-center px-2.5 py-1 bg-gray-800 text-white rounded-md text-xs font-medium">
                                  {commentary.time}
                                </span>
                                {commentary.playerName && (
                                  <span className="inline-flex items-center px-2.5 py-1 bg-[#04453f] text-white rounded-md text-xs font-medium">
                                    {commentary.playerName}
                                  </span>
                                )}
                                {isGoal && (
                                  <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-[#04453f] to-[#022a27] text-white rounded-lg text-xs sm:text-sm font-bold shadow-md animate-pulse">
                                    ⚽ GOAL!
                                  </span>
                                )}
                              </div>
                              <p
                                className={`leading-relaxed mb-2 ${
                                  isGoal
                                    ? "text-sm sm:text-base font-semibold text-gray-900"
                                    : "text-sm sm:text-[15px] text-gray-800"
                                }`}
                              >
                                {commentary.text}
                              </p>
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500">
                                {commentary.team && (
                                  <>
                                    <span className="font-medium">
                                      {commentary.team}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                  </>
                                )}
                                <span className="capitalize">
                                  {commentary.type.replace(/_/g, " ")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {isKeyEvent && nextIsKeyEvent && (
                          <div className="relative py-2 sm:py-3">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-200"></div>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Stats & Info */}
            <div className="space-y-6">
              {/* Live Info */}
              <div className="bg-gradient-to-br from-[#04453f] to-[#022a27] rounded-xl shadow-lg p-6 text-white border border-green-800/20">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">
                    {t("matchCommentary.information")}
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-white/70">
                      {t("matchCommentary.viewers")}
                    </span>
                    <span className="font-semibold text-white">
                      {viewers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-white/70">
                      {t("matchCommentary.lastUpdate")}
                    </span>
                    <span className="font-semibold text-white">
                      {lastUpdate.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-white/70">
                      {t("matchCommentary.status")}
                    </span>
                    <span className="font-semibold text-white">
                      {match.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-white/70">
                      {t("matchCommentary.minute")}
                    </span>
                    <span className="font-semibold text-white">
                      {match.statusDetail}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-white/70">Score</span>
                    <span className="font-semibold text-white text-base">
                      {match.score.home} - {match.score.away}
                    </span>
                  </div>
                  {match.venue && (
                    <div className="flex items-center justify-between py-2 border-t border-white/10 pt-3">
                      <span className="text-white/70">
                        {t("matchCommentary.venue")}
                      </span>
                      <span className="font-semibold text-white text-right max-w-[60%]">
                        {match.venue}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Match Stats Summary */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="h-5 w-5 text-[#04453f]" />
                  <h3 className="font-semibold text-lg text-gray-900">
                    {t("matchCommentary.summary")}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">
                      {t("matchCommentary.stats.goals")}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {
                        commentary.filter(
                          (c) =>
                            c.type === "goal" &&
                            c.team?.includes(match.teams.home.name)
                        ).length
                      }{" "}
                      -{" "}
                      {
                        commentary.filter(
                          (c) =>
                            c.type === "goal" &&
                            c.team?.includes(match.teams.away.name)
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">
                      {t("matchCommentary.stats.substitutions")}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {commentary.filter((c) => c.type === "subst").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">
                      {t("matchCommentary.stats.cards")}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {
                        commentary.filter((c) => c.type.includes("card"))
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-600">VAR</span>
                    <span className="font-semibold text-gray-900">
                      {commentary.filter((c) => c.type === "var").length}
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
