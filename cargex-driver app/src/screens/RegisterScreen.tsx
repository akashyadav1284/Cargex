import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>Cargex Driver</Text>
            <Text style={styles.subtitle}>Apply for a driver account to join the Cargex logistics network.</Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rajesh Kumar"
              placeholderTextColor={COLORS.muted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. rajesh@example.com"
              placeholderTextColor={COLORS.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +91 9467658854"
              placeholderTextColor={COLORS.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a password"
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.vehicleSelectBox}>
              {VEHICLE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.vehicleBtn,
                    vehicleType === type && styles.vehicleBtnSelected
                  ]}
                  onPress={() => setVehicleType(type)}
                >
                  <Text style={[styles.vehicleBtnText, vehicleType === type && styles.vehicleBtnTextSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Submit Application</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already registered? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
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
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.md,
  },
  logo: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: SPACING.xs,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginTop: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.foreground,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  vehicleSelectBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  vehicleBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: COLORS.background,
  },
  vehicleBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  vehicleBtnText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },
  vehicleBtnTextSelected: {
    color: COLORS.white,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
