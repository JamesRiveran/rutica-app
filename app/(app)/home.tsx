import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8 }}>
        Bienvenido a Rutica
      </Text>

      <Text style={{ marginBottom: 24 }}>
        Esta es la pantalla principal de la aplicación.
      </Text>

      <Button
        title="Ir a mi perfil"
        onPress={() => router.push('/(app)/profile')}
      />

      <View style={{ marginTop: 16 }}>
        <Button title="Cerrar sesión" onPress={handleLogout} />
      </View>
    </View>
  );
}
