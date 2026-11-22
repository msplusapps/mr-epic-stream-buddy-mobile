import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '@/store/useThemeStore';

export default function AuthLayout() {
  const { theme } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="activate" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
