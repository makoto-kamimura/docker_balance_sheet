import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLiabilities } from '../hooks';
import { liabilityApi } from '../api';
import { toast } from '../stores/toast';
import { LIABILITY_CATEGORY_LABELS, type Liability, type LiabilityCategory } from '../types';
import { colors, radius, spacing } from '../components/theme';
import { formatJPY } from '../utils/format';

const CATEGORIES: LiabilityCategory[] = ['current', 'longterm'];

export default function LiabilitiesScreen() {
  const { liabilities, loading, refetch } = useLiabilities();
  const [editing, setEditing] = useState<Liability | null>(null);
  const [adding, setAdding]   = useState(false);

  const handleDelete = (l: Liability) => {
    Alert.alert('削除確認', `「${l.name}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await liabilityApi.delete(l.id);
            toast.success('削除しました');
            refetch();
          } catch (e: any) {
            toast.error(e.message ?? '削除に失敗しました');
          }
        },
      },
    ]);
  };

  const total = liabilities.reduce((s, l) => s + Number(l.amount), 0);
  const grouped = CATEGORIES.map((cat) => ({ cat, items: liabilities.filter((l) => l.category === cat) }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>合計</Text>
          <Text style={{ color: colors.negative, fontSize: 22, fontWeight: '800' }}>{formatJPY(total)}</Text>
        </View>
        <Pressable
          onPress={() => setAdding(true)}
          style={{
            backgroundColor: colors.accent,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.sm,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>＋ 追加</Text>
        </Pressable>
      </View>

      <FlatList
        data={grouped}
        keyExtractor={(g) => g.cat}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        refreshing={loading}
        onRefresh={refetch}
        renderItem={({ item: g }) => (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
              {LIABILITY_CATEGORY_LABELS[g.cat]}（{g.items.length}）
            </Text>
            {g.items.length === 0 ? (
              <Text style={{ color: colors.textDim, fontSize: 12, padding: spacing.md }}>項目なし</Text>
            ) : (
              g.items.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => setEditing(l)}
                  onLongPress={() => handleDelete(l)}
                  style={{
                    backgroundColor: colors.bgCard,
                    padding: spacing.md,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{l.name}</Text>
                    {l.note ? <Text style={{ color: colors.textDim, fontSize: 12 }}>{l.note}</Text> : null}
                  </View>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{formatJPY(l.amount)}</Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      />

      <LiabilityFormModal
        visible={adding || editing !== null}
        target={editing}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSaved={() => { setAdding(false); setEditing(null); refetch(); }}
      />
    </View>
  );
}

interface FormProps {
  visible: boolean;
  target: Liability | null;
  onClose: () => void;
  onSaved: () => void;
}

function LiabilityFormModal({ visible, target, onClose, onSaved }: FormProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<LiabilityCategory>('current');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (visible && target && name === '' && amount === '') {
    setName(target.name); setAmount(String(target.amount));
    setCategory(target.category); setNote(target.note ?? '');
  }

  const reset = () => { setName(''); setAmount(''); setCategory('current'); setNote(''); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!name.trim() || !amount) {
      toast.error('名前と金額は必須です');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), amount: Number(amount), category, note: note.trim() };
      if (target) await liabilityApi.update(target.id, payload);
      else        await liabilityApi.create(payload);
      toast.success(target ? '更新しました' : '追加しました');
      reset();
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              {target ? '負債を編集' : '負債を追加'}
            </Text>

            <FormField label="名前" value={name} onChangeText={setName} placeholder="住宅ローン など" />
            <FormField label="金額（円）" value={amount} onChangeText={setAmount} keyboardType="numeric" />

            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>カテゴリ</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.sm,
                      backgroundColor: category === cat ? colors.accent : colors.bgRaised,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: '600',
                        color: category === cat ? '#fff' : colors.textMuted,
                      }}
                    >
                      {LIABILITY_CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <FormField label="メモ（任意）" value={note} onChangeText={setNote} multiline />

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Pressable
                onPress={close}
                style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm, backgroundColor: colors.bgRaised }}
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
                  {submitting ? '保存中…' : '保存'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textDim}
        style={{
          backgroundColor: colors.bgRaised,
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
