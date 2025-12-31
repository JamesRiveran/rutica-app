import LocationPicker from '@/components/forms/location-picker';
import { supabase } from '@/lib/supabase';
import { createBusiness } from '@/services/businesses';
import { updateUserRole } from '@/services/profiles';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

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
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Images
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [businessImages, setBusinessImages] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const pickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const pickBusinessImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultiple: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setBusinessImages([...businessImages, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar las imágenes');
    }
  };

  const removeBusinessImage = (index: number) => {
    setBusinessImages(businessImages.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'El nombre del comercio es obligatorio');
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert(
        'Ubicación requerida',
        'Debes seleccionar la ubicación en el mapa'
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
        latitude: latitude,
        longitude: longitude,

        // Images
        logoUri: logoUri || undefined,
        imageUris: businessImages.length > 0 ? businessImages : undefined,
      });

      // Actualizar rol a seller si es buyer
      const { data: profile } = await supabase
        .from('profiles')
        .select('role_prf')
        .eq('id_prf', data.user.id)
        .single();

      if (profile && profile.role_prf === 'buyer') {
        await updateUserRole(data.user.id, 'seller');
      }

      Alert.alert(
        'Comercio registrado',
        'Tu comercio fue enviado para revisión. ¡Ahora eres vendedor!'
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
        
        <Text style={styles.mapLabel}>Ubicación en el mapa *</Text>
        <LocationPicker
          initialLatitude={latitude || undefined}
          initialLongitude={longitude || undefined}
          onLocationSelect={(data) => {
            setLatitude(data.latitude);
            setLongitude(data.longitude);
            
            // Llenar campos automáticamente si están vacíos
            if (data.country && !country) setCountry(data.country);
            if (data.province && !province) setProvince(data.province);
            if (data.canton && !canton) setCanton(data.canton);
            if (data.district && !district) setDistrict(data.district);
            if (data.address && !address) setAddress(data.address);
          }}
          height={350}
        />

        {latitude && longitude && (
          <View style={styles.selectedCoordinates}>
            <Text style={styles.coordSelectedText}>
              ✓ Ubicación seleccionada: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </Section>

      {/* IMAGES */}
      <Section title="Imágenes">
        {/* Logo */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Logo del comercio</Text>
          {logoUri && (
            <View style={styles.logoPreview}>
              <Image
                source={{ uri: logoUri }}
                style={styles.logoImage}
              />
              <Pressable
                style={styles.removeButton}
                onPress={() => setLogoUri(null)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </Pressable>
            </View>
          )}
          <Pressable style={styles.pickButton} onPress={pickLogo}>
            <Text style={styles.pickButtonText}>
              {logoUri ? '📷 Cambiar logo' : '📷 Seleccionar logo'}
            </Text>
          </Pressable>
        </View>

        {/* Imágenes del negocio */}
        <View style={[styles.imageSection, { marginTop: 16 }]}>
          <Text style={styles.label}>Imágenes del negocio (galería)</Text>
          {businessImages.length > 0 && (
            <View style={styles.imagesGrid}>
              {businessImages.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image
                    source={{ uri }}
                    style={styles.galleryImage}
                  />
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeBusinessImage(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <Pressable style={styles.pickButton} onPress={pickBusinessImages}>
            <Text style={styles.pickButtonText}>
              {businessImages.length > 0
                ? `📸 Agregar más imágenes (${businessImages.length})`
                : '📸 Seleccionar imágenes'}
            </Text>
          </Pressable>
        </View>
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
  mapLabel: {
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
    color: '#333',
    fontWeight: '500',
  },
  selectedCoordinates: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  coordSelectedText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '500',
  },
  imageSection: {
    marginBottom: 14,
  },
  logoPreview: {
    position: 'relative',
    marginBottom: 12,
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '48%',
  },
  galleryImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff3b30',
    borderRadius: 50,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pickButton: {
    backgroundColor: '#e8e8e8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderStyle: 'dashed',
  },
  pickButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
}); 