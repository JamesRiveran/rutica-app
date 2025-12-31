import { Image, Pressable, Text, View, ScrollView } from 'react-native';
import { styles } from './styles';
import { getImageUrl } from '@/services/businesses';

export type BusinessStatus = 'pending' | 'approved' | 'rejected';

interface BusinessImage {
  bucket_bim: 'business-logos' | 'business-images';
  path_bim: string;
  sort_order_bim: number;
}

interface BusinessCardProps {
  name: string;
  description?: string;
  whatsapp?: string | null;
  status: BusinessStatus;
  onPress?: () => void;
  imageUrl?: string | null;
  location?: string | null;
  businessImages?: BusinessImage[];
  logo?: BusinessImage | null;
}

export function BusinessCard({
  name,
  description,
  whatsapp,
  status,
  onPress,
  imageUrl,
  location,
  businessImages = [],
  logo,
}: BusinessCardProps) {
  // Obtener URL del logo
  const logoUrl = logo ? getImageUrl('business-logos', logo.path_bim) : null;

  // Obtener URLs de imágenes del negocio (ordenadas por sort_order)
  const galleryImages = businessImages
    .sort((a, b) => a.sort_order_bim - b.sort_order_bim)
    .map((img) => ({
      ...img,
      url: getImageUrl('business-images', img.path_bim),
    }));

  // Usar primera imagen de galería o logo como imagen principal
  const heroImageUrl = galleryImages.length > 0 ? galleryImages[0].url : logoUrl || imageUrl;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Hero Image */}
      {heroImageUrl ? (
        <Image source={{ uri: heroImageUrl }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]} />
      )}

      {/* Logo + Header */}
      <View style={styles.headerContainer}>
        {logoUrl && (
          <Image source={{ uri: logoUrl }} style={styles.logo} />
        )}
        <View style={styles.headerContent}>
          <Text style={styles.name}>{name}</Text>
          <StatusBadge status={status} />
        </View>
      </View>

      {description ? (
        <Text
          style={styles.description}
          numberOfLines={2}
        >
          {description}
        </Text>
      ) : null}

      {/* WhatsApp Contact */}
      {whatsapp && (
        <View style={styles.whatsappContainer}>
          <Text style={styles.whatsappIcon}>💬</Text>
          <Text style={styles.whatsappText}>{whatsapp}</Text>
        </View>
      )}

      {/* Gallery Thumbnails */}
      {galleryImages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.galleryContainer}
          contentContainerStyle={styles.galleryContent}
        >
          {galleryImages.map((img, index) => (
            <Image
              key={`${img.path_bim}-${index}`}
              source={{ uri: img.url }}
              style={styles.galleryThumbnail}
            />
          ))}
        </ScrollView>
      )}

      {location ? (
        <Text style={styles.location} numberOfLines={1}>{location}</Text>
      ) : null}
    </Pressable>
  );
}

/* ---------- Status Badge ---------- */

function StatusBadge({
  status,
}: {
  status: BusinessStatus;
}) {
  const labelMap: Record<BusinessStatus, string> = {
    pending: 'En revisión',
    approved: 'Activo',
    rejected: 'Rechazado',
  };

  return (
    <View
      style={[
        styles.badge,
        styles[`badge_${status}`],
      ]}
    >
      <Text style={styles.badgeText}>
        {labelMap[status]}
      </Text>
    </View>
  );
}
