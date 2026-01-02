import { supabase } from '@/lib/supabase';
import { getShadowStyle } from '@/utils/shadowHelper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ManageBusinessDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [business, setBusiness] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[MANAGE DETAIL] ID recibido:', id);
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const businessId = Array.isArray(id) ? id[0] : id;
            console.log('[LOADDATA] businessId:', businessId);
            if (!businessId) {
                setLoading(false);
                return;
            }

            // Cargar negocio
            const { data: bizData } = await supabase
                .from('businesses')
                .select(`
                    id_bus,
                    name_bus,
                    description_bus,
                    moderation_status_bus,
                    business_images ( bucket_bim, path_bim, sort_order_bim ),
                    locations ( district_loc, canton_loc, province_loc )
                `)
                .eq('id_bus', businessId)
                .single();

            console.log('[BIZDATA]', bizData);
            setBusiness(bizData);

            // Cargar productos del negocio
            if (bizData) {
                const { data: prodData, error: prodError } = await supabase
                    .from('products')
                    .select(`
                        id_prd,
                        name_prd,
                        description_prd,
                        price_prd,
                        currency_prd,
                        is_active_prd
                    `)
                    .eq('business_id_prd', businessId)
                    .eq('is_active_prd', true)
                    .order('created_at_prd', { ascending: false });

                if (prodError) {
                    console.error('[PRODUCTS ERROR]', prodError);
                } else {
                    console.log('[PRODUCTS LOADED]', prodData);

                    // Cargar imágenes por separado si hay productos
                    if (prodData && prodData.length > 0) {
                        const prodIds = prodData.map((p: any) => p.id_prd);
                        const { data: imagesData } = await supabase
                            .from('product_images')
                            .select('product_id_pim, bucket_pim, path_pim, sort_order_pim')
                            .in('product_id_pim', prodIds)
                            .order('sort_order_pim', { ascending: true });

                        // Mapear imágenes a productos
                        const imageMap: Record<string, any> = {};
                        (imagesData ?? []).forEach((img: any) => {
                            if (!imageMap[img.product_id_pim]) {
                                imageMap[img.product_id_pim] = img;
                            }
                        });

                        const productsWithImages = prodData.map((p: any) => ({
                            ...p,
                            product_images: imageMap[p.id_prd] ? [imageMap[p.id_prd]] : [],
                        }));

                        setProducts(productsWithImages);
                    } else {
                        setProducts([]);
                    }
                }
            }
        } catch (e) {
            console.error('[MANAGE BUSINESS DETAIL]', e);
        } finally {
            setLoading(false);
        }
    };

    const image = useMemo(() => {
        const first = business?.business_images?.[0];
        if (!first || !first.bucket_bim || !first.path_bim) return null;
        return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${first.bucket_bim}/${first.path_bim}`;
    }, [business]);

    if (loading) {
        return <Text style={{ padding: 24 }}>Cargando…</Text>;
    }

    if (!business) {
        return <Text style={{ padding: 24 }}>No se encontró el negocio</Text>;
    }

    return (
        <ScrollView style={styles.screen}>
            {/* HERO */}
            <View style={styles.heroWrapper}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.hero} />
                ) : (
                    <View style={[styles.hero, styles.heroPlaceholder]} />
                )}

                <Pressable
                    style={styles.backButton}
                    onPress={() => router.replace('/(app)/(tabs)/manage')}
                >
                    <Ionicons name="arrow-back" size={20} color="#111" />
                    <Text style={styles.backText}>Volver</Text>
                </Pressable>
            </View>

            {/* CONTENT */}
            <View style={styles.contentCard}>
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{business.name_bus}</Text>
                    </View>
                </View>

                {business.description_bus && (
                    <Text style={styles.description}>{business.description_bus}</Text>
                )}

                {business.locations && (
                    <View style={styles.locationRow}>
                        <Ionicons name="location-sharp" size={16} color="#555" />
                        <Text style={styles.locationText} numberOfLines={2}>
                            {business.locations.district_loc}
                            {business.locations.canton_loc ? `, ${business.locations.canton_loc}` : ''}
                            {business.locations.province_loc ? `, ${business.locations.province_loc}` : ''}
                        </Text>
                    </View>
                )}

                {/* ESTADO */}
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Estado:</Text>
                    <View
                        style={[
                            styles.statusBadge,
                            business.moderation_status_bus === 'approved' && styles.statusApproved,
                            business.moderation_status_bus === 'pending' && styles.statusPending,
                            business.moderation_status_bus === 'rejected' && styles.statusRejected,
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {business.moderation_status_bus === 'approved'
                                ? 'Aprobado'
                                : business.moderation_status_bus === 'pending'
                                    ? 'Pendiente'
                                    : 'Rechazado'}
                        </Text>
                    </View>
                </View>

                {/* PRODUCTOS */}
                <View style={styles.productsHeader}>
                    <Text style={styles.sectionTitle}>Productos ({products.length})</Text>
                    <Pressable
                        style={styles.addButton}
                        onPress={() =>
                            router.push({
                                pathname: '/(app)/(tabs)/products/create_new',
                                params: { businessId: id },
                            })
                        }
                    >
                        <Text style={styles.addButtonText}>+ Agregar</Text>
                    </Pressable>
                </View>

                {products.length === 0 ? (
                    <Text style={styles.emptyText}>Este negocio aún no tiene productos.</Text>
                ) : (
                    <FlatList
                        data={products}
                        keyExtractor={(item) => item.id_prd}
                        scrollEnabled={false}
                        renderItem={({ item }) => {
                            const productImage = item.product_images?.[0];
                            const imageUrl = productImage?.bucket_pim
                                ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${productImage.bucket_pim}/${productImage.path_pim}`
                                : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=60';

                            return (
                                <View style={styles.productCard}>
                                    <Image source={{ uri: imageUrl }} style={styles.productImage} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.productTitle}>{item.name_prd}</Text>
                                        {item.description_prd && (
                                            <Text style={styles.productDesc} numberOfLines={2}>
                                                {item.description_prd}
                                            </Text>
                                        )}
                                        <Text style={styles.productPrice}>
                                            {item.currency_prd ?? 'CRC'} {Number(item.price_prd).toLocaleString()}
                                        </Text>
                                    </View>
                                    <Pressable style={styles.editButton}>
                                        <Ionicons name="pencil" size={18} color="#10b981" />
                                    </Pressable>
                                </View>
                            );
                        }}
                    />
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f6f7',
    },
    heroWrapper: {
        position: 'relative',
    },
    hero: {
        width: '100%',
        height: 240,
    },
    heroPlaceholder: {
        backgroundColor: '#dfe3e6',
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
    },
    backText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#111',
    },
    contentCard: {
        marginTop: -36,
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 18,
        elevation: 2,
        ...getShadowStyle({
            color: '#000',
            offsetY: 4,
            opacity: 0.05,
            radius: 6,
        }),
        marginBottom: 32,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },
    description: {
        fontSize: 14,
        color: '#444',
        marginBottom: 16,
        lineHeight: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        marginLeft: 6,
        fontSize: 13,
        color: '#555',
        flex: 1,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    statusLabel: {
        fontWeight: '600',
        marginRight: 8,
        color: '#555',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    statusApproved: {
        backgroundColor: '#E7F8ED',
    },
    statusPending: {
        backgroundColor: '#FEF3C7',
    },
    statusRejected: {
        backgroundColor: '#FEE2E2',
    },
    statusText: {
        fontWeight: '600',
        fontSize: 12,
    },
    productsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    addButton: {
        backgroundColor: '#10b981',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#e5e7eb',
    },
    productTitle: {
        fontWeight: '700',
        fontSize: 14,
        color: '#111',
        marginBottom: 4,
    },
    productDesc: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    productPrice: {
        fontWeight: '600',
        fontSize: 13,
        color: '#0EA5E9',
    },
    editButton: {
        padding: 8,
    },
});
