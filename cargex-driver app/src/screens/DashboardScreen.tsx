import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Switch, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { DollarSign, Landmark, Truck, RefreshCw, LogOut, Check, X } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

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

    socket.on('new_ride_request', (data: any) => {
      fetchDriverData();
    });

    socket.on('ride_cancelled', (data: any) => {
      fetchDriverData();
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
    // Just close incoming request overlay client-side
    setActiveBooking(null);
    setRideStatus('idle');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchDriverData(); }} colors={[COLORS.accent]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Driver portal</Text>
            <Text style={styles.subwelcome}>{driver?.name || 'Partner'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Online / Offline switch */}
        <View style={[styles.switchCard, isOnline ? styles.onlineCard : styles.offlineCard]}>
          <View>
            <Text style={styles.switchTitle}>Availability</Text>
            <Text style={styles.switchStatus}>You are currently {isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#767577', true: '#86EFAC' }}
            thumbColor={isOnline ? COLORS.accent : '#f4f3f4'}
          />
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionHeader}>Performance Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <DollarSign size={24} color={COLORS.accent} />
            <Text style={styles.statVal}>₹{stats.todayEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>

          <View style={styles.statCard}>
            <Landmark size={24} color={COLORS.blue} />
            <Text style={styles.statVal}>₹{stats.totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>

          <View style={styles.statCard}>
            <Truck size={24} color="#EA580C" />
            <Text style={styles.statVal}>{stats.completedRides}</Text>
            <Text style={styles.statLabel}>Completed Rides</Text>
          </View>
        </View>

        {/* Active Trip Navigation Card */}
        {rideStatus === 'active' && activeBooking && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Active Trip</Text>
            <TouchableOpacity
              style={styles.activeCard}
              onPress={() => navigation.navigate('TripDetails', { bookingId: activeBooking._id })}
            >
              <Text style={styles.activeTitle}>Ongoing Logistics Order</Text>
              <Text style={styles.activeSub}>Tap to view pickup guidelines and complete routing map.</Text>
              <Text style={styles.activeRouteText}>
                {activeBooking.pickupLocation?.address.split(',')[0]} → {activeBooking.dropLocation?.address.split(',')[0]}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Job Board */}
        {rideStatus !== 'active' && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Available Dispatches</Text>
            {availableJobs.length > 0 ? (
              availableJobs.map((job: any) => {
                const amount = job.pricing?.totalFare || job.price?.total || 0;
                return (
                  <View key={job._id} style={styles.jobCard}>
                    <View style={styles.jobCardHeader}>
                      <Text style={styles.jobVehicle}>{job.vehicleType} | {job.category || 'Goods'}</Text>
                      <Text style={styles.jobPrice}>₹{amount.toLocaleString()}</Text>
                    </View>
                    
                    <View style={styles.jobRoute}>
                      <Text style={styles.jobRouteText} numberOfLines={1}>📍 {job.pickupLocation?.address}</Text>
                      <Text style={styles.jobRouteText} numberOfLines={1}>🏁 {job.dropLocation?.address}</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.jobAcceptBtn}
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
                      <Text style={styles.jobAcceptBtnText}>Accept Dispatch</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyJobs}>
                <Text style={styles.emptyJobsText}>No public dispatches currently available.</Text>
                <Text style={styles.emptyJobsSub}>You will be notified via socket in real-time when new bookings are placed.</Text>
              </View>
            )}
          </View>
        )}

        {/* Incoming requests overlay */}
        {rideStatus === 'incoming' && activeBooking && (
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <View style={styles.pulseContainer}>
                <View style={styles.pulseDot} />
                <Text style={styles.alertHeader}>INCOMING DISPATCH REQUEST</Text>
              </View>

              <Text style={styles.alertRouteTitle}>Pickup Location</Text>
              <Text style={styles.alertRouteVal} numberOfLines={2}>{activeBooking.pickupLocation?.address}</Text>

              <Text style={styles.alertRouteTitle}>Dropoff Location</Text>
              <Text style={styles.alertRouteVal} numberOfLines={2}>{activeBooking.dropLocation?.address}</Text>

              <View style={styles.alertMetaRow}>
                <Text style={styles.alertMetaText}>Distance: {activeBooking.distance} km</Text>
                <Text style={styles.alertMetaPrice}>Payout: ₹{activeBooking.pricing?.totalFare || activeBooking.price?.total || 0}</Text>
              </View>

              <View style={styles.alertBtnRow}>
                <TouchableOpacity style={[styles.alertBtn, styles.declineBtn]} onPress={handleDeclineRide}>
                  <X size={20} color={COLORS.red} style={{ marginRight: 6 }} />
                  <Text style={[styles.alertBtnText, { color: COLORS.red }]}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.alertBtn, styles.acceptBtn]} onPress={handleAcceptRide}>
                  <Check size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={[styles.alertBtnText, { color: COLORS.white }]}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  jobCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobVehicle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  jobPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accent,
  },
  jobRoute: {
    marginBottom: 12,
  },
  jobRouteText: {
    fontSize: 12,
    color: COLORS.muted,
    marginVertical: 2,
  },
  jobAcceptBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  jobAcceptBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyJobs: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyJobsText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.foreground,
    textAlign: 'center',
  },
  emptyJobsSub: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  container: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  welcome: {
    fontSize: 14,
    color: COLORS.muted,
  },
  subwelcome: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  logoutBtn: {
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginVertical: SPACING.lg,
    borderWidth: 1,
  },
  onlineCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  offlineCard: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.border,
  },
  switchTitle: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
  },
  switchStatus: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.foreground,
    marginVertical: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },
  activeCard: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.md,
  },
  activeTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  activeSub: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 4,
  },
  activeRouteText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  alertOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.md,
    borderRadius: 16,
    marginTop: 20,
  },
  alertCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    marginRight: 8,
  },
  alertHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  alertRouteTitle: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  alertRouteVal: {
    fontSize: 14,
    color: COLORS.foreground,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  alertMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  alertMetaText: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '600',
  },
  alertMetaPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.accent,
  },
  alertBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  declineBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
  },
  alertBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
