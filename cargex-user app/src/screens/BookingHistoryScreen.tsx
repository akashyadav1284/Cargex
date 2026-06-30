import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  StatusBar
} from 'react-native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Calendar, MapPin, Truck, Trash2, PackageOpen } from 'lucide-react-native';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import Button from '../components/Button';

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

  const renderBookingItem = ({ item }: { item: any }) => {
    const dateStr = new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <Card variant="outlined" style={styles.historyCard} padding="none">
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Calendar size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>{dateStr} • {timeStr}</Text>
          </View>
          <Badge label={item.status} status={item.status} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={styles.greenDot} />
              <Text style={styles.addressText} numberOfLines={1}>{item.pickupLocation.address}</Text>
            </View>
            <View style={styles.verticalLine} />
            <View style={styles.locationRow}>
              <View style={styles.redDot} />
              <Text style={styles.addressText} numberOfLines={1}>{item.dropLocation.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.vehicleInfoRow}>
            <View style={styles.vehicleIconBadge}>
              <Text style={styles.vehicleIcon}>🚛</Text>
            </View>
            <Text style={styles.vehicleName}>{item.vehicleType}</Text>
          </View>
          
          <Text style={styles.fareCost}>
            ₹{(item.pricing?.totalFare || item.price?.total || 0).toLocaleString()}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Live track option for active rides */}
          {['accepted', 'arrived', 'in_progress'].includes(item.status) && (
            <Button
              label="Track Shipment"
              onPress={() => navigation.navigate('LiveTracking', { bookingId: item._id })}
              style={styles.actionBtn}
            />
          )}

          {/* Cancel option for requested rides */}
          {item.status === 'requested' && (
            <Button
              label="Cancel Request"
              onPress={() => handleCancelBooking(item._id)}
              variant="outline"
              icon={<Trash2 size={16} color={COLORS.error} style={{ marginRight: 4 }} />}
              style={styles.cancelBtn}
              labelStyle={styles.cancelBtnText}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {isLoading ? (
        <Loader style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <PackageOpen size={64} color={COLORS.secondary} />
          </View>
          <Text style={styles.emptyTitle}>No Shipments Yet</Text>
          <Text style={styles.emptySubtitle}>You haven't requested any logistics deliveries yet.</Text>
          <Button
            label="Book Your First Ride"
            onPress={() => navigation.navigate('BookTab')}
            style={styles.bookBtn}
          />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchBookings(); }} colors={[COLORS.secondary]} />
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 110,
  },
  historyCard: {
    marginVertical: 6,
    backgroundColor: COLORS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  cardBody: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  locationContainer: {
    paddingLeft: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  verticalLine: {
    width: 1.5,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 10,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.xs,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  vehicleIcon: {
    fontSize: 18,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  fareCost: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  actionsRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  actionBtn: {
    height: 44,
  },
  cancelBtn: {
    height: 44,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    color: COLORS.error,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  bookBtn: {
    width: '100%',
  },
});
