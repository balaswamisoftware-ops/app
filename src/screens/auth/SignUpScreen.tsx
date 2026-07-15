import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  User,
  Phone,
  Star,
  Users,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react-native';

import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button, Input, Select } from '../../components/ui';
import { NAKSHATRAMS } from '../../constants/nakshatram';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const setField = (key: keyof FormState) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    clearError();
    const result = validate(signUpSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
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

      <Input
        label="Mobile Number"
        icon={Phone}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        maxLength={10}
        value={form.mobile}
        onChangeText={setField('mobile')}
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
