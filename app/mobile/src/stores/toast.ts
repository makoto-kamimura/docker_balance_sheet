import Toast from 'react-native-toast-message';

// Web 版 toastStore.ts と同シグネチャ。中身は react-native-toast-message に委譲。
export const toast = {
  success: (message: string) =>
    Toast.show({ type: 'success', text1: message, position: 'top', visibilityTime: 3000 }),
  error: (message: string) =>
    Toast.show({ type: 'error', text1: message, position: 'top', visibilityTime: 5000 }),
  info: (message: string) =>
    Toast.show({ type: 'info', text1: message, position: 'top', visibilityTime: 3000 }),
};
