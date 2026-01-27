"use client";

import { useMemo } from "react";

interface DataPoint {
  date: string;
  visitors: number;
  isHourly?: boolean;
}

interface AnalyticsChartProps {
  data: DataPoint[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.visitors));
  const isHourly = data[0]?.isHourly ?? false;
  const chartHeight = 220;
  const isWeekly = !isHourly && data.length <= 7;

  const formatLabel = (dateStr: string) => {
    if (isHourly) {
      const hour = parseInt(dateStr.slice(-2), 10);
      const ampm = hour >= 12 ? "pm" : "am";
      const hour12 = hour % 12 || 12;
      return `${hour12}${ampm}`;
    } else if (isWeekly) {
      const date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"));
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      const date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"));
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const formatTooltipDate = (dateStr: string) => {
    if (isHourly) {
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      const hour = parseInt(dateStr.slice(-2), 10);
      const ampm = hour >= 12 ? "pm" : "am";
      const hour12 = hour % 12 || 12;
      const date = new Date(`${year}-${month}-${day}`);
      const dateFormatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${dateFormatted}, ${hour12}${ampm}`;
    } else {
      const date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"));
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
  };

  const shouldShowLabel = (index: number) => {
    if (isHourly) return index % 4 === 0;
    if (data.length <= 7) return true;
    if (data.length <= 14) return index % 2 === 0;
    if (data.length <= 30) return index % 5 === 0;
    return index % 10 === 0;
  };

  // Generate SVG path for area chart
  const svgPath = useMemo(() => {
    if (data.length < 2) return { line: "", area: "" };

    const width = 100;
    const points = data.map((item, i) => ({
      x: (i / (data.length - 1)) * width,
      y: maxValue > 0 ? (1 - item.visitors / maxValue) * 100 : 100,
    }));

    // Smooth curve using cardinal spline
    let line = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      line += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const area = `${line} L ${points[points.length - 1].x},102 L ${points[0].x},102 Z`;

    return { line, area };
  }, [data, maxValue]);

  return (
    <div className="w-full">
      {/* SVG Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        {/* Grid lines */}
        <svg
          viewBox="0 0 100 102"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.3"
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between py-1 pointer-events-none">
          {[maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0].map(
            (val, i) => (
              <span key={i} className="text-[10px] text-white/20 font-medium tabular-nums">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </span>
            )
          )}
        </div>

        {/* Chart area */}
        <div className="absolute left-10 right-0 top-0 bottom-0">
          <svg
            viewBox="0 0 100 102"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Gradient fill */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9DFF20" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#9DFF20" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#9DFF20" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area */}
            <path
              d={svgPath.area}
              fill="url(#chartGradient)"
              className="transition-all duration-700"
            />

            {/* Line */}
            <path
              d={svgPath.line}
              fill="none"
              stroke="#9DFF20"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700"
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 2 }}
            />
          </svg>

          {/* Hover targets with tooltips */}
          <div className="absolute inset-0 flex">
            {data.map((item, i) => (
              <div
                key={item.date}
                className="flex-1 relative group"
              >
                {/* Hover line */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Dot */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#9DFF20] border-2 border-[#13131A] opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_8px_rgba(157,255,32,0.4)]"
                  style={{
                    top: `${maxValue > 0 ? (1 - item.visitors / maxValue) * 100 : 100}%`,
                  }}
                />

                {/* Tooltip */}
                <div className="hidden group-hover:block absolute -top-16 left-1/2 -translate-x-1/2 bg-[#1A1A24] border border-white/10 text-white text-xs px-3 py-2 rounded-xl shadow-xl z-10 whitespace-nowrap">
                  <div className="text-white/50 text-[10px] font-medium">{formatTooltipDate(item.date)}</div>
                  <div className="text-white font-bold text-[13px] mt-0.5">
                    {item.visitors.toLocaleString()}
                    <span className="text-white/40 font-normal text-[10px] ml-1">visitors</span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A1A24] border-r border-b border-white/10 rotate-45" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex pl-10 mt-2">
        {data.map((item, index) => (
          <div key={item.date} className="flex-1 text-center">
            {shouldShowLabel(index) && (
              <span className="text-[10px] text-white/25 font-medium">
                {formatLabel(item.date)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
