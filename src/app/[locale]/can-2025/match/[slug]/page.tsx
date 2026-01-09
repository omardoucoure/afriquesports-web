import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { generateMatchSchemas, espnToMatchData, MatchData } from '@/lib/match-schema';
import {
  getMatchCommentary as fetchMatchCommentary,
  getYouTubeStream as fetchYouTubeStream,
  getPreMatchAnalysis as fetchPreMatchAnalysis,
} from '@/lib/mysql-match-db';
import {
  extractMatchIdFromSlug,
  generateMatchSlug,
  generateMatchUrl,
  isOldFormatSlug,
  generateMatchPath
} from '@/lib/match-url';
import MatchPageClient from '@/components/match/MatchPageClient';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/ui';

const SITE_URL = "https://www.afriquesports.net";

// ISR with 15-second revalidation for real-time updates
export const revalidate = 15;

/**
 * Fetch match data from ESPN API
 */
async function getMatchData(matchId: string): Promise<any | null> {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event=${matchId}`,
      {
        next: { revalidate: 15 }
      }
    );

    if (!response.ok) {
      console.error('ESPN API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching match data:', error);
    return null;
  }
}

/**
 * Fetch live commentary from ESPN API (with MySQL fallback)
 */
async function getMatchCommentary(matchId: string, locale: string): Promise<any[]> {
  try {
    // Fetch ESPN summary which includes commentary
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event=${matchId}`,
      { next: { revalidate: 15 } }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.commentary && data.commentary.length > 0) {
        // Transform ESPN commentary to match expected format
        // Reverse to show newest events first, then limit to 100 most recent
        return data.commentary.reverse().slice(0, 100).map((item: any, index: number) => {
          const time = item.time?.displayValue || '';
          const text = item.text || '';

          // Determine event type based on text content
          const textLower = text.toLowerCase();
          const isGoal = (textLower.includes('goal!') ||
                          (textLower.includes('scores') && !textLower.includes('saved')) ||
                          (textLower.startsWith('goal ') && !textLower.includes('attempt'))) &&
                         !textLower.includes('missed') &&
                         !textLower.includes('saved');
          const isYellowCard = textLower.includes('yellow card');
          const isRedCard = textLower.includes('red card');
          const isSubstitution = textLower.includes('substitution');
          const isPenalty = textLower.includes('penalty');
          const isVAR = textLower.includes('var') || textLower.includes('video assistant');

          // Determine icon based on event type
          let icon = '⚽';
          let type = 'general';

          if (isGoal) {
            icon = '⚽';
            type = 'goal';
          } else if (isPenalty && textLower.includes('missed')) {
            icon = '❌';
            type = 'penaltyMissed';
          } else if (isPenalty) {
            icon = '🎯';
            type = 'penaltyAwarded';
          } else if (isRedCard) {
            icon = '🟥';
            type = 'redCard';
          } else if (isYellowCard) {
            icon = '🟨';
            type = 'yellowCard';
          } else if (isSubstitution) {
            icon = '🔄';
            type = 'substitution';
          } else if (isVAR) {
            icon = '📺';
            type = 'varCheck';
          } else if (textLower.includes('corner')) {
            icon = '⚐';
            type = 'corner';
          } else if (textLower.includes('foul')) {
            icon = '🚫';
            type = 'foul';
          } else {
            icon = '▶';
            type = 'general';
          }

          return {
            id: `espn-${matchId}-${index}`,
            time: time,
            type: type,
            text: text,
            is_scoring: isGoal,
            icon: icon,
            team: null,
            player_name: null
          };
        });
      }
    }

    // Fallback to MySQL if ESPN has no commentary
    const data = await fetchMatchCommentary(matchId, locale);
    return data ? data.slice(0, 100) : [];
  } catch (error) {
    console.error('Error fetching commentary:', error);
    return [];
  }
}

/**
 * Fetch YouTube stream from MySQL
 */
async function getYouTubeStream(matchId: string): Promise<string | null> {
  try {
    const data = await fetchYouTubeStream(matchId);

    if (!data || !data.is_live) {
      return null;
    }

    return data.video_id || null;
  } catch (error) {
    console.error('Error fetching YouTube stream:', error);
    return null;
  }
}

/**
 * Fetch pre-match analysis from MySQL
 */
async function getPreMatchAnalysis(matchId: string, locale: string): Promise<any | null> {
  try {
    const data = await fetchPreMatchAnalysis(matchId, locale);
    return data || null;
  } catch (error) {
    console.error('Error fetching pre-match analysis:', error);
    return null;
  }
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;

  // Extract match ID from slug
  const matchId = extractMatchIdFromSlug(slug);
  const matchDataRaw = await getMatchData(matchId);

  if (!matchDataRaw || !matchDataRaw.header) {
    return {
      title: 'Match Not Found | Afrique Sports',
      robots: {
        index: false,
        follow: true
      }
    };
  }

  const competition = matchDataRaw.header.competitions[0];

  // Find actual home and away teams based on homeAway field
  const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home') || competition.competitors[0];
  const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away') || competition.competitors[1];

  const status = matchDataRaw.header.status;
  const homeScore = homeTeam.score || 0;
  const awayScore = awayTeam.score || 0;

  // Generate SEO-friendly slug
  const seoSlug = generateMatchSlug(
    homeTeam.team.displayName,
    awayTeam.team.displayName,
    matchId
  );

  // Determine match status (handle null status)
  const isLive = status?.type?.state === 'in';
  const isCompleted = status?.type?.completed || false;
  const isUpcoming = !isLive && !isCompleted;

  // Helper function to safely format date
  const formatMatchDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return '';

    try {
      return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Dynamic title based on match status
  let title: string;
  if (isLive) {
    title = `🔴 LIVE: ${homeTeam.team.displayName} ${homeScore}-${awayScore} ${awayTeam.team.displayName} | CAN 2025 | Afrique Sports`;
  } else if (isCompleted) {
    title = `${homeTeam.team.displayName} ${homeScore}-${awayScore} ${awayTeam.team.displayName} | CAN 2025 | Afrique Sports`;
  } else {
    const dateStr = formatMatchDate(matchDataRaw.header.date);
    const datePart = dateStr ? ` - ${dateStr}` : '';
    title = `${homeTeam.team.displayName} vs ${awayTeam.team.displayName}${datePart} | CAN 2025 | Afrique Sports`;
  }

  // Dynamic description based on match status
  let description: string;
  if (isLive) {
    description = `Suivez en direct ${homeTeam.team.displayName} vs ${awayTeam.team.displayName} pour la CAN 2025. Score en temps réel, commentaires et statistiques.`;
  } else if (isCompleted) {
    const result = homeScore > awayScore ? 'battu' : homeScore < awayScore ? 'perdu contre' : 'fait match nul avec';
    description = `${homeTeam.team.displayName} a ${result} ${awayTeam.team.displayName} ${homeScore}-${awayScore} pour la CAN 2025. Résumé du match, buts et analyses.`;
  } else {
    description = `Suivez ${homeTeam.team.displayName} contre ${awayTeam.team.displayName} pour la CAN 2025. Analyses d'avant-match, compositions probables et prédictions.`;
  }

  // Canonical URLs with SEO-friendly slugs
  const frenchUrl = generateMatchUrl(homeTeam.team.displayName, awayTeam.team.displayName, matchId, 'fr');
  const canonicalUrl = locale === 'fr' ? frenchUrl : generateMatchUrl(homeTeam.team.displayName, awayTeam.team.displayName, matchId, locale);

  // OG Image URL - use static endpoint that doesn't require ESPN API calls
  const matchTime = status?.displayClock || '';
  const ogImageUrl = `${SITE_URL}/api/og-can2025?home=${encodeURIComponent(homeTeam.team.displayName)}&away=${encodeURIComponent(awayTeam.team.displayName)}&score=${homeScore}-${awayScore}&live=${isLive}&time=${encodeURIComponent(matchTime)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'fr-FR': generateMatchUrl(homeTeam.team.displayName, awayTeam.team.displayName, matchId, 'fr'),
        'en-US': generateMatchUrl(homeTeam.team.displayName, awayTeam.team.displayName, matchId, 'en'),
        'es-ES': generateMatchUrl(homeTeam.team.displayName, awayTeam.team.displayName, matchId, 'es'),
        'ar-SA': generateMatchUrl(homeTeam.team.displayName, awayTeam.team.displayName, matchId, 'ar'),
        'x-default': canonicalUrl
      }
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'Afrique Sports',
      locale: locale === 'fr' ? 'fr_FR' : locale === 'en' ? 'en_US' : locale === 'es' ? 'es_ES' : 'ar_SA',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${homeTeam.team.displayName} vs ${awayTeam.team.displayName} - CAN 2025`
        }
      ],
      publishedTime: matchDataRaw.header.date,
      modifiedTime: new Date().toISOString()
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: '@afriquesports',
      site: '@afriquesports'
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large', // Critical for Google Discover
      'max-snippet': -1,
      'max-video-preview': -1
    },
    other: {
      'article:published_time': matchDataRaw.header.date,
      'article:modified_time': new Date().toISOString(),
      'article:section': 'CAN 2025',
      'article:tag': `${homeTeam.team.displayName}, ${awayTeam.team.displayName}, CAN 2025, AFCON 2025`
    }
  };
}

/**
 * Match page component with SEO schema and real-time updates
 */
export default async function MatchPage({
  params
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;

  // Extract match ID from slug
  const matchId = extractMatchIdFromSlug(slug);

  try {
    const t = await getTranslations({ locale });

    // Fetch match data, commentary, YouTube stream, and pre-match analysis in parallel
    const [matchDataRaw, commentary, youtubeStream, preMatchAnalysis] = await Promise.all([
      getMatchData(matchId),
      getMatchCommentary(matchId, locale),
      getYouTubeStream(matchId),
      getPreMatchAnalysis(matchId, locale)
    ]);

    if (!matchDataRaw || !matchDataRaw.header) {
      notFound();
    }

    // Extract team information
    const competition = matchDataRaw.header.competitions[0];

    // Find actual home and away teams based on homeAway field
    const homeTeamData = competition.competitors.find((c: any) => c.homeAway === 'home') || competition.competitors[0];
    const awayTeamData = competition.competitors.find((c: any) => c.homeAway === 'away') || competition.competitors[1];

    // Only redirect if using old URL format (just numeric ID)
    // Accept new format URLs with any team order to avoid redirect loops
    if (isOldFormatSlug(slug)) {
      const newPath = generateMatchPath(
        homeTeamData.team.displayName,
        awayTeamData.team.displayName,
        matchId,
        locale
      );
      redirect(newPath);
    }

    // Use the data from whichever order they appear in the API for display
    const homeTeam = homeTeamData;
    const awayTeam = awayTeamData;

    // Add YouTube stream to match data
    if (youtubeStream) {
      matchDataRaw.youtubeStream = youtubeStream;
    }

    // Convert ESPN data to MatchData format
    const matchData: MatchData = espnToMatchData(matchDataRaw.header, commentary);

    // Generate comprehensive schema markup
    const schema = generateMatchSchemas(matchData, locale);

    const matchTitle = `${homeTeam.team.displayName} vs ${awayTeam.team.displayName}`;
    const matchSlug = generateMatchSlug(homeTeam.team.displayName, awayTeam.team.displayName, matchId);

    // Breadcrumb items with new URL format
    const breadcrumbItems = [
      { label: 'CAN 2025', href: locale === 'fr' ? '/can-2025' : `/${locale}/can-2025` },
      { label: matchTitle, href: generateMatchPath(homeTeam.team.displayName, awayTeam.team.displayName, matchId, locale) }
    ];

    return (
      <>
        {/* Inject JSON-LD schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        <Header />

        <main className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Client component for live updates and rendering */}
          <MatchPageClient
            initialMatchData={matchData}
            matchDataRaw={matchDataRaw}
            commentary={commentary}
            preMatchAnalysis={preMatchAnalysis}
            locale={locale}
            matchId={matchId}
          />
        </main>

        <Footer />
      </>
    );
  } catch (error: any) {
    // Don't log Next.js navigation errors (redirect, notFound)
    // These are not real errors - just Next.js control flow
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.digest?.startsWith('NEXT_NOT_FOUND')) {
      throw error;
    }

    // Log actual errors
    console.error('Error in MatchPage:', error);
    throw error;
  }
}
