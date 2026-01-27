"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  accentColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  accentColor = "#9DFF20",
}: StatCardProps) {
  const ChangeIcon =
    changeType === "positive"
      ? ArrowUpRight
      : changeType === "negative"
        ? ArrowDownRight
        : Minus;

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-[#13131A] border border-white/[0.06] p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-[#15151D]">
      {/* Subtle gradient glow on hover */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"
        style={{ background: `${accentColor}10` }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-white/40 uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-2 text-[28px] font-bold text-white leading-none tracking-tight">
            {value}
          </p>
          {change && (
            <div className="mt-2.5 flex items-center gap-1">
              <div
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold",
                  changeType === "positive" &&
                    "bg-emerald-500/10 text-emerald-400",
                  changeType === "negative" && "bg-red-500/10 text-red-400",
                  changeType === "neutral" && "bg-white/[0.06] text-white/40"
                )}
              >
                <ChangeIcon className="h-3 w-3" />
                {change}
              </div>
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ backgroundColor: `${accentColor}12` }}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: accentColor }}
          />
        </div>
      </div>
    </div>
  );
}
