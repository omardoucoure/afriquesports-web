"use client";

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
  const chartHeight = 192;
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

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5 mb-2" style={{ height: chartHeight }}>
        {data.map((item) => {
          const heightPx = maxValue > 0 ? Math.max((item.visitors / maxValue) * chartHeight, 4) : 4;
          return (
            <div
              key={item.date}
              className="flex-1 relative group"
              style={{ height: chartHeight }}
            >
              <div className="hidden group-hover:block absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                <div className="font-medium">{formatTooltipDate(item.date)}</div>
                <div>{item.visitors.toLocaleString()} visitors</div>
              </div>
              <div
                className="absolute bottom-0 left-0.5 right-0.5 bg-[#9DFF20] hover:bg-[#b4ff50] rounded-t transition-all cursor-pointer"
                style={{ height: heightPx }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5">
        {data.map((item, index) => (
          <div key={item.date} className="flex-1 text-center">
            {shouldShowLabel(index) && (
              <span className="text-xs text-gray-500">
                {formatLabel(item.date)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
