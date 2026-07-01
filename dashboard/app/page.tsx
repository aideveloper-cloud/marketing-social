"use client";

import { useEffect, useState } from "react";
import KpiCard from "@/components/KpiCard";
import RevenueTrend from "@/components/RevenueTrend";
import TopProducts from "@/components/TopProducts";
import RecentOrders from "@/components/RecentOrders";

interface SummaryRow {
  platform: string;
  orders_today: number;
  revenue_today: number;
  orders_week: number;
  revenue_week: number;
  orders_month: number;
  revenue_month: number;
}

interface TrendRow {
  date: string;
  platform: string;
  orders: number;
  revenue: number;
}

interface ProductRow {
  product_name: string;
  platform: string;
  total_qty: number;
  total_revenue: number;
}

interface OrderRow {
  platform_order_id: string;
  platform: string;
  order_status: string;
  total_amount: number;
  buyer_username: string;
  created_at: string;
}

interface SyncRow {
  platform: string;
  sync_type: string;
  status: string;
  records: number;
  finished_at: string;
}

interface Stats {
  summary: SummaryRow[];
  trend: TrendRow[];
  topProducts: ProductRow[];
  recentOrders: OrderRow[];
  syncStatus: SyncRow[];
}

const PERIOD_LABEL = ["วันนี้", "สัปดาห์นี้", "เดือนนี้"] as const;
type Period = 0 | 1 | 2;

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(1)}k`;
  return `฿${n.toLocaleString()}`;
}

function totalRevenue(summary: SummaryRow[], period: Period) {
  const key = (["revenue_today", "revenue_week", "revenue_month"] as const)[period];
  return summary.reduce((s, r) => s + Number(r[key]), 0);
}

function totalOrders(summary: SummaryRow[], period: Period) {
  const key = (["orders_today", "orders_week", "orders_month"] as const)[period];
  return summary.reduce((s, r) => s + Number(r[key]), 0);
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<Period>(0);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error(await res.text());
      setStats(await res.json());
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000); // refresh ทุก 5 นาที
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 max-w-md text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-sm font-semibold text-red-600 mb-1">เชื่อมต่อ database ไม่ได้</p>
          <p className="text-xs text-gray-400 font-mono">{error}</p>
          <button onClick={load} className="mt-4 text-xs text-violet-600 underline">ลองใหม่</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-3">⟳</div>
          <p className="text-sm text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const { summary, trend, topProducts, recentOrders, syncStatus } = stats;
  const rev = totalRevenue(summary, period);
  const ord = totalOrders(summary, period);
  const revenueKeys = (["revenue_today", "revenue_week", "revenue_month"] as const)[period];
  const orderKeys   = (["orders_today",  "orders_week",  "orders_month"] as const)[period];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h1 className="text-base font-bold text-gray-800">Marketing Dashboard</h1>
              <p className="text-xs text-gray-400">ภาพรวมยอดขายทุก Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Period toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {PERIOD_LABEL.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setPeriod(i as Period)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    period === i
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              ↻ {lastUpdated ? lastUpdated.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : ""}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI — รวม */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label={`ยอดขายรวม${PERIOD_LABEL[period] ? " " + PERIOD_LABEL[period] : ""}`}
            value={fmtMoney(rev)}
            icon="💰"
            color="text-violet-600"
          />
          <KpiCard
            label={`Orders ${PERIOD_LABEL[period]}`}
            value={ord.toLocaleString()}
            icon="🛍️"
            color="text-blue-600"
          />
          <KpiCard
            label="Avg Order Value"
            value={ord > 0 ? fmtMoney(rev / ord) : "—"}
            icon="📦"
            color="text-emerald-600"
          />
          <KpiCard
            label="Platforms ที่ active"
            value={`${summary.filter((r) => Number(r[revenueKeys]) > 0).length} / ${summary.length}`}
            icon="🌐"
            color="text-pink-600"
          />
        </div>

        {/* KPI — แยก Platform */}
        {summary.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {summary.map((r) => (
              <div key={r.platform} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">
                    {r.platform === "tiktok" ? "🎵" : r.platform === "shopee" ? "🧡" : "🛒"}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 capitalize">{r.platform}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">ยอดขาย</p>
                    <p className="text-lg font-bold text-gray-800">{fmtMoney(Number(r[revenueKeys]))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Orders</p>
                    <p className="text-lg font-bold text-gray-800">{Number(r[orderKeys]).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trend chart */}
        <RevenueTrend rows={trend} />

        {/* Products + Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopProducts rows={topProducts} />
          <RecentOrders orders={recentOrders} />
        </div>

        {/* Sync status */}
        {syncStatus.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">สถานะ Sync ล่าสุด</h2>
            <div className="flex flex-wrap gap-3">
              {syncStatus.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded-xl px-3 py-2">
                  <span className={s.status === "success" ? "text-green-500" : "text-red-500"}>
                    {s.status === "success" ? "✓" : "✗"}
                  </span>
                  <span className="font-medium capitalize">{s.platform}</span>
                  <span className="text-gray-400">{s.sync_type}</span>
                  <span className="text-gray-400">{s.records} records</span>
                  <span className="text-gray-300">
                    {s.finished_at
                      ? new Date(s.finished_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
