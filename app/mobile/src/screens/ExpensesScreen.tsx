import { useMemo } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAutoBudget, useExpenses } from '../hooks';
import { expenseApi } from '../api';
import { toast } from '../stores/toast';
import { Card } from '../components/Card';
import { colors, radius, spacing } from '../components/theme';
import { formatJPY, todayYmd } from '../utils/format';
import type { AutoBudgetCategory, Expense } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

function thisMonthRange(): { from: string; to: string } {
  const d  = new Date();
  const y  = d.getFullYear();
  const m  = d.getMonth();
  const f  = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const last = new Date(y, m + 1, 0);
  return { from: f, to: todayYmd(last) };
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ExpensesScreen() {
  const range = useMemo(thisMonthRange, []);
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses(range);
  const { autoBudget, loading: budgetLoading, refetch: refetchBudget } = useAutoBudget();
  const navigation = useNavigation<Nav>();

  const onRefresh = async () => {
    await Promise.all([refetchExpenses(), refetchBudget()]);
  };

  const handleDelete = (e: Expense) => {
    Alert.alert('削除確認', `${e.category} ${formatJPY(Number(e.amount))} を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await expenseApi.delete(e.id);
            toast.success('削除しました');
            await onRefresh();
          } catch (err: any) {
            toast.error(err.message ?? '削除に失敗しました');
          }
        },
      },
    ]);
  };

  const totals = autoBudget?.totals;
  const overBudget = totals?.remaining !== null && totals?.remaining !== undefined && totals.remaining < 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={expensesLoading || budgetLoading}
          onRefresh={onRefresh}
          tintColor={colors.text}
        />
      }
    >
      {autoBudget && (
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>今月の支出</Text>
              <Text style={{ color: colors.negative, fontSize: 18, fontWeight: '700' }}>
                {formatJPY(totals?.this_month_actual ?? 0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>月予算（解禁分）</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                {totals?.monthly_budget !== null ? formatJPY(totals!.monthly_budget!) : '— 未解禁'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>残予算</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: totals?.remaining == null
                    ? colors.textMuted
                    : overBudget
                      ? colors.negative
                      : colors.positive,
                }}
              >
                {totals?.remaining != null ? formatJPY(totals.remaining) : '—'}
              </Text>
            </View>
          </View>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          onPress={() => navigation.navigate('ExpenseForm')}
          style={{
            flex: 1,
            backgroundColor: colors.accent,
            paddingVertical: spacing.md,
            borderRadius: radius.sm,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>＋ 手入力</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('ReceiptScanner')}
          style={{
            flex: 1,
            backgroundColor: colors.bgRaised,
            paddingVertical: spacing.md,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: colors.accent,
          }}
        >
          <Text style={{ color: colors.accent, textAlign: 'center', fontWeight: '700' }}>📷 レシート撮影</Text>
        </Pressable>
      </View>

      {autoBudget && autoBudget.by_category.length > 0 && (
        <Card title="カテゴリ別 月予算 / 残予算">
          {autoBudget.by_category.map((c) => (
            <BudgetRow key={c.category} cat={c} />
          ))}
        </Card>
      )}

      <Card title={`今月の実績一覧（${range.from} 〜 ${range.to}）`}>
        {expenses.length === 0 ? (
          <Text style={{ color: colors.textDim, textAlign: 'center', padding: spacing.md }}>
            記録がありません
          </Text>
        ) : (
          expenses.map((e) => (
            <Pressable
              key={e.id}
              onLongPress={() => handleDelete(e)}
              style={{
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>{e.category}</Text>
                <Text style={{ color: colors.textDim, fontSize: 11 }}>
                  {e.occurred_at}{e.note ? ` · ${e.note}` : ''}
                </Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                {formatJPY(Number(e.amount))}
              </Text>
            </Pressable>
          ))
        )}
        {expenses.length > 0 && (
          <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: spacing.sm }}>
            行を長押しで削除
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

function BudgetRow({ cat }: { cat: AutoBudgetCategory }) {
  const locked = cat.monthly_budget === null;
  const ratio  = locked || !cat.monthly_budget
    ? 0
    : Math.min(1, cat.this_month_actual / cat.monthly_budget);
  const over   = !locked && cat.remaining !== null && cat.remaining < 0;
  const barColor = over ? colors.negative : ratio > 0.8 ? colors.warning : colors.positive;

  return (
    <View style={{ gap: spacing.xs, paddingVertical: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{cat.category}</Text>
        {locked ? (
          <Text style={{ color: colors.textDim, fontSize: 11 }}>
            あと {Math.max(0, 3 - cat.months_with_data)} ヶ月で解禁（{cat.months_with_data}/3）
          </Text>
        ) : (
          <Text style={{ color: over ? colors.negative : colors.positive, fontSize: 13, fontWeight: '700' }}>
            残 {formatJPY(cat.remaining!)}
          </Text>
        )}
      </View>
      {!locked && (
        <>
          <Text style={{ color: colors.textDim, fontSize: 11 }}>
            実績 {formatJPY(cat.this_month_actual)} / 予算 {formatJPY(cat.monthly_budget!)}
            {cat.annual_budget !== null && ` · 年予算 ${formatJPY(cat.annual_budget)}`}
          </Text>
          <View style={{ height: 6, backgroundColor: colors.bgRaised, borderRadius: 3, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${Math.round(ratio * 100)}%`,
                backgroundColor: barColor,
              }}
            />
          </View>
        </>
      )}
    </View>
  );
}
