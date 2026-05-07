import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Asset } from '../types';
import { ASSET_CATEGORY_LABELS } from '../types';
import { formatJPY } from '../utils/format';

const COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#22d3ee'];

interface Props {
  assets: Asset[];
}

export default function AssetAllocationChart({ assets }: Props) {
  const groups = (Object.keys(ASSET_CATEGORY_LABELS) as Array<keyof typeof ASSET_CATEGORY_LABELS>)
    .map(cat => ({
      name:  ASSET_CATEGORY_LABELS[cat],
      value: assets.filter(a => a.category === cat).reduce((s, a) => s + Number(a.amount || 0), 0),
    }))
    .filter(g => g.value > 0);

  if (groups.length === 0) {
    return <div className="empty-row">資産データがありません</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={groups}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }: { name: string; percent: number }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {groups.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatJPY(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
