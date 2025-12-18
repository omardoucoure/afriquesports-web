"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const tCommon = useTranslations("common");
  // Generate JSON-LD structured data for breadcrumbs
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `https://www.afriquesports.net${item.href}`,
    })),
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb navigation */}
      <nav aria-label={tCommon("breadcrumb")} className={className}>
        <ol className="flex items-center flex-wrap gap-1 text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 mx-1 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}

                {isLast ? (
                  <span className="text-gray-900 font-medium line-clamp-2 sm:line-clamp-1">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-[#022a27] transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

// Slug to translation key mapping
const slugToKey: Record<string, { namespace: string; key: string }> = {
  afrique: { namespace: "categories", key: "africa" },
  europe: { namespace: "categories", key: "europe" },
  football: { namespace: "categories", key: "africa" },
  mercato: { namespace: "categories", key: "mercato" },
  "can-2025": { namespace: "categories", key: "can2025" },
  "coupe-du-monde": { namespace: "categories", key: "worldCup" },
  autres: { namespace: "categories", key: "others" },
  "ballon-dor": { namespace: "categories", key: "ballonDor" },
  youtube: { namespace: "categories", key: "videos" },
  // Countries
  senegal: { namespace: "countries", key: "senegal" },
  cameroun: { namespace: "countries", key: "cameroon" },
  "cote-divoire": { namespace: "countries", key: "ivoryCoast" },
  algerie: { namespace: "countries", key: "algeria" },
  maroc: { namespace: "countries", key: "morocco" },
  rdc: { namespace: "countries", key: "drc" },
  nigeria: { namespace: "countries", key: "nigeria" },
};

interface TranslationFunctions {
  tNav: (key: string) => string;
  tCategories: (key: string) => string;
  tCountries: (key: string) => string;
}

// Helper function to generate breadcrumb items from category path
export function generateBreadcrumbItems(
  path: string,
  title?: string,
  translations?: TranslationFunctions
): BreadcrumbItem[] {
  const homeLabel = translations?.tNav("home") || "Home";
  const items: BreadcrumbItem[] = [{ label: homeLabel, href: "/" }];

  const segments = path.split("/").filter(Boolean);

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Skip 'category' segment if present
    if (segment === "category") {
      return;
    }

    // If this is the last segment and we have a title, use the title
    if (index === segments.length - 1 && title) {
      items.push({
        label: title,
        href: currentPath,
      });
    } else {
      // Get translated label based on slug
      const mapping = slugToKey[segment];
      let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

      if (mapping && translations) {
        if (mapping.namespace === "categories") {
          label = translations.tCategories(mapping.key);
        } else if (mapping.namespace === "countries") {
          label = translations.tCountries(mapping.key);
        }
      }

      items.push({
        label,
        href: currentPath,
      });
    }
  });

  return items;
}
