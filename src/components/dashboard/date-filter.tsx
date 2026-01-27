"use client";

import { cn } from "@/lib/utils";

const dateRanges = [
  { label: "24h", value: "24h" },
  { label: "2d", value: "2d" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  return (
    <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      {dateRanges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={cn(
            "relative px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200",
            value === range.value
              ? "bg-[#9DFF20] text-[#0A0A0F] shadow-[0_0_12px_rgba(157,255,32,0.2)]"
              : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
