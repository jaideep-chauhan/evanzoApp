import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

// Reusable shimmer block. Uses a soft opacity pulse (cheap, JS-driven) rather
// than a moving gradient — gradients on Animated.Image are noticeably more
// expensive on lower-end Androids and we just want the "something's loading"
// signal, not a stylish shimmer.
const Pulse = ({ style }) => {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return <Animated.View style={[styles.block, style, { opacity }]} />;
};

// Vendor card skeleton — image + title + meta row, mirroring VendorCard.
export const VendorCardSkeleton = () => (
    <View style={styles.vendorCard}>
        <View style={styles.vendorHeader}>
            <Pulse style={styles.avatar} />
            <View style={styles.vendorTitleBlock}>
                <Pulse style={styles.lineWide} />
                <View style={styles.vendorTagRow}>
                    <Pulse style={styles.chip} />
                    <Pulse style={styles.chip} />
                </View>
            </View>
            <Pulse style={styles.ratingBox} />
        </View>
        <Pulse style={styles.heroImage} />
        <View style={styles.vendorFooter}>
            <Pulse style={styles.lineMedium} />
            <Pulse style={styles.lineShort} />
        </View>
    </View>
);

// Event card skeleton — title row + meta row + description + CTA strip.
export const EventCardSkeleton = () => (
    <View style={styles.eventCard}>
        <Pulse style={styles.lineWide} />
        <View style={styles.eventMetaRow}>
            <Pulse style={styles.chip} />
            <Pulse style={styles.chip} />
            <Pulse style={styles.chip} />
        </View>
        <View style={styles.eventBody}>
            <Pulse style={styles.eventAvatar} />
            <View style={{ flex: 1, gap: 6 }}>
                <Pulse style={styles.lineWide} />
                <Pulse style={styles.lineMedium} />
                <Pulse style={styles.lineMedium} />
            </View>
        </View>
        <View style={styles.eventCtaRow}>
            <Pulse style={styles.ctaButton} />
            <Pulse style={styles.ctaCircle} />
        </View>
    </View>
);

// Chat row skeleton — avatar + name + last message + timestamp + unread pill.
export const ChatRowSkeleton = () => (
    <View style={styles.chatRow}>
        <Pulse style={styles.chatAvatar} />
        <View style={{ flex: 1, gap: 6 }}>
            <Pulse style={styles.lineWide} />
            <Pulse style={styles.lineMedium} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Pulse style={styles.chatTime} />
            <Pulse style={styles.chatBadge} />
        </View>
    </View>
);

// Notification row skeleton — icon circle + title + message + timestamp.
export const NotificationSkeleton = () => (
    <View style={styles.notifRow}>
        <Pulse style={styles.notifIcon} />
        <View style={{ flex: 1, gap: 6 }}>
            <Pulse style={styles.lineWide} />
            <Pulse style={styles.lineMedium} />
        </View>
        <Pulse style={styles.notifTime} />
    </View>
);

// Helper for FlatList ListEmptyComponent / inline render — `renderSkeletons(VendorCardSkeleton, 3)`.
export const renderSkeletons = (Component, count = 3) => (
    <View>
        {Array.from({ length: count }).map((_, i) => (
            <Component key={`sk-${i}`} />
        ))}
    </View>
);

const BASE = '#E5E9F0';

const styles = StyleSheet.create({
    block: {
        backgroundColor: BASE,
        borderRadius: 6,
    },
    lineWide: { height: 14, width: '85%', borderRadius: 6, backgroundColor: BASE },
    lineMedium: { height: 12, width: '65%', borderRadius: 6, backgroundColor: BASE },
    lineShort: { height: 12, width: '40%', borderRadius: 6, backgroundColor: BASE },
    chip: { height: 22, width: 78, borderRadius: 12, backgroundColor: BASE },

    // Vendor card
    vendorCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        marginHorizontal: 10,
        marginBottom: 14,
        padding: 14,
        gap: 10,
        boxShadow: '2px 2px 4px 0px #0000000F',
        elevation: 1,
    },
    vendorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: BASE },
    vendorTitleBlock: { flex: 1, gap: 6 },
    vendorTagRow: { flexDirection: 'row', gap: 6 },
    ratingBox: { width: 48, height: 28, borderRadius: 8, backgroundColor: BASE },
    heroImage: { height: 180, borderRadius: 14, backgroundColor: BASE },
    vendorFooter: { gap: 6 },

    // Event card
    eventCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginHorizontal: 10,
        marginBottom: 18,
        padding: 16,
        gap: 12,
        boxShadow: '2px 2px 4px 0px #0000001A',
        elevation: 1,
    },
    eventMetaRow: { flexDirection: 'row', gap: 8 },
    eventBody: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    eventAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: BASE },
    eventCtaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ctaButton: { flex: 1, height: 38, borderRadius: 10, backgroundColor: BASE },
    ctaCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: BASE },

    // Notification
    notifRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    notifIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: BASE },
    notifTime: { width: 50, height: 10, borderRadius: 5, backgroundColor: BASE },

    // Chat row
    chatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    chatAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: BASE },
    chatTime: { width: 40, height: 10, borderRadius: 5, backgroundColor: BASE },
    chatBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: BASE },
});

export default {
    VendorCardSkeleton,
    EventCardSkeleton,
    NotificationSkeleton,
    ChatRowSkeleton,
    renderSkeletons,
};
