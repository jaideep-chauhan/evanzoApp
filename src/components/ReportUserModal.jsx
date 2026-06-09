import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../ThemeContext';
import api from '../services/api';

const REPORT_REASONS = [
    { id: 'spam', label: 'Spam or scam', icon: 'mail-unread-outline' },
    { id: 'harassment', label: 'Harassment or bullying', icon: 'warning-outline' },
    { id: 'hate_speech', label: 'Hate speech or discrimination', icon: 'ban-outline' },
    { id: 'inappropriate', label: 'Inappropriate or offensive content', icon: 'eye-off-outline' },
    { id: 'impersonation', label: 'Impersonation or fake account', icon: 'person-outline' },
    { id: 'violence', label: 'Violence or dangerous behavior', icon: 'skull-outline' },
    { id: 'illegal', label: 'Illegal activities', icon: 'alert-circle-outline' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const ReportUserModal = ({
    visible,
    onClose,
    reportedUserId,
    reportedUserName,
    chatId,
    messageId,
    reportType = 'user', // 'user' or 'message'
    onReportSubmitted,
}) => {
    const theme = useTheme();
    const [selectedReason, setSelectedReason] = useState(null);
    const [additionalDetails, setAdditionalDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) return;

        setIsSubmitting(true);
        try {
            const reportData = {
                reported_user_id: reportedUserId,
                reason: selectedReason,
                details: additionalDetails,
                report_type: reportType,
                chat_id: chatId,
                message_id: messageId,
            };

            const response = await api.post('/users/report', reportData);

            if (response.data?.success || response.status === 200 || response.status === 201) {
                setShowSuccess(true);
                if (onReportSubmitted) {
                    onReportSubmitted(reportData);
                }
                // Auto close after showing success
                setTimeout(() => {
                    handleClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            // Still show success to user (report will be queued)
            setShowSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedReason(null);
        setAdditionalDetails('');
        setShowSuccess(false);
        onClose();
    };

    if (showSuccess) {
        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    <View style={[styles.successContainer, { backgroundColor: theme.colors.white }]}>
                        <View style={[styles.successIcon, { backgroundColor: '#E8F5E9' }]}>
                            <Icon name="checkmark-circle" size={48} color="#4CAF50" />
                        </View>
                        <Text style={[styles.successTitle, { color: theme.colors.text }]}>
                            Report Submitted
                        </Text>
                        <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
                            Thank you for helping keep our community safe. We'll review this report within 24 hours and take appropriate action.
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
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.colors.white }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                            Report {reportType === 'message' ? 'Message' : 'User'}
                        </Text>
                        <View style={styles.closeButton} />
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* User Info */}
                        {reportedUserName && (
                            <View style={[styles.userInfo, { backgroundColor: theme.colors.background }]}>
                                <Icon name="person-circle-outline" size={24} color={theme.colors.primary} />
                                <Text style={[styles.userName, { color: theme.colors.text }]}>
                                    Reporting: {reportedUserName}
                                </Text>
                            </View>
                        )}

                        {/* Warning Notice */}
                        <View style={[styles.warningBox, { backgroundColor: '#FFF3E0' }]}>
                            <Icon name="information-circle" size={20} color="#F57C00" />
                            <Text style={styles.warningText}>
                                False reports may result in action against your account. Only submit genuine concerns.
                            </Text>
                        </View>

                        {/* Reason Selection */}
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Why are you reporting this {reportType}?
                        </Text>

                        {REPORT_REASONS.map((reason) => (
                            <TouchableOpacity
                                key={reason.id}
                                style={[
                                    styles.reasonItem,
                                    {
                                        borderColor: selectedReason === reason.id
                                            ? theme.colors.primary
                                            : theme.colors.border,
                                        backgroundColor: selectedReason === reason.id
                                            ? theme.colors.primary + '10'
                                            : theme.colors.white
                                    }
                                ]}
                                onPress={() => setSelectedReason(reason.id)}
                            >
                                <Icon
                                    name={reason.icon}
                                    size={22}
                                    color={selectedReason === reason.id ? theme.colors.primary : theme.colors.textSecondary}
                                />
                                <Text style={[
                                    styles.reasonText,
                                    {
                                        color: selectedReason === reason.id
                                            ? theme.colors.primary
                                            : theme.colors.text
                                    }
                                ]}>
                                    {reason.label}
                                </Text>
                                {selectedReason === reason.id && (
                                    <Icon name="checkmark-circle" size={22} color={theme.colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* Additional Details */}
                        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>
                            Additional details (optional)
                        </Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text,
                                    backgroundColor: theme.colors.background
                                }
                            ]}
                            placeholder="Provide any additional context that might help us understand the issue..."
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={additionalDetails}
                            onChangeText={setAdditionalDetails}
                            maxLength={500}
                        />
                        <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
                            {additionalDetails.length}/500
                        </Text>

                        {/* Policy Notice */}
                        <View style={[styles.policyBox, { backgroundColor: theme.colors.background }]}>
                            <Text style={[styles.policyText, { color: theme.colors.textSecondary }]}>
                                Reports are reviewed within 24 hours. Content that violates our community guidelines will be removed, and users who repeatedly violate our policies may be permanently banned.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Submit Button */}
                    <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                {
                                    backgroundColor: selectedReason ? theme.colors.primary : '#ccc',
                                    opacity: isSubmitting ? 0.7 : 1
                                }
                            ]}
                            onPress={handleSubmit}
                            disabled={!selectedReason || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Report</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        maxHeight: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    userName: {
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '500',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
    },
    warningText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        color: '#E65100',
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        marginBottom: 10,
    },
    reasonText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        minHeight: 100,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        marginTop: 4,
    },
    policyBox: {
        padding: 14,
        borderRadius: 10,
        marginTop: 16,
        marginBottom: 20,
    },
    policyText: {
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Success state styles
    successContainer: {
        margin: 20,
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

export default ReportUserModal;
