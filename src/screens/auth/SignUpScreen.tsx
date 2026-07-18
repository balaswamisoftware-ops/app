import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  User,
  Star,
  Users,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Check,
} from 'lucide-react-native';

import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button, Input, PhoneInput, Select } from '../../components/ui';
import { NAKSHATRAMS } from '../../constants/nakshatram';
import { combineMobile, DEFAULT_DIAL_CODE } from '../../constants/countryCodes';
import { colors } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { signUpSchema, validate } from '../../validation/authValidation';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

interface FormState {
  fullName: string;
  mobile: string;
  nakshatram: string;
  gothram: string;
  password: string;
  confirmPassword: string;
}

const initialForm: FormState = {
  fullName: '',
  mobile: '',
  nakshatram: '',
  gothram: '',
  password: '',
  confirmPassword: '',
};

export function SignUpScreen({ navigation }: Props) {
  const { signUp, submitting, error, clearError } = useAuth();

  const [form, setForm] = useState<FormState>(initialForm);
  const [dialCode, setDialCode] = useState(DEFAULT_DIAL_CODE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);

  const setField = (key: keyof FormState) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleAgree = () => {
    setAgreed(v => !v);
    setAgreeError(false);
  };

  const onSubmit = async () => {
    clearError();
    // Combine the dial code + local number into the canonical mobile identity.
    const payload = { ...form, mobile: combineMobile(dialCode, form.mobile) };
    const result = validate(signUpSchema, payload);
    // Surface both the field errors and the agreement error together.
    if (!result.success) setErrors(result.errors);
    if (!agreed) setAgreeError(true);
    if (!result.success || !agreed) return;

    setErrors({});
    setAgreeError(false);
    await signUp(result.data);
    // On success the RootNavigator swaps to the app stack automatically.
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register as a devotee of Sri Vidya Peetam"
      error={error}
    >
      <Input
        label="Full Name"
        icon={User}
        placeholder="Your full name"
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

      <Input
        label="Password"
        icon={Lock}
        placeholder="At least 6 characters"
        secureTextEntry={!showPassword}
        value={form.password}
        onChangeText={setField('password')}
        error={errors.password}
        rightIcon={showPassword ? EyeOff : Eye}
        onRightIconPress={() => setShowPassword(v => !v)}
      />

      <Input
        label="Confirm Password"
        icon={Lock}
        placeholder="Re-enter your password"
        secureTextEntry={!showPassword}
        value={form.confirmPassword}
        onChangeText={setField('confirmPassword')}
        error={errors.confirmPassword}
      />

      {/* Required agreement */}
      <View className="mt-1">
        <View className="flex-row items-start gap-2.5">
          <Pressable
            onPress={toggleAgree}
            hitSlop={6}
            className="mt-0.5"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            accessibilityLabel="I agree to the Terms & Conditions and Privacy Policy"
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded-md border-2 ${
                agreed
                  ? 'border-primary bg-primary'
                  : agreeError
                    ? 'border-red-400 bg-white'
                    : 'border-gray-300 bg-white'
              }`}
            >
              {agreed && <Check size={13} color={colors.white} strokeWidth={3} />}
            </View>
          </Pressable>

          <Text className="flex-1 text-sm leading-5 text-gray-600">
            <Text onPress={toggleAgree}>I agree to the </Text>
            <Text
              className="font-semibold text-primary"
              onPress={() => navigation.navigate('Legal', { document: 'terms' })}
            >
              Terms &amp; Conditions
            </Text>
            <Text onPress={toggleAgree}> and </Text>
            <Text
              className="font-semibold text-primary"
              onPress={() => navigation.navigate('Legal', { document: 'privacy' })}
            >
              Privacy Policy
            </Text>
            <Text onPress={toggleAgree}>.</Text>
          </Text>
        </View>

        {agreeError && (
          <Text className="ml-7 mt-1.5 text-xs text-red-500">
            Please accept the Terms &amp; Conditions and Privacy Policy to
            continue.
          </Text>
        )}
      </View>

      <Button
        className="mt-2"
        label="Create Account"
        leftIcon={UserPlus}
        size="lg"
        isLoading={submitting}
        onPress={onSubmit}
      />

      <View className="mt-4 flex-row justify-center gap-1">
        <Text className="text-gray-500">Already have an account?</Text>
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text className="font-semibold text-primary">Login</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
