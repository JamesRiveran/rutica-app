import { supabase } from '@/lib/supabase';
import { getShadowStyle } from '@/utils/shadowHelper';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface PromoListItem {
    id_prm: string;
    title_prm: string;
    description_prm?: string | null;
    discount_type_prm: string;
    discount_value_prm: number;
    scope_prm?: string | null;
    start_at_prm?: string | null;
    end_at_prm?: string | null;
    businesses?: {
        id_bus: string;
        name_bus: string;
        locations?: {
            province_loc?: string | null;
            canton_loc?: string | null;
            district_loc?: string | null;
        } | null;
    } | null;
    business_images?: Array<{ bucket_bim: string; path_bim: string; sort_order_bim: number }> | null;
    promotion_products?: Array<{ products: { id_prd: string; name_prd: string; price_prd: number; currency_prd?: string | null } | null }> | null;
}

export default function PromotionsScreen() {
    const [promos, setPromos] = useState<PromoListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const { data: auth } = await supabase.auth.getUser();
                const userId = auth.user?.id ?? null;

                // Promos aprobadas (públicas)
                const approvedPromise = supabase
                    .from('promotions')
                    .select(`
            id_prm,
            business_id_prm,
            title_prm,
            description_prm,
            discount_type_prm,
            discount_value_prm,
            scope_prm,
            start_at_prm,
            end_at_prm
          `)
                    .eq('moderation_status_prm', 'approved')
                    .order('created_at_prm', { ascending: false })
                    .limit(200);

                // Promos del dueño (cualquier estado) para que el seller las vea igual que en Gestión
                const minePromise = userId
                    ? supabase
                        .from('promotions')
                        .select(`
                id_prm,
                business_id_prm,
                title_prm,
                description_prm,
                discount_type_prm,
                discount_value_prm,
                scope_prm,
                start_at_prm,
                end_at_prm
              `)
                        .eq('created_by_prm', userId)
                        .order('created_at_prm', { ascending: false })
                        .limit(200)
                    : null;

                const [approvedRes, mineRes] = await Promise.all([approvedPromise, minePromise]);

                const approvedList = approvedRes.data ?? [];
                const mineList = mineRes?.data ?? [];

                // Merge sin duplicados
                const mergedById: Record<string, any> = {};
                [...approvedList, ...mineList].forEach((p: any) => {
                    if (!mergedById[p.id_prm]) mergedById[p.id_prm] = p;
                });
                const mergedPromos = Object.values(mergedById);

                // Cargar nombres de negocios para las promos
                const bizIds = Array.from(
                    new Set(
                        mergedPromos
                            .map((p: any) => p.business_id_prm)
                            .filter((v) => !!v)
                    )
                );

                let bizMap: Record<string, any> = {};
                if (bizIds.length > 0) {
                    const { data: bizRows } = await supabase
                        .from('businesses')
                        .select('id_bus, name_bus, locations ( province_loc, canton_loc, district_loc )')
                        .in('id_bus', bizIds);
                    bizMap = (bizRows ?? []).reduce((acc: any, b: any) => {
                        acc[b.id_bus] = b;
                        return acc;
                    }, {});
                }

                // Primera imagen del negocio
                let imageMap: Record<string, any> = {};
                if (bizIds.length > 0) {
                    const { data: imgRows } = await supabase
                        .from('business_images')
                        .select('business_id_bim, bucket_bim, path_bim, sort_order_bim')
                        .in('business_id_bim', bizIds)
                        .order('sort_order_bim', { ascending: true });

                    imageMap = (imgRows ?? []).reduce((acc: any, img: any) => {
                        const key = img.business_id_bim;
                        if (!acc[key] || img.sort_order_bim < acc[key].sort_order_bim) {
                            acc[key] = img;
                        }
                        return acc;
                    }, {});
                }

                // Productos de las promos
                const promIds = mergedPromos.map((p: any) => p.id_prm);
                let prodsMap: Record<string, any[]> = {};
                if (promIds.length > 0) {
                    const { data: prodRows } = await supabase
                        .from('promotion_products')
                        .select('promotion_id_ppr, products ( id_prd, name_prd, price_prd, currency_prd )')
                        .in('promotion_id_ppr', promIds);

                    prodsMap = (prodRows ?? []).reduce((acc: any, pp: any) => {
                        if (!acc[pp.promotion_id_ppr]) acc[pp.promotion_id_ppr] = [];
                        if (pp.products) acc[pp.promotion_id_ppr].push(pp);
                        return acc;
                    }, {});
                }

                const enriched = mergedPromos.map((p: any) => ({
                    ...p,
                    businesses: bizMap[p.business_id_prm] ?? null,
                    business_images: imageMap[p.business_id_prm]
                        ? [imageMap[p.business_id_prm]]
                        : [],
                    promotion_products: prodsMap[p.id_prm] ?? [],
                }));

                setPromos(enriched);
                setError(null);
            } catch (e) {
                console.error('[PROMOTIONS]', e);
                setError('No pudimos cargar promociones');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const items = useMemo(() => promos ?? [], [promos]);

    const renderProductBadges = (item: PromoListItem) => {
        const products = item.promotion_products?.map((p) => p.products).filter(Boolean) ?? [];
        if (products.length === 0) return null;
        return (
            <View style={styles.badgesRow}>
                {products.slice(0, 3).map((prod) => (
                    <View key={prod!.id_prd} style={styles.badge}>
                        <Text style={styles.badgeText}>{prod!.name_prd}</Text>
                    </View>
                ))}
                {products.length > 3 ? (
                    <View style={styles.badgeMuted}>
                        <Text style={styles.badgeTextMuted}>+{products.length - 3}</Text>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderScopeChip = (scope?: string | null) => {
        if (!scope) return null;
        return (
            <View style={styles.scopeChip}>
                <Text style={styles.scopeChipText}>{scope}</Text>
            </View>
        );
    };

    const renderLocation = (item: PromoListItem) => {
        const loc = item.businesses?.locations;
        if (!loc) return null;
        const str = [loc.district_loc, loc.canton_loc, loc.province_loc].filter(Boolean).join(', ');
        if (!str) return null;
        return <Text style={styles.metaText}>{str}</Text>;
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.helper}>Cargando promociones</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.title}>Promociones</Text>
                <Text style={styles.helper}>{error}</Text>
                <Pressable style={styles.primaryButton} onPress={() => router.replace('/(app)/(tabs)/promotions')}>
                    <Text style={styles.primaryButtonText}>Reintentar</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.flex}>
            <View style={styles.header}>
                <Text style={styles.title}>Promociones</Text>
                <Text style={styles.helper}>Descubre descuentos y combos publicados por los comercios.</Text>
            </View>

            {items.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.helper}>No hay promociones disponibles.</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    numColumns={3}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContainer}
                    keyExtractor={(item) => item.id_prm}
                    renderItem={({ item }) => {
                        const hero = item.business_images?.find((img) => img.path_bim);
                        const imageUrl = hero
                            ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_bim}/${hero.path_bim}`
                            : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';

                        const discountLabel = item.discount_type_prm === 'percentage'
                            ? `${item.discount_value_prm}% desc`
                            : 'Promoción';

                        const dateRange = item.start_at_prm && item.end_at_prm
                            ? `${new Date(item.start_at_prm).toLocaleDateString('es-CR')} - ${new Date(item.end_at_prm).toLocaleDateString('es-CR')}`
                            : null;

                        return (
                            <Pressable
                                style={styles.cardItem}
                                onPress={() =>
                                    router.push({
                                        pathname: '/(app)/(tabs)/promotions/[id]',
                                        params: { id: item.id_prm },
                                    })
                                }
                            >
                                <View style={styles.cardInner}>
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.cardImage}
                                    />
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountBadgeText}>{discountLabel}</Text>
                                    </View>

                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle} numberOfLines={2}>{item.title_prm}</Text>
                                        <Text style={styles.cardBusiness} numberOfLines={1}>{item.businesses?.name_bus ?? ''}</Text>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        {renderScopeChip(item.scope_prm)}
                                    </View>
                                </View>
                            </Pressable>
                        );
                    }}
                    scrollEnabled={true}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: '#f7f8fa',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    listContainer: {
        paddingVertical: 8,
        paddingBottom: 32,
        paddingHorizontal: 40,
        maxWidth: 1400,
        marginHorizontal: 'auto' as any,
        width: '100%' as any,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginBottom: 8,
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
    },
    helper: {
        color: '#6b7280',
        marginTop: 4,
        marginBottom: 12,
    },
    cardItem: {
        flex: 1 / 3,
        minWidth: 0,
    },
    cardInner: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        ...getShadowStyle({
            color: '#000',
            offsetY: 2,
            opacity: 0.08,
            radius: 4,
        }),
    },
    cardImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#e5e7eb',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#F97316',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    discountBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
    },
    cardContent: {
        padding: 10,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    cardBusiness: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '500',
    },
    cardFooter: {
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    scopeChip: {
        backgroundColor: '#eef2ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    scopeChipText: {
        color: '#3730a3',
        fontWeight: '700',
        fontSize: 10,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    badge: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    badgeText: {
        color: '#0ea5e9',
        fontWeight: '700',
        fontSize: 12,
    },
    badgeMuted: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    badgeTextMuted: {
        color: '#374151',
        fontWeight: '700',
        fontSize: 12,
    },
    primaryButton: {
        backgroundColor: '#10b981',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
        alignItems: 'center',
    },
    metaText: {
        color: '#475569',
        fontSize: 12,
    },
});
