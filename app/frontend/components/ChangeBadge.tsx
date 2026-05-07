import { formatCompact } from '../utils/format';

/**
 * 前月比バッジ — 増減金額と変化率を表示。
 * - direction: 'positive_is_good'（資産・純資産） / 'negative_is_good'（負債）
 * - value=0 の場合は ─ 表示で色なし
 */
type Direction = 'positive_is_good' | 'negative_is_good';

interface Props {
  amount: number;
  percent: number | null;
  direction: Direction;
}

export default function ChangeBadge({ amount, percent, direction }: Props) {
  if (amount === 0) {
    return <span style={{ opacity: 0.5, fontSize: 12 }}>─ 変動なし</span>;
  }

  const isUp = amount > 0;
  const isGood = direction === 'positive_is_good' ? isUp : !isUp;
  const color = isGood ? '#4ade80' : '#f87171';
  const arrow = isUp ? '▲' : '▼';

  return (
    <span style={{ color, fontSize: 12, fontWeight: 600 }}>
      {arrow} {formatCompact(Math.abs(amount))}
      {percent !== null && (
        <span style={{ opacity: 0.8, marginLeft: 4 }}>
          ({isUp ? '+' : ''}
          {percent.toFixed(1)}%)
        </span>
      )}
    </span>
  );
}
