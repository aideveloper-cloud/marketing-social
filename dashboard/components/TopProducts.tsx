"use client";

interface Row {
  product_name: string;
  platform: string;
  total_qty: number;
  total_revenue: number;
}

const PLATFORM_BADGE: Record<string, string> = {
  tiktok:  "bg-red-50 text-red-600",
  shopee:  "bg-orange-50 text-orange-600",
  lazada:  "bg-blue-50 text-blue-700",
};

export default function TopProducts({ rows }: { rows: Row[] }) {
  const max = rows[0]?.total_revenue ?? 1;
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-600 mb-4">สินค้าขายดีเดือนนี้</h2>
      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">ยังไม่มีข้อมูล</p>
        )}
        {rows.map((r, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                <span className="text-sm text-gray-700 truncate">{r.product_name || "—"}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${PLATFORM_BADGE[r.platform] ?? "bg-gray-100 text-gray-500"}`}>
                  {r.platform}
                </span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-sm font-semibold text-gray-800">
                  ฿{Number(r.total_revenue).toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 ml-1">({r.total_qty} ชิ้น)</span>
              </div>
            </div>
            <div className="h-1 bg-gray-100 rounded-full">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                style={{ width: `${(r.total_revenue / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
