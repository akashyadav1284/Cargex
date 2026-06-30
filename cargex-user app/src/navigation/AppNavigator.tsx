import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Truck, Home as HomeIcon, History, PhoneCall } from 'lucide-react-native';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingFlowScreen from '../screens/BookingFlowScreen';
import BookingHistoryScreen from '../screens/BookingHistoryScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';
import SupportScreen from '../screens/SupportScreen';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 32 : 24,
          left: 20,
          right: 20,
          elevation: 8,
          backgroundColor: COLORS.white,
          borderRadius: BORDER_RADIUS.xl,
          height: 68,
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 18 : 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
        headerStyle: {
          backgroundColor: COLORS.background,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          fontWeight: '900',
          color: COLORS.primary,
          fontSize: 20,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <HomeIcon size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="BookTab"
        component={BookingFlowScreen}
        options={{
          title: 'Book Truck',
          headerShown: false,
          tabBarIcon: ({ color }) => <Truck size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={BookingHistoryScreen}
        options={{
          title: 'Shipments',
          headerTitle: 'My Shipments',
          tabBarIcon: ({ color }) => <History size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="SupportTab"
        component={SupportScreen}
        options={{
          title: 'Support',
          headerTitle: 'Customer Support',
          tabBarIcon: ({ color }) => <PhoneCall size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, isLoading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        if (completed !== 'true') {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.error('Failed to check onboarding', e);
      } finally {
        setIsOnboardingChecked(true);
      }
    };
    checkOnboarding();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (showOnboarding && isOnboardingChecked) {
    return <OnboardingScreen onFinish={() => setShowOnboarding(false)} />;
  }

  if (authLoading || !isOnboardingChecked) {
    return null; // Wait for authentication loading state
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Authenticated Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
            <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
          </>
        ) : (
          // Guest/Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
