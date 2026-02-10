import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
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
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.cardHeader}>
            <Icon name='user' size={20} color='#000' solid />
            <Text style={styles.cardTitle}>Profile</Text>
          </View>
          <Text style={styles.cardDescription}>View and edit your profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Area')}
        >
          <View style={styles.cardHeader}>
            <Icon name='cog' size={20} color='#000' solid />
            <Text style={styles.cardTitle}>Area</Text>
          </View>
          <Text style={styles.cardDescription}>Area page (automation)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
