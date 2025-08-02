import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';

const MessageStatus = ({ status, isMe }) => {
    if (!isMe) return null;
    const theme = useTheme();

    const getIcon = () => {
        switch (status) {
            case 'sending':
                return 'time-outline';
            case 'sent':
                return 'checkmark-outline';
            case 'delivered':
                return 'checkmark-done-outline';
            case 'read':
                return 'checkmark-done-outline';
            default:
                return 'time-outline';
        }
    };

    const getColor = () => {
        switch (status) {
            case 'sending':
                return '#8B95A5';
            case 'sent':
                return theme.colors.primary;
            case 'delivered':
                return theme.colors.primary;
            case 'read':
                return '#4CAF50';
            default:
                return '#8B95A5';
        }
    };

    return (
        <View style={styles.container}>
            <Icon name={getIcon()} size={12} color={getColor()} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginLeft: 5,
        marginTop: 2,
    },
});

export default MessageStatus;
