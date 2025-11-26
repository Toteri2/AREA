import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation';

type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<DashboardNavigationProp>();

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome, {user?.name}!</Text>
        <Text style={styles.welcomeEmail}>{user?.email}</Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('GitHub')}
        >
          <Text style={styles.cardTitle}>GitHub Integration</Text>
          <Text style={styles.cardDescription}>
            Manage your repositories and webhooks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.cardDescription}>View and edit your profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  welcomeCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeEmail: {
    fontSize: 14,
    color: '#888',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#e94560',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#888',
  },
  logoutButton: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  logoutText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
});
