import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Phone, User, ArrowRight, ArrowLeft } from 'lucide-react-native';

import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { forgotPasswordSchema, validate } from '../../validation/authValidation';
import { normalizeMobile } from '../../utils/format';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { verifyIdentity, submitting, error, clearError } = useAuth();

  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onContinue = async () => {
    clearError();
    const result = validate(forgotPasswordSchema, { mobile, fullName });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    const matched = await verifyIdentity(result.data);
    if (matched) {
      navigation.navigate('ResetPassword', {
        mobile: normalizeMobile(mobile),
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
      <Input
        label="Mobile Number"
        icon={Phone}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        maxLength={10}
        value={mobile}
        onChangeText={setMobile}
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
