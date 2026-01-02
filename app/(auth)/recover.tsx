import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function RecoverScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRecover = async () => {
        if (!email) {
            Alert.alert('Campo incompleto', 'Por favor ingresa tu email.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:8081/reset-password',
            });

            if (error) throw error;

            Toast.show({
                type: 'success',
                text1: '📧 Correo enviado',
                text2: 'Revisa tu bandeja de entrada para restablecer tu contraseña',
                position: 'top',
                visibilityTime: 4000,
            });
            setEmail('');
        } catch (error: any) {
            console.error('[RECOVER] Error:', error);
            Alert.alert(
                'Error',
                error?.message ?? 'No se pudo enviar el correo de recuperación'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Tarjeta de recuperación */}
            <View style={styles.card}>
                {/* Logo dentro del card */}
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.cardTitle}>¿Olvidaste tu contraseña?</Text>

                <Text style={styles.description}>
                    No te preocupes. Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
                </Text>

                {/* Email */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="tu@email.com"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        editable={!loading}
                    />
                </View>

                {/* Botón Enviar */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        loading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleRecover}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Enviando...' : 'Enviar instrucciones'}
                    </Text>
                </TouchableOpacity>

                {/* Link volver */}
                <Link href="/(auth)/login" asChild>
                    <TouchableOpacity style={styles.backLink}>
                        <Text style={styles.backLinkText}>← Volver al inicio de sesión</Text>
                    </TouchableOpacity>
                </Link>
            </View>

            {/* Espacio inferior */}
            <View style={styles.footer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f8f8f8',
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: '100%' as any,
    },
    logoImage: {
        width: 100,
        height: 100,
        marginBottom: 16,
        alignSelf: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        marginHorizontal: 16,
        width: '100%' as any,
        maxWidth: 480,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    inputGroup: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    input: {
        borderWidth: 2,
        borderColor: '#e5e5e5',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#111',
        backgroundColor: '#fafafa',
        width: '100%',
    },
    submitButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
        width: '100%',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },
    backLink: {
        marginTop: 24,
        alignItems: 'center',
        paddingVertical: 10,
    },
    backLinkText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
    },
    footer: {
        marginTop: 32,
        marginBottom: 20,
    },
});
