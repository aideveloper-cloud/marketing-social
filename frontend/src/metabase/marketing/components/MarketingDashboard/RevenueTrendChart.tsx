import { useMemo } from "react";
import { Box, Paper, Skeleton, Text } from "metabase/ui";
import type { TrendRow } from "../../api";

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "#ff2d55",
  shopee: "#f65520",
  lazada: "#4f7fff",
};

interface Props {
  rows: TrendRow[];
  loading?: boolean;
}

export function RevenueTrendChart({ rows, loading }: Props) {
  const { dates, platforms, points, maxRevenue } = useMemo(() => {
    const dates = [...new Set(rows.map(r => r.date))].sort();
    const platforms = [...new Set(rows.map(r => r.platform))];
    const byKey = new Map(rows.map(r => [`${r.date}|${r.platform}`, Number(r.revenue)]));
    const maxRevenue = Math.max(...rows.map(r => Number(r.revenue)), 1);
    const points = platforms.map(platform =>
      dates.map(date => byKey.get(`${date}|${platform}`) ?? 0),
    );
    return { dates, platforms, points, maxRevenue };
  }, [rows]);

  const W = 860;
  const H = 160;
  const PAD = { top: 12, right: 8, bottom: 24, left: 8 };

  function xPos(i: number) {
    if (dates.length < 2) return PAD.left;
    return PAD.left + (i / (dates.length - 1)) * (W - PAD.left - PAD.right);
  }
  function yPos(v: number) {
    return PAD.top + (1 - v / maxRevenue) * (H - PAD.top - PAD.bottom);
  }
  function toPath(values: number[]) {
    return values
      .map((v, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`)
      .join(" ");
  }
  function toArea(values: number[]) {
    const line = toPath(values);
    const last = values.length - 1;
    return `${line} L${xPos(last).toFixed(1)},${H - PAD.bottom} L${xPos(0).toFixed(1)},${H - PAD.bottom} Z`;
  }

  const xLabels = dates.filter((_, i) => i % Math.ceil(dates.length / 6) === 0);

  return (
    <Paper p="md" withBorder radius="md">
      <Text size="sm" fw={600} mb="md">ยอดขาย 30 วัน</Text>

      {loading ? (
        <Skeleton height={160} />
      ) : rows.length === 0 ? (
        <Box h={160} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text c="text-tertiary" size="sm">ยังไม่มีข้อมูล</Text>
        </Box>
      ) : (
        <Box style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
            <defs>
              {platforms.map(p => (
                <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PLATFORM_COLORS[p] ?? "#888"} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={PLATFORM_COLORS[p] ?? "#888"} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map(frac => (
              <line
                key={frac}
                x1={PAD.left} y1={yPos(maxRevenue * frac)}
                x2={W - PAD.right} y2={yPos(maxRevenue * frac)}
                stroke="var(--mb-color-border)"
                strokeWidth={1}
              />
            ))}

            {/* Area + line per platform */}
            {platforms.map((p, pi) => (
              <g key={p}>
                <path
                  d={toArea(points[pi])}
                  fill={`url(#grad-${p})`}
                />
                <path
                  d={toPath(points[pi])}
                  fill="none"
                  stroke={PLATFORM_COLORS[p] ?? "#888"}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            ))}

            {/* X labels */}
            {xLabels.map(date => {
              const i = dates.indexOf(date);
              const label = date.slice(5); // MM-DD
              return (
                <text key={date} x={xPos(i)} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--mb-color-text-tertiary)">
                  {label}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <Box style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {platforms.map(p => (
              <Box key={p} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Box
                  w={8} h={8}
                  style={{ borderRadius: "50%", background: PLATFORM_COLORS[p] ?? "#888", flexShrink: 0 }}
                />
                <Text size="xs" c="text-secondary">{p}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
