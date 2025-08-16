import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Modal, Pressable } from 'react-native';
import { useTheme } from '../../ThemeContext';
import DatePicker from 'react-native-date-picker';

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
                <TouchableOpacity style={[styles.button, styles.editButton, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.saveButton, { borderColor: theme.colors.primary + '50' }]}>
                    <Text style={[styles.saveText, { color: theme.colors.primary }]}>Save</Text>
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
    editButton: {
        marginRight: 10,
    },
    saveButton: {
        borderWidth: 1,
    },
    editText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    saveText: {
        fontWeight: '600',
        fontSize: 15,
    },
});
