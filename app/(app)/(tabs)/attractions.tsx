import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

interface Attraction {
    id_att: string;
    name_att: string;
    description_att?: string | null;
    category_att?: string | null;
}

export default function AttractionsScreen() {
    const [items, setItems] = useState<Attraction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAttractions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('attractions')
                .select('id_att, name_att, description_att, category_att')
                .order('created_at_att', { ascending: false });

            if (error) throw error;
            setItems(data ?? []);
        } catch (e) {
            console.error('[ATTRACTIONS]', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttractions();
    }, []);

    return (
        <FlatList
            contentContainerStyle={styles.container}
            data={items}
            keyExtractor={(item) => item.id_att}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={fetchAttractions} />
            }
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <Text style={styles.title}>{item.name_att}</Text>
                    {item.category_att ? (
                        <Text style={styles.chip}>{item.category_att}</Text>
                    ) : null}
                    {item.description_att ? (
                        <Text style={styles.desc}>{item.description_att}</Text>
                    ) : null}
                </View>
            )}
            ListEmptyComponent={
                !loading ? (
                    <Text style={styles.empty}>No hay atracciones disponibles</Text>
                ) : null
            }
        />
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 32,
        paddingHorizontal: 40,
        flexGrow: 1,
        backgroundColor: '#f7f8fa',
        maxWidth: 1400,
        marginHorizontal: 'auto' as any,
        width: '100%' as any,
    },
    card: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 6,
    },
    chip: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F0FE',
        color: '#1D4ED8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        fontWeight: '600',
        marginBottom: 6,
        fontSize: 12,
    },
    desc: {
        color: '#444',
        fontSize: 14,
        lineHeight: 20,
    },
    empty: {
        padding: 24,
        textAlign: 'center',
        color: '#666',
    },
});
