import { Box, Group, Paper, Stack, Text } from "metabase/ui";
import type { ProductRow } from "../../api";

export function TopProductsList({ rows }: { rows: ProductRow[] }) {
  const max = rows[0]?.total_revenue ? Number(rows[0].total_revenue) : 1;

  return (
    <Paper p="md" withBorder radius="md">
      <Text size="sm" fw={600} mb="md">สินค้าขายดีเดือนนี้</Text>
      <Stack gap="sm">
        {rows.length === 0 && (
          <Text c="text-tertiary" size="xs" ta="center" py="xl">ยังไม่มีข้อมูล</Text>
        )}
        {rows.map((r, i) => (
          <Box key={i}>
            <Group justify="space-between" mb={4}>
              <Group gap="xs" style={{ minWidth: 0, flex: 1 }}>
                <Text size="xs" c="text-tertiary" w={16} style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                  {i + 1}
                </Text>
                <Text size="xs" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.product_name || "—"}
                </Text>
              </Group>
              <Text size="xs" fw={600} style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                ฿{Number(r.total_revenue).toLocaleString()}
              </Text>
            </Group>
            <Box
              h={4}
              style={{ background: "var(--mb-color-bg-medium)", borderRadius: 2 }}
            >
              <Box
                h={4}
                style={{
                  width: `${(Number(r.total_revenue) / max) * 100}%`,
                  background: "linear-gradient(90deg, var(--mb-color-brand), var(--mb-color-error))",
                  borderRadius: 2,
                }}
              />
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
