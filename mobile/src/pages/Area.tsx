import { StyleSheet, Text, View } from 'react-native';
import { AreaWebView } from '../components/Webview';

export function Area() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Area</Text>
      <AreaWebView url='https://front.mambokara.dev/area' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
});
