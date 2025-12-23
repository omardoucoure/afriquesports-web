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
  // Performance optimizations
  compress: true, // Enable gzip/brotli compression
  swcMinify: true, // Use faster SWC minification
  productionBrowserSourceMaps: false, // Disable source maps in production

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
    ];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats for 30-50% size reduction
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache for images
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
