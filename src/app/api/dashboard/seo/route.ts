import { NextRequest, NextResponse } from "next/server";
import { gscClient } from "@/lib/gsc-client";

// Country code to name and flag mapping (focused on African + Francophone countries)
const countryInfo: Record<string, { name: string; flag: string }> = {
  fra: { name: "France", flag: "🇫🇷" },
  sen: { name: "Senegal", flag: "🇸🇳" },
  cmr: { name: "Cameroon", flag: "🇨🇲" },
  civ: { name: "Ivory Coast", flag: "🇨🇮" },
  dza: { name: "Algeria", flag: "🇩🇿" },
  mar: { name: "Morocco", flag: "🇲🇦" },
  cod: { name: "DR Congo", flag: "🇨🇩" },
  gin: { name: "Guinea", flag: "🇬🇳" },
  mli: { name: "Mali", flag: "🇲🇱" },
  bfa: { name: "Burkina Faso", flag: "🇧🇫" },
  tgo: { name: "Togo", flag: "🇹🇬" },
  ben: { name: "Benin", flag: "🇧🇯" },
  ner: { name: "Niger", flag: "🇳🇪" },
  gab: { name: "Gabon", flag: "🇬🇦" },
  cog: { name: "Congo", flag: "🇨🇬" },
  tun: { name: "Tunisia", flag: "🇹🇳" },
  mdg: { name: "Madagascar", flag: "🇲🇬" },
  nga: { name: "Nigeria", flag: "🇳🇬" },
  gha: { name: "Ghana", flag: "🇬🇭" },
  ken: { name: "Kenya", flag: "🇰🇪" },
  zaf: { name: "South Africa", flag: "🇿🇦" },
  egy: { name: "Egypt", flag: "🇪🇬" },
  eth: { name: "Ethiopia", flag: "🇪🇹" },
  tza: { name: "Tanzania", flag: "🇹🇿" },
  usa: { name: "United States", flag: "🇺🇸" },
  gbr: { name: "United Kingdom", flag: "🇬🇧" },
  bel: { name: "Belgium", flag: "🇧🇪" },
  can: { name: "Canada", flag: "🇨🇦" },
  che: { name: "Switzerland", flag: "🇨🇭" },
  deu: { name: "Germany", flag: "🇩🇪" },
  esp: { name: "Spain", flag: "🇪🇸" },
  ita: { name: "Italy", flag: "🇮🇹" },
  hti: { name: "Haiti", flag: "🇭🇹" },
  lux: { name: "Luxembourg", flag: "🇱🇺" },
  sau: { name: "Saudi Arabia", flag: "🇸🇦" },
  are: { name: "UAE", flag: "🇦🇪" },
};

function getDateRange(period: string): { startDate: string; endDate: string; days: number } {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2);

  let days: number;
  switch (period) {
    case "24h":
      days = 1;
      break;
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
    default:
      days = 7;
  }

  const startDate = new Date(endDate);
  if (days > 1) {
    startDate.setDate(startDate.getDate() - days + 1);
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    days,
  };
}

function getPreviousDateRange(period: string): { startDate: string; endDate: string } {
  const { startDate, days } = getDateRange(period);

  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);

  const prevStartDate = new Date(prevEndDate);
  if (days > 1) {
    prevStartDate.setDate(prevStartDate.getDate() - days + 1);
  }

  return {
    startDate: prevStartDate.toISOString().split("T")[0],
    endDate: prevEndDate.toISOString().split("T")[0],
  };
}

function extractPath(fullUrl: string): string {
  try {
    const url = new URL(fullUrl);
    return url.pathname;
  } catch {
    return fullUrl;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";

    const { startDate, endDate } = getDateRange(period);
    const previousRange = getPreviousDateRange(period);

    const [
      overviewData,
      previousOverviewData,
      pagesData,
      keywordsData,
      countriesData,
      previousPagesData,
    ] = await Promise.all([
      gscClient.getSearchAnalytics({
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
      }),
      gscClient.getSearchAnalytics({
        startDate: previousRange.startDate,
        endDate: previousRange.endDate,
        dimensions: [],
        rowLimit: 1,
      }),
      gscClient.getSearchAnalytics({
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 100,
      }),
      gscClient.getSearchAnalytics({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 100,
      }),
      gscClient.getSearchAnalytics({
        startDate,
        endDate,
        dimensions: ["country"],
        rowLimit: 50,
      }),
      gscClient.getSearchAnalytics({
        startDate: previousRange.startDate,
        endDate: previousRange.endDate,
        dimensions: ["page"],
        rowLimit: 100,
      }),
    ]);

    const currentOverview = overviewData.rows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const previousOverview = previousOverviewData.rows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    const impressionsChange = previousOverview.impressions > 0
      ? Math.round(((currentOverview.impressions - previousOverview.impressions) / previousOverview.impressions) * 100)
      : 0;
    const clicksChange = previousOverview.clicks > 0
      ? Math.round(((currentOverview.clicks - previousOverview.clicks) / previousOverview.clicks) * 100)
      : 0;
    const ctrChange = previousOverview.ctr > 0
      ? Math.round(((currentOverview.ctr - previousOverview.ctr) / previousOverview.ctr) * 1000) / 10
      : 0;
    const positionChange = previousOverview.position > 0
      ? Math.round((currentOverview.position - previousOverview.position) * 10) / 10
      : 0;

    const topPages = pagesData.rows.map((row) => ({
      page: extractPath(row.keys[0]),
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 1000) / 10,
      position: Math.round(row.position * 10) / 10,
    }));

    const topKeywords = keywordsData.rows.map((row) => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 1000) / 10,
      position: Math.round(row.position * 10) / 10,
    }));

    const countries = countriesData.rows.map((row) => {
      const code = row.keys[0].toLowerCase();
      const info = countryInfo[code] || { name: code.toUpperCase(), flag: "🌍" };
      return {
        country: info.name,
        code: code.toUpperCase(),
        flag: info.flag,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: Math.round(row.ctr * 1000) / 10,
      };
    });

    // Find declining pages
    const previousPagesMap = new Map<string, { clicks: number; impressions: number; position: number }>();
    previousPagesData.rows.forEach((row) => {
      previousPagesMap.set(row.keys[0], {
        clicks: row.clicks,
        impressions: row.impressions,
        position: row.position,
      });
    });

    const decliningPages = pagesData.rows
      .map((row) => {
        const prevData = previousPagesMap.get(row.keys[0]);
        if (!prevData) return null;

        const positionLost = row.position - prevData.position;
        const clicksLost = prevData.clicks - row.clicks;

        if (positionLost <= 2) return null;

        return {
          page: extractPath(row.keys[0]),
          previousPosition: Math.round(prevData.position * 10) / 10,
          currentPosition: Math.round(row.position * 10) / 10,
          positionLost: Math.round(positionLost * 10) / 10,
          previousClicks: prevData.clicks,
          currentClicks: row.clicks,
          clicksLost,
          previousImpressions: prevData.impressions,
          currentImpressions: row.impressions,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.positionLost - a.positionLost)
      .slice(0, 20);

    return NextResponse.json({
      overview: {
        impressions: currentOverview.impressions,
        impressionsChange,
        clicks: currentOverview.clicks,
        clicksChange,
        avgCtr: Math.round(currentOverview.ctr * 1000) / 10,
        ctrChange,
        avgPosition: Math.round(currentOverview.position * 10) / 10,
        positionChange,
      },
      topPages,
      topKeywords,
      countries,
      decliningPages,
      period,
    });
  } catch (error) {
    console.error("SEO API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SEO data", message: String(error) },
      { status: 500 }
    );
  }
}
