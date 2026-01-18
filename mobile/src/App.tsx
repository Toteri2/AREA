import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Linking, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import type { RootStackParamList } from './navigation';
import { Area, Dashboard, Login, Profile, Register } from './pages';
import {
  store,
  useAppSelector,
  useGetProfileQuery,
  useGoogleAuthValidateMutation,
  useValidateDiscordMutation,
  useValidateGithubMutation,
  useValidateMicrosoftMutation,
} from './shared/src/native';
import styles from './style/index';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const { isLoading } = useGetProfileQuery(undefined, { skip: !token });
  const [validateGithub] = useValidateGithubMutation();
  const [validateGoogle] = useGoogleAuthValidateMutation();
  const [validateMicrosoft] = useValidateMicrosoftMutation();
  const [validateDiscord] = useValidateDiscordMutation();

  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      const codeMatch = url.match(/[?&]code=([^&]+)/);
      const code = codeMatch ? codeMatch[1] : null;

      const stateMatch = url.match(/[?&]state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : '';

      if (!code) return;

      try {
        if (url.includes('auth/github')) {
          await validateGithub({ code }).unwrap();
          Alert.alert('Success', 'GitHub account linked successfully!');
        } else if (url.includes('auth/microsoft')) {
          await validateMicrosoft({ code }).unwrap();
          Alert.alert('Success', 'Microsoft account linked successfully!');
        } else if (url.includes('auth/google')) {
          await validateGoogle({ code }).unwrap();
          Alert.alert('Success', 'Google account linked successfully!');
        } else if (url.includes('auth/discord')) {
          await validateDiscord({ code, state }).unwrap();
          Alert.alert('Success', 'Discord account linked successfully!');
        }
      } catch (_error) {
        Alert.alert('Error', 'Failed to link account. Please try again.');
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [validateGithub, validateGoogle, validateMicrosoft, validateDiscord]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#e94560' />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: styles.headerApp,
        headerTintColor: '#fff',
        headerTitleStyle: styles.headerTitleApp,
        contentStyle: styles.contentApp,
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name='Dashboard' component={Dashboard} />
          <Stack.Screen name='Profile' component={Profile} />
          <Stack.Screen name='Area' component={Area} />
        </>
      ) : (
        <>
          <Stack.Screen
            name='Login'
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name='Register'
            component={Register}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
