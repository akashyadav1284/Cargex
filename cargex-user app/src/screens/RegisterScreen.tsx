import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { User, Mail, Phone, Lock, UserPlus } from 'lucide-react-native';
import Button from '../components/Button';
import Input from '../components/Input';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      await register(name, email, phone, password);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
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
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>C</Text>
            </View>
            <Text style={styles.logoText}>Cargex</Text>
            <Text style={styles.subtitle}>Moving India Smarter</Text>
          </View>

          {/* Form container */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Join Cargex to start shipping and tracking your cargo.</Text>

            {errorMsg ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. John Doe"
              label="Full Name"
              icon={<User size={20} color={COLORS.textMuted} />}
            />

            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. john@example.com"
              label="Email Address"
              keyboardType="email-address"
              icon={<Mail size={20} color={COLORS.textMuted} />}
            />

            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 9467658854"
              label="Phone Number"
              keyboardType="phone-pad"
              icon={<Phone size={20} color={COLORS.textMuted} />}
            />

            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Choose a password"
              label="Password"
              secureTextEntry
              icon={<Lock size={20} color={COLORS.textMuted} />}
            />

            <Button
              label="Sign Up"
              onPress={handleRegister}
              isLoading={isLoading}
              icon={<UserPlus size={20} color={COLORS.white} />}
              style={styles.actionBtn}
            />

            {/* Footer Back to Login Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Button
                label="Log In"
                onPress={() => navigation.navigate('Login')}
                variant="ghost"
                style={styles.loginLinkBtn}
                labelStyle={styles.loginLinkBtnText}
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
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  logoBadgeText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  formContainer: {
    flex: 1,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 13,
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
  actionBtn: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkBtn: {
    height: 'auto',
    paddingHorizontal: 0,
    borderWidth: 0,
  },
  loginLinkBtnText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
