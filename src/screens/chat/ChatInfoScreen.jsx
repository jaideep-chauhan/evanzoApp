import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    Platform,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../ThemeContext';
import chatService from '../../services/chatService';
import settingsService from '../../services/settingsService';
import ReportUserModal from '../../components/ReportUserModal';
import BlockUserModal from '../../components/BlockUserModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_PREVIEW_SIZE = (SCREEN_WIDTH - 48 - 12) / 4;

// File type constants for media detection
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

const ChatInfoScreen = ({ route, navigation }) => {
    const theme = useTheme();
    const { chatId, chatName, avatar, recipientId, isOnline } = route.params || {};

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Report & Block modal states
    const [showReportModal, setShowReportModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [isUserBlocked, setIsUserBlocked] = useState(false);

    // Get initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.trim().split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Load current user and messages
    useEffect(() => {
        const loadData = async () => {
            try {
                // Get current user ID
                const userId = await AsyncStorage.getItem('userId');
                if (userId) {
                    setCurrentUserId(userId);
                }

                // Check if user is blocked
                if (recipientId) {
                    try {
                        const blockedResult = await settingsService.getBlockedUsers();
                        if (blockedResult.success && Array.isArray(blockedResult.data)) {
                            const blocked = blockedResult.data.some(
                                u => String(u.userId) === String(recipientId)
                            );
                            setIsUserBlocked(blocked);
                        }
                    } catch (e) {
                        console.warn('[ChatInfo] Failed to check block status:', e.message);
                    }
                }

                // Load chat messages to extract media
                if (chatId) {
                    const result = await chatService.getChatMessages(chatId, { limit: 100 });
                    if (result.success && result.data?.results) {
                        setMessages(result.data.results);
                    }
                }
            } catch (error) {
                console.error('Error loading chat info:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [chatId]);

    // Extract media items from messages
    const mediaItems = useMemo(() => {
        const mediaList = [];

        messages.forEach((msg) => {
            if (!msg.attachments || msg.attachments.length === 0) return;

            msg.attachments.forEach((attachment, index) => {
                const url = attachment.url || attachment.uri;
                if (!url) return;

                const ext = url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/)?.[1]?.toLowerCase() || '';
                const isImage = IMAGE_EXTENSIONS.includes(ext);
                const isVideo = VIDEO_EXTENSIONS.includes(ext);

                if (isImage || isVideo) {
                    mediaList.push({
                        id: `${msg.message_id}-${index}`,
                        url,
                        type: isImage ? 'image' : 'video',
                        timestamp: msg.created_at,
                    });
                }
            });
        });

        return mediaList.slice(0, 4); // Only first 4 for preview
    }, [messages]);

    // Count total media, links, and docs
    const mediaCounts = useMemo(() => {
        let media = 0, links = 0, docs = 0;
        const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
        const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];

        messages.forEach((msg) => {
            // Count media from attachments
            if (msg.attachments) {
                msg.attachments.forEach((att) => {
                    const url = att.url || att.uri || '';
                    const ext = url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/)?.[1]?.toLowerCase() || '';

                    if (IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext)) {
                        media++;
                    } else if (docExtensions.includes(ext)) {
                        docs++;
                    }
                });
            }

            // Count links in message content
            if (msg.content) {
                const matches = msg.content.match(urlRegex);
                if (matches) {
                    links += matches.length;
                }
            }
        });

        return { media, links, docs };
    }, [messages]);

    // Handle navigation to Media & Links screen
    const handleViewMedia = useCallback(() => {
        navigation.navigate('MediaLinksScreen', {
            chatId,
            chatName,
            messages,
        });
    }, [navigation, chatId, chatName, messages]);

    // Render avatar
    const renderAvatar = () => {
        if (avatar) {
            return (
                <Image
                    source={{ uri: avatar }}
                    style={styles.largeAvatar}
                    resizeMode="cover"
                />
            );
        }

        return (
            <View style={[styles.largeAvatarFallback, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.largeAvatarText}>{getInitials(chatName)}</Text>
            </View>
        );
    };

    // Render media preview item
    const renderMediaPreviewItem = (item, index) => {
        const isVideo = item.type === 'video';

        return (
            <TouchableOpacity
                key={item.id || `media-${index}`}
                style={styles.mediaPreviewItem}
                onPress={handleViewMedia}
                activeOpacity={0.8}
            >
                <Image
                    source={{ uri: item.url }}
                    style={styles.mediaPreviewImage}
                    resizeMode="cover"
                />
                {isVideo && (
                    <View style={styles.videoOverlay}>
                        <Icon name="play" size={16} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat Info</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section */}
                <View style={[styles.profileSection, { backgroundColor: theme.colors.white }]}>
                    {renderAvatar()}
                    <Text style={[styles.chatName, { color: theme.colors.text }]}>{chatName}</Text>
                    <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                        {isOnline ? 'Online' : 'Last seen recently'}
                    </Text>
                </View>

                {/* Media, Links, Docs Section */}
                <View style={[styles.section, { backgroundColor: theme.colors.white }]}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={handleViewMedia}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Media, Links, and Docs
                        </Text>
                        <View style={styles.sectionHeaderRight}>
                            <Text style={[styles.sectionCount, { color: theme.colors.textSecondary }]}>
                                {mediaCounts.media + mediaCounts.links + mediaCounts.docs}
                            </Text>
                            <Icon name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    {mediaItems.length > 0 && (
                        <View style={styles.mediaPreviewContainer}>
                            {mediaItems.map((item, index) => renderMediaPreviewItem(item, index))}
                        </View>
                    )}

                    {mediaItems.length === 0 && (
                        <View style={styles.emptyMediaContainer}>
                            <Icon name="images-outline" size={32} color={theme.colors.textSecondary} />
                            <Text style={[styles.emptyMediaText, { color: theme.colors.textSecondary }]}>
                                No media shared yet
                            </Text>
                        </View>
                    )}
                </View>

                {/* Actions Section */}
                <View style={[styles.section, { backgroundColor: theme.colors.white }]}>
                    <TouchableOpacity style={styles.actionItem} onPress={handleViewMedia}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E8F4FD' }]}>
                            <Icon name="images-outline" size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.actionText, { color: theme.colors.text }]}>
                            Media ({mediaCounts.media})
                        </Text>
                        <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleViewMedia}>
                        <View style={[styles.actionIcon, { backgroundColor: '#E8F9F0' }]}>
                            <Icon name="link-outline" size={20} color="#22C55E" />
                        </View>
                        <Text style={[styles.actionText, { color: theme.colors.text }]}>
                            Links ({mediaCounts.links})
                        </Text>
                        <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionItem, styles.lastActionItem]} onPress={handleViewMedia}>
                        <View style={[styles.actionIcon, { backgroundColor: '#FEF3E8' }]}>
                            <Icon name="document-outline" size={20} color="#F97316" />
                        </View>
                        <Text style={[styles.actionText, { color: theme.colors.text }]}>
                            Documents ({mediaCounts.docs})
                        </Text>
                        <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Safety Actions Section - Required by Apple for UGC */}
                <View style={[styles.section, { backgroundColor: theme.colors.white }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Safety & Privacy
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.actionItem, !recipientId && { opacity: 0.4 }]}
                        onPress={() => recipientId ? setShowBlockModal(true) : null}
                        disabled={!recipientId}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: isUserBlocked ? '#E8F5E9' : '#FFEBEE' }]}>
                            <Icon
                                name={isUserBlocked ? 'person-add-outline' : 'ban-outline'}
                                size={20}
                                color={isUserBlocked ? '#4CAF50' : '#F44336'}
                            />
                        </View>
                        <Text style={[styles.actionText, { color: isUserBlocked ? '#4CAF50' : '#F44336' }]}>
                            {isUserBlocked ? 'Unblock User' : 'Block User'}
                        </Text>
                        <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionItem, styles.lastActionItem]}
                        onPress={() => setShowReportModal(true)}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Icon name="flag-outline" size={20} color="#FF9800" />
                        </View>
                        <Text style={[styles.actionText, { color: '#FF9800' }]}>
                            Report User
                        </Text>
                        <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Safety Notice */}
                <View style={styles.safetyNotice}>
                    <Icon name="shield-checkmark-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.safetyNoticeText, { color: theme.colors.textSecondary }]}>
                        We have zero tolerance for objectionable content or abusive users. Reports are reviewed within 24 hours.
                    </Text>
                </View>
            </ScrollView>

            {/* Report User Modal */}
            <ReportUserModal
                visible={showReportModal}
                onClose={() => setShowReportModal(false)}
                reportedUserId={recipientId}
                reportedUserName={chatName}
                chatId={chatId}
                reportType="user"
                onReportSubmitted={() => {
                    // Optionally show a confirmation or update UI
                }}
            />

            {/* Block User Modal */}
            <BlockUserModal
                visible={showBlockModal}
                onClose={() => setShowBlockModal(false)}
                userId={recipientId}
                userName={chatName}
                isBlocked={isUserBlocked}
                onBlockComplete={(result) => {
                    setIsUserBlocked(result.blocked);
                    if (result.blocked) {
                        // Optionally navigate back or update chat list
                        navigation.goBack();
                    }
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
        paddingBottom: 14,
    },
    backButton: {
        padding: 4,
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
    },
    headerSpacer: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 12,
        paddingBottom: 32,
    },
    // Profile Section
    profileSection: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
        marginHorizontal: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    largeAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        marginBottom: 16,
    },
    largeAvatarFallback: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    largeAvatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '700',
    },
    chatName: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    statusText: {
        fontSize: 14,
    },
    // Section
    section: {
        marginHorizontal: 12,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    sectionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sectionCount: {
        fontSize: 14,
    },
    // Media Preview
    mediaPreviewContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 4,
    },
    mediaPreviewItem: {
        width: MEDIA_PREVIEW_SIZE,
        height: MEDIA_PREVIEW_SIZE,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
    },
    mediaPreviewImage: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyMediaContainer: {
        alignItems: 'center',
        padding: 24,
    },
    emptyMediaText: {
        fontSize: 14,
        marginTop: 8,
    },
    // Action Items
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
    },
    lastActionItem: {
        borderBottomWidth: 0,
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    // Safety Notice
    safetyNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 10,
    },
    safetyNoticeText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
    },
});

export default ChatInfoScreen;
