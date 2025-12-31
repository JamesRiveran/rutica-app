import { supabase } from '@/lib/supabase';
import { getShadowStyle } from '@/utils/shadowHelper';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Role = 'buyer' | 'seller' | 'admin' | null;

type ProfileInfo = {
    id?: string | null;
    email?: string | null;
    full_name_prf?: string | null;
    phone_number_prf?: string | null;
    role_prf?: string | null;
};

export default function ManageScreen() {
    const [role, setRole] = useState<Role>(null);
    const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [promos, setPromos] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const load = useCallback(async () => {
        try {
            const { data: auth } = await supabase.auth.getUser();
            if (!auth.user) {
                setRole(null);
                setBusinesses([]);
                setProducts([]);
                setPromos([]);
                return;
            }

            const userId = auth.user.id;
            const { data: profile } = await supabase
                .from('profiles')
                .select('role_prf, full_name_prf, phone_number_prf')
                .eq('id_prf', userId)
                .single();
            setRole(profile?.role_prf ?? null);
            setProfileInfo(profile ? { ...profile, id: userId, email: auth.user.email ?? null } : { id: userId, email: auth.user.email ?? null });

            // Comercios del owner
            const { data: bizData } = await supabase
                .from('businesses')
                .select(`
                    id_bus,
                    name_bus,
                    description_bus,
                    moderation_status_bus,
                    business_images ( bucket_bim, path_bim, sort_order_bim )
                `)
                .eq('owner_id_bus', userId)
                .eq('is_active_bus', true)
                .order('created_at_bus', { ascending: false });

            const businessesList = bizData ?? [];
            setBusinesses(businessesList);

            // Productos del owner (por sus comercios)
            const bizIds = businessesList.map((b: any) => b.id_bus);
            if (bizIds.length > 0) {
                const { data: prodData } = await supabase
                    .from('products')
                    .select(`
                        id_prd,
                        name_prd,
                        description_prd,
                        price_prd,
                        currency_prd,
                        is_active_prd,
                        businesses ( id_bus, name_bus )
                    `)
                    .in('business_id_prd', bizIds)
                    .eq('is_active_prd', true)
                    .order('created_at_prd', { ascending: false });

                setProducts(prodData ?? []);
            } else {
                setProducts([]);
            }

            // Promociones creadas por el owner
            const { data: promosData } = await supabase
                .from('promotions')
                .select(`
                    id_prm,
                    title_prm,
                    description_prm,
                    discount_type_prm,
                    discount_value_prm,
                    moderation_status_prm,
                    payment_state_prm,
                    start_at_prm,
                    end_at_prm,
                    businesses ( id_bus, name_bus )
                `)
                .eq('created_by_prm', userId)
                .order('created_at_prm', { ascending: false });

            setPromos(promosData ?? []);
        } catch (e) {
            console.error('[MANAGE]', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useFocusEffect(
        useCallback(() => {
            load();
            return undefined;
        }, [load])
    );

    const isSeller = role === 'seller' || role === 'admin';

    const metrics = useMemo(() => {
        return {
            businesses: businesses.length,
            products: products.length,
            promotions: promos.length,
        };
    }, [businesses, products, promos]);

    const initials = useMemo(() => {
        const source = profileInfo?.full_name_prf || profileInfo?.email || '';
        const pieces = source.trim().split(/\s+/).filter(Boolean);
        if (pieces.length === 0) return 'U';
        const letters = pieces.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
        return letters || 'U';
    }, [profileInfo]);

    if (loading) {
        return <Text style={styles.loading}>Cargando…</Text>;
    }

    if (!isSeller) {
        return (
            <View style={styles.center}>
                <Text style={styles.title}>Gestionar</Text>
                <Text style={styles.subtitle}>Solo disponible para vendedores</Text>
                <Text style={styles.note}>
                    Cambia tu rol a vendedor para registrar comercios, atracciones o productos.
                </Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {profileInfo ? (
                <View style={styles.profileShell}>
                    <View style={styles.profileBackdrop}>
                        <View style={styles.profileBackdropGlow} />
                    </View>
                    <View style={styles.profileContent}>
                        <View style={styles.profileTopRow}>
                            <View style={styles.profileAvatar}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.profileName}>{profileInfo.full_name_prf || 'Usuario'}</Text>
                                <Text style={styles.profileSubtitle}>{profileInfo.email || 'Sin correo'}</Text>
                            </View>
                            <View style={styles.profileRolePill}>
                                <Text style={styles.profileRoleText}>{profileInfo.role_prf || 'rol'}</Text>
                            </View>
                        </View>
                        <View style={styles.profileMetaRow}>
                            <View style={styles.metaCard}>
                                <Text style={styles.metaLabel}>Teléfono</Text>
                                <Text style={styles.metaValue}>
                                    {profileInfo.phone_number_prf && profileInfo.phone_number_prf.trim() !== ''
                                        ? profileInfo.phone_number_prf
                                        : 'Sin teléfono'}
                                </Text>
                            </View>
                            <View style={styles.metaCard}>
                                <Text style={styles.metaLabel}>Rol</Text>
                                <Text style={styles.metaValue}>{profileInfo.role_prf || 'Sin rol'}</Text>
                            </View>
                            <View style={styles.metaCard}>
                                <Text style={styles.metaLabel}>ID</Text>
                                <Text style={styles.metaValue} numberOfLines={1}>
                                    {profileInfo.id || '—'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            ) : null}

            <Text style={styles.dashboardTitle}>Dashboard Vendedor</Text>

            {/* Metrics */}
            <View style={styles.metricsRow}>
                <MetricCard label="Negocios" value={metrics.businesses} />
                <MetricCard label="Productos" value={metrics.products} />
                <MetricCard label="Promociones" value={metrics.promotions} />
            </View>

            {/* Quick actions */}
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={styles.actionsRow}>
                <ActionButton
                    label="Crear Negocio"
                    variant="business"
                    onPress={() => router.push('/(app)/(tabs)/businesses/create')}
                />
                <ActionButton
                    label="Gestionar Productos"
                    variant="product"
                    onPress={() => router.push('/(app)/(tabs)/products/create_new')}
                />
                <ActionButton
                    label="Crear Promoción"
                    variant="promo"
                    onPress={() => router.push('/(app)/(tabs)/promotions/create')}
                />
            </View>

            {/* Products list */}
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Mis Productos</Text>
                <Pressable
                    style={styles.addButton}
                    onPress={() => router.push('/(app)/(tabs)/products/create_new')}
                >
                    <Text style={styles.addButtonText}>+ Agregar</Text>
                </Pressable>
            </View>

            {products.length === 0 ? (
                <Text style={styles.emptyText}>Aún no tienes productos.</Text>
            ) : (
                products.map((prod) => (
                    <View key={prod.id_prd} style={styles.productRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.productTitle}>{prod.name_prd}</Text>
                            <Text style={styles.productBiz}>
                                {prod.businesses?.name_bus ?? 'Sin comercio'}
                            </Text>
                            {prod.description_prd ? (
                                <Text style={styles.productDesc} numberOfLines={2}>
                                    {prod.description_prd}
                                </Text>
                            ) : null}
                            <Text style={styles.productPrice}>
                                {prod.currency_prd ?? 'CRC'} {Number(prod.price_prd).toLocaleString()}
                            </Text>
                        </View>
                        <Pressable
                            style={styles.linkButton}
                            onPress={() => router.push('/(app)/(tabs)/products/create_new')}
                        >
                            <Text style={styles.linkButtonText}>Editar</Text>
                        </Pressable>
                    </View>
                ))
            )}

            {/* Businesses list */}
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Mis Negocios</Text>
                <Pressable
                    style={styles.addButton}
                    onPress={() => router.push('/(app)/(tabs)/businesses/create')}
                >
                    <Text style={styles.addButtonText}>+ Agregar</Text>
                </Pressable>
            </View>

            <FlatList
                data={businesses}
                keyExtractor={(item) => item.id_bus}
                scrollEnabled={false}
                renderItem={({ item }) => (
                    <View style={styles.businessCard}>
                        <BusinessThumb images={item.business_images} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.businessTitle}>{item.name_bus}</Text>
                            {item.description_bus ? (
                                <Text style={styles.businessDesc} numberOfLines={2}>
                                    {item.description_bus}
                                </Text>
                            ) : null}
                            <View style={styles.businessActions}>
                                <Pressable
                                    style={styles.linkButton}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/(app)/(tabs)/manage/[id]',
                                            params: { id: item.id_bus },
                                        })
                                    }
                                >
                                    <Text style={styles.linkButtonText}>Gestionar</Text>
                                </Pressable>
                                <StatusPill status={item.moderation_status_bus} />
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No tienes negocios aún.</Text>}
            />

            {/* Promotions list */}
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Mis Promociones</Text>
                <Pressable
                    style={styles.addButton}
                    onPress={() => router.push('/(app)/(tabs)/promotions')}
                >
                    <Text style={styles.addButtonText}>+ Nueva Promoción</Text>
                </Pressable>
            </View>

            {promos.length === 0 ? (
                <Text style={styles.emptyText}>Aún no tienes promociones.</Text>
            ) : (
                promos.map((promo) => (
                    <View key={promo.id_prm} style={styles.promoRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.promoTitle}>{promo.title_prm}</Text>
                            <Text style={styles.promoBusiness}>
                                {promo.businesses?.name_bus ?? 'Sin negocio asignado'}
                            </Text>
                            {promo.description_prm ? (
                                <Text style={styles.promoDesc} numberOfLines={2}>
                                    {promo.description_prm}
                                </Text>
                            ) : null}
                            <Text style={styles.promoDates}>
                                {formatDate(promo.start_at_prm)} - {formatDate(promo.end_at_prm)}
                            </Text>
                        </View>
                        <View style={styles.promoRight}>
                            <Text style={styles.discountText}>{formatDiscount(promo)}</Text>
                            <StatusPill status={promo.moderation_status_prm} />
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

function MetricCard({ label, value }: { label: string; value: number }) {
    return (
        <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value}</Text>
        </View>
    );
}

function ActionButton({
    label,
    onPress,
    variant,
}: {
    label: string;
    onPress: () => void;
    variant?: 'business' | 'product' | 'promo';
}) {
    const palette: Record<string, { bg: string; text: string; border: string }> = {
        business: { bg: '#0EA5E9', text: '#fff', border: '#0EA5E9' },
        product: { bg: '#16A34A', text: '#fff', border: '#16A34A' },
        promo: { bg: '#F59E0B', text: '#fff', border: '#F59E0B' },
        default: { bg: '#f8fafc', text: '#111827', border: '#e2e8f0' },
    };

    const colors = palette[variant ?? 'default'];

    return (
        <Pressable
            style={[styles.actionButton, { backgroundColor: colors.bg, borderColor: colors.border }]}
            onPress={onPress}
        >
            <Text style={[styles.actionText, { color: colors.text }]}>{label}</Text>
        </Pressable>
    );
}

function BusinessThumb({ images }: { images?: any[] }) {
    const first = images?.[0];
    const uri = first?.bucket_bim
        ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${first.bucket_bim}/${first.path_bim}`
        : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=60';
    return <Image source={{ uri }} style={styles.thumb} />;
}

function StatusPill({ status }: { status?: string }) {
    const map: Record<string, { label: string; bg: string; color: string }> = {
        approved: { label: 'Aprobado', bg: '#E7F8ED', color: '#15803D' },
        pending: { label: 'Pendiente', bg: '#FEF5E7', color: '#C47F11' },
        rejected: { label: 'Rechazado', bg: '#FEECEC', color: '#B91C1C' },
    };
    const conf = map[status ?? ''] ?? map.pending;
    return (
        <View style={[styles.statusPill, { backgroundColor: conf.bg }]}>
            <Text style={[styles.statusText, { color: conf.color }]}>{conf.label}</Text>
        </View>
    );
}

function formatDate(value?: string | null) {
    if (!value) return 'Sin fecha';
    const d = new Date(value);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDiscount(promo: any) {
    if (promo.discount_type_prm === 'percentage') {
        return `-${promo.discount_value_prm}%`;
    }
    if (promo.discount_type_prm === 'fixed') {
        return `-₡${promo.discount_value_prm}`;
    }
    return 'Promo';
}

const styles = StyleSheet.create({
    container: {
        padding: 18,
        paddingBottom: 34,
        backgroundColor: '#f3f4f6',
        gap: 14,
        paddingHorizontal: 40,
        maxWidth: 1400,
        marginHorizontal: 'auto' as any,
        width: '100%' as any,
    },
    profileShell: {
        position: 'relative',
        marginBottom: 6,
    },
    profileBackdrop: {
        position: 'absolute',
        top: -8,
        left: 0,
        right: 0,
        height: 120,
        backgroundColor: '#0f172a',
        borderRadius: 18,
        overflow: 'hidden',
    },
    profileBackdropGlow: {
        position: 'absolute',
        top: -40,
        left: -30,
        right: -30,
        height: 160,
        backgroundColor: '#1d4ed8',
        opacity: 0.12,
        transform: [{ rotate: '-8deg' }],
    },
    profileContent: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        ...getShadowStyle({
            color: '#0f172a',
            offsetY: 4,
            opacity: 0.06,
            radius: 10,
            elevation: 3,
        }),
    },
    profileTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    profileAvatar: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#e0ecff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#c7d7ff',
    },
    avatarText: {
        fontWeight: '700',
        fontSize: 18,
        color: '#1d4ed8',
    },
    profileName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    profileSubtitle: {
        marginTop: 2,
        color: '#475467',
        fontSize: 13,
    },
    profilePhone: {
        marginTop: 4,
        color: '#6b7280',
        fontSize: 13,
    },
    profileRolePill: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#EEF2FF',
        borderRadius: 10,
    },
    profileRoleText: {
        fontWeight: '700',
        color: '#3730A3',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    profileMetaRow: {
        flexDirection: 'row',
        gap: 10,
    },
    metaCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#f9fafb',
    },
    metaLabel: {
        color: '#6b7280',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '600',
    },
    metaValue: {
        color: '#111827',
        fontWeight: '700',
        fontSize: 14,
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
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },
    subtitle: {
        color: '#555',
        fontSize: 14,
    },
    note: {
        color: '#777',
        fontSize: 13,
        textAlign: 'center',
    },
    dashboardTitle: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 14,
        color: '#0f172a',
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    metricCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        ...getShadowStyle({
            color: '#0f172a',
            offsetY: 4,
            opacity: 0.06,
            radius: 8,
        }),
    },
    metricLabel: {
        color: '#555',
        marginBottom: 8,
        fontSize: 13,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        ...getShadowStyle({
            color: '#0f172a',
            offsetY: 4,
            opacity: 0.04,
            radius: 8,
        }),
    },
    actionText: {
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    sectionHeaderRow: {
        marginTop: 4,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#0ea5e9',
        ...getShadowStyle({
            color: '#0f172a',
            offsetY: 4,
            opacity: 0.05,
            radius: 8,
        }),
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    productRow: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 10,
        alignItems: 'center',
        ...getShadowStyle({
            color: '#0f172a',
            offsetY: 3,
            opacity: 0.05,
            radius: 8,
        }),
    },
    productTitle: {
        fontWeight: '700',
        color: '#111',
        fontSize: 15,
    },
    productBiz: {
        color: '#4b5563',
        marginTop: 2,
        fontSize: 13,
    },
    productDesc: {
        color: '#6b7280',
        marginTop: 4,
        fontSize: 13,
    },
    productPrice: {
        color: '#111827',
        fontWeight: '700',
        marginTop: 6,
    },
    businessCard: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 10,
        alignItems: 'center',
        ...getShadowStyle({
            color: '#0f172a',
            offsetY: 3,
            opacity: 0.05,
            radius: 8,
        }),
    },
    thumb: {
        width: 70,
        height: 70,
        borderRadius: 10,
        backgroundColor: '#e5e7eb',
    },
    businessTitle: {
        fontWeight: '700',
        color: '#111',
    },
    businessDesc: {
        color: '#555',
        fontSize: 13,
        marginTop: 4,
    },
    businessActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    linkButton: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d9dadd',
        backgroundColor: '#fff',
    },
    linkButtonText: {
        fontWeight: '700',
        color: '#111',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontWeight: '700',
        fontSize: 12,
    },
    emptyText: {
        color: '#666',
        marginBottom: 8,
    },
    promoRow: {
        flexDirection: 'row',
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 10,
        gap: 10,
        alignItems: 'center',
    },
    promoTitle: {
        fontWeight: '700',
        color: '#111',
    },
    promoBusiness: {
        color: '#444',
        marginTop: 2,
    },
    promoDesc: {
        color: '#555',
        marginTop: 4,
    },
    promoDates: {
        color: '#777',
        fontSize: 12,
        marginTop: 4,
    },
    promoRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    discountText: {
        color: '#F97316',
        fontWeight: '700',
        fontSize: 16,
    },
});
