import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function Settings() {
    const navigation = useNavigation();

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
            title: 'Actions',
            items: [
                { name: 'Report Problem', screen: 'ReportProblem', icon: 'alert-circle-outline' },
                { name: 'Log out', action: 'logout', icon: 'exit-outline' },
            ]
        }
    ];

    const handleItemPress = (item) => {
        if (item.action === 'logout') {
            // Handle logout logic
            navigation.navigate('Login');
        } else if (item.screen) {
            navigation.navigate(item.screen);
        }
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
});
