import { supabase } from '@/lib/supabase';
import { getBusinessesByOwner } from '@/services/businesses';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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

  // Recargar datos cada vez que la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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

      if (profile.role_prf === 'seller' || profile.role_prf === 'admin') {
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

  // Usuario comprador (buyer) - mostrar botón para crear primer comercio
  if (role === 'buyer') {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>¡Conviértete en vendedor!</Text>
        <Text style={styles.emptySubtitle}>
          Registra tu primer comercio o emprendimiento
        </Text>
        <Pressable
          style={styles.createButtonCentered}
          onPress={() => router.push('/(app)/(tabs)/businesses/create')}
        >
          <Text style={styles.createText}>+ Registrar mi comercio</Text>
        </Pressable>
      </View>
    );
  }

  // Usuario seller/admin sin comercios
  if (businesses.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No tienes comercios aún</Text>
        <Text style={styles.emptySubtitle}>
          Registra tu primer comercio
        </Text>
        <Pressable
          style={styles.createButtonCentered}
          onPress={() => router.push('/(app)/(tabs)/businesses/create')}
        >
          <Text style={styles.createText}>+ Registrar comercio</Text>
        </Pressable>
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
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
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
  createButtonCentered: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 200,
  },
  createText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
