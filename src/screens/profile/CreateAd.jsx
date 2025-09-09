import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import CreateAddForm from './CreateAddForm';
import { useTheme } from '../../ThemeContext';

const CreateAd = ({ onClose, onTabPress }) => {
    const [formType, setFormType] = useState(null);
    const theme = useTheme();

    const handleTabPress = (type) => {
        setFormType(type);
    };

    const closeModal = () => {
        setFormType(null);
        if (onClose) onClose();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
            {!formType ? (
                <>
                    <Text style={styles.title}>Create Ad</Text>
                    <View style={styles.tabColumnWrap}>
                        <TouchableOpacity
                            style={[styles.tabColumnBtn, styles.activeTab, { backgroundColor: theme.colors.primary }]}
                            onPress={() => onTabPress && onTabPress('vendor')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.activeTabText}>Vendor</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabColumnBtn, styles.inactiveTab, { backgroundColor: theme.colors.primary, opacity: 0.7 }]}
                            onPress={() => onTabPress && onTabPress('event')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.inactiveTabText}>Event</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : null}
        </View>
    );
};

export default CreateAd;

const styles = StyleSheet.create({
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 22,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        alignSelf: 'center',
        marginBottom: 24,
    },
    tabColumnWrap: {
        width: '100%',
        gap: 14,
    },
    tabColumnBtn: {
        width: '100%',
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 0,
    },
    activeTab: {
        // backgroundColor: '#41547A',
    },
    inactiveTab: {
        // backgroundColor: '#32446A',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    inactiveTabText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    centeredOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        minHeight: 420,
        maxHeight: '90%',
        width: '92%',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    closeBtn: {
        backgroundColor: '#2C3D5B',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    closeBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        // backgroundColor: '#fff',
        maxHeight: 1000,
    },
});