import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { ClipboardList, MapPin, ArrowRight, Clock } from 'lucide-react-native';

export default function BookingsScreen({ navigation }: any) {
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActiveRides = async () => {
    try {
      // Fetch rides history and filter by active statuses
      const res = await apiClient.get('/api/driver/rides');
      const list = res.data.rides || [];
      const filtered = list.filter((r: any) => ['accepted', 'arrived', 'in_progress'].includes(r.status));
      
      // Also query active-request just in case
      const activeRes = await apiClient.get('/api/driver/active-request');
      const activeBooking = activeRes.data.booking;
      
      if (activeBooking && !filtered.some((r: any) => r._id === activeBooking._id)) {
        filtered.unshift(activeBooking);
      }

      setActiveRides(filtered);
    } catch (e) {
      console.error('Failed to load active dispatches', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveRides();
    }, [])
  );

  const renderActiveItem = ({ item }: { item: any }) => {
    const isProgress = item.status === 'in_progress';
    const amount = item.pricing?.totalFare || item.price?.total || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TripDetails', { bookingId: item._id })}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, isProgress ? styles.badgeProgress : styles.badgeAccepted]}>
              <Text style={[styles.badgeText, isProgress ? styles.badgeTextProgress : styles.badgeTextAccepted]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.price}>₹{amount.toLocaleString()}</Text>
        </View>

        {/* Route Row */}
        <View style={styles.routeBox}>
          <View style={styles.locationRow}>
            <MapPin size={15} color={COLORS.accent} style={{ marginRight: 8 }} />
            <Text style={styles.address} numberOfLines={1}>{item.pickupLocation?.address}</Text>
          </View>
          <View style={styles.line} />
          <View style={styles.locationRow}>
            <MapPin size={15} color={COLORS.red} style={{ marginRight: 8 }} />
            <Text style={styles.address} numberOfLines={1}>{item.dropLocation?.address}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.infoLabel}>Cargo Detail</Text>
            <Text style={styles.infoVal}>{item.vehicleType} | {item.category || 'Goods'}</Text>
          </View>
          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Navigate</Text>
            <ArrowRight size={14} color={COLORS.white} style={{ marginLeft: 4 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Syncing active dispatches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Queue</Text>
        <Text style={styles.subtitle}>Manage accepted orders, pickups, and in-progress navigation.</Text>
      </View>

      <FlatList
        data={activeRides}
        renderItem={renderActiveItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchActiveRides();
            }}
            colors={[COLORS.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardList size={40} color={COLORS.muted} />
            <Text style={styles.emptyText}>No active dispatches.</Text>
            <Text style={styles.emptySub}>When you accept a job request from the dashboard, it will appear here in your active queue.</Text>
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
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeAccepted: {
    backgroundColor: '#E0F2FE',
  },
  badgeProgress: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextAccepted: {
    color: '#0369A1',
  },
  badgeTextProgress: {
    color: '#B45309',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
  },
  routeBox: {
    marginVertical: SPACING.md,
    paddingLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 13,
    color: COLORS.foreground,
    fontWeight: '600',
    flex: 1,
  },
  line: {
    height: 14,
    width: 1,
    backgroundColor: COLORS.border,
    marginLeft: 7,
    marginVertical: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.foreground,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    ...SHADOWS.sm,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.foreground,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: SPACING.xl,
    lineHeight: 18,
  },
});
