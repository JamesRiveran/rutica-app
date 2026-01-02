import { supabase } from '@/lib/supabase';
import { createProduct, getMyBusinesses, getProductCategories, createProductCategory, uploadProductImage, saveProductImage } from '@/services/products';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function ProductCreateScreen() {
    const { businessId: paramBusinessId } = useLocalSearchParams<{ businessId: string }>();
    const [step, setStep] = useState(1);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('CRC');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedImages, setSelectedImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            const { data: auth } = await supabase.auth.getUser();
            if (!auth.user) {
                Alert.alert('Sesión requerida', 'Inicia sesión para crear productos');
                router.back();
                return;
            }
            const myBiz = await getMyBusinesses(auth.user.id);
            setBusinesses(myBiz ?? []);
            
            // Si viene un businessId en los parámetros, usarlo directamente
            if (paramBusinessId) {
                const bizId = Array.isArray(paramBusinessId) ? paramBusinessId[0] : paramBusinessId;
                setSelectedBiz(bizId);
            } else if (myBiz?.length === 1) {
                setSelectedBiz(myBiz[0].id_bus);
            }
            
            // Cargar categorías
            const cats = await getProductCategories();
            setCategories(cats ?? []);
        };
        load();
    }, [paramBusinessId]);

    const canContinueStep1 = useMemo(() => selectedBiz !== null, [selectedBiz]);
    const canContinueStep2 = useMemo(() => name.trim().length > 0, [name]);
    const canContinueStep3 = useMemo(() => price.trim().length > 0 && !Number.isNaN(Number(price)), [price]);
    const canContinueStep4 = useMemo(() => selectedCategory !== null, [selectedCategory]);

    const pickImages = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                selectionLimit: 0,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                const newImages = result.assets.map((asset) => ({
                    uri: asset.uri,
                    type: 'image/jpeg',
                    name: asset.fileName || `product-${Date.now()}.jpg`,
                }));
                setSelectedImages([...selectedImages, ...newImages]);
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
            console.error(e);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(selectedImages.filter((_, i) => i !== index));
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            Alert.alert('Error', 'Ingresa el nombre de la categoría');
            return;
        }

        try {
            const newCategory = await createProductCategory({ name: newCategoryName });
            setCategories([...categories, newCategory]);
            setSelectedCategory(newCategory.id_PCA);
            setNewCategoryName('');
            setShowCategoryModal(false);
            Alert.alert('Éxito', 'Categoría creada correctamente');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'No se pudo crear la categoría');
        }
    };

    const onSubmit = async () => {
        if (!selectedBiz) {
            Alert.alert('Selecciona un comercio');
            return;
        }
        const numericPrice = Number(price);
        if (Number.isNaN(numericPrice)) {
            Alert.alert('Precio inválido');
            return;
        }
        if (!selectedCategory) {
            Alert.alert('Selecciona una categoría');
            return;
        }

        try {
            setLoading(true);
            const product = await createProduct({
                businessId: selectedBiz,
                name: name.trim(),
                description: description.trim() || undefined,
                price: numericPrice,
                currency,
                productCategoryId: selectedCategory,
            });

            // Subir imágenes
            for (const image of selectedImages) {
                try {
                    let file = image;
                    if (Platform.OS === 'web') {
                        const response = await fetch(image.uri);
                        file = await response.blob();
                    } else {
                        file = {
                            uri: image.uri,
                            type: image.type,
                            name: image.name,
                        };
                    }

                    const path = await uploadProductImage(file, product.id_prd);
                    await saveProductImage(product.id_prd, path);
                } catch (imgError) {
                    console.error('[IMAGE UPLOAD]', imgError);
                }
            }

            Alert.alert('Producto creado', 'Se registró el producto con éxito', [
                {
                    text: 'Ir a gestionar',
                    onPress: () => router.replace('/(app)/(tabs)/manage'),
                },
            ]);
            router.replace('/(app)/(tabs)/manage');
        } catch (e: any) {
            console.error('[CREATE PRODUCT]', e);
            Alert.alert('Error', e.message ?? 'No se pudo crear el producto');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        if (step === 1) {
            return (
                <View style={styles.card}>
                    <Text style={styles.label}>Selecciona el comercio</Text>
                    {businesses.map((biz) => (
                        <Pressable
                            key={biz.id_bus}
                            style={selectedBiz === biz.id_bus ? styles.bizActive : styles.bizItem}
                            onPress={() => setSelectedBiz(biz.id_bus)}
                        >
                            <Text style={styles.bizName}>{biz.name_bus}</Text>
                            {selectedBiz === biz.id_bus ? (
                                <Text style={styles.bizSelected}>Seleccionado</Text>
                            ) : null}
                        </Pressable>
                    ))}
                    {businesses.length === 0 ? (
                        <Text style={styles.helper}>No tienes comercios. Crea uno primero.</Text>
                    ) : null}
                </View>
            );
        }

        if (step === 2) {
            return (
                <View style={styles.card}>
                    <Text style={styles.label}>Nombre del producto</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ej. Café Premium 250g"
                    />

                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Notas de sabor, tostado, origen…"
                        multiline
                        numberOfLines={4}
                    />
                </View>
            );
        }

        if (step === 3) {
            return (
                <View style={styles.card}>
                    <Text style={styles.label}>Precio</Text>
                    <View style={styles.priceInput}>
                        <Text style={styles.currencySymbol}>₡</Text>
                        <TextInput
                            style={styles.priceField}
                            keyboardType="decimal-pad"
                            value={price}
                            onChangeText={setPrice}
                            placeholder="0.00"
                        />
                    </View>

                    <Text style={styles.label}>Moneda</Text>
                    <TextInput
                        style={styles.input}
                        value={currency}
                        onChangeText={setCurrency}
                        placeholder="CRC"
                    />
                </View>
            );
        }

        if (step === 4) {
            return (
                <View style={styles.card}>
                    <Text style={styles.label}>Categoría del producto</Text>
                    <Pressable
                        style={styles.categorySelector}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text
                            style={[
                                styles.categorySelectorText,
                                !selectedCategory && { color: '#999' },
                            ]}
                        >
                            {selectedCategory
                                ? categories.find((c) => c.id_pca === selectedCategory)?.name_pca ||
                                  'Selecciona categoría'
                                : 'Selecciona categoría'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </Pressable>
                </View>
            );
        }

        return (
            <View style={styles.card}>
                <Text style={styles.label}>Imágenes del producto</Text>
                <Pressable style={styles.uploadButton} onPress={pickImages}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#10b981" />
                    <Text style={styles.uploadButtonText}>
                        Seleccionar imágenes ({selectedImages.length})
                    </Text>
                </Pressable>

                {selectedImages.length > 0 && (
                    <FlatList
                        data={selectedImages}
                        horizontal
                        keyExtractor={(_, i) => `image-${i}`}
                        style={styles.imagesList}
                        renderItem={({ item, index }) => (
                            <View style={styles.imagePreview}>
                                <Image source={{ uri: item.uri }} style={styles.previewImage} />
                                <Pressable
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <Ionicons name="close-circle" size={28} color="#ff4444" />
                                </Pressable>
                            </View>
                        )}
                    />
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Pressable style={styles.backRow} onPress={() => router.back()}>
                    <Text style={styles.backText}>Cancelar</Text>
                </Pressable>

                <Text style={styles.title}>Nuevo Producto</Text>

                <View style={styles.stepsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <View key={s} style={styles.stepWrap}>
                            <View
                                style={[
                                    styles.stepCircle,
                                    step >= s && styles.stepCircleActive,
                                ]}
                            >
                                <Text style={step >= s ? styles.stepTextActive : styles.stepText}>{s}</Text>
                            </View>
                            {s < 5 && <View style={styles.stepLine} />}
                        </View>
                    ))}
                </View>

                <Text style={styles.subtitle}>Información del producto</Text>
                <Text style={styles.helper}>Completa los datos para publicarlo</Text>

                {renderStep()}

                <View style={styles.actionsRow}>
                    <Pressable
                        style={[styles.actionButton, step === 1 && styles.actionDisabled]}
                        onPress={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                    >
                        <Text style={styles.actionText}>Anterior</Text>
                    </Pressable>

                    {step < 5 ? (
                        <Pressable
                            style={[styles.actionButtonPrimary, 
                                ((step === 1 && !canContinueStep1) || 
                                 (step === 2 && !canContinueStep2) ||
                                 (step === 3 && !canContinueStep3) ||
                                 (step === 4 && !canContinueStep4)) ? styles.actionDisabled : null]}
                            disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2) || (step === 3 && !canContinueStep3) || (step === 4 && !canContinueStep4)}
                            onPress={() => setStep(step + 1)}
                        >
                            <Text style={styles.actionTextPrimary}>Continuar</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            style={[styles.actionButtonPrimary, loading && styles.actionDisabled]}
                            disabled={loading}
                            onPress={onSubmit}
                        >
                            <Text style={styles.actionTextPrimary}>{loading ? 'Guardando…' : 'Crear'}</Text>
                        </Pressable>
                    )}
                </View>
            </ScrollView>

            {/* MODAL CATEGORÍAS */}
            <Modal visible={showCategoryModal} transparent animationType="slide">
                <View style={styles.modal}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Categorías</Text>
                            <Pressable onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#111" />
                            </Pressable>
                        </View>

                        {/* Listar categorías existentes */}
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id_pca}
                            style={styles.categoriesList}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={[
                                        styles.categoryOption,
                                        selectedCategory === item.id_pca && styles.categoryOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedCategory(item.id_pca);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.categoryOptionText,
                                            selectedCategory === item.id_pca && styles.categoryOptionTextSelected,
                                        ]}
                                    >
                                        {item.name_pca}
                                    </Text>
                                    {selectedCategory === item.id_pca && (
                                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    )}
                                </Pressable>
                            )}
                        />

                        {/* Crear nueva categoría */}
                        <View style={styles.newCategorySection}>
                            <Text style={styles.newCategoryTitle}>Crear nueva categoría</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre de la categoría"
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                            />
                            <Pressable
                                style={styles.createCategoryButton}
                                onPress={handleCreateCategory}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.createCategoryButtonText}>Crear categoría</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#fff',
        gap: 12,
    },
    backRow: {
        marginBottom: 8,
    },
    backText: {
        color: '#111',
        fontWeight: '600',
    },
    title: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    stepWrap: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    stepText: {
        color: '#6b7280',
        fontWeight: '700',
    },
    stepTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 6,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    helper: {
        color: '#6b7280',
        fontSize: 13,
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 12,
    },
    label: {
        fontWeight: '700',
        marginBottom: 8,
        color: '#111',
    },
    bizItem: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    bizActive: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#10b981',
        borderRadius: 10,
        backgroundColor: '#ECFDF3',
        marginBottom: 8,
    },
    bizName: {
        fontWeight: '700',
        color: '#111',
    },
    bizSelected: {
        marginTop: 4,
        color: '#15803d',
        fontWeight: '700',
        fontSize: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    textarea: {
        height: 100,
        textAlignVertical: 'top',
    },
    priceInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingLeft: 12,
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginRight: 4,
    },
    priceField: {
        flex: 1,
        padding: 12,
    },
    categorySelector: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categorySelectorText: {
        color: '#111',
        fontWeight: '600',
    },
    uploadButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#10b981',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    uploadButtonText: {
        color: '#10b981',
        fontWeight: '600',
        marginTop: 8,
    },
    imagesList: {
        marginTop: 12,
    },
    imagePreview: {
        position: 'relative',
        marginRight: 12,
        borderRadius: 10,
        overflow: 'hidden',
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
    },
    actionButtonPrimary: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#10B981',
    },
    actionText: {
        fontWeight: '700',
        color: '#111',
    },
    actionTextPrimary: {
        fontWeight: '700',
        color: '#fff',
    },
    actionDisabled: {
        opacity: 0.6,
    },
    modal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 16,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    categoriesList: {
        maxHeight: 300,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    categoryOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    categoryOptionSelected: {
        backgroundColor: '#ECFDF3',
        borderRadius: 8,
        borderBottomWidth: 0,
    },
    categoryOptionText: {
        fontSize: 16,
        color: '#666',
    },
    categoryOptionTextSelected: {
        color: '#10B981',
        fontWeight: '600',
    },
    newCategorySection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    newCategoryTitle: {
        fontWeight: '700',
        marginBottom: 8,
        color: '#111',
    },
    createCategoryButton: {
        backgroundColor: '#10B981',
        borderRadius: 10,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    createCategoryButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
});
