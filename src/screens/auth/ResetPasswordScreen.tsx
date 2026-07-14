import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Lock, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react-native';

import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button, Dialog, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { resetPasswordSchema, validate } from '../../validation/authValidation';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const { mobile, fullName } = route.params;
  const { resetPassword, submitting, error, clearError } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successOpen, setSuccessOpen] = useState(false);

  const onSubmit = async () => {
    clearError();
    const result = validate(resetPasswordSchema, { password, confirmPassword });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    const ok = await resetPassword({
      mobile,
      fullName,
      newPassword: result.data.password,
    });
    if (ok) {
      setSuccessOpen(true);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your account"
      error={error}
    >
      <Input
        label="New Password"
        icon={Lock}
        placeholder="At least 6 characters"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        rightIcon={showPassword ? EyeOff : Eye}
        onRightIconPress={() => setShowPassword(v => !v)}
      />

      <Input
        label="Confirm Password"
        icon={Lock}
        placeholder="Re-enter your new password"
        secureTextEntry={!showPassword}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
      />

      <Button
        className="mt-2"
        label="Update Password"
        leftIcon={Check}
        size="lg"
        isLoading={submitting}
        onPress={onSubmit}
      />

      <Dialog
        visible={successOpen}
        onClose={() => setSuccessOpen(false)}
        icon={ShieldCheck}
        tone="success"
        title="Password updated"
        message="Your password has been reset. Please log in with your new password."
        actions={[{ label: 'Log in', onPress: () => navigation.popToTop() }]}
      />
    </AuthLayout>
  );
}
