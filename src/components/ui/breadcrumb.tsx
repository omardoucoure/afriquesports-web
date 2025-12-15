import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
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
      <nav aria-label="Fil d'Ariane" className={className}>
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
                  <span className="text-gray-600 font-medium truncate max-w-[200px]">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-[#345C00] transition-colors"
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

// Helper function to generate breadcrumb items from category path
export function generateBreadcrumbItems(
  path: string,
  title?: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: "Accueil", href: "/" }];

  const segments = path.split("/").filter(Boolean);

  // Category mappings for display labels
  const categoryLabels: Record<string, string> = {
    afrique: "Afrique",
    europe: "Europe",
    football: "Football",
    mercato: "Mercato",
    "can-2025": "CAN 2025",
    "coupe-du-monde": "Coupe du Monde",
    autres: "Autres Sports",
    "ballon-dor": "Ballon d'Or",
    youtube: "Vidéos",
    // Countries
    senegal: "Sénégal",
    cameroun: "Cameroun",
    "cote-divoire": "Côte d'Ivoire",
    algerie: "Algérie",
    maroc: "Maroc",
    rdc: "RDC",
    nigeria: "Nigeria",
  };

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
      items.push({
        label: categoryLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      });
    }
  });

  return items;
}
