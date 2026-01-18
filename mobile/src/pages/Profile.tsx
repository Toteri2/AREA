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
  useGetServicesQuery,
  useLazyGetDiscordAuthUrlQuery,
  useLazyGetGithubAuthUrlQuery,
  useLazyGetGmailAuthUrlQuery,
  useLazyGetJiraAuthUrlQuery,
  useLazyGetMicrosoftAuthUrlQuery,
  useLazyGetTwitchAuthUrlQuery,
} from '../shared/src/native';
import styles from '../style/index';

type Service = { name: string };

type ServiceLinkerProps = {
  label: string;
  isLoading: boolean;
  isLinked: boolean;
  onLink: () => void;
};

function ServiceLinker({
  label,
  isLoading,
  isLinked,
  onLink,
}: ServiceLinkerProps) {
  if (isLoading) {
    return <ActivityIndicator color='#e94560' style={{ marginVertical: 10 }} />;
  }

  if (isLinked) {
    return (
      <View style={styles.serviceLinked}>
        <Text style={styles.linkedStatus}>✓ {label} Account Linked</Text>
        <TouchableOpacity style={styles.changeButton} onPress={onLink}>
          <Text style={styles.changeButtonText}>Change Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.linkButton} onPress={onLink}>
      <Text style={styles.linkButtonText}>Link {label} Account</Text>
    </TouchableOpacity>
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

  const [getGithubAuthUrl] = useLazyGetGithubAuthUrlQuery();
  const [getGmailAuthUrl] = useLazyGetGmailAuthUrlQuery();
  const [getMicrosoftAuthUrl] = useLazyGetMicrosoftAuthUrlQuery();
  const [getDiscordAuthUrl] = useLazyGetDiscordAuthUrlQuery();
  const [getJiraAuthUrl] = useLazyGetJiraAuthUrlQuery();
  const [getTwitchAuthUrl] = useLazyGetTwitchAuthUrlQuery();

  const githubConnection = useConnectionQuery(
    serviceNames.has('github') ? { provider: 'github' } : undefined,
    { skip: !serviceNames.has('github') }
  );

  const gmailConnection = useConnectionQuery(
    serviceNames.has('gmail') ? { provider: 'gmail' } : undefined,
    { skip: !serviceNames.has('gmail') }
  );

  const microsoftConnection = useConnectionQuery(
    serviceNames.has('microsoft') ? { provider: 'microsoft' } : undefined,
    { skip: !serviceNames.has('microsoft') }
  );
  const discordConnection = useConnectionQuery(
    serviceNames.has('discord') ? { provider: 'discord' } : undefined,
    { skip: !serviceNames.has('discord') }
  );
  const jiraConnection = useConnectionQuery(
    serviceNames.has('jira') ? { provider: 'jira' } : undefined,
    { skip: !serviceNames.has('jira') }
  );
  const twitchConnection = useConnectionQuery(
    serviceNames.has('twitch') ? { provider: 'twitch' } : undefined,
    { skip: !serviceNames.has('twitch') }
  );

  const handleOAuthRedirect = async (
    trigger: (args: { mobile: boolean }) => Promise<{
      data?: { url: string };
      error?: unknown;
    }>,
    label: string
  ) => {
    try {
      const result = await trigger({ mobile: true });
      if (result.data?.url) {
        await Linking.openURL(result.data.url);
      } else {
        Alert.alert('Error', `Could not get ${label} auth URL`);
      }
    } catch {
      Alert.alert('Error', `Unexpected error while linking ${label}`);
    }
  };

  const serviceConfig: Record<
    string,
    {
      label: string;
      connection: typeof githubConnection;
      trigger: typeof getGithubAuthUrl;
    }
  > = {
    github: {
      label: 'GitHub',
      connection: githubConnection,
      trigger: getGithubAuthUrl,
    },
    gmail: {
      label: 'Gmail',
      connection: gmailConnection,
      trigger: getGmailAuthUrl,
    },
    microsoft: {
      label: 'Microsoft',
      connection: microsoftConnection,
      trigger: getMicrosoftAuthUrl,
    },
    discord: {
      label: 'Discord',
      connection: discordConnection,
      trigger: getDiscordAuthUrl,
    },
    jira: {
      label: 'Jira',
      connection: jiraConnection,
      trigger: getJiraAuthUrl,
    },
    twitch: {
      label: 'Twitch',
      connection: twitchConnection,
      trigger: getTwitchAuthUrl,
    },
  };

  const handleLogout = async () => {
    await dispatch(clearToken());
    dispatch(apiSlice.util.resetApiState());
    dispatch(logout());
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const updateBaseUrl = async () => {
    if (!customBaseUrl.startsWith('http')) {
      Alert.alert('Error', 'URL must begin with http or https');
      return;
    }

    dispatch(setBaseUrl(customBaseUrl));
    await AsyncStorage.setItem('baseUrl', customBaseUrl);
    Alert.alert('Success', 'Base URL updated !');
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
          <Text style={styles.cardTitle}>Connected Services</Text>
          {services.map((service) => {
            const config = serviceConfig[service.name];
            if (!config) return null;

            return (
              <ServiceLinker
                key={service.name}
                label={config.label}
                isLoading={config.connection.isLoading}
                isLinked={config.connection.data?.connected === true}
                onLink={() => handleOAuthRedirect(config.trigger, config.label)}
              />
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Base URL</Text>
          <TextInput
            style={styles.input}
            value={customBaseUrl}
            onChangeText={setCustomBaseUrl}
            placeholder={customBaseUrl}
            placeholderTextColor='#888'
          />
          <TouchableOpacity style={styles.button} onPress={updateBaseUrl}>
            <Text style={styles.buttonText}>Update Base URL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logout</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Disconnect now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
