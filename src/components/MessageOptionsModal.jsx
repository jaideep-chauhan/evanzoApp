import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/Ionicons';

const MessageOptionsModal = ({
    visible,
    onClose,
    message,
    currentUserId,
    onDelete,
    onReact,
    onCopy,
}) => {
    const isMyMessage = message?.senderId === currentUserId || message?.isMe;

    // Check if message can be deleted for everyone (within 48 hours)
    const canDeleteForEveryone = () => {
        if (!isMyMessage) return false;
        if (!message?.createdAt) return false;

        const messageAge = Date.now() - new Date(message.createdAt).getTime();
        const maxAge = 48 * 60 * 60 * 1000; // 48 hours
        return messageAge < maxAge;
    };

    const handleCopy = () => {
        if (message?.text) {
            Clipboard.setString(message.text);
            Alert.alert('Copied', 'Message copied to clipboard');
            onClose();
        }
    };

    const handleDeleteForMe = () => {
        Alert.alert(
            'Delete Message',
            'Delete this message for you only?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        onDelete(message.id, false);
                        onClose();
                    },
                },
            ]
        );
    };

    const handleDeleteForEveryone = () => {
        Alert.alert(
            'Delete for Everyone',
            'This message will be deleted for all chat participants.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete for Everyone',
                    style: 'destructive',
                    onPress: () => {
                        onDelete(message.id, true);
                        onClose();
                    },
                },
            ]
        );
    };

    const handleReact = () => {
        console.log('👍 MessageOptionsModal - React button pressed');
        console.log('👍 MessageOptionsModal - Calling onReact handler');
        onReact();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Message Options</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Options */}
                    <View style={styles.options}>
                        {/* React */}
                        <TouchableOpacity
                            style={styles.option}
                            onPress={handleReact}
                            activeOpacity={0.7}
                        >
                            <View style={styles.optionIcon}>
                                <Icon name="happy-outline" size={24} color="#4CAF50" />
                            </View>
                            <Text style={styles.optionText}>React</Text>
                        </TouchableOpacity>

                        {/* Copy (only for text messages) */}
                        {message?.messageType === 'text' && (
                            <TouchableOpacity
                                style={styles.option}
                                onPress={handleCopy}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionIcon}>
                                    <Icon name="copy-outline" size={24} color="#2196F3" />
                                </View>
                                <Text style={styles.optionText}>Copy</Text>
                            </TouchableOpacity>
                        )}

                        {/* Delete for Me */}
                        <TouchableOpacity
                            style={styles.option}
                            onPress={handleDeleteForMe}
                            activeOpacity={0.7}
                        >
                            <View style={styles.optionIcon}>
                                <Icon name="trash-outline" size={24} color="#FF9800" />
                            </View>
                            <Text style={styles.optionText}>Delete for Me</Text>
                        </TouchableOpacity>

                        {/* Delete for Everyone (only if within 48 hours) */}
                        {canDeleteForEveryone() && (
                            <TouchableOpacity
                                style={styles.option}
                                onPress={handleDeleteForEveryone}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionIcon, styles.dangerIcon]}>
                                    <Icon name="trash" size={24} color="#F44336" />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionText, styles.dangerText]}>
                                        Delete for Everyone
                                    </Text>
                                    <Text style={styles.optionSubtext}>
                                        This will delete the message for all participants
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
        maxHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3D5B',
    },
    closeButton: {
        padding: 4,
    },
    options: {
        padding: 10,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginVertical: 4,
        backgroundColor: '#f8f9fa',
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    dangerIcon: {
        backgroundColor: '#FFEBEE',
    },
    optionTextContainer: {
        flex: 1,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2C3D5B',
    },
    dangerText: {
        color: '#F44336',
    },
    optionSubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
});

export default MessageOptionsModal;
