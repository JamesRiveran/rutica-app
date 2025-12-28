import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function AppLayout() {
  useEffect(() => {
    console.log('[ROOT LAYOUT] Montado');
  }, []);

  return (
    <Stack
      screenOptions={{
        headerTitle: 'Rutica',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    />
  );
}
