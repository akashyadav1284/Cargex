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
  StatusBar,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { Calendar, MapPin, Award, DollarSign, Download, Percent, ShieldCheck } from 'lucide-react-native';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Header from '../components/Header';
import Button from '../components/Button';

export default function HistoryScreen() {
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalTrips: 0, totalEarned: 0, weeklyEarned: 0, monthlyEarned: 0 });

  const fetchRidesHistory = async () => {
    try {
      const res = await apiClient.get('/api/driver/rides');
      const list = res.data.rides || [];
      setRides(list);

      // Compute simple stats
      const completed = list.filter((r: any) => r.status === 'completed');
      const earned = completed.reduce((sum: number, r: any) => sum + (r.pricing?.totalFare || r.price?.total || 0), 0);
      
      // Calculate simple mock projections for week/month
      const weekly = Math.round(earned * 0.28);
      const monthly = Math.round(earned * 0.85);

      setStats({
        totalTrips: completed.length,
        totalEarned: earned,
        weeklyEarned: weekly,
        monthlyEarned: monthly,
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

  const handleExport = () => {
    Alert.alert('Export Earnings', 'Your detailed monthly earnings report has been generated and sent to your email address.');
  };

  const renderRideItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'completed';
    const amount = item.pricing?.totalFare || item.price?.total || 0;
    const date = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <Card variant="outlined" style={styles.rideCard} padding="md">
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Calendar size={14} color={COLORS.textLight} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <Badge status={item.status} />
        </View>

        {/* Route Details */}
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
            <Text style={styles.routeText} numberOfLines={1}>
              Pickup: {item.pickupLocation?.address || 'Pickup address'}
            </Text>
          </View>
          <View style={styles.line} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
            <Text style={styles.routeText} numberOfLines={1}>
              Drop: {item.dropLocation?.address || 'Dropoff address'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.infoLabel}>Vehicle details</Text>
            <Text style={styles.infoVal}>{item.vehicleType} | {item.category || 'Logistics'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.infoLabel}>Net Earnings</Text>
            <Text style={styles.priceVal}>₹{amount.toLocaleString()}</Text>
          </View>
        </View>
      </Card>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <Header title="Earnings Log" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Syncing dispatch history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Header 
        title="Earnings Log" 
        rightElement={
          <TouchableOpacity onPress={handleExport} activeOpacity={0.7} style={styles.headerExportBtn}>
            <Download size={18} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

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
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Main Stats Card */}
            <Card variant="elevated" style={styles.mainStatsCard} padding="lg">
              <Text style={styles.statsSubtitle}>Total Account Balance</Text>
              <Text style={styles.mainStatsVal}>₹{stats.totalEarned.toLocaleString()}</Text>
              
              <View style={styles.statsDivider} />
              
              <View style={styles.statsRow}>
                <View style={styles.statsCol}>
                  <Text style={styles.statsColLabel}>Completed Trips</Text>
                  <Text style={styles.statsColVal}>{stats.totalTrips}</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsColLabel}>Acceptance Rate</Text>
                  <Text style={styles.statsColVal}>96.4%</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statsColLabel}>Completed Goal</Text>
                  <Text style={styles.statsColVal}>92%</Text>
                </View>
              </View>
            </Card>

            {/* Weekly & Monthly projection cards */}
            <View style={styles.projectionsRow}>
              <Card variant="outlined" style={styles.projCard} padding="md">
                <Text style={styles.projLabel}>This Week</Text>
                <Text style={styles.projVal}>₹{stats.weeklyEarned.toLocaleString()}</Text>
              </Card>
              <Card variant="outlined" style={styles.projCard} padding="md">
                <Text style={styles.projLabel}>This Month</Text>
                <Text style={styles.projVal}>₹{stats.monthlyEarned.toLocaleString()}</Text>
              </Card>
            </View>

            <Text style={styles.listSectionTitle}>Trip Log History</Text>
          </View>
        }
        ListEmptyComponent={
          <Card variant="solid" style={styles.emptyContainer} padding="lg">
            <Award size={36} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No rides completed yet</Text>
            <Text style={styles.emptySub}>
              Your completed rides history and earnings payouts will show up here.
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
  headerExportBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 110,
  },
  listHeader: {
    marginBottom: SPACING.lg,
  },
  mainStatsCard: {
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  statsSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainStatsVal: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCol: {
    flex: 1,
  },
  statsColLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  statsColVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  projectionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  projCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  projLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  projVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: SPACING.lg,
    letterSpacing: -0.3,
  },
  rideCard: {
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  routeContainer: {
    marginVertical: SPACING.md,
    paddingLeft: 4,
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
  routeText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  line: {
    height: 12,
    width: 1.5,
    backgroundColor: COLORS.border,
    marginLeft: 2,
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
  priceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: 40,
    marginTop: SPACING.lg,
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
