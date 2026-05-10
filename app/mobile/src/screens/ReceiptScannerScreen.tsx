import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { parseReceipt } from '../utils/receipt';
import { colors, radius, spacing } from '../components/theme';
import { toast } from '../stores/toast';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ReceiptScanner'>;

export default function ReceiptScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const navigation = useNavigation<Nav>();

  const handleCapture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: false });
      if (!photo) throw new Error('撮影に失敗しました');
      // OCR の精度・速度を両立: 長辺 1500px / JPEG 80%
      const processed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1500 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const result = await TextRecognition.recognize(processed.uri);
      const parsed = parseReceipt(result.text);
      if (!parsed.amount && !parsed.occurredAt) {
        toast.info('テキストを抽出できませんでした。手入力をご利用ください');
      }
      navigation.replace('ExpenseForm', { initial: parsed });
    } catch (e: any) {
      toast.error(e.message ?? 'OCR に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text, fontSize: 14, textAlign: 'center', marginBottom: spacing.lg }}>
          レシート撮影のためにカメラ権限が必要です。
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            backgroundColor: colors.accent,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: radius.sm,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>カメラ権限を許可</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      <View
        style={{
          padding: spacing.lg,
          backgroundColor: colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: spacing.sm,
        }}
      >
        <Text style={{ color: colors.textDim, fontSize: 12, textAlign: 'center' }}>
          レシート全体が枠内に収まるように撮影してください
        </Text>
        <Pressable
          onPress={handleCapture}
          disabled={busy}
          style={{
            backgroundColor: colors.accent,
            paddingVertical: spacing.md,
            borderRadius: radius.sm,
            opacity: busy ? 0.5 : 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          {busy && <ActivityIndicator color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {busy ? 'OCR 処理中…' : '撮影して OCR'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = {
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing.xl,
  },
};
