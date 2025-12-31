import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface PromoCardProps {
    title: string;
    business?: string | null;
    description?: string | null;
    discountLabel?: string | null;
    imageUrl?: string | null;
    onPress?: () => void;
}

export function PromoCard({
    title,
    business,
    description,
    discountLabel,
    imageUrl,
    onPress,
}: PromoCardProps) {
    return (
        <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
            {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.imagePlaceholder]} />
            )}
            <View style={styles.overlay} />
            {discountLabel ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{discountLabel}</Text>
                </View>
            ) : null}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                {business ? (
                    <Text style={styles.business} numberOfLines={1}>{business}</Text>
                ) : null}
                {description ? (
                    <Text style={styles.description} numberOfLines={2}>{description}</Text>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        marginBottom: 12,
    },
    image: {
        width: '100%',
        height: 160,
    },
    imagePlaceholder: {
        backgroundColor: '#e5e7eb',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#F97316',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    badgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    content: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    business: {
        color: '#e2e8f0',
        marginTop: 2,
        fontSize: 13,
    },
    description: {
        color: '#cbd5e1',
        marginTop: 4,
        fontSize: 12,
    },
});
