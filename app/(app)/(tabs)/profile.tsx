import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getMyProfile } from '@/services/profiles';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (e) {
      console.error('[PROFILE]', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 16 }}>
        Mi perfil
      </Text>

      <Text>Nombre: {profile.full_name_prf}</Text>
      <Text>Teléfono: {profile.phone_number_prf ?? 'No registrado'}</Text>
      <Text>Rol: {profile.role_prf}</Text>
    </View>
  );
}
