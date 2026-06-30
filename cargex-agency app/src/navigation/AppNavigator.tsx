import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';
import { Truck, Home, Settings, PhoneCall, ListTodo } from 'lucide-react-native';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FleetManagementScreen from '../screens/FleetManagementScreen';
import BookingsScreen from '../screens/BookingsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SupportScreen from '../screens/SupportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
          shadowColor: 'transparent',
        },
        headerTitleStyle: {
          fontWeight: '800',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="FleetTab"
        component={FleetManagementScreen}
        options={{
          title: 'Fleet',
          headerTitle: 'Fleet Management',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Truck size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={BookingsScreen}
        options={{
          title: 'Orders',
          headerTitle: 'Cargo Bookings',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <ListTodo size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Agency Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Settings size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SupportTab"
        component={SupportScreen}
        options={{
          title: 'Support',
          headerTitle: 'Partner Assistance',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <PhoneCall size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Authenticated Screen Flows
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Fleet" component={FleetManagementScreen} />
            <Stack.Screen name="Bookings" component={BookingsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
          </>
        ) : (
          // Unauthenticated Screen Flows
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
