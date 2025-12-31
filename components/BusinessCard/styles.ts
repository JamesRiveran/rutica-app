import { StyleSheet } from 'react-native';
import { getShadowStyle } from '@/utils/shadowHelper';

export const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        ...getShadowStyle({
            color: '#0f172a',
            offsetY: 4,
            opacity: 0.06,
            radius: 8,
        }),
    },
    hero: {
        width: '100%',
        height: 140,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: '#dfe3e6',
    },
    heroPlaceholder: {
        backgroundColor: '#e5e7eb',
    },
    
    /* Header with Logo */
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    logo: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#f0f0f0',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    description: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
        marginBottom: 8,
    },
    
    /* WhatsApp Contact */
    whatsappContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        borderLeftWidth: 3,
        borderLeftColor: '#25D366',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    whatsappIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    whatsappText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1B5E20',
    },
    
    /* Gallery */
    galleryContainer: {
        marginVertical: 8,
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    galleryContent: {
        gap: 8,
    },
    galleryThumbnail: {
        width: 100,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    
    location: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 4,
    },

    /* Badge */
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },

    badge_pending: {
        backgroundColor: '#FEF3C7',
    },
    badge_approved: {
        backgroundColor: '#ECFDF5',
    },
    badge_rejected: {
        backgroundColor: '#FEE2E2',
    },
});
