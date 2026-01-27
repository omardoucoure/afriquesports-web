"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

// CAN 2025 Morocco inspired colors
// Gold: #D4AF37, Green: #006233, Red: #C1272D

const footerLinksConfig = {
  categories: [
    { labelKey: "africa", href: "/category/afrique" },
    { labelKey: "europe", href: "/category/europe" },
    { labelKey: "can2025", href: "/category/can-2025" },
    { labelKey: "mercato", href: "/mercato" },
    { labelKey: "rankings", href: "/classements" },
  ],
  countries: [
    { labelKey: "senegal", href: "/category/afrique/senegal" },
    { labelKey: "cameroon", href: "/category/afrique/cameroun" },
    { labelKey: "ivoryCoast", href: "/category/afrique/cote-divoire" },
    { labelKey: "algeria", href: "/category/afrique/algerie" },
    { labelKey: "morocco", href: "/category/afrique/maroc" },
  ],
  players: [
    { label: "Victor Osimhen", href: "/joueur/victor-osimhen" },
    { label: "Sadio Mané", href: "/joueur/sadio-mane" },
    { label: "Mohamed Salah", href: "/joueur/mohamed-salah" },
    { label: "Kalidou Koulibaly", href: "/joueur/kalidou-koulibaly" },
    { label: "Riyad Mahrez", href: "/joueur/riyad-mahrez" },
  ],
  legal: [
    { labelKey: "about", href: "/a-propos" },
    { labelKey: "contact", href: "/contact" },
    { labelKey: "privacy", href: "/confidentialite" },
  ],
};

const socialLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com/afriquesports",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Twitter",
    href: "https://twitter.com/afriquesports",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://instagram.com/afriquesports",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@afriquesports",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/@afriquesports",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    name: "Google News",
    href: "https://news.google.com/publications/CAAqBwgKMNKFmgswzZSwAw",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.5 4h-19C1.67 4 1 4.67 1 5.5v13c0 .83.67 1.5 1.5 1.5h19c.83 0 1.5-.67 1.5-1.5v-13c0-.83-.67-1.5-1.5-1.5zM11 17H4v-1h7v1zm0-2H4v-1h7v1zm0-2H4v-1h7v1zm0-2H4V9h7v2zm0-3H4V7h7v1zm9 9h-7v-7h7v7zm0-8h-7V7h7v1z" />
      </svg>
    ),
  },
];

// Africa border pattern component (same as header)
function AfricaBorder({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div
      className={`absolute ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 h-2 bg-repeat-x z-10`}
      style={{
        backgroundImage: 'url(/images/africa-border.png)',
        backgroundSize: 'auto 100%'
      }}
    />
  );
}

export function Footer() {
  const tFooter = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tCountries = useTranslations("countries");
  const tCategories = useTranslations("categories");

  return (
    <footer className="relative text-white overflow-hidden">
      {/* Same background as header */}
      <div className="absolute inset-0 bg-[#04453f]" />

      {/* Moroccan pattern overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'url(/images/can2025-pattern.png)',
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center',
        }}
      />

      {/* Africa border at top (same as header) */}
      <AfricaBorder position="top" />

      {/* Main footer */}
      <div className="relative container-main py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.jpg"
                alt="Afrique Sports"
                width={150}
                height={106}
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-300 mb-6 max-w-xs">
              {tFooter("description")}
            </p>
            {/* Social links - fixed layout */}
            <div className="flex flex-wrap items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#9DFF20] hover:text-[#04453f] transition-all duration-300 hover:scale-110"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-[#9DFF20]">
              {tFooter("categories")}
            </h3>
            <ul className="space-y-2">
              {footerLinksConfig.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/80 hover:text-[#9DFF20] transition-colors"
                  >
                    {tCategories(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Countries */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-[#9DFF20]">
              {tFooter("countries")}
            </h3>
            <ul className="space-y-2">
              {footerLinksConfig.countries.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/80 hover:text-[#9DFF20] transition-colors"
                  >
                    {tCountries(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Players */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-[#9DFF20]">
              {tFooter("keyPlayers")}
            </h3>
            <ul className="space-y-2">
              {footerLinksConfig.players.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/80 hover:text-[#9DFF20] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="container-main py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Afrique Sports. {tFooter("copyright")}
            </p>
            <div className="flex items-center gap-6">
              {footerLinksConfig.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/80 hover:text-[#9DFF20] transition-colors"
                >
                  {tNav(link.labelKey)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Africa border at bottom */}
      <AfricaBorder position="bottom" />
    </footer>
  );
}
