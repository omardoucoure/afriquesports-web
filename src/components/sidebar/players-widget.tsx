"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Player {
  name: string;
  slug: string;
  team: string;
  position: string;
  image?: string;
  country?: string;
  countryFlag?: string;
}

interface PlayersWidgetProps {
  title?: string;
  players?: Player[];
}

const defaultPlayers: Player[] = [
  {
    name: "Victor Osimhen",
    slug: "victor-osimhen",
    team: "Galatasaray",
    position: "Attaquant",
    country: "Nigeria",
    countryFlag: "🇳🇬",
  },
  {
    name: "Sadio Mané",
    slug: "sadio-mane",
    team: "Al-Nassr",
    position: "Ailier",
    country: "Sénégal",
    countryFlag: "🇸🇳",
  },
  {
    name: "Mohamed Salah",
    slug: "mohamed-salah",
    team: "Liverpool",
    position: "Ailier",
    country: "Égypte",
    countryFlag: "🇪🇬",
  },
  {
    name: "Kalidou Koulibaly",
    slug: "kalidou-koulibaly",
    team: "Al-Hilal",
    position: "Défenseur",
    country: "Sénégal",
    countryFlag: "🇸🇳",
  },
  {
    name: "Riyad Mahrez",
    slug: "riyad-mahrez",
    team: "Al-Ahli",
    position: "Ailier",
    country: "Algérie",
    countryFlag: "🇩🇿",
  },
];

export function PlayersWidget({
  title,
  players = defaultPlayers,
}: PlayersWidgetProps) {
  const tHome = useTranslations("home");
  const displayTitle = title || tHome("keyPlayers");

  return (
    <div className="bg-white rounded p-4">
      {/* Header */}
      <h3 className="font-bold text-gray-900 mb-4">{displayTitle}</h3>

      {/* Players list */}
      <div className="space-y-3">
        {players.map((player) => (
          <Link
            key={player.slug}
            href={`/joueur/${player.slug}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            {/* Avatar */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {player.image ? (
                <Image
                  src={player.image}
                  alt={player.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#04453f]/20 text-[#022a27] font-bold text-lg">
                  {player.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 group-hover:text-[#022a27] transition-colors truncate">
                  {player.name}
                </span>
                {player.countryFlag && (
                  <span className="text-sm">{player.countryFlag}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{player.team}</span>
                <span>•</span>
                <span>{player.position}</span>
              </div>
            </div>

            {/* Arrow */}
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-[#04453f] transition-colors"
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
          </Link>
        ))}
      </div>
    </div>
  );
}

