import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { House, User, History, UsersRound } from 'lucide-react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { ChantingScreen } from '../screens/ChantingScreen';
import { ChantHistoryScreen } from '../screens/ChantHistoryScreen';
import { DonationScreen } from '../screens/DonationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { CertificatesScreen } from '../screens/CertificatesScreen';
import { GroupHomeScreen } from '../screens/group/GroupHomeScreen';
import { GroupMemberScreen } from '../screens/group/GroupMemberScreen';
import { GroupAddMemberScreen } from '../screens/group/GroupAddMemberScreen';
import { GroupEntriesScreen } from '../screens/group/GroupEntriesScreen';
import { useGroupStore } from '../store/useGroupStore';
import { LEGAL_DOCUMENTS, type LegalDocumentId } from '../constants/legal';
import { colors } from '../constants/theme';

// The ad banner now scrolls inline at the top of each screen's content
// (see <AdBanner /> in the screens) instead of being pinned above the tabs.

/** Stack inside the Home tab (mission dashboard -> chanting -> donation). */
export type HomeStackParamList = {
  Home: undefined;
  Chanting: undefined;
  Donation: undefined;
  Certificates: undefined;
};

/** Stack inside the Profile tab (profile -> terms / privacy). */
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Legal: { document: LegalDocumentId };
  Certificates: undefined;
};

/** Stack inside the Group tab — only for Devotee Admins (group leaders). */
export type GroupStackParamList = {
  GroupHome: undefined;
  GroupMember: { userId: string; justAdded?: boolean };
  GroupAddMember: undefined;
  GroupEntries: undefined;
};

/** Param list for the main bottom-tab navigator (Home · Group · History · Profile). */
export type AppTabParamList = {
  HomeTab: undefined;
  GroupTab: undefined;
  HistoryTab: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
const GroupStackNav = createNativeStackNavigator<GroupStackParamList>();
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
      <Stack.Screen
        name="Certificates"
        component={CertificatesScreen}
        options={{ title: 'My Certificates' }}
      />
    </Stack.Navigator>
  );
}

/** Stack for the Profile tab so it can push the Terms / Privacy pages. */
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={neutralHeader}>
      <ProfileStackNav.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <ProfileStackNav.Screen
        name="Legal"
        component={LegalScreen}
        options={({ route }) => ({
          title: LEGAL_DOCUMENTS[route.params.document].title,
        })}
      />
      <ProfileStackNav.Screen
        name="Certificates"
        component={CertificatesScreen}
        options={{ title: 'My Certificates' }}
      />
    </ProfileStackNav.Navigator>
  );
}

/** Stack for the Group tab: group home -> member -> add member / entries. */
function GroupStack() {
  return (
    <GroupStackNav.Navigator screenOptions={neutralHeader}>
      <GroupStackNav.Screen
        name="GroupHome"
        component={GroupHomeScreen}
        options={{ title: 'My Group' }}
      />
      <GroupStackNav.Screen
        name="GroupMember"
        component={GroupMemberScreen}
        options={{ title: 'Devotee' }}
      />
      <GroupStackNav.Screen
        name="GroupAddMember"
        component={GroupAddMemberScreen}
        options={{ title: 'Add devotee' }}
      />
      <GroupStackNav.Screen
        name="GroupEntries"
        component={GroupEntriesScreen}
        options={{ title: 'Recent entries' }}
      />
    </GroupStackNav.Navigator>
  );
}

/**
 * Bottom-tab app shell shown when authenticated: Home · History · Profile, plus
 * a Group tab after Home for Devotee Admins.
 */
export function AppNavigator() {
  // The Group tab exists only for Devotee Admins. The role is fetched once the
  // devotee is signed in (and again on every foreground, from App.tsx), so a
  // portal admin appointing someone shows up without reinstalling.
  const isDevoteeAdmin = useGroupStore(s => s.status?.isDevoteeAdmin === true);
  useEffect(() => {
    void useGroupStore.getState().loadStatus();
  }, []);

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
          // Leaving the Home tab resets its stack back to Home, so returning
          // always lands on the dashboard with a working "Start Chanting" — the
          // stack never gets stuck on Chanting/Donation after tab-hopping.
          popToTopOnBlur: true,
        }}
      />
      {isDevoteeAdmin && (
        <Tab.Screen
          name="GroupTab"
          component={GroupStack}
          options={{
            tabBarLabel: 'Group',
            tabBarIcon: ({ color, size }) => <UsersRound color={color} size={size} />,
            popToTopOnBlur: true,
          }}
        />
      )}
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
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
