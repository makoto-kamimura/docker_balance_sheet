import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import {
  useAutoBudget,
  useBalanceComparison,
  useBalanceSummary,
  useBudgetSummary,
  useSnapshots,
} from '../hooks';
import { snapshotApi } from '../api';
import { toast } from '../stores/toast';
import { Card } from '../components/Card';
import ChangeBadge from '../components/ChangeBadge';
import { colors, radius, spacing } from '../components/theme';
import { formatCompact, formatJPY } from '../utils/format';

export default function DashboardScreen() {
  const { summary, loading, refetch: refetchSummary } = useBalanceSummary();
  const { snapshots, refetch: refetchSnapshots } = useSnapshots(12);
  const { budget } = useBudgetSummary();
  const { autoBudget } = useAutoBudget();
  const { comparison, refetch: refetchComparison } = useBalanceComparison();
  const [saving, setSaving] = useState(false);

  const onRefresh = async () => {
    await Promise.all([refetchSummary(), refetchSnapshots(), refetchComparison()]);
  };

  const saveSnapshot = async () => {
    setSaving(true);
    try {
      await snapshotApi.save();
      await Promise.all([refetchSnapshots(), refetchComparison()]);
      toast.success('今月のスナップショットを保存しました');
    } catch (e: any) {
      toast.error(e.message ?? 'スナップショット保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !summary) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text }}>読み込み中…</Text>
      </View>
    );
  }
  if (!summary) return null;

  const positive = summary.net_worth >= 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.text} />}
    >
      {/* Hero */}
      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>純資産（ネットワース）</Text>
        <Text style={{ color: positive ? colors.positive : colors.negative, fontSize: 32, fontWeight: '800' }}>
          {formatJPY(summary.net_worth)}
        </Text>
        <Text style={{ color: colors.textDim, fontSize: 13 }}>{formatCompact(summary.net_worth)}</Text>
        {comparison?.change && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>前月比</Text>
            <ChangeBadge
              amount={comparison.change.net_worth.amount}
              percent={comparison.change.net_worth.percent}
              direction="positive_is_good"
            />
          </View>
        )}
      </Card>

      <Pressable
        onPress={saveSnapshot}
        disabled={saving}
        style={{
          backgroundColor: colors.bgRaised,
          padding: spacing.md,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: saving ? 0.5 : 1,
        }}
      >
        <Text style={{ color: colors.text, textAlign: 'center', fontWeight: '600' }}>
          {saving ? '保存中…' : '今月のスナップショットを保存'}
        </Text>
      </Pressable>

      {/* 総資産 / 総負債 */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>総資産</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{formatJPY(summary.total_assets)}</Text>
          <Text style={{ color: colors.textDim, fontSize: 11 }}>{summary.asset_ratio}%</Text>
          {comparison?.change && (
            <ChangeBadge
              amount={comparison.change.total_assets.amount}
              percent={comparison.change.total_assets.percent}
              direction="positive_is_good"
            />
          )}
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>総負債</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{formatJPY(summary.total_liabilities)}</Text>
          <Text style={{ color: colors.textDim, fontSize: 11 }}>{(100 - summary.asset_ratio).toFixed(1)}%</Text>
          {comparison?.change && (
            <ChangeBadge
              amount={comparison.change.total_liabilities.amount}
              percent={comparison.change.total_liabilities.percent}
              direction="negative_is_good"
            />
          )}
        </Card>
      </View>

      {/* 自動予算（実績ベース） */}
      {autoBudget && autoBudget.totals.this_month_actual > 0 && (
        <Card title="今月の家計簿（実績ベース）">
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>今月の支出</Text>
              <Text style={{ color: colors.negative, fontSize: 16, fontWeight: '700' }}>
                {formatJPY(autoBudget.totals.this_month_actual)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>月予算（解禁分）</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
                {autoBudget.totals.monthly_budget !== null
                  ? formatJPY(autoBudget.totals.monthly_budget)
                  : '— 未解禁'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>残予算</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: autoBudget.totals.remaining === null
                    ? colors.textMuted
                    : autoBudget.totals.remaining < 0
                      ? colors.negative
                      : colors.positive,
                }}
              >
                {autoBudget.totals.remaining !== null ? formatJPY(autoBudget.totals.remaining) : '—'}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* 月間予算サマリー */}
      {budget && (
        <Card title="月間予算サマリー">
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>収入</Text>
              <Text style={{ color: colors.positive, fontSize: 16, fontWeight: '700' }}>
                {formatJPY(budget.monthly_income)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>支出</Text>
              <Text style={{ color: colors.negative, fontSize: 16, fontWeight: '700' }}>
                {formatJPY(budget.monthly_expense)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>収支</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: budget.monthly_net >= 0 ? colors.positive : colors.negative,
                }}
              >
                {formatJPY(budget.monthly_net)}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {snapshots.length > 0 && (
        <Card title={`スナップショット ${snapshots.length} 件`}>
          <Text style={{ color: colors.textDim, fontSize: 12 }}>
            最新: {snapshots[snapshots.length - 1]?.year_month} — 純資産{' '}
            {formatJPY(snapshots[snapshots.length - 1]?.net_worth ?? 0)}
          </Text>
          <Text style={{ color: colors.textDim, fontSize: 11 }}>
            ※ 推移グラフは victory-native で実装予定
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}
