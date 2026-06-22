import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';

export default function Settings() {
    const navigation = useNavigation();
    const { logout, user } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const settingsSections = [
        {
            title: 'Account',
            items: [
                { name: 'Security', screen: 'Security', icon: 'lock-closed-outline' },
                { name: 'Notifications', screen: 'Notifications', icon: 'notifications-outline' },
                { name: 'Privacy', screen: 'Privacy', icon: 'shield-outline' },
            ]
        },
        {
            title: 'Support & About',
            items: [
                { name: 'Help & Support', screen: 'HelpSupport', icon: 'help-circle-outline' },
                { name: 'Terms & Policies', screen: 'TermsPolicies', icon: 'document-text-outline' },
            ]
        },
        {
            title: 'Testing',
            items: [
                { name: 'Test Chat Notification', action: 'test_chat_notification', icon: 'chatbubble-outline' },
                { name: 'Test Approval Notification', action: 'test_approval_notification', icon: 'checkmark-circle-outline' },
                { name: 'Test Rejection Notification', action: 'test_rejection_notification', icon: 'close-circle-outline' },
            ]
        },
        {
            title: 'Actions',
            items: [
                { name: 'Report Problem', screen: 'ReportProblem', icon: 'alert-circle-outline' },
                { name: 'Log out', action: 'logout', icon: 'exit-outline' },
            ]
        }
    ];

    const handleItemPress = (item) => {
        if (item.action === 'logout') {
            handleLogout();
        } else if (item.action === 'test_chat_notification') {
            testChatNotification();
        } else if (item.action === 'test_approval_notification') {
            testApprovalNotification();
        } else if (item.action === 'test_rejection_notification') {
            testRejectionNotification();
        } else if (item.screen) {
            navigation.navigate(item.screen);
        }
    };

    const testChatNotification = async () => {
        try {
            await notificationService.displayNotification({
                data: {
                    type: 'chat_message',
                    chat_id: 'test_chat_123',
                    sender_name: 'Test User',
                    sender_id: 'test_user_456',
                    message: 'This is a test chat message notification!',
                },
                notification: {
                    title: 'Test User',
                    body: 'This is a test chat message notification!',
                }
            });
            Alert.alert('Success', 'Test chat notification sent!');
        } catch (error) {
            Alert.alert('Error', 'Failed to send test notification');
            console.error('Test notification error:', error);
        }
    };

    const testApprovalNotification = async () => {
        try {
            await notificationService.displayNotification({
                data: {
                    type: 'admin_notification',
                    action: 'ad_approved',
                    ad_type: 'vendor',
                    ad_id: 'test_ad_123',
                },
                notification: {
                    title: '✅ Ad Approved!',
                    body: 'Your vendor ad "Test Photography Service" has been approved and is now live.',
                }
            });
            Alert.alert('Success', 'Test approval notification sent!');
        } catch (error) {
            Alert.alert('Error', 'Failed to send test notification');
            console.error('Test notification error:', error);
        }
    };

    const testRejectionNotification = async () => {
        try {
            await notificationService.displayNotification({
                data: {
                    type: 'admin_notification',
                    action: 'ad_rejected',
                    ad_type: 'event',
                    ad_id: 'test_ad_456',
                    rejection_reason: 'Missing required information',
                },
                notification: {
                    title: '❌ Ad Rejected',
                    body: 'Your event ad "Test Birthday Party" has been rejected. Reason: Missing required information',
                }
            });
            Alert.alert('Success', 'Test rejection notification sent!');
        } catch (error) {
            Alert.alert('Error', 'Failed to send test notification');
            console.error('Test notification error:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoggingOut(true);
                        try {
                            await logout();
                            // Navigate to login screen and reset navigation stack
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        } finally {
                            setIsLoggingOut(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const renderSection = (section) => (
        <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.settingItem}
                    onPress={() => handleItemPress(item)}
                >
                    <View style={styles.itemLeft}>
                        <Icon name={item.icon} size={22} color="#fff" style={styles.itemIcon} />
                        <Text style={styles.itemText}>{item.name}</Text>
                    </View>
                    <Icon name="chevron-forward-outline" size={20} color="#B0B8C1" style={styles.arrow} />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.androidPad} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>{'\u2190'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {settingsSections.map(renderSection)}
            </ScrollView>
            
            {/* Loading Overlay */}
            {isLoggingOut && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Logging out...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    androidPad: {
        height: 18,
        backgroundColor: '#2C3D5B',
    },
    safe: {
        flex: 1,
        backgroundColor: '#2C3D5B',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#41547A',
        backgroundColor: '#2C3D5B',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
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
        paddingTop: 18,
        paddingBottom: 24,
    },
    section: {
        marginBottom: 28,
        backgroundColor: 'transparent',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#B0B8C1',
        marginBottom: 10,
        marginLeft: 4,
        letterSpacing: 0.2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#41547A',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderRadius: 14,
        marginBottom: 10,
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 1,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemIcon: {
        fontSize: 22,
        marginRight: 14,
    },
    itemText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
        letterSpacing: 0.1,
    },
    arrow: {
        color: '#B0B8C1',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 12,
        fontWeight: '600',
    },
});
