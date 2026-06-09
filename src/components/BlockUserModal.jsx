import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../ThemeContext';
import api from '../services/api';

const BlockUserModal = ({
    visible,
    onClose,
    userId,
    userName,
    onBlockComplete,
    isBlocked = false,
}) => {
    const theme = useTheme();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [actionType, setActionType] = useState(null); // 'block' or 'unblock'

    const handleBlock = async () => {
        if (!userId) {
            console.error('[BlockUserModal] Cannot block: userId is undefined');
            handleClose();
            return;
        }
        setIsSubmitting(true);
        setActionType('block');
        try {
            const response = await api.post(`/settings/block/${userId}`);

            if (response.data?.success || response.status === 200 || response.status === 201) {
                setShowSuccess(true);
                if (onBlockComplete) {
                    onBlockComplete({ blocked: true, userId });
                }
                setTimeout(() => {
                    handleClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Error blocking user:', error.response?.data || error.message);
            handleClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnblock = async () => {
        if (!userId) {
            console.error('[BlockUserModal] Cannot unblock: userId is undefined');
            handleClose();
            return;
        }
        setIsSubmitting(true);
        setActionType('unblock');
        try {
            const response = await api.delete(`/settings/block/${userId}`);

            if (response.data?.success || response.status === 200 || response.status === 201) {
                setShowSuccess(true);
                if (onBlockComplete) {
                    onBlockComplete({ blocked: false, userId });
                }
                setTimeout(() => {
                    handleClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Error unblocking user:', error.response?.data || error.message);
            handleClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setShowSuccess(false);
        setActionType(null);
        onClose();
    };

    if (showSuccess) {
        const isBlockAction = actionType === 'block';
        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    <View style={[styles.successContainer, { backgroundColor: theme.colors.white }]}>
                        <View style={[styles.successIcon, { backgroundColor: isBlockAction ? '#FFEBEE' : '#E8F5E9' }]}>
                            <Icon
                                name={isBlockAction ? 'ban' : 'checkmark-circle'}
                                size={48}
                                color={isBlockAction ? '#F44336' : '#4CAF50'}
                            />
                        </View>
                        <Text style={[styles.successTitle, { color: theme.colors.text }]}>
                            {isBlockAction ? 'User Blocked' : 'User Unblocked'}
                        </Text>
                        <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
                            {isBlockAction
                                ? `${userName || 'This user'} has been blocked. They won't be able to contact you or see your content.`
                                : `${userName || 'This user'} has been unblocked. They can now contact you again.`
                            }
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.colors.white }]}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: isBlocked ? '#E8F5E9' : '#FFEBEE' }]}>
                        <Icon
                            name={isBlocked ? 'person-add' : 'ban'}
                            size={40}
                            color={isBlocked ? '#4CAF50' : '#F44336'}
                        />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {isBlocked ? 'Unblock User?' : 'Block User?'}
                    </Text>

                    {/* User Name */}
                    {userName && (
                        <Text style={[styles.userName, { color: theme.colors.primary }]}>
                            {userName}
                        </Text>
                    )}

                    {/* Description */}
                    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                        {isBlocked
                            ? 'This user will be able to send you messages and see your content again.'
                            : 'Blocked users cannot:\n• Send you messages\n• See your profile\n• Find you in search\n\nYou can unblock them at any time from settings.'
                        }
                    </Text>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                            onPress={handleClose}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                {
                                    backgroundColor: isBlocked ? '#4CAF50' : '#F44336',
                                    opacity: isSubmitting ? 0.7 : 1
                                }
                            ]}
                            onPress={isBlocked ? handleUnblock : handleBlock}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.actionButtonText}>
                                    {isBlocked ? 'Unblock' : 'Block'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Report Link */}
                    {!isBlocked && (
                        <Text style={[styles.reportHint, { color: theme.colors.textSecondary }]}>
                            You can also report this user if they violated our community guidelines.
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    reportHint: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
    },
    // Success state
    successContainer: {
        width: '100%',
        maxWidth: 340,
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    successText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default BlockUserModal;
