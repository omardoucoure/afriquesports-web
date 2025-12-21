import { NextResponse } from "next/server";

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

// Fetch live AFCON match data from ESPN API
export async function GET() {
  try {
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

    // Fetch match details and play-by-play
    const eventId = event.id;
    const playByPlayResponse = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/playbyplay?event=${eventId}`,
      { next: { revalidate: 30 } }
    );

    let playByPlayData: any = null;
    if (playByPlayResponse.ok) {
      playByPlayData = await playByPlayResponse.json();
    }

    // Transform ESPN data to our format
    const matchData = {
      success: true,
      language: "fr",
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
        matchType: competition.status.type.state === "post" ? "recent" : "upcoming",
      },
      commentary: [],
      sources: {
        espn: `https://www.espn.com/soccer/match/_/gameId/${eventId}`,
      },
    };

    // Process play-by-play data if available
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
        }))
        .reverse(); // Reverse to show most recent first
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

// OLD MOCK DATA BELOW - KEPT FOR REFERENCE BUT NOT USED
/*
const mockMatchData = {
    success: true,
    language: "fr",
    match: {
      eventId: "can2025-match-morocco-mali",
      teams: {
        home: {
          name: "Morocco",
          nameKey: "morocco",
          logo: "https://flagcdn.com/w80/ma.png",
        },
        away: {
          name: "Mali",
          nameKey: "mali",
          logo: "https://flagcdn.com/w80/ml.png",
        },
      },
      score: {
        home: 2,
        away: 1,
      },
      status: "Match terminé",
      statusDetail: "90'",
      date: "2025-01-14T20:00:00Z",
      competition: "CAN 2025",
      stage: "Groupe A",
      group: "A",
      venue: "Stade Mohammed V",
      city: "Casablanca",
      matchType: "recent",
    },
    commentary: [
      {
        time: "90'",
        timeSeconds: 5400,
        text: "Coup de sifflet final ! Le Maroc bat le Mali 2-1 dans un match intense du Groupe A de la CAN 2025.",
        type: "whistle",
        icon: "🏁",
        isScoring: false,
      },
      {
        time: "85'",
        timeSeconds: 5100,
        text: "Le Mali tente le tout pour le tout. Pression offensive maximale sur la défense marocaine.",
        type: "attack",
        team: "Mali",
        icon: "⚔️",
        isScoring: false,
      },
      {
        time: "78'",
        timeSeconds: 4680,
        text: "CARTON JAUNE pour Hamari Traoré (Mali) après une faute sur Hakimi.",
        type: "yellow_card",
        team: "Mali",
        playerName: "Hamari Traoré",
        icon: "🟨",
        isScoring: false,
      },
      {
        time: "72'",
        timeSeconds: 4320,
        text: "BUT POUR LE MAROC ! Youssef En-Nesyri reprend victorieusement un centre de Hakimi ! Le Maroc reprend l'avantage 2-1 !",
        type: "goal",
        team: "Morocco",
        playerName: "Youssef En-Nesyri",
        playerImage: "https://img.a.transfermarkt.technology/portrait/header/148455-1664866814.jpg",
        icon: "⚽",
        isScoring: true,
      },
      {
        time: "68'",
        timeSeconds: 4080,
        text: "Changement pour le Maroc : Entrée de Sofiane Boufal, sortie d'Amine Harit.",
        type: "substitution",
        team: "Morocco",
        playerName: "Sofiane Boufal",
        icon: "🔄",
        isScoring: false,
      },
      {
        time: "62'",
        timeSeconds: 3720,
        text: "BUT POUR LE MALI ! Adama Traoré égalise d'une superbe frappe de l'extérieur de la surface ! 1-1 !",
        type: "goal",
        team: "Mali",
        playerName: "Adama Traoré",
        icon: "⚽",
        isScoring: true,
      },
      {
        time: "58'",
        timeSeconds: 3480,
        text: "Occasion manquée pour le Mali ! El Bilal Touré tire au-dessus après un bon mouvement collectif.",
        type: "shot_off_target",
        team: "Mali",
        icon: "📋",
        isScoring: false,
      },
      {
        time: "54'",
        timeSeconds: 3240,
        text: "Corner pour le Maroc après un bon arrêt du gardien malien.",
        type: "corner_kick",
        team: "Morocco",
        icon: "🚩",
        isScoring: false,
      },
      {
        time: "46'",
        timeSeconds: 2760,
        text: "Début de la seconde mi-temps ! Le Mali relance le jeu.",
        type: "whistle",
        icon: "⏱️",
        isScoring: false,
      },
      {
        time: "45+2'",
        timeSeconds: 2820,
        text: "Mi-temps ! Le Maroc mène 1-0 grâce au but d'Achraf Hakimi.",
        type: "whistle",
        icon: "⏸️",
        isScoring: false,
      },
      {
        time: "42'",
        timeSeconds: 2520,
        text: "CARTON JAUNE pour Azzedine Ounahi (Maroc) après une faute sur Yves Bissouma.",
        type: "yellow_card",
        team: "Morocco",
        playerName: "Azzedine Ounahi",
        icon: "🟨",
        isScoring: false,
      },
      {
        time: "35'",
        timeSeconds: 2100,
        text: "Tir cadré de Hakim Ziyech bien capté par le gardien malien.",
        type: "shot_on_target",
        team: "Morocco",
        playerName: "Hakim Ziyech",
        icon: "🎯",
        isScoring: false,
      },
      {
        time: "28'",
        timeSeconds: 1680,
        text: "BUT POUR LE MAROC ! Achraf Hakimi ouvre le score d'une sublime frappe enroulée dans la lucarne ! 1-0 pour les Lions de l'Atlas !",
        type: "goal",
        team: "Morocco",
        playerName: "Achraf Hakimi",
        playerImage: "https://img.a.transfermarkt.technology/portrait/header/326031-1694611604.jpg",
        icon: "⚽",
        isScoring: true,
      },
      {
        time: "22'",
        timeSeconds: 1320,
        text: "Le Maroc domine la possession (65%) mais le Mali reste dangereux en contre-attaque.",
        type: "stats",
        icon: "📊",
        isScoring: false,
      },
      {
        time: "18'",
        timeSeconds: 1080,
        text: "Faute dangereuse pour le Maroc à 20 mètres du but. Hakim Ziyech va tirer.",
        type: "foul",
        team: "Mali",
        icon: "⚠️",
        isScoring: false,
      },
      {
        time: "12'",
        timeSeconds: 720,
        text: "Première occasion pour le Mali ! Tir de Moussa Djenepo repoussé par Yassine Bounou.",
        type: "shot_on_target",
        team: "Mali",
        playerName: "Moussa Djenepo",
        icon: "🎯",
        isScoring: false,
      },
      {
        time: "8'",
        timeSeconds: 480,
        text: "Le Maroc prend possession du ballon et cherche à construire patiemment.",
        type: "possession",
        team: "Morocco",
        icon: "⚽",
        isScoring: false,
      },
      {
        time: "3'",
        timeSeconds: 180,
        text: "Première tentative marocaine ! Youssef En-Nesyri force le gardien à la détente.",
        type: "shot_on_target",
        team: "Morocco",
        playerName: "Youssef En-Nesyri",
        icon: "🎯",
        isScoring: false,
      },
      {
        time: "1'",
        timeSeconds: 60,
        text: "Coup d'envoi ! Le match commence au Stade Mohammed V de Casablanca.",
        type: "whistle",
        icon: "🏁",
        isScoring: false,
      },
    ],
    sources: {
      espn: "https://www.espn.com/soccer/match/_/gameId/748214",
    },
  };

  return NextResponse.json(mockMatchData);
}
*/
