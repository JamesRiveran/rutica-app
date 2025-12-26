import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { signUp } from '@/services/auth';
import { Link } from 'expo-router';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (!email || !password || !name) {
      Alert.alert(
        'Campos incompletos',
        'Por favor completa todos los campos obligatorios.'
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
        'Tu cuenta fue creada correctamente.'
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
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>
        Registrate para descubrir comercios y lugares cerca de vos
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Juan Pérez"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teléfono (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 8888-8888"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de cuenta</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={role}
            onValueChange={(value) => setRole(value)}
          >
            <Picker.Item label="Comprador" value="buyer" />
            <Picker.Item label="Vendedor" value="seller" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.button}>
        <Button
          title={loading ? 'Creando cuenta...' : 'Crear cuenta'}
          onPress={handleRegister}
          disabled={loading}
        />
      </View>

      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Text style={{ color: '#666' }}>
          ¿Ya tenés cuenta?
        </Text>

        <Link href="/(auth)/login">
          <Text style={{ color: '#007AFF', marginTop: 4 }}>
            Iniciar sesión
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
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  button: {
    marginTop: 16,
  },
});
