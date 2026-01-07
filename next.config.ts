import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// Country slugs that should redirect from /afrique/{country} to /category/afrique/{country}
const countrySubcategories = [
  "senegal",
  "cameroun",
  "cote-divoire",
  "algerie",
  "maroc",
  "rdc",
  "nigeria",
  "egypte",
  "ghana",
  "mali",
  "tunisie",
  "afrique-du-sud",
  "guinee",
  "burkina-faso",
  "togo",
  "benin",
  "niger",
  "gabon",
  "congo",
  "mozambique",
  "zambie",
  "zimbabwe",
  "ouganda",
  "tanzanie",
  "kenya",
  "soudan",
  "libye",
  "cap-vert",
  "maurice",
  "comores",
  "madagascar",
  "angola",
  "namibie",
  "botswana",
  "ethiopie",
  "erythree",
  "rwanda",
  "burundi",
  "centrafrique",
  "tchad",
  "mauritanie",
  "gambie",
  "sierra-leone",
  "liberia",
  "guinee-bissau",
  "guinee-equatoriale",
  "sao-tome-et-principe",
  "seychelles",
  "djibouti",
  "somalie",
  "soudan-du-sud",
  "lesotho",
  "eswatini",
  "malawi",
];

const nextConfig: NextConfig = {
  // Note: standalone output disabled due to middleware.nft.json issue in Next.js 16
  // TODO: Re-enable when Next.js fixes the issue
  // output: 'standalone',

  // Performance optimizations
  compress: true, // Enable gzip/brotli compression
  productionBrowserSourceMaps: false, // Disable source maps in production
  // Note: SWC minification is enabled by default in Next.js 16+

  // Experimental Next.js 15 optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@supabase/supabase-js',
    ],
    webpackBuildWorker: true, // Faster builds with webpack workers
  },

  async redirects() {
    return [
      // Fix malformed video indexing URLs (Google Search Console issue)
      // Pattern 1: /locale/https:/slug → /locale/football/slug
      {
        source: "/:locale(en|es|ar|fr)/https\\:/:path*",
        destination: "/:locale/football/:path*",
        permanent: true,
      },
      // Pattern 2: /https:/slug → /football/slug
      {
        source: "/https\\:/:path*",
        destination: "/football/:path*",
        permanent: true,
      },
      // Redirect /foot to /football (legacy URL fix)
      {
        source: "/foot/:slug*",
        destination: "/football/:slug*",
        permanent: true,
      },
      // Redirect /afrique/{country} to /category/afrique/{country}
      ...countrySubcategories.map((country) => ({
        source: `/afrique/${country}`,
        destination: `/category/afrique/${country}`,
        permanent: true,
      })),
      // Also handle trailing slashes
      ...countrySubcategories.map((country) => ({
        source: `/afrique/${country}/`,
        destination: `/category/afrique/${country}`,
        permanent: true,
      })),
      // Redirect /europe/{country} patterns too
      {
        source: "/europe/angleterre",
        destination: "/category/europe/angleterre",
        permanent: true,
      },
      {
        source: "/europe/espagne",
        destination: "/category/europe/espagne",
        permanent: true,
      },
      {
        source: "/europe/france",
        destination: "/category/europe/france",
        permanent: true,
      },
      {
        source: "/europe/italie",
        destination: "/category/europe/italie",
        permanent: true,
      },
      {
        source: "/europe/allemagne",
        destination: "/category/europe/allemagne",
        permanent: true,
      },

      // ============================================================================
      // WordPress CMS Integration - Redirect content URLs to Next.js
      // ============================================================================
      // This redirects article/content requests from cms.realdemadrid.com to the Next.js site
      // BUT preserves WordPress admin, API, and static assets access
      {
        source: '/:locale(afriquesports|afriquesports-en|afriquesports-es|afriquesports-ar)/:path((?!wp-admin|wp-login|wp-json|wp-content|wp-includes|xmlrpc.php).*)',
        has: [{ type: 'host', value: 'cms.realdemadrid.com' }],
        destination: 'https://www.afriquesports.net/:path*',
        permanent: true,
      },
      // Redirect root paths from CMS (but exclude WordPress paths)
      {
        source: '/:path((?!wp-admin|wp-login|wp-json|wp-content|wp-includes|xmlrpc.php|afriquesports|afriquesports-en|afriquesports-es|afriquesports-ar).*)',
        has: [{ type: 'host', value: 'cms.realdemadrid.com' }],
        destination: 'https://www.afriquesports.net/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      // Cache article pages at CDN edge (5 min cache, 10 min stale)
      // This provides ISR-like performance without ISR
      {
        source: "/:locale(fr|en|es|ar)?/:category/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      // Cache homepage and category pages (shorter cache time for freshness)
      {
        source: "/:locale(fr|en|es|ar)?/:path(category|mercato|can-2025)?",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      // Cache API responses at CDN edge to reduce origin requests
      // EXCEPT next-match endpoint which needs real-time updates
      {
        source: "/api/can2025/:path((?!next-match).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      // No cache for live match endpoint
      {
        source: "/api/can2025/next-match",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
          },
          {
            key: "CDN-Cache-Control",
            value: "no-store",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "no-store",
          },
        ],
      },
      {
        source: "/api/posts",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/api/visits/trending",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=3600, stale-while-revalidate=7200",
          },
        ],
      },
      {
        source: "/api/wordpress/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats for 30-50% size reduction
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache for images
    // Quality levels used across the site (default 75, article cards 85, featured images 90, hero images 95)
    qualities: [75, 85, 90, 95],
    // Note: quality must be set per-image using quality prop on Image component (Next.js 16)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.afriquesports.net",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "afriquesports.net",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "cms.realdemadrid.com",
        pathname: "/afriquesports/wp-content/uploads/sites/8/**",
      },
      {
        protocol: "https",
        hostname: "cms.realdemadrid.com",
        pathname: "/wp-content/uploads/sites/8/**",
      },
      {
        protocol: "https",
        hostname: "cms.realdemadrid.com",
        pathname: "/wp-content/uploads/sites/9/**",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i1.wp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i2.wp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "resources.premierleague.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.a.transfermarkt.technology",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tmssl.akamaized.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s.espncdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
