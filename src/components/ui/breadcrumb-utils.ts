// Breadcrumb utility functions - can be used in both server and client components

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface TranslationFunctions {
  tNav: (key: string) => string;
  tCategories: (key: string) => string;
  tCountries: (key: string) => string;
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
