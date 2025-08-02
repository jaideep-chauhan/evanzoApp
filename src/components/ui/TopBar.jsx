import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const TopBar = ({ title, showBack = false, showNotification = true }) => {
    const navigation = useNavigation();

    const handleGoBack = () => {

        navigation.goBack();
    };

    return (
        <View style={styles.header}>
            <View style={styles.leftRow}>
                {showBack && (
                    <TouchableOpacity onPress={handleGoBack} style={styles.backIcon}>
                        <Icon name="arrow-left" size={22} color="#000" />
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>{title}</Text>
            </View>

            {showNotification ? (
                <TouchableOpacity>
                    <Icon name="bell" size={20} color="#000" />
                </TouchableOpacity>
            ) : (
                <View style={{ width: 20 }} />
            )}
        </View>
    );
};

export default TopBar;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#FAFAFA',
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backIcon: {
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
    },
});
