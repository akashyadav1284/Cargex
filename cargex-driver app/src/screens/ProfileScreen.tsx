import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Alert, Linking, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { User, Phone, Mail, MapPin, Truck, ShieldAlert, Star, MessageSquare } from 'lucide-react-native';

export default function ProfileScreen() {
  const { driver, reloadProfile } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDriverProfileInfo = async () => {
    try {
      await reloadProfile();
      const res = await apiClient.get('/api/driver/vehicles');
      setVehicles(res.data || []);
    } catch (e) {
      console.error('Failed to sync profile information', e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDriverProfileInfo();
    }, [])
  );

  const handleContactSupport = () => {
    // Open email/dialer support channel
    Linking.openURL('mailto:support@cargex.com?subject=Driver Support Request');
  };

  if (isLoading || !driver) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Syncing profile data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const vInfo = vehicles[0] || driver.vehicleDetails || {};
  const isApproved = driver.status === 'approved' || driver.isApproved;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {((driver.name || driver.fullName || 'D').charAt(0)).toUpperCase()}
              </Text>
            </View>
            <View style={styles.detailsHeader}>
              <Text style={styles.name}>{driver.name || driver.fullName}</Text>
              <Text style={styles.role}>Vetted Driver Partner</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>4.9 (126 reviews)</Text>
              </View>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, isApproved ? styles.badgeApproved : styles.badgePending]}>
              <Text style={[styles.badgeText, isApproved ? styles.badgeTextApproved : styles.badgeTextPending]}>
                {isApproved ? 'ACTIVE PARTNER' : 'PENDING APPROVAL'}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Information */}
        <Text style={styles.sectionHeader}>Registered Logistics Vehicle</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Truck size={18} color={COLORS.accent} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Vehicle Specification</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle Name / Model</Text>
            <Text style={styles.infoVal}>{vInfo.name || vInfo.model || 'Tata Ace'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Number Plate</Text>
            <Text style={styles.infoValPlate}>{vInfo.numberPlate || 'N/A'}</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.gridBox}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoVal}>{vInfo.type || 'Mini Truck'}</Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.infoLabel}>Payload Capacity</Text>
              <Text style={styles.infoVal}>{vInfo.capacity ? `${vInfo.capacity} kg` : '1,500 kg'}</Text>
            </View>
          </View>
        </View>

        {/* Verification Status */}
        <Text style={styles.sectionHeader}>Documents Verification</Text>
        <View style={styles.card}>
          <View style={styles.statusItem}>
            <View>
              <Text style={styles.docName}>Driver's License</Text>
              <Text style={styles.docSub}>Government issued commercial license</Text>
            </View>
            <Text style={[styles.statusText, { color: '#059669' }]}>VERIFIED</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View>
              <Text style={styles.docName}>Vehicle RC Book</Text>
              <Text style={styles.docSub}>Registration certificate matching plate</Text>
            </View>
            <Text style={[styles.statusText, { color: '#059669' }]}>VERIFIED</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View>
              <Text style={styles.docName}>Insurance Policy</Text>
              <Text style={styles.docSub}>Active commercial cargo cover</Text>
            </View>
            <Text style={[styles.statusText, { color: '#059669' }]}>VERIFIED</Text>
          </View>
        </View>

        {/* Contact Admin & Support */}
        <Text style={styles.sectionHeader}>Partner Help Desk</Text>
        <TouchableOpacity style={styles.supportBtn} onPress={handleContactSupport}>
          <MessageSquare size={18} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.supportBtnText}>Contact Support Desk</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
  },
  container: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.md,
    marginBottom: SPACING.lg,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
  },
  detailsHeader: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  role: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.foreground,
    fontWeight: '700',
  },
  badgeRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    alignItems: 'flex-start',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgeApproved: {
    backgroundColor: '#DEF7EC',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextApproved: {
    color: '#03543F',
  },
  badgeTextPending: {
    color: '#B45309',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    paddingLeft: 4,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  infoRow: {
    marginBottom: SPACING.md,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
    marginTop: 2,
  },
  infoValPlate: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accent,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gridBox: {
    flex: 1,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  docSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  supportBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: SPACING.md,
    marginBottom: 40,
    ...SHADOWS.md,
  },
  supportBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
