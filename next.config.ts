import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
