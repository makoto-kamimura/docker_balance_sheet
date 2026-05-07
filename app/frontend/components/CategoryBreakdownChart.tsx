import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompact, formatJPY } from '../utils/format';

const COLORS = [
  '#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#22d3ee',
  '#fb923c', '#f472b6', '#94a3b8', '#facc15', '#4ade80', '#c084fc',
];

export type CategoryBreakdownMode = 'monthly' | 'annual';

interface Props {
  byCategory: { category: string; monthly: number; annual: number }[];
  mode: CategoryBreakdownMode;
  selectedCategory?: string | null;
  onCategoryClick?: (category: string) => void;
}

const displayLabel = (raw: string) => (raw === 'uncategorized' ? '未分類' : raw);

export default function CategoryBreakdownChart({
  byCategory, mode, selectedCategory, onCategoryClick,
}: Props) {
  if (byCategory.length === 0) {
    return <div className="empty-row">支出データがありません</div>;
  }

  const data = byCategory.map((c, i) => ({
    raw:      c.category,
    category: displayLabel(c.category),
    value:    mode === 'monthly' ? c.monthly : c.annual,
    color:    COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36 + 48)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 8, right: 32, bottom: 8, left: 16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#cbd5e1' }}
          tickFormatter={formatCompact}
        />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 11, fill: '#cbd5e1' }}
          width={110}
        />
        <Tooltip
          contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
          formatter={(v: number) => [formatJPY(v), mode === 'monthly' ? '月額' : '年額']}
        />
        <Bar
          dataKey="value"
          cursor={onCategoryClick ? 'pointer' : 'default'}
          onClick={(d: { raw: string }) => onCategoryClick?.(d.raw)}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.color}
              opacity={selectedCategory && selectedCategory !== d.raw ? 0.3 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
