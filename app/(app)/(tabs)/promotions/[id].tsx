import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function PromotionDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [promo, setPromo] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) {
                setLoading(false);
                setError('Promoción no encontrada');
                return;
            }
            try {
                setLoading(true);
                const { data: auth } = await supabase.auth.getUser();
                const userId = auth.user?.id ?? null;

                console.log('[PROMO] Loading promotion with id:', id);

                // Cargar la promoción
                const { data: promoData, error: promoError } = await supabase
                    .from('promotions')
                    .select('*')
                    .eq('id_prm', id)
                    .single();

                if (promoError || !promoData) {
                    console.error('[PROMO LOAD ERROR]', promoError);
                    setError('No pudimos cargar esta promoción');
                    setPromo(null);
                    setLoading(false);
                    return;
                }

                console.log('[PROMO] Base data loaded:', promoData);

                // Verificar permisos
                const canView = promoData.moderation_status_prm === 'approved' || promoData.created_by_prm === userId;
                if (!canView) {
                    setError('Esta promoción no está disponible');
                    setPromo(null);
                    setLoading(false);
                    return;
                }

                // Cargar datos relacionados del negocio
                let businessData = null;
                if (promoData.business_id_prm) {
                    const { data: biz } = await supabase
                        .from('businesses')
                        .select('id_bus, name_bus, description_bus, location_id_bus')
                        .eq('id_bus', promoData.business_id_prm)
                        .single();

                    if (biz && biz.location_id_bus) {
                        const { data: loc } = await supabase
                            .from('locations')
                            .select('province_loc, canton_loc, district_loc')
                            .eq('id_loc', biz.location_id_bus)
                            .single();
                        businessData = { ...biz, locations: loc };
                    } else {
                        businessData = biz;
                    }
                }

                // Cargar imágenes del negocio
                let businessImages: any[] = [];
                if (promoData.business_id_prm) {
                    const { data: imgs } = await supabase
                        .from('business_images')
                        .select('bucket_bim, path_bim, sort_order_bim')
                        .eq('business_id_bim', promoData.business_id_prm)
                        .order('sort_order_bim', { ascending: true });
                    businessImages = imgs || [];
                }

                // Cargar productos asociados
                const { data: promoProdLinks } = await supabase
                    .from('promotion_products')
                    .select('product_id_ppr')
                    .eq('promotion_id_ppr', id);

                let products: any[] = [];
                if (promoProdLinks && promoProdLinks.length > 0) {
                    const productIds = promoProdLinks.map((link: any) => link.product_id_ppr);
                    const { data: prods } = await supabase
                        .from('products')
                        .select('id_prd, name_prd, price_prd, currency_prd')
                        .in('id_prd', productIds);
                    products = prods || [];
                }

                // Construir el objeto completo
                const fullPromo = {
                    ...promoData,
                    businesses: businessData,
                    business_images: businessImages,
                    promotion_products: products.map((p: any) => ({ products: p })),
                };

                console.log('[PROMO] Full data assembled:', fullPromo);
                setPromo(fullPromo);
                setError(null);
            } catch (e: any) {
                console.error('[PROMO LOAD EXCEPTION]', e);
                setError(e?.message || 'No pudimos cargar esta promoción');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const heroImage = useMemo(() => {
        const hero = promo?.business_images?.find((img: any) => img.path_bim);
        if (!hero) return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
        return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.bucket_bim}/${hero.path_bim}`;
    }, [promo]);

    const discountLabel = useMemo(() => {
        if (!promo) return null;
        if (promo.discount_type_prm === 'percentage') {
            return `${promo.discount_value_prm}% de descuento`;
        }
        if (promo.discount_type_prm === 'fixed') {
            return `Ahorra ${promo.discount_value_prm}`;
        }
        return 'Promoción';
    }, [promo]);

    const dateRange = useMemo(() => {
        if (!promo?.start_at_prm || !promo?.end_at_prm) return null;
        const start = new Date(promo.start_at_prm);
        const end = new Date(promo.end_at_prm);
        return `${start.toLocaleDateString('es-CR')} - ${end.toLocaleDateString('es-CR')}`;
    }, [promo]);

    const products = useMemo(() => {
        return (
            promo?.promotion_products?.map((p: any) => p.products).filter(Boolean) ?? []
        );
    }, [promo]);

    const businessLocation = useMemo(() => {
        const loc = promo?.businesses?.locations;
        if (!loc) return null;
        return [loc.district_loc, loc.canton_loc, loc.province_loc].filter(Boolean).join(', ');
    }, [promo]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.helper}>Cargando promoción…</Text>
            </View>
        );
    }

    if (error || !promo) {
        return (
            <View style={styles.centered}>
                <Text style={styles.title}>Promoción</Text>
                <Text style={styles.helper}>{error ?? 'No disponible'}</Text>
                <Pressable style={styles.primaryButton} onPress={() => router.back()}>
                    <Text style={styles.primaryButtonText}>Volver</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Pressable style={styles.backRow} onPress={() => router.back()}>
                <Text style={styles.backText}>Atrás</Text>
            </Pressable>

            <View style={styles.heroWrap}>
                <Image source={{ uri: heroImage }} style={styles.heroImage} />
                <View style={styles.heroOverlay} />
                {discountLabel ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{discountLabel}</Text>
                    </View>
                ) : null}
                <View style={styles.heroTextBox}>
                    <Text style={styles.heroTitle}>{promo.title_prm}</Text>
                    {promo.businesses?.name_bus ? (
                        <Text style={styles.heroSubtitle}>{promo.businesses.name_bus}</Text>
                    ) : null}
                </View>
            </View>

            <View style={styles.card}>
                {dateRange ? <Text style={styles.helper}>Válida: {dateRange}</Text> : null}
                {promo.scope_prm ? (
                    <View style={styles.chipRow}>
                        <Text style={styles.chip}>Tipo: {promo.scope_prm}</Text>
                    </View>
                ) : null}
                {promo.description_prm ? (
                    <Text style={styles.body}>{promo.description_prm}</Text>
                ) : (
                    <Text style={styles.helper}>Sin descripción</Text>
                )}

                {promo.businesses ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Negocio</Text>
                        <Text style={styles.sectionBody}>{promo.businesses.name_bus}</Text>
                        {promo.businesses.description_bus ? (
                            <Text style={styles.sectionHelper}>{promo.businesses.description_bus}</Text>
                        ) : null}
                        {businessLocation ? (
                            <Text style={styles.sectionHelper}>{businessLocation}</Text>
                        ) : null}
                        <Pressable
                            style={[styles.primaryButton, { marginTop: 12 }]}
                            onPress={() =>
                                router.push({
                                    pathname: '/(app)/(tabs)/businesses/[id]',
                                    params: { id: promo.businesses.id_bus },
                                })
                            }
                        >
                            <Text style={styles.primaryButtonText}>Ver negocio</Text>
                        </Pressable>
                    </View>
                ) : null}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Aplicado a</Text>
                    {products.length === 0 ? (
                        <Text style={styles.helper}>Sin productos específicos</Text>
                    ) : (
                        products.map((prod: any) => (
                            <View key={prod.id_prd} style={styles.productRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productTitle}>{prod.name_prd}</Text>
                                    <Text style={styles.productPrice}>
                                        {prod.currency_prd ?? 'CRC'} {Number(prod.price_prd).toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingHorizontal: 40,
        paddingBottom: 32,
        backgroundColor: '#f8fafc',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f8fafc',
    },
    backRow: {
        marginBottom: 12,
    },
    backText: {
        color: '#10b981',
        fontWeight: '700',
    },
    heroWrap: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        marginBottom: 16,
    },
    heroImage: {
        width: '100%',
        height: 220,
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    heroTextBox: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 16,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    heroSubtitle: {
        color: '#e2e8f0',
        marginTop: 6,
        fontSize: 14,
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#F97316',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    body: {
        color: '#1f2937',
        fontSize: 15,
        lineHeight: 22,
        marginTop: 10,
    },
    helper: {
        color: '#6b7280',
        fontSize: 13,
    },
    section: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
    },
    sectionTitle: {
        fontWeight: '800',
        fontSize: 16,
        color: '#0f172a',
    },
    sectionBody: {
        marginTop: 4,
        fontSize: 14,
        color: '#1f2937',
    },
    sectionHelper: {
        marginTop: 2,
        fontSize: 13,
        color: '#6b7280',
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    chip: {
        backgroundColor: '#eef2ff',
        color: '#3730a3',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        fontWeight: '700',
        overflow: 'hidden',
    },
    productRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    productTitle: {
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '700',
    },
    productPrice: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    primaryButton: {
        backgroundColor: '#10b981',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
