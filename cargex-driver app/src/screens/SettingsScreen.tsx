import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { User, Mail, Phone, MapPin, Save, LogOut, FileText } from 'lucide-react-native';

export default function SettingsScreen({ navigation }: any) {
  const { driver, reloadProfile, logout } = useAuth();

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (driver) {
      setPhone(driver.phone || '');
      // Check if address/city exist in driver object
      setAddress((driver as any).address || '');
      setCity((driver as any).city || '');
    }
  }, [driver]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiClient.put('/api/driver/update-profile', {
        phone,
        address,
        city
      });
      await reloadProfile();
      Alert.alert('Profile Saved', 'Your profile details have been successfully updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {((driver?.name || driver?.fullName || 'D').charAt(0)).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.driverName}>{driver?.name || 'Driver Partner'}</Text>
          <Text style={styles.driverRole}>Vetted Logistics Associate</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardHeader}>Account Details</Text>

          {/* Email (Read Only) */}
          <View style={styles.fieldRow}>
            <Mail size={16} color={COLORS.muted} style={styles.fieldIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Email Address (Protected)</Text>
              <Text style={styles.fieldReadVal}>{driver?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Phone */}
          <Text style={styles.inputLabel}>Mobile Phone</Text>
          <View style={styles.inputWrapper}>
            <Phone size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Address */}
          <Text style={styles.inputLabel}>Registered Address</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter street details"
              placeholderTextColor={COLORS.muted}
            />
          </View>

          {/* City */}
          <Text style={styles.inputLabel}>Working City</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              value={city}
              onChangeText={setCity}
              placeholder="Enter city"
              placeholderTextColor={COLORS.muted}
            />
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.accent} style={{ marginTop: 20 }} />
          ) : (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Save size={18} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Profiles</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.documentsBtn} 
          onPress={() => navigation.navigate('DocumentUpload')}
        >
          <FileText size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.documentsBtnText}>Manage Vetting Documents</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={18} color={COLORS.red} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Logout from Driver Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  documentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  documentsBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  container: {
    padding: SPACING.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  avatarLargeText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
  },
  driverName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.foreground,
    marginTop: SPACING.sm,
  },
  driverRole: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  fieldIcon: {
    marginRight: 12,
  },
  fieldLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },
  fieldReadVal: {
    fontSize: 14,
    color: COLORS.foreground,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.foreground,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: SPACING.xl,
    marginBottom: 40,
  },
  logoutBtnText: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: '700',
  },
});
