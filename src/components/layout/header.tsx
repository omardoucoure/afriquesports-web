"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MobileNav } from "./mobile-nav";
import { SearchModal } from "./search-modal";

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { label: "Accueil", href: "/" },
  {
    label: "Afrique",
    href: "/category/afrique",
    children: [
      { label: "Sénégal", href: "/category/afrique/senegal" },
      { label: "Cameroun", href: "/category/afrique/cameroun" },
      { label: "Côte d'Ivoire", href: "/category/afrique/cote-divoire" },
      { label: "Algérie", href: "/category/afrique/algerie" },
      { label: "Maroc", href: "/category/afrique/maroc" },
      { label: "RDC", href: "/category/afrique/rdc" },
    ],
  },
  { label: "Europe", href: "/category/europe" },
  { label: "CAN 2025", href: "/category/can-2025" },
  { label: "Mercato", href: "/mercato" },
  { label: "Vidéos", href: "/category/youtube" },
  { label: "Classements", href: "/classements" },
];

export function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black">
        {/* Main header */}
        <div className="container-main">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#9DFF20] rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-sm md:text-base">AS</span>
                </div>
                <span className="hidden sm:block text-white font-bold text-lg">
                  Afrique Sports
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium text-white hover:text-[#9DFF20] transition-colors"
                  >
                    {item.label}
                    {item.children && (
                      <svg
                        className="inline-block w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </Link>

                  {/* Dropdown */}
                  {item.children && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#345C00]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-white hover:text-[#9DFF20] transition-colors"
                aria-label="Rechercher"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="lg:hidden p-2 text-white hover:text-[#9DFF20] transition-colors"
                aria-label="Menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile horizontal scroll navigation */}
        <div className="lg:hidden border-t border-white/10">
          <div className="overflow-x-auto scrollbar-hide">
            <nav className="flex items-center gap-1 px-4 py-2 min-w-max">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-[#9DFF20] whitespace-nowrap transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        navigation={navigation}
      />

      {/* Search modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
