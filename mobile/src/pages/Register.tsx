import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import type { RootStackParamList } from '../navigation';
import { useRegisterMutation } from '../shared/src/native';
import styles from '../style/index';

type RegisterNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigation = useNavigation<RegisterNavigationProp>();
  const [register, { isLoading }] = useRegisterMutation();

  // Password requirements
  const requirements = [
    { label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    {
      label: 'At least one uppercase letter',
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      label: 'At least one lowercase letter',
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    { label: 'At least one number', test: (pwd: string) => /[0-9]/.test(pwd) },
    {
      label: 'At least one special character',
      test: (pwd: string) => /[\W_]/.test(pwd),
    },
    {
      label: 'Must not include name',
      test: (pwd: string) => !name || !new RegExp(name, 'i').test(pwd),
    },
  ];

  const passwordStrength = requirements.reduce(
    (score, req) => score + (req.test(password) ? 1 : 0),
    0
  );

  const isEmailValid = (value: string) =>
    value.length <= 254 &&
    /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}$/.test(
      value
    );

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (!isEmailValid(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (passwordStrength < requirements.length) {
      setErrorMessage('Password must satisfy all criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      await register({ name, email, password }).unwrap();
      Alert.alert('Success', 'Registration successful! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      const apiError = err as { data?: { message: string } };
      setErrorMessage(
        apiError.data?.message || 'An unexpected error occurred.'
      );
      console.error('Failed to register:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Register</Text>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoCapitalize='words'
              placeholder='Enter your name'
              placeholderTextColor='#888'
            />
          </View>

          {/* Email */}
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

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder='Enter your password'
                placeholderTextColor='#888'
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Icon
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={20}
                  color='#fff'
                />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 8 }}>
              {requirements.map((req) => (
                <Text
                  key={req.label}
                  style={{
                    color: req.test(password) ? 'green' : 'red',
                    fontSize: 12,
                  }}
                >
                  {req.label}
                </Text>
              ))}
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder='Confirm your password'
                placeholderTextColor='#888'
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Icon
                  name={showConfirmPassword ? 'eye-slash' : 'eye'}
                  size={20}
                  color='#fff'
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Login</Text>
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
