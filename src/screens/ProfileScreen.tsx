import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  Phone,
  Star,
  Users,
  User as UserIcon,
  Lock,
  Pencil,
  Check,
  X,
  LogOut,
  WifiOff,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import {
  Banner,
  Button,
  Card,
  IconChip,
  Input,
  Select,
} from '../components/ui';
import { SevaStatusCard } from '../components/profile/SevaStatusCard';
import { NAKSHATRAMS } from '../constants/nakshatram';
import { colors } from '../constants/theme';
import { formatMobile } from '../utils/format';
import { useProfile } from '../hooks/useProfile';
import { AdBanner } from '../components/ads/AdBanner';

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <View
      className="flex-row items-center gap-3 py-3"
      accessible
      accessibilityLabel={`${label}: ${value || 'Not set'}`}
    >
      <IconChip icon={Icon} />
      <View className="flex-1">
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="mt-0.5 text-base font-medium text-gray-900">
          {value || '—'}
        </Text>
      </View>
    </View>
  );
}

/** "Sita Rama" → "SR"; falls back to "D" for Devotee. */
function getInitials(fullName?: string): string {
  if (!fullName?.trim()) return 'D';
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase() || 'D';
}

export function ProfileScreen() {
  const {
    user,
    loading,
    loadError,
    refresh,
    isEditing,
    form,
    errors,
    saving,
    feedback,
    startEdit,
    cancelEdit,
    setField,
    save,
    dismissFeedback,
    logout,
  } = useProfile();

  // Confirm before logging out — it's destructive and easy to tap by mistake.
  const confirmLogout = () => {
    Alert.alert(
      'Log out?',
      'You can sign back in with your mobile number any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: logout },
      ],
    );
  };

  // Initial loading (no cached user yet).
  if (loading && !user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-gray-500">Loading your profile…</Text>
      </View>
    );
  }

  // Empty / network error with no data to show.
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-gray-50 px-8">
        <WifiOff size={40} color={colors.textMuted} />
        <Text className="text-center text-gray-600">
          {loadError ??
            'We couldn’t load your profile. Check your connection and try again.'}
        </Text>
        <Button label="Try again" variant="outline" onPress={refresh} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="p-4 pb-8 gap-4 w-full max-w-[600px] self-center"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            // Don't allow pull-to-refresh mid-edit — it could clobber unsaved changes.
            enabled={!isEditing}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Ad banner scrolls with the content, right under the header */}
        <AdBanner />

        {feedback && (
          <Banner
            type={feedback.type}
            message={feedback.message}
            onDismiss={dismissFeedback}
          />
        )}

        {/* Header */}
        <Card>
          <View className="items-center py-3">
            <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-primary-light">
              <Text className="text-2xl font-semibold text-primary-dark">
                {getInitials(user.fullName)}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {user.fullName}
            </Text>
            <Text className="mt-0.5 text-sm text-gray-500">
              Devotee · Sri Vidya Peetam
            </Text>
          </View>
        </Card>

        {isEditing ? (
          /* ---------- Edit mode ---------- */
          <Card title="Edit Profile" icon={Pencil}>
            <View className="gap-4 pt-1">
              <Input
                label="Full Name"
                icon={UserIcon}
                placeholder="Your full name"
                value={form.fullName}
                onChangeText={setField('fullName')}
                error={errors.fullName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              {/* Mobile — read-only */}
              <Input
                label="Mobile Number"
                icon={Phone}
                value={formatMobile(user.mobile)}
                editable={false}
                rightIcon={Lock}
                helperText="Mobile number can’t be changed"
                className="opacity-90"
              />

              <Select
                label="Nakshatram"
                icon={Star}
                placeholder="Select your birth star"
                options={NAKSHATRAMS}
                value={form.nakshatram}
                onChange={setField('nakshatram')}
                error={errors.nakshatram}
              />

              <Input
                label="Gothram"
                icon={Users}
                placeholder="Your gothram"
                value={form.gothram}
                onChangeText={setField('gothram')}
                error={errors.gothram}
                autoCapitalize="words"
                returnKeyType="done"
              />

              <View className="mt-1 flex-row gap-3">
                <View className="flex-1">
                  <Button
                    label="Cancel"
                    variant="outline"
                    leftIcon={X}
                    onPress={cancelEdit}
                    disabled={saving}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Save changes"
                    leftIcon={Check}
                    onPress={save}
                    isLoading={saving}
                  />
                </View>
              </View>
            </View>
          </Card>
        ) : (
          /* ---------- View mode ---------- */
          <>
            <Card title="My Details">
              <DetailRow
                icon={UserIcon}
                label="Full Name"
                value={user.fullName}
              />
              <View className="h-px bg-gray-100" />
              <DetailRow
                icon={Phone}
                label="Mobile Number"
                value={formatMobile(user.mobile)}
              />
              <View className="h-px bg-gray-100" />
              <DetailRow
                icon={Star}
                label="Nakshatram"
                value={user.nakshatram}
              />
              <View className="h-px bg-gray-100" />
              <DetailRow icon={Users} label="Gothram" value={user.gothram} />
            </Card>

            <SevaStatusCard />

            <Button
              label="Edit Profile"
              leftIcon={Pencil}
              onPress={startEdit}
            />

            {/* Visually separated so a quick tap on Edit never hits Log out */}
            <View className="mt-2 border-t border-gray-200 pt-4">
              <Button
                label="Log out"
                variant="outline"
                leftIcon={LogOut}
                onPress={confirmLogout}
              />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
