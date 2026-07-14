import React from 'react';
import {
  ActivityIndicator,
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

import { Banner, Button, Card, IconChip, Input, Select } from '../components/ui';
import { SevaStatusCard } from '../components/profile/SevaStatusCard';
import { NAKSHATRAMS } from '../constants/nakshatram';
import { colors } from '../constants/theme';
import { formatMobile } from '../utils/format';
import { useProfile } from '../hooks/useProfile';

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
    <View className="flex-row items-center gap-3 py-3">
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
          {loadError ?? 'We couldn’t find your profile.'}
        </Text>
        <Button label="Retry" variant="outline" onPress={refresh} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="p-4 gap-4 w-full max-w-[600px] self-center"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
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
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <Text className="text-3xl font-semibold text-gray-700">
              {user.fullName?.charAt(0).toUpperCase() ?? 'D'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{user.fullName}</Text>
          <Text className="mt-0.5 text-sm text-gray-500">
            Devotee · Sri Vidya Peetham
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
                  label="Save"
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
            <DetailRow icon={UserIcon} label="Full Name" value={user.fullName} />
            <View className="h-px bg-gray-100" />
            <DetailRow icon={Phone} label="Mobile Number" value={formatMobile(user.mobile)} />
            <View className="h-px bg-gray-100" />
            <DetailRow icon={Star} label="Nakshatram" value={user.nakshatram} />
            <View className="h-px bg-gray-100" />
            <DetailRow icon={Users} label="Gothram" value={user.gothram} />
          </Card>

          <SevaStatusCard />

          <Button label="Edit Profile" leftIcon={Pencil} onPress={startEdit} />
          <Button
            label="Log out"
            variant="outline"
            leftIcon={LogOut}
            onPress={logout}
          />
        </>
      )}
    </ScrollView>
  );
}
