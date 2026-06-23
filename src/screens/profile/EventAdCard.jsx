import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActionSheetIOS,
    Platform,
    ActivityIndicator,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import eventService from '../../services/eventService';
import img from '../../assets/images/dummy.png';
import { thumbnailUrl } from '../../utils/imageUtils';
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../assets/icons';
import FastImage from 'react-native-fast-image';

export default function EventAdCard({
    eventId,
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
    onDelete = () => { },
}) {
    const theme = useTheme();
    const navigation = useNavigation();
    const safeAttachments = Array.isArray(attachments) ? attachments : [];
    const [isCompleting, setIsCompleting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Only LIVE ads can be completed. COMPLETED / CANCELLED / PENDING /
    // REJECTED are dead-end states for this action.
    const canComplete = String(status).toUpperCase() === 'LIVE';
    const isAlreadyComplete = String(status).toUpperCase() === 'COMPLETED';

    // Open the styled delete confirmation modal. Used by both the visible
    // DELETE button on the card and the three-dots action sheet.
    const openDeleteModal = () => setShowDeleteModal(true);

    // Actual destructive call. Fires after the user confirms in the modal.
    const performDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            if (!eventId) {
                onDelete();
                setShowDeleteModal(false);
                return;
            }
            const res = await eventService.deleteEventAd(eventId);
            if (res?.success) {
                setShowDeleteModal(false);
                onDelete(eventId);
            } else {
                Alert.alert('Error', res?.message || 'Failed to delete the ad.');
            }
        } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to delete the ad.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Hits the backend, then bubbles up to the parent on success so the
    // dashboard can refresh / re-paint. Used by BOTH the in-card
    // "MARK AS COMPLETE" button and the three-dots action sheet.
    const triggerComplete = async () => {
        if (isCompleting || !canComplete) return;
        if (!eventId) {
            onComplete();
            return;
        }
        setIsCompleting(true);
        try {
            const res = await eventService.markEventAdComplete(eventId);
            if (res?.success) {
                onComplete(eventId);
            } else {
                Alert.alert('Error', res?.message || 'Failed to mark the ad as complete.');
            }
        } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to mark the ad as complete.');
        } finally {
            setIsCompleting(false);
        }
    };

    // Owner action menu — only Live ads show "Mark as Complete"; every ad
    // can be deleted. Uses ActionSheetIOS on iOS, a 3-button Alert on Android.
    // The destructive Delete option opens the styled confirmation modal
    // (not a native Alert), matching the visible DELETE button below.
    const handleMoreOptions = () => {
        if (Platform.OS === 'ios') {
            const options = [];
            if (canComplete) options.push('Mark as Complete');
            options.push('Delete');
            options.push('Cancel');
            const destructiveIndex = options.indexOf('Delete');
            const cancelIndex = options.indexOf('Cancel');
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex: destructiveIndex,
                    cancelButtonIndex: cancelIndex,
                },
                (idx) => {
                    if (idx === cancelIndex) return;
                    if (options[idx] === 'Mark as Complete') triggerComplete();
                    if (options[idx] === 'Delete') openDeleteModal();
                },
            );
        } else {
            const buttons = [];
            if (canComplete) {
                buttons.push({ text: 'Mark as Complete', onPress: triggerComplete });
            }
            buttons.push({ text: 'Delete', style: 'destructive', onPress: openDeleteModal });
            buttons.push({ text: 'Cancel', style: 'cancel' });
            Alert.alert(title || 'Options', null, buttons);
        }
    };
    
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
            {/* Approval status banner removed — event ads are auto-approved
                on insert (services/eventAd.service.js:22), so the "Waiting
                for approval" / "Rejected" UI is dead state that confused
                users. Restore from git history if moderation is re-introduced. */}


            {/* Title, Status, and More Icon Row */}
            <View style={styles.rowBetween}>
                <Text style={[styles.title, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
                <View style={styles.rowRight}>
                    <View style={styles.statusWrapper}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">{status}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleMoreOptions}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Icon name="ellipsis-horizontal" size={22} color={theme.colors.primary} style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Meta Row: Location, Time, Date (all in one row) */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Image source={icons.location} style={styles.metaIcon} />
                    <Text
                        style={[styles.metaText, { color: theme.colors.primary }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {/* City only — same trimming as the public Events
                            list. Splits the full address on commas and
                            takes the first segment. */}
                        {(typeof location === 'string'
                            ? location.split(',')[0].trim()
                            : location)}
                    </Text>
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
                            // Normalize to a FastImage source. Strings get the
                            // api host prepended when relative; objects with
                            // .uri pass through; anything weird falls back to
                            // the local dummy png.
                            let imageSource;
                            if (typeof imageItem === 'string') {
                                const imageUrl = imageItem.startsWith('http')
                                    ? imageItem
                                    : `https://api.evnzo.com${imageItem}`;
                                imageSource = { uri: thumbnailUrl(imageUrl, 600), priority: FastImage.priority.low };
                            } else if (typeof imageItem === 'object' && imageItem.uri) {
                                imageSource = { uri: thumbnailUrl(imageItem.uri, 600), priority: FastImage.priority.low };
                            } else {
                                imageSource = img;
                            }

                            return (
                                <FastImage
                                    key={index}
                                    source={imageSource}
                                    style={styles.attachmentImage}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Complete Button — actionable only when ad is LIVE. For
                already-completed events render a non-tappable "Completed"
                pill so the slot stays in the same visual position. */}
            {isAlreadyComplete ? (
                <View
                    style={[
                        styles.completeBtn,
                        { backgroundColor: '#E8F5E9', shadowColor: 'transparent', marginTop: 14 },
                    ]}
                >
                    <Text style={[styles.completeText, { color: '#2E7D32' }]}>✓ COMPLETED</Text>
                </View>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.completeBtn,
                        {
                            backgroundColor: theme.colors.tabBackground,
                            shadowColor: theme.colors.tabBackground,
                            marginTop: 14,
                            opacity: canComplete && !isCompleting ? 1 : 0.5,
                        },
                    ]}
                    onPress={triggerComplete}
                    disabled={!canComplete || isCompleting}
                >
                    {isCompleting ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Text style={[styles.completeText, { color: theme.colors.primary }]}>
                            MARK AS COMPLETE
                        </Text>
                    )}
                </TouchableOpacity>
            )}

            {/* Confirmation modal — opened by the three-dots action
                sheet's Delete option. The in-card Delete button was
                removed; the three-dots menu remains the only entry. */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Delete this ad?</Text>
                        <Text style={styles.modalBody}>
                            This will remove the event ad permanently. This action can't be undone.
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalCancelBtn]}
                                onPress={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalDeleteBtn, isDeleting && { opacity: 0.7 }]}
                                onPress={performDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalDeleteText}>Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 10,
    },
    modalBody: {
        fontSize: 14,
        color: '#5F6368',
        lineHeight: 20,
        marginBottom: 22,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelBtn: {
        backgroundColor: '#F1F3F4',
    },
    modalCancelText: {
        color: '#3C4043',
        fontWeight: '600',
        fontSize: 15,
    },
    modalDeleteBtn: {
        backgroundColor: '#C62828',
    },
    modalDeleteText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: -4,
    },
});
