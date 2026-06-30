import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { Mail, Lock, LogIn, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg(e.response?.data?.message || e.message || 'Login failed. Please verify driver credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <LogIn size={26} color={COLORS.accent} />
            </View>
            <Text style={styles.logo}>Cargex <Text style={{ color: COLORS.accent }}>Driver</Text></Text>
            <Text style={styles.subtitle}>Log in to request dispatches, manage cargo, and start earning today.</Text>
          </View>

          {errorMsg ? (
            <Card variant="solid" padding="md" style={styles.errorCard}>
              <View style={styles.errorRow}>
                <ShieldAlert size={20} color={COLORS.error} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            </Card>
          ) : null}

          <Card variant="outlined" padding="lg" style={styles.formCard}>
            <Input
              label="Email or Phone Number"
              placeholder="driver@example.com or +91..."
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<Mail size={18} color={COLORS.textLight} />}
            />

            <Input
              label="Password"
              placeholder="Enter your account password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              icon={<Lock size={18} color={COLORS.textLight} />}
            />

            <Button
              title="Sign In as Partner"
              onPress={handleLogin}
              loading={isLoading}
              variant="accent"
              size="lg"
              style={styles.button}
              icon={<LogIn size={18} color={COLORS.white} />}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have a partner account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          </Card>
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
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    lineHeight: 20,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: SPACING.lg,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  formCard: {
    backgroundColor: COLORS.card,
    ...SHADOWS.md,
  },
  button: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '800',
  },
});
