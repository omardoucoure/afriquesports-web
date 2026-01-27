import { NextRequest, NextResponse } from "next/server";
import { gaClient, type Platform } from "@/lib/ga-client";

function getDateRange(period: string): { startDate: string; endDate: string; isHourly: boolean } {
  const endDate = "today";
  let startDate: string;
  let isHourly = false;

  switch (period) {
    case "24h":
      startDate = "yesterday";
      isHourly = true;
      break;
    case "2d":
      startDate = "2daysAgo";
      break;
    case "7d":
      startDate = "7daysAgo";
      break;
    case "30d":
      startDate = "30daysAgo";
      break;
    case "90d":
      startDate = "90daysAgo";
      break;
    default:
      startDate = "7daysAgo";
  }

  return { startDate, endDate, isHourly };
}

function getPreviousDateRange(period: string): { startDate: string; endDate: string } {
  switch (period) {
    case "24h":
      return { startDate: "3daysAgo", endDate: "2daysAgo" };
    case "2d":
      return { startDate: "4daysAgo", endDate: "3daysAgo" };
    case "7d":
      return { startDate: "14daysAgo", endDate: "8daysAgo" };
    case "30d":
      return { startDate: "60daysAgo", endDate: "31daysAgo" };
    case "90d":
      return { startDate: "180daysAgo", endDate: "91daysAgo" };
    default:
      return { startDate: "14daysAgo", endDate: "8daysAgo" };
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GA_PROPERTY_ID) {
      return NextResponse.json(
        { error: "GA_PROPERTY_ID not configured", message: "Set GA_PROPERTY_ID in .env.local to enable analytics. Find it in Google Analytics → Admin → Property Settings." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";
    const platform = (searchParams.get("platform") || "all") as Platform;

    const { startDate, endDate, isHourly } = getDateRange(period);
    const previousRange = getPreviousDateRange(period);

    const [
      overview,
      previousOverview,
      trafficByDate,
      topPages,
      referrers,
      countries,
      devices,
      browsers,
      os,
      events,
      realtime,
    ] = await Promise.all([
      gaClient.getOverviewMetrics(startDate, endDate, platform),
      gaClient.getOverviewMetrics(previousRange.startDate, previousRange.endDate, platform),
      isHourly
        ? gaClient.getTrafficByHour(startDate, endDate, platform)
        : gaClient.getTrafficByDate(startDate, endDate, platform),
      gaClient.getTopPages(startDate, endDate, 50, platform),
      gaClient.getReferrers(startDate, endDate, 20, platform),
      gaClient.getVisitorsByCountry(startDate, endDate, 20, platform),
      gaClient.getVisitorsByDevice(startDate, endDate, platform),
      gaClient.getVisitorsByBrowser(startDate, endDate, 10, platform),
      gaClient.getVisitorsByOS(startDate, endDate, 10, platform),
      gaClient.getEvents(startDate, endDate, 20, platform),
      gaClient.getRealtimeUsers(platform).catch(() => ({ activeUsers: 0 })),
    ]);

    const visitorsChange = previousOverview.visitors > 0
      ? Math.round(((overview.visitors - previousOverview.visitors) / previousOverview.visitors) * 100)
      : 0;
    const pageViewsChange = previousOverview.pageViews > 0
      ? Math.round(((overview.pageViews - previousOverview.pageViews) / previousOverview.pageViews) * 100)
      : 0;
    const bounceRateChange = previousOverview.bounceRate > 0
      ? Math.round((overview.bounceRate - previousOverview.bounceRate) * 10) / 10
      : 0;

    return NextResponse.json({
      overview: {
        ...overview,
        visitorsChange,
        pageViewsChange,
        bounceRateChange,
      },
      realtime,
      trafficByDate: trafficByDate.map((item) => ({
        ...item,
        isHourly,
      })),
      topPages,
      referrers,
      countries,
      devices,
      browsers,
      os,
      events,
      period,
      platform,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data", message: String(error) },
      { status: 500 }
    );
  }
}
