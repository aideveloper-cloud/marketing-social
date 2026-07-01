import { useState } from "react";

import {
  Box,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "metabase/ui";

import {
  useGetMarketingRecentOrdersQuery,
  useGetMarketingSummaryQuery,
  useGetMarketingSyncStatusQuery,
  useGetMarketingTopProductsQuery,
  useGetMarketingTrendQuery,
} from "../../api";
import { KpiCard } from "./KpiCard";
import { PlatformCard } from "./PlatformCard";
import { RecentOrdersTable } from "./RecentOrdersTable";
import { RevenueTrendChart } from "./RevenueTrendChart";
import { SyncStatusBar } from "./SyncStatusBar";
import { TopProductsList } from "./TopProductsList";

type Period = "today" | "week" | "month";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "วันนี้" },
  { value: "week", label: "สัปดาห์นี้" },
  { value: "month", label: "เดือนนี้" },
];

function fmtMoney(n: number): string {
  if (n >= 1_000_000) {
    return `฿${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `฿${(n / 1_000).toFixed(1)}k`;
  }
  return `฿${n.toLocaleString()}`;
}

export function MarketingDashboard() {
  const [period, setPeriod] = useState<Period>("today");

  const { data: summaryData, isLoading: loadingSummary } =
    useGetMarketingSummaryQuery();
  const { data: trendData, isLoading: loadingTrend } =
    useGetMarketingTrendQuery();
  const { data: productsData } = useGetMarketingTopProductsQuery();
  const { data: ordersData } = useGetMarketingRecentOrdersQuery();
  const { data: syncData } = useGetMarketingSyncStatusQuery();

  const summary = summaryData?.data ?? [];
  const trend = trendData?.data ?? [];
  const products = productsData?.data ?? [];
  const orders = ordersData?.data ?? [];
  const syncStatus = syncData?.data ?? [];

  const revenueKey =
    period === "today"
      ? "revenue_today"
      : period === "week"
        ? "revenue_week"
        : "revenue_month";
  const ordersKey =
    period === "today"
      ? "orders_today"
      : period === "week"
        ? "orders_week"
        : "orders_month";

  const totalRevenue = summary.reduce((s, r) => s + Number(r[revenueKey]), 0);
  const totalOrders = summary.reduce((s, r) => s + Number(r[ordersKey]), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <Stack gap="lg" p="lg">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Box>
          <Title order={2} fw={700}>
            Marketing Dashboard
          </Title>
          <Text c="text-secondary" size="sm">
            ภาพรวมยอดขายทุก Platform
          </Text>
        </Box>

        <Group gap="xs">
          {PERIODS.map(p => (
            <Box
              key={p.value}
              component="button"
              px="sm"
              py={6}
              style={{
                cursor: "pointer",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: period === p.value ? 600 : 400,
                background:
                  period === p.value
                    ? "var(--mb-color-bg-medium)"
                    : "transparent",
                color:
                  period === p.value
                    ? "var(--mb-color-text-primary)"
                    : "var(--mb-color-text-tertiary)",
              }}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Box>
          ))}
        </Group>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={4} spacing="md">
        <KpiCard
          label={`ยอดขาย${period === "today" ? "วันนี้" : period === "week" ? "สัปดาห์นี้" : "เดือนนี้"}`}
          value={fmtMoney(totalRevenue)}
          loading={loadingSummary}
          color="var(--mb-color-warning)"
        />
        <KpiCard
          label="จำนวน Orders"
          value={totalOrders.toLocaleString()}
          loading={loadingSummary}
          color="var(--mb-color-error)"
        />
        <KpiCard
          label="Avg Order Value"
          value={totalOrders > 0 ? fmtMoney(avgOrderValue) : "—"}
          loading={loadingSummary}
          color="var(--mb-color-brand)"
        />
        <KpiCard
          label="Platforms ที่ active"
          value={`${summary.filter(r => Number(r[revenueKey]) > 0).length} / ${summary.length}`}
          loading={loadingSummary}
          color="var(--mb-color-success)"
        />
      </SimpleGrid>

      {/* Platform breakdown */}
      <SimpleGrid cols={3} spacing="md">
        {(["tiktok", "shopee", "lazada"] as const).map(platform => {
          const row = summary.find(r => r.platform === platform);
          return (
            <PlatformCard
              key={platform}
              platform={platform}
              revenue={row ? Number(row[revenueKey]) : null}
              orders={row ? Number(row[ordersKey]) : null}
              totalRevenue={totalRevenue}
            />
          );
        })}
      </SimpleGrid>

      {/* Trend chart */}
      <RevenueTrendChart rows={trend} loading={loadingTrend} />

      {/* Products + Orders */}
      <SimpleGrid cols={2} spacing="md">
        <TopProductsList rows={products} />
        <RecentOrdersTable orders={orders} />
      </SimpleGrid>

      {/* Sync status */}
      {syncStatus.length > 0 && <SyncStatusBar rows={syncStatus} />}
    </Stack>
  );
}
