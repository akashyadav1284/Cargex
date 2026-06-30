import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Building, Phone, Mail, Key, Save, LogOut } from 'lucide-react-native';

export default function SettingsScreen() {
  const { agency, logout } = useAuth();

  // Profile Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  useEffect(() => {
    if (agency) {
      setName(agency.name || '');
      setPhone(agency.phone || '');
    }
  }, [agency]);

  const handleSaveProfile = async () => {
    if (!name) {
      Alert.alert('Incomplete', 'Please fill in the agency name.');
      return;
    }
    setIsLoadingProfile(true);
    try {
      await apiClient.put('/api/agency/profile', {
        name,
        phone
      });
      Alert.alert('Success', 'Agency profile details updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update agency profile.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Incomplete', 'Please fill in both current and new passwords.');
      return;
    }
    setIsLoadingPassword(true);
    try {
      await apiClient.put('/api/agency/password', {
        currentPassword: oldPassword,
        newPassword: newPassword
      });
      Alert.alert('Success', 'Your agency credentials password has been updated.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agency Details</Text>
          
          <View style={styles.fieldRow}>
            <Mail size={16} color={COLORS.muted} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Registered Email (Protected)</Text>
              <Text style={styles.fieldVal}>{agency?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Agency Business Name</Text>
          <View style={styles.inputRow}>
            <Building size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.label}>Contact Phone Number</Text>
          <View style={styles.inputRow}>
            <Phone size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {isLoadingProfile ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Save size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Profile Details</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Change Password Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Update Credentials</Text>

          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputRow}>
            <Key size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputRow}>
            <Key size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
          </View>

          {isLoadingPassword ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePassword}>
              <Save size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Update Password</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={18} color={COLORS.red} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Logout from Agency Portal</Text>
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
  container: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardTitle: {
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
  fieldLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },
  fieldVal: {
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.foreground,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 14,
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
    marginTop: SPACING.md,
  },
  logoutBtnText: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: '700',
  },
});
