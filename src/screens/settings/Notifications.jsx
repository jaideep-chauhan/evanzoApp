import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NotificationStatus from '../../components/NotificationStatus';

export default function Notifications() {
    const navigation = useNavigation();
    const [eventUpdates, setEventUpdates] = useState(true);
    const [newQuotes, setNewQuotes] = useState(true);
    const [chatReplies, setChatReplies] = useState(true);
    const [appAnnouncements, setAppAnnouncements] = useState(false);
    const [notificationSound, setNotificationSound] = useState(true);

    const notificationItems = [
        {
            title: 'Event Updates',
            subtitle: 'Reminders and changes related to your posted events',
            value: eventUpdates,
            onToggle: setEventUpdates
        },
        {
            title: 'New Quotes Received',
            subtitle: 'Be notified when a vendor submits a bid.',
            value: newQuotes,
            onToggle: setNewQuotes
        },
        {
            title: 'Chat Replies',
            subtitle: 'Get alerts when a vendor replies to your message',
            value: chatReplies,
            onToggle: setChatReplies
        },
        {
            title: 'App Announcements',
            subtitle: 'News about feature updates and platform alerts',
            value: appAnnouncements,
            onToggle: setAppAnnouncements
        },
        {
            title: 'Notification Sound',
            subtitle: '',
            value: notificationSound,
            onToggle: setNotificationSound
        }
    ];

    const renderItem = (item, index) => (
        <View key={index} style={styles.item}>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
            </View>
            <Switch
                value={item.value}
                onValueChange={item.onToggle}
                trackColor={{ false: '#6B7A99', true: '#1E2B4F' }}
                thumbColor={item.value ? '#fff' : '#B0B8C1'}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.androidPad} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>{'\u2190'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <NotificationStatus />
                {notificationItems.map(renderItem)}
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
    itemSubtitle: {
        fontSize: 14,
        color: '#B0B8C1',
        lineHeight: 20,
    },
});
