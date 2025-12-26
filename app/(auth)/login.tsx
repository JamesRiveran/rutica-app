import { signIn } from '@/services/auth';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Ingresa correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);

      // 👉 login exitoso
      router.replace('/(app)/(tabs)/home');
    } catch (error: any) {
      Alert.alert(
        'Error al iniciar sesión',
        error?.message ?? 'Credenciales incorrectas'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <Text style={styles.subtitle}>Bienvenido de nuevo a Rutica</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Button
        title={loading ? 'Ingresando...' : 'Ingresar'}
        onPress={handleLogin}
        disabled={loading}
      />

      <View style={{ marginTop: 16, alignItems: 'center' }}>
        <Text>¿No tenés cuenta?</Text>
        <Link href="/(auth)/register">
          <Text style={{ color: '#007AFF', marginTop: 4 }}>
            Crear una cuenta
          </Text>
        </Link>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
});
