import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HelpSupport() {
    const navigation = useNavigation();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const faqs = [
        {
            question: 'How do I post an event ?',
            answer: 'Go to the Events tab and click "Post Event". Fill in the details about your event including date, location, and requirements.'
        },
        {
            question: 'What happens after I hire a vendor?',
            answer: 'Once you hire a vendor, you\'ll be able to communicate directly with them and track the progress of your event planning.'
        },
        {
            question: 'How do I report a vendor ?',
            answer: 'Go to the vendor\'s profile and click on "Report" button. Fill out the form with details about the issue.'
        }
    ];

    const handleSendMessage = () => {
        if (!subject.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in both subject and message fields.');
            return;
        }
        Alert.alert('Message Sent', 'Your support request has been submitted. We\'ll get back to you soon!');
        setSubject('');
        setMessage('');
    };

    const handleCall = () => {
        Linking.openURL('tel:+1234567890');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@evanzo.com');
    };

    const renderFAQ = (faq, index) => (
        <TouchableOpacity key={index} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.androidPad} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>{'\u2190'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
            </View>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    {faqs.map(renderFAQ)}
                </View>

                {/* Need More Help Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Need more help?</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Subject"
                        placeholderTextColor="#B0B8C1"
                        value={subject}
                        onChangeText={setSubject}
                    />

                    <TextInput
                        style={[styles.input, styles.messageInput]}
                        placeholder="Message"
                        placeholderTextColor="#B0B8C1"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity style={styles.attachBtn}>
                        <Text style={styles.attachText}>📎 Attach Screenshot</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                        <Text style={styles.sendText}>Send Message</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Contact Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Contact</Text>
                    <View style={styles.contactRow}>
                        <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
                            <Text style={styles.contactIcon}>📞</Text>
                            <Text style={styles.contactText}>Call Support</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactBtn} onPress={handleEmail}>
                            <Text style={styles.contactIcon}>📧</Text>
                            <Text style={styles.contactText}>Email Me</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    faqItem: {
        backgroundColor: '#41547A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    faqQuestion: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 6,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#B0B8C1',
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#41547A',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#fff',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#41547A',
    },
    messageInput: {
        height: 100,
        paddingTop: 12,
    },
    attachBtn: {
        backgroundColor: 'rgba(65,84,122,0.7)',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#6B7A99',
        borderStyle: 'dashed',
    },
    attachText: {
        color: '#B0B8C1',
        fontSize: 14,
        fontWeight: '500',
    },
    sendBtn: {
        backgroundColor: '#1E2B4F',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    sendText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    contactRow: {
        flexDirection: 'row',
        gap: 12,
    },
    contactBtn: {
        flex: 1,
        backgroundColor: '#41547A',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    contactIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    contactText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
