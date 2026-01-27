"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Search,
  ScrollText,
  Menu,
  X,
  Users,
  Bell,
  Newspaper,
  ExternalLink,
  Zap,
} from "lucide-react";
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
      {/* Top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[#0E0E14]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#9DFF20] shadow-[0_0_16px_rgba(157,255,32,0.15)]">
            <Zap className="h-4 w-4 text-[#0A0A0F]" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[14px] text-white tracking-tight">
            Afrique Sports
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/[0.06] transition-colors"
        >
          {isOpen ? (
            <X className="h-5 w-5 text-white/70" />
          ) : (
            <Menu className="h-5 w-5 text-white/70" />
          )}
        </button>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-40 w-[260px] bg-[#0E0E14] border-r border-white/[0.06] transform transition-transform duration-300 ease-out pt-16",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="px-3 py-5 space-y-0.5">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] px-3 mb-3">
            Menu
          </p>
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#9DFF20]/10 text-[#9DFF20]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#9DFF20] rounded-r-full" />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors duration-200",
                    isActive
                      ? "text-[#9DFF20]"
                      : "text-white/30 group-hover:text-white/60"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-white/[0.06]">
          <Link
            href="https://www.afriquesports.net"
            target="_blank"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
          >
            <span className="font-medium">View site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>
    </>
  );
}
