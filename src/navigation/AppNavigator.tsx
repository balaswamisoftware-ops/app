import React from 'react';
import { View } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBar,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { House, User, History } from 'lucide-react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { ChantingScreen } from '../screens/ChantingScreen';
import { ChantHistoryScreen } from '../screens/ChantHistoryScreen';
import { DonationScreen } from '../screens/DonationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdBanner } from '../components/ads/AdBanner';
import { colors } from '../constants/theme';

// AdMob policy: never show ads on a payment screen.
const NO_AD_ROUTES = ['Donation'];

/** Bottom tab bar with an ad banner directly above it (hidden on payment). */
function TabBarWithAd(props: BottomTabBarProps) {
  const focusedTab = props.state.routes[props.state.index];
  const nestedRoute = getFocusedRouteNameFromRoute(focusedTab) ?? '';
  const showAd = !NO_AD_ROUTES.includes(nestedRoute);
  return (
    <View>
      {showAd && <AdBanner />}
      <BottomTabBar {...props} />
    </View>
  );
}

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
        options={{ title: 'Sri Vidya Peetham' }}
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
      tabBar={props => <TabBarWithAd {...props} />}
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
