import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
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

export default function ResetPasswordScreen() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            Toast.show({
                type: 'success',
                text1: '✓ Contraseña actualizada',
                text2: 'Tu contraseña ha sido restablecida correctamente',
                position: 'top',
                visibilityTime: 3000,
            });

            // Redirigir después de un pequeño delay
            setTimeout(() => {
                router.replace('/(auth)/login');
            }, 2000);
        } catch (error: any) {
            console.error('[RESET PASSWORD] Error:', error);
            Alert.alert(
                'Error',
                error?.message ?? 'No se pudo actualizar la contraseña'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Tarjeta de reset */}
            <View style={styles.card}>
                {/* Logo dentro del card */}
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.cardTitle}>Restablecer contraseña</Text>

                <Text style={styles.description}>
                    Ingresa tu nueva contraseña para tu cuenta.
                </Text>

                {/* Nueva contraseña */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nueva contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor="#999"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!loading}
                    />
                </View>

                {/* Confirmar contraseña */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirmar contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Repite tu contraseña"
                        placeholderTextColor="#999"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!loading}
                    />
                </View>

                {/* Botón Restablecer */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        loading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleResetPassword}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Actualizando...' : 'Restablecer contraseña'}
                    </Text>
                </TouchableOpacity>
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
    footer: {
        marginTop: 32,
        marginBottom: 20,
    },
});
