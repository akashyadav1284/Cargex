import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert,
  StatusBar
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { Mail, Phone, MapPin, Save, LogOut, FileText } from 'lucide-react-native';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Header from '../components/Header';

export default function SettingsScreen({ navigation }: any) {
  const { driver, reloadProfile, logout } = useAuth();

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (driver) {
      setPhone(driver.phone || '');
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Header title="Settings" />
      
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar block */}
        <View style={styles.avatarSection}>
          <Avatar 
            name={driver?.name || 'Driver'} 
            source={driver?.profileImage}
            size={76} 
          />
          <Text style={styles.driverName}>{driver?.name || 'Driver Partner'}</Text>
          <Text style={styles.driverRole}>Vetted Logistics Partner</Text>
        </View>

        {/* Account settings card */}
        <Card variant="outlined" padding="lg" style={styles.formCard}>
          <Text style={styles.cardHeader}>Account Profiles</Text>

          {/* Email (Read Only) */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIconBg, { backgroundColor: COLORS.surface }]}>
              <Mail size={16} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.fieldLabel}>Email Address (Protected)</Text>
              <Text style={styles.fieldReadVal}>{driver?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Input
            label="Mobile Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon={<Phone size={16} color={COLORS.textLight} />}
          />

          <Input
            label="Registered Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter street details"
            icon={<MapPin size={16} color={COLORS.textLight} />}
          />

          <Input
            label="Working City"
            value={city}
            onChangeText={setCity}
            placeholder="Enter city name"
            icon={<MapPin size={16} color={COLORS.textLight} />}
          />

          <Button
            title="Save Profiles"
            onPress={handleSave}
            loading={isLoading}
            variant="accent"
            size="md"
            style={styles.saveBtn}
            icon={<Save size={16} color={COLORS.white} />}
          />
        </Card>

        {/* Quick navigation actions */}
        <Button
          title="Manage Vetting Documents"
          onPress={() => navigation.navigate('DocumentUpload')}
          variant="outline"
          size="md"
          style={styles.documentsBtn}
          icon={<FileText size={16} color={COLORS.primary} />}
        />

        <Button
          title="Logout from Account"
          onPress={logout}
          variant="danger"
          size="md"
          style={styles.logoutBtn}
          icon={<LogOut size={16} color={COLORS.white} />}
        />
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
    paddingBottom: 110,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  driverRole: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    ...SHADOWS.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  fieldIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldReadVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  saveBtn: {
    marginTop: SPACING.sm,
  },
  documentsBtn: {
    marginTop: SPACING.sm,
    borderColor: COLORS.primary,
  },
  logoutBtn: {
    marginTop: SPACING.md,
  },
});
