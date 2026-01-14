import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import GoogleIcon from '../assets/google.svg';
import { useGoogleAuthUrlQuery } from '../shared/src/native';
import styles from '../style/index';

interface GoogleAuthButtonProps {
  onError?: (message: string) => void;
  buttonText?: string;
  mobile?: string;
}

export function GoogleAuthButton({
  onError,
  buttonText = 'Continue with Google',
  mobile = 'false',
}: GoogleAuthButtonProps) {
  const { data: googleAuthData, isLoading } = useGoogleAuthUrlQuery({ mobile });

  const handleGoogleLogin = () => {
    if (googleAuthData?.url) {
      Linking.openURL(googleAuthData.url).catch(() => {
        onError?.('Failed to open Google authentication URL.');
      });
    } else {
      onError?.('Failed to initiate Google authentication.');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        (isLoading || !googleAuthData) && styles.disabledButton,
      ]}
      onPress={handleGoogleLogin}
      disabled={isLoading || !googleAuthData}
    >
      <GoogleIcon width={18} height={18} style={{ marginRight: 10 }} />
      {isLoading ? (
        <ActivityIndicator color='#fff' />
      ) : (
        <Text style={styles.text}>{buttonText}</Text>
      )}
    </TouchableOpacity>
  );
}

// const styles = StyleSheet.create({
//   button: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#4285F4',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 4,
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   text: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
// });
