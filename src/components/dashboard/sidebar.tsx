"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Search,
  ScrollText,
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

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0E0E14] border-r border-white/[0.06] flex flex-col">
      {/* Logo area */}
      <div className="flex h-[72px] items-center gap-3 px-6 border-b border-white/[0.06]">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#9DFF20] shadow-[0_0_20px_rgba(157,255,32,0.2)]">
          <Zap className="h-5 w-5 text-[#0A0A0F]" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[15px] text-white tracking-tight leading-none">
            Afrique Sports
          </span>
          <span className="text-[11px] text-white/40 font-medium tracking-wide uppercase mt-0.5">
            Dashboard
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] px-3 mb-3">
          Menu
        </p>
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
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

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
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
  );
}
