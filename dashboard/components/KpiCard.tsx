"use client";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
}

export default function KpiCard({ label, value, sub, icon, color }: KpiCardProps) {
  return (
    <div className={`rounded-2xl p-5 bg-white border border-gray-100 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
