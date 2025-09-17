import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';

export default function EventCard({ event, onGiveQuote }) {
    const navigation = useNavigation();
    const theme = useTheme();
    const safeAttachments = Array.isArray(event.attachments) ? event.attachments : [];
    
    console.log('🎴 EventCard rendering:', event.title, '- attachments:', safeAttachments.length);

    const handleCardPress = () => {
        navigation.navigate('EventDetailView', { event });
    };

    return (
        <TouchableOpacity style={[styles.card]} onPress={handleCardPress}>
            {/* Title, Status, and More Icon Row */}
            <View style={styles.rowBetween}>
                <Text style={[styles.title]} numberOfLines={1} ellipsizeMode="tail">{event.title}</Text>
                <TouchableOpacity>
                    <Icon name="ellipsis-horizontal" size={22} color={theme.colors.primary} style={{ marginLeft: 10 }} />
                </TouchableOpacity>
            </View>

            {/* Meta Row: Location, Time, Date (all in one row) */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Icon name="location-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.metaText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{event.location}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Icon name="time-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.metaText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{event.duration}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Icon name="calendar-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.metaText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{event.date}</Text>
                </View>
            </View>

            {/* Profile + Description */}
            <View style={[styles.profileRow, { marginTop: 6, marginBottom: 12 }]}> {/* Adjusted spacing */}
                <View style={{ alignItems: 'center', marginRight: 12 }}>
                    <Image source={{ uri: event.organizer.avatar }} style={styles.avatar} />
                    <Text style={[styles.profileName, { color: theme.colors.primary, marginTop: 6 }]} numberOfLines={1} ellipsizeMode="tail">{event.organizer.name}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.description} numberOfLines={4} ellipsizeMode="tail">{event.description}</Text>
                    {/* Budget */}
                    {event.budget && (
                        <View style={styles.budgetContainer}>
                            <Text style={styles.budgetLabel}>Budget: </Text>
                            <View style={styles.budgetItem}>
                                <Text style={[styles.budgetText, { color: theme.colors.primary }]}>${event.budget}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Attachments */}
            {safeAttachments.length > 0 && (
                <View style={[styles.attachmentSection, { borderTopWidth: 2, paddingTop: 12, marginTop: 4 }]}> {/* Enhanced divider */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
                        <Icon name="attach" size={18} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                        <Text style={[styles.attachmentTitle, { color: theme.colors.primary }]}>Attachments</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {safeAttachments.map((img, index) => (
                            <Image key={index} source={{ uri: img }} style={styles.attachmentImage} />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* CTA Buttons */}
            <View style={styles.ctaContainer}>
                <TouchableOpacity style={[styles.giveQuoteButton, { backgroundColor: theme.colors.tabBackground }]} onPress={onGiveQuote}>
                    <Text style={[styles.giveQuoteText, { color: theme.colors.primary }]}>GIVE A QUOTE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.colors.primary }]} onPress={onGiveQuote}>
                    <Icon name="paper-plane" size={16} color="#fff" style={{ transform: [{ rotate: '30deg' }] }} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 18,
        shadowRadius: 12,
        elevation: 5,
        marginHorizontal: 10,
        alignSelf: 'stretch',
        minHeight: 0,
        boxShadow: `2px 2px 4px 0px #0000001A`,


    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 0.2,
        flex: 1,
        marginRight: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F4F4',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 0,
        marginTop: 0,
        marginBottom: 4,
        minWidth: 0,
        maxWidth: '100%',
    },
    metaText: {
        fontSize: 11,
        marginLeft: 6,
        fontWeight: '600',
    },
    profileRow: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 10,
        marginBottom: 18,
        alignItems: 'flex-start',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D9D9D9',
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileName: {
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 2,
    },
    description: {
        fontSize: 13,
        color: '#444',
        lineHeight: 18,
        fontWeight: '400',
        marginTop: 4,
    },
    budgetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    budgetLabel: {
        fontSize: 13,
        color: '#444',
        fontWeight: '500',
        marginRight: 6,
    },
    budgetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F4F4',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    budgetText: {
        fontSize: 12,
        fontWeight: '700',
    },
    attachmentSection: {
        borderTopWidth: 2,
        borderTopColor: '#F2F2F2',
        paddingTop: 12,
        marginTop: 4,
    },
    attachmentTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.1,
    },
    attachmentImage: {
        width: 70,
        height: 60,
        borderRadius: 20,
        marginRight: 14,
        backgroundColor: '#F4F4F4',
        borderWidth: 1,
        borderColor: '#E5EAF2',
    },
    ctaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
    },
    giveQuoteButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    giveQuoteText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 1
    },
});
