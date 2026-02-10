import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import type { RootStackParamList } from '../navigation';
import { setBaseUrl } from '../shared/src/features/configSlice';
import {
  apiSlice,
  clearToken,
  logout,
  useAppSelector,
  useLoginMutation,
} from '../shared/src/native';
import styles from '../style/index';

type LoginNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation<LoginNavigationProp>();

  const [login, { isLoading }] = useLoginMutation();

  const dispatch = useDispatch();
  const baseUrlFromStore = useAppSelector((state) => state.config.baseUrl);

  const [customBaseUrl, setCustomBaseUrl] = useState(baseUrlFromStore);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setErrorMessage('');

    try {
      await login({ email, password }).unwrap();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (err) {
      const apiError = err as { data?: { message: string } };
      const message = apiError.data?.message || 'An unexpected error occurred.';
      setErrorMessage(message);
      console.error('Failed to login:', err);
    }
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
            <Text style={styles.title}>Login</Text>
            <Text style={styles.cardDescription}>
              Please connect you with your email or Google account. You can
              change the server you want to connect you just below.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.infoSection}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              placeholder='Enter your email'
              placeholderTextColor='#888'
            />
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder='Enter your password'
              placeholderTextColor='#888'
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <Text style={styles.label}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Register</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <GoogleAuthButton onError={setErrorMessage} mobile='true' />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Base URL</Text>
          <Text style={styles.cardDescription}>
            Change the server where you to want to connect you. Write the API
            URL
          </Text>
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
      </View>
    </ScrollView>
  );
}
