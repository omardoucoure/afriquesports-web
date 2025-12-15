# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Afrique Sports - African sports news platform rebuilt with Next.js. Original site: https://www.afriquesports.net/

**Location:** Dakar, Sénégal | **Phone:** +221 77 868 32 00

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **i18n:** next-intl (French, English, Spanish)
- **Deployment:** Vercel

## Site structure

### Main navigation
- Accueil (/)
- Afrique (/category/afrique) - with country subpages
- Stories (/web-stories)
- Vidéos (/category/videos)
- Mercato (/mercato)
- Classements (/classements)
- Autres sports (/category/autres-sports)

### Country pages (under /category/afrique/)
- Algérie, Cameroun, Côte d'Ivoire, Maroc, Sénégal

### Static pages
- Contact (/contact)
- Confidentialité (/confidentialite)

## Key features to implement

1. Article grid with lazy-loading images
2. Featured carousel on homepage
3. "Most read" section
4. Category/country filtering
5. Search functionality
6. YouTube video embeds
7. Web stories support
8. Rankings/standings display
9. Player profiles spotlight (Osimhen, Mané, Salah, Koulibaly, Mahrez)
10. Push notifications
11. Cookie consent (GDPR)
12. Ad placements

## Integrations

- Google Analytics: G-0DFBHGV182
- Social: Facebook, Twitter, TikTok, Instagram, YouTube, Google News

## Workflow requirements

**Before writing any code:**
1. Summarize understanding of the task
2. Break down implementation into steps
3. Wait for user confirmation before proceeding

## Internationalization

- Never hardcode text - use localization keys
- All user-facing text must support: French (primary), English, Spanish
- Ensure all views are responsive

## Git configuration

- Use oxmo88@gmail.com for git commits
- Never run `git push` without explicit user permission
- Always ask "Should I deploy/push?" before pushing

## Code style

- Use sentence case (avoid capitalizing each word)
- Mobile-first responsive design
- Follow Next.js App Router conventions
