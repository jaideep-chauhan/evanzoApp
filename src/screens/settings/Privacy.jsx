import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function Privacy() {
    const navigation = useNavigation();
    const [displayReviews, setDisplayReviews] = useState(true);
    const [autoShareContact, setAutoShareContact] = useState(false);

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => console.log('Account deleted') }
            ]
        );
    };

    const privacyItems = [
        {
            title: 'Display my reviews',
            subtitle: 'Vendors can see reviews left by others vendors.',
            type: 'switch',
            value: displayReviews,
            onToggle: setDisplayReviews
        },
        {
            title: 'Auto-Share Contact Info',
            subtitle: 'Your phone/email will only be shared with vendors marked as hired.',
            type: 'switch',
            value: autoShareContact,
            onToggle: setAutoShareContact
        },
        {
            title: 'Delete My Account',
            subtitle: '',
            type: 'action',
            onPress: handleDeleteAccount,
            danger: true
        }
    ];

    const renderItem = (item, index) => (
        <TouchableOpacity
            key={index}
            style={[styles.item, item.danger && styles.dangerItem]}
            onPress={item.type === 'action' ? item.onPress : undefined}
            disabled={item.type === 'switch'}
        >
            <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, item.danger && styles.dangerText]}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
            </View>
            {item.type === 'switch' ? (
                <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#6B7A99', true: '#1E2B4F' }}
                    thumbColor={item.value ? '#fff' : '#B0B8C1'}
                />
            ) : item.type === 'action' && !item.danger ? (
                <Text style={styles.arrow}>{'>'}</Text>
            ) : null}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.androidPad} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>{'\u2190'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy</Text>
            </View>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {privacyItems.map(renderItem)}
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
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#41547A',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    dangerItem: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    itemContent: {
        flex: 1,
        marginRight: 12,
    },
    itemTitle: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 4,
    },
    dangerText: {
        color: '#ff6b6b',
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#B0B8C1',
        lineHeight: 20,
    },
    arrow: {
        color: '#B0B8C1',
        fontSize: 16,
        fontWeight: '600',
    },
});
