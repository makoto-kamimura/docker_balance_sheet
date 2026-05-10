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
import { useAuthStore } from '../stores/authStore';
import { colors, radius, spacing } from '../components/theme';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');

  const submit = async () => {
    clearError();
    try {
      if (mode === 'login') await login(email, password);
      else                   await register(name, email, password, pwConfirm);
    } catch { /* store に保持 */ }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xl }}>
        <View
          style={{
            backgroundColor: colors.bgCard,
            padding: spacing.xl,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            gap: spacing.lg,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
            家計バランスシート
          </Text>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={() => { setMode('login'); clearError(); }}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.sm,
                backgroundColor: mode === 'login' ? colors.accent : colors.bgRaised,
              }}
            >
              <Text style={{ color: mode === 'login' ? '#fff' : colors.textMuted, textAlign: 'center', fontWeight: '600' }}>
                ログイン
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode('register'); clearError(); }}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.sm,
                backgroundColor: mode === 'register' ? colors.accent : colors.bgRaised,
              }}
            >
              <Text style={{ color: mode === 'register' ? '#fff' : colors.textMuted, textAlign: 'center', fontWeight: '600' }}>
                新規登録
              </Text>
            </Pressable>
          </View>

          {error && (
            <Text style={{ color: colors.negative, textAlign: 'center', fontSize: 13 }}>{error}</Text>
          )}

          {mode === 'register' && (
            <Field label="お名前" value={name} onChangeText={setName} placeholder="山田 太郎" />
          )}
          <Field
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            placeholder="taro@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Field
            label="パスワード"
            value={password}
            onChangeText={setPassword}
            placeholder="8文字以上"
            secureTextEntry
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
          />
          {mode === 'register' && (
            <Field
              label="パスワード（確認）"
              value={pwConfirm}
              onChangeText={setPwConfirm}
              secureTextEntry
              textContentType="newPassword"
            />
          )}

          <Pressable
            onPress={submit}
            disabled={isLoading}
            style={{
              backgroundColor: colors.accent,
              paddingVertical: spacing.md,
              borderRadius: radius.sm,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
              {isLoading ? '処理中…' : mode === 'login' ? 'ログイン' : '登録する'}
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
          backgroundColor: colors.bgRaised,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          color: colors.text,
          fontSize: 15,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        {...rest}
      />
    </View>
  );
}
