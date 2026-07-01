import { Box, Paper, Text } from "metabase/ui";
import type { OrderRow } from "../../api";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: "rgba(34,197,94,.12)",  color: "#22c55e" },
  SHIPPED:   { bg: "rgba(99,102,241,.12)", color: "#818cf8" },
  PROCESSING:{ bg: "rgba(234,179,8,.12)",  color: "#eab308" },
  PENDING:   { bg: "rgba(148,163,184,.12)",color: "#94a3b8" },
  CANCELLED: { bg: "rgba(239,68,68,.12)",  color: "#ef4444" },
  cancelled: { bg: "rgba(239,68,68,.12)",  color: "#ef4444" },
};

const PLATFORM_ICON: Record<string, string> = {
  tiktok: "🎵",
  shopee: "🧡",
  lazada: "🛒",
};

export function RecentOrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <Paper p="md" withBorder radius="md">
      <Text size="sm" fw={600} mb="md">คำสั่งซื้อล่าสุด</Text>
      <Box style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Order ID", "Platform", "ลูกค้า", "สถานะ", "ยอด"].map(h => (
                <th
                  key={h}
                  style={{
                    textAlign: h === "ยอด" ? "right" : "left",
                    paddingBottom: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--mb-color-text-tertiary)",
                    borderBottom: "1px solid var(--mb-color-border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px 0", color: "var(--mb-color-text-tertiary)" }}>
                  ยังไม่มีข้อมูล
                </td>
              </tr>
            )}
            {orders.map(o => {
              const st = STATUS_STYLE[o.order_status] ?? STATUS_STYLE.PENDING;
              return (
                <tr key={`${o.platform}-${o.platform_order_id}`}>
                  <td style={{ padding: "7px 0", fontFamily: "monospace", fontSize: 10, color: "var(--mb-color-text-tertiary)" }}>
                    {o.platform_order_id.slice(0, 12)}
                  </td>
                  <td style={{ padding: "7px 0" }}>
                    {PLATFORM_ICON[o.platform] ?? "🛍️"} {o.platform}
                  </td>
                  <td style={{ padding: "7px 0" }}>{o.buyer_username || "—"}</td>
                  <td style={{ padding: "7px 0" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 7px",
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      background: st.bg,
                      color: st.color,
                    }}>
                      {o.order_status}
                    </span>
                  </td>
                  <td style={{ padding: "7px 0", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    ฿{Number(o.total_amount).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </Paper>
  );
}
