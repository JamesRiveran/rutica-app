import { View, Text, Button } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function HomeScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 12 }}>
        Rutica
      </Text>

      <Text style={{ marginBottom: 24 }}>
        Bienvenido a la aplicación.
      </Text>

      <Button title="Cerrar sesión" onPress={handleLogout} />
    </View>
  );
}
