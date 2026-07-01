(ns metabase.marketing.api
  "Marketing dashboard API — queries the ecommerce schema populated by the ETL service."
  (:require
   [metabase.api.common :as api]
   [metabase.api.macros :as api.macros]
   [metabase.app-db.core :as app-db]
   [next.jdbc :as jdbc]))

(defn- ecommerce-db
  "Return a JDBC datasource for the ecommerce schema.
   Uses the same DATABASE_URL env var as the ETL service."
  []
  (let [url (or (System/getenv "DATABASE_URL")
                "jdbc:postgresql://localhost:5432/marketing?user=marketing&password=marketing_pass")]
    (jdbc/get-datasource (str/replace url #"^postgresql://" "jdbc:postgresql://"))))

(defn- q [sql & params]
  (jdbc/execute! (ecommerce-db) (into [sql] params)
                 {:return-keys false :builder-fn jdbc/as-unqualified-lower-maps}))

(api.macros/defendpoint :get "/summary"
  "KPI summary — orders + revenue per platform for today / this week / this month."
  []
  (api/check-superuser)
  {:data
   (q "SELECT
         platform,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                                      AS orders_today,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0)                AS revenue_today,
         COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW()))                         AS orders_week,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= date_trunc('week', NOW())), 0)   AS revenue_week,
         COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))                        AS orders_month,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= date_trunc('month', NOW())), 0)  AS revenue_month
       FROM ecommerce.orders
       WHERE order_status NOT IN ('CANCELLED', 'cancelled')
       GROUP BY platform")})

(api.macros/defendpoint :get "/trend"
  "Daily revenue + order count for the last 30 days."
  []
  (api/check-superuser)
  {:data
   (q "SELECT
         DATE(created_at) AS date,
         platform,
         COUNT(*)         AS orders,
         COALESCE(SUM(total_amount), 0) AS revenue
       FROM ecommerce.orders
       WHERE created_at >= NOW() - INTERVAL '30 days'
         AND order_status NOT IN ('CANCELLED', 'cancelled')
       GROUP BY DATE(created_at), platform
       ORDER BY date")})

(api.macros/defendpoint :get "/top-products"
  "Top 10 products by revenue this month."
  []
  (api/check-superuser)
  {:data
   (q "SELECT
         i.product_name,
         i.platform,
         SUM(i.quantity) AS total_qty,
         SUM(i.subtotal) AS total_revenue
       FROM ecommerce.order_items i
       JOIN ecommerce.orders o
         ON o.platform = i.platform AND o.platform_order_id = i.platform_order_id
       WHERE o.created_at >= date_trunc('month', NOW())
         AND o.order_status NOT IN ('CANCELLED', 'cancelled')
       GROUP BY i.product_name, i.platform
       ORDER BY total_revenue DESC
       LIMIT 10")})

(api.macros/defendpoint :get "/recent-orders"
  "Last 20 orders across all platforms."
  []
  (api/check-superuser)
  {:data
   (q "SELECT
         platform_order_id,
         platform,
         order_status,
         total_amount,
         buyer_username,
         created_at
       FROM ecommerce.orders
       ORDER BY created_at DESC
       LIMIT 20")})

(api.macros/defendpoint :get "/sync-status"
  "Last sync result per platform + sync type."
  []
  (api/check-superuser)
  {:data
   (q "SELECT platform, sync_type, status, records, finished_at
       FROM ecommerce.sync_log
       WHERE id IN (
         SELECT MAX(id) FROM ecommerce.sync_log GROUP BY platform, sync_type
       )
       ORDER BY finished_at DESC")})

(def routes
  (api.macros/ns-handler *ns*))
