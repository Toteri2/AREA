import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setBaseUrl } from '../shared/src/features/configSlice';
import {
  apiSlice,
  clearToken,
  logout,
  useAppSelector,
  useConnectionQuery,
  useGetGithubAuthUrlQuery,
  useGetGmailAuthUrlQuery,
  useGetMicrosoftAuthUrlQuery,
  useGetServicesQuery,
} from '../shared/src/native';
import styles from '../style/index';

type Service = { name: string };

type ServiceLinkerProps = {
  label: string;
  getAuthUrl: () => Promise<any>;
  connection: { isLoading: boolean; isConnected: boolean };
};

function ServiceLinker({ label, getAuthUrl, connection }: ServiceLinkerProps) {
  const handleLink = async () => {
    try {
      const result = await getAuthUrl();
      if (result.url) {
        await Linking.openURL(result.url);
      } else {
        Alert.alert('Error', `Could not get ${label} auth URL`);
      }
    } catch {
      Alert.alert('Error', `Unexpected error while linking ${label}`);
    }
  };

  if (connection.isLoading) {
    return <ActivityIndicator color='#e94560' style={{ marginVertical: 10 }} />;
  }

  if (!connection.isConnected) {
    return (
      <TouchableOpacity style={styles.button} onPress={handleLink}>
        <Text style={styles.buttonText}>Link {label} Account</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.linkedContainer}>
      <Text style={styles.linkedText}>✓ {label} Account Linked</Text>
      <TouchableOpacity style={styles.changeButton} onPress={handleLink}>
        <Text style={styles.changeButtonText}>Change</Text>
      </TouchableOpacity>
    </View>
  );
}

export function Profile() {
  const dispatch = useDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const baseUrlFromStore = useAppSelector((state) => state.config.baseUrl);
  const navigation = useNavigation<DashboardNavigationProp>();

  const [customBaseUrl, setCustomBaseUrl] = useState(baseUrlFromStore);

  const { data: servicesData } = useGetServicesQuery();
  const services: Service[] = servicesData?.server?.services ?? [];
  const serviceNames = new Set(services.map((s) => s.name));

  const githubConnection = useConnectionQuery(
    serviceNames.has('github') ? { provider: 'github' } : undefined
  );
  const githubAuthQuery = useGetGithubAuthUrlQuery(
    serviceNames.has('github') ? undefined : { skip: true }
  );

  const gmailConnection = useConnectionQuery(
    serviceNames.has('gmail') ? { provider: 'gmail' } : undefined
  );
  const gmailAuthQuery = useGetGmailAuthUrlQuery(
    serviceNames.has('gmail') ? undefined : { skip: true }
  );

  const microsoftConnection = useConnectionQuery(
    serviceNames.has('microsoft') ? { provider: 'microsoft' } : undefined
  );
  const microsoftAuthQuery = useGetMicrosoftAuthUrlQuery(
    serviceNames.has('microsoft') ? undefined : { skip: true }
  );

  const getAuthMapping: Record<string, any> = {
    github: {
      getAuthUrl: async () => (await githubAuthQuery.refetch()).data,
      connection: githubConnection,
    },
    gmail: {
      getAuthUrl: async () => (await gmailAuthQuery.refetch()).data,
      connection: gmailConnection,
    },
    microsoft: {
      getAuthUrl: async () => (await microsoftAuthQuery.refetch()).data,
      connection: microsoftConnection,
    },
  };

  const handleLogout = async () => {
    // Clear token from storage
    await dispatch(clearToken());
    // Reset API cache to clear all cached data
    dispatch(apiSlice.util.resetApiState());
    // Clear auth state
    dispatch(logout());
    // Navigate to login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };
  const updateBaseUrl = async () => {
    if (!customBaseUrl.startsWith('http')) {
      Alert.alert('Erreur', "L'URL doit commencer par http ou https");
      return;
    }

    dispatch(setBaseUrl(customBaseUrl));
    await AsyncStorage.setItem('baseUrl', customBaseUrl);
    Alert.alert('Succès', 'Base URL mise à jour !');
    handleLogout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.cardsContainer}>
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
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Base URL</Text>
          <TextInput
            style={styles.input}
            value={customBaseUrl}
            onChangeText={setCustomBaseUrl}
            placeholder='https://api.mambokara.dev'
            placeholderTextColor='#888'
          />
          <TouchableOpacity style={styles.button} onPress={updateBaseUrl}>
            <Text style={styles.buttonText}>Update Base URL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connected Services</Text>
          {services.map((service) => {
            const mapping = getAuthMapping[service.name];
            if (!mapping) return null;
            return (
              <ServiceLinker
                key={service.name}
                label={
                  service.name.charAt(0).toUpperCase() + service.name.slice(1)
                }
                getAuthUrl={mapping.getAuthUrl}
                connection={mapping.connection}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
