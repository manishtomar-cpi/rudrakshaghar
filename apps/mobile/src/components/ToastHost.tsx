import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { colors } from '../theme';

export const ToastHost = () => (
  <Toast
    position="top"
    config={{
      success: (props) => (
        <BaseToast
          {...props}
          style={{ borderLeftColor: colors.utility.success, backgroundColor: '#0b1f0d' }}
          text1Style={{ color: '#fff', fontWeight: '700' }}
          text2Style={{ color: '#d1d5db' }}
        />
      ),
      error: (props) => (
        <ErrorToast
          {...props}
          style={{ borderLeftColor: colors.utility.error, backgroundColor: '#1a0c0c' }}
          text1Style={{ color: '#fff', fontWeight: '700' }}
          text2Style={{ color: '#fecaca' }}
        />
      ),
    }}
  />
);
