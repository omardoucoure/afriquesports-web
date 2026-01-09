/**
 * Match Schema Generation for SEO
 *
 * Generates comprehensive JSON-LD schema markup for AFCON 2025 live match pages:
 * - LiveBlogPosting: Enables red "LIVE" badge in Google search
 * - SportsEvent: Rich results with match details
 * - BroadcastEvent: Eligibility for Google Indexing API
 * - BreadcrumbList: Navigation schema
 */

const SITE_URL = "https://www.afriquesports.net";

export interface MatchData {
  id: string;
  homeTeam: {
    name: string;
    logo: string;
    score?: number;
  };
  awayTeam: {
    name: string;
    logo: string;
    score?: number;
  };
  date: string; // ISO 8601
  status: 'scheduled' | 'live' | 'completed';
  statusDetail?: string; // e.g., "45'+2" for match minute
  venue?: {
    name: string;
    city: string;
    country: string;
  };
  competition: string;
  stage?: string;
  commentary?: Array<{
    id: number;
    time: string;
    text: string;
    type: string;
    icon: string;
    timestamp: string;
    is_scoring: boolean;
    player_name?: string;
    team?: 'home' | 'away';
  }>;
  featuredImage?: string;
  lastModified?: string;
}

/**
 * Main function to generate all schemas for a match page
 */
export function generateMatchSchemas(match: MatchData, locale: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      generateLiveBlogPostingSchema(match, locale),
      generateSportsEventSchema(match, locale),
      ...(match.status === 'live' || match.status === 'scheduled'
        ? [generateBroadcastEventSchema(match, locale)]
        : []
      ),
      generateMatchBreadcrumbSchema(match, locale),
    ]
  };
}

/**
 * LiveBlogPosting schema - Enables red "LIVE" badge in Google search
 */
function generateLiveBlogPostingSchema(match: MatchData, locale: string) {
  const matchUrl = `${SITE_URL}/${locale}/can-2025/match/${match.id}`;
  const homeScore = match.homeTeam.score ?? 0;
  const awayScore = match.awayTeam.score ?? 0;

  // Dynamic headline based on match status
  const headline = match.status === 'live'
    ? `🔴 LIVE: ${match.homeTeam.name} ${homeScore}-${awayScore} ${match.awayTeam.name} - ${match.competition}`
    : match.status === 'completed'
    ? `${match.homeTeam.name} ${homeScore}-${awayScore} ${match.awayTeam.name} - ${match.competition}`
    : `${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.competition}`;

  const description = match.status === 'live'
    ? `Suivez en direct ${match.homeTeam.name} vs ${match.awayTeam.name} pour la ${match.competition}. Score en temps réel, commentaires et statistiques.`
    : match.status === 'completed'
    ? `${match.homeTeam.name} a affronté ${match.awayTeam.name} ${homeScore}-${awayScore} pour la ${match.competition}. Résumé du match, buts et analyses.`
    : `Suivez ${match.homeTeam.name} contre ${match.awayTeam.name} pour la ${match.competition}. Analyses d'avant-match, compositions probables et prédictions.`;

  const liveBlogPosting: any = {
    "@type": "LiveBlogPosting",
    "@id": `${matchUrl}#liveblog`,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": matchUrl
    },
    "headline": headline,
    "description": description,
    "image": {
      "@type": "ImageObject",
      "url": match.featuredImage || `${SITE_URL}/api/og-can2025?home=${encodeURIComponent(match.homeTeam.name)}&away=${encodeURIComponent(match.awayTeam.name)}&score=${homeScore}-${awayScore}&live=${match.status === 'live'}`,
      "width": 1200,
      "height": 630
    },
    "datePublished": match.date,
    "dateModified": match.lastModified || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "Afrique Sports",
      "url": SITE_URL
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`
    },
    "about": {
      "@id": `${matchUrl}#event`
    }
  };

  // Add coverage times for live and scheduled matches
  if (match.status === 'live' || match.status === 'scheduled') {
    const matchDate = new Date(match.date);
    const coverageStart = new Date(matchDate.getTime() - 30 * 60 * 1000); // 30 min before
    const coverageEnd = new Date(matchDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours after

    liveBlogPosting.coverageStartTime = coverageStart.toISOString();
    liveBlogPosting.coverageEndTime = coverageEnd.toISOString();
  }

  // Add live commentary updates if available
  if (match.commentary && match.commentary.length > 0) {
    liveBlogPosting.liveBlogUpdate = match.commentary.slice(0, 10).map(event => ({
      "@type": "BlogPosting",
      "headline": `${event.icon} ${event.type} - ${event.time}`,
      "datePublished": event.timestamp,
      "articleBody": event.text
    }));
  }

  return liveBlogPosting;
}

/**
 * SportsEvent schema - Rich results with match details
 */
function generateSportsEventSchema(match: MatchData, locale: string) {
  const matchUrl = `${SITE_URL}/${locale}/can-2025/match/${match.id}`;
  const homeScore = match.homeTeam.score ?? 0;
  const awayScore = match.awayTeam.score ?? 0;

  // Determine event status
  const eventStatus = match.status === 'completed'
    ? "https://schema.org/EventCompleted"
    : match.status === 'live'
    ? "https://schema.org/EventScheduled" // Keep as scheduled during live (per schema.org guidelines)
    : "https://schema.org/EventScheduled";

  const sportsEvent: any = {
    "@type": "SportsEvent",
    "@id": `${matchUrl}#event`,
    "name": `${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.competition}`,
    "description": `${match.competition}${match.stage ? ` - ${match.stage}` : ''} match between ${match.homeTeam.name} and ${match.awayTeam.name}`,
    "url": matchUrl,
    "sport": "Football",
    "startDate": match.date,
    "eventStatus": eventStatus,
    "image": `${SITE_URL}/api/og-can2025?home=${encodeURIComponent(match.homeTeam.name)}&away=${encodeURIComponent(match.awayTeam.name)}&score=${homeScore}-${awayScore}&live=${match.status === 'live'}`,
    "homeTeam": {
      "@type": "SportsTeam",
      "name": match.homeTeam.name,
      "sport": "Football",
      "logo": match.homeTeam.logo,
      "memberOf": {
        "@type": "SportsOrganization",
        "name": "Confederation of African Football"
      }
    },
    "awayTeam": {
      "@type": "SportsTeam",
      "name": match.awayTeam.name,
      "sport": "Football",
      "logo": match.awayTeam.logo,
      "memberOf": {
        "@type": "SportsOrganization",
        "name": "Confederation of African Football"
      }
    },
    "competitor": [
      {
        "@type": "SportsTeam",
        "name": match.homeTeam.name
      },
      {
        "@type": "SportsTeam",
        "name": match.awayTeam.name
      }
    ],
    "organizer": {
      "@type": "SportsOrganization",
      "name": "Confederation of African Football",
      "url": "https://www.cafonline.com"
    },
    "superEvent": {
      "@type": "SportsEvent",
      "name": "Africa Cup of Nations 2025",
      "alternateName": "AFCON 2025",
      "description": "The 35th edition of the Africa Cup of Nations, the premier international football tournament in Africa, featuring 24 national teams competing for continental glory.",
      "url": `${SITE_URL}/${locale}/can-2025`,
      "image": `${SITE_URL}/images/afcon-2025-logo.png`,
      "startDate": "2025-12-21T00:00:00Z",
      "endDate": "2026-01-18T00:00:00Z",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": {
        "@type": "Country",
        "name": "Morocco",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "MA"
        }
      },
      "organizer": {
        "@type": "SportsOrganization",
        "name": "Confederation of African Football",
        "url": "https://www.cafonline.com"
      },
      "performer": {
        "@type": "SportsOrganization",
        "name": "CAF Member National Teams",
        "memberOf": {
          "@type": "SportsOrganization",
          "name": "Confederation of African Football"
        }
      },
      "offers": {
        "@type": "Offer",
        "url": "https://www.cafonline.com/total-africa-cup-of-nations",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "MAD",
        "validFrom": "2025-10-01T00:00:00Z"
      }
    }
  };

  // Add venue (required by Google for SportsEvent)
  if (match.venue) {
    sportsEvent.location = {
      "@type": "StadiumOrArena",
      "name": match.venue.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": match.venue.city,
        "addressCountry": match.venue.country
      }
    };
  } else {
    // Default location for AFCON 2025 (hosted in Morocco)
    sportsEvent.location = {
      "@type": "StadiumOrArena",
      "name": "AFCON 2025 Stadium",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Morocco",
        "addressCountry": "MA"
      }
    };
  }

  // Add goal scorers as performers
  if (match.commentary && match.commentary.length > 0) {
    const goalScorers = match.commentary
      .filter(event => event.is_scoring && event.player_name)
      .map(event => {
        // Parse team from commentary text (more reliable than team field)
        const text = event.text || '';
        let teamName: string;

        // Look for "marque pour [Team]" pattern
        const marqueMatch = text.match(/marque pour ([^!.]+)/i);
        if (marqueMatch) {
          const teamInText = marqueMatch[1].trim();
          if (teamInText === match.homeTeam.name) {
            teamName = match.homeTeam.name;
          } else if (teamInText === match.awayTeam.name) {
            teamName = match.awayTeam.name;
          } else {
            // Fallback to checking text contains
            teamName = text.includes(match.homeTeam.name)
              ? match.homeTeam.name
              : match.awayTeam.name;
          }
        } else {
          // No "marque pour" pattern, use team field or text contains
          if (event.team === 'home') {
            teamName = match.homeTeam.name;
          } else if (event.team === 'away') {
            teamName = match.awayTeam.name;
          } else if (text.includes(match.homeTeam.name)) {
            teamName = match.homeTeam.name;
          } else if (text.includes(match.awayTeam.name)) {
            teamName = match.awayTeam.name;
          } else {
            teamName = match.homeTeam.name; // Default
          }
        }

        return {
          name: event.player_name!,
          team: teamName
        };
      });

    // Get unique scorers by name
    const uniqueScorers = Array.from(
      new Map(goalScorers.map(scorer => [scorer.name, scorer])).values()
    );

    if (uniqueScorers.length > 0) {
      sportsEvent.performer = uniqueScorers.map(scorer => ({
        "@type": "Person",
        "name": scorer.name,
        "memberOf": {
          "@type": "SportsTeam",
          "name": scorer.team
        }
      }));
    }
  }

  // Add end date if match is completed
  if (match.status === 'completed') {
    const matchDate = new Date(match.date);
    const endDate = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours
    sportsEvent.endDate = endDate.toISOString();
  }

  return sportsEvent;
}

/**
 * BroadcastEvent schema - Enables Google Indexing API eligibility
 * isLiveBroadcast is true when:
 * - Match is currently live (status === 'live')
 * - Match is scheduled but has live commentary (pre-match coverage started)
 */
function generateBroadcastEventSchema(match: MatchData, locale: string) {
  const matchUrl = `${SITE_URL}/${locale}/can-2025/match/${match.id}`;

  // Enable live broadcast when match is live OR when pre-match commentary exists
  const hasLiveCommentary = match.commentary && match.commentary.length > 0;
  const isLiveBroadcast = match.status === 'live' || (match.status === 'scheduled' && hasLiveCommentary);

  return {
    "@type": "BroadcastEvent",
    "name": `${match.homeTeam.name} vs ${match.awayTeam.name} - Live Coverage`,
    "isLiveBroadcast": isLiveBroadcast,
    "videoFormat": "application/vnd.apple.mpegURL",
    "startDate": match.date,
    "broadcastOfEvent": {
      "@id": `${matchUrl}#event`
    },
    "publishedOn": {
      "@type": "BroadcastService",
      "name": "Afrique Sports",
      "broadcastDisplayName": "Live Match Coverage"
    }
  };
}

/**
 * BreadcrumbList schema - Navigation breadcrumbs
 */
function generateMatchBreadcrumbSchema(match: MatchData, locale: string) {
  const matchUrl = `${SITE_URL}/${locale}/can-2025/match/${match.id}`;

  const breadcrumbLabels = {
    fr: {
      home: "Accueil",
      tournament: "CAN 2025",
      match: `${match.homeTeam.name} vs ${match.awayTeam.name}`
    },
    en: {
      home: "Home",
      tournament: "AFCON 2025",
      match: `${match.homeTeam.name} vs ${match.awayTeam.name}`
    },
    es: {
      home: "Inicio",
      tournament: "CAN 2025",
      match: `${match.homeTeam.name} vs ${match.awayTeam.name}`
    },
    ar: {
      home: "الرئيسية",
      tournament: "كأس أمم أفريقيا 2025",
      match: `${match.homeTeam.name} vs ${match.awayTeam.name}`
    }
  };

  const labels = breadcrumbLabels[locale as keyof typeof breadcrumbLabels] || breadcrumbLabels.fr;

  return {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": labels.home,
        "item": `${SITE_URL}/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": labels.tournament,
        "item": `${SITE_URL}/${locale}/can-2025`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": labels.match
      }
    ]
  };
}

/**
 * Helper: Convert ESPN match data to MatchData format
 */
export function espnToMatchData(espnMatch: any, commentary?: any[]): MatchData {
  const competition = espnMatch.competitions?.[0] || espnMatch.competition || {};
  const homeTeam = competition.competitors?.[0] || {};
  const awayTeam = competition.competitors?.[1] || {};
  const status = espnMatch.status || competition.status || {};

  // Determine match status
  let matchStatus: 'scheduled' | 'live' | 'completed' = 'scheduled';
  if (status.type?.completed) {
    matchStatus = 'completed';
  } else if (status.type?.state === 'in') {
    matchStatus = 'live';
  }

  return {
    id: espnMatch.id || espnMatch.event?.id,
    homeTeam: {
      name: homeTeam.team?.displayName || homeTeam.team?.name || 'TBD',
      logo: homeTeam.team?.logo || '',
      score: parseInt(homeTeam.score) || 0
    },
    awayTeam: {
      name: awayTeam.team?.displayName || awayTeam.team?.name || 'TBD',
      logo: awayTeam.team?.logo || '',
      score: parseInt(awayTeam.score) || 0
    },
    date: espnMatch.date || competition.date || new Date().toISOString(),
    status: matchStatus,
    statusDetail: status.type?.detail || status.displayClock,
    venue: competition.venue ? {
      name: competition.venue.fullName,
      city: competition.venue.address?.city || '',
      country: 'Morocco' // AFCON 2025 host
    } : undefined,
    competition: 'AFCON 2025',
    stage: competition.status?.type?.name,
    commentary: commentary,
    lastModified: new Date().toISOString()
  };
}
