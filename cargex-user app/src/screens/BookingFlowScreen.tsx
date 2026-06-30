import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
  StyleProp,
  ViewStyle
} from 'react-native';
import * as Location from 'expo-location';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { 
  MapPin, 
  ArrowRight, 
  Check, 
  Truck, 
  Search, 
  MapPinOff, 
  Compass, 
  Layers, 
  Sparkles, 
  Info,
  DollarSign
} from 'lucide-react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import Header from '../components/Header';

const STATIC_CATEGORIES = [
  "Construction Material",
  "Business / Commercial",
  "Household Goods",
  "Personal Delivery",
  "Heavy Equipment Transport",
  "Vehicle Transport",
  "Food & Agriculture"
];

const STEP_TITLES = [
  "Cargo Category",
  "Cargo Details",
  "Address Routing",
  "Select Vehicle",
  "Review & Request"
];

export default function BookingFlowScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<string[]>(STATIC_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  const getRouteAndRecommendations = async () => {
    if (!pickupLoc || !dropLoc) {
      Alert.alert('Incomplete locations', 'Please specify both pickup and drop-off points.');
      return;
    }
    setIsLoading(true);
    try {
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

  const filteredCategories = categories.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Dynamic Back-aware Header */}
      <Header 
        title={STEP_TITLES[step - 1]} 
        showBackButton={step > 1}
        onBackPress={() => setStep(step - 1)}
        rightComponent={
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{step}/5</Text>
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Stepper Progress Line */}
        <View style={styles.stepperContainer}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={styles.stepDotWrapper}>
              <View 
                style={[
                  styles.stepDot,
                  s === step ? styles.stepDotActive : undefined,
                  s < step ? styles.stepDotCompleted : undefined
                ] as any}
              >
                {s < step ? (
                  <Check size={10} color={COLORS.white} />
                ) : (
                  <Text style={[styles.stepNumber, s === step ? { color: COLORS.white } : undefined] as any}>{s}</Text>
                )}
              </View>
              {s < 5 && (
                <View 
                  style={[
                    styles.stepLine,
                    s < step ? { backgroundColor: COLORS.secondary } : undefined
                  ] as any} 
                />
              )}
            </View>
          ))}
        </View>

        {isLoading && step !== 3 && (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Configuring request details...</Text>
          </View>
        )}

        {/* STEP 1: CATEGORY SELECTION */}
        {!isLoading && step === 1 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Layers size={22} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>What is your cargo category?</Text>
            </View>
            
            <Input 
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search logistics categories..."
              icon={<Search size={20} color={COLORS.textMuted} />}
            />

            <View style={styles.list}>
              {filteredCategories.map((cat) => (
                <Card
                  key={cat}
                  onPress={() => {
                    setSelectedCategory(cat);
                    fetchCargoTypes(cat);
                  }}
                  style={styles.categoryCard}
                  padding="medium"
                  variant="outlined"
                >
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryName}>{cat}</Text>
                    <ArrowRight size={18} color={COLORS.secondary} />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* STEP 2: SUBCATEGORY (CARGO TYPE) */}
        {!isLoading && step === 2 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Sparkles size={22} color={COLORS.secondary} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.sectionTitle}>Specify Item Details</Text>
                <Text style={styles.sectionSubtitle}>{selectedCategory}</Text>
              </View>
            </View>

            <View style={styles.list}>
              {cargoTypes.map((cargo) => (
                <Card
                  key={cargo._id || cargo.name}
                  onPress={() => setSelectedCargo(cargo)}
                  variant={selectedCargo?._id === cargo._id ? 'flat' : 'outlined'}
                  style={[
                    styles.cargoCard,
                    selectedCargo?._id === cargo._id ? { borderColor: COLORS.secondary, borderWidth: 1.5 } : undefined
                  ] as any}
                >
                  <View style={styles.categoryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.categoryName}>{cargo.name}</Text>
                      {cargo.description ? (
                        <Text style={styles.cargoDesc}>{cargo.description}</Text>
                      ) : null}
                    </View>
                    {selectedCargo?._id === cargo._id && (
                      <Check size={20} color={COLORS.secondary} />
                    )}
                  </View>
                </Card>
              ))}
            </View>

            {/* Load Type Select */}
            {selectedCargo && (
              <View style={styles.optionBox}>
                <Text style={styles.optionLabel}>Select Cargo Load Weight</Text>
                <View style={styles.loadTabs}>
                  {['small', 'medium', 'heavy'].map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.loadTabBtn,
                        loadType === size ? styles.loadTabBtnSelected : undefined
                      ] as any}
                      onPress={() => setLoadType(size)}
                    >
                      <Text style={[styles.loadTabText, loadType === size ? styles.loadTabTextSelected : undefined] as any}>
                        {size.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button 
                  label="Confirm Details" 
                  onPress={() => setStep(3)}
                  style={{ marginTop: SPACING.md }}
                />
              </View>
            )}
          </View>
        )}

        {/* STEP 3: PICKUP AND DROP LOCATIONS */}
        {step === 3 && (
          <View style={{ zIndex: 100 }}>
            <View style={styles.sectionHeaderRow}>
              <MapPin size={22} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Add Delivery Route</Text>
            </View>

            {/* Pickup Input Card */}
            <Card variant="outlined" style={styles.locContainer} padding="medium">
              <View style={styles.locHeader}>
                <Text style={styles.locLabel}>Pickup Location</Text>
                <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.gpsBtn}>
                  <Compass size={14} color={COLORS.secondary} style={{ marginRight: 4 }} />
                  <Text style={styles.gpsBtnText}>Use GPS</Text>
                </TouchableOpacity>
              </View>
              
              <Input
                value={pickupText}
                onChangeText={(t) => handleAddressSearch(t, 'pickup')}
                placeholder="Search pickup address..."
                onFocus={() => setIsPickupFocused(true)}
                onBlur={() => setTimeout(() => setIsPickupFocused(false), 250)}
                icon={<MapPin size={18} color={COLORS.secondary} />}
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
                      <MapPin size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                      <Text numberOfLines={1} style={styles.suggestionText}>{item.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>

            {/* Drop Input Card */}
            <Card variant="outlined" style={[styles.locContainer, { marginTop: SPACING.md }] as any} padding="medium">
              <Text style={styles.locLabel}>Dropoff Location</Text>
              
              <Input
                value={dropText}
                onChangeText={(t) => handleAddressSearch(t, 'drop')}
                placeholder="Search destination address..."
                onFocus={() => setIsDropFocused(true)}
                onBlur={() => setTimeout(() => setIsDropFocused(false), 250)}
                icon={<MapPin size={18} color={COLORS.error} />}
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
                      <MapPin size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                      <Text numberOfLines={1} style={styles.suggestionText}>{item.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>

            {pickupLoc && dropLoc && (
              <View style={{ marginTop: SPACING.lg }}>
                <Button
                  label="Calculate Route & Price"
                  onPress={getRouteAndRecommendations}
                  isLoading={isLoading}
                  style={styles.routingBtn}
                />
              </View>
            )}
          </View>
        )}

        {/* STEP 4: VEHICLE SELECTION */}
        {!isLoading && step === 4 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Truck size={22} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
            </View>

            <View style={styles.routeSummaryBox}>
              <Text style={styles.routeSummaryText}>
                Distance: <Text style={styles.boldText}>{distanceKm} km</Text> | Duration: <Text style={styles.boldText}>{durationMin} mins</Text>
              </Text>
            </View>

            <View style={styles.list}>
              {recommendations.map((rec: any) => {
                const isSelected = selectedVehicle?.vehicleTypeId === rec.vehicleTypeId;
                return (
                  <Card
                    key={rec.vehicleTypeId}
                    onPress={() => setSelectedVehicle(rec)}
                    variant={isSelected ? 'flat' : 'outlined'}
                    style={[
                      styles.vehicleCard,
                      isSelected ? { borderColor: COLORS.secondary, borderWidth: 1.5 } : undefined
                    ] as any}
                  >
                    <View style={styles.vehicleRow}>
                      <View style={styles.vehicleGraphic}>
                        <Text style={styles.vehicleIcon}>🚛</Text>
                      </View>
                      
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.vehicleName}>{rec.name}</Text>
                        <Text style={styles.vehicleCap}>Max Payload: {rec.capacity} kg</Text>
                        <Text style={styles.vehicleDesc}>Base fare starts from ₹{rec.breakdown?.baseFare || 0}</Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.vehicleCost}>₹{(rec.breakdown?.totalFare || rec.estimatedPrice || 0).toLocaleString()}</Text>
                        {isSelected && (
                          <Check size={20} color={COLORS.secondary} style={{ marginTop: 4 }} />
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>

            {selectedVehicle && (
              <Button
                label="Proceed to Checkout"
                onPress={() => setStep(5)}
                style={{ marginTop: SPACING.lg }}
              />
            )}
          </View>
        )}

        {/* STEP 5: FINAL CONFIRMATION & PAYMENT */}
        {!isLoading && step === 5 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Check size={22} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Review Booking</Text>
            </View>

            {/* Summary Review Card */}
            <Card variant="outlined" style={styles.summaryDetailsCard}>
              <Text style={styles.summaryLabel}>Cargo Type</Text>
              <Text style={styles.summaryValue}>{selectedCategory} - {selectedCargo.name} ({loadType.toUpperCase()})</Text>
              
              <Text style={styles.summaryLabel}>Assigned Transport</Text>
              <Text style={styles.summaryValue}>{selectedVehicle.name} (Capacity: {selectedVehicle.capacity} kg)</Text>

              <Text style={styles.summaryLabel}>Pickup</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{pickupLoc.display_name}</Text>

              <Text style={styles.summaryLabel}>Dropoff</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{dropLoc.display_name}</Text>
            </Card>

            {/* Pricing Details Card */}
            <Card variant="outlined" style={styles.pricingCard}>
              <Text style={styles.priceSectionTitle}>Fare Breakdown</Text>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Base Fare</Text>
                <Text style={styles.pricingValue}>₹{selectedVehicle.breakdown?.baseFare || 0}</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Distance Charge ({distanceKm} km)</Text>
                <Text style={styles.pricingValue}>₹{selectedVehicle.breakdown?.distanceCost || 0}</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Load Handling Surcharge</Text>
                <Text style={styles.pricingValue}>₹{selectedVehicle.breakdown?.loadCost || 0}</Text>
              </View>
              <View style={[styles.pricingRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Estimated Cost</Text>
                <Text style={styles.totalValue}>₹{selectedVehicle.breakdown?.totalFare || 0}</Text>
              </View>
            </Card>

            {/* Helpers Toggle */}
            <View style={styles.reviewOptionBox}>
              <Text style={styles.optionTitle}>Require Helpers for Handling?</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, !helpersRequired ? styles.toggleBtnSelected : undefined] as any}
                  onPress={() => setHelpersRequired(false)}
                >
                  <Text style={[styles.toggleBtnText, !helpersRequired ? styles.toggleBtnTextSelected : undefined] as any}>NO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, helpersRequired ? styles.toggleBtnSelected : undefined] as any}
                  onPress={() => setHelpersRequired(true)}
                >
                  <Text style={[styles.toggleBtnText, helpersRequired ? styles.toggleBtnTextSelected : undefined] as any}>YES</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment Method Selector */}
            <View style={styles.reviewOptionBox}>
              <Text style={styles.optionTitle}>Select Payment Method</Text>
              <View style={styles.toggleRow}>
                {['Cash', 'UPI', 'Wallet'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.toggleBtn, paymentMethod === method ? styles.toggleBtnSelected : undefined] as any}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text style={[styles.toggleBtnText, paymentMethod === method ? styles.toggleBtnTextSelected : undefined] as any}>
                      {method.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              label="Request Secure Delivery"
              onPress={handleConfirmBooking}
              isLoading={isLoading}
              style={[styles.confirmBtn, { backgroundColor: COLORS.secondary }] as any}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  stepDotWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stepDotCompleted: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  stepLine: {
    width: 44,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  loadingWrapper: {
    marginVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  list: {
    marginTop: SPACING.sm,
  },
  categoryCard: {
    marginVertical: 4,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cargoCard: {
    marginVertical: 4,
    backgroundColor: COLORS.card,
  },
  cargoDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
    fontWeight: '500',
  },
  optionBox: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  loadTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  loadTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.xs,
    alignItems: 'center',
  },
  loadTabBtnSelected: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  loadTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  loadTabTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  locContainer: {
    backgroundColor: COLORS.card,
  },
  locHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  gpsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  suggestionsBox: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    maxHeight: 180,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  routingBtn: {
    width: '100%',
  },
  routeSummaryBox: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  routeSummaryText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  boldText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  vehicleCard: {
    marginVertical: 4,
    backgroundColor: COLORS.card,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleGraphic: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIcon: {
    fontSize: 24,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  vehicleCap: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 2,
  },
  vehicleDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  vehicleCost: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  summaryDetailsCard: {
    backgroundColor: COLORS.card,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  pricingCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    marginVertical: SPACING.md,
  },
  priceSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  pricingLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  pricingValue: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 18,
    color: COLORS.secondary,
    fontWeight: '900',
  },
  reviewOptionBox: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginVertical: 4,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: BORDER_RADIUS.sm,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xs,
  },
  toggleBtnSelected: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  toggleBtnTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  confirmBtn: {
    marginTop: SPACING.lg,
  },
});
