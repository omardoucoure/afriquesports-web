import { NextResponse } from "next/server";

/**
 * XSLT Stylesheet for Video Sitemap
 * Makes video sitemap human-readable with video thumbnails and metadata
 */

export const runtime = "edge";

export async function GET() {
  const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
      <head>
        <title>Video Sitemap - Afrique Sports</title>
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
          .header .video-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          .container {
            max-width: 1400px;
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
          .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
          }
          .video-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .video-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.12);
          }
          .video-thumbnail {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            background: #000;
            overflow: hidden;
          }
          .video-thumbnail img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .video-thumbnail .play-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background: rgba(157, 255, 32, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: #000;
          }
          .video-info {
            padding: 1.25rem;
          }
          .video-title {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #303030;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .video-description {
            font-size: 0.85rem;
            color: #666;
            line-height: 1.5;
            margin-bottom: 0.75rem;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .video-meta {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-top: 0.75rem;
          }
          .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .badge-youtube {
            background: #ff0000;
            color: white;
          }
          .badge-hosted {
            background: #345C00;
            color: white;
          }
          .badge-date {
            background: #e0e0e0;
            color: #333;
          }
          .video-url {
            margin-top: 0.5rem;
            font-size: 0.8rem;
          }
          .video-url a {
            color: #345C00;
            text-decoration: none;
            word-break: break-all;
          }
          .video-url a:hover {
            color: #9DFF20;
            text-decoration: underline;
          }
          .footer {
            text-align: center;
            padding: 2rem;
            color: #666;
            font-size: 0.85rem;
          }
          .footer a {
            color: #9DFF20;
            text-decoration: none;
          }
          @media (max-width: 768px) {
            .container {
              padding: 1rem;
            }
            .video-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="video-icon">🎥</div>
          <h1><span class="brand">AFRIQUE SPORTS</span> Video Sitemap</h1>
          <p>Sitemap vidéo pour l'indexation Google Video Search</p>
        </div>

        <div class="container">
          <div class="stats">
            <div class="stat-card">
              <h3><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></h3>
              <p>Total Videos</p>
            </div>
            <div class="stat-card">
              <h3><xsl:value-of select="count(sitemap:urlset/sitemap:url[video:video/video:player_loc])"/></h3>
              <p>YouTube Videos</p>
            </div>
            <div class="stat-card">
              <h3><xsl:value-of select="count(sitemap:urlset/sitemap:url[video:video/video:content_loc])"/></h3>
              <p>Self-Hosted Videos</p>
            </div>
          </div>

          <div class="video-grid">
            <xsl:for-each select="sitemap:urlset/sitemap:url">
              <div class="video-card">
                <a href="{sitemap:loc}" target="_blank" style="text-decoration: none; color: inherit;">
                  <div class="video-thumbnail">
                    <img src="{video:video/video:thumbnail_loc}" alt="Video thumbnail" loading="lazy"/>
                    <div class="play-icon">▶</div>
                  </div>
                  <div class="video-info">
                    <div class="video-title">
                      <xsl:value-of select="video:video/video:title"/>
                    </div>
                    <div class="video-description">
                      <xsl:value-of select="video:video/video:description"/>
                    </div>
                    <div class="video-meta">
                      <xsl:choose>
                        <xsl:when test="video:video/video:player_loc">
                          <span class="badge badge-youtube">YouTube</span>
                        </xsl:when>
                        <xsl:otherwise>
                          <span class="badge badge-hosted">Self-Hosted</span>
                        </xsl:otherwise>
                      </xsl:choose>
                      <span class="badge badge-date">
                        <xsl:value-of select="substring(video:video/video:publication_date, 1, 10)"/>
                      </span>
                    </div>
                    <div class="video-url">
                      <a href="{sitemap:loc}" target="_blank">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </div>
                  </div>
                </a>
              </div>
            </xsl:for-each>
          </div>
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
