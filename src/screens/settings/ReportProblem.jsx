import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    Image,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import settingsService from '../../services/settingsService';
import { openImagePickerWithCropper } from '../../utils/imageCropperUtils';
import { APP_VERSION } from '../../config/appVersion';

// Backend accepts a fixed enum; map the human-readable options to it.
const TYPE_MAP = {
    'App crashes or freezes': 'crash',
    'Login/Authentication issues': 'bug',
    'Payment problems': 'bug',
    'Vendor issues': 'other',
    'Gig posting problems': 'bug',
    'Chat/messaging issues': 'bug',
    'Other': 'other',
};
const MAX_SCREENSHOTS = 4;

export default function ReportProblem() {
    const navigation = useNavigation();
    const [problemType, setProblemType] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]); // [{ uri, mime, name }]
    const [submitting, setSubmitting] = useState(false);

    const problemTypes = [
        'App crashes or freezes',
        'Login/Authentication issues',
        'Payment problems',
        'Vendor issues',
        'Gig posting problems',
        'Chat/messaging issues',
        'Other'
    ];

    const pickAttachment = async () => {
        if (attachments.length >= MAX_SCREENSHOTS) {
            Alert.alert('Limit reached', `You can attach up to ${MAX_SCREENSHOTS} screenshots.`);
            return;
        }
        try {
            const picked = await openImagePickerWithCropper({
                multiple: true,
                maxFiles: MAX_SCREENSHOTS - attachments.length,
            });
            if (picked && picked.length) {
                setAttachments((prev) =>
                    [...prev, ...picked].slice(0, MAX_SCREENSHOTS),
                );
            }
        } catch (e) {
            Alert.alert('Error', 'Could not open the image picker.');
        }
    };

    const removeAttachment = (index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitReport = async () => {
        if (!problemType || !description.trim()) {
            Alert.alert('Error', 'Please select a problem type and provide a description.');
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            // Upload any screenshots first → URLs the report payload can carry.
            let screenshotUrls = [];
            if (attachments.length > 0) {
                screenshotUrls = await Promise.all(
                    attachments.map((f) => settingsService.uploadReportImage(f)),
                );
            }

            const res = await settingsService.reportProblem({
                type: TYPE_MAP[problemType] || 'other',
                description: description.trim(),
                attachments: screenshotUrls,
                platform: Platform.OS,
                version: APP_VERSION,
            });

            if (res?.success) {
                Alert.alert(
                    'Report Submitted',
                    'Thank you for reporting this issue. Our team will investigate and get back to you soon.',
                );
                setProblemType('');
                setDescription('');
                setAttachments([]);
            } else {
                Alert.alert('Error', res?.message || 'Failed to submit the report. Please try again.');
            }
        } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to submit the report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderProblemType = (type, index) => (
        <TouchableOpacity
            key={index}
            style={[styles.typeItem, problemType === type && styles.selectedType]}
            onPress={() => setProblemType(type)}
        >
            <Text style={[styles.typeText, problemType === type && styles.selectedTypeText]}>{type}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.androidPad} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Problem</Text>
            </View>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                <Text style={styles.sectionTitle}>What type of problem are you experiencing?</Text>
                {problemTypes.map(renderProblemType)}

                <Text style={styles.sectionTitle}>Describe the problem</Text>
                <TextInput
                    style={styles.descriptionInput}
                    placeholder="Please provide details about the problem you're experiencing..."
                    placeholderTextColor="#B0B8C1"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                />

                <TouchableOpacity style={styles.attachBtn} onPress={pickAttachment} disabled={submitting}>
                    <Text style={styles.attachText}>
                        📎 Attach Screenshot (Optional){attachments.length > 0 ? `  •  ${attachments.length}/${MAX_SCREENSHOTS}` : ''}
                    </Text>
                </TouchableOpacity>

                {attachments.length > 0 && (
                    <View style={styles.thumbRow}>
                        {attachments.map((a, i) => (
                            <View key={i} style={styles.thumbWrap}>
                                <Image source={{ uri: a.uri }} style={styles.thumb} />
                                <TouchableOpacity
                                    style={styles.thumbRemove}
                                    onPress={() => removeAttachment(i)}
                                    disabled={submitting}
                                >
                                    <Icon name="close-circle" size={20} color="#FF5A5A" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                    onPress={handleSubmitReport}
                    disabled={submitting}
                >
                    {submitting
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.submitText}>Submit Report</Text>}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#2C3D5B',
    },
    androidPad: {
        height: 18,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#41547A',
        backgroundColor: '#2C3D5B',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'rgba(65,84,122,0.7)',
        marginRight: 12,
    },
    backIcon: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
        marginTop: 8,
    },
    typeItem: {
        backgroundColor: '#41547A',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedType: {
        borderColor: '#1E2B4F',
        backgroundColor: '#1E2B4F',
    },
    typeText: {
        color: '#B0B8C1',
        fontSize: 15,
        fontWeight: '500',
    },
    selectedTypeText: {
        color: '#fff',
        fontWeight: '600',
    },
    descriptionInput: {
        backgroundColor: '#41547A',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#fff',
        marginBottom: 16,
        height: 120,
        borderWidth: 1,
        borderColor: '#41547A',
    },
    attachBtn: {
        backgroundColor: 'rgba(65,84,122,0.7)',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#6B7A99',
        borderStyle: 'dashed',
    },
    attachText: {
        color: '#B0B8C1',
        fontSize: 14,
        fontWeight: '500',
    },
    thumbRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    thumbWrap: {
        width: 72,
        height: 72,
        marginRight: 10,
        marginBottom: 10,
    },
    thumb: {
        width: 72,
        height: 72,
        borderRadius: 8,
        backgroundColor: '#41547A',
    },
    thumbRemove: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#2C3D5B',
        borderRadius: 10,
    },
    submitBtn: {
        backgroundColor: '#1E2B4F',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
