import { View } from 'react-native';
import { AreaWebView } from '../components/AreaWebView';
import styles from '../style/index';

export function Area() {
  return (
    <View style={styles.container}>
      <AreaWebView url='http://localhost:5173/mobile/area' />
    </View>
  );
}
