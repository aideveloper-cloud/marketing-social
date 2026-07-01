import { Box, Group, Paper, Text } from "metabase/ui";
import type { SyncRow } from "../../api";

export function SyncStatusBar({ rows }: { rows: SyncRow[] }) {
  return (
    <Paper p="sm" withBorder radius="md">
      <Group gap="lg" wrap="wrap" align="center">
        <Text size="xs" fw={600} tt="uppercase" lts="0.06em" c="text-secondary">
          Sync Log
        </Text>
        {rows.map((r, i) => (
          <Group key={i} gap="xs">
            <Box
              w={6} h={6}
              style={{
                borderRadius: "50%",
                background: r.status === "success" ? "var(--mb-color-success)" : "var(--mb-color-error)",
                flexShrink: 0,
              }}
            />
            <Text size="xs" c="text-secondary">
              {r.platform} · {r.sync_type} · {r.records} records ·{" "}
              {r.finished_at
                ? new Date(r.finished_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </Text>
          </Group>
        ))}
      </Group>
    </Paper>
  );
}
