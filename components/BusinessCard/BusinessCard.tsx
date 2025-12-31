import { Image, Pressable, Text, View } from 'react-native';
import { styles } from './styles';

export type BusinessStatus = 'pending' | 'approved' | 'rejected';

interface BusinessCardProps {
    name: string;
    description?: string;
    status: BusinessStatus;
    onPress?: () => void;
    imageUrl?: string | null;
    location?: string | null;
}

export function BusinessCard({
    name,
    description,
    status,
    onPress,
    imageUrl,
    location,
}: BusinessCardProps) {
    return (
        <Pressable
            style={styles.card}
            onPress={onPress}
            disabled={!onPress}
        >
            {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.hero} />
            ) : (
                <View style={[styles.hero, styles.heroPlaceholder]} />
            )}

            <View style={styles.header}>
                <Text style={styles.name}>{name}</Text>
                <StatusBadge status={status} />
            </View>

            {description ? (
                <Text style={styles.description} numberOfLines={2}>
                    {description}
                </Text>
            ) : null}

            {location ? (
                <Text style={styles.location} numberOfLines={1}>{location}</Text>
            ) : null}
        </Pressable>
    );
}

/* ---------- Status Badge ---------- */

function StatusBadge({ status }: { status: BusinessStatus }) {
    const labels: Record<BusinessStatus, string> = {
        pending: 'En revisión',
        approved: 'Activo',
        rejected: 'Rechazado',
    };

    return (
        <View style={[styles.badge, styles[`badge_${status}`]]}>
            <Text style={styles.badgeText}>{labels[status]}</Text>
        </View>
    );
}
