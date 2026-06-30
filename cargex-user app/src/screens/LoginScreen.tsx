import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  SafeAreaView,
  Image
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Mail, Lock, LogIn } from 'lucide-react-native';
import Button from '../components/Button';
import Input from '../components/Input';

export default function LoginScreen({ navigation }: any) {
  const { login, loginWithGoogle } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '209884063738-6bsqm3krnfh2hrqi6s2kc7fsheg5oh83.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleLogin = async () => {
    if (!identifier || !password) {
      setErrorMsg('Please enter both Email/Phone and Password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      await login(identifier, password);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || e.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo: any = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      const token = idToken || userInfo.idToken || userInfo.data?.accessToken || userInfo.accessToken;
      
      if (!token) {
        throw new Error('Google Sign-In did not return an auth token.');
      }
      
      const email = userInfo.data?.user?.email || userInfo.user?.email;
      const name = userInfo.data?.user?.name || userInfo.user?.name;

      await loginWithGoogle(token, email, name);
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        setErrorMsg('Sign-in cancelled.');
      } else if (e.code === statusCodes.IN_PROGRESS) {
        setErrorMsg('Sign-in in progress.');
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMsg('Google Play Services not available.');
      } else {
        setErrorMsg(e.message || 'Google Sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>C</Text>
            </View>
            <Text style={styles.logoText}>Cargex</Text>
            <Text style={styles.subtitle}>Moving India Smarter</Text>
          </View>

          {/* Form Panel */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Log in to request rides and manage deliveries.</Text>

            {errorMsg ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <Input
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="user@example.com or phone..."
              label="Email or Phone Number"
              icon={<Mail size={20} color={COLORS.textMuted} />}
              keyboardType="email-address"
            />

            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              label="Password"
              secureTextEntry
              icon={<Lock size={20} color={COLORS.textMuted} />}
            />

            <Button
              label="Log In"
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={isGoogleLoading}
              icon={<LogIn size={20} color={COLORS.white} />}
              style={styles.loginBtn}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            {/* Google Branded Button */}
            <Button
              label="Continue with Google"
              onPress={handleGoogleLogin}
              variant="outline"
              isLoading={isGoogleLoading}
              disabled={isLoading}
              icon={
                <View style={styles.gCircle}>
                  <Text style={styles.gText}>G</Text>
                </View>
              }
              style={styles.googleBtn}
              labelStyle={styles.googleBtnText}
            />

            {/* Footer Navigation */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Button
                label="Sign Up"
                onPress={() => navigation.navigate('Register')}
                variant="ghost"
                style={styles.signUpBtn}
                labelStyle={styles.signUpBtnText}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  logoBadgeText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
  },
  loginBtn: {
    marginTop: SPACING.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  googleBtn: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  googleBtnText: {
    color: COLORS.primary,
  },
  gCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  signUpBtn: {
    height: 'auto',
    paddingHorizontal: 0,
    borderWidth: 0,
  },
  signUpBtnText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
