import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { User, ArrowRight, ArrowLeft } from 'lucide-react-native';

import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button, Input, PhoneInput } from '../../components/ui';
import { combineMobile, DEFAULT_DIAL_CODE } from '../../constants/countryCodes';
import { useAuth } from '../../hooks/useAuth';
import { forgotPasswordSchema, validate } from '../../validation/authValidation';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { verifyIdentity, submitting, error, clearError } = useAuth();

  const [dialCode, setDialCode] = useState(DEFAULT_DIAL_CODE);
  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onContinue = async () => {
    clearError();
    const identity = combineMobile(dialCode, mobile);
    const result = validate(forgotPasswordSchema, { mobile: identity, fullName });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    const matched = await verifyIdentity(result.data);
    if (matched) {
      navigation.navigate('ResetPassword', {
        mobile: identity,
        fullName: fullName.trim(),
      });
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Confirm your identity to set a new password"
      error={error}
    >
      <PhoneInput
        label="Mobile Number"
        dialCode={dialCode}
        number={mobile}
        onChangeDialCode={setDialCode}
        onChangeNumber={setMobile}
        error={errors.mobile}
      />

      <Input
        label="Full Name"
        icon={User}
        placeholder="Your registered full name"
        value={fullName}
        onChangeText={setFullName}
        error={errors.fullName}
        autoCapitalize="words"
      />

      <Button
        className="mt-2"
        label="Continue"
        rightIcon={ArrowRight}
        size="lg"
        isLoading={submitting}
        onPress={onContinue}
      />

      <Pressable
        className="mt-4 flex-row items-center justify-center gap-1"
        onPress={() => navigation.goBack()}
        hitSlop={8}
      >
        <ArrowLeft size={16} color="#E8751A" />
        <Text className="font-semibold text-primary">Back to login</Text>
      </Pressable>
    </AuthLayout>
  );
}
