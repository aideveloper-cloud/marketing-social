import { Box, Paper, Skeleton, Stack, Text } from "metabase/ui";

interface KpiCardProps {
  label: string;
  value: string;
  loading?: boolean;
  color: string;
}

export function KpiCard({ label, value, loading, color }: KpiCardProps) {
  return (
    <Paper p="md" withBorder radius="md">
      <Stack gap={4}>
        <Box
          h={3}
          mb={8}
          style={{ borderRadius: 2, background: color, width: "100%" }}
        />
        <Text size="xs" fw={600} tt="uppercase" lts="0.06em" c="text-secondary">
          {label}
        </Text>
        {loading ? (
          <Skeleton height={32} width="60%" />
        ) : (
          <Text size="xl" fw={700} style={{ color, fontVariantNumeric: "tabular-nums" }}>
            {value}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
