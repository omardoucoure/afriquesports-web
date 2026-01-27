"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Search, ScrollText, Trophy, Users, Bell, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Stats", href: "/dashboard/stats", icon: BarChart3 },
  { name: "Authors", href: "/dashboard/authors", icon: Users },
  { name: "Articles", href: "/dashboard/articles", icon: Newspaper },
  { name: "SEO", href: "/dashboard/seo", icon: Search },
  { name: "Push", href: "/dashboard/push", icon: Bell },
  { name: "Logs", href: "/dashboard/logs", icon: ScrollText },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-800">
        <Trophy className="h-8 w-8 text-[#9DFF20]" />
        <span className="font-semibold text-lg">Dashboard</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#9DFF20] text-black"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <Link
          href="https://www.afriquesports.net"
          target="_blank"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span>View Site</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </aside>
  );
}
