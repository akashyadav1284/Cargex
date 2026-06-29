import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';
import { Truck, Home as HomeIcon, History, PhoneCall } from 'lucide-react-native';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingFlowScreen from '../screens/BookingFlowScreen';
import BookingHistoryScreen from '../screens/BookingHistoryScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';
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
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BookTab"
        component={BookingFlowScreen}
        options={{
          title: 'Book Truck',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={BookingHistoryScreen}
        options={{
          title: 'History',
          headerTitle: 'My Bookings',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SupportTab"
        component={SupportScreen}
        options={{
          title: 'Support',
          headerTitle: 'Helpline Assistance',
          tabBarIcon: ({ color, size }) => <PhoneCall size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null; // Wait for storage validation
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Authenticated Screen Flows
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
            <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
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
