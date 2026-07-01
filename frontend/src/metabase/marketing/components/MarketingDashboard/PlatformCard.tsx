import { Box, Group, Paper, Stack, Text } from "metabase/ui";

const PLATFORM_META = {
  tiktok:  { icon: "🎵", color: "#ff2d55", label: "TikTok Shop" },
  shopee:  { icon: "🧡", color: "#f65520", label: "Shopee" },
  lazada:  { icon: "🛒", color: "#4f7fff", label: "Lazada" },
} as const;

type Platform = keyof typeof PLATFORM_META;

interface PlatformCardProps {
  platform: Platform;
  revenue: number | null;
  orders: number | null;
  totalRevenue: number;
}

export function PlatformCard({ platform, revenue, orders, totalRevenue }: PlatformCardProps) {
  const meta = PLATFORM_META[platform];
  const isActive = revenue !== null && revenue > 0;
  const share = totalRevenue > 0 && revenue ? (revenue / totalRevenue) * 100 : 0;

  function fmt(n: number) {
    if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `฿${(n / 1_000).toFixed(1)}k`;
    return `฿${n.toLocaleString()}`;
  }

  return (
    <Paper p="md" withBorder radius="md" style={{ opacity: isActive ? 1 : 0.45 }}>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="lg">{meta.icon}</Text>
            <Text size="sm" fw={600}>{meta.label}</Text>
          </Group>
          {!isActive && (
            <Text size="xs" c="text-tertiary" fw={500}>เร็วๆ นี้</Text>
          )}
          {isActive && (
            <Text size="xs" c="text-secondary">{share.toFixed(0)}%</Text>
          )}
        </Group>

        <Group grow>
          <Box>
            <Text size="xs" c="text-secondary">ยอดขาย</Text>
            <Text size="md" fw={700} style={{ fontVariantNumeric: "tabular-nums" }}>
              {isActive ? fmt(revenue!) : "—"}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c="text-secondary">Orders</Text>
            <Text size="md" fw={700} style={{ fontVariantNumeric: "tabular-nums" }}>
              {isActive ? (orders ?? 0).toLocaleString() : "—"}
            </Text>
          </Box>
        </Group>

        <Box
          h={3}
          style={{ background: "var(--mb-color-bg-medium)", borderRadius: 2 }}
        >
          <Box
            h={3}
            style={{
              width: `${share}%`,
              background: meta.color,
              borderRadius: 2,
              transition: "width 0.4s ease",
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}
