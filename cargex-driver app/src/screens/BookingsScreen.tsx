import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  SafeAreaView, 
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { ClipboardList, MapPin, ArrowRight, Compass } from 'lucide-react-native';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Header from '../components/Header';

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
      
      if (activeBooking && ['accepted', 'arrived', 'in_progress'].includes(activeBooking.status) && !filtered.some((r: any) => r._id === activeBooking._id)) {
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
    const amount = item.pricing?.totalFare || item.price?.total || 0;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('TripDetails', { bookingId: item._id })}
        activeOpacity={0.9}
      >
        <Card variant="outlined" style={styles.card} padding="md">
          <View style={styles.cardHeader}>
            <Badge status={item.status} />
            <Text style={styles.price}>₹{amount.toLocaleString()}</Text>
          </View>

          {/* Route details */}
          <View style={styles.routeBox}>
            <View style={styles.locationRow}>
              <MapPin size={15} color={COLORS.accent} style={{ marginRight: 8 }} />
              <Text style={styles.address} numberOfLines={1}>Pickup: {item.pickupLocation?.address}</Text>
            </View>
            <View style={styles.line} />
            <View style={styles.locationRow}>
              <MapPin size={15} color={COLORS.red} style={{ marginRight: 8 }} />
              <Text style={styles.address} numberOfLines={1}>Drop: {item.dropLocation?.address}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.infoLabel}>Cargo Category</Text>
              <Text style={styles.infoVal}>{item.vehicleType} | {item.category || 'Goods'}</Text>
            </View>
            <View style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Navigate</Text>
              <ArrowRight size={14} color={COLORS.white} style={{ marginLeft: 4 }} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <Header title="Active Queue" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Syncing active dispatches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Header title="Active Queue" />
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
          <Card variant="solid" style={styles.emptyContainer} padding="lg">
            <ClipboardList size={36} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No active dispatches</Text>
            <Text style={styles.emptySub}>
              When you accept a job request from the dashboard, it will appear here in your active queue.
            </Text>
          </Card>
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
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: COLORS.card,
    marginBottom: SPACING.md,
    borderColor: COLORS.border,
    borderWidth: 1,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
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
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  line: {
    height: 14,
    width: 1.5,
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
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.sm,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    marginTop: SPACING.xl,
  },
  emptyText: {
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
});
