import { signIn } from '@/services/auth';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[LOGIN] Pantalla de login montada');
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    console.log('[LOGIN] Intentando login...');

    try {
      await signIn(email, password);

      // 👉 login exitoso
      console.log('[LOGIN] Login exitoso');
      router.replace('/(app)/(tabs)/businesses');
    } catch (error: any) {
      console.error('[LOGIN] Error:', error);
      Alert.alert(
        'Error al iniciar sesión',
        error?.message ?? 'Credenciales incorrectas'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Tarjeta de login */}
      <View style={styles.card}>
        {/* Logo dentro del card */}
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.cardTitle}>Iniciar Sesión</Text>

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

        {/* Contraseña */}
        <View style={styles.inputGroup}>
          <View style={styles.passwordHeader}>
            <Text style={styles.label}>Contraseña</Text>
            <Link href="/(auth)/recover">
              <Text style={styles.forgotPassword}>¿Olvidaste la contraseña?</Text>
            </Link>
          </View>
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

        {/* Botón Iniciar Sesión */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            loading && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Opciones de cuenta */}
        <View style={styles.accountOptions}>
          <Text style={styles.accountText}>
            ¿No tienes cuenta?{' '}
            <Link href="/(auth)/register">
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </Link>
          </Text>

          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continuar sin cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pie de página */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Al iniciar sesión, aceptas nuestros{' '}
          <Text style={styles.footerLink}>Términos y Condiciones</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 0.5,
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
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPassword: {
    fontSize: 12,
    color: '#10b981',
    textDecorationLine: 'underline',
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
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 20,
  },
  accountOptions: {
    alignItems: 'center',
  },
  accountText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  registerLink: {
    color: '#10b981',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  continueButton: {
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    backgroundColor: '#fafafa',
  },
  continueButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    marginBottom: 20,
    paddingHorizontal: 16,
    width: '100%' as any,
    maxWidth: 480,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#10b981',
    textDecorationLine: 'underline',
  },
});
