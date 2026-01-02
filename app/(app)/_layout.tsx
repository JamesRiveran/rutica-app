import { supabase } from '@/lib/supabase';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function AppLayout() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    console.log('[APP LAYOUT] Inicializando...');
    
    supabase.auth.getSession()
      .then(({ data, error }) => {
        console.log('[APP LAYOUT] Sesión obtenida:', { hasSession: !!data.session, error });
        setSession(data.session);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[APP LAYOUT] Error obteniendo sesión:', err);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[APP LAYOUT] Cambio de auth:', _event, !!session);
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!session) {
    console.log('[APP LAYOUT] Sin sesión, redirigiendo a login');
    return <Redirect href="/(auth)/login" />;
  }

  console.log('[APP LAYOUT] Con sesión, mostrando tabs');
  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
