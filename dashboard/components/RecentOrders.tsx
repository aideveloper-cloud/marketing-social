"use client";

import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";

interface Order {
  platform_order_id: string;
  platform: string;
  order_status: string;
  total_amount: number;
  buyer_username: string;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED:    "bg-green-50 text-green-700",
  SHIPPED:      "bg-blue-50 text-blue-700",
  PROCESSING:   "bg-yellow-50 text-yellow-700",
  PENDING:      "bg-gray-50 text-gray-500",
  CANCELLED:    "bg-red-50 text-red-600",
  cancelled:    "bg-red-50 text-red-600",
  UNPAID:       "bg-orange-50 text-orange-600",
};

const PLATFORM_ICON: Record<string, string> = {
  tiktok:  "🎵",
  shopee:  "🧡",
  lazada:  "🛒",
};

export default function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-600 mb-4">คำสั่งซื้อล่าสุด</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Order ID</th>
              <th className="text-left pb-2 font-medium">Platform</th>
              <th className="text-left pb-2 font-medium">ลูกค้า</th>
              <th className="text-left pb-2 font-medium">สถานะ</th>
              <th className="text-right pb-2 font-medium">ยอด</th>
              <th className="text-right pb-2 font-medium">เวลา</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                  ยังไม่มีข้อมูล
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={`${o.platform}-${o.platform_order_id}`} className="hover:bg-gray-50">
                <td className="py-2.5 font-mono text-xs text-gray-500 truncate max-w-[100px]">
                  {o.platform_order_id}
                </td>
                <td className="py-2.5">
                  <span>{PLATFORM_ICON[o.platform] ?? "🛍️"} {o.platform}</span>
                </td>
                <td className="py-2.5 text-gray-700">{o.buyer_username || "—"}</td>
                <td className="py-2.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.order_status] ?? "bg-gray-50 text-gray-500"}`}>
                    {o.order_status}
                  </span>
                </td>
                <td className="py-2.5 text-right font-semibold text-gray-800">
                  ฿{Number(o.total_amount).toLocaleString()}
                </td>
                <td className="py-2.5 text-right text-xs text-gray-400">
                  {o.created_at
                    ? format(parseISO(o.created_at), "d MMM HH:mm", { locale: th })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
