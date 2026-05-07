import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompact, formatJPY } from '../utils/format';
import type { Snapshot } from '../types';

interface Props {
  snapshots: Snapshot[];
}

export default function NetWorthChart({ snapshots }: Props) {
  const data = snapshots.map(s => ({
    month: s.year_month,
    総資産: Number(s.total_assets),
    総負債: Number(s.total_liabilities),
    純資産: Number(s.net_worth),
  }));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-assets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-liabilities" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-net" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="month"
            stroke="#8888a4"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#8888a4"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCompact(v)}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="chart-tooltip">
                  <div className="tooltip-label">{label}</div>
                  {payload.map(p => (
                    <div key={p.dataKey as string} className="tooltip-row">
                      <span style={{ color: p.color }}>{p.name}</span>
                      <span>{formatJPY(Number(p.value))}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />

          <Area type="monotone" dataKey="総資産" stroke="#4ade80" strokeWidth={2} fill="url(#grad-assets)" />
          <Area type="monotone" dataKey="総負債" stroke="#f87171" strokeWidth={2} fill="url(#grad-liabilities)" />
          <Area type="monotone" dataKey="純資産" stroke="#60a5fa" strokeWidth={2} fill="url(#grad-net)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
