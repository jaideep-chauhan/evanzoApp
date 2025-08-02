import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
} from 'react-native';
import { useTheme } from '../../ThemeContext';
import img from '../../assets/images/dummy.png'; // Adjust the path as necessary

const CreateAddForm = ({ type, onClose }) => {
    const theme = useTheme();

    // Event Ad fields
    const [service, setService] = useState('');
    const [eventType, setEventType] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [duration, setDuration] = useState('');
    const [budget, setBudget] = useState('');
    const [description, setDescription] = useState('');

    // Vendor Ad fields
    const [category, setCategory] = useState('');
    const [vendorDescription, setVendorDescription] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [vendorLocation, setVendorLocation] = useState('');
    const [offerAmount, setOfferAmount] = useState('');
    const [offerPercentage, setOfferPercentage] = useState('');
    const [photos, setPhotos] = useState([]);

    const handlePost = () => {
        if (type === 'event') {
            console.log('Posting Event Ad:', {
                service, eventType, location, date, duration, budget, description,
            });
        } else {
            console.log('Posting Vendor Ad:', {
                category, vendorDescription, companyName, vendorLocation, offerAmount, offerPercentage, photos,
            });
        }
    };

    const handleCancel = () => {
        if (onClose) onClose();
    };

    return (
        <View style={styles.modalBorderWrapPro}>
            {/* Header */}
            <View style={styles.headerPro}>
                <Text style={styles.headerTitlePro}>
                    {type === 'event' ? 'Create Event Ad' : 'Create Vendor Ad'}
                </Text>
                <Text style={styles.headerSubtitlePro}>
                    {type === 'event' ? 'Find the perfect service for your event' : 'Showcase your services to potential clients'}
                </Text>
            </View>
            <View style={styles.formContentWrap}>
                <ScrollView style={styles.scrollViewPro} contentContainerStyle={styles.containerPro} showsVerticalScrollIndicator={false}>
                    {type === 'event' ? (
                        <>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>What service do you need?</Text>
                                <TextInput
                                    style={styles.inputPro}
                                    value={service}
                                    onChangeText={setService}
                                    placeholder="Select a service"
                                    placeholderTextColor="#ffffff80"
                                />
                            </View>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>Event Type</Text>
                                <TextInput
                                    style={styles.inputPro}
                                    value={eventType}
                                    onChangeText={setEventType}
                                    placeholder="Select event type"
                                    placeholderTextColor="#ffffff80"
                                />
                            </View>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>Location</Text>
                                <TextInput
                                    style={styles.inputPro}
                                    value={location}
                                    onChangeText={setLocation}
                                    placeholder="Enter location"
                                    placeholderTextColor="#ffffff80"
                                />
                            </View>
                            <View style={styles.rowPro}>
                                <View style={[styles.fieldGroupPro, styles.halfPro]}>
                                    <Text style={styles.labelPro}>Date</Text>
                                    <TextInput
                                        style={styles.inputPro}
                                        value={date}
                                        onChangeText={setDate}
                                        placeholder="MM/DD/YYYY"
                                        placeholderTextColor="#ffffff80"
                                    />
                                </View>
                                <View style={[styles.fieldGroupPro, styles.halfPro]}>
                                    <Text style={styles.labelPro}>Duration</Text>
                                    <TextInput
                                        style={styles.inputPro}
                                        value={duration}
                                        onChangeText={setDuration}
                                        placeholder="e.g. 4 hours"
                                        placeholderTextColor="#ffffff80"
                                    />
                                </View>
                            </View>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>Budget (optional)</Text>
                                <TextInput
                                    style={styles.inputPro}
                                    value={budget}
                                    onChangeText={setBudget}
                                    placeholder="$0"
                                    placeholderTextColor="#ffffff80"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>Description (optional)</Text>
                                <TextInput
                                    style={[styles.inputPro, styles.textAreaPro, { backgroundColor: theme.colors.primary }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Describe your need..."
                                    placeholderTextColor="#ffffff80"
                                    multiline
                                />
                            </View>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>📎 Attachments</Text>
                                <View style={styles.attachmentRowPro}>
                                    <View style={styles.attachmentPro}>
                                        <Image
                                            source={img}
                                            style={styles.attachmentImagePro}
                                        />
                                    </View>
                                    <TouchableOpacity style={styles.addAttachmentPro}>
                                        <Text style={styles.plusPro}>＋</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>Category</Text>
                                <TextInput
                                    style={styles.inputPro}
                                    value={category}
                                    onChangeText={setCategory}
                                    placeholder="Enter category"
                                    placeholderTextColor="#ffffff80"
                                />
                            </View>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>Description</Text>
                                <TextInput
                                    style={[styles.inputPro, styles.textAreaPro, { backgroundColor: theme.colors.primary }]}
                                    value={vendorDescription}
                                    onChangeText={setVendorDescription}
                                    placeholder="Describe your service"
                                    placeholderTextColor="#ffffff80"
                                    multiline
                                />
                            </View>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>Vendor Company Name</Text>
                                <TextInput
                                    style={styles.inputPro}
                                    value={companyName}
                                    onChangeText={setCompanyName}
                                    placeholder="Enter company name"
                                    placeholderTextColor="#ffffff80"
                                />
                            </View>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>Location</Text>
                                <TextInput
                                    style={styles.inputPro}
                                    value={vendorLocation}
                                    onChangeText={setVendorLocation}
                                    placeholder="Enter location"
                                    placeholderTextColor="#ffffff80"
                                />
                            </View>
                            <View style={styles.rowPro}>
                                <View style={[styles.fieldGroupPro, styles.halfPro]}>
                                    <Text style={styles.labelPro}>Amount</Text>
                                    <TextInput
                                        style={styles.inputPro}
                                        value={offerAmount}
                                        onChangeText={setOfferAmount}
                                        placeholder="Enter amount"
                                        placeholderTextColor="#ffffff80"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.fieldGroupPro, styles.halfPro]}>
                                    <Text style={styles.labelPro}>Percentage</Text>
                                    <TextInput
                                        style={styles.inputPro}
                                        value={offerPercentage}
                                        onChangeText={setOfferPercentage}
                                        placeholder="Enter percentage"
                                        placeholderTextColor="#ffffff80"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                            <View style={styles.fieldGroupPro}>
                                <Text style={styles.labelPro}>Photos</Text>
                                <View style={styles.attachmentRowPro}>
                                    {photos.length === 0 && (
                                        <View style={styles.attachmentPro}>
                                            <Image
                                                source={img}
                                                style={styles.attachmentImagePro}
                                            />
                                        </View>
                                    )}
                                    <TouchableOpacity style={styles.addAttachmentPro}>
                                        <Text style={styles.plusPro}>＋</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>
            </View>
            <View style={styles.buttonRowFixedPro}>
                <TouchableOpacity style={[styles.buttonPro, styles.cancelButtonPro]} onPress={handleCancel}>
                    <Text style={styles.cancelTextPro}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.buttonPro, styles.postButtonPro]} onPress={handlePost}>
                    <Text style={styles.postTextPro}>Post</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CreateAddForm;

const styles = StyleSheet.create({
    modalBorderWrapPro: {
        borderWidth: 0,
        borderRadius: 28,
        backgroundColor: '#2C3D5B',
        flex: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 12 },
        elevation: 20,
    },
    headerPro: {
        backgroundColor: 'transparent',
        width: '100%',
        paddingTop: 10,
        paddingBottom: 12,
        paddingHorizontal: 0,
        borderBottomWidth: 0,
    },
    headerTitlePro: {
        color: '#ffffff',
        fontSize: 21,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    headerSubtitlePro: {
        color: '#ffffff80',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        letterSpacing: 0.1,
    },
    formContentWrap: {
        flex: 1,
        paddingBottom: 90,
    },
    scrollViewPro: {
        flex: 1,
        backgroundColor: '#2C3D5B',
    },
    containerPro: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
    },
    fieldGroupPro: {
        marginBottom: 14,
        width: '100%',
    },
    labelPro: {
        color: '#ffffff',
        fontSize: 15,
        marginBottom: 6,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    inputPro: {
        backgroundColor: '#41547A',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        color: '#ffffff',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#ffffff30',
        width: '100%',
        marginBottom: 2,
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    textAreaPro: {
        height: 80,
        textAlignVertical: 'top',
        borderRadius: 12,
        paddingTop: 12,
    },
    rowPro: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 8,
    },
    halfPro: {
        width: '49%',
    },
    attachmentRowPro: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 8,
    },
    attachmentPro: {
        width: 56,
        height: 56,
        backgroundColor: '#41547A',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffffff30',
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    attachmentImagePro: {
        width: 36,
        height: 36,
        resizeMode: 'contain',
        tintColor: '#ffffff80',
    },
    addAttachmentPro: {
        width: 56,
        height: 56,
        borderWidth: 2,
        borderColor: '#ffffff40',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#41547A20',
    },
    plusPro: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '300',
    },
    buttonRowFixedPro: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ffffff20',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: -3 },
        elevation: 4,
    },
    buttonPro: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 18,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    cancelButtonPro: {
        backgroundColor: '#ffffff20',
        marginRight: 6,
        borderWidth: 1,
        borderColor: '#ffffff40',
    },
    cancelTextPro: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    postButtonPro: {
        backgroundColor: '#ffffff',
        marginLeft: 6,
        borderWidth: 0,
    },
    postTextPro: {
        color: '#2C3D5B',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
