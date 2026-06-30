import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Users, Truck, Route, DollarSign, LogOut, Activity, ArrowRight } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen({ navigation }: any) {
  const { agency, logout } = useAuth();
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalVehicles: 0,
    totalRevenue: 0,
    activeBookings: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get('/api/agency/dashboard');
      const apiData = res.data.data || res.data;
      setStats({
        totalDrivers: apiData.totalDrivers || 0,
        totalVehicles: apiData.totalVehicles || 0,
        totalRevenue: apiData.revenue || 0,
        activeBookings: apiData.activeTrips || 0,
      });

      // Populate mock recent activities matching website layout
      setActivities([
        { id: '1', title: 'Driver Rajesh completed a trip', time: '2 hours ago', amount: '₹450' },
        { id: '2', title: 'Vehicle MH-12-PQ-4567 added', time: '4 hours ago', amount: null },
        { id: '3', title: 'Driver Amit assigned to order #120', time: 'Yesterday', amount: null },
        { id: '4', title: 'Completed trip payout credited', time: '2 days ago', amount: '₹1,200' },
      ]);
    } catch (err) {
      console.error('Failed to load agency dashboard metrics', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
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
            <Text style={styles.welcome}>Agency Dashboard</Text>
            <Text style={styles.subwelcome}>{agency?.name || 'Owner Portal'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : (
          <View>
            {/* Stats list */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>Total Revenue</Text>
                  <DollarSign size={18} color={COLORS.accent} />
                </View>
                <Text style={styles.statVal}>₹{stats.totalRevenue.toLocaleString()}</Text>
                <Text style={styles.statSub}>Accumulated earnings</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>Active Trips</Text>
                  <Route size={18} color={COLORS.blue} />
                </View>
                <Text style={styles.statVal}>{stats.activeBookings}</Text>
                <Text style={styles.statSub}>In progress now</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>Total Drivers</Text>
                  <Users size={18} color="#EA580C" />
                </View>
                <Text style={styles.statVal}>{stats.totalDrivers}</Text>
                <Text style={styles.statSub}>Onboarded staff</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>Total Vehicles</Text>
                  <Truck size={18} color="#8B5CF6" />
                </View>
                <Text style={styles.statVal}>{stats.totalVehicles}</Text>
                <Text style={styles.statSub}>Registered fleet</Text>
              </View>
            </View>

            {/* Quick navigations */}
            <Text style={styles.sectionHeader}>Quick Controls</Text>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => navigation.navigate('Fleet')}
              >
                <Text style={styles.controlBtnText}>Manage Fleet</Text>
                <ArrowRight size={16} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]}
                onPress={() => navigation.navigate('Bookings')}
              >
                <Text style={[styles.controlBtnText, { color: COLORS.primary }]}>View Orders</Text>
                <ArrowRight size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Recent Activity */}
            <Text style={styles.sectionHeader}>Recent Logs</Text>
            <View style={styles.activityCard}>
              {activities.map((act) => (
                <View key={act.id} style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.activityTitle}>{act.title}</Text>
                    <Text style={styles.activityTime}>{act.time}</Text>
                  </View>
                  {act.amount && (
                    <Text style={styles.activityAmount}>{act.amount}</Text>
                  )}
                </View>
              ))}
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
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
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    marginVertical: SPACING.xs,
  },
  statSub: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    ...SHADOWS.sm,
  },
  controlBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  activityCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
