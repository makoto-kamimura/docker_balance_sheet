import { Text, View } from 'react-native';
import { colors } from './theme';
import { formatJPY } from '../utils/format';

interface Props {
  amount: number;
  percent: number | null;
  direction: 'positive_is_good' | 'negative_is_good';
}

export default function ChangeBadge({ amount, percent, direction }: Props) {
  if (amount === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ color: colors.textDim, fontSize: 12 }}>±0</Text>
      </View>
    );
  }
  const isUp   = amount > 0;
  const good   = direction === 'positive_is_good' ? isUp : !isUp;
  const color  = good ? colors.positive : colors.negative;
  const arrow  = isUp ? '▲' : '▼';
  const sign   = isUp ? '+' : '−';
  const absJpy = formatJPY(Math.abs(amount));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>
        {arrow} {sign}{absJpy}
      </Text>
      {percent !== null && (
        <Text style={{ color, fontSize: 11, opacity: 0.85 }}>
          ({sign}{Math.abs(percent).toFixed(1)}%)
        </Text>
      )}
    </View>
  );
}
