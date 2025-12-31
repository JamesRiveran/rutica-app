import { getBusinessById } from '@/services/businesses';
import { getProductsByBusinessId } from '@/services/products';
import { getShadowStyle } from '@/utils/shadowHelper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function BusinessDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [business, setBusiness] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showProductModal, setShowProductModal] = useState(false);

    useEffect(() => {
        loadBusiness();
        loadProducts();
    }, []);

    const loadBusiness = async () => {
        try {
            const businessId = Array.isArray(id) ? id[0] : id;
            if (!businessId) {
                setLoading(false);
                return;
            }

            const data = await getBusinessById(businessId);
            setBusiness(data);
        } catch (e) {
            console.error('[BUSINESS DETAIL]', e);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const businessId = Array.isArray(id) ? id[0] : id;
            if (!businessId) return;

            const data = await getProductsByBusinessId(businessId);
            setProducts(data || []);
        } catch (e) {
            console.error('[PRODUCTS]', e);
        }
    };

    const image = useMemo(() => {
        const first = business?.business_images?.[0];
        if (!first || !first.bucket_bim || !first.path_bim) return null;
        return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${first.bucket_bim}/${first.path_bim}`;
    }, [business]);

    const logo = useMemo(() => {
        const logoImage = business?.business_images?.find((img: any) => img.bucket_bim === 'business-logos');
        if (!logoImage || !logoImage.path_bim) return null;
        return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${logoImage.bucket_bim}/${logoImage.path_bim}`;
    }, [business]);

    const gallery = useMemo(() => {
        const list = business?.business_images ?? [];
        // omit the hero image
        return list.slice(1).filter((img: any) => img.bucket_bim && img.path_bim);
    }, [business]);

    const categoryLabel = useMemo(() => {
        if (!business?.business_categories) return null;
        return business.business_categories.name_bca ?? null;
    }, [business]);

    const whatsappUrl = useMemo(() => {
        if (!business?.whatsapp_phone_bus) return null;
        const clean = business.whatsapp_phone_bus.replace(/[^\d+]/g, '');
        return `https://wa.me/${clean}`;
    }, [business]);

    const mapsUrl = useMemo(() => {
        const parts = [
            business?.name_bus,
            business?.locations?.district_loc,
            business?.locations?.canton_loc,
            business?.locations?.province_loc,
        ]
            .filter(Boolean)
            .join(', ');
        if (!parts) return null;
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
    }, [business]);

    const phoneUrl = useMemo(() => {
        if (!business?.contact_phone_bus) return null;
        const clean = business.contact_phone_bus.replace(/[^\d+]/g, '');
        return `tel:${clean}`;
    }, [business]);

    const openUrl = (url?: string | null) => {
        if (!url) return;
        Linking.openURL(url).catch(() => { });
    };

    if (loading) {
        return <Text style={{ padding: 24 }}>Cargando…</Text>;
    }

    if (!business) {
        return <Text>No se encontró el comercio</Text>;
    }

    return (
        <>
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
                    onPress={() => router.replace('/(app)/(tabs)/businesses')}
                >
                    <Ionicons name="arrow-back" size={20} color="#111" />
                    <Text style={styles.backText}>Volver</Text>
                </Pressable>
            </View>

            {/* CONTENT */}
            <View style={styles.contentCard}>
                <View style={styles.headerRow}>
                    {logo && (
                        <View style={styles.logoContainer}>
                            <Image source={{ uri: logo }} style={styles.logoImage} />
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{business.name_bus}</Text>

                        {categoryLabel && (
                            <View style={styles.chip}>
                                <Text style={styles.chipText}>{categoryLabel}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.ratingBox}>
                        <Ionicons name="star" color="#F5A524" size={16} />
                        <Text style={styles.ratingValue}>4.8</Text>
                        <Text style={styles.ratingCount}>(24)</Text>
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
                            {business.locations.canton_loc
                                ? `, ${business.locations.canton_loc}`
                                : ''}
                            {business.locations.province_loc
                                ? `, ${business.locations.province_loc}`
                                : ''}
                        </Text>
                        {mapsUrl && (
                            <Pressable style={styles.mapButton} onPress={() => openUrl(mapsUrl)}>
                                <Ionicons name="map" size={14} color="#0f172a" />
                                <Text style={styles.mapButtonText}>Ver en mapa</Text>
                            </Pressable>
                        )}
                    </View>
                )}

                {/* TABS (solo UI) */}
                <View style={styles.tabsRow}>
                    <View style={styles.tabActive}>
                        <Text style={styles.tabActiveText}>
                            Galería ({gallery.length})
                        </Text>
                    </View>
                </View>

                {/* GALERÍA DESDE SUPABASE */}
                {gallery.length > 0 ? (
                    <View style={styles.grid}>
                        {gallery.map((img: any, idx: number) => (
                            <View key={`${img.path_bim}-${idx}`} style={styles.cardBox}>
                                <Image
                                    source={{
                                        uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${img.bucket_bim}/${img.path_bim}`,
                                    }}
                                    style={styles.galleryImage}
                                />
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyGallery}>Sin imágenes adicionales</Text>
                )}
            </View>

            {/* PRODUCTOS */}
            {products.length > 0 && (
                <View style={styles.productsCard}>
                    <Text style={styles.productsTitle}>Productos ({products.length})</Text>
                    <View style={styles.productsGrid}>
                        {products.map((product: any) => {
                            const productImage = product.product_images?.[0];
                            const imageUrl = productImage
                                ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${productImage.bucket_pim}/${productImage.path_pim}`
                                : null;

                            return (
                                <Pressable 
                                    key={product.id_prd} 
                                    style={styles.productCard}
                                    onPress={() => {
                                        setSelectedProduct(product);
                                        setShowProductModal(true);
                                    }}
                                >
                                    {imageUrl ? (
                                        <Image source={{ uri: imageUrl }} style={styles.productImage} />
                                    ) : (
                                        <View style={styles.productImagePlaceholder}>
                                            <Ionicons name="image-outline" size={32} color="#999" />
                                        </View>
                                    )}
                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName} numberOfLines={2}>
                                            {product.name_prd}
                                        </Text>
                                        {product.description_prd && (
                                            <Text style={styles.productDescription} numberOfLines={2}>
                                                {product.description_prd}
                                            </Text>
                                        )}
                                        <Text style={styles.productPrice}>
                                            ₡{product.price_prd?.toLocaleString('es-CR') || '0'}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* CONTACT PANEL */}
            <View style={styles.contactCard}>
                <Text style={styles.contactTitle}>Contacto</Text>

                {whatsappUrl && (
                    <Pressable
                        style={[styles.contactButton, styles.whatsapp]}
                        onPress={() => openUrl(whatsappUrl)}
                    >
                        <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                        <Text style={styles.contactButtonText}>WhatsApp</Text>
                    </Pressable>
                )}

                {phoneUrl && (
                    <Pressable
                        style={styles.contactButton}
                        onPress={() => openUrl(phoneUrl)}
                    >
                        <Ionicons name="call" size={18} color="#111" />
                        <Text style={styles.contactButtonDarkText}>Llamar</Text>
                    </Pressable>
                )}

                {business.website_bus && (
                    <Pressable
                        style={styles.contactButton}
                        onPress={() => openUrl(business.website_bus)}
                    >
                        <Ionicons name="link" size={18} color="#111" />
                        <Text style={styles.contactButtonDarkText}>Sitio web</Text>
                    </Pressable>
                )}

                {business.contact_email_bus && (
                    <Pressable
                        style={styles.contactButton}
                        onPress={() => openUrl(`mailto:${business.contact_email_bus}`)}
                    >
                        <Ionicons name="mail" size={18} color="#111" />
                        <Text style={styles.contactButtonDarkText}>Email</Text>
                    </Pressable>
                )}
            </View>
        </ScrollView>

        {selectedProduct && (
            <Modal
                visible={showProductModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowProductModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle} numberOfLines={2}>
                                {selectedProduct.name_prd}
                            </Text>
                            <Pressable onPress={() => setShowProductModal(false)}>
                                <Ionicons name="close" size={22} color="#111" />
                            </Pressable>
                        </View>

                        <FlatList
                            data={selectedProduct.product_images || []}
                            keyExtractor={(item) => item.id_pim}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.modalImageGallery}
                            renderItem={({ item }) => {
                                const imgUri = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${item.bucket_pim}/${item.path_pim}`;
                                return (
                                    <Image
                                        source={{ uri: imgUri }}
                                        style={styles.modalProductImage}
                                    />
                                );
                            }}
                            ListEmptyComponent={(
                                <View style={styles.modalPlaceholder}>
                                    <Ionicons name="image-outline" size={32} color="#999" />
                                    <Text style={styles.modalPlaceholderText}>Sin fotos</Text>
                                </View>
                            )}
                        />

                        <View style={styles.modalBody}>
                            <Text style={styles.modalPrice}>
                                ₡{selectedProduct.price_prd?.toLocaleString('es-CR') || '0'}
                            </Text>
                            {selectedProduct.description_prd ? (
                                <Text style={styles.modalDescription}>{selectedProduct.description_prd}</Text>
                            ) : null}
                        </View>
                    </View>
                </View>
            </Modal>
        )}
        </>
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
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
    },
    logoContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },
    chip: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F0FE',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 6,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1D4ED8',
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    ratingValue: {
        marginLeft: 6,
        fontWeight: '700',
        color: '#111',
    },
    ratingCount: {
        marginLeft: 4,
        color: '#666',
        fontSize: 12,
    },
    content: {
        padding: 20,
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
        marginBottom: 8,
    },
    locationText: {
        marginLeft: 6,
        fontSize: 13,
        color: '#555',
        flex: 1,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 10,
    },
    mapButtonText: {
        color: '#0f172a',
        fontWeight: '700',
        fontSize: 12,
    },
    tabsRow: {
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 10,
    },
    tabActive: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        marginRight: 8,
    },
    tabActiveText: {
        fontWeight: '700',
        color: '#111',
        fontSize: 13,
    },
    tabInactive: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 8,
    },
    tabInactiveText: {
        fontWeight: '600',
        color: '#666',
        fontSize: 13,
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
    },
    cardBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    galleryImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#dfe3e6',
    },
    cardImagePlaceholder: {
        height: 140,
        backgroundColor: '#dfe3e6',
    },
    cardTitle: {
        padding: 12,
        fontWeight: '600',
        color: '#111',
    },
    emptyGallery: {
        padding: 16,
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
    },
    contactCard: {
        marginTop: 12,
        marginHorizontal: 16,
        marginBottom: 32,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 10,
        backgroundColor: '#fff',
        gap: 8,
    },
    whatsapp: {
        backgroundColor: '#25D366',
        borderColor: '#25D366',
    },
    contactButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    contactButtonDarkText: {
        color: '#111',
        fontWeight: '700',
    },
    productsCard: {
        marginHorizontal: 16,
        marginTop: 16,
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
    },
    productsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginBottom: 16,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    productCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
        marginBottom: 8,
    },
    productImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#f0f0f0',
    },
    productImagePlaceholder: {
        width: '100%',
        height: 150,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        marginBottom: 4,
    },
    productDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#007AFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        flex: 1,
        marginRight: 12,
    },
    modalImageGallery: {
        marginBottom: 12,
    },
    modalProductImage: {
        width: 260,
        height: 200,
        borderRadius: 12,
        marginRight: 10,
        backgroundColor: '#f0f0f0',
    },
    modalPlaceholder: {
        width: 260,
        height: 200,
        borderRadius: 12,
        backgroundColor: '#f4f4f5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    modalPlaceholderText: {
        marginTop: 6,
        color: '#777',
    },
    modalBody: {
        gap: 8,
    },
    modalPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
    },
    modalDescription: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
});

