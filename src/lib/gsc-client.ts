/**
 * Google Search Console Client
 * Handles authentication and API calls to GSC
 */

import { google, searchconsole_v1 } from "googleapis";

export interface GSCCredentials {
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

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface SiteInfo {
  siteUrl: string;
  permissionLevel: string;
}

export interface RichResultItem {
  richResultType: string;
  items?: Array<{
    name?: string;
    issues?: Array<{
      issueMessage: string;
      severity: string;
    }>;
  }>;
}

export interface IndexingStatus {
  url: string;
  coverageState?: string;
  robotsTxtState?: string;
  indexingState?: string;
  lastCrawlTime?: string;
  pageFetchState?: string;
  verdict?: string;
  richResultsVerdict?: string;
  richResults?: RichResultItem[];
  mobileUsabilityVerdict?: string;
  mobileUsabilityIssues?: string[];
}

export type Dimension = "query" | "page" | "country" | "device" | "date" | "searchAppearance";
export type SearchType = "web" | "image" | "video" | "news" | "discover" | "googleNews";
export type AggregationType = "auto" | "byPage" | "byProperty";

export interface SearchAnalyticsQuery {
  startDate: string;
  endDate: string;
  dimensions?: Dimension[];
  searchType?: SearchType;
  aggregationType?: AggregationType;
  dimensionFilterGroups?: Array<{
    groupType?: "and" | "or";
    filters: Array<{
      dimension: Dimension;
      operator: "equals" | "contains" | "notContains" | "includingRegex" | "excludingRegex";
      expression: string;
    }>;
  }>;
  rowLimit?: number;
  startRow?: number;
}

class GSCClient {
  private searchconsole: searchconsole_v1.Searchconsole | null = null;
  private siteUrl: string;
  private initialized: boolean = false;

  constructor() {
    this.siteUrl = process.env.GSC_SITE_URL || "sc-domain:afriquesports.net";
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const credentials = this.getCredentials();

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/webmasters",
      ],
    });

    this.searchconsole = google.searchconsole({ version: "v1", auth });
    this.initialized = true;
  }

  private getCredentials(): GSCCredentials {
    if (process.env.GSC_CREDENTIALS) {
      try {
        return JSON.parse(process.env.GSC_CREDENTIALS);
      } catch {
        throw new Error("Invalid GSC_CREDENTIALS JSON in environment");
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

    throw new Error("GSC credentials not found. Set GSC_CREDENTIALS or GSC_PRIVATE_KEY + GSC_CLIENT_EMAIL.");
  }

  private async ensureInitialized(): Promise<searchconsole_v1.Searchconsole> {
    if (!this.initialized || !this.searchconsole) {
      await this.initialize();
    }
    return this.searchconsole!;
  }

  async listSites(): Promise<SiteInfo[]> {
    const client = await this.ensureInitialized();
    const response = await client.sites.list();

    return (response.data.siteEntry || []).map((site) => ({
      siteUrl: site.siteUrl || "",
      permissionLevel: site.permissionLevel || "",
    }));
  }

  async getSearchAnalytics(query: SearchAnalyticsQuery): Promise<SearchAnalyticsResponse> {
    const client = await this.ensureInitialized();

    const response = await client.searchanalytics.query({
      siteUrl: this.siteUrl,
      requestBody: {
        startDate: query.startDate,
        endDate: query.endDate,
        dimensions: query.dimensions,
        searchType: query.searchType || "web",
        aggregationType: query.aggregationType || "auto",
        dimensionFilterGroups: query.dimensionFilterGroups,
        rowLimit: query.rowLimit || 1000,
        startRow: query.startRow || 0,
      },
    });

    return {
      rows: (response.data.rows || []).map((row) => ({
        keys: row.keys || [],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })),
      responseAggregationType: response.data.responseAggregationType || undefined,
    };
  }

  async inspectUrl(url: string): Promise<IndexingStatus> {
    const client = await this.ensureInitialized();

    const response = await client.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: url,
        siteUrl: this.siteUrl,
      },
    });

    const result = response.data.inspectionResult;

    const richResultsResult = result?.richResultsResult;
    const richResults: RichResultItem[] = [];

    if (richResultsResult?.detectedItems) {
      for (const item of richResultsResult.detectedItems) {
        richResults.push({
          richResultType: item.richResultType || "Unknown",
          items: item.items?.map((i) => ({
            name: i.name || undefined,
            issues: i.issues?.map((issue) => ({
              issueMessage: issue.issueMessage || "",
              severity: issue.severity || "WARNING",
            })),
          })),
        });
      }
    }

    const mobileResult = result?.mobileUsabilityResult;
    const mobileUsabilityIssues: string[] = [];

    if (mobileResult?.issues) {
      for (const issue of mobileResult.issues) {
        if (issue.message) {
          mobileUsabilityIssues.push(issue.message);
        }
      }
    }

    return {
      url,
      coverageState: result?.indexStatusResult?.coverageState || undefined,
      robotsTxtState: result?.indexStatusResult?.robotsTxtState || undefined,
      indexingState: result?.indexStatusResult?.indexingState || undefined,
      lastCrawlTime: result?.indexStatusResult?.lastCrawlTime || undefined,
      pageFetchState: result?.indexStatusResult?.pageFetchState || undefined,
      verdict: result?.indexStatusResult?.verdict || undefined,
      richResultsVerdict: richResultsResult?.verdict || undefined,
      richResults: richResults.length > 0 ? richResults : undefined,
      mobileUsabilityVerdict: mobileResult?.verdict || undefined,
      mobileUsabilityIssues: mobileUsabilityIssues.length > 0 ? mobileUsabilityIssues : undefined,
    };
  }

  async listSitemaps(): Promise<Array<{ path: string; lastSubmitted?: string; isPending: boolean; isSitemapsIndex: boolean; lastDownloaded?: string; warnings?: number; errors?: number }>> {
    const client = await this.ensureInitialized();

    const response = await client.sitemaps.list({ siteUrl: this.siteUrl });

    return (response.data.sitemap || []).map((sitemap) => ({
      path: sitemap.path || "",
      lastSubmitted: sitemap.lastSubmitted || undefined,
      isPending: sitemap.isPending || false,
      isSitemapsIndex: sitemap.isSitemapsIndex || false,
      lastDownloaded: sitemap.lastDownloaded || undefined,
      warnings: sitemap.warnings ? parseInt(sitemap.warnings) : undefined,
      errors: sitemap.errors ? parseInt(sitemap.errors) : undefined,
    }));
  }

  async submitSitemap(sitemapUrl: string): Promise<void> {
    const client = await this.ensureInitialized();
    await client.sitemaps.submit({ siteUrl: this.siteUrl, feedpath: sitemapUrl });
  }

  async getTopQueries(days: number = 28, limit: number = 100): Promise<SearchAnalyticsRow[]> {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const response = await this.getSearchAnalytics({
      startDate, endDate, dimensions: ["query"], rowLimit: limit,
    });
    return response.rows;
  }

  async getTopPages(days: number = 28, limit: number = 100): Promise<SearchAnalyticsRow[]> {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const response = await this.getSearchAnalytics({
      startDate, endDate, dimensions: ["page"], rowLimit: limit,
    });
    return response.rows;
  }

  async getPerformanceByCountry(days: number = 28, limit: number = 50): Promise<SearchAnalyticsRow[]> {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const response = await this.getSearchAnalytics({
      startDate, endDate, dimensions: ["country"], rowLimit: limit,
    });
    return response.rows;
  }

  async findOptimizationOpportunities(
    days: number = 28, minImpressions: number = 100, maxCtr: number = 0.03
  ): Promise<SearchAnalyticsRow[]> {
    const pages = await this.getTopPages(days, 500);
    return pages.filter((page) => page.impressions >= minImpressions && page.ctr <= maxCtr);
  }

  async findDecliningPages(
    recentDays: number = 7, compareDays: number = 28
  ): Promise<Array<SearchAnalyticsRow & { previousClicks: number; changePercent: number }>> {
    const endDate = new Date().toISOString().split("T")[0];
    const recentStartDate = new Date(Date.now() - recentDays * 86400000).toISOString().split("T")[0];
    const compareStartDate = new Date(Date.now() - compareDays * 86400000).toISOString().split("T")[0];

    const recentData = await this.getSearchAnalytics({
      startDate: recentStartDate, endDate, dimensions: ["page"], rowLimit: 500,
    });
    const previousData = await this.getSearchAnalytics({
      startDate: compareStartDate, endDate: recentStartDate, dimensions: ["page"], rowLimit: 500,
    });

    const previousMap = new Map<string, number>();
    previousData.rows.forEach((row) => previousMap.set(row.keys[0], row.clicks));

    return recentData.rows
      .map((row) => {
        const previousClicks = previousMap.get(row.keys[0]) || 0;
        const changePercent = previousClicks > 0
          ? ((row.clicks - previousClicks) / previousClicks) * 100
          : 0;
        return { ...row, previousClicks, changePercent };
      })
      .filter((row) => row.changePercent < -20 && row.previousClicks > 10)
      .sort((a, b) => a.changePercent - b.changePercent);
  }
}

export const gscClient = new GSCClient();
export { GSCClient };
