import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import * as Location from 'expo-location';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { MapPin, ArrowRight, ArrowLeft, Check, Info } from 'lucide-react-native';

const STATIC_CATEGORIES = [
  "Construction Material",
  "Business / Commercial",
  "Household Goods",
  "Personal Delivery",
  "Heavy Equipment Transport",
  "Vehicle Transport",
  "Food & Agriculture"
];

export default function BookingFlowScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<string[]>(STATIC_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cargoTypes, setCargoTypes] = useState<any[]>([]);
  const [selectedCargo, setSelectedCargo] = useState<any>(null);
  const [loadType, setLoadType] = useState('small'); // small, medium, heavy

  // Address Geocoding States
  const [pickupText, setPickupText] = useState('');
  const [pickupLoc, setPickupLoc] = useState<any>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [isPickupFocused, setIsPickupFocused] = useState(false);

  const [dropText, setDropText] = useState('');
  const [dropLoc, setDropLoc] = useState<any>(null);
  const [dropSuggestions, setDropSuggestions] = useState<any[]>([]);
  const [isDropFocused, setIsDropFocused] = useState(false);

  // Recommendations and estimates
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [distanceKm, setDistanceKm] = useState(10);
  const [durationMin, setDurationMin] = useState(30);

  // Helpers and payment
  const [helpersRequired, setHelpersRequired] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load categories from API on mount
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/api/universal/categories');
        if (res.data && res.data.data) {
          setCategories(res.data.data);
        }
      } catch (e) {
        console.warn('Could not fetch categories from server, using static list.', e);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Subcategories (Cargo types)
  const fetchCargoTypes = async (categoryName: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/universal/cargo/${categoryName}`);
      if (res.data && res.data.data) {
        setCargoTypes(res.data.data);
        setStep(2);
      } else {
        throw new Error();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve subcategories for this selection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permissions in your settings to use this feature.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;

      // Reverse geocode via Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'CargexMobileApp/1.0'
          }
        }
      );
      const data = await res.json();

      if (data && data.display_name) {
        setPickupText(data.display_name);
        setPickupLoc({
          display_name: data.display_name,
          lat: latitude.toString(),
          lon: longitude.toString()
        });
      } else {
        throw new Error('No address found');
      }
    } catch (err) {
      Alert.alert('Location Error', 'Failed to retrieve your current location.');
    } finally {
      setIsLoading(false);
    }
  };

  // Autocomplete OpenStreetMap search
  const handleAddressSearch = async (text: string, type: 'pickup' | 'drop') => {
    if (type === 'pickup') {
      setPickupText(text);
      if (text.length < 3) {
        setPickupSuggestions([]);
        return;
      }
    } else {
      setDropText(text);
      if (text.length < 3) {
        setDropSuggestions([]);
        return;
      }
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5`, {
        headers: {
          'User-Agent': 'CargexMobileApp/1.0'
        }
      });
      const data = await res.json();
      if (type === 'pickup') {
        setPickupSuggestions(data);
      } else {
        setDropSuggestions(data);
      }
    } catch (err) {
      console.warn('Geocoding error', err);
    }
  };

  // Get distance and route from OSRM
  const getRouteAndRecommendations = async () => {
    if (!pickupLoc || !dropLoc) {
      Alert.alert('Incomplete locations', 'Please specify both pickup and drop-off points.');
      return;
    }
    setIsLoading(true);
    try {
      // Query OSRM to get exact routing distance
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupLoc.lon},${pickupLoc.lat};${dropLoc.lon},${dropLoc.lat}?overview=false`;
      const osrmRes = await fetch(osrmUrl);
      const osrmData = await osrmRes.json();
      
      let finalDistance = 15;
      let finalDuration = 35;
      if (osrmData.routes && osrmData.routes.length > 0) {
        finalDistance = Math.max(1, Math.round(osrmData.routes[0].distance / 1000));
        finalDuration = Math.max(5, Math.round(osrmData.routes[0].duration / 60));
      }
      setDistanceKm(finalDistance);
      setDurationMin(finalDuration);

      // Call pricing / recommendation API
      const recommendRes = await apiClient.post('/api/universal/recommend', {
        cargoTypeId: selectedCargo._id,
        distanceKm: finalDistance,
        loadType: loadType
      });
      setRecommendations(recommendRes.data.data || recommendRes.data.recommendations || recommendRes.data || []);
      setStep(4);
    } catch (e: any) {
      Alert.alert('Routing Failed', e.response?.data?.message || 'Could not fetch route recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm booking creation
  const handleConfirmBooking = async () => {
    if (!selectedVehicle) return;
    setIsLoading(true);
    try {
      const payload = {
        pickupLocation: {
          address: pickupLoc.display_name,
          latitude: parseFloat(pickupLoc.lat),
          longitude: parseFloat(pickupLoc.lon)
        },
        dropLocation: {
          address: dropLoc.display_name,
          latitude: parseFloat(dropLoc.lat),
          longitude: parseFloat(dropLoc.lon)
        },
        distance: distanceKm,
        duration: durationMin,
        vehicleType: selectedVehicle.name,
        category: selectedCategory,
        subcategory: selectedCargo.name,
        loadType: loadType,
        helpersRequired: helpersRequired,
        paymentMethod: paymentMethod
      };

      const res = await apiClient.post('/api/users/bookings', payload);
      const booking = res.data;
      
      Alert.alert('Booking Placed!', 'Your booking has been registered successfully.', [
        {
          text: 'Track Live',
          onPress: () => {
            navigation.navigate('LiveTracking', { bookingId: booking._id });
          }
        }
      ]);
    } catch (e: any) {
      Alert.alert('Booking Failed', e.response?.data?.message || 'Failed to place booking.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Top Banner */}
      <View style={styles.topBanner}>
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.foreground} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Book Cargo Truck</Text>
        <Text style={styles.stepIndicator}>Step {step} of 5</Text>
      </View>

      {isLoading && step !== 3 && (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Fetching details...</Text>
        </View>
      )}

      {/* STEP 1: CATEGORY SELECTION */}
      {!isLoading && step === 1 && (
        <View>
          <Text style={styles.sectionHeader}>Select Cargo Category</Text>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.cardItem}
              onPress={() => {
                setSelectedCategory(cat);
                fetchCargoTypes(cat);
              }}
            >
              <Text style={styles.cardText}>{cat}</Text>
              <ArrowRight size={20} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* STEP 2: SUBCATEGORY (CARGO TYPE) */}
      {!isLoading && step === 2 && (
        <View>
          <Text style={styles.sectionHeader}>What are you transporting?</Text>
          <Text style={styles.sectionSub}>{selectedCategory}</Text>
          
          {cargoTypes.map((cargo) => (
            <TouchableOpacity
              key={cargo._id || cargo.name}
              style={[
                styles.cardItem,
                selectedCargo?._id === cargo._id && styles.cardSelected
              ]}
              onPress={() => setSelectedCargo(cargo)}
            >
              <View>
                <Text style={styles.cardText}>{cargo.name}</Text>
                {cargo.description ? (
                  <Text style={styles.cardSubtext}>{cargo.description}</Text>
                ) : null}
              </View>
              {selectedCargo?._id === cargo._id && <Check size={20} color={COLORS.accent} />}
            </TouchableOpacity>
          ))}

          {/* Load Type Select */}
          {selectedCargo && (
            <View style={styles.loadTypeSection}>
              <Text style={styles.label}>Select Load Size</Text>
              <View style={styles.loadRow}>
                {['small', 'medium', 'heavy'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.loadBtn,
                      loadType === size && styles.loadBtnSelected
                    ]}
                    onPress={() => setLoadType(size)}
                  >
                    <Text style={[styles.loadBtnText, loadType === size && styles.loadBtnTextSelected]}>
                      {size.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.primaryBtn}
                onPress={() => setStep(3)}
              >
                <Text style={styles.primaryBtnText}>Continue to Locations</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* STEP 3: PICKUP AND DROP LOCATIONS */}
      {step === 3 && (
        <View style={{ zIndex: 100 }}>
          <Text style={styles.sectionHeader}>Enter Locations</Text>
          
          {/* Pickup Input */}
          <View style={styles.inputContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs }}>
              <Text style={[styles.label, { marginBottom: 0 }]}>Pickup Address</Text>
              <TouchableOpacity onPress={handleGetCurrentLocation} style={{ paddingVertical: 2 }}>
                <Text style={{ fontSize: 13, color: COLORS.accent, fontWeight: '700' }}>📍 Use GPS Location</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Search pickup address..."
              value={pickupText}
              onChangeText={(t) => handleAddressSearch(t, 'pickup')}
              onFocus={() => setIsPickupFocused(true)}
              onBlur={() => setTimeout(() => setIsPickupFocused(false), 200)}
            />
            {isPickupFocused && pickupSuggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {pickupSuggestions.map((item: any) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setPickupLoc(item);
                      setPickupText(item.display_name);
                      setPickupSuggestions([]);
                    }}
                  >
                    <MapPin size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
                    <Text numberOfLines={1} style={styles.suggestionText}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Drop Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dropoff Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Search destination address..."
              value={dropText}
              onChangeText={(t) => handleAddressSearch(t, 'drop')}
              onFocus={() => setIsDropFocused(true)}
              onBlur={() => setTimeout(() => setIsDropFocused(false), 200)}
            />
            {isDropFocused && dropSuggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {dropSuggestions.map((item: any) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setDropLoc(item);
                      setDropText(item.display_name);
                      setDropSuggestions([]);
                    }}
                  >
                    <MapPin size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
                    <Text numberOfLines={1} style={styles.suggestionText}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {pickupLoc && dropLoc && (
            <View style={{ marginTop: 20 }}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <TouchableOpacity 
                  style={styles.primaryBtn}
                  onPress={getRouteAndRecommendations}
                >
                  <Text style={styles.primaryBtnText}>Get Fare Estimate</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* STEP 4: VEHICLE SELECTION */}
      {!isLoading && step === 4 && (
        <View>
          <Text style={styles.sectionHeader}>Choose Vehicle</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>Est. Distance: {distanceKm} km | Duration: {durationMin} mins</Text>
          </View>

          {recommendations.map((rec: any) => (
            <TouchableOpacity
              key={rec.vehicleTypeId}
              style={[
                styles.vehicleCard,
                selectedVehicle?.vehicleTypeId === rec.vehicleTypeId && styles.vehicleCardSelected
              ]}
              onPress={() => setSelectedVehicle(rec)}
            >
              <Text style={styles.vehicleEmoji}>🚚</Text>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.vehicleName}>{rec.name}</Text>
                <Text style={styles.vehicleInfo}>Capacity: {rec.capacity} kg</Text>
                <Text style={styles.vehicleInfo}>Base Fare: ₹{rec.breakdown?.baseFare || 0}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.vehiclePrice}>₹{rec.breakdown?.totalFare || rec.estimatedPrice || 0}</Text>
                {selectedVehicle?.vehicleTypeId === rec.vehicleTypeId && (
                  <Check size={20} color={COLORS.accent} style={{ marginTop: 4 }} />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {selectedVehicle && (
            <TouchableOpacity 
              style={styles.primaryBtn}
              onPress={() => setStep(5)}
            >
              <Text style={styles.primaryBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* STEP 5: FINAL CONFIRMATION & PAYMENT */}
      {!isLoading && step === 5 && (
        <View>
          <Text style={styles.sectionHeader}>Booking Confirmation</Text>

          <View style={styles.detailsBox}>
            <Text style={styles.detailsLabel}>Transport Selection</Text>
            <Text style={styles.detailsVal}>{selectedCategory} - {selectedCargo.name} ({loadType.toUpperCase()})</Text>
            
            <Text style={styles.detailsLabel}>Vehicle Type</Text>
            <Text style={styles.detailsVal}>{selectedVehicle.name} (Max: {selectedVehicle.capacity} kg)</Text>

            <Text style={styles.detailsLabel}>Pickup Location</Text>
            <Text style={styles.detailsVal} numberOfLines={2}>{pickupLoc.display_name}</Text>

            <Text style={styles.detailsLabel}>Dropoff Location</Text>
            <Text style={styles.detailsVal} numberOfLines={2}>{dropLoc.display_name}</Text>
          </View>

          {/* Pricing Breakdown */}
          <View style={styles.pricingBox}>
            <Text style={styles.pricingTitle}>Pricing Breakdown</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base Fare</Text>
              <Text style={styles.priceVal}>₹{selectedVehicle.breakdown?.baseFare || 0}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Distance Charge ({distanceKm} km)</Text>
              <Text style={styles.priceVal}>₹{selectedVehicle.breakdown?.distanceCost || 0}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Load Surcharge</Text>
              <Text style={styles.priceVal}>₹{selectedVehicle.breakdown?.loadCost || 0}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Estimated Price</Text>
              <Text style={styles.totalVal}>₹{selectedVehicle.breakdown?.totalFare || 0}</Text>
            </View>
          </View>

          {/* Helpers Option */}
          <View style={styles.optionBox}>
            <Text style={styles.label}>Need helpers for loading/unloading?</Text>
            <View style={styles.loadRow}>
              <TouchableOpacity
                style={[styles.loadBtn, !helpersRequired && styles.loadBtnSelected]}
                onPress={() => setHelpersRequired(false)}
              >
                <Text style={[styles.loadBtnText, !helpersRequired && styles.loadBtnTextSelected]}>NO HELPERS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loadBtn, helpersRequired && styles.loadBtnSelected]}
                onPress={() => setHelpersRequired(true)}
              >
                <Text style={[styles.loadBtnText, helpersRequired && styles.loadBtnTextSelected]}>YES, REQUIRE HELPERS</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Method Option */}
          <View style={styles.optionBox}>
            <Text style={styles.label}>Select Payment Method</Text>
            <View style={styles.loadRow}>
              {['Cash', 'UPI', 'Wallet'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.loadBtn, paymentMethod === method && styles.loadBtnSelected]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[styles.loadBtnText, paymentMethod === method && styles.loadBtnTextSelected]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: COLORS.accent }]}
            onPress={handleConfirmBooking}
          >
            <Text style={styles.primaryBtnText}>Confirm and Request Ride</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    flex: 1,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  centerLoading: {
    marginVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.muted,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  sectionSub: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: SPACING.md,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: '#F0FDF4',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  cardSubtext: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  loadTypeSection: {
    marginTop: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.foreground,
    marginBottom: SPACING.sm,
  },
  loadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  loadBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: COLORS.background,
  },
  loadBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  loadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  loadBtnTextSelected: {
    color: COLORS.white,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.foreground,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    zIndex: 999,
    ...SHADOWS.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.foreground,
    flex: 1,
  },
  summaryBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  vehicleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceHighlight,
  },
  vehicleEmoji: {
    fontSize: 32,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  vehicleInfo: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  vehiclePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  detailsBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  detailsLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  detailsVal: {
    fontSize: 14,
    color: COLORS.foreground,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  pricingBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.muted,
  },
  priceVal: {
    fontSize: 14,
    color: COLORS.foreground,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.accent,
  },
  optionBox: {
    marginBottom: SPACING.md,
  },
});
