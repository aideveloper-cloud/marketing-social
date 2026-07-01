import { Api } from "metabase/api";

export interface PlatformSummary {
  platform: string;
  orders_today: number;
  revenue_today: number;
  orders_week: number;
  revenue_week: number;
  orders_month: number;
  revenue_month: number;
}

export interface TrendRow {
  date: string;
  platform: string;
  orders: number;
  revenue: number;
}

export interface ProductRow {
  product_name: string;
  platform: string;
  total_qty: number;
  total_revenue: number;
}

export interface OrderRow {
  platform_order_id: string;
  platform: string;
  order_status: string;
  total_amount: number;
  buyer_username: string;
  created_at: string;
}

export interface SyncRow {
  platform: string;
  sync_type: string;
  status: string;
  records: number;
  finished_at: string;
}

export const marketingApi = Api.injectEndpoints({
  endpoints: builder => ({
    getMarketingSummary: builder.query<{ data: PlatformSummary[] }, void>({
      query: () => ({ url: "/api/marketing/summary", method: "GET" }),
    }),
    getMarketingTrend: builder.query<{ data: TrendRow[] }, void>({
      query: () => ({ url: "/api/marketing/trend", method: "GET" }),
    }),
    getMarketingTopProducts: builder.query<{ data: ProductRow[] }, void>({
      query: () => ({ url: "/api/marketing/top-products", method: "GET" }),
    }),
    getMarketingRecentOrders: builder.query<{ data: OrderRow[] }, void>({
      query: () => ({ url: "/api/marketing/recent-orders", method: "GET" }),
    }),
    getMarketingSyncStatus: builder.query<{ data: SyncRow[] }, void>({
      query: () => ({ url: "/api/marketing/sync-status", method: "GET" }),
    }),
  }),
});

export const {
  useGetMarketingSummaryQuery,
  useGetMarketingTrendQuery,
  useGetMarketingTopProductsQuery,
  useGetMarketingRecentOrdersQuery,
  useGetMarketingSyncStatusQuery,
} = marketingApi;
