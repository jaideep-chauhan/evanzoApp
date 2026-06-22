import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyPolicy() {
    const navigation = useNavigation();

    const privacyContent = `At Evanzo, we are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our event planning platform.

INFORMATION WE COLLECT

Personal Information:
• Name, email address, phone number
• Profile information and preferences
• Event details and vendor interactions
• Payment information (processed securely)

Usage Information:
• App usage patterns and preferences
• Device information and identifiers
• Location data (with your permission)
• Communication records with vendors

HOW WE USE YOUR INFORMATION

We use your information to:
• Provide and improve our services
• Connect you with relevant vendors
• Process payments and transactions
• Send important updates and notifications
• Provide customer support
• Enhance user experience

INFORMATION SHARING

We do not sell your personal information. We may share data:
• With vendors you choose to contact
• With service providers who assist us
• When required by law
• With your explicit consent

DATA SECURITY

We implement industry-standard security measures:
• Encryption of sensitive data
• Secure payment processing
• Regular security audits
• Access controls and monitoring

YOUR RIGHTS

You have the right to:
• Access your personal data
• Correct inaccurate information
• Delete your account and data
• Opt-out of marketing communications
• Request data portability

COOKIES AND TRACKING

We use cookies and similar technologies to:
• Remember your preferences
• Analyze app usage
• Provide personalized content
• Improve our services

CHILDREN'S PRIVACY

Our services are not intended for children under 13. We do not knowingly collect personal information from children.

UPDATES TO THIS POLICY

We may update this Privacy Policy periodically. We will notify you of significant changes through the app or via email.

CONTACT US

If you have questions about this Privacy Policy, please contact us at:
Email: privacy@evanzo.com
Phone: 1-800-EVANZO

Last updated: January 2025`;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>{'\u2190'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <Text style={styles.content}>{privacyContent}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#2C3D5B',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#41547A',
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
    content: {
        fontSize: 15,
        color: '#B0B8C1',
        lineHeight: 24,
        paddingBottom: 20,
    },
});
