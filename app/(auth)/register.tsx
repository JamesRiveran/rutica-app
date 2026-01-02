import { signUp } from '@/services/auth';
import { Link, router } from 'expo-router';
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

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    console.log('[REGISTER] Intentando registro con:', {
      email,
      name,
      phone,
      role,
      passwordLength: password.length,
    });

    if (!email || !password || !name || !confirmPassword) {
      Alert.alert(
        'Campos incompletos',
        'Por favor completa todos los campos obligatorios.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Contraseñas no coinciden',
        'La contraseña y la confirmación deben ser iguales.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Contraseña inválida',
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, name, phone, role);

      console.log('[REGISTER] Registro exitoso');
      Alert.alert(
        'Registro exitoso',
        'Tu cuenta fue creada correctamente.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('[REGISTER] Error al registrar:', error);

      Alert.alert(
        'Error al registrarse',
        error?.message ?? 'Ocurrió un error inesperado'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Tarjeta de registro */}
      <View style={styles.card}>
        {/* Logo dentro del card */}
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.cardTitle}>Crear Cuenta</Text>

        {/* Tipo de cuenta */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de cuenta</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'buyer' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('buyer')}
            >
              <Text style={styles.roleIcon}>👤</Text>
              <Text style={[
                styles.roleTitle,
                role === 'buyer' && styles.roleTextActive,
              ]}>
                Comprador
              </Text>
              <Text style={styles.roleSubtitle}>Descubre y explora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'seller' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('seller')}
            >
              <Text style={styles.roleIcon}>🏪</Text>
              <Text style={[
                styles.roleTitle,
                role === 'seller' && styles.roleTextActive,
              ]}>
                Vendedor
              </Text>
              <Text style={styles.roleSubtitle}>Promociona tu negocio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nombre completo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

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

        {/* Teléfono */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="+506 0000-0000"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
          />
        </View>

        {/* Contraseña */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
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
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />
        </View>

        {/* Botón Crear Cuenta */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            loading && styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Text>
        </TouchableOpacity>

        {/* Link a login */}
        <View style={styles.loginLink}>
          <Text style={styles.loginText}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/(auth)/login">
              <Text style={styles.loginLinkText}>Inicia sesión aquí</Text>
            </Link>
          </Text>
        </View>
      </View>

      {/* Pie de página */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Al registrarte, aceptas nuestros{' '}
          <Text style={styles.footerLink}>Términos y Condiciones</Text>
          {' y '}
          <Text style={styles.footerLink}>Política de Privacidad</Text>
        </Text>
      </View>
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
    marginBottom: 28,
    textAlign: 'center',
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
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  roleButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
  },
  roleIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleTextActive: {
    color: '#10b981',
  },
  roleSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
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
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  loginLinkText: {
    color: '#10b981',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 32,
    marginBottom: 20,
    paddingHorizontal: 16,
    width: '100%' as any,
    maxWidth: 480,
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  footerLink: {
    color: '#10b981',
    textDecorationLine: 'underline',
  },
});
