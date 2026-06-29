import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';
import { Home as HomeIcon, ClipboardList, History as HistoryIcon, User, Settings } from 'lucide-react-native';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BookingsScreen from '../screens/BookingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TripDetailsScreen from '../screens/TripDetailsScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';

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
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <HomeIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsScreen}
        options={{
          title: 'Bookings',
          headerTitle: 'Active Dispatches',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          title: 'History',
          headerTitle: 'Earnings History',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <HistoryIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'Driver Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <User size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Driver Settings',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null; // Wait for storage check
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Authenticated Screen Flows
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
            <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ headerShown: true, title: 'Vetting Documents' }} />
          </>
        ) : (
          // Unauthenticated Screen Flows
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
