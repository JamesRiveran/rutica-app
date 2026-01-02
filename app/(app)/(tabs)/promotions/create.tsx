import { supabase } from '@/lib/supabase';
import { getMyBusinesses } from '@/services/products';
import { createPromotion, getProductsByBusiness, PromoScope } from '@/services/promotions';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const scopes: { key: PromoScope; title: string; desc: string }[] = [
    { key: 'general', title: 'General', desc: 'Descuento en toda la tienda' },
    { key: 'product', title: 'Producto', desc: 'Descuento en productos específicos' },
    { key: 'category', title: 'Categoría', desc: 'Descuento en una categoría completa' },
    { key: 'combo', title: 'Combo', desc: 'Combo de productos a precio especial' },
];

export default function PromotionCreateScreen() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [scope, setScope] = useState<PromoScope>('general');
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [discount, setDiscount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentRef, setPaymentRef] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);

    const resetForm = useCallback(() => {
        setStep(1);
        setScope('general');
        setBusinessId(null);
        setSelectedProducts([]);
        setTitle('');
        setDescription('');
        setDiscount('');
        setStartDate('');
        setEndDate('');
        setPaymentRef('');
        setPaymentNote('');
        setSubmitError(null);
    }, []);

    useEffect(() => {
        const load = async () => {
            const { data: auth } = await supabase.auth.getUser();
            if (!auth.user) {
                Alert.alert('Sesión requerida', 'Inicia sesión para crear promociones');
                router.back();
                return;
            }

            const biz = await getMyBusinesses(auth.user.id);
            setBusinesses(biz ?? []);
            if (biz?.length === 1) setBusinessId(biz[0].id_bus);
        };
        load();
    }, []);

    useFocusEffect(
        useCallback(() => {
            resetForm();
            return undefined;
        }, [resetForm])
    );

    useEffect(() => {
        const loadProducts = async () => {
            if (!businessId) {
                setProducts([]);
                setSelectedProducts([]);
                return;
            }
            try {
                const list = await getProductsByBusiness(businessId);
                setProducts(list);
                setSelectedProducts([]);
            } catch (e) {
                console.error('[PROMO PRODUCTS]', e);
            }
        };
        loadProducts();
    }, [businessId]);

    const canContinueStep1 = useMemo(() => !!scope, [scope]);
    const canContinueStep2 = useMemo(() => {
        if (!businessId) return false;
        if (!title.trim()) return false;
        const d = Number(discount);
        if (Number.isNaN(d) || d <= 0) return false;
        if (scope === 'product' || scope === 'combo') {
            if (selectedProducts.length === 0) return false;
        }
        return startDate.trim().length > 0 && endDate.trim().length > 0;
    }, [businessId, title, discount, startDate, endDate, scope, selectedProducts]);

    const parseDate = (value: string) => {
        const parts = value.trim().split('/');
        if (parts.length !== 3) return null;
        const [dd, mm, yyyy] = parts.map((p) => Number(p));
        if (!dd || !mm || !yyyy) return null;
        const d = new Date(Date.UTC(yyyy, mm - 1, dd));
        if (d.getUTCFullYear() !== yyyy || d.getUTCMonth() !== mm - 1 || d.getUTCDate() !== dd) {
            return null;
        }
        return d.toISOString();
    };

    const onSubmit = async () => {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
            const msg = 'Inicia sesión para crear promociones';
            setSubmitError(msg);
            Alert.alert('Sesión requerida', msg);
            return;
        }
        if (!businessId) {
            const msg = 'Selecciona un negocio';
            setSubmitError(msg);
            Alert.alert('Selecciona un negocio');
            return;
        }
        if ((scope === 'product' || scope === 'combo') && selectedProducts.length === 0) {
            const msg = 'Elige al menos un producto para la promoción';
            setSubmitError(msg);
            Alert.alert('Selecciona productos', msg);
            return;
        }
        if (!paymentRef.trim()) {
            const msg = 'Ingresa el número de referencia del pago';
            setSubmitError(msg);
            Alert.alert('Referencia SINPE requerida', msg);
            return;
        }
        const dValue = Number(discount);
        if (Number.isNaN(dValue) || dValue <= 0) {
            const msg = 'Ingresa un número de descuento mayor a 0';
            setSubmitError(msg);
            Alert.alert('Descuento inválido', msg);
            return;
        }
        const startIso = parseDate(startDate);
        const endIso = parseDate(endDate);
        if (!startIso || !endIso) {
            const msg = 'Usa el formato dd/mm/aaaa';
            setSubmitError(msg);
            Alert.alert('Fechas inválidas', msg);
            return;
        }
        if (new Date(startIso) >= new Date(endIso)) {
            const msg = 'La fecha fin debe ser posterior a la fecha inicio';
            setSubmitError(msg);
            Alert.alert('Fechas inválidas', msg);
            return;
        }

        try {
            setLoading(true);
            const promo = await createPromotion({
                businessId,
                createdBy: auth.user.id,
                scope,
                title: title.trim(),
                description: description.trim() || undefined,
                discountType: 'percentage',
                discountValue: dValue,
                startAt: startIso,
                endAt: endIso,
                paymentReference: paymentRef.trim(),
                paymentNote: paymentNote.trim() || undefined,
            });

            if ((scope === 'product' || scope === 'combo') && selectedProducts.length > 0) {
                try {
                    const rows = selectedProducts.map((id) => ({
                        promotion_id_ppr: promo.id_prm,
                        product_id_ppr: id,
                    }));
                    await supabase.from('promotion_products').insert(rows);
                } catch (e) {
                    console.error('[PROMO PRODUCT LINK]', e);
                }
            }

            setSubmitError(null);
            router.replace('/(app)/(tabs)/manage');
        } catch (e: any) {
            console.error('[CREATE PROMO]', e);
            const msg = e?.message ?? 'No se pudo crear la promoción';
            setSubmitError(msg);
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        if (step === 1) {
            return (
                <View style={styles.grid}>
                    {scopes.map((item) => (
                        <Pressable
                            key={item.key}
                            style={scope === item.key ? styles.cardActive : styles.card}
                            onPress={() => setScope(item.key)}
                        >
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDesc}>{item.desc}</Text>
                        </Pressable>
                    ))}
                </View>
            );
        }

        if (step === 2) {
            return (
                <View style={styles.formCard}>
                    <Text style={styles.label}>Negocio</Text>
                    {businesses.map((biz) => (
                        <Pressable
                            key={biz.id_bus}
                            style={biz.id_bus === businessId ? styles.listItemActive : styles.listItem}
                            onPress={() => setBusinessId(biz.id_bus)}
                        >
                            <Text style={styles.listTitle}>{biz.name_bus}</Text>
                            {biz.description_bus ? (
                                <Text style={styles.listDesc} numberOfLines={1}>
                                    {biz.description_bus}
                                </Text>
                            ) : null}
                        </Pressable>
                    ))}
                    {businesses.length === 0 ? (
                        <Text style={styles.helper}>No tienes negocios. Crea uno primero.</Text>
                    ) : null}

                    <Text style={[styles.label, { marginTop: 12 }]}>Productos del negocio</Text>
                    {products.length === 0 ? (
                        <Text style={styles.helper}>Este negocio no tiene productos activos.</Text>
                    ) : null}
                    {products.map((prod) => {
                        const active = selectedProducts.includes(prod.id_prd);
                        return (
                            <Pressable
                                key={prod.id_prd}
                                style={active ? styles.listItemActive : styles.listItem}
                                onPress={() => {
                                    setSelectedProducts((prev) => {
                                        if (scope === 'product') {
                                            return prev.includes(prod.id_prd) ? [] : [prod.id_prd];
                                        }
                                        if (prev.includes(prod.id_prd)) {
                                            return prev.filter((id) => id !== prod.id_prd);
                                        }
                                        return [...prev, prod.id_prd];
                                    });
                                }}
                            >
                                <Text style={styles.listTitle}>{prod.name_prd}</Text>
                                <Text style={styles.listDesc}>
                                    {prod.currency_prd ?? 'CRC'} {Number(prod.price_prd).toLocaleString()}
                                </Text>
                            </Pressable>
                        );
                    })}

                    <Text style={[styles.label, { marginTop: 12 }]}>Título</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. 20% descuento en café premium"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        placeholder="Describe tu promoción"
                        multiline
                        numberOfLines={3}
                        value={description}
                        onChangeText={setDescription}
                    />

                    <Text style={styles.label}>Descuento (%)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Ej. 20"
                        value={discount}
                        onChangeText={setDiscount}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Fecha Inicio (dd/mm/aaaa)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="01/01/2024"
                                value={startDate}
                                onChangeText={setStartDate}
                            />
                        </View>
                        <View style={{ width: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Fecha Fin (dd/mm/aaaa)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="31/01/2024"
                                value={endDate}
                                onChangeText={setEndDate}
                            />
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.summaryCard}>
                {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
                <Text style={styles.summaryTitle}>Revisa y confirma</Text>
                <Text style={styles.summaryItem}>Tipo: {scope}</Text>
                <Text style={styles.summaryItem}>
                    Negocio: {businesses.find((b) => b.id_bus === businessId)?.name_bus ?? 'No seleccionado'}
                </Text>
                {(scope === 'product' || scope === 'combo') ? (
                    <Text style={styles.summaryItem}>
                        Productos: {selectedProducts.length > 0 ? selectedProducts.map((id) => products.find((p) => p.id_prd === id)?.name_prd ?? '—').join(', ') : 'No seleccionados'}
                    </Text>
                ) : null}
                <Text style={styles.summaryItem}>Título: {title || 'Sin título'}</Text>
                <Text style={styles.summaryItem}>Descuento: {discount || '0'}%</Text>
                <Text style={styles.summaryItem}>Inicio: {startDate || 'N/A'}</Text>
                <Text style={styles.summaryItem}>Fin: {endDate || 'N/A'}</Text>
                <Text style={styles.summaryItem}>Referencia SINPE: {paymentRef || 'No indicada'}</Text>
                <Text style={styles.summaryItem}>Nota pago: {paymentNote || 'Sin nota'}</Text>

                <Text style={[styles.label, { marginTop: 12 }]}>Número de referencia SINPE</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. 123456789"
                    keyboardType="number-pad"
                    value={paymentRef}
                    onChangeText={setPaymentRef}
                />

                <Text style={styles.label}>Nota del comprobante (opcional)</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Indica desde qué número enviaste el SINPE u otra nota"
                    multiline
                    numberOfLines={3}
                    value={paymentNote}
                    onChangeText={setPaymentNote}
                />
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

                <Text style={styles.title}>Nueva Promoción</Text>

                <View style={styles.stepsRow}>
                    {[1, 2, 3].map((s) => (
                        <View key={s} style={styles.stepWrap}>
                            <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
                                <Text style={step >= s ? styles.stepTextActive : styles.stepText}>{s}</Text>
                            </View>
                            {s < 3 && <View style={styles.stepLine} />}
                        </View>
                    ))}
                </View>

                <Text style={styles.subtitle}>
                    {step === 1
                        ? 'Selecciona el tipo de promoción que deseas crear'
                        : step === 2
                            ? 'Completa la información de tu promoción'
                            : 'Confirma los datos antes de enviar'}
                </Text>
                <Text style={styles.helper}>
                    {step === 1
                        ? 'General, producto, categoría o combo'
                        : step === 2
                            ? 'Negocio, producto (si aplica), fechas y descuento'
                            : 'Revisa que todo esté correcto'}
                </Text>

                {renderStep()}

                <View style={styles.actionsRow}>
                    <Pressable
                        style={[styles.actionButton, step === 1 && styles.actionDisabled]}
                        onPress={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                    >
                        <Text style={styles.actionText}>Atrás</Text>
                    </Pressable>

                    {step < 3 ? (
                        <Pressable
                            style={[styles.actionButtonPrimary, ((step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2)) ? styles.actionDisabled : null]}
                            disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2)}
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
                            <Text style={styles.actionTextPrimary}>{loading ? 'Guardando…' : 'Enviar a verificación'}</Text>
                        </Pressable>
                    )}
                </View>
            </ScrollView>
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 4,
    },
    card: {
        flexBasis: '48%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#fff',
    },
    cardActive: {
        flexBasis: '48%',
        borderWidth: 1,
        borderColor: '#10b981',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#ECFDF3',
    },
    cardTitle: {
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 6,
    },
    cardDesc: {
        color: '#4b5563',
    },
    formCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 6,
    },
    label: {
        fontWeight: '700',
        color: '#111',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    textarea: {
        height: 90,
        textAlignVertical: 'top',
    },
    listItem: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    listItemActive: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#10b981',
        borderRadius: 10,
        backgroundColor: '#ECFDF3',
        marginBottom: 8,
    },
    listTitle: {
        fontWeight: '700',
        color: '#111',
    },
    listDesc: {
        color: '#4b5563',
        marginTop: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
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
    summaryCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    summaryTitle: {
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    summaryItem: {
        color: '#374151',
        marginBottom: 4,
    },
    errorText: {
        color: '#b91c1c',
        fontWeight: '700',
        marginBottom: 8,
    },
});
