import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Calendar, MapPin, Truck, AlertTriangle } from 'lucide-react-native';

export default function BookingHistoryScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/api/users/bookings');
      setBookings(response.data.bookings || response.data || []);
    } catch (e) {
      console.error('Failed to fetch bookings', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.put(`/api/users/bookings/${bookingId}/cancel`);
              Alert.alert('Success', 'Booking has been cancelled.');
              fetchBookings();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel booking.');
            }
          }
        }
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#ECFDF5', text: COLORS.accent };
      case 'cancelled': return { bg: '#FEF2F2', text: COLORS.red };
      case 'requested': return { bg: '#FFFBEB', text: '#D97706' };
      case 'accepted':
      case 'arrived':
      case 'in_progress':
        return { bg: '#EFF6FF', text: COLORS.blue };
      default:
        return { bg: COLORS.surface, text: COLORS.muted };
    }
  };

  const renderBookingItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusStyle(item.status);
    const dateStr = new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Calendar size={16} color={COLORS.muted} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>{dateStr} at {timeStr}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
            <Text style={styles.addressText} numberOfLines={1}>{item.pickupLocation.address}</Text>
          </View>
          <View style={styles.line} />
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
            <Text style={styles.addressText} numberOfLines={1}>{item.dropLocation.address}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.vehicleRow}>
            <Truck size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.vehicleText}>{item.vehicleType}</Text>
          </View>
          <Text style={styles.priceText}>
            ₹{item.pricing?.totalFare || item.price?.total || 0}
          </Text>
        </View>

        {/* Live track option for active rides */}
        {['accepted', 'arrived', 'in_progress'].includes(item.status) && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('LiveTracking', { bookingId: item._id })}
          >
            <Text style={styles.actionBtnText}>Track Ride Live</Text>
          </TouchableOpacity>
        )}

        {/* Cancel option for requested rides */}
        {item.status === 'requested' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1 }]}
            onPress={() => handleCancelBooking(item._id)}
          >
            <Text style={[styles.actionBtnText, { color: COLORS.red }]}>Cancel Ride Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertTriangle size={48} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptySubtitle}>You haven't requested any rides yet.</Text>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation.navigate('BookingFlow')}
          >
            <Text style={styles.bookBtnText}>Book Your First Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchBookings(); }} colors={[COLORS.accent]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    padding: SPACING.md,
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
    color: COLORS.muted,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  routeContainer: {
    paddingLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  line: {
    width: 2,
    height: 10,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.foreground,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  actionBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.md,
  },
  bookBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
