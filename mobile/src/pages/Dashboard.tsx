import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { RootStackParamList } from '../navigation';
import { useAppSelector } from '../shared/src/native';
import styles from '../style/index';

type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

export function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const navigation = useNavigation<DashboardNavigationProp>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome, {user?.name}!</Text>
        {/* <Text style={styles.welcomeEmail}>{user?.email}</Text> */}
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.cardDescription}>View and edit your profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Area')}
        >
          <Text style={styles.cardTitle}>Area</Text>
          <Text style={styles.cardDescription}>Area page (automation)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
