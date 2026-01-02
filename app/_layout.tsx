import { supabase } from '@/lib/supabase';
import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import Toast from 'react-native-toast-message';

export default function AppLayout() {
  useEffect(() => {
    console.log('[ROOT LAYOUT] Montado');

    // Manejar deep links para recuperación de contraseña
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('[DEEP LINK]:', url);

      // Verificar si es un link de reset password
      if (url.includes('/reset-password') || url.includes('type=recovery')) {
        // Extraer el token de acceso del URL
        const hashParams = new URL(url).hash.substring(1);
        const params = new URLSearchParams(hashParams);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          // Establecer la sesión con el token
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          // Redirigir a la pantalla de reset password
          router.replace('/(auth)/reset-password');
        }
      }
    };

    // Escuchar cambios de URL
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Verificar si la app se abrió con un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
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
      <Toast />
    </>
  );
}
