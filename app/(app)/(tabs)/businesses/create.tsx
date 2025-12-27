import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { createBusiness } from '@/services/businesses';

export default function CreateBusinessScreen() {
  // Business
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Contact
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Location
  const [country, setCountry] = useState('');
  const [province, setProvince] = useState('');
  const [canton, setCanton] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'El nombre del comercio es obligatorio');
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert(
        'Ubicación requerida',
        'Debes ingresar latitud y longitud'
      );
      return;
    }

    setLoading(true);

    try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
        throw new Error('Usuario no autenticado');
        }

        if (!data.user.email_confirmed_at) {
        Alert.alert(
            'Correo no confirmado',
            'Debes confirmar tu correo electrónico antes de registrar un comercio.'
        );
        return;
        }


      await createBusiness({
        ownerId: data.user.id,

        // Business
        name: name.trim(),
        description: description.trim() || undefined,

        // Contact
        whatsapp: whatsapp.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,

        // Location
        country: country.trim() || undefined,
        province: province.trim() || undefined,
        canton: canton.trim() || undefined,
        district: district.trim() || undefined,
        address: address.trim() || undefined,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      Alert.alert(
        'Comercio registrado',
        'Tu comercio fue enviado para revisión.'
      );

      router.back();
    } catch (e: any) {
      console.error('[BUSINESS]', e);
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar comercio</Text>
      <Text style={styles.subtitle}>
        Completa la información de tu comercio
      </Text>

      {/* INFO */}
      <Section title="Información del comercio">
        <Input label="Nombre del comercio *" value={name} onChangeText={setName} />
        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </Section>

      {/* CONTACT */}
      <Section title="Datos de contacto">
        <Input
          label="WhatsApp"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
        />
        <Input
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Input
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Sitio web"
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
        />
      </Section>

      {/* LOCATION */}
      <Section title="Ubicación">
        <Input label="País" value={country} onChangeText={setCountry} />
        <Input label="Provincia" value={province} onChangeText={setProvince} />
        <Input label="Cantón" value={canton} onChangeText={setCanton} />
        <Input label="Distrito" value={district} onChangeText={setDistrict} />
        <Input label="Dirección" value={address} onChangeText={setAddress} />
        <Input
          label="Latitud *"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numeric"
        />
        <Input
          label="Longitud *"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numeric"
        />
      </Section>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Registrando…' : 'Registrar comercio'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

/* ---------- UI helpers ---------- */

function Section({ title, children }: any) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Input({ label, ...props }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 