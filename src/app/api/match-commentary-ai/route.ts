import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map ESPN team names to translation keys
const teamNameMap: Record<string, string> = {
  "Morocco": "morocco",
  "Comoros": "comoros",
  "Mali": "mali",
  "South Africa": "southAfrica",
  "Zambia": "zambia",
  "Egypt": "egypt",
  "Angola": "angola",
  "Zimbabwe": "zimbabwe",
  "Senegal": "senegal",
  "Cameroon": "cameroon",
  "DR Congo": "drCongo",
  "Guinea": "guinea",
  "Tunisia": "tunisia",
  "Tanzania": "tanzania",
  "Mauritania": "mauritania",
  "Gambia": "gambia",
  "Ivory Coast": "ivoryCoast",
  "Gabon": "gabon",
  "Equatorial Guinea": "equatorialGuinea",
  "Mozambique": "mozambique",
  "Nigeria": "nigeria",
  "Ghana": "ghana",
  "Benin": "benin",
  "Botswana": "botswana",
  "Algeria": "algeria",
  "Burkina Faso": "burkinaFaso",
  "Cape Verde": "capeVerde",
  "Sudan": "sudan",
  "Uganda": "uganda",
};

// Fetch enhanced match commentary with AI
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';

    // Fetch current matches from ESPN API
    const scoreboardResponse = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard",
      { next: { revalidate: 30 } } // Cache for 30 seconds
    );

    if (!scoreboardResponse.ok) {
      throw new Error("Failed to fetch scoreboard from ESPN");
    }

    const scoreboardData = await scoreboardResponse.json();

    // Get the first event (match)
    const events = scoreboardData.events || [];
    if (events.length === 0) {
      // No matches available, return empty state
      return NextResponse.json({
        success: false,
        error: "No matches available",
        match: null,
        commentary: [],
        preMatchAnalysis: null,
      });
    }

    // Get the first match (or you can filter for live matches)
    const event = events[0];
    const competition = event.competitions?.[0];

    if (!competition) {
      throw new Error("No competition data available");
    }

    const homeTeam = competition.competitors.find((c: any) => c.homeAway === "home");
    const awayTeam = competition.competitors.find((c: any) => c.homeAway === "away");
    const matchStatus = competition.status.type.state; // 'pre', 'in', 'post'

    // Fetch match details and play-by-play
    const eventId = event.id;

    // Transform ESPN data to our format
    const matchData: {
      success: boolean;
      language: string;
      match: any;
      commentary: any[];
      preMatchAnalysis: any;
      sources: any;
    } = {
      success: true,
      language: locale,
      match: {
        eventId: event.id,
        teams: {
          home: {
            name: homeTeam.team.displayName,
            nameKey: teamNameMap[homeTeam.team.displayName] || homeTeam.team.displayName.toLowerCase(),
            logo: homeTeam.team.logo || `https://flagcdn.com/w80/${homeTeam.team.abbreviation.toLowerCase()}.png`,
          },
          away: {
            name: awayTeam.team.displayName,
            nameKey: teamNameMap[awayTeam.team.displayName] || awayTeam.team.displayName.toLowerCase(),
            logo: awayTeam.team.logo || `https://flagcdn.com/w80/${awayTeam.team.abbreviation.toLowerCase()}.png`,
          },
        },
        score: {
          home: parseInt(homeTeam.score) || 0,
          away: parseInt(awayTeam.score) || 0,
        },
        status: competition.status.type.description || "Scheduled",
        statusDetail: competition.status.displayClock || "0'",
        date: competition.date,
        competition: scoreboardData.leagues?.[0]?.name || "CAN 2025",
        venue: competition.venue?.fullName || "",
        city: competition.venue?.address?.city || "",
        matchType: matchStatus === "post" ? "recent" : matchStatus === "in" ? "live" : "upcoming",
      },
      commentary: [],
      preMatchAnalysis: null,
      sources: {
        espn: `https://www.espn.com/soccer/match/_/gameId/${eventId}`,
      },
    };

    // If match is live or completed, fetch AI commentary from Supabase
    if (matchStatus === 'in' || matchStatus === 'post') {
      const { data: aiCommentary } = await supabase
        .from('match_commentary_ai')
        .select('*')
        .eq('match_id', eventId)
        .eq('locale', locale)
        .order('time_seconds', { ascending: false });

      if (aiCommentary && aiCommentary.length > 0) {
        // Convert AI commentary to expected format
        const formattedAICommentary = aiCommentary.map((c: any) => ({
          time: c.time,
          timeSeconds: c.time_seconds,
          text: c.text,
          type: c.type,
          team: c.team || "",
          icon: c.icon || "⚽",
          playerName: c.player_name || "",
          playerImage: c.player_image || "",
          isScoring: c.is_scoring || false,
          source: 'ai', // Mark as AI-generated
        }));

        matchData.commentary = formattedAICommentary;
      } else {
        // Fallback to ESPN play-by-play if no AI commentary
        const playByPlayResponse = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/playbyplay?event=${eventId}`,
          { next: { revalidate: 30 } }
        );

        if (playByPlayResponse.ok) {
          const playByPlayData = await playByPlayResponse.json();

          if (playByPlayData && playByPlayData.plays) {
            matchData.commentary = playByPlayData.plays
              .map((play: any) => ({
                time: play.clock?.displayValue || play.period?.displayValue || "0'",
                timeSeconds: play.clock?.value || 0,
                text: play.text || "",
                type: play.type?.text?.toLowerCase().replace(/\s+/g, "_") || "commentary",
                team: play.team?.displayName || "",
                icon: getIconForPlayType(play.type?.text || ""),
                playerName: play.participants?.[0]?.athlete?.displayName || "",
                playerImage: play.participants?.[0]?.athlete?.headshot?.href || "",
                isScoring: play.scoringPlay || false,
                source: 'espn',
              }))
              .reverse();
          }
        }
      }
    }

    // If match hasn't started, fetch pre-match analysis
    if (matchStatus === 'pre') {
      const { data: preMatch } = await supabase
        .from('match_prematch_analysis')
        .select('*')
        .eq('match_id', eventId)
        .eq('locale', locale)
        .single();

      if (preMatch) {
        matchData.preMatchAnalysis = {
          headToHead: preMatch.head_to_head,
          recentForm: preMatch.recent_form,
          keyPlayers: preMatch.key_players,
          tacticalPreview: preMatch.tactical_preview,
          prediction: preMatch.prediction,
          homeFormation: preMatch.home_formation || null,
          awayFormation: preMatch.away_formation || null,
          homeLineup: preMatch.home_lineup || null,
          awayLineup: preMatch.away_lineup || null,
          homeSubstitutes: preMatch.home_substitutes || null,
          awaySubstitutes: preMatch.away_substitutes || null,
          generatedAt: preMatch.created_at,
        };
      }

      // Generate pre-match commentary entries for display
      if (preMatch) {
        const preMatchCommentary = [];

        // Add tactical preview
        if (preMatch.tactical_preview) {
          preMatchCommentary.push({
            time: "Pre",
            timeSeconds: -100,
            text: preMatch.tactical_preview,
            type: "analysis",
            icon: "📋",
            isScoring: false,
            source: 'ai',
          });
        }

        // Add head-to-head
        if (preMatch.head_to_head) {
          preMatchCommentary.push({
            time: "H2H",
            timeSeconds: -200,
            text: preMatch.head_to_head,
            type: "stats",
            icon: "📊",
            isScoring: false,
            source: 'ai',
          });
        }

        // Add recent form
        if (preMatch.recent_form) {
          preMatchCommentary.push({
            time: "Form",
            timeSeconds: -300,
            text: preMatch.recent_form,
            type: "stats",
            icon: "📈",
            isScoring: false,
            source: 'ai',
          });
        }

        // Add key players
        if (preMatch.key_players) {
          preMatchCommentary.push({
            time: "⭐",
            timeSeconds: -400,
            text: preMatch.key_players,
            type: "preview",
            icon: "⭐",
            isScoring: false,
            source: 'ai',
          });
        }

        matchData.commentary = preMatchCommentary;
      }
    }

    return NextResponse.json(matchData);
  } catch (error) {
    console.error("Error fetching match data:", error);

    // Return fallback data
    return NextResponse.json({
      success: false,
      error: "Failed to fetch match data",
      match: null,
      commentary: [],
      preMatchAnalysis: null,
    });
  }
}

// Helper function to get icon for play type
function getIconForPlayType(type: string): string {
  const typeLower = type.toLowerCase();

  if (typeLower.includes("goal")) return "⚽";
  if (typeLower.includes("yellow")) return "🟨";
  if (typeLower.includes("red")) return "🟥";
  if (typeLower.includes("substitution")) return "🔄";
  if (typeLower.includes("corner")) return "🚩";
  if (typeLower.includes("shot")) return "🎯";
  if (typeLower.includes("foul")) return "⚠️";
  if (typeLower.includes("var")) return "📺";
  if (typeLower.includes("whistle") || typeLower.includes("end") || typeLower.includes("start")) return "🏁";

  return "⚽";
}
