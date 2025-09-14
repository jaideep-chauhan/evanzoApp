import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Modal, Pressable, ActivityIndicator, Alert, FlatList, ScrollView } from 'react-native';
import { useTheme } from '../../ThemeContext';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import preSavedMessageService from '../../services/preSavedMessageService';
import { CustomSuccessModal } from '../../components/CustomSuccessModal';

const PreSavedMessage = ({ onClose }) => {
    const theme = useTheme();

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [eventName, setEventName] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('');
    const [time, setTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [existingMessage, setExistingMessage] = useState(null);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showDurationDropdown, setShowDurationDropdown] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState({ title: '', message: '', type: 'success' });
    
    // Categories list
    const categories = [
        'Wedding',
        'Birthday Party',
        'Corporate Event',
        'Conference',
        'Concert',
        'Festival',
        'Exhibition',
        'Workshop',
        'Seminar',
        'Party',
        'Meeting',
        'Other'
    ];
    
    // Duration options
    const durationOptions = [
        '30 minutes',
        '1 hour',
        '1.5 hours',
        '2 hours',
        '2.5 hours',
        '3 hours',
        '4 hours',
        '5 hours',
        '6 hours',
        'Half day',
        'Full day',
        '2 days',
        '3 days',
        'Week',
        'Custom'
    ];

    // Load existing message on component mount
    useEffect(() => {
        loadPreSavedMessage();
    }, []);

    const loadPreSavedMessage = async () => {
        setIsLoading(true);
        try {
            const response = await preSavedMessageService.getPreSavedMessage();
            if (response.success && response.data) {
                const message = response.data;
                setExistingMessage(message);
                setEventName(message.event_name || '');
                setLocation(message.location || '');
                setCategory(message.category || '');
                if (message.time) {
                    const [hours, minutes] = message.time.split(':');
                    const timeDate = new Date();
                    timeDate.setHours(parseInt(hours, 10));
                    timeDate.setMinutes(parseInt(minutes, 10));
                    setTime(timeDate);
                } else {
                    setTime(new Date());
                }
                setDuration(message.duration || '');
                setDescription(message.description || '');
                if (message.event_date) {
                    setDate(new Date(message.event_date));
                }
            }
        } catch (error) {
            console.error('Error loading pre-saved message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!eventName.trim()) {
            setModalMessage({
                title: 'Validation Error',
                message: 'Please enter an event name',
                type: 'error'
            });
            setSuccessModalVisible(true);
            return;
        }

        setIsSaving(true);
        try {
            const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
            const formData = {
                event_name: eventName,
                location,
                category,
                event_date: date.toISOString(),
                time: timeString,
                duration,
                description,
            };

            // Generate message template
            const messageTemplate = preSavedMessageService.generateMessageTemplate({
                eventName,
                location,
                category,
                date: date.toLocaleDateString(),
                time: timeString,
                duration,
                description
            });

            const messageData = {
                ...formData,
                message_template: messageTemplate,
                title: `${eventName} - Template`
            };

            const response = await preSavedMessageService.savePreSavedMessage(messageData);
            
            if (response.success) {
                setExistingMessage(response.data);
                setModalMessage({
                    title: 'Success',
                    message: 'Pre-saved message saved successfully!',
                    type: 'success'
                });
                setSuccessModalVisible(true);
            } else {
                setModalMessage({
                    title: 'Error',
                    message: response.message,
                    type: 'error'
                });
                setSuccessModalVisible(true);
            }
        } catch (error) {
            console.error('Error saving pre-saved message:', error);
            setModalMessage({
                title: 'Error',
                message: 'Failed to save pre-saved message',
                type: 'error'
            });
            setSuccessModalVisible(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = () => {
        Alert.alert(
            'Clear Form',
            'Are you sure you want to clear all fields?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setEventName('');
                        setLocation('');
                        setCategory('');
                        setTime(new Date());
                        setDuration('');
                        setDescription('');
                        setDate(new Date());
                    }
                }
            ]
        );
    };
    
    const handleSuccessModalConfirm = () => {
        setSuccessModalVisible(false);
        if (modalMessage.type === 'success' && onClose) {
            // Close the pre-save message form after success
            onClose();
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.colors.primary }]}>Event Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter event name"
                    placeholderTextColor="#999"
                    value={eventName}
                    onChangeText={setEventName}
                />
            </View>

            <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.colors.primary }]}>Location</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter event location"
                    placeholderTextColor="#999"
                    value={location}
                    onChangeText={setLocation}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.fieldGroup, styles.half]}>
                    <Text style={[styles.label, { color: theme.colors.primary }]}>Category</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.dropdownButton]}
                        onPress={() => setShowCategoryDropdown(true)}
                    >
                        <Text style={styles.dropdownText}>{category || 'Select Category'}</Text>
                        <Icon name="chevron-down" size={20} color="#999" />
                    </TouchableOpacity>
                </View>
                <View style={[styles.fieldGroup, styles.half]}>
                    <Text style={[styles.label, { color: theme.colors.primary }]}>Date</Text>
                    <TouchableOpacity 
                        style={[styles.input, styles.dateButton]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.dateText}>
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.row}>
                <View style={[styles.fieldGroup, styles.half]}>
                    <Text style={[styles.label, { color: theme.colors.primary }]}>Time</Text>
                    <TouchableOpacity 
                        style={[styles.input, styles.timeButton]}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Icon name="time-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.timeText}>
                            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.fieldGroup, styles.half]}>
                    <Text style={[styles.label, { color: theme.colors.primary }]}>Duration</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.dropdownButton]}
                        onPress={() => setShowDurationDropdown(true)}
                    >
                        <Text style={styles.dropdownText}>{duration || 'Select Duration'}</Text>
                        <Icon name="chevron-down" size={20} color="#999" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.colors.primary }]}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter event description"
                    placeholderTextColor="#999"
                    value={description}
                    onChangeText={setDescription}
                />
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity 
                    style={[styles.button, styles.clearButton, { borderColor: theme.colors.primary + '50' }]}
                    onPress={handleClear}
                    disabled={isSaving}
                >
                    <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveText}>
                            {existingMessage ? 'Update' : 'Save'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            
            {/* Date Picker Modal */}
            <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.datePickerModal}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Select Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Icon name="close" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <DatePicker
                            date={date}
                            onDateChange={setDate}
                            mode="date"
                            minimumDate={new Date()}
                            theme={theme.dark ? 'dark' : 'light'}
                            textColor={theme.colors.primary}
                            style={styles.datePicker}
                        />
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                            onPress={() => setShowDatePicker(false)}
                        >
                            <Text style={styles.modalButtonText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            {/* Time Picker */}
            {showTimePicker && (
                <DateTimePicker
                    value={time}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedTime) => {
                        setShowTimePicker(false);
                        if (selectedTime) {
                            setTime(selectedTime);
                        }
                    }}
                    textColor={theme.colors.primary}
                />
            )}
            
            {/* Category Dropdown Modal */}
            <Modal
                visible={showCategoryDropdown}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCategoryDropdown(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowCategoryDropdown(false)}
                    />
                    <View style={styles.dropdownModal}>
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>Select Category</Text>
                            <TouchableOpacity
                                onPress={() => setShowCategoryDropdown(false)}
                                style={styles.dropdownCloseBtn}
                            >
                                <Icon name="close" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item}
                            style={styles.dropdownList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setCategory(item);
                                        setShowCategoryDropdown(false);
                                    }}
                                >
                                    <View style={styles.dropdownItemContent}>
                                        <Icon name="pricetag-outline" size={18} color={category === item ? theme.colors.primary : '#666'} />
                                        <Text style={[styles.dropdownItemText, category === item && { color: theme.colors.primary, fontWeight: '600' }]}>
                                            {item}
                                        </Text>
                                    </View>
                                    {category === item && (
                                        <Icon name="checkmark" size={20} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
            
            {/* Duration Dropdown Modal */}
            <Modal
                visible={showDurationDropdown}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDurationDropdown(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowDurationDropdown(false)}
                    />
                    <View style={styles.dropdownModal}>
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>Select Duration</Text>
                            <TouchableOpacity
                                onPress={() => setShowDurationDropdown(false)}
                                style={styles.dropdownCloseBtn}
                            >
                                <Icon name="close" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={durationOptions}
                            keyExtractor={(item) => item}
                            style={styles.dropdownList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setDuration(item);
                                        setShowDurationDropdown(false);
                                    }}
                                >
                                    <View style={styles.dropdownItemContent}>
                                        <Icon name="time-outline" size={18} color={duration === item ? theme.colors.primary : '#666'} />
                                        <Text style={[styles.dropdownItemText, duration === item && { color: theme.colors.primary, fontWeight: '600' }]}>
                                            {item}
                                        </Text>
                                    </View>
                                    {duration === item && (
                                        <Icon name="checkmark" size={20} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
            
            {/* Success/Error Modal */}
            <CustomSuccessModal
                visible={successModalVisible}
                title={modalMessage.title}
                message={modalMessage.message}
                type={modalMessage.type}
                onConfirm={handleSuccessModalConfirm}
                confirmText="OK"
            />
        </ScrollView>
    );
};

export default PreSavedMessage;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    fieldGroup: {
        marginBottom: 16,
    },
    label: {
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        fontSize: 15,
        color: '#444',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    half: {
        width: '48%',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 50,
        flex: 1,
        alignItems: 'center',
    },
    clearButton: {
        marginRight: 10,
        borderWidth: 1,
    },
    saveButton: {
        // backgroundColor will be set dynamically
    },
    clearText: {
        fontWeight: '600',
        fontSize: 15,
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '500',
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        color: '#444',
        fontSize: 15,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    dateText: {
        marginLeft: 8,
        color: '#444',
        fontSize: 14,
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    timeText: {
        marginLeft: 8,
        color: '#444',
        fontSize: 15,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dropdownModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    dropdownCloseBtn: {
        padding: 4,
    },
    dropdownList: {
        maxHeight: 400,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownItemText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    datePickerModal: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    datePicker: {
        alignSelf: 'center',
    },
    modalButton: {
        marginTop: 20,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});