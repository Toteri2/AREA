import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import type { RootStackParamList } from '../navigation';
import { useLoginMutation } from '../shared/src/native';
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.formGroup}>
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

          <View style={styles.formGroup}>
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
            <Text style={styles.linkText}>Don't have an account? </Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
