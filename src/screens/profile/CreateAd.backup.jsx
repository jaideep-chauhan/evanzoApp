import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    SafeAreaView,
} from 'react-native';
import CreateAddForm from './CreateAddForm';

const CreateAd = ({ onClose, onTabPress }) => {
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('vendor');

    const handleTabPress = (type) => {
        console.log('Tab pressed:', type);
        setFormType(type);
        setShowForm(true);
        // Also call parent's onTabPress if provided
        if (onTabPress) onTabPress(type);
        if (onClose) onClose(); // Close CreateAd popup if parent provides onClose
    };

    const handleCloseForm = () => {
        console.log('Closing form modal');
        setShowForm(false);
    };

    console.log('CreateAd render - showForm:', showForm, 'formType:', formType);

    return (
        <>
            <View style={styles.container}>
                <Text style={styles.title}>Create Add</Text>

                <View style={styles.tabColumnWrap}>
                    <TouchableOpacity
                        style={[styles.tabColumnBtn, styles.activeTab]}
                        onPress={() => handleTabPress('vendor')}
                    >
                        <Text style={styles.activeTabText}>Vendor</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabColumnBtn, styles.inactiveTab]}
                        onPress={() => handleTabPress('event')}
                    >
                        <Text style={styles.inactiveTabText}>Event</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Form Modal */}
            <Modal
                visible={showForm}
                animationType="slide"
                transparent={false}
                onRequestClose={handleCloseForm}
            >
                <SafeAreaView style={styles.fullScreenModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            Create {formType === 'vendor' ? 'Vendor' : 'Event'} Ad
                        </Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleCloseForm}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.formContainer}>
                        <CreateAddForm type={formType} onClose={handleCloseForm} />
                    </View>
                </SafeAreaView>
            </Modal>
        </>
    );
};

export default CreateAd;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#2C3D5B',
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
        backgroundColor: '#32446A',
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 0,
    },
    activeTab: {
        backgroundColor: '#41547A',
    },
    inactiveTab: {
        backgroundColor: '#32446A',
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
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#2C3D5B',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    closeButton: {
        backgroundColor: '#F4F4F4',
        borderRadius: 20,
        padding: 8,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#2C3D5B',
        fontSize: 20,
        fontWeight: 'bold',
    },
    formContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
