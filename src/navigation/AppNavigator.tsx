import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { House, User, History } from 'lucide-react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { ChantingScreen } from '../screens/ChantingScreen';
import { ChantHistoryScreen } from '../screens/ChantHistoryScreen';
import { DonationScreen } from '../screens/DonationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../constants/theme';

// The ad banner now scrolls inline at the top of each screen's content
// (see <AdBanner /> in the screens) instead of being pinned above the tabs.

/** Stack inside the Home tab (mission dashboard -> chanting -> donation). */
export type HomeStackParamList = {
  Home: undefined;
  Chanting: undefined;
  Donation: undefined;
};

/** Param list for the main bottom-tab navigator (Home · History · Profile). */
export type AppTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

/** Clean, neutral header — white background, dark title, no accent fill. */
const neutralHeader = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontWeight: '700' as const, color: colors.textPrimary },
  headerShadowVisible: false,
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={neutralHeader}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Sri Vidya Peetam' }}
      />
      <Stack.Screen
        name="Chanting"
        component={ChantingScreen}
        options={{ title: 'Om Namah Shivaya' }}
      />
      <Stack.Screen
        name="Donation"
        component={DonationScreen}
        options={{ title: '₹216 Seva Donation' }}
      />
    </Stack.Navigator>
  );
}

/**
 * Bottom-tab app shell shown when authenticated. History is the dedicated
 * centre tab, flanked by Home and Profile.
 */
export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { paddingTop: 4 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={ChantHistoryScreen}
        options={{
          headerShown: true,
          ...neutralHeader,
          title: 'Chanting History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          ...neutralHeader,
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
