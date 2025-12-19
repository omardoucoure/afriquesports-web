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

const nextConfig: NextConfig = {
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
    ],
  },
};

export default withNextIntl(nextConfig);
