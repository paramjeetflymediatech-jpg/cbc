import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

interface AuthScreenProps {
  navigation: any;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      Alert.alert('Welcome Back!', 'Logged in successfully.', [
        { text: 'Continue', onPress: () => navigation.replace('Main') },
      ]);
    } else {
      Alert.alert('Login Failed', res.message || 'Invalid email or password.');
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please fill in your name, email address, and password.');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Password Length', 'Password must be at least 4 characters long.');
      return;
    }

    setSubmitting(true);
    const res = await signup(name, email, password, phone);
    setSubmitting(false);

    if (res.success) {
      Alert.alert('Account Created!', 'Your account has been created successfully.', [
        { text: 'Continue', onPress: () => navigation.replace('Main') },
      ]);
    } else {
      Alert.alert('Registration Failed', res.message || 'Unable to create account.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🏥</Text>
          </View>
          <Text style={styles.brandName}>Clinic By Choice</Text>
          <Text style={styles.brandTagline}>Premium Healthcare Discovery Platform</Text>
        </View>

        {/* Tab Selector: Sign In vs Create Account */}
        <View style={styles.tabModeContainer}>
          <TouchableOpacity
            style={[styles.tabModeBtn, mode === 'login' && styles.tabModeBtnActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabModeText, mode === 'login' && styles.tabModeTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabModeBtn, mode === 'signup' && styles.tabModeBtnActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.tabModeText, mode === 'signup' && styles.tabModeTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Auth Form Card */}
        <View style={styles.card}>
          {mode === 'login' ? (
            <>
              <Text style={styles.formHeading}>Sign In with Email</Text>
              <Text style={styles.formSub}>Enter your email address and password to log in</Text>

              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="user@example.com"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotBtn} onPress={() => Alert.alert('Reset Password', 'Password reset instructions will be sent to your email.')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={submitting}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryBtnText}>
                  {submitting ? 'Signing In...' : 'Sign In →'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.formHeading}>Create Your Account</Text>
              <Text style={styles.formSub}>Register with email & password to track healthcare requests</Text>

              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Rahul Verma"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="user@example.com"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91 9876543210"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Create Password *</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="At least 4 characters"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 14 }, submitting && { opacity: 0.6 }]}
                onPress={handleSignup}
                disabled={submitting}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryBtnText}>
                  {submitting ? 'Creating Account...' : 'Create Account & Sign In ✓'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.replace('Main')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Browse Healthcare Services as Guest →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 13,
    color: colors.textMuted,
  },
  tabModeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabModeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabModeBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabModeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabModeTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  formHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  formSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  eyeBtn: {
    paddingHorizontal: 12,
  },
  eyeIcon: {
    fontSize: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 15,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
