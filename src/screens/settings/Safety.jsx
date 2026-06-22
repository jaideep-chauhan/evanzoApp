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
import Icon from 'react-native-vector-icons/Ionicons';

export default function Safety() {
    const navigation = useNavigation();

    const safetyFeatures = [
        {
            icon: 'flag-outline',
            iconColor: '#FF9800',
            title: 'Report Users',
            description: 'You can report any user who sends inappropriate content, harasses you, or violates our community guidelines. Reports are reviewed within 24 hours.',
            action: 'To report: Open a chat → Tap the info icon (i) → Select "Report User"',
        },
        {
            icon: 'ban-outline',
            iconColor: '#F44336',
            title: 'Block Users',
            description: 'Block users to prevent them from messaging you or viewing your profile. You can unblock them anytime from your Blocked Users list.',
            action: 'To block: Open a chat → Tap the info icon (i) → Select "Block User"',
        },
        {
            icon: 'list-outline',
            iconColor: '#2196F3',
            title: 'Manage Blocked Users',
            description: 'View and manage your list of blocked users. You can unblock users at any time.',
            action: 'Go to: Settings → Blocked Users',
            onPress: () => navigation.navigate('BlockedUsers'),
        },
        {
            icon: 'shield-checkmark-outline',
            iconColor: '#4CAF50',
            title: 'Content Moderation',
            description: 'We actively moderate content to ensure a safe environment. Objectionable content is removed and repeat offenders are permanently banned.',
            action: 'Our team reviews all reports within 24 hours.',
        },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.androidPad} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>{'\u2190'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Safety & Privacy</Text>
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Policy Notice */}
                <View style={styles.policyNotice}>
                    <Icon name="information-circle" size={24} color="#2196F3" />
                    <Text style={styles.policyText}>
                        EVNZO has zero tolerance for objectionable content or abusive users.
                        We are committed to maintaining a safe and respectful community.
                    </Text>
                </View>

                {/* Safety Features */}
                {safetyFeatures.map((feature, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.featureCard}
                        onPress={feature.onPress}
                        disabled={!feature.onPress}
                        activeOpacity={feature.onPress ? 0.7 : 1}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: `${feature.iconColor}20` }]}>
                            <Icon name={feature.icon} size={28} color={feature.iconColor} />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                            <Text style={styles.featureDescription}>{feature.description}</Text>
                            <View style={styles.actionContainer}>
                                <Icon name="arrow-forward-circle-outline" size={16} color="#666" />
                                <Text style={styles.actionText}>{feature.action}</Text>
                            </View>
                        </View>
                        {feature.onPress && (
                            <Icon name="chevron-forward" size={20} color="#B0B8C1" />
                        )}
                    </TouchableOpacity>
                ))}

                {/* Quick Actions */}
                <View style={styles.quickActionsSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('BlockedUsers')}
                    >
                        <Icon name="ban-outline" size={22} color="#F44336" />
                        <Text style={styles.quickActionText}>View Blocked Users</Text>
                        <Icon name="chevron-forward" size={20} color="#B0B8C1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('ReportProblem')}
                    >
                        <Icon name="alert-circle-outline" size={22} color="#FF9800" />
                        <Text style={styles.quickActionText}>Report a Problem</Text>
                        <Icon name="chevron-forward" size={20} color="#B0B8C1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('TermsOfUse')}
                    >
                        <Icon name="document-text-outline" size={22} color="#2196F3" />
                        <Text style={styles.quickActionText}>Community Guidelines</Text>
                        <Icon name="chevron-forward" size={20} color="#B0B8C1" />
                    </TouchableOpacity>
                </View>

                {/* Support Section */}
                <View style={styles.supportSection}>
                    <Text style={styles.supportTitle}>Need Help?</Text>
                    <Text style={styles.supportText}>
                        If you're experiencing harassment or feel unsafe, please contact our support team immediately.
                    </Text>
                    <TouchableOpacity
                        style={styles.supportBtn}
                        onPress={() => navigation.navigate('HelpSupport')}
                    >
                        <Text style={styles.supportBtnText}>Contact Support</Text>
                    </TouchableOpacity>
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
        padding: 18,
    },
    policyNotice: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    policyText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#1565C0',
        lineHeight: 20,
    },
    featureCard: {
        flexDirection: 'row',
        backgroundColor: '#41547A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
    },
    featureDescription: {
        fontSize: 13,
        color: '#B0B8C1',
        lineHeight: 18,
        marginBottom: 8,
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 12,
        color: '#8B95A5',
        marginLeft: 6,
        flex: 1,
    },
    quickActionsSection: {
        marginTop: 8,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#B0B8C1',
        marginBottom: 12,
        marginLeft: 4,
    },
    quickActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#41547A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
    },
    quickActionText: {
        flex: 1,
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
        marginLeft: 14,
    },
    supportSection: {
        backgroundColor: '#41547A',
        padding: 20,
        borderRadius: 12,
        marginBottom: 30,
        alignItems: 'center',
    },
    supportTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    supportText: {
        fontSize: 14,
        color: '#B0B8C1',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    supportBtn: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    supportBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
