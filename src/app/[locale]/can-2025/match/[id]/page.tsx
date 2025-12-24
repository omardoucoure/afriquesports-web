import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { generateMatchSchemas, espnToMatchData, MatchData } from '@/lib/match-schema';
import {
  getMatchCommentary as fetchMatchCommentary,
  getYouTubeStream as fetchYouTubeStream,
  getPreMatchAnalysis as fetchPreMatchAnalysis,
} from '@/lib/mysql-match-db';
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
 * Fetch live commentary from MySQL
 */
async function getMatchCommentary(matchId: string, locale: string): Promise<any[]> {
  try {
    const data = await fetchMatchCommentary(matchId, locale);
    // Limit to 50 most recent items
    return data ? data.slice(0, 50) : [];
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
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const matchDataRaw = await getMatchData(id);

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
  const homeTeam = competition.competitors[0];
  const awayTeam = competition.competitors[1];
  const status = matchDataRaw.header.status;
  const homeScore = homeTeam.score || 0;
  const awayScore = awayTeam.score || 0;

  // Determine match status (handle null status)
  const isLive = status?.type?.state === 'in';
  const isCompleted = status?.type?.completed || false;
  const isUpcoming = !isLive && !isCompleted;

  // Dynamic title based on match status
  let title: string;
  if (isLive) {
    title = `🔴 LIVE: ${homeTeam.team.displayName} ${homeScore}-${awayScore} ${awayTeam.team.displayName} | CAN 2025 | Afrique Sports`;
  } else if (isCompleted) {
    title = `${homeTeam.team.displayName} ${homeScore}-${awayScore} ${awayTeam.team.displayName} | CAN 2025 | Afrique Sports`;
  } else {
    const matchDate = new Date(matchDataRaw.header.date);
    const dateStr = matchDate.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric'
    });
    title = `${homeTeam.team.displayName} vs ${awayTeam.team.displayName} - ${dateStr} | CAN 2025 | Afrique Sports`;
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

  // Canonical URL (French at root, other locales with prefix)
  const frenchUrl = `${SITE_URL}/can-2025/match/${id}`;
  const canonicalUrl = locale === 'fr' ? frenchUrl : `${SITE_URL}/${locale}/can-2025/match/${id}`;

  // OG Image URL (dynamic with match data)
  const ogImageUrl = `${SITE_URL}/api/og-match?id=${id}&locale=${locale}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'fr-FR': frenchUrl,
        'en-US': `${SITE_URL}/en/can-2025/match/${id}`,
        'es-ES': `${SITE_URL}/es/can-2025/match/${id}`,
        'ar-SA': `${SITE_URL}/ar/can-2025/match/${id}`,
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
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  try {
    const t = await getTranslations({ locale });

    // Fetch match data, commentary, YouTube stream, and pre-match analysis in parallel
    const [matchDataRaw, commentary, youtubeStream, preMatchAnalysis] = await Promise.all([
      getMatchData(id),
      getMatchCommentary(id, locale),
      getYouTubeStream(id),
      getPreMatchAnalysis(id, locale)
    ]);

    if (!matchDataRaw || !matchDataRaw.header) {
      notFound();
    }

    // Add YouTube stream to match data
    if (youtubeStream) {
      matchDataRaw.youtubeStream = youtubeStream;
    }

    // Convert ESPN data to MatchData format
    const matchData: MatchData = espnToMatchData(matchDataRaw.header, commentary);

    // Generate comprehensive schema markup
    const schema = generateMatchSchemas(matchData, locale);

    // Extract team info for breadcrumb
    const competition = matchDataRaw.header.competitions[0];
    const homeTeam = competition.competitors[0];
    const awayTeam = competition.competitors[1];
    const matchTitle = `${homeTeam.team.displayName} vs ${awayTeam.team.displayName}`;

    // Breadcrumb items
    const breadcrumbItems = [
      { label: 'CAN 2025', href: `/${locale}/can-2025` },
      { label: matchTitle, href: `/${locale}/can-2025/match/${id}` }
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
            matchId={id}
          />
        </main>

        <Footer />
      </>
    );
  } catch (error) {
    console.error('Error in MatchPage:', error);
    throw error;
  }
}

