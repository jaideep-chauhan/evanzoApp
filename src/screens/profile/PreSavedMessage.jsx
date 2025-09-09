import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../ThemeContext';
import DatePicker from 'react-native-date-picker';
import preSavedMessageService from '../../services/preSavedMessageService';

const PreSavedMessage = () => {
    const theme = useTheme();

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [eventName, setEventName] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [existingMessage, setExistingMessage] = useState(null);

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
                setTime(message.time || '');
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
            Alert.alert('Error', 'Please enter an event name');
            return;
        }

        setIsSaving(true);
        try {
            const formData = {
                event_name: eventName,
                location,
                category,
                event_date: date.toISOString(),
                time,
                duration,
                description,
            };

            // Generate message template
            const messageTemplate = preSavedMessageService.generateMessageTemplate({
                eventName,
                location,
                category,
                date: date.toLocaleDateString(),
                time,
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
                Alert.alert('Success', 'Pre-saved message saved successfully!');
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error) {
            console.error('Error saving pre-saved message:', error);
            Alert.alert('Error', 'Failed to save pre-saved message');
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
                        setTime('');
                        setDuration('');
                        setDescription('');
                        setDate(new Date());
                    }
                }
            ]
        );
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
        <View style={styles.container}>
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
                    <TextInput
                        style={styles.input}
                        placeholder="Enter event category"
                        placeholderTextColor="#999"
                        value={category}
                        onChangeText={setCategory}
                    />
                </View>
                <View style={[styles.fieldGroup, styles.half]}>
                    <Text style={[styles.label, { color: theme.colors.primary }]}>Date</Text>
                    <Pressable onPress={() => setShowDatePicker(true)} style={({ pressed }) => [styles.input, pressed && { backgroundColor: '#ececec' }]}>
                        <Text style={{ color: '#444', fontSize: 15 }}>
                            {date ? date.toLocaleDateString() : 'Select date'}
                        </Text>
                    </Pressable>
                    <DatePicker
                        modal
                        open={showDatePicker}
                        date={date}
                        mode="date"
                        onConfirm={(selectedDate) => {
                            setShowDatePicker(false);
                            setDate(selectedDate);
                        }}
                        onCancel={() => setShowDatePicker(false)}
                        theme={theme.dark ? 'dark' : 'light'}
                        textColor={theme.colors.primary}
                    />
                </View>
            </View>
            <View style={styles.row}>
                <View style={[styles.fieldGroup, styles.half]}>
                    <Text style={[styles.label, { color: theme.colors.primary }]}>Time</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter event time"
                        placeholderTextColor="#999"
                        value={time}
                        onChangeText={setTime}
                    />
                </View>
                <View style={[styles.fieldGroup, styles.half]}>
                    <Text style={[styles.label, { color: theme.colors.primary }]}>Duration</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter event duration"
                        placeholderTextColor="#999"
                        value={duration}
                        onChangeText={setDuration}
                    />
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
        </View>
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
});
