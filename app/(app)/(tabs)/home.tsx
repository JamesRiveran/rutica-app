import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getAllBusinesses } from '@/services/businesses';

export default function HomeScreen() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const data = await getAllBusinesses();
      setBusinesses(data ?? []);
    } catch (e) {
      console.error('[HOME]', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text style={styles.loading}>Cargando comercios…</Text>;
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={businesses}
      keyExtractor={(item) => item.id_bus}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name_bus}</Text>
          {item.description_bus && (
            <Text style={styles.description}>
              {item.description_bus}
            </Text>
          )}
          <Text style={styles.status}>
            Estado: {item.moderation_status_bus}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loading: {
    padding: 24,
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
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  status: {
    fontSize: 13,
    color: '#007AFF',
  },
});
