import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useBudgetSummary, useCashflowItems } from '../hooks';
import { Card } from '../components/Card';
import { colors, radius, spacing } from '../components/theme';
import { formatJPY } from '../utils/format';
import type { CashflowDirection, CashflowItem } from '../types';

export default function LifePlanScreen() {
  const { items, loading, refetch } = useCashflowItems();
  const { budget } = useBudgetSummary();
  const [filter, setFilter] = useState<CashflowDirection | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [view, setView] = useState<'monthly' | 'annual'>('monthly');

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filter !== 'all' && i.direction !== filter) return false;
      if (activeCategory && i.category !== activeCategory) return false;
      return true;
    });
  }, [items, filter, activeCategory]);

  const totalIncome  = filtered.filter((i) => i.direction === 'income').reduce((s, i) => s + Number(view === 'monthly' ? i.monthly_amount : i.annual_amount), 0);
  const totalExpense = filtered.filter((i) => i.direction === 'expense').reduce((s, i) => s + Number(view === 'monthly' ? i.monthly_amount : i.annual_amount), 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.text} />}
    >
      <Card>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['monthly', 'annual'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                backgroundColor: view === v ? colors.accent : colors.bgRaised,
              }}
            >
              <Text style={{ color: view === v ? '#fff' : colors.textMuted, textAlign: 'center', fontWeight: '600' }}>
                {v === 'monthly' ? '月額' : '年額'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>収入</Text>
            <Text style={{ color: colors.positive, fontSize: 16, fontWeight: '700' }}>{formatJPY(totalIncome)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>支出</Text>
            <Text style={{ color: colors.negative, fontSize: 16, fontWeight: '700' }}>{formatJPY(totalExpense)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>収支</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: totalIncome - totalExpense >= 0 ? colors.positive : colors.negative,
              }}
            >
              {formatJPY(totalIncome - totalExpense)}
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: radius.sm,
              backgroundColor: filter === f ? colors.accent : colors.bgCard,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: filter === f ? '#fff' : colors.text,
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {f === 'all' ? '全て' : f === 'income' ? '収入のみ' : '支出のみ'}
            </Text>
          </Pressable>
        ))}
      </View>

      {budget && budget.by_category.length > 0 && (
        <Card title="カテゴリ別 月額（タップで絞り込み）">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {budget.by_category.map((c) => (
              <Pressable
                key={c.category}
                onPress={() => setActiveCategory(activeCategory === c.category ? null : c.category)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.sm,
                  backgroundColor: activeCategory === c.category ? colors.accent : colors.bgRaised,
                }}
              >
                <Text style={{ color: activeCategory === c.category ? '#fff' : colors.text, fontSize: 12 }}>
                  {c.category} {formatJPY(c.monthly)}
                </Text>
              </Pressable>
            ))}
          </View>
          {activeCategory && (
            <Pressable onPress={() => setActiveCategory(null)}>
              <Text style={{ color: colors.accent, fontSize: 12 }}>絞り込みを解除</Text>
            </Pressable>
          )}
        </Card>
      )}

      <Pressable onPress={refetch}>
        <Text style={{ color: colors.accent, textAlign: 'center', fontSize: 12 }}>更新</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        {filtered.map((it) => (
          <ItemRow key={it.id} item={it} view={view} />
        ))}
        {filtered.length === 0 && (
          <Text style={{ color: colors.textDim, textAlign: 'center', padding: spacing.lg }}>
            該当する項目がありません
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function ItemRow({ item, view }: { item: CashflowItem; view: 'monthly' | 'annual' }) {
  const amount = view === 'monthly' ? Number(item.monthly_amount) : Number(item.annual_amount);
  const isIncome = item.direction === 'income';
  return (
    <View
      style={{
        backgroundColor: colors.bgCard,
        padding: spacing.md,
        borderRadius: radius.sm,
        borderLeftWidth: 3,
        borderLeftColor: isIncome ? colors.positive : colors.negative,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{item.name}</Text>
        <Text style={{ color: colors.textDim, fontSize: 11 }}>
          {item.category ?? '未分類'} · {item.frequency === 'fixed' ? '固定' : '変動'}
          {item.start_age != null || item.end_age != null
            ? ` · ${item.start_age ?? ''}〜${item.end_age ?? ''}歳`
            : ''}
        </Text>
      </View>
      <Text
        style={{
          color: isIncome ? colors.positive : colors.negative,
          fontSize: 14,
          fontWeight: '700',
        }}
      >
        {formatJPY(amount)}
      </Text>
    </View>
  );
}
