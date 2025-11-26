import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';

export function Profile() {
  const { user } = useAuth();

  const handleLinkGithub = async () => {
    try {
      const url = await authApi.getGithubAuthUrl();
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open GitHub authentication URL');
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to get GitHub authentication URL');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>ID</Text>
            <Text style={styles.value}>{user?.id}</Text>
          </View>
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
          <TouchableOpacity
            style={styles.githubButton}
            onPress={handleLinkGithub}
          >
            <Text style={styles.githubButtonText}>Link GitHub Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  label: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#fff',
  },
  actionsSection: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  githubButton: {
    backgroundColor: '#24292e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  githubButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
