import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware({
  ...routing,

  // CRITICAL: Disable locale detection to prevent automatic redirects
  // Users should get the language specified in the URL, not their browser preference
  localeDetection: false,
});

export const config = {
  // Match all pathnames except static files and API routes
  matcher: [
    // Match all pathnames except for:
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
