import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, RefreshControl } from 'react-native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Route, MapPin, Truck, Users, Check, X, ShieldAlert } from 'lucide-react-native';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Assign Modal States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const fetchBookingsAndDrivers = async () => {
    try {
      const bookRes = await apiClient.get('/api/agency/bookings');
      setBookings(bookRes.data.data || bookRes.data || []);

      const driverRes = await apiClient.get('/api/agency/drivers');
      setDrivers(driverRes.data.data || driverRes.data || []);
    } catch (e) {
      console.warn('Failed to load agency bookings/drivers', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookingsAndDrivers();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBookingsAndDrivers();
  };

  // Assign Driver
  const handleAssignDriver = async (driverId: string) => {
    if (!selectedBookingId) return;
    setIsLoading(true);
    try {
      await apiClient.post(`/api/agency/bookings/${selectedBookingId}/assign`, { driverId });
      Alert.alert('Driver Assigned', 'The selected driver has been assigned to this cargo order.');
      setShowAssignModal(false);
      setSelectedBookingId(null);
      fetchBookingsAndDrivers();
    } catch (err: any) {
      Alert.alert('Assignment Failed', err.response?.data?.message || 'Could not assign driver.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel Booking
  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await apiClient.post(`/api/agency/bookings/${bookingId}/cancel`);
              Alert.alert('Success', 'Booking has been cancelled.');
              fetchBookingsAndDrivers();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.accent;
      case 'cancelled': return COLORS.red;
      case 'requested': return '#D97706';
      default: return COLORS.blue;
    }
  };

  const renderBookingItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.bookingId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.badge, { borderColor: statusColor, borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <MapPin size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
            <Text style={styles.addressText} numberOfLines={1}>{item.pickupLocation.address}</Text>
          </View>
          <View style={styles.routeRow}>
            <MapPin size={16} color={COLORS.red} style={{ marginRight: 8 }} />
            <Text style={styles.addressText} numberOfLines={1}>{item.dropLocation.address}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Distance: {item.distance} km</Text>
          <Text style={styles.metaText}>Vehicle: {item.vehicleType}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.driverText}>
            Driver: {item.driverId?.fullName || 'Not Assigned'}
          </Text>
          <Text style={styles.price}>
            ₹{item.pricing?.totalFare || item.price?.total || 0}
          </Text>
        </View>

        {/* Actions panel */}
        {item.status === 'requested' && (
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleCancelBooking(item._id)}
            >
              <X size={16} color={COLORS.red} style={{ marginRight: 4 }} />
              <Text style={[styles.actionBtnText, { color: COLORS.red }]}>Cancel Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.assignBtn]}
              onPress={() => {
                setSelectedBookingId(item._id);
                setShowAssignModal(true);
              }}
            >
              <Users size={16} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={[styles.actionBtnText, { color: COLORS.white }]}>Assign Driver</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <ShieldAlert size={48} color={COLORS.muted} />
          <Text style={styles.emptyText}>No bookings on record.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
          }
        />
      )}

      {/* Driver assignation modal overlay */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Fleet Driver</Text>
            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              {drivers.length === 0 ? (
                <Text style={{ textAlign: 'center', color: COLORS.muted }}>No onboarded drivers available.</Text>
              ) : (
                drivers.map((drv) => (
                  <TouchableOpacity
                    key={drv._id}
                    style={styles.driverSelectItem}
                    onPress={() => handleAssignDriver(drv._id)}
                  >
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverAvatarText}>{drv.fullName?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.driverName}>{drv.fullName}</Text>
                      <Text style={styles.driverPhone}>Status: {drv.isOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                    <Check size={18} color={COLORS.accent} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => { setShowAssignModal(false); setSelectedBookingId(null); }}
            >
              <Text style={styles.modalCloseText}>Close Dialog</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
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
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  routeBox: {
    marginBottom: SPACING.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.foreground,
    fontWeight: '500',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },
  driverText: {
    fontSize: 12,
    color: COLORS.blue,
    fontWeight: '700',
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  actionBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  declineBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  assignBtn: {
    backgroundColor: COLORS.primary,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.lg,
    maxHeight: '60%',
    ...SHADOWS.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  driverSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  driverPhone: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  modalCloseText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
