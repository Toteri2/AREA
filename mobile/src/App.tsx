import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import type { RootStackParamList } from './navigation';
import {
  Dashboard,
  GitHub,
  Login,
  Profile,
  Reactions,
  Register,
} from './pages';
import {
  store,
  useAppSelector,
  useGetProfileQuery,
  useValidateGithubMutation,
  useValidateMicrosoftMutation,
} from './shared/src/native';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const { isLoading } = useGetProfileQuery(undefined, { skip: !token });
  const [validateGithub] = useValidateGithubMutation();
  const [validateMicrosoft] = useValidateMicrosoftMutation();

  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      const codeMatch = url.match(/[?&]code=([^&]+)/);
      const code = codeMatch ? codeMatch[1] : null;

      if (!code) return;

      try {
        if (url.includes('auth/github')) {
          await validateGithub({ code }).unwrap();
          Alert.alert('Success', 'GitHub account linked successfully!');
        } else if (url.includes('auth/microsoft')) {
          await validateMicrosoft({ code }).unwrap();
          Alert.alert('Success', 'Microsoft account linked successfully!');
        }
      } catch (_error) {
        Alert.alert('Error', 'Failed to link account. Please try again.');
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [validateGithub, validateMicrosoft]);

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
        headerStyle: { backgroundColor: '#16213e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name='Dashboard' component={Dashboard} />
          <Stack.Screen name='Profile' component={Profile} />
          <Stack.Screen name='GitHub' component={GitHub} />
          <Stack.Screen name='Reactions' component={Reactions} />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});

export default App;
