import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import img from '../../assets/images/dummy.png';
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../assets/icons';

export default function EventAdCard({
    title = 'Corporate Event',
    location = 'Ontario, Canada',
    duration = '2 hours',
    date = 'October 30, 2023',
    time,
    budget,
    guests,
    service_needed,
    event_type,
    status = 'LIVE',
    statusColor = '#2ECC71',
    approval_status,  // New prop for approval status
    profile = {
        name: 'Rachel Swan',
        image: img,
    },
    description = 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet.',
    attachments,
    onComplete = () => { },
}) {
    const theme = useTheme();
    const navigation = useNavigation();
    const safeAttachments = Array.isArray(attachments) ? attachments : [];
    
    // Debug logging for attachments
    console.log('🎴 EventAdCard - attachments received:', {
        title,
        attachmentsCount: safeAttachments.length,
        attachments: safeAttachments,
        firstImage: safeAttachments[0]
    });

    const handleCardPress = () => {
        // Create event object from props
        const event = {
            title,
            location,
            duration,
            date,
            time,
            budget,
            guests,
            service_needed,
            event_type,
            status,
            statusColor,
            profile,
            description,
            attachments: safeAttachments,
        };

        navigation.navigate('EventDetailView', { event });
    };

    return (
        <TouchableOpacity style={[styles.card, { padding: 16, marginBottom: 18 }]} onPress={handleCardPress}>
            {/* Approval Status Banner for pending/rejected ads */}
            {approval_status && approval_status !== 'approved' && (
                <View style={[
                    styles.approvalBanner,
                    { backgroundColor: approval_status === 'pending' ? '#FFA500' : '#FF4444' }
                ]}>
                    <Icon 
                        name={approval_status === 'pending' ? 'time-outline' : 'close-circle-outline'} 
                        size={16} 
                        color="#fff" 
                    />
                    <Text style={styles.approvalBannerText}>
                        {approval_status === 'pending' ? 'Waiting for approval' : 'Rejected - Please review and resubmit'}
                    </Text>
                </View>
            )}
            
            {/* Title, Status, and More Icon Row */}
            <View style={styles.rowBetween}>
                <Text style={[styles.title, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
                <View style={styles.rowRight}>
                    <View style={styles.statusWrapper}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{status}</Text>
                    </View>
                    <TouchableOpacity>
                        <Icon name="ellipsis-horizontal" size={22} color={theme.colors.primary} style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Meta Row: Location, Time, Date (all in one row) */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Image source={icons.location} style={styles.metaIcon} />
                    <Text style={[styles.metaText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{location}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Image source={icons.clock} style={styles.metaIcon} />
                    <Text style={[styles.metaText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{duration}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Image source={icons.calendar} style={styles.metaIcon} />
                    <Text style={[styles.metaText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{date}</Text>
                </View>
            </View>

            {/* Profile + Description */}
            <View style={[styles.profileRow, { marginTop: 6, marginBottom: 12 }]}> {/* Adjusted spacing */}
                <View style={{ alignItems: 'center', marginRight: 12 }}>
                    <Image source={profile.image} style={styles.avatar} />
                    <Text style={[styles.profileName, { color: theme.colors.primary, marginTop: 6 }]} numberOfLines={1} ellipsizeMode="tail">{profile.name}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.description} numberOfLines={4} ellipsizeMode="tail">{description}</Text>
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
                        {safeAttachments.map((imageItem, index) => {
                            // Ensure we have a valid image source
                            let imageSource;
                            if (typeof imageItem === 'string') {
                                // If it's a string URL, ensure it's properly formatted
                                const imageUrl = imageItem.startsWith('http') ? imageItem : `https://api.evnzo.com${imageItem}`;
                                imageSource = { uri: imageUrl };
                                console.log(`🖼️ EventAdCard - Image ${index} URL:`, imageUrl);
                            } else if (typeof imageItem === 'object' && imageItem.uri) {
                                // If it's already an object with uri
                                imageSource = imageItem;
                            } else {
                                // Fallback to dummy image
                                imageSource = img;
                            }
                            
                            return (
                                <Image 
                                    key={index} 
                                    source={imageSource}
                                    style={styles.attachmentImage}
                                    defaultSource={img} // Fallback image
                                    onError={(error) => {
                                        console.log(`❌ EventAdCard - Image ${index} load error:`, error.nativeEvent);
                                    }}
                                />
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Complete Button */}
            <TouchableOpacity style={[styles.completeBtn, { backgroundColor: theme.colors.tabBackground, shadowColor: theme.colors.tabBackground, marginTop: 14 }]} onPress={onComplete}>
                <Text style={[styles.completeText, { color: theme.colors.primary }]}>MARK AS COMPLETE</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 18,
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F3F8',
        marginHorizontal: 10,

    },
    approvalBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 12,
        marginTop: -8,
        marginHorizontal: -8,
    },
    approvalBannerText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.2,
        flex: 1,
        marginRight: 8,
    },
    statusWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F6FA',
        borderRadius: 14,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginLeft: 0,
    },
    statusDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
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
    metaIcon: {
        width: 16,
        height: 16,
        resizeMode: 'contain',
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
    profileInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
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
    },
    attachmentSection: {
        borderTopWidth: 2,
        borderTopColor: '#F2F2F2',
        // backgroundColor: '#F2F2F2',
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
        width: 110,
        height: 75,
        borderRadius: 20,
        marginRight: 14,
        backgroundColor: '#F4F4F4',
        borderWidth: 1,
        borderColor: '#E5EAF2',
    },
    completeBtn: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 2,
    },
    completeText: {
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.2,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: -4,
    },
});
