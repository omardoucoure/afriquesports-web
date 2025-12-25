"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAnalytics } from "@/hooks/use-analytics";
import { MobileBottomNav } from "./mobile-bottom-nav";

// Code splitting: Lazy load heavy components that aren't needed for initial render
// This reduces initial JavaScript bundle by ~30-40%
const MobileNav = dynamic(() => import("./mobile-nav").then(mod => ({ default: mod.MobileNav })), {
  ssr: false,
  loading: () => null,
});

const SearchModal = dynamic(() => import("./search-modal").then(mod => ({ default: mod.SearchModal })), {
  ssr: false,
  loading: () => null,
});

const LanguageSwitcher = dynamic(() => import("@/components/ui").then(mod => ({ default: mod.LanguageSwitcher })), {
  ssr: false,
  loading: () => <div className="w-8 h-8" />, // Prevent layout shift
});

const NextMatchBar = dynamic(() => import("./next-match-bar").then(mod => ({ default: mod.NextMatchBar })), {
  ssr: false,
  loading: () => <div className="h-10" />, // Prevent layout shift
});

interface NavItem {
  labelKey: string;
  href: string;
  children?: NavItem[];
}

const navigationConfig: NavItem[] = [
  { labelKey: "home", href: "/" },
  {
    labelKey: "africa",
    href: "/category/afrique",
    children: [
      { labelKey: "senegal", href: "/category/afrique/senegal" },
      { labelKey: "cameroon", href: "/category/afrique/cameroun" },
      { labelKey: "ivoryCoast", href: "/category/afrique/cote-divoire" },
      { labelKey: "algeria", href: "/category/afrique/algerie" },
      { labelKey: "morocco", href: "/category/afrique/maroc" },
      { labelKey: "drc", href: "/category/afrique/rdc" },
    ],
  },
  { labelKey: "europe", href: "/category/europe" },
  { labelKey: "can2025", href: "/can-2025" },
  { labelKey: "matches", href: "/matches" },
  { labelKey: "mercato", href: "/mercato" },
  { labelKey: "videos", href: "/category/youtube" },
  { labelKey: "rankings", href: "/classements" },
];

// African border pattern component
function AfricaBorder({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div
      className={`absolute ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 h-2 bg-repeat-x`}
      style={{
        backgroundImage: 'url(/images/africa-border.png)',
        backgroundSize: 'auto 100%'
      }}
    />
  );
}

export function Header() {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const tNav = useTranslations("nav");
  const tCountries = useTranslations("countries");
  const tCommon = useTranslations("common");
  const { trackNavigation, track } = useAnalytics();

  // Navigation click handlers
  const handleLogoClick = () => {
    trackNavigation({
      targetType: 'logo',
      linkText: 'Afrique Sports',
      linkUrl: '/',
    });
  };

  const handleCategoryClick = (label: string, href: string, isSubcategory = false) => {
    trackNavigation({
      targetType: isSubcategory ? 'subcategory' : 'category',
      linkText: label,
      linkUrl: href,
      category: isSubcategory ? undefined : label,
      subcategory: isSubcategory ? label : undefined,
    });
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleMobileNavToggle = (isOpen: boolean) => {
    setIsMobileNavOpen(isOpen);
    track(isOpen ? 'Navigation_Open_Menu' : 'Navigation_Close_Menu', {
      menu_type: 'mobile',
    });
  };

  // Hide NextMatchBar on match pages
  const isMatchPage = pathname?.includes('/match/');

  // Build navigation with translated labels
  const navigation = navigationConfig.map((item) => ({
    label: item.labelKey === "home" ? tNav("home").toUpperCase() :
           item.labelKey === "africa" ? tNav("africa").toUpperCase() :
           item.labelKey === "europe" ? tNav("europe").toUpperCase() :
           item.labelKey === "can2025" ? tNav("can2025").toUpperCase() :
           item.labelKey === "matches" ? tNav("matches").toUpperCase() :
           item.labelKey === "mercato" ? tNav("mercato").toUpperCase() :
           item.labelKey === "videos" ? tNav("videos").toUpperCase() :
           item.labelKey === "rankings" ? tNav("rankings").toUpperCase() : item.labelKey,
    href: item.href,
    children: item.children?.map((child) => ({
      label: child.labelKey === "senegal" ? tCountries("senegal").toUpperCase() :
             child.labelKey === "cameroon" ? tCountries("cameroon").toUpperCase() :
             child.labelKey === "ivoryCoast" ? tCountries("ivoryCoast").toUpperCase() :
             child.labelKey === "algeria" ? tCountries("algeria").toUpperCase() :
             child.labelKey === "morocco" ? tCountries("morocco").toUpperCase() :
             child.labelKey === "drc" ? tCountries("drc").toUpperCase() : child.labelKey,
      href: child.href,
    })),
  }));

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Main header with Africa borders */}
        <div className="relative bg-[#04453f] py-1 overflow-visible">
          {/* Moroccan pattern overlay (same as footer) */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'url(/images/can2025-pattern.png)',
              backgroundSize: 'auto 200px',
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'center',
            }}
          />
          <AfricaBorder position="top" />
          <AfricaBorder position="bottom" />
          <div className="container-main relative z-20">
            <div className="flex items-center justify-between h-14 md:h-16">
              {/* Logo */}
              <Link href="/" className="flex-shrink-0" onClick={handleLogoClick}>
                <Image
                  src="/logo.jpg"
                  alt="Afrique Sports"
                  width={150}
                  height={106}
                  className="h-10 md:h-12 w-auto rounded"
                  priority
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center">
                {navigation.map((item, index) => (
                  <div
                    key={item.href}
                    className="relative flex items-center"
                  >
                    <div
                      className="relative"
                      onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <Link
                        href={item.href}
                        onClick={() => handleCategoryClick(item.label, item.href)}
                        className={`px-3 py-2 text-xs lg:text-sm font-bold text-white hover:text-[#9DFF20] transition-colors tracking-wide inline-flex items-center ${item.children ? 'pb-4' : ''}`}
                      >
                        {item.label}
                        {item.children && (
                          <svg
                            className="inline-block w-3 h-3 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </Link>

                      {/* Dropdown */}
                      {item.children && activeDropdown === item.label && (
                        <div className="absolute top-full left-0 w-52 bg-[#022a27] py-2 z-[100] shadow-lg rounded-b">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => handleCategoryClick(child.label, child.href, true)}
                              className="block px-4 py-2 text-sm font-medium text-white hover:bg-[#04453f] hover:text-[#9DFF20] transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Separator */}
                    {index < navigation.length - 1 && (
                      <span className="hidden lg:inline-block text-white/30 mx-1">|</span>
                    )}
                  </div>
                ))}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Language switcher - hidden on mobile */}
                <div className="hidden md:block">
                  <LanguageSwitcher />
                </div>

                {/* Search button */}
                <button
                  onClick={handleSearchClick}
                  className="p-2 text-white hover:text-[#9DFF20] transition-colors"
                  aria-label={tCommon("search")}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* CAN 2025 Next Match Banner - Hidden on match pages */}
        {!isMatchPage && <NextMatchBar />}

      </header>

      {/* Mobile bottom navigation */}
      <MobileBottomNav onMenuClick={() => handleMobileNavToggle(true)} />

      {/* Mobile navigation drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => handleMobileNavToggle(false)}
        navigation={navigation}
      />

      {/* Search modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
