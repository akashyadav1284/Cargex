import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  RefreshControl,
  StatusBar
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { 
  Truck, 
  History, 
  PhoneCall, 
  MapPin, 
  LogOut, 
  ArrowRight, 
  Search,
  Bell,
  ShieldCheck,
  UserCheck
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSocket } from '../contexts/SocketContext';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Loader from '../components/Loader';

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActiveBooking = async () => {
    try {
      const response = await apiClient.get('/api/users/bookings');
      const bookings = response.data.bookings || response.data || [];
      const active = bookings.find((b: any) => 
        ['requested', 'accepted', 'arrived', 'in_progress'].includes(b.status)
      );
      setActiveBooking(active || null);
    } catch (e) {
      console.error('Failed to fetch active booking', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveBooking();
    }, [])
  );

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      if (activeBooking && activeBooking._id === data.bookingId) {
        setActiveBooking((prev: any) => {
          if (!prev) return null;
          const updated = { ...prev, status: data.status };
          if (data.driver) updated.driverId = data.driver;
          return updated;
        });
      } else {
        fetchActiveBooking();
      }
    };

    socket.on('ride_status_update', handleStatusUpdate);
    socket.on('driver_assigned', (data: any) => {
      fetchActiveBooking();
    });

    return () => {
      socket.off('ride_status_update', handleStatusUpdate);
    };
  }, [socket, activeBooking]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchActiveBooking();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'requested': return 'Searching for nearby transport partners...';
      case 'accepted': return 'Driver accepted your request';
      case 'arrived': return 'Driver has arrived at pickup';
      case 'in_progress': return 'Ride in progress';
      default: return 'Active Booking';
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <Avatar name={user?.name || 'User'} size={46} showOnlineBadge={true} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.welcomeText}>Hello,</Text>
            <Text style={styles.userNameText}>{user?.name || 'Partner'}</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={logout}>
            <LogOut size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
        }
      >
        {/* Current Location Quick Card */}
        <Card style={styles.locationCard} padding="small" variant="outlined">
          <View style={styles.locationRow}>
            <MapPin size={18} color={COLORS.secondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              Current: New Delhi, NCR region, India
            </Text>
          </View>
        </Card>

        {/* Hero Banner Section */}
        <TouchableOpacity 
          style={styles.heroBanner}
          onPress={() => navigation.navigate('BookTab')}
          activeOpacity={0.95}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>FAST & RELIABLE</Text>
            <Text style={styles.heroTitle}>Book Cargo{'\n'}in Minutes</Text>
            <Text style={styles.heroDesc}>
              Move anything anywhere with transparent pricing.
            </Text>
            
            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Start Shipping</Text>
              <ArrowRight size={16} color={COLORS.white} style={{ marginLeft: 6 }} />
            </View>
          </View>
          <Text style={styles.heroEmoji}>🚛</Text>
        </TouchableOpacity>

        {/* Active Booking Section */}
        {isLoading ? (
          <Loader size="small" style={{ marginVertical: SPACING.md }} />
        ) : activeBooking ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Shipment</Text>
            <Card 
              onPress={() => navigation.navigate('LiveTracking', { bookingId: activeBooking._id })}
              style={styles.activeCard}
            >
              <View style={styles.activeHeader}>
                <Badge label={activeBooking.status} status={activeBooking.status} />
                <Text style={styles.activeTime}>
                  {new Date(activeBooking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.activeStatusDesc}>{getStatusText(activeBooking.status)}</Text>
              
              <View style={styles.routeContainer}>
                <View style={styles.routeRow}>
                  <View style={styles.dotGreen} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {activeBooking.pickupLocation.address}
                  </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <View style={styles.dotRed} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {activeBooking.dropLocation.address}
                  </Text>
                </View>
              </View>

              <View style={styles.activeFooter}>
                <Text style={styles.fareText}>
                  Total Payout: <Text style={styles.fareVal}>₹{activeBooking.pricing?.totalFare || activeBooking.price?.total || 0}</Text>
                </Text>
                <Text style={styles.liveLink}>Track live order →</Text>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation.navigate('BookTab')}
            activeOpacity={0.9}
          >
            <View style={[styles.gridIconBg, { backgroundColor: '#F0FDF4' }]}>
              <Truck size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.gridTitle}>Book Truck</Text>
            <Text style={styles.gridDesc}>Request vehicles</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation.navigate('HistoryTab')}
            activeOpacity={0.9}
          >
            <View style={[styles.gridIconBg, { backgroundColor: '#EFF6FF' }]}>
              <History size={24} color={COLORS.blue} />
            </View>
            <Text style={styles.gridTitle}>Shipments</Text>
            <Text style={styles.gridDesc}>View history</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation.navigate('SupportTab')}
            activeOpacity={0.9}
          >
            <View style={[styles.gridIconBg, { backgroundColor: '#FFF7ED' }]}>
              <PhoneCall size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.gridTitle}>Support</Text>
            <Text style={styles.gridDesc}>Call helpline</Text>
          </TouchableOpacity>
        </View>

        {/* Trust/Safety Banner */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyBadgeRow}>
            <ShieldCheck size={18} color={COLORS.secondary} />
            <Text style={styles.safetyBadgeText}>SECURE LOGISTICS NETWORK</Text>
          </View>
          <Text style={styles.safetyTitle}>Verified Drivers & Partners</Text>
          <Text style={styles.safetyDesc}>
            Every driver partner is background checked and verified to ensure safety for your high-value cargo.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 110,
  },
  locationCard: {
    marginBottom: SPACING.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  heroBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  heroContent: {
    flex: 1.2,
  },
  heroTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    lineHeight: 16,
    fontWeight: '500',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
  },
  ctaText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  heroEmoji: {
    fontSize: 80,
    opacity: 0.9,
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  section: {
    marginVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  activeCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  activeTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  activeStatusDesc: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  routeContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  routeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 10,
    flex: 1,
  },
  routeLine: {
    width: 1.5,
    height: 18,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  activeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  fareText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  fareVal: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  liveLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  gridCard: {
    width: '31%',
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  gridIconBg: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gridDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  safetyCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.xs,
  },
  safetyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  safetyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
    marginLeft: 6,
    letterSpacing: 1,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  safetyDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '500',
  },
});
