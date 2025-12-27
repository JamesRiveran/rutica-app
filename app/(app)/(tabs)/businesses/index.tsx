import { supabase } from '@/lib/supabase';
import { getBusinessesByOwner } from '@/services/businesses';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function BusinessesScreen() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role_prf')
        .eq('id_prf', auth.user.id)
        .single();

      if (!profile) return;

      setRole(profile.role_prf);

      if (profile.role_prf === 'seller') {
        const data = await getBusinessesByOwner(auth.user.id);
        setBusinesses(data ?? []);
      }
    } catch (e) {
      console.error('[BUSINESSES]', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text style={styles.loading}>Cargando…</Text>;
  }

  if (role !== 'seller') {
    return (
      <View style={styles.center}>
        <Text>No tienes comercios registrados</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={businesses}
      keyExtractor={(item) => item.id_bus}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name_bus}</Text>
          <Text style={styles.status}>
            Estado: {item.moderation_status_bus}
          </Text>
        </View>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <Pressable
            style={styles.createButton}
            onPress={() =>
              router.push('/(app)/(tabs)/businesses/create')
            }
          >
            <Text style={styles.createText}>+ Registrar comercio</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  loading: {
    padding: 24,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    marginTop: 4,
    fontSize: 13,
    color: '#007AFF',
  },
  footer: {
    marginTop: 16,
  },
  createButton: {
    padding: 14,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  createText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
