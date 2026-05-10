import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AssetsScreen from '../screens/AssetsScreen';
import LiabilitiesScreen from '../screens/LiabilitiesScreen';
import BalanceSheetScreen from '../screens/BalanceSheetScreen';
import LifePlanScreen from '../screens/LifePlanScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ExpenseFormScreen from '../screens/ExpenseFormScreen';
import ReceiptScannerScreen from '../screens/ReceiptScannerScreen';
import { colors } from '../components/theme';
import type { ParsedReceipt } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ExpenseForm: { initial?: ParsedReceipt } | undefined;
  ReceiptScanner: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Assets: undefined;
  Liabilities: undefined;
  BalanceSheet: undefined;
  LifePlan: undefined;
  Expenses: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs  = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary:    colors.accent,
    background: colors.bg,
    card:       colors.bgCard,
    text:       colors.text,
    border:     colors.border,
    notification: colors.accent,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, color: focused ? colors.accent : colors.textMuted }}>
      {label}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTitleStyle: { color: colors.text, fontSize: 16 },
        tabBarStyle: { backgroundColor: colors.bgCard, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'ダッシュボード', tabBarIcon: ({ focused }) => <TabIcon label="◉" focused={focused} /> }}
      />
      <Tabs.Screen
        name="Assets"
        component={AssetsScreen}
        options={{ title: '資産', tabBarIcon: ({ focused }) => <TabIcon label="＋" focused={focused} /> }}
      />
      <Tabs.Screen
        name="Liabilities"
        component={LiabilitiesScreen}
        options={{ title: '負債', tabBarIcon: ({ focused }) => <TabIcon label="−" focused={focused} /> }}
      />
      <Tabs.Screen
        name="BalanceSheet"
        component={BalanceSheetScreen}
        options={{ title: 'B/S', tabBarIcon: ({ focused }) => <TabIcon label="☰" focused={focused} /> }}
      />
      <Tabs.Screen
        name="LifePlan"
        component={LifePlanScreen}
        options={{ title: 'ライフプラン', tabBarIcon: ({ focused }) => <TabIcon label="⏱" focused={focused} /> }}
      />
      <Tabs.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: '家計簿', tabBarIcon: ({ focused }) => <TabIcon label="¥" focused={focused} /> }}
      />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { token, hydrated } = useAuthStore();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text }}>読み込み中…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgCard },
          headerTintColor: colors.text,
        }}
      >
        {token == null ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} options={{ title: '支出を記録', presentation: 'modal' }} />
            <Stack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} options={{ title: 'レシート読み取り' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
