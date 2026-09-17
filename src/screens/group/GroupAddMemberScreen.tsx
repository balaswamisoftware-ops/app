import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Info, Star, User, UserPlus, Users } from 'lucide-react-native';

import type { GroupStackParamList } from '../../navigation/AppNavigator';
import { Banner, Button, Input, PhoneInput, Select } from '../../components/ui';
import { NAKSHATRAMS } from '../../constants/nakshatram';
import { combineMobile, DEFAULT_DIAL_CODE } from '../../constants/countryCodes';
import { colors } from '../../constants/theme';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { useGroupStore } from '../../store/useGroupStore';
import { addMemberSchema } from '../../validation/groupValidation';
import { validate } from '../../validation/authValidation';

type Props = NativeStackScreenProps<GroupStackParamList, 'GroupAddMember'>;

interface FormState {
  fullName: string;
  mobile: string;
  nakshatram: string;
  gothram: string;
}

const initialForm: FormState = { fullName: '', mobile: '', nakshatram: '', gothram: '' };

/**
 * Register a NEW devotee into the leader's group. The devotee gets a real
 * account (so their chants count everywhere) with a password nobody sees; they
 * can take it over later through Forgot password.
 */
export function GroupAddMemberScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const [form, setForm] = useState<FormState>(initialForm);
  const [dialCode, setDialCode] = useState(DEFAULT_DIAL_CODE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: keyof FormState) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    setError(null);
    const result = validate(addMemberSchema, {
      ...form,
      mobile: combineMobile(dialCode, form.mobile),
    });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const added = await useGroupStore.getState().addMember(result.data);
      // Straight to their page — recording chants is usually the next step.
      navigation.replace('GroupMember', { userId: added.userId, justAdded: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not register the devotee.');
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="p-4 gap-4 w-full max-w-[600px] self-center"
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 + keyboardHeight }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4">
        <Info size={18} color={colors.primary} />
        <Text className="flex-1 text-sm leading-5 text-gray-600">
          Register someone you’ll chant for. They join your group straight away. If they later
          want the app themselves, they can sign in using “Forgot password” with this mobile
          number and name.
        </Text>
      </View>

      {error ? <Banner type="error" message={error} onDismiss={() => setError(null)} /> : null}

      <View className="gap-1 rounded-2xl border border-gray-100 bg-white p-4">
        <Input
          label="Full Name"
          icon={User}
          placeholder="Devotee’s full name"
          value={form.fullName}
          onChangeText={setField('fullName')}
          error={errors.fullName}
          autoCapitalize="words"
        />

        <PhoneInput
          label="Mobile Number"
          dialCode={dialCode}
          number={form.mobile}
          onChangeDialCode={setDialCode}
          onChangeNumber={setField('mobile')}
          error={errors.mobile}
        />

        <Select
          label="Nakshatram"
          icon={Star}
          placeholder="Select their birth star"
          options={NAKSHATRAMS}
          value={form.nakshatram}
          onChange={setField('nakshatram')}
          error={errors.nakshatram}
        />

        <Input
          label="Gothram"
          icon={Users}
          placeholder="Their gothram"
          value={form.gothram}
          onChangeText={setField('gothram')}
          error={errors.gothram}
          autoCapitalize="words"
        />
      </View>

      <Button
        label="Register devotee"
        leftIcon={UserPlus}
        size="lg"
        isLoading={submitting}
        onPress={onSubmit}
      />
    </ScrollView>
  );
}
