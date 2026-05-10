import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useBalanceSheet } from '../hooks';
import { exportApi } from '../api';
import { toast } from '../stores/toast';
import { Card } from '../components/Card';
import { colors, radius, spacing } from '../components/theme';
import { formatJPY } from '../utils/format';
import type { BalanceSheetSection } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function BalanceSheetScreen() {
  const { balanceSheet, loading, refetch } = useBalanceSheet();
  const { logout } = useAuthStore();

  if (loading && !balanceSheet) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text }}>読み込み中…</Text>
      </View>
    );
  }
  if (!balanceSheet) return null;

  const exportCsv = async (kind: 'assets' | 'liabilities' | 'cashflowItems') => {
    try {
      await exportApi[kind]();
    } catch (e: any) {
      toast.error(e.message ?? 'エクスポートに失敗しました');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.text} />}
    >
      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>純資産</Text>
        <Text
          style={{
            color: balanceSheet.net_worth >= 0 ? colors.positive : colors.negative,
            fontSize: 28,
            fontWeight: '800',
          }}
        >
          {formatJPY(balanceSheet.net_worth)}
        </Text>
        <Text style={{ color: colors.textDim, fontSize: 12 }}>記録日: {balanceSheet.recorded_at}</Text>
      </Card>

      <Card title="資産">
        <Section section={balanceSheet.assets.current} />
        <Section section={balanceSheet.assets.fixed} />
        <Section section={balanceSheet.assets.investment} />
        <Total label="資産合計" value={balanceSheet.assets.total} color={colors.positive} />
      </Card>

      <Card title="負債">
        <Section section={balanceSheet.liabilities.current} />
        <Section section={balanceSheet.liabilities.longterm} />
        <Total label="負債合計" value={balanceSheet.liabilities.total} color={colors.negative} />
      </Card>

      <Card title="CSV エクスポート（共有）">
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          <ExportButton label="資産" onPress={() => exportCsv('assets')} />
          <ExportButton label="負債" onPress={() => exportCsv('liabilities')} />
          <ExportButton label="ライフプラン" onPress={() => exportCsv('cashflowItems')} />
        </View>
      </Card>

      <Pressable
        onPress={() => logout()}
        style={{
          backgroundColor: colors.bgRaised,
          padding: spacing.md,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.negative, textAlign: 'center', fontWeight: '600' }}>ログアウト</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ section }: { section: BalanceSheetSection }) {
  return (
    <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
        {section.label}（小計 {formatJPY(section.subtotal)}）
      </Text>
      {section.items.length === 0 ? (
        <Text style={{ color: colors.textDim, fontSize: 12 }}>—</Text>
      ) : (
        section.items.map((it) => (
          <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.text, fontSize: 13 }}>{it.name}</Text>
            <Text style={{ color: colors.text, fontSize: 13 }}>{formatJPY(it.amount)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function Total({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
        marginTop: spacing.sm,
      }}
    >
      <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{formatJPY(value)}</Text>
    </View>
  );
}

function ExportButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.bgRaised,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{label} CSV</Text>
    </Pressable>
  );
}
