import React, { useRef, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Phone, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';

import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema, validate } from '../../validation/authValidation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, submitting, error, clearError } = useAuth();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordRef = useRef<TextInput>(null);

  const handleMobileChange = (text: string) => {
    // Keep the field digits-only so pasted values like "+91 98765..." don't break validation
    setMobile(text.replace(/\D/g, '').slice(0, 10));
    if (errors.mobile) setErrors(({ mobile: _, ...rest }) => rest);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) setErrors(({ password: _, ...rest }) => rest);
  };

  const onSubmit = async () => {
    Keyboard.dismiss();
    clearError();
    const result = validate(loginSchema, { mobile, password });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    await login(result.data);
    // On success the RootNavigator swaps to the app stack automatically.
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your devotional journey"
      error={error}
    >
      {/* Consistent vertical rhythm between fields */}
      <View className="gap-4">
        <Input
          label="Mobile Number"
          icon={Phone}
          placeholder="10-digit mobile number"
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          onChangeText={handleMobileChange}
          error={errors.mobile}
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
          editable={!submitting}
        />

        <View className="gap-2">
          <Input
            ref={passwordRef}
            label="Password"
            icon={Lock}
            placeholder="Your password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={handlePasswordChange}
            error={errors.password}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconPress={() => setShowPassword(v => !v)}
            autoComplete="password"
            textContentType="password"
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            editable={!submitting}
          />

          {/* Sits tight under the password field, not floating between sections */}
          <Pressable
            className="self-end py-1"
            onPress={() => navigation.navigate('ForgotPassword')}
            hitSlop={8}
            disabled={submitting}
            accessibilityRole="link"
          >
            <Text className="text-sm font-medium text-primary">
              Forgot password?
            </Text>
          </Pressable>
        </View>
      </View>

      <Button
        className="mt-6"
        label="Login"
        leftIcon={LogIn}
        size="lg"
        isLoading={submitting}
        disabled={submitting}
        onPress={onSubmit}
      />

      <View className="mt-6 flex-row items-center justify-center gap-1">
        <Text className="text-sm text-gray-500">Don't have an account?</Text>
        <Pressable
          onPress={() => navigation.navigate('SignUp')}
          hitSlop={8}
          disabled={submitting}
          accessibilityRole="link"
        >
          <Text className="text-sm font-semibold text-primary">
            Create Account
          </Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}