import { ReactNode } from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from './theme';

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ title, children, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.bgCard,
          borderRadius: radius.md,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.md,
        },
        style,
      ]}
    >
      {title ? (
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
