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
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useDispatch } from 'react-redux';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import type { RootStackParamList } from '../navigation';
import { setBaseUrl } from '../shared/src/features/configSlice';
import {
  apiSlice,
  clearToken,
  logout,
  useAppSelector,
  useRegisterMutation,
} from '../shared/src/native';
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

  const dispatch = useDispatch();
  const baseUrlFromStore = useAppSelector((state) => state.config.baseUrl);

  const [customBaseUrl, setCustomBaseUrl] = useState(baseUrlFromStore);

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

  const getStrengthText = (strength: number) => {
    if (strength === 0) return 'No password';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    if (strength <= 5) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return '#666';
    if (strength <= 2) return '#ff4444';
    if (strength <= 3) return '#ff9800';
    if (strength <= 4) return '#ffd700';
    if (strength <= 5) return '#4caf50';
    return '#00c853';
  };

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

  const handleLogout = async () => {
    await dispatch(clearToken());
    dispatch(apiSlice.util.resetApiState());
    dispatch(logout());
    navigation.reset({
      index: 0,
      routes: [{ name: 'Register' }],
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
            <Text style={styles.title}>Register</Text>
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

          {/* Name */}
          <View style={styles.infoSection}>
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

          {/* Password */}
          <View style={styles.infoSection}>
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

            <View style={{ marginTop: 12 }}>
              {/* Password Strength Bar */}
              {password ? (
                <View style={{ marginBottom: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ color: '#888', fontSize: 12 }}>
                      Password Strength:
                    </Text>
                    <Text
                      style={{
                        color: getStrengthColor(passwordStrength),
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {getStrengthText(passwordStrength)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: '#333',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${(passwordStrength / 6) * 100}%`,
                        backgroundColor: getStrengthColor(passwordStrength),
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>
              ) : null}

              {/* Requirements */}
              <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>
                Password requirements:
              </Text>
              {requirements.map((req) => (
                <View
                  key={req.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Icon
                    name={req.test(password) ? 'check-circle' : 'times-circle'}
                    size={12}
                    color={req.test(password) ? '#4caf50' : '#ff4444'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: req.test(password) ? '#4caf50' : '#ff4444',
                      fontSize: 11,
                    }}
                  >
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.infoSection}>
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
            <Text style={styles.link}>Already have an account? </Text>
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
