import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Calendar, MapPin, Award, DollarSign } from 'lucide-react-native';

export default function HistoryScreen() {
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalTrips: 0, totalEarned: 0 });

  const fetchRidesHistory = async () => {
    try {
      const res = await apiClient.get('/api/driver/rides');
      const list = res.data.rides || [];
      setRides(list);

      // Compute simple stats
      const completed = list.filter((r: any) => r.status === 'completed');
      const earned = completed.reduce((sum: number, r: any) => sum + (r.pricing?.totalFare || r.price?.total || 0), 0);
      setStats({
        totalTrips: completed.length,
        totalEarned: earned
      });
    } catch (e) {
      console.error('Failed to load driver rides history', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRidesHistory();
    }, [])
  );

  const renderRideItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'completed';
    const amount = item.pricing?.totalFare || item.price?.total || 0;
    const date = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Calendar size={14} color={COLORS.muted} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={[styles.statusTag, isCompleted ? styles.statusCompleted : styles.statusCancelled]}>
            <Text style={[styles.statusText, isCompleted ? styles.statusCompletedText : styles.statusCancelledText]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.pickupLocation?.address || 'Pickup address'}
            </Text>
          </View>
          <View style={[styles.line, { height: 16 }]} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.dropLocation?.address || 'Dropoff address'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.label}>Vehicle & Category</Text>
            <Text style={styles.val}>{item.vehicleType} | {item.category || 'Logistics'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Earnings</Text>
            <Text style={styles.priceVal}>₹{amount.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading dispatch records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>View your completed dispatches and accumulated payouts.</Text>
      </View>

      {/* Summary Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Award size={20} color={COLORS.accent} />
          <Text style={styles.metricVal}>{stats.totalTrips}</Text>
          <Text style={styles.metricLabel}>Total Dispatches</Text>
        </View>
        <View style={styles.metricBox}>
          <DollarSign size={20} color={COLORS.blue} />
          <Text style={styles.metricVal}>₹{stats.totalEarned.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Revenue Cleared</Text>
        </View>
      </View>

      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchRidesHistory();
            }}
            colors={[COLORS.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No trip records found.</Text>
            <Text style={styles.emptySub}>Set your availability to online and accept dispatches to start earning.</Text>
          </View>
        }
      />
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
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.foreground,
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  statusTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#DEF7EC',
  },
  statusCancelled: {
    backgroundColor: '#FDE8E8',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusCompletedText: {
    color: '#03543F',
  },
  statusCancelledText: {
    color: '#9B1C1C',
  },
  routeContainer: {
    paddingLeft: 6,
    marginBottom: SPACING.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  line: {
    width: 1,
    backgroundColor: COLORS.border,
    marginLeft: 2,
    marginVertical: 2,
  },
  routeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.foreground,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  label: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },
  val: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.foreground,
    marginTop: 2,
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.accent,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: SPACING.xl,
  },
});
