/**
 * Google Analytics Data API Client
 * Handles authentication and API calls to GA4
 */

import { BetaAnalyticsDataClient } from "@google-analytics/data";

// Types
export interface GACredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

export interface RealtimeData {
  activeUsers: number;
}

export interface AnalyticsData {
  visitors: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  visitorsChange?: number;
  pageViewsChange?: number;
  bounceRateChange?: number;
}

export interface TrafficByDate {
  date: string;
  visitors: number;
  pageViews: number;
}

export interface PageData {
  path: string;
  visitors: number;
  pageViews: number;
}

export interface CountryData {
  country: string;
  countryCode: string;
  visitors: number;
  percentage: number;
}

export interface DeviceData {
  device: string;
  visitors: number;
  percentage: number;
}

export interface BrowserData {
  browser: string;
  visitors: number;
  percentage: number;
}

export interface OSData {
  os: string;
  visitors: number;
  percentage: number;
}

export interface ReferrerData {
  source: string;
  visitors: number;
}

export interface EventData {
  eventName: string;
  visitors: number;
  count: number;
}

export type Platform = "all" | "web" | "android" | "ios";

function buildPlatformFilter(platform: Platform) {
  if (platform === "all") return undefined;

  const platformValue = platform === "web" ? "web" : platform === "android" ? "Android" : "iOS";

  return {
    filter: {
      fieldName: "platform",
      stringFilter: {
        value: platformValue,
        matchType: "EXACT" as const,
      },
    },
  };
}

class GAClient {
  private client: BetaAnalyticsDataClient | null = null;
  private propertyId: string;
  private initialized: boolean = false;

  constructor() {
    this.propertyId = process.env.GA_PROPERTY_ID || "";
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const credentials = this.getCredentials();
    this.client = new BetaAnalyticsDataClient({ credentials });
    this.initialized = true;
  }

  private getCredentials(): GACredentials {
    if (process.env.GA_CREDENTIALS) {
      try {
        return JSON.parse(process.env.GA_CREDENTIALS);
      } catch {
        throw new Error("Invalid GA_CREDENTIALS JSON in environment");
      }
    }

    if (process.env.GSC_PRIVATE_KEY && process.env.GSC_CLIENT_EMAIL) {
      return {
        type: "service_account",
        project_id: process.env.GSC_PROJECT_ID || "",
        private_key_id: process.env.GSC_PRIVATE_KEY_ID || "",
        private_key: process.env.GSC_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.GSC_CLIENT_EMAIL,
        client_id: process.env.GSC_CLIENT_ID || "",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GSC_CLIENT_EMAIL)}`,
        universe_domain: "googleapis.com",
      };
    }

    throw new Error("GA credentials not found. Set GA_CREDENTIALS or GSC_PRIVATE_KEY + GSC_CLIENT_EMAIL.");
  }

  private async ensureInitialized(): Promise<BetaAnalyticsDataClient> {
    if (!this.initialized || !this.client) {
      await this.initialize();
    }
    return this.client!;
  }

  async getRealtimeUsers(platform: Platform = "all"): Promise<RealtimeData> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runRealtimeReport({
      property: `properties/${this.propertyId}`,
      metrics: [{ name: "activeUsers" }],
      ...(dimensionFilter && { dimensionFilter }),
    });

    return { activeUsers: parseInt(response.rows?.[0]?.metricValues?.[0]?.value || "0") };
  }

  async getOverviewMetrics(startDate: string, endDate: string, platform: Platform = "all"): Promise<AnalyticsData> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "activeUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      ...(dimensionFilter && { dimensionFilter }),
    });

    const row = response.rows?.[0];
    return {
      visitors: parseInt(row?.metricValues?.[0]?.value || "0"),
      pageViews: parseInt(row?.metricValues?.[1]?.value || "0"),
      bounceRate: parseFloat(row?.metricValues?.[2]?.value || "0") * 100,
      avgSessionDuration: parseFloat(row?.metricValues?.[3]?.value || "0"),
    };
  }

  async getTrafficByDate(startDate: string, endDate: string, platform: Platform = "all"): Promise<TrafficByDate[]> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      ...(dimensionFilter && { dimensionFilter }),
    });

    return (response.rows || []).map((row) => ({
      date: row.dimensionValues?.[0]?.value || "",
      visitors: parseInt(row.metricValues?.[0]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[1]?.value || "0"),
    }));
  }

  async getTrafficByHour(startDate: string, endDate: string, platform: Platform = "all"): Promise<TrafficByDate[]> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "dateHour" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "dateHour" } }],
      ...(dimensionFilter && { dimensionFilter }),
    });

    return (response.rows || []).map((row) => ({
      date: row.dimensionValues?.[0]?.value || "",
      visitors: parseInt(row.metricValues?.[0]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[1]?.value || "0"),
    })).slice(-24);
  }

  async getTopPages(startDate: string, endDate: string, limit: number = 10, platform: Platform = "all"): Promise<PageData[]> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit,
      ...(dimensionFilter && { dimensionFilter }),
    });

    return (response.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "",
      visitors: parseInt(row.metricValues?.[0]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[1]?.value || "0"),
    }));
  }

  async getVisitorsByCountry(startDate: string, endDate: string, limit: number = 10, platform: Platform = "all"): Promise<CountryData[]> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "country" }, { name: "countryId" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit,
      ...(dimensionFilter && { dimensionFilter }),
    });

    const totalVisitors = (response.rows || []).reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || "0"), 0
    );

    return (response.rows || []).map((row) => {
      const visitors = parseInt(row.metricValues?.[0]?.value || "0");
      return {
        country: row.dimensionValues?.[0]?.value || "",
        countryCode: row.dimensionValues?.[1]?.value || "",
        visitors,
        percentage: totalVisitors > 0 ? Math.round((visitors / totalVisitors) * 100) : 0,
      };
    });
  }

  async getVisitorsByDevice(startDate: string, endDate: string, platform: Platform = "all"): Promise<DeviceData[]> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      ...(dimensionFilter && { dimensionFilter }),
    });

    const totalVisitors = (response.rows || []).reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || "0"), 0
    );

    return (response.rows || []).map((row) => {
      const visitors = parseInt(row.metricValues?.[0]?.value || "0");
      return {
        device: row.dimensionValues?.[0]?.value || "",
        visitors,
        percentage: totalVisitors > 0 ? Math.round((visitors / totalVisitors) * 100) : 0,
      };
    });
  }

  async getVisitorsByBrowser(startDate: string, endDate: string, limit: number = 5, platform: Platform = "all"): Promise<BrowserData[]> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "browser" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit,
      ...(dimensionFilter && { dimensionFilter }),
    });

    const totalVisitors = (response.rows || []).reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || "0"), 0
    );

    return (response.rows || []).map((row) => {
      const visitors = parseInt(row.metricValues?.[0]?.value || "0");
      return {
        browser: row.dimensionValues?.[0]?.value || "",
        visitors,
        percentage: totalVisitors > 0 ? Math.round((visitors / totalVisitors) * 100) : 0,
      };
    });
  }

  async getVisitorsByOS(startDate: string, endDate: string, limit: number = 5, platform: Platform = "all"): Promise<OSData[]> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "operatingSystem" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit,
      ...(dimensionFilter && { dimensionFilter }),
    });

    const totalVisitors = (response.rows || []).reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || "0"), 0
    );

    return (response.rows || []).map((row) => {
      const visitors = parseInt(row.metricValues?.[0]?.value || "0");
      return {
        os: row.dimensionValues?.[0]?.value || "",
        visitors,
        percentage: totalVisitors > 0 ? Math.round((visitors / totalVisitors) * 100) : 0,
      };
    });
  }

  async getReferrers(startDate: string, endDate: string, limit: number = 10, platform: Platform = "all"): Promise<ReferrerData[]> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit,
      ...(dimensionFilter && { dimensionFilter }),
    });

    return (response.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "(direct)",
      visitors: parseInt(row.metricValues?.[0]?.value || "0"),
    }));
  }

  async getEvents(startDate: string, endDate: string, limit: number = 10, platform: Platform = "all"): Promise<EventData[]> {
    const client = await this.ensureInitialized();
    const dimensionFilter = buildPlatformFilter(platform);

    const [response] = await client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit,
      ...(dimensionFilter && { dimensionFilter }),
    });

    return (response.rows || []).map((row) => ({
      eventName: row.dimensionValues?.[0]?.value || "",
      visitors: parseInt(row.metricValues?.[0]?.value || "0"),
      count: parseInt(row.metricValues?.[1]?.value || "0"),
    }));
  }
}

export const gaClient = new GAClient();
export { GAClient };
