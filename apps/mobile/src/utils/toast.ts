import Toast from 'react-native-toast-message';
export const toast = {
  success: (t1: string, t2?: string) => Toast.show({ type: 'success', text1: t1, text2: t2 }),
  error: (t1: string, t2?: string) => Toast.show({ type: 'error', text1: t1, text2: t2 }),
};
