import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Linking,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { useTheme } from '../../ThemeContext';
import ImagePreview from '../../components/ImagePreview';
import { fixLocalUrl } from '../../services/api';
import chatService from '../../services/chatService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_SPACING = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

// File type constants
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
const DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'];

// URL regex for extracting links from messages
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

const MediaLinksScreen = ({ route, navigation }) => {
    const theme = useTheme();
    const { chatId, chatName, messages = [] } = route.params || {};

    // Tab state
    const [activeTab, setActiveTab] = useState('media');

    // Image preview state
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [previewImageName, setPreviewImageName] = useState('');

    // Download state
    const [downloadingItems, setDownloadingItems] = useState({});

    // Get file extension from URL
    const getFileExtension = useCallback((urlOrName) => {
        if (!urlOrName || typeof urlOrName !== 'string') return '';
        const match = urlOrName.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
        return match ? match[1].toLowerCase() : '';
    }, []);

    // Get all attachment URLs from a message
    const getAllAttachmentUrls = useCallback((attachments) => {
        if (!attachments || !Array.isArray(attachments)) return [];
        return attachments
            .map(att => att.url || att.uri)
            .filter(url => url && typeof url === 'string');
    }, []);

    // Format timestamp
    const formatTime = useCallback((timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    }, []);

    // Get filename from URL
    const getFileName = useCallback((url) => {
        if (!url || typeof url !== 'string') return 'Unknown file';
        const fileName = url.includes('/') ? url.split('/').pop().split('?')[0] : url;
        return decodeURIComponent(fileName) || 'Unknown file';
    }, []);

    // Get sender name
    const getSenderName = useCallback((sender) => {
        if (!sender) return 'Unknown';
        const firstName = sender.first_name?.trim() || '';
        const lastName = sender.last_name?.trim() || '';
        return `${firstName} ${lastName}`.trim() || sender.name || 'Unknown';
    }, []);

    // Filter media (images and videos)
    const mediaItems = useMemo(() => {
        const mediaList = [];

        messages.forEach((msg) => {
            if (!msg.attachments || msg.attachments.length === 0) return;

            const urls = getAllAttachmentUrls(msg.attachments);
            urls.forEach((url, index) => {
                const ext = getFileExtension(url);
                const isImage = IMAGE_EXTENSIONS.includes(ext);
                const isVideo = VIDEO_EXTENSIONS.includes(ext);

                if (isImage || isVideo) {
                    mediaList.push({
                        id: `${msg.message_id || 'unknown'}-${index}`,
                        url: fixLocalUrl(url),
                        type: isImage ? 'image' : 'video',
                        sender: msg.sender,
                        timestamp: msg.created_at,
                    });
                }
            });
        });

        // Sort by timestamp (newest first)
        return mediaList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [messages, getAllAttachmentUrls, getFileExtension]);

    // Extract links from messages
    const linkItems = useMemo(() => {
        const links = [];

        messages.forEach((msg) => {
            if (!msg.content || typeof msg.content !== 'string') return;

            const matches = msg.content.match(URL_REGEX);
            if (matches) {
                const attachmentUrls = getAllAttachmentUrls(msg.attachments);

                matches.forEach((url, index) => {
                    const trimmedUrl = url.trim();
                    // Skip if URL is already an attachment
                    if (attachmentUrls.includes(trimmedUrl)) return;

                    links.push({
                        id: `${msg.message_id || 'unknown'}-link-${index}`,
                        url: trimmedUrl,
                        sender: msg.sender,
                        timestamp: msg.created_at,
                        messagePreview: msg.content.substring(0, 100),
                    });
                });
            }
        });

        return links.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [messages, getAllAttachmentUrls]);

    // Filter documents
    const docItems = useMemo(() => {
        const docList = [];

        messages.forEach((msg) => {
            if (!msg.attachments || msg.attachments.length === 0) return;

            const urls = getAllAttachmentUrls(msg.attachments);
            urls.forEach((url, index) => {
                const ext = getFileExtension(url);
                if (DOC_EXTENSIONS.includes(ext)) {
                    docList.push({
                        id: `${msg.message_id || 'unknown'}-doc-${index}`,
                        url: fixLocalUrl(url),
                        name: getFileName(url),
                        extension: ext.toUpperCase(),
                        sender: msg.sender,
                        timestamp: msg.created_at,
                    });
                }
            });
        });

        return docList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [messages, getAllAttachmentUrls, getFileExtension, getFileName]);

    // Get domain from URL
    const getDomain = useCallback((url) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url.substring(0, 30);
        }
    }, []);

    // Get file type color
    const getFileTypeColor = useCallback((ext) => {
        const extension = ext?.toLowerCase() || '';
        if (extension === 'pdf') return { bg: '#FEE2E2', icon: '#DC2626', text: '#DC2626' };
        if (['doc', 'docx'].includes(extension)) return { bg: '#DBEAFE', icon: '#2563EB', text: '#2563EB' };
        if (['xls', 'xlsx', 'csv'].includes(extension)) return { bg: '#D1FAE5', icon: '#059669', text: '#059669' };
        if (['ppt', 'pptx'].includes(extension)) return { bg: '#FFEDD5', icon: '#EA580C', text: '#EA580C' };
        if (['txt', 'rtf'].includes(extension)) return { bg: '#F3F4F6', icon: '#4B5563', text: '#4B5563' };
        return { bg: '#E5E7EB', icon: '#6B7280', text: '#6B7280' };
    }, []);

    // Handle media item press
    const handleMediaPress = useCallback((item) => {
        if (item.type === 'video') {
            // Open video in external player
            Linking.openURL(item.url).catch(() => {
                alert('Failed to open video');
            });
        } else {
            // Show image preview
            setPreviewImage(item.url);
            setPreviewImageName('Image');
            setPreviewVisible(true);
        }
    }, []);

    // Handle link press
    const handleLinkPress = useCallback((url) => {
        Linking.openURL(url).catch(() => {
            alert('Failed to open link');
        });
    }, []);

    // Handle document download and open
    const handleDocPress = useCallback(async (item) => {
        if (downloadingItems[item.id]) return;

        try {
            setDownloadingItems(prev => ({ ...prev, [item.id]: true }));

            // Download the file
            const localPath = `${RNFS.DocumentDirectoryPath}/${item.name}`;
            const downloadResult = await RNFS.downloadFile({
                fromUrl: item.url,
                toFile: localPath,
            }).promise;

            if (downloadResult.statusCode === 200) {
                // Open the file
                await FileViewer.open(localPath, { showOpenWithDialog: true });
            } else {
                alert('Failed to download document');
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Failed to open document');
        } finally {
            setDownloadingItems(prev => ({ ...prev, [item.id]: false }));
        }
    }, [downloadingItems]);

    // Render media item
    const renderMediaItem = useCallback(({ item }) => {
        const isVideo = item.type === 'video';

        return (
            <TouchableOpacity
                style={styles.mediaItem}
                onPress={() => handleMediaPress(item)}
                activeOpacity={0.8}
            >
                <Image
                    source={{ uri: item.url }}
                    style={styles.mediaThumbnail}
                    resizeMode="cover"
                />
                {isVideo && (
                    <View style={styles.videoOverlay}>
                        <View style={styles.videoPlayButton}>
                            <Icon name="play" size={20} color="#fff" />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    }, [handleMediaPress]);

    // Render link item
    const renderLinkItem = useCallback(({ item }) => {
        const domain = getDomain(item.url);

        return (
            <TouchableOpacity
                style={[styles.linkItem, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}
                onPress={() => handleLinkPress(item.url)}
                activeOpacity={0.7}
            >
                <View style={[styles.linkIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="link" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.linkContent}>
                    <Text style={[styles.linkDomain, { color: theme.colors.primary }]} numberOfLines={1}>
                        {domain}
                    </Text>
                    <Text style={[styles.linkUrl, { color: theme.colors.text }]} numberOfLines={2}>
                        {item.url}
                    </Text>
                    <View style={styles.linkMeta}>
                        <Text style={[styles.linkSender, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {getSenderName(item.sender)}
                        </Text>
                        <Text style={[styles.linkTime, { color: theme.colors.textSecondary }]}>
                            {formatTime(item.timestamp)}
                        </Text>
                    </View>
                </View>
                <Icon name="open-outline" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        );
    }, [theme, getDomain, handleLinkPress, getSenderName, formatTime]);

    // Render document item
    const renderDocItem = useCallback(({ item }) => {
        const colors = getFileTypeColor(item.extension);
        const isDownloading = downloadingItems[item.id];

        return (
            <TouchableOpacity
                style={[styles.docItem, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}
                onPress={() => handleDocPress(item)}
                activeOpacity={0.7}
                disabled={isDownloading}
            >
                <View style={[styles.docIconContainer, { backgroundColor: colors.bg }]}>
                    {isDownloading ? (
                        <ActivityIndicator size="small" color={colors.icon} />
                    ) : (
                        <Text style={[styles.docExtension, { color: colors.text }]}>{item.extension}</Text>
                    )}
                </View>
                <View style={styles.docContent}>
                    <Text style={[styles.docName, { color: theme.colors.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.docMeta}>
                        <Text style={[styles.docSender, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {getSenderName(item.sender)}
                        </Text>
                        <Text style={[styles.docTime, { color: theme.colors.textSecondary }]}>
                            {formatTime(item.timestamp)}
                        </Text>
                    </View>
                </View>
                <View style={styles.docActionContainer}>
                    {isDownloading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Icon name="download-outline" size={20} color={theme.colors.primary} />
                    )}
                </View>
            </TouchableOpacity>
        );
    }, [theme, getFileTypeColor, handleDocPress, getSenderName, formatTime, downloadingItems]);

    // Render empty state
    const renderEmptyState = useCallback((type) => {
        const configs = {
            media: { icon: 'images-outline', title: 'No Media', subtitle: 'Photos and videos shared in this chat will appear here' },
            links: { icon: 'link-outline', title: 'No Links', subtitle: 'Links shared in this chat will appear here' },
            docs: { icon: 'document-outline', title: 'No Documents', subtitle: 'Documents shared in this chat will appear here' },
        };
        const config = configs[type] || configs.media;

        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.background }]}>
                    <Icon name={config.icon} size={48} color={theme.colors.textSecondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{config.title}</Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{config.subtitle}</Text>
            </View>
        );
    }, [theme]);

    // Get current data based on active tab
    const getCurrentData = useCallback(() => {
        switch (activeTab) {
            case 'media': return mediaItems;
            case 'links': return linkItems;
            case 'docs': return docItems;
            default: return [];
        }
    }, [activeTab, mediaItems, linkItems, docItems]);

    // Render content based on active tab
    const renderContent = useCallback(() => {
        const data = getCurrentData();

        if (!data || data.length === 0) {
            return renderEmptyState(activeTab);
        }

        if (activeTab === 'media') {
            return (
                <FlatList
                    key="media-grid"
                    data={data}
                    renderItem={renderMediaItem}
                    keyExtractor={(item) => item.id}
                    numColumns={GRID_COLUMNS}
                    contentContainerStyle={styles.mediaGrid}
                    showsVerticalScrollIndicator={false}
                />
            );
        }

        if (activeTab === 'links') {
            return (
                <FlatList
                    key="links-list"
                    data={data}
                    renderItem={renderLinkItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            );
        }

        if (activeTab === 'docs') {
            return (
                <FlatList
                    key="docs-list"
                    data={data}
                    renderItem={renderDocItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            );
        }

        return null;
    }, [activeTab, getCurrentData, renderEmptyState, renderMediaItem, renderLinkItem, renderDocItem]);

    // Tab configuration
    const tabs = useMemo(() => [
        { key: 'media', label: 'Media', count: mediaItems.length },
        { key: 'links', label: 'Links', count: linkItems.length },
        { key: 'docs', label: 'Docs', count: docItems.length },
    ], [mediaItems.length, linkItems.length, docItems.length]);

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
                <Text style={styles.headerTitle}>Media & Links</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Tab Bar */}
            <View style={[styles.tabContainer, { backgroundColor: theme.colors.white, borderBottomColor: theme.colors.border }]}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                { color: activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary },
                            ]}
                        >
                            {tab.label}
                        </Text>
                        {tab.count > 0 && (
                            <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.key ? theme.colors.primary : '#E5E7EB' }]}>
                                <Text style={[styles.tabBadgeText, { color: activeTab === tab.key ? '#fff' : '#6B7280' }]}>
                                    {tab.count > 99 ? '99+' : tab.count}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                {renderContent()}
            </View>

            {/* Image Preview Modal */}
            <ImagePreview
                visible={previewVisible}
                imageUrl={previewImage}
                imageName={previewImageName}
                onClose={() => setPreviewVisible(false)}
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
    // Tab Bar
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tabBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
    },
    // Media Grid
    mediaGrid: {
        padding: GRID_SPACING,
    },
    mediaItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        margin: GRID_SPACING / 2,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
    },
    mediaThumbnail: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPlayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 3,
    },
    // List Container
    listContainer: {
        padding: 16,
    },
    separator: {
        height: 12,
    },
    // Link Item
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    linkIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkContent: {
        flex: 1,
    },
    linkDomain: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    linkUrl: {
        fontSize: 14,
        lineHeight: 18,
        marginBottom: 4,
    },
    linkMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    linkSender: {
        fontSize: 12,
        flex: 1,
    },
    linkTime: {
        fontSize: 11,
    },
    // Document Item
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    docIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docExtension: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    docContent: {
        flex: 1,
    },
    docName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    docMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    docSender: {
        fontSize: 12,
        flex: 1,
    },
    docTime: {
        fontSize: 11,
    },
    docActionContainer: {
        width: 32,
        alignItems: 'center',
    },
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default MediaLinksScreen;
