import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { expenseApi } from '../api';
import { useAutoBudget } from '../hooks';
import { toast } from '../stores/toast';
import { colors, radius, spacing } from '../components/theme';
import { formatJPY, todayYmd } from '../utils/format';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExpenseForm'>;
type Route = RouteProp<RootStackParamList, 'ExpenseForm'>;

export default function ExpenseFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const initial = route.params?.initial;
  const { autoBudget, refetch: refetchBudget } = useAutoBudget();

  // OCR からの初期値: 店舗名→category, amount→amount, occurredAt→date
  const [category, setCategory] = useState(initial?.storeName ?? '');
  const [amount,   setAmount]   = useState(initial?.amount ? String(initial.amount) : '');
  const [date,     setDate]     = useState(initial?.occurredAt ?? todayYmd());
  const [note,     setNote]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const knownCategories = (autoBudget?.by_category ?? []).map((c) => c.category);

  const submit = async () => {
    if (!category.trim() || !amount) {
      toast.error('カテゴリと金額を入力してください');
      return;
    }
    setSubmitting(true);
    try {
      await expenseApi.create({
        category: category.trim(),
        amount: Number(amount),
        occurred_at: date,
        note: note.trim() || null,
      });
      const remaining = autoBudget?.by_category.find((c) => c.category === category.trim())?.remaining;
      const after = remaining != null ? remaining - Number(amount) : null;
      if (after !== null) {
        toast.success(`記録しました — ${category.trim()} の残予算: ${formatJPY(after)}`);
      } else {
        toast.success('記録しました');
      }
      // 残予算をリアルタイム反映してから戻る
      await refetchBudget();
      navigation.goBack();
    } catch (e: any) {
      toast.error(e.message ?? '記録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
        {initial && (initial.amount || initial.occurredAt || initial.storeName) && (
          <View
            style={{
              backgroundColor: colors.bgCard,
              padding: spacing.md,
              borderRadius: radius.sm,
              borderLeftWidth: 3,
              borderLeftColor: colors.accent,
            }}
          >
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>OCR 抽出結果</Text>
            <Text style={{ color: colors.textDim, fontSize: 11 }}>
              金額 / 日付 / 店舗名 が初期値として入っています。送信前に必ず確認・修正してください。
            </Text>
          </View>
        )}

        <Field label="カテゴリ" value={category} onChangeText={setCategory} placeholder="food / transport / ..." />

        {knownCategories.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {knownCategories.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 4,
                  borderRadius: radius.sm,
                  backgroundColor: colors.bgRaised,
                }}
              >
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{c}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Field
          label="金額（円）"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="1500"
        />
        <Field label="日付（YYYY-MM-DD）" value={date} onChangeText={setDate} placeholder={todayYmd()} />
        <Field label="メモ（任意）" value={note} onChangeText={setNote} placeholder="ローソン昼食 など" multiline />

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: radius.sm,
              backgroundColor: colors.bgRaised,
            }}
          >
            <Text style={{ color: colors.text, textAlign: 'center', fontWeight: '600' }}>キャンセル</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={submitting}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: radius.sm,
              backgroundColor: colors.accent,
              opacity: submitting ? 0.5 : 1,
            }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
              {submitting ? '記録中…' : '記録する'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textDim}
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          color: colors.text,
          fontSize: 15,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: rest.multiline ? 60 : undefined,
        }}
        {...rest}
      />
    </View>
  );
}
