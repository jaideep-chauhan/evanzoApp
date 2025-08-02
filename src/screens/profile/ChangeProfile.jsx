import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../ThemeContext';
import img from '../.../../../assets/images/dummy.png'; // Adjust the path as necessary
const ChangeProfile = () => {
    const [name, setName] = useState('Tushar Dhania');
    const [location, setLocation] = useState('Ontario, Canada');
    const [phone, setPhone] = useState('+1 0000 0000');
    const [email, setEmail] = useState('Tushar@gmail.com');
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                <Image
                    source={img}
                    style={styles.avatar}
                />
            </View>
            <Text style={[styles.title, { color: theme.colors.primary }]}>Change Profile</Text>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter your location"
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.fieldGroup, styles.half]}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholder="Enter phone number"
                        placeholderTextColor="#999"
                    />
                </View>
                <View style={[styles.fieldGroup, styles.half]}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        placeholder="Enter email address"
                        placeholderTextColor="#999"
                    />
                </View>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ChangeProfile;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        margin: 0,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        alignItems: 'center',
        width: '100%', // Make container take full popup width
    },
    avatarContainer: {
        marginBottom: 12,
        marginTop: 10,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f5f5f5',
        resizeMode: 'cover',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 24,
        color: '#1E2B4F',
    },
    fieldGroup: {
        marginBottom: 16,
        width: '100%', // Ensure field group takes full width
    },
    label: {
        color: '#444',
        marginBottom: 6,
        fontWeight: '600',
        fontSize: 16,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        fontSize: 15,
        color: '#444',
        width: '100%', // Ensure input takes full width of fieldGroup
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    half: {
        width: '48%',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        width: '100%',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 50,
        flex: 1,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#2C3E50',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
