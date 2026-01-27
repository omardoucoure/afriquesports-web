"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Search, ScrollText, Trophy, Menu, X, Users, Bell, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Stats", href: "/dashboard/stats", icon: BarChart3 },
  { name: "Authors", href: "/dashboard/authors", icon: Users },
  { name: "Articles", href: "/dashboard/articles", icon: Newspaper },
  { name: "SEO", href: "/dashboard/seo", icon: Search },
  { name: "Push", href: "/dashboard/push", icon: Bell },
  { name: "Logs", href: "/dashboard/logs", icon: ScrollText },
];

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-gray-900 text-white flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-[#9DFF20]" />
          <span className="font-semibold">Dashboard</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out pt-16",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
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

        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-800">
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
    </>
  );
}
