import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Linking, 
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSocket } from '../contexts/SocketContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Phone, Navigation, Clock, ShieldCheck, ArrowLeft, Key } from 'lucide-react-native';
import Loader from '../components/Loader';
import Badge from '../components/Badge';

export default function LiveTrackingScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const socket = useSocket();
  const webViewRef = useRef<WebView>(null);

  const [booking, setBooking] = useState<any | null>(null);
  const [driverLoc, setDriverLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (driverLoc && webViewRef.current) {
      const js = `if (typeof window.updateDriverLocation === 'function') { window.updateDriverLocation(${driverLoc.latitude}, ${driverLoc.longitude}); }; true;`;
      webViewRef.current.injectJavaScript(js);
    }
  }, [driverLoc]);

  // Real randomly generated OTPs from DB schema
  const pickupOtp = booking?.pickupOtp || '----';
  const dropOtp = booking?.dropOtp || '----';

  const fetchBookingDetails = async () => {
    try {
      const res = await apiClient.get('/api/users/bookings');
      const list = res.data.bookings || res.data || [];
      const match = list.find((b: any) => b._id === bookingId);
      if (match) {
        setBooking(match);
        if (match.pickupLocation && match.dropLocation) {
          fetchRouteLine(match.pickupLocation, match.dropLocation);
        }
      }
    } catch (e) {
      console.error('Failed to fetch tracking booking details', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRouteLine = async (pickup: any, drop: any) => {
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
      console.warn('OSRM routing fetch failed', err);
    }
  };

  useEffect(() => {
    fetchBookingDetails();

    if (!socket) return;

    socket.emit('join_booking_room', bookingId);

    socket.on('live_location', (data: any) => {
      setDriverLoc({
        latitude: data.lat,
        longitude: data.lng
      });
    });

    socket.on('ride_status_update', (data: any) => {
      if (data.bookingId === bookingId) {
        setBooking((prev: any) => {
          if (!prev) return null;
          const updated = { ...prev, status: data.status };
          if (data.driver) updated.driverId = data.driver;
          return updated;
        });

        if (data.status === 'completed') {
          Alert.alert('Trip Completed!', 'Your ride is complete. Thank you for booking with Cargex!', [
            { text: 'Okay', onPress: () => navigation.navigate('MainTabs') }
          ]);
        }
      }
    });

    return () => {
      socket.off('live_location');
      socket.off('ride_status_update');
    };
  }, [socket, bookingId]);

  const hasValidCoords = booking && 
    booking.pickupLocation && 
    typeof booking.pickupLocation.latitude === 'number' && 
    typeof booking.pickupLocation.longitude === 'number' &&
    !isNaN(booking.pickupLocation.latitude) &&
    !isNaN(booking.pickupLocation.longitude);

  if (isLoading || !booking || !hasValidCoords) {
    return (
      <View style={styles.center}>
        <Loader />
        <Text style={styles.loadingText}>Connecting to live dispatch...</Text>
      </View>
    );
  }

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
        .driver-div-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
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

        L.marker([${booking.pickupLocation?.latitude || 0}, ${booking.pickupLocation?.longitude || 0}], { icon: greenIcon }).addTo(map).bindPopup('Pickup Point');
        L.marker([${booking.dropLocation?.latitude || 0}, ${booking.dropLocation?.longitude || 0}], { icon: redIcon }).addTo(map).bindPopup('Dropoff Point');

        var routeCoords = ${JSON.stringify(routeCoords)};
        if (routeCoords && routeCoords.length > 0) {
          var latlngs = routeCoords.map(function(c) { return [c.latitude, c.longitude]; });
          L.polyline(latlngs, { color: '#22C55E', weight: 5 }).addTo(map);
          var bounds = L.latLngBounds(latlngs);
          map.fitBounds(bounds, { padding: [30, 30] });
        }

        var driverMarker = null;
        window.updateDriverLocation = function(lat, lng) {
          if (!driverMarker) {
            var truckIcon = L.divIcon({
              html: '<div style="font-size: 28px; background: white; border-radius: 20px; border: 2px solid #000; padding: 4px; display: flex; align-items: center; justify-content: center;">🚚</div>',
              iconSize: [36, 36],
              className: 'driver-div-icon'
            });
            driverMarker = L.marker([lat, lng], { icon: truckIcon }).addTo(map);
          } else {
            driverMarker.setLatLng([lat, lng]);
          }
        };

        ${driverLoc ? `window.updateDriverLocation(${driverLoc.latitude}, ${driverLoc.longitude});` : ''}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Floating Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('MainTabs')}
        activeOpacity={0.8}
      >
        <ArrowLeft size={20} color={COLORS.primary} />
      </TouchableOpacity>

      {/* WebView OSM */}
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: htmlContent }}
        originWhitelist={['*']}
      />

      {/* Floating Status Badge Overlay */}
      <View style={styles.statusFloat}>
        <Clock size={16} color={COLORS.secondary} style={{ marginRight: 6 }} />
        <Text style={styles.statusFloatText}>
          STATUS: {(booking.status || 'requested').toUpperCase()}
        </Text>
      </View>

      {/* Bottom Info Sheet */}
      <View style={styles.bottomCard}>
        {booking.driverId ? (
          <View style={styles.driverRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {booking.driverId.fullName?.charAt(0) || 'D'}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.driverName}>{booking.driverId.fullName}</Text>
              <Text style={styles.vehicleName}>
                {booking.vehicleType} • {booking.driverId.phone}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${booking.driverId.phone}`)}
              activeOpacity={0.7}
            >
              <Phone size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.searchingRow}>
            <ActivityIndicator size="small" color={COLORS.secondary} style={{ marginRight: 10 }} />
            <Text style={styles.searchingText}>Looking for a transport partner matching requirements...</Text>
          </View>
        )}

        {/* OTP panel (Always Visible) */}
        <View style={styles.otpRow}>
          <View style={styles.otpBox}>
            <View style={styles.otpLabelRow}>
              <Key size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.otpLabel}>PICKUP OTP</Text>
            </View>
            <Text style={styles.otpVal}>{pickupOtp}</Text>
          </View>
          <View style={[styles.otpBox, { borderLeftWidth: 1, borderLeftColor: COLORS.border }]}>
            <View style={styles.otpLabelRow}>
              <Key size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.otpLabel}>DROP OTP</Text>
            </View>
            <Text style={styles.otpVal}>{dropOtp}</Text>
          </View>
        </View>

        <Text style={styles.otpHint}>
          Share OTP codes with your driver at pickup and drop locations to verify cargo security.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 44,
    left: SPACING.lg,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  statusFloat: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 44,
    right: SPACING.lg,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...SHADOWS.md,
  },
  statusFloatText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderTopWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  vehicleName: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: '#F9FAFB',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchingText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    flex: 1,
  },
  otpRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  otpBox: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  otpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  otpLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  otpVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  otpHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
    paddingHorizontal: SPACING.xs,
  },
});
