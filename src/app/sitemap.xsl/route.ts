import { NextResponse } from "next/server";

/**
 * XSLT Stylesheet for Sitemaps
 * Makes sitemaps human-readable with Afrique Sports branding
 */

export const runtime = "edge";

export async function GET() {
  const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
      <head>
        <title>Sitemap - Afrique Sports</title>
        <meta name="robots" content="noindex,follow"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style type="text/css">
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f6f6f6;
            color: #303030;
            line-height: 1.6;
          }
          .header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: white;
            padding: 2rem;
            text-align: center;
          }
          .header h1 {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }
          .header .brand {
            color: #9DFF20;
            font-weight: 800;
          }
          .header p {
            color: #aaa;
            font-size: 0.95rem;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }
          .stats {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
          }
          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            flex: 1;
            min-width: 200px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .stat-card h3 {
            font-size: 2rem;
            color: #9DFF20;
            font-weight: 700;
          }
          .stat-card p {
            color: #666;
            font-size: 0.9rem;
          }
          table {
            width: 100%;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-collapse: collapse;
          }
          th {
            background: #345C00;
            color: white;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 1rem;
            border-bottom: 1px solid #eee;
            font-size: 0.9rem;
          }
          tr:hover td {
            background: #f9f9f9;
          }
          a {
            color: #345C00;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            color: #9DFF20;
            text-decoration: underline;
          }
          .url-cell {
            max-width: 500px;
          }
          .date-cell {
            white-space: nowrap;
            color: #666;
          }
          .priority-cell {
            text-align: center;
          }
          .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
          }
          .badge-high {
            background: #9DFF20;
            color: #345C00;
          }
          .badge-medium {
            background: #e0e0e0;
            color: #333;
          }
          .footer {
            text-align: center;
            padding: 2rem;
            color: #666;
            font-size: 0.85rem;
          }
          .footer a {
            color: #9DFF20;
          }
          @media (max-width: 768px) {
            .container {
              padding: 1rem;
            }
            th, td {
              padding: 0.75rem 0.5rem;
              font-size: 0.8rem;
            }
            .stats {
              flex-direction: column;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1><span class="brand">AFRIQUE SPORTS</span> Sitemap</h1>
          <p>Plan du site XML pour les moteurs de recherche</p>
        </div>

        <div class="container">
          <xsl:choose>
            <xsl:when test="sitemap:sitemapindex">
              <div class="stats">
                <div class="stat-card">
                  <h3><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></h3>
                  <p>Sitemaps</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Sitemap URL</th>
                    <th>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                    <tr>
                      <td class="url-cell">
                        <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                      </td>
                      <td class="date-cell">
                        <xsl:value-of select="sitemap:lastmod"/>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:when>
            <xsl:otherwise>
              <div class="stats">
                <div class="stat-card">
                  <h3><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></h3>
                  <p>URLs in this sitemap</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Last Modified</th>
                    <th>Languages</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:urlset/sitemap:url">
                    <tr>
                      <td class="url-cell">
                        <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                      </td>
                      <td class="date-cell">
                        <xsl:value-of select="sitemap:lastmod"/>
                      </td>
                      <td>
                        <xsl:for-each select="xhtml:link[@rel='alternate']">
                          <span class="badge badge-medium">
                            <xsl:value-of select="@hreflang"/>
                          </span>
                          <xsl:text> </xsl:text>
                        </xsl:for-each>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </div>

        <div class="footer">
          <p>Generated by <a href="https://www.afriquesports.net">Afrique Sports</a> | L'actualité du football africain</p>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

  return new NextResponse(xsl, {
    headers: {
      "Content-Type": "application/xslt+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
