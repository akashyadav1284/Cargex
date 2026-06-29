import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Truck, History, PhoneCall, MapPin, User, LogOut, ArrowRight } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSocket } from '../contexts/SocketContext';

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
      // Find the first booking with active status
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
      // data: { bookingId, status, driver }
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
      case 'requested': return 'Searching for nearby drivers...';
      case 'accepted': return 'Driver accepted your request';
      case 'arrived': return 'Driver has arrived at pickup';
      case 'in_progress': return 'Ride in progress';
      default: return 'Active Booking';
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Hello, {user?.name || 'User'}</Text>
            <Text style={styles.subwelcome}>Where would you like to ship today?</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Hero section */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Go Anywhere{'\n'}with Cargex</Text>
            <Text style={styles.heroDesc}>Reliable cargo matching, transparent fare breakdowns, and real-time tracking.</Text>
            <TouchableOpacity 
              style={styles.heroBtn}
              onPress={() => navigation.navigate('BookingFlow')}
            >
              <Text style={styles.heroBtnText}>Book Truck Now</Text>
              <ArrowRight size={16} color={COLORS.white} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          <Text style={styles.truckEmoji}>🚚</Text>
        </View>

        {/* Active Booking Section */}
        {isLoading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginVertical: SPACING.lg }} />
        ) : activeBooking ? (
          <View style={styles.activeSection}>
            <Text style={styles.sectionTitle}>Active Trip</Text>
            <TouchableOpacity 
              style={styles.activeCard}
              onPress={() => navigation.navigate('LiveTracking', { bookingId: activeBooking._id })}
              activeOpacity={0.95}
            >
              <View style={styles.activeHeader}>
                <View style={styles.pulseContainer}>
                  <View style={styles.pulse} />
                  <Text style={styles.activeBadge}>{activeBooking.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.activeTime}>
                  {new Date(activeBooking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.activeStatusText}>{getStatusText(activeBooking.status)}</Text>
              
              <View style={styles.routeContainer}>
                <View style={styles.locationRow}>
                  <MapPin size={18} color={COLORS.accent} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {activeBooking.pickupLocation.address}
                  </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.locationRow}>
                  <MapPin size={18} color={COLORS.red} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {activeBooking.dropLocation.address}
                  </Text>
                </View>
              </View>

              <View style={styles.activeFooter}>
                <Text style={styles.priceText}>
                  Total Fare: ₹{activeBooking.pricing?.totalFare || activeBooking.price?.total || 0}
                </Text>
                <Text style={styles.trackLink}>Track Live →</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('BookingFlow')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
              <Truck size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.gridTitle}>Book Truck</Text>
            <Text style={styles.gridDesc}>Request cargo vehicle</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
              <History size={24} color={COLORS.blue} />
            </View>
            <Text style={styles.gridTitle}>History</Text>
            <Text style={styles.gridDesc}>View completed rides</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('Support')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBg, { backgroundColor: '#FFF7ED' }]}>
              <PhoneCall size={24} color="#EA580C" />
            </View>
            <Text style={styles.gridTitle}>Support</Text>
            <Text style={styles.gridDesc}>24/7 Helpline assistance</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Banner */}
        <View style={styles.safetyBanner}>
          <Text style={styles.safetyBadge}>SAFETY FIRST</Text>
          <Text style={styles.safetyTitle}>Verified Drivers & Vehicles</Text>
          <Text style={styles.safetyDesc}>Every transport partner goes through a rigorous onboarding process to ensure safety.</Text>
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
  container: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subwelcome: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 2,
  },
  logoutButton: {
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  heroDesc: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  heroBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  truckEmoji: {
    fontSize: 72,
    marginRight: -10,
    opacity: 0.9,
  },
  activeSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.foreground,
    marginBottom: SPACING.md,
  },
  activeCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 6,
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  activeTime: {
    fontSize: 12,
    color: COLORS.muted,
  },
  activeStatusText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.foreground,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  routeContainer: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
    paddingLeft: SPACING.md,
    marginLeft: 6,
    marginVertical: SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.foreground,
    marginLeft: 8,
    flex: 1,
  },
  routeLine: {
    height: 12,
  },
  activeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trackLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  gridItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: 4,
    ...SHADOWS.sm,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  gridDesc: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  safetyBanner: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
  },
  safetyBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.foreground,
    marginTop: 4,
  },
  safetyDesc: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: SPACING.xs,
    lineHeight: 16,
  },
});
