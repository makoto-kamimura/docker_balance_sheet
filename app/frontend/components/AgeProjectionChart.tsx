import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AgeProjectionRow } from '../types';
import { formatCompact } from '../utils/format';

interface Props {
  rows: AgeProjectionRow[];
}

/**
 * 年齢別キャッシュフロー推移チャート。
 * - 棒グラフ: 年間収入（緑） / 年間支出（赤、表示は負の値で下方向）
 * - 折れ線: 累積純資産（青）
 */
export default function AgeProjectionChart({ rows }: Props) {
  if (rows.length === 0) {
    return <div className="empty-row">表示できるデータがありません</div>;
  }

  // 支出は下方向に伸ばすため negate（タイトル表示時は abs で戻す）
  const data = rows.map((r) => ({
    age:        r.age,
    income:     r.income,
    expense:    -r.expense,
    cumulative: r.cumulative,
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis
          dataKey="age"
          tick={{ fontSize: 11, fill: '#cbd5e1' }}
          tickFormatter={(v) => `${v}歳`}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#cbd5e1' }}
          tickFormatter={(v) => formatCompact(v)}
        />
        <Tooltip
          contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
          labelFormatter={(age) => `${age}歳`}
          formatter={(value: number, name: string) => {
            const num = name === 'expense' ? Math.abs(value) : value;
            const label =
              name === 'income'     ? '年間収入'
            : name === 'expense'    ? '年間支出'
            : name === 'cumulative' ? '累積純資産'
            : name;
            return [formatCompact(num), label];
          }}
        />
        <Legend
          formatter={(name: string) =>
            name === 'income'     ? '年間収入'
          : name === 'expense'    ? '年間支出'
          : name === 'cumulative' ? '累積純資産'
          : name
          }
        />
        <Bar  dataKey="income"     fill="#4ade80" stackId="cashflow" />
        <Bar  dataKey="expense"    fill="#f87171" stackId="cashflow" />
        <Line dataKey="cumulative" stroke="#60a5fa" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
