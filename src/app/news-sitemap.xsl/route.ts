import { NextResponse } from "next/server";

/**
 * XSLT Stylesheet for News Sitemap
 * Specialized design for Google News sitemap
 */

export const runtime = "edge";

export async function GET() {
  const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
      <head>
        <title>News Sitemap - Afrique Sports</title>
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
          .header .news-badge {
            display: inline-block;
            background: #ff4444;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            margin-left: 0.5rem;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
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
            min-width: 150px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .stat-card h3 {
            font-size: 2rem;
            color: #9DFF20;
            font-weight: 700;
          }
          .stat-card.live h3 {
            color: #ff4444;
          }
          .stat-card p {
            color: #666;
            font-size: 0.9rem;
          }
          .news-grid {
            display: grid;
            gap: 1rem;
          }
          .news-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .news-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          }
          .news-card h3 {
            font-size: 1.1rem;
            margin-bottom: 0.75rem;
            line-height: 1.4;
          }
          .news-card h3 a {
            color: #303030;
            text-decoration: none;
          }
          .news-card h3 a:hover {
            color: #345C00;
          }
          .news-meta {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            font-size: 0.85rem;
            color: #666;
          }
          .news-meta span {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          .lang-badge {
            display: inline-block;
            background: #9DFF20;
            color: #345C00;
            padding: 0.15rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }
          .time-ago {
            color: #ff4444;
            font-weight: 600;
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
          .info-box {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
          }
          .info-box strong {
            color: #856404;
          }
          @media (max-width: 768px) {
            .container {
              padding: 1rem;
            }
            .header h1 {
              font-size: 1.4rem;
            }
            .stats {
              flex-direction: column;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>
            <span class="brand">AFRIQUE SPORTS</span>
            <span class="news-badge">Google News</span>
          </h1>
          <p>Articles des dernieres 48 heures pour Google News</p>
        </div>

        <div class="container">
          <div class="stats">
            <div class="stat-card live">
              <h3><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></h3>
              <p>Articles recents</p>
            </div>
            <div class="stat-card">
              <h3>48h</h3>
              <p>Fenetre de temps</p>
            </div>
            <div class="stat-card">
              <h3>15min</h3>
              <p>Actualisation</p>
            </div>
          </div>

          <div class="info-box">
            <strong>Google News Sitemap:</strong> Ce sitemap contient uniquement les articles publies dans les dernieres 48 heures, conformement aux exigences de Google News.
          </div>

          <div class="news-grid">
            <xsl:for-each select="sitemap:urlset/sitemap:url">
              <div class="news-card">
                <h3>
                  <a href="{sitemap:loc}">
                    <xsl:value-of select="news:news/news:title"/>
                  </a>
                </h3>
                <div class="news-meta">
                  <span>
                    <span class="lang-badge">
                      <xsl:value-of select="news:news/news:publication/news:language"/>
                    </span>
                  </span>
                  <span>
                    <xsl:value-of select="news:news/news:publication/news:name"/>
                  </span>
                  <span class="time-ago">
                    <xsl:value-of select="news:news/news:publication_date"/>
                  </span>
                </div>
              </div>
            </xsl:for-each>
          </div>
        </div>

        <div class="footer">
          <p>Generated by <a href="https://www.afriquesports.net">Afrique Sports</a> | L'actualite du football africain</p>
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
