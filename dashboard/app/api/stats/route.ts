import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const client = await pool.connect();
  try {
    const [summary, trend, topProducts, recentOrders, syncStatus] =
      await Promise.all([
        // KPI cards — today / this week / this month per platform
        client.query(`
          SELECT
            platform,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                          AS orders_today,
            COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0)    AS revenue_today,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW()))              AS orders_week,
            COALESCE(SUM(total_amount) FILTER (WHERE created_at >= date_trunc('week', NOW())), 0) AS revenue_week,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))             AS orders_month,
            COALESCE(SUM(total_amount) FILTER (WHERE created_at >= date_trunc('month', NOW())), 0) AS revenue_month
          FROM ecommerce.orders
          WHERE order_status NOT IN ('CANCELLED', 'cancelled')
          GROUP BY platform
        `),

        // 30-day daily trend per platform
        client.query(`
          SELECT
            DATE(created_at)  AS date,
            platform,
            COUNT(*)          AS orders,
            COALESCE(SUM(total_amount), 0) AS revenue
          FROM ecommerce.orders
          WHERE created_at >= NOW() - INTERVAL '30 days'
            AND order_status NOT IN ('CANCELLED', 'cancelled')
          GROUP BY DATE(created_at), platform
          ORDER BY date
        `),

        // Top 10 products this month
        client.query(`
          SELECT
            i.product_name,
            i.platform,
            SUM(i.quantity)  AS total_qty,
            SUM(i.subtotal)  AS total_revenue
          FROM ecommerce.order_items i
          JOIN ecommerce.orders o
            ON o.platform = i.platform AND o.platform_order_id = i.platform_order_id
          WHERE o.created_at >= date_trunc('month', NOW())
            AND o.order_status NOT IN ('CANCELLED', 'cancelled')
          GROUP BY i.product_name, i.platform
          ORDER BY total_revenue DESC
          LIMIT 10
        `),

        // Last 20 orders
        client.query(`
          SELECT
            platform_order_id,
            platform,
            order_status,
            total_amount,
            buyer_username,
            created_at
          FROM ecommerce.orders
          ORDER BY created_at DESC
          LIMIT 20
        `),

        // Last sync time per platform
        client.query(`
          SELECT platform, sync_type, status, records, finished_at
          FROM ecommerce.sync_log
          WHERE id IN (
            SELECT MAX(id) FROM ecommerce.sync_log GROUP BY platform, sync_type
          )
          ORDER BY finished_at DESC
        `),
      ]);

    return NextResponse.json({
      summary: summary.rows,
      trend: trend.rows,
      topProducts: topProducts.rows,
      recentOrders: recentOrders.rows,
      syncStatus: syncStatus.rows,
    });
  } finally {
    client.release();
  }
}
