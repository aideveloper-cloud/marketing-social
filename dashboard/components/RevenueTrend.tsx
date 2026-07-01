"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "#ff0050",
  shopee: "#f65520",
  lazada: "#0f1469",
};

interface Row {
  date: string;
  platform: string;
  revenue: number;
}

interface Props {
  rows: Row[];
}

export default function RevenueTrend({ rows }: Props) {
  // Pivot: [{date, tiktok, shopee, lazada}, ...]
  const dates = [...new Set(rows.map((r) => r.date))].sort();
  const platforms = [...new Set(rows.map((r) => r.platform))];

  const data = dates.map((date) => {
    const entry: Record<string, unknown> = {
      date: format(parseISO(date), "d MMM"),
    };
    for (const p of platforms) {
      const found = rows.find((r) => r.date === date && r.platform === p);
      entry[p] = found ? Number(found.revenue) : 0;
    }
    return entry;
  });

  const fmt = (v: number) =>
    v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : `฿${v}`;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-600 mb-4">ยอดขาย 30 วัน</h2>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            {platforms.map((p) => (
              <linearGradient key={p} id={`g-${p}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PLATFORM_COLORS[p] ?? "#888"} stopOpacity={0.2} />
                <stop offset="95%" stopColor={PLATFORM_COLORS[p] ?? "#888"} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={(v) => [`฿${Number(v).toLocaleString()}`, ""]} />
          <Legend />
          {platforms.map((p) => (
            <Area
              key={p}
              type="monotone"
              dataKey={p}
              stroke={PLATFORM_COLORS[p] ?? "#888"}
              fill={`url(#g-${p})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
