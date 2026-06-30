import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Switch, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Alert, 
  RefreshControl 
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { DollarSign, Landmark, Truck, Check, X, Star, Bell, PlusCircle, Compass } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Loader from '../components/Loader';

export default function DashboardScreen({ navigation }: any) {
  const { driver, logout } = useAuth();
  const socket = useSocket();

  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({ completedRides: 0, todayEarnings: 0, totalEarnings: 0 });
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [rideStatus, setRideStatus] = useState<'idle' | 'incoming' | 'active'>('idle');
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDriverData = async () => {
    try {
      // 1. Fetch Earnings
      const earnRes = await apiClient.get('/api/driver/earnings');
      const earnData = earnRes.data;
      setStats({
        completedRides: earnData.completedRides || 0,
        todayEarnings: earnData.earnings?.todayEarnings || 0,
        totalEarnings: earnData.earnings?.totalEarnings || 0,
      });

      // 2. Fetch Profile to get online status
      const profileRes = await apiClient.get('/api/driver/profile');
      setIsOnline(profileRes.data.isOnline);

      // 3. Fetch Active Request
      const requestRes = await apiClient.get('/api/driver/active-request');
      const { booking, rideStatus: status } = requestRes.data;

      if (booking) {
        setActiveBooking(booking);
        if (status === 'incoming') {
          setRideStatus('incoming');
        } else {
          setRideStatus('active');
        }
      } else {
        setActiveBooking(null);
        setRideStatus('idle');
      }

      // 4. Fetch Available Jobs (Job Board)
      const jobsRes = await apiClient.get('/api/driver/jobs');
      setAvailableJobs(jobsRes.data || []);
    } catch (e) {
      console.error('Failed to sync driver stats', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDriverData();
    }, [])
  );

  useEffect(() => {
    if (!socket) return;

    // Refresh dashboard if anything changes
    socket.on('ride_status_update', (data: any) => {
      fetchDriverData();
    });

    socket.on('new_ride_request', (booking: any) => {
      console.log('[Socket] Incoming ride request directly:', booking._id);
      setActiveBooking(booking);
      setRideStatus('incoming');
    });

    socket.on('ride_cancelled', (data: any) => {
      console.log('[Socket] Ride cancelled directly:', data.bookingId);
      setActiveBooking((prev: any) => {
        if (prev && prev._id === data.bookingId) {
          setRideStatus('idle');
          return null;
        }
        return prev;
      });
    });

    return () => {
      socket.off('ride_status_update');
      socket.off('new_ride_request');
      socket.off('ride_cancelled');
    };
  }, [socket]);

  // Toggle availability (Online/Offline)
  const handleToggleOnline = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.put('/api/driver/availability');
      setIsOnline(res.data.isOnline);
      Alert.alert('Status Updated', `You are now ${res.data.isOnline ? 'Online' : 'Offline'}`);
      fetchDriverData();
    } catch (e: any) {
      const errMsg = e.response?.data?.message || e.message || 'Failed to update online availability.';
      Alert.alert('Error', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Accept a booking
  const handleAcceptRide = async () => {
    if (!activeBooking) return;
    try {
      setIsLoading(true);
      const res = await apiClient.post('/api/driver/accept', { bookingId: activeBooking._id });
      Alert.alert('Trip Accepted', 'Proceed to pickup point.');
      setRideStatus('active');
      navigation.navigate('TripDetails', { bookingId: activeBooking._id });
    } catch (err: any) {
      Alert.alert('Acceptance Failed', err.response?.data?.message || 'Someone else might have accepted.');
      fetchDriverData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRide = () => {
    setActiveBooking(null);
    setRideStatus('idle');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.topHeader}>
        <View style={styles.driverInfoRow}>
          <Avatar 
            name={driver?.name || 'Partner'} 
            source={driver?.profileImage}
            size={46} 
            showActiveDot={isOnline}
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.welcomeText}>Partner Portal</Text>
            <Text style={styles.driverName}>{driver?.name || 'Cargex Partner'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <Bell size={20} color={COLORS.primary} />
          {availableJobs.length > 0 && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => { setIsRefreshing(true); fetchDriverData(); }} 
            colors={[COLORS.accent]} 
          />
        }
      >
        {/* Availability Toggle */}
        <Card 
          variant={isOnline ? 'elevated' : 'outlined'} 
          style={[styles.switchCard, isOnline ? styles.onlineCard : styles.offlineCard]}
          padding="md"
        >
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>Availability Status</Text>
            <Text style={styles.switchStatus}>
              {isOnline ? 'ONLINE & ACCEPTING DISPATCHES' : 'OFFLINE (TAP SWITCH TO GO LIVE)'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: COLORS.border, true: '#86EFAC' }}
            thumbColor={isOnline ? COLORS.accent : '#f4f3f4'}
          />
        </Card>

        {/* Stats Grid */}
        <Text style={styles.sectionHeader}>Performance Overview</Text>
        <View style={styles.statsGrid}>
          <Card variant="outlined" style={styles.statCard} padding="md">
            <View style={styles.statIconRow}>
              <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <DollarSign size={20} color={COLORS.accent} />
              </View>
              <View style={styles.ratingLabelRow}>
                <Star size={12} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 2 }} />
                <Text style={styles.ratingText}>4.9</Text>
              </View>
            </View>
            <Text style={styles.statVal}>₹{stats.todayEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </Card>

          <Card variant="outlined" style={styles.statCard} padding="md">
            <View style={styles.statIconRow}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Landmark size={20} color={COLORS.blue} />
              </View>
            </View>
            <Text style={styles.statVal}>₹{stats.totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Wallet Balance</Text>
          </Card>

          <Card variant="outlined" style={[styles.statCard, { width: '100%' }]} padding="md">
            <View style={styles.driverCapacityRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Truck size={20} color="#EA580C" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.capacityTitle}>Completed Dispatches</Text>
                  <Text style={styles.capacityLabel}>{stats.completedRides} successful trips</Text>
                </View>
              </View>
              <View style={styles.goalMeter}>
                <Text style={styles.goalMeterText}>92% Acc.</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Active Trip Banner */}
        {rideStatus === 'active' && activeBooking && (
          <View style={styles.activeTripContainer}>
            <Text style={styles.sectionHeader}>Ongoing Navigation</Text>
            <TouchableOpacity 
              activeOpacity={0.95}
              onPress={() => navigation.navigate('TripDetails', { bookingId: activeBooking._id })}
            >
              <Card variant="elevated" style={styles.activeTripCard} padding="md">
                <View style={styles.activeTripHeader}>
                  <View style={styles.pulseContainer}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.activeTripTitle}>ACTIVE LOGISTICS TRIP</Text>
                  </View>
                  <Badge status="in_progress" />
                </View>
                <Text style={styles.activeTripDesc}>
                  You have an active dispatch order in progress. Tap to open real-time Leaflet tracking directions and verify OTP handshakes.
                </Text>
                <Text style={styles.activeTripRoute}>
                  {activeBooking.pickupLocation?.address.split(',')[0]} → {activeBooking.dropLocation?.address.split(',')[0]}
                </Text>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Job Board Section */}
        {rideStatus !== 'active' && (
          <View style={styles.jobBoardContainer}>
            <Text style={styles.sectionHeader}>Available Dispatches</Text>
            {isLoading ? (
              <Loader variant="shimmer" height={120} />
            ) : availableJobs.length > 0 ? (
              availableJobs.map((job: any) => {
                const amount = job.pricing?.totalFare || job.price?.total || 0;
                return (
                  <Card key={job._id} variant="outlined" style={styles.jobCard} padding="md">
                    <View style={styles.jobCardHeader}>
                      <View style={styles.vehicleCategoryBadge}>
                        <Truck size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.jobVehicleText}>{job.vehicleType} | {job.category}</Text>
                      </View>
                      <Text style={styles.jobPrice}>₹{amount.toLocaleString()}</Text>
                    </View>

                    <View style={styles.jobRoutes}>
                      <Text style={styles.routeText} numberOfLines={1}>📍 {job.pickupLocation?.address}</Text>
                      <View style={styles.verticalBorderLine} />
                      <Text style={styles.routeText} numberOfLines={1}>🏁 {job.dropLocation?.address}</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.acceptBtn}
                      activeOpacity={0.8}
                      onPress={async () => {
                        try {
                          setIsLoading(true);
                          await apiClient.post('/api/driver/accept', { bookingId: job._id });
                          Alert.alert('Trip Accepted', 'Proceed to pickup point.');
                          fetchDriverData();
                          navigation.navigate('TripDetails', { bookingId: job._id });
                        } catch (err: any) {
                          Alert.alert('Acceptance Failed', err.response?.data?.message || 'Someone else might have accepted.');
                          fetchDriverData();
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      <Text style={styles.acceptBtnText}>Accept Dispatch</Text>
                    </TouchableOpacity>
                  </Card>
                );
              })
            ) : (
              <Card variant="solid" style={styles.emptyCard} padding="lg">
                <Compass size={32} color={COLORS.textLight} />
                <Text style={styles.emptyTitle}>Looking for dispatches...</Text>
                <Text style={styles.emptySub}>
                  You are currently online. When users nearby book rides matching your transport vehicle type, they will appear here.
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Incoming dispatch overlay alert */}
        {rideStatus === 'incoming' && activeBooking && (
          <View style={styles.incomingOverlay}>
            <Card variant="elevated" style={styles.incomingCard} padding="md">
              <View style={styles.pulseHeader}>
                <View style={styles.pulseDot} />
                <Text style={styles.pulseHeaderText}>INCOMING RIDE DISPATCH</Text>
              </View>

              <View style={styles.incomingDetails}>
                <Text style={styles.locLabel}>PICKUP</Text>
                <Text style={styles.locVal} numberOfLines={1}>{activeBooking.pickupLocation?.address}</Text>

                <Text style={styles.locLabel}>DROPOFF</Text>
                <Text style={styles.locVal} numberOfLines={1}>{activeBooking.dropLocation?.address}</Text>

                <View style={styles.incomingMeta}>
                  <Text style={styles.metaLabel}>Distance: {activeBooking.distance} km</Text>
                  <Text style={styles.metaPrice}>₹{(activeBooking.pricing?.totalFare || activeBooking.price?.total || 0).toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.overlayButtons}>
                <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleDeclineRide} activeOpacity={0.8}>
                  <X size={18} color={COLORS.error} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={handleAcceptRide} activeOpacity={0.8}>
                  <Check size={18} color={COLORS.white} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: COLORS.white }]}>Accept</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    height: 72,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  scrollContainer: {
    padding: SPACING.md,
    paddingBottom: 110,
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: SPACING.lg,
  },
  onlineCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  offlineCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  switchTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchStatus: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  driverCapacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  capacityLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  goalMeter: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  goalMeterText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.blue,
  },
  activeTripContainer: {
    marginBottom: SPACING.lg,
  },
  activeTripCard: {
    backgroundColor: COLORS.primary,
  },
  activeTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 6,
  },
  activeTripTitle: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeTripDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  activeTripRoute: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  jobBoardContainer: {
    marginBottom: SPACING.md,
  },
  jobCard: {
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  vehicleCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  jobVehicleText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  jobPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.accent,
  },
  jobRoutes: {
    marginBottom: SPACING.md,
    paddingLeft: 4,
  },
  routeText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  verticalBorderLine: {
    height: 12,
    width: 1.5,
    backgroundColor: COLORS.border,
    marginLeft: 7,
    marginVertical: 2,
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  acceptBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    textAlign: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
    lineHeight: 18,
    fontWeight: '500',
  },
  incomingOverlay: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(17,17,17,0.02)',
  },
  incomingCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    ...SHADOWS.lg,
  },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pulseHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  incomingDetails: {
    marginBottom: SPACING.md,
  },
  locLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  locVal: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    marginTop: 2,
  },
  incomingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  metaPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.accent,
  },
  overlayButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
  },
  declineBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
