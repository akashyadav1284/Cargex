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
  TouchableOpacity,
  Alert
} from 'react-native';
import { User, Mail, Phone, Lock, ClipboardCheck, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

const VEHICLE_TYPES = [
  "Tata Ace",
  "Ashok Leyland Dost",
  "Pickup Truck",
  "Mini Truck",
  "Container Truck",
  "Closed Truck",
  "Trailer"
];

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
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
      await register(name, email, phone, password, vehicleType);
      Alert.alert(
        'Application Submitted!',
        'Your registration request has been submitted successfully. Admin review takes up to 24 hours.',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Registration failed. Please try again.');
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
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7} style={styles.backBtn}>
              <Text style={styles.backText}>Back to Sign In</Text>
            </TouchableOpacity>
            <Text style={styles.logo}>Join Cargex Network</Text>
            <Text style={styles.subtitle}>Apply for a logistics partner account and earn daily incentives.</Text>
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
              label="Full Name"
              placeholder="e.g. Rajesh Kumar"
              value={name}
              onChangeText={setName}
              icon={<User size={18} color={COLORS.textLight} />}
            />

            <Input
              label="Email Address"
              placeholder="e.g. rajesh@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<Mail size={18} color={COLORS.textLight} />}
            />

            <Input
              label="Phone Number"
              placeholder="e.g. +91 9467658854"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon={<Phone size={18} color={COLORS.textLight} />}
            />

            <Input
              label="Password"
              placeholder="Choose a strong password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              icon={<Lock size={18} color={COLORS.textLight} />}
            />

            <Text style={styles.label}>Select Registered Vehicle Type</Text>
            <View style={styles.vehicleGrid}>
              {VEHICLE_TYPES.map((type) => {
                const isSelected = vehicleType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.vehicleBtn,
                      isSelected && styles.vehicleBtnSelected
                    ]}
                    onPress={() => setVehicleType(type)}
                    activeOpacity={0.8}
                  >
                    <Text 
                      style={[
                        styles.vehicleBtnText, 
                        isSelected && styles.vehicleBtnTextSelected
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="Submit Partner Application"
              onPress={handleRegister}
              loading={isLoading}
              variant="accent"
              size="lg"
              style={styles.submitBtn}
              icon={<ClipboardCheck size={18} color={COLORS.white} />}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already registered? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Sign In</Text>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  backBtn: {
    marginBottom: SPACING.sm,
  },
  backText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
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
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  vehicleBtn: {
    backgroundColor: COLORS.inputBg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  vehicleBtnSelected: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.accent,
  },
  vehicleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  vehicleBtnTextSelected: {
    color: COLORS.accent,
  },
  submitBtn: {
    marginTop: SPACING.sm,
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
