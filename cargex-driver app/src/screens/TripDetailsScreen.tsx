import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSocket } from '../contexts/SocketContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Phone, MapPin, Check, Key } from 'lucide-react-native';

export default function TripDetailsScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const socket = useSocket();

  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);

  // OTP Validation States
  const [otpInput, setOtpInput] = useState('');
  const [showOtpPrompt, setShowOtpPrompt] = useState(false);

  // Computed Expected OTPs
  const expectedPickupOtp = bookingId ? bookingId.slice(-4).toUpperCase() : '1234';
  const expectedDropOtp = bookingId ? bookingId.slice(0, 4).toUpperCase() : '5678';

  const fetchBooking = async () => {
    try {
      const res = await apiClient.get('/api/driver/active-request');
      if (res.data && res.data.booking) {
        setBooking(res.data.booking);
        if (res.data.booking.pickupLocation && res.data.booking.dropLocation) {
          fetchOSRMRoute(res.data.booking.pickupLocation, res.data.booking.dropLocation);
        }
      } else {
        // Fallback: fetch from history
        const historyRes = await apiClient.get('/api/driver/rides');
        const match = historyRes.data.rides?.find((r: any) => r._id === bookingId);
        if (match) {
          setBooking(match);
        }
      }
    } catch (e) {
      console.error('Trip details fetch error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOSRMRoute = async (pickup: any, drop: any) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pickup.longitude},${pickup.latitude};${drop.longitude},${drop.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => ({
          latitude: c[1],
          longitude: c[0]
        }));
        setRouteCoords(coords);
      }
    } catch (err) {
      console.warn('OSRM trip route fetch failed', err);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Simulate periodic location updates to server while on active ride
  useEffect(() => {
    if (!booking || !['accepted', 'in_progress'].includes(booking.status)) return;

    let tick = 0;
    const interval = setInterval(async () => {
      // Interpolate mock driver coordinates between pickup and drop points
      const pickupLat = booking.pickupLocation.latitude;
      const pickupLng = booking.pickupLocation.longitude;
      const dropLat = booking.dropLocation.latitude;
      const dropLng = booking.dropLocation.longitude;

      const steps = 60; // 5 mins total simulated navigation
      const progress = Math.min(tick / steps, 1);
      const currentLat = pickupLat + (dropLat - pickupLat) * progress;
      const currentLng = pickupLng + (dropLng - pickupLng) * progress;

      // Stream to Socket server
      if (socket) {
        socket.emit('driver_location_update', {
          driverId: booking.driverId?._id || booking.driverId,
          lat: currentLat,
          lng: currentLng,
          bookingId: booking._id
        });
      }

      // Also update backend DB
      try {
        await apiClient.post('/api/driver/location', {
          lat: currentLat,
          lng: currentLng,
          bookingId: booking._id
        });
      } catch (err) {
        console.warn('Silent location upload failed', err);
      }

      tick += 1;
    }, 5000);

    return () => clearInterval(interval);
  }, [booking, socket]);

  // Handle status step triggers
  const handleProgressTrip = async () => {
    if (!booking) return;

    const currentStatus = booking.status;

    if (currentStatus === 'accepted') {
      // Next: Start trip. Prompt OTP first
      setShowOtpPrompt(true);
    } else if (currentStatus === 'in_progress') {
      // Next: Complete trip. Prompt OTP first
      setShowOtpPrompt(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (!booking) return;

    const currentStatus = booking.status;
    const inputClean = otpInput.trim().toUpperCase();

    if (currentStatus === 'accepted') {
      if (inputClean === expectedPickupOtp) {
        // Correct OTP: Start trip
        try {
          setIsLoading(true);
          const res = await apiClient.post('/api/driver/start', { bookingId: booking._id });
          setBooking(res.data);
          Alert.alert('Trip Started!', 'Cargo loaded. Drive safely to destination.');
          setShowOtpPrompt(false);
          setOtpInput('');
        } catch (e) {
          Alert.alert('Error', 'Failed to start trip on server.');
        } finally {
          setIsLoading(false);
        }
      } else {
        Alert.alert('Invalid OTP', 'The pickup OTP does not match the customer verification code.');
      }
    } else if (currentStatus === 'in_progress') {
      if (inputClean === expectedDropOtp) {
        // Correct OTP: Complete trip
        try {
          setIsLoading(true);
          const res = await apiClient.post('/api/driver/complete', { bookingId: booking._id });
          setBooking(res.data);
          Alert.alert('Trip Completed!', 'Earnings have been credited to your wallet.', [
            { text: 'Back to Dashboard', onPress: () => navigation.navigate('Home') }
          ]);
          setShowOtpPrompt(false);
          setOtpInput('');
        } catch (e) {
          Alert.alert('Error', 'Failed to complete trip on server.');
        } finally {
          setIsLoading(false);
        }
      } else {
        Alert.alert('Invalid OTP', 'The drop-off OTP does not match the customer verification code.');
      }
    }
  };

  const hasValidCoords = booking && 
    booking.pickupLocation && 
    typeof booking.pickupLocation.latitude === 'number' && 
    typeof booking.pickupLocation.longitude === 'number' &&
    !isNaN(booking.pickupLocation.latitude) &&
    !isNaN(booking.pickupLocation.longitude);

  if (isLoading || !booking || !hasValidCoords) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Syncing trip parameters...</Text>
      </SafeAreaView>
    );
  }

  const isCompleted = booking.status === 'completed';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f0f0f0; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${booking.pickupLocation?.latitude || 0}, ${booking.pickupLocation?.longitude || 0}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var greenIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        var redIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        L.marker([${booking.pickupLocation?.latitude || 0}, ${booking.pickupLocation?.longitude || 0}], { icon: greenIcon }).addTo(map).bindPopup('Pickup');
        L.marker([${booking.dropLocation?.latitude || 0}, ${booking.dropLocation?.longitude || 0}], { icon: redIcon }).addTo(map).bindPopup('Dropoff');

        var routeCoords = ${JSON.stringify(routeCoords)};
        if (routeCoords && routeCoords.length > 0) {
          var latlngs = routeCoords.map(function(c) { return [c.latitude, c.longitude]; });
          L.polyline(latlngs, { color: '#0052cc', weight: 5 }).addTo(map);
          var bounds = L.latLngBounds(latlngs);
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safe}>
      {/* WebView OSM */}
      <WebView
        style={styles.map}
        source={{ html: htmlContent }}
        originWhitelist={['*']}
      />

      {/* OTP validation modal/input area */}
      {showOtpPrompt && (
        <View style={styles.otpPrompt}>
          <View style={styles.otpHeader}>
            <Key size={18} color={COLORS.accent} style={{ marginRight: 6 }} />
            <Text style={styles.otpTitle}>
              Enter {booking.status === 'accepted' ? 'PICKUP' : 'DROP'} OTP
            </Text>
          </View>
          <TextInput
            style={styles.otpInput}
            placeholder="Enter 4-digit code"
            placeholderTextColor={COLORS.muted}
            value={otpInput}
            onChangeText={setOtpInput}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
          />
          <View style={styles.otpBtnRow}>
            <TouchableOpacity style={styles.otpCancel} onPress={() => { setShowOtpPrompt(false); setOtpInput(''); }}>
              <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.otpVerify} onPress={handleVerifyOtp}>
              <Text style={{ color: COLORS.white, fontWeight: '700' }}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Info Sheet */}
      <View style={styles.sheet}>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {booking.userId?.fullName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.customerName}>
              {booking.userId?.fullName || 'Cargex Customer'}
            </Text>
            <Text style={styles.customerPhone}>
              Category: {booking.category} | {booking.subcategory}
            </Text>
          </View>
          {booking.userId?.phone && (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${booking.userId.phone}`)}
            >
              <Phone size={18} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.routeDetails}>
          <View style={styles.routeRow}>
            <MapPin size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
            <Text style={styles.addressText} numberOfLines={1}>
              {booking.pickupLocation.address}
            </Text>
          </View>
          <View style={styles.routeRow}>
            <MapPin size={16} color={COLORS.red} style={{ marginRight: 8 }} />
            <Text style={styles.addressText} numberOfLines={1}>
              {booking.dropLocation.address}
            </Text>
          </View>
        </View>

        {!isCompleted && !showOtpPrompt && (
          <TouchableOpacity
            style={styles.progressBtn}
            onPress={handleProgressTrip}
          >
            <Text style={styles.progressBtnText}>
              {booking.status === 'accepted' ? 'START TRIP (VERIFY OTP)' : 'COMPLETE TRIP (VERIFY OTP)'}
            </Text>
          </TouchableOpacity>
        )}

        {isCompleted && (
          <TouchableOpacity
            style={[styles.progressBtn, { backgroundColor: COLORS.muted }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.progressBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginTop: 8,
    color: COLORS.muted,
  },
  map: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: COLORS.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.muted,
    flex: 1,
  },
  progressBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  progressBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  otpPrompt: {
    position: 'absolute',
    bottom: 240,
    left: 20,
    right: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.md,
    zIndex: 999,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  otpTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  otpInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  otpBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  otpCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  otpVerify: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
