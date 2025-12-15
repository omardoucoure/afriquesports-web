/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.afriquesports.net',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/search', '/search/*', '/_not-found'],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://www.afriquesports.net/news-sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/search', '/_next', '/api'],
      },
      {
        userAgent: 'Googlebot-News',
        allow: '/',
      },
    ],
  },
  transform: async (config, path) => {
    // Custom priority for different pages
    let priority = config.priority;
    let changefreq = config.changefreq;

    if (path === '/') {
      priority = 1.0;
      changefreq = 'hourly';
    } else if (path.startsWith('/category/')) {
      priority = 0.8;
      changefreq = 'daily';
    } else if (path === '/contact') {
      priority = 0.3;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
