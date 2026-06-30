import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, FlatList, RefreshControl } from 'react-native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Users, Truck, Plus, CheckCircle, Trash } from 'lucide-react-native';

export default function FleetManagementScreen() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Toggles
  const [showAddForm, setShowAddForm] = useState(false);

  // Driver Form States
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverVehicleType, setDriverVehicleType] = useState('Tata Ace');

  // Vehicle Form States
  const [plateNumber, setPlateNumber] = useState('');
  const [modelName, setModelName] = useState('');
  const [vehicleType, setVehicleType] = useState('Tata Ace');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'drivers') {
        const res = await apiClient.get('/api/agency/drivers');
        setDrivers(res.data.data || res.data || []);
      } else {
        const res = await apiClient.get('/api/agency/vehicles');
        setVehicles(res.data.data || res.data || []);
      }
    } catch (e) {
      console.warn('Failed to load fleet listings', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Add Driver
  const handleAddDriver = async () => {
    if (!driverName || !driverEmail || !driverPhone || !driverPassword) {
      Alert.alert('Incomplete Fields', 'Please fill in all driver fields.');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/api/agency/drivers', {
        fullName: driverName,
        email: driverEmail,
        phone: driverPhone,
        password: driverPassword,
        vehicleType: driverVehicleType
      });
      Alert.alert('Driver Added', `${driverName} has been successfully added to your fleet.`);
      setShowAddForm(false);
      setDriverName('');
      setDriverEmail('');
      setDriverPhone('');
      setDriverPassword('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add driver.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Vehicle
  const handleAddVehicle = async () => {
    if (!plateNumber || !modelName) {
      Alert.alert('Incomplete Fields', 'Please fill in plate number and model details.');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/api/agency/vehicles', {
        plateNumber,
        model: modelName,
        type: vehicleType
      });
      Alert.alert('Vehicle Added', `Vehicle ${plateNumber} added successfully.`);
      setShowAddForm(false);
      setPlateNumber('');
      setModelName('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add vehicle.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDriverItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase() || 'D'}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemName}>{item.fullName}</Text>
        <Text style={styles.itemMeta}>{item.phone} | {item.email}</Text>
        <Text style={styles.itemMetaSub}>Vehicle type mapping: {item.vehicleDetails?.type || 'Not Assigned'}</Text>
      </View>
      <View style={[styles.statusIndicator, item.isOnline ? styles.onlineIndicator : styles.offlineIndicator]}>
        <Text style={[styles.statusIndText, { color: item.isOnline ? COLORS.accent : COLORS.muted }]}>
          {item.isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
    </View>
  );

  const renderVehicleItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={[styles.avatar, { backgroundColor: COLORS.surface }]}>
        <Text style={[styles.avatarText, { color: COLORS.primary }]}>🚚</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemName}>{item.model} ({item.type})</Text>
        <Text style={styles.itemMeta}>Plate Number: {item.plateNumber}</Text>
        <Text style={styles.itemMetaSub}>Status: {item.status.toUpperCase()}</Text>
      </View>
      <View style={[styles.statusIndicator, item.status === 'active' ? styles.onlineIndicator : styles.offlineIndicator]}>
        <Text style={[styles.statusIndText, { color: item.status === 'active' ? COLORS.accent : COLORS.muted }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Tabs */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'drivers' && styles.tabBtnActive]}
          onPress={() => { setActiveTab('drivers'); setShowAddForm(false); }}
        >
          <Users size={16} color={activeTab === 'drivers' ? COLORS.primary : COLORS.muted} style={{ marginRight: 6 }} />
          <Text style={[styles.tabBtnText, activeTab === 'drivers' && styles.tabBtnTextActive]}>Drivers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'vehicles' && styles.tabBtnActive]}
          onPress={() => { setActiveTab('vehicles'); setShowAddForm(false); }}
        >
          <Truck size={16} color={activeTab === 'vehicles' ? COLORS.primary : COLORS.muted} style={{ marginRight: 6 }} />
          <Text style={[styles.tabBtnText, activeTab === 'vehicles' && styles.tabBtnTextActive]}>Vehicles</Text>
        </TouchableOpacity>
      </View>

      {/* Add trigger */}
      {!showAddForm && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Plus size={18} color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.addButtonText}>
            Add New {activeTab === 'drivers' ? 'Driver' : 'Vehicle'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Add forms */}
      {showAddForm && (
        <ScrollView style={styles.formCard} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>
            New {activeTab === 'drivers' ? 'Driver Details' : 'Vehicle Asset'}
          </Text>

          {activeTab === 'drivers' ? (
            <View>
              <TextInput style={styles.input} placeholder="Driver Name" value={driverName} onChangeText={setDriverName} />
              <TextInput style={styles.input} placeholder="Email Address" value={driverEmail} onChangeText={setDriverEmail} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} placeholder="Phone Number" value={driverPhone} onChangeText={setDriverPhone} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Secure Password" value={driverPassword} onChangeText={setDriverPassword} secureTextEntry autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Vehicle Mapping (e.g. Tata Ace)" value={driverVehicleType} onChangeText={setDriverVehicleType} />
              
              <View style={styles.formBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddForm(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddDriver}><Text style={styles.submitBtnText}>Add Driver</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <TextInput style={styles.input} placeholder="Plate Number (e.g. MH-12-PQ-4567)" value={plateNumber} onChangeText={setPlateNumber} autoCapitalize="characters" />
              <TextInput style={styles.input} placeholder="Model Name (e.g. Tata Ace Gold)" value={modelName} onChangeText={setModelName} />
              <TextInput style={styles.input} placeholder="Vehicle Type (e.g. Tata Ace)" value={vehicleType} onChangeText={setVehicleType} />
              
              <View style={styles.formBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddForm(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddVehicle}><Text style={styles.submitBtnText}>Add Vehicle</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* List content */}
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activeTab === 'drivers' ? drivers : vehicles}
          keyExtractor={(item) => item._id}
          renderItem={activeTab === 'drivers' ? renderDriverItem : renderVehicleItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchData} colors={[COLORS.accent]} />
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
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surfaceHighlight,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.muted,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    margin: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    maxHeight: 300,
    ...SHADOWS.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: SPACING.sm,
    color: COLORS.primary,
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    marginBottom: 20,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelBtnText: {
    color: COLORS.muted,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: SPACING.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
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
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.foreground,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  itemMetaSub: {
    fontSize: 11,
    color: COLORS.blue,
    fontWeight: '600',
    marginTop: 2,
  },
  statusIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  onlineIndicator: {
    backgroundColor: '#ECFDF5',
  },
  offlineIndicator: {
    backgroundColor: COLORS.surface,
  },
  statusIndText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
