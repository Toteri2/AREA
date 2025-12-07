import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useAppSelector,
  useLazyGetGithubAuthUrlQuery,
  useLazyGetMicrosoftAuthUrlQuery,
  useListMicrosoftWebhooksQuery,
  useListRepositoriesQuery,
} from '../shared/src/native';

function GitHubLinker() {
  const [getAuthUrl] = useLazyGetGithubAuthUrlQuery();
  const { isLoading, isSuccess, isError } = useListRepositoriesQuery();

  const handleLink = async () => {
    try {
      const result = await getAuthUrl({ mobile: true }).unwrap();
      await Linking.openURL(result.url);
    } catch {
      Alert.alert('Error', 'Could not get GitHub auth URL.');
    }
  };

  if (isLoading) return <ActivityIndicator color='#e94560' />;
  if (isError) {
    return (
      <TouchableOpacity style={styles.button} onPress={handleLink}>
        <Text style={styles.buttonText}>Link GitHub Account</Text>
      </TouchableOpacity>
    );
  }
  if (isSuccess) {
    return (
      <View style={styles.linkedContainer}>
        <Text style={styles.linkedText}>✓ GitHub Account Linked</Text>
        <TouchableOpacity style={styles.changeButton} onPress={handleLink}>
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return null;
}

function MicrosoftLinker() {
  const [getAuthUrl] = useLazyGetMicrosoftAuthUrlQuery();
  const { isLoading, isSuccess, isError } = useListMicrosoftWebhooksQuery();

  const handleLink = async () => {
    try {
      const result = await getAuthUrl({ mobile: true }).unwrap();
      await Linking.openURL(result.url);
    } catch {
      Alert.alert('Error', 'Could not get Microsoft auth URL.');
    }
  };

  if (isLoading) return <ActivityIndicator color='#e94560' />;
  if (isError) {
    return (
      <TouchableOpacity style={styles.button} onPress={handleLink}>
        <Text style={styles.buttonText}>Link Microsoft Account</Text>
      </TouchableOpacity>
    );
  }
  if (isSuccess) {
    return (
      <View style={styles.linkedContainer}>
        <Text style={styles.linkedText}>✓ Microsoft Account Linked</Text>
        <TouchableOpacity style={styles.changeButton} onPress={handleLink}>
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return null;
}

export function Profile() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
        </View>
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Connected Services</Text>
          <GitHubLinker />
          <MicrosoftLinker />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  card: { backgroundColor: '#16213e', borderRadius: 12, padding: 20 },
  infoSection: { marginBottom: 24 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  label: { fontSize: 14, color: '#888', fontWeight: '500' },
  value: { fontSize: 14, color: '#fff' },
  actionsSection: { paddingTop: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#24292e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  linkedText: { color: '#28a745', fontSize: 16, fontWeight: '600' },
  changeButton: {
    backgroundColor: '#0f3460',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  changeButtonText: { color: '#fff', fontSize: 14 },
});
