import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    Modal,
    FlatList,
    Platform,
    PermissionsAndroid,
    KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { openImagePickerWithCropper, IMAGE_DIMENSIONS } from '../../utils/imageCropperUtils';
import { useTheme } from '../../ThemeContext';
// import img from '../../assets/images/dummy.png'; // Removed unused import
import vendorService from '../../services/vendorService';
import eventService from '../../services/eventService';
import { CustomSuccessModal } from '../../components/CustomSuccessModal';
import { CustomToast } from '../../components/CustomToast';

const CreateAddForm = ({ type, onClose }) => {
    const theme = useTheme();

    // Event Ad fields
    const [service, setService] = useState('');
    const [eventType, setEventType] = useState('');
    const [eventTags, setEventTags] = useState([]);
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateSelected, setDateSelected] = useState(false);
    const [duration, setDuration] = useState('');
    const [budget, setBudget] = useState('');
    const [description, setDescription] = useState('');
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);
    const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);

    // Vendor Ad fields
    const [category, setCategory] = useState('Photographer');
    const [vendorDescription, setVendorDescription] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [vendorLocation, setVendorLocation] = useState('Ontario, Canada');
    const [selectedTags, setSelectedTags] = useState([]);
    const [offers, setOffers] = useState([{ amount: '', discount: '' }]);
    const [photos, setPhotos] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Loading state
    const [isLoading, setIsLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [modalState, setModalState] = useState({ visible: false, title: '', message: '', type: 'success' });
    const [toastState, setToastState] = useState({ visible: false, message: '', type: 'error' });

    // Categories list
    const categories = [
        'Photographer',
        'Videographer',
        'Caterer',
        'Decorator',
        'DJ',
        'Event Planner',
        'Florist',
        'Makeup Artist',
        'Venue',
        'Transport',
    ];

    // Tags list for vendor
    const tagOptions = [
        'Birthday party',
        'Corporate',
        'Event',
        'Candid',
        'Wedding',
        'Pre Wedding',
        'Concert',
        'Maternity',
        'Photobooth',
    ];

    // Service options for events
    const serviceOptions = [
        'Photographer',
        'Videographer',
        'Caterer',
        'Decorator',
        'DJ',
        'Event Planner',
        'Florist',
        'Makeup Artist',
        'Venue',
        'Transport',
        'Security',
        'Sound System',
        'Lighting',
        'Entertainment',
    ];

    // Event type options
    const eventTypeOptions = [
        'Wedding',
        'Birthday Party',
        'Corporate Event',
        'Conference',
        'Concert',
        'Exhibition',
        'Workshop',
        'Seminar',
        'Product Launch',
        'Anniversary',
        'Graduation',
        'Baby Shower',
        'Engagement',
        'Festival',
        'Charity Event',
    ];

    // Event type tags
    const eventTypeTagOptions = [
        'Indoor',
        'Outdoor',
        'Formal',
        'Casual',
        'Small Gathering',
        'Large Event',
        'Day Event',
        'Evening Event',
        'Weekend',
        'Weekday',
    ];

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const toggleEventTag = (tag) => {
        if (eventTags.includes(tag)) {
            setEventTags(eventTags.filter(t => t !== tag));
        } else {
            setEventTags([...eventTags, tag]);
        }
    };

    const addOffer = () => {
        setOffers([...offers, { amount: '', discount: '' }]);
    };

    const removeOffer = (index) => {
        if (offers.length > 1) {
            const newOffers = offers.filter((_, i) => i !== index);
            setOffers(newOffers);
        }
    };

    const updateOffer = (index, field, value) => {
        const newOffers = [...offers];
        newOffers[index][field] = value;
        setOffers(newOffers);
    };

    const requestGalleryPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    {
                        title: 'Gallery Permission',
                        message: 'This app needs access to your gallery to select photos',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const selectImage = async () => {
        const hasPermission = await requestGalleryPermission();

        if (!hasPermission) {
            setToastState({ visible: true, message: 'Gallery permission is required to select photos', type: 'error' });
            return;
        }

        try {
            setIsImageLoading(true); // Show loading indicator

            // Open image picker with cropper
            // Using FREE dimensions to allow users to crop to any size they want
            const selectedImages = await openImagePickerWithCropper({
                ...IMAGE_DIMENSIONS.FREE,
                multiple: true,
                maxFiles: 10,
                compressImageQuality: 0.8,
            });

            setIsImageLoading(false); // Hide loading indicator

            if (selectedImages && selectedImages.length > 0) {
                const formattedPhotos = selectedImages.map((image, index) => ({
                    uri: image.uri,
                    type: image.mime || 'image/jpeg',
                    name: `photo_${Date.now()}_${index}.jpg`,
                    width: image.width,
                    height: image.height,
                }));

                setPhotos([...photos, ...formattedPhotos]);
                setToastState({
                    visible: true,
                    message: `${selectedImages.length} image(s) cropped successfully`,
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Image picker error:', error);
            setIsImageLoading(false); // Hide loading indicator
            setToastState({
                visible: true,
                message: 'Failed to select images',
                type: 'error'
            });
        }
    };

    const removePhoto = (index) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
    };

    const handlePost = async () => {
        setIsLoading(true);

        try {
            if (type === 'event') {
                // Validate event fields
                if (!service || !eventType || !location || !dateSelected) {
                    setToastState({ visible: true, message: 'Please fill in all required fields', type: 'error' });
                    setIsLoading(false);
                    return;
                }

                // Validate description word count
                const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
                if (description && wordCount < 100) {
                    setToastState({ visible: true, message: `Description must be at least 100 words. Current: ${wordCount} words`, type: 'error' });
                    setIsLoading(false);
                    return;
                }

                // Create FormData for file upload
                const formData = new FormData();
                
                // Prepare complete payload for logging
                const eventPayload = {
                    service_needed: service,
                    event_type: eventType,
                    event_tags: eventTags,
                    location: location,
                    date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
                    duration: duration || '',
                    budget: budget || '',
                    description: description || '',
                    photos_count: photos.length,
                    photos: photos.map((photo, index) => ({
                        uri: photo.uri,
                        type: photo.type || 'image/jpeg',
                        name: photo.name || `attachment_${index}.jpg`,
                    }))
                };
                
                console.log('=== EVENT AD CREATION PAYLOAD ===');
                console.log('Complete Event Ad Payload:', JSON.stringify(eventPayload, null, 2));
                console.log('Service Needed:', service);
                console.log('Event Type:', eventType);
                console.log('Event Tags:', eventTags);
                console.log('Location:', location);
                console.log('Date:', date.toISOString().split('T')[0]);
                console.log('Duration:', duration || 'Not specified');
                console.log('Budget:', budget || 'Not specified');
                console.log('Description:', description || 'No description');
                console.log('Photos Count:', photos.length);
                console.log('================================');
                
                // Add text fields
                formData.append('service_needed', service);
                formData.append('event_type', eventType);
                formData.append('event_tags', JSON.stringify(eventTags));
                formData.append('location', location);
                formData.append('date', date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
                if (duration) formData.append('duration', duration);
                if (budget) formData.append('budget', budget);
                formData.append('description', description || '');

                // Add photo files (backend expects 'attachments' field name for events)
                photos.forEach((photo, index) => {
                    formData.append('attachments', {
                        uri: photo.uri,
                        type: photo.type || 'image/jpeg',
                        name: photo.name || `attachment_${index}.jpg`,
                    });
                });

                console.log('Uploading event ad with', photos.length, 'photos');

                const response = await eventService.createEventAd(formData);
                
                console.log('=== EVENT AD CREATION RESPONSE ===');
                console.log('Response:', response);
                console.log('Success:', response.success);
                console.log('Message:', response.message);
                if (response.data) {
                    console.log('Created Event Ad Data:', response.data);
                }
                console.log('==================================');

                if (response.success) {
                    setModalState({
                        visible: true,
                        title: 'Success! Waiting for Approval',
                        message: 'Your event ad has been created successfully and is now waiting for approval from the Evanzo team. Once approved, it will be visible to all vendors.',
                        type: 'success'
                    });
                } else {
                    setToastState({ visible: true, message: response.message || 'Failed to create event ad', type: 'error' });
                }
            } else {
                // Validate vendor fields
                if (!category || !companyName || !vendorLocation) {
                    setToastState({ visible: true, message: 'Please fill in all required fields', type: 'error' });
                    setIsLoading(false);
                    return;
                }

                // Validate description word count
                const wordCount = vendorDescription.trim().split(/\s+/).filter(word => word.length > 0).length;
                if (vendorDescription && wordCount < 100) {
                    setToastState({ visible: true, message: `Description must be at least 100 words. Current: ${wordCount} words`, type: 'error' });
                    setIsLoading(false);
                    return;
                }

                // Validate minimum photos for vendor
                if (photos.length < 10) {
                    setToastState({ visible: true, message: `Please add at least 10 photos. Current: ${photos.length} photos`, type: 'error' });
                    setIsLoading(false);
                    return;
                }

                // Prepare offer data - send as array of objects matching database structure
                const validOffers = offers.filter(offer => offer.amount || offer.discount);

                // Create FormData for file upload
                const formData = new FormData();
                
                // Add text fields
                formData.append('title', companyName);
                formData.append('category', category);
                formData.append('description', vendorDescription || '');
                formData.append('company_name', companyName);
                formData.append('location', vendorLocation);
                formData.append('services_offered', JSON.stringify(selectedTags));
                formData.append('offers', JSON.stringify(validOffers));

                // Add photo files (backend expects 'photos' field name)
                photos.forEach((photo, index) => {
                    formData.append('photos', {
                        uri: photo.uri,
                        type: photo.type || 'image/jpeg',
                        name: photo.name || `photo_${index}.jpg`,
                    });
                });

                console.log('Uploading vendor ad with', photos.length, 'photos');

                const response = await vendorService.createVendorAd(formData);

                if (response.success) {
                    setModalState({
                        visible: true,
                        title: 'Success! Waiting for Approval',
                        message: 'Your vendor ad has been created successfully and is now waiting for approval from the Evanzo team. Once approved, it will be visible to all users.',
                        type: 'success'
                    });
                } else {
                    setToastState({ visible: true, message: response.message || 'Failed to create vendor ad', type: 'error' });
                }
            }
        } catch (error) {
            console.error('Error posting ad:', error);
            setToastState({ visible: true, message: 'An unexpected error occurred. Please try again.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (onClose) onClose();
    };

    return (
        <KeyboardAvoidingView 
            style={styles.modalBorderWrapPro}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header */}
            <View style={styles.headerPro}>
                <Text style={styles.headerTitlePro}>
                    {type === 'event' ? 'Create Event Ad' : 'Create Vendor Ad'}
                </Text> 
            </View>
            <ScrollView
                style={styles.scrollViewPro}
                contentContainerStyle={styles.containerPro}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
            >
                {type === 'event' ? (
                    <>
                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>What service you need?</Text>
                            <TouchableOpacity
                                style={[styles.inputPro, styles.dropdownButton]}
                                onPress={() => setShowServiceDropdown(true)}
                            >
                                <Text style={styles.dropdownText}>{service || 'Select a service'}</Text>
                                <Icon name="chevron-down" size={20} color="#ffffff80" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>Event Type</Text>
                            <TouchableOpacity
                                style={[styles.inputPro, styles.dropdownButton]}
                                onPress={() => setShowEventTypeDropdown(true)}
                            >
                                <Text style={styles.dropdownText}>{eventType || 'Select event type'}</Text>
                                <Icon name="chevron-down" size={20} color="#ffffff80" />
                            </TouchableOpacity>

                            {/* Event Type Tags */}
                            {eventType && (
                                <View style={styles.tagsContainer}>
                                    {eventTypeTagOptions.map((tag) => (
                                        <TouchableOpacity
                                            key={tag}
                                            style={[
                                                styles.tagButton,
                                                eventTags.includes(tag) && styles.tagButtonSelected
                                            ]}
                                            onPress={() => toggleEventTag(tag)}
                                        >
                                            <Text style={[
                                                styles.tagText,
                                                eventTags.includes(tag) && styles.tagTextSelected
                                            ]}>
                                                {tag}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
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
                                <TouchableOpacity
                                    style={[styles.inputPro, styles.datePickerButton]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={dateSelected ? styles.dateText : styles.placeholderText}>
                                        {dateSelected ? date.toLocaleDateString() : 'Select Date'}
                                    </Text>
                                    <Icon name="calendar" size={20} color="#ffffff80" />
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(Platform.OS === 'android');
                                            if (selectedDate) {
                                                setDate(selectedDate);
                                                setDateSelected(true);
                                            }
                                        }}
                                        minimumDate={new Date()}
                                    />
                                )}
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
                            {type === 'vendor' && photos.length > 0 && (
                                <Text style={styles.photoCount}>
                                    {photos.length} / 10 photos (minimum)
                                </Text>
                            )}
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
                            <Text style={styles.labelPro}>Description (optional, min. 100 words if provided)</Text>
                            <TextInput
                                style={[styles.inputPro, styles.textAreaPro, { backgroundColor: theme.colors.primary }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Describe your needs in detail (minimum 100 words if provided)..."
                                placeholderTextColor="#ffffff80"
                                multiline
                            />
                            {description && (
                                <Text style={styles.wordCount}>
                                    {description.trim().split(/\s+/).filter(word => word.length > 0).length} / 100 words
                                </Text>
                            )}
                        </View>

                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>📎 Attachments</Text>
                            <View style={styles.attachmentRowPro}>
                                {photos.length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.photosContainer}>
                                            {photos.map((photo, index) => (
                                                <View key={index} style={styles.photoWrapper}>
                                                    <Image
                                                        source={{ uri: photo.uri }}
                                                        style={styles.selectedPhoto}
                                                        resizeMode="cover"
                                                    />
                                                    <TouchableOpacity
                                                        style={styles.removePhotoBtn}
                                                        onPress={() => removePhoto(index)}
                                                    >
                                                        <Icon name="close-circle" size={20} color="#ff4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </ScrollView>
                                )}
                                {photos.length < 5 && (
                                    <TouchableOpacity
                                        style={[styles.addAttachmentPro, photos.length === 0 && styles.addAttachmentFirst]}
                                        onPress={selectImage}
                                    >
                                        <Icon name="attach" size={24} color="#ffffff80" />
                                        <Text style={styles.addPhotoText}>{photos.length === 0 ? 'Add Files' : '+'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {type === 'vendor' && photos.length > 0 && (
                                <Text style={styles.photoCount}>
                                    {photos.length} / 10 photos (minimum)
                                </Text>
                            )}
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>Category</Text>
                            <TouchableOpacity
                                style={[styles.inputPro, styles.dropdownButton]}
                                onPress={() => setShowCategoryDropdown(true)}
                            >
                                <Text style={styles.dropdownText}>{category || 'Select Category'}</Text>
                                <Icon name="chevron-down" size={20} color="#ffffff80" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>Description</Text>
                            <TextInput
                                style={[styles.inputPro, styles.textAreaPro, { backgroundColor: theme.colors.primary }]}
                                value={vendorDescription}
                                onChangeText={setVendorDescription}
                                placeholder="Describe your services in detail (minimum 100 words)..."
                                placeholderTextColor="#ffffff80"
                                multiline
                            />
                            {vendorDescription && (
                                <Text style={styles.wordCount}>
                                    {vendorDescription.trim().split(/\s+/).filter(word => word.length > 0).length} / 100 words
                                </Text>
                            )}
                        </View>

                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>Tags (Optional)</Text>
                            <View style={styles.tagsInputContainer}>
                                <ScrollView
                                    horizontal={false}
                                    style={styles.tagsScrollView}
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled={true}
                                >
                                    <View style={styles.tagsContainer}>
                                        {tagOptions.map((tag) => (
                                            <TouchableOpacity
                                                key={tag}
                                                style={[
                                                    styles.tagButton,
                                                    selectedTags.includes(tag) && styles.tagButtonSelected
                                                ]}
                                                onPress={() => toggleTag(tag)}
                                            >
                                                <Text style={[
                                                    styles.tagText,
                                                    selectedTags.includes(tag) && styles.tagTextSelected
                                                ]}>
                                                    {tag}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                            {type === 'vendor' && photos.length > 0 && (
                                <Text style={styles.photoCount}>
                                    {photos.length} / 10 photos (minimum)
                                </Text>
                            )}
                        </View>
                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>Vendor Company Name</Text>
                            <TextInput
                                style={styles.inputPro}
                                value={companyName}
                                onChangeText={setCompanyName}
                                placeholder="text field..."
                                placeholderTextColor="#ffffff80"
                            />
                        </View>
                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>Location</Text>
                            <TextInput
                                style={styles.inputPro}
                                value={vendorLocation}
                                onChangeText={setVendorLocation}
                                placeholder="text field..."
                                placeholderTextColor="#ffffff80"
                            />
                        </View>

                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>Offer (Optional)</Text>
                            {offers.map((offer, index) => (
                                <View key={index} style={styles.offerRow}>
                                    <View style={styles.offerInputContainer}>
                                        <Text style={styles.offerLabel}>Amount</Text>
                                        <TextInput
                                            style={[styles.inputPro, styles.offerInput]}
                                            value={offer.amount}
                                            onChangeText={(value) => updateOffer(index, 'amount', value)}
                                            placeholder="$1000"
                                            placeholderTextColor="#ffffff80"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.offerInputContainer}>
                                        <Text style={styles.offerLabel}>Discount</Text>
                                        <TextInput
                                            style={[styles.inputPro, styles.offerInput]}
                                            value={offer.discount}
                                            onChangeText={(value) => updateOffer(index, 'discount', value)}
                                            placeholder="10%"
                                            placeholderTextColor="#ffffff80"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.offerButtons}>
                                        {index === offers.length - 1 && (
                                            <TouchableOpacity
                                                style={styles.offerButton}
                                                onPress={addOffer}
                                            >
                                                <Icon name="add-circle" size={24} color="#ffffff" />
                                            </TouchableOpacity>
                                        )}
                                        {offers.length > 1 && (
                                            <TouchableOpacity
                                                style={styles.offerButton}
                                                onPress={() => removeOffer(index)}
                                            >
                                                <Icon name="remove-circle" size={24} color="#ffffff80" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                        <View style={styles.fieldGroupPro}>
                            <Text style={styles.labelPro}>In Photos (min. 10 photos)</Text>
                            <View style={styles.attachmentRowPro}>
                                {photos.length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.photosContainer}>
                                            {photos.map((photo, index) => (
                                                <View key={index} style={styles.photoWrapper}>
                                                    <Image
                                                        source={{ uri: photo.uri }}
                                                        style={styles.selectedPhoto}
                                                        resizeMode="cover"
                                                    />
                                                    <TouchableOpacity
                                                        style={styles.removePhotoBtn}
                                                        onPress={() => removePhoto(index)}
                                                    >
                                                        <Icon name="close-circle" size={20} color="#ff4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </ScrollView>
                                )}
                                {photos.length < 20 && (
                                    <TouchableOpacity
                                        style={[styles.addAttachmentPro, photos.length === 0 && styles.addAttachmentFirst]}
                                        onPress={selectImage}
                                    >
                                        <Icon name="camera" size={24} color="#ffffff80" />
                                        <Text style={styles.addPhotoText}>{photos.length === 0 ? 'Add Photos' : '+'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {type === 'vendor' && photos.length > 0 && (
                                <Text style={styles.photoCount}>
                                    {photos.length} / 10 photos (minimum)
                                </Text>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
            <View style={styles.buttonRowFixedPro}>
                <TouchableOpacity style={[styles.buttonPro, styles.cancelButtonPro]} onPress={handleCancel}>
                    <Text style={styles.cancelTextPro}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.buttonPro, styles.postButtonPro, isLoading && styles.disabledButton]}
                    onPress={handlePost}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#2C3D5B" />
                    ) : (
                        <Text style={styles.postTextPro}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>

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
                    <View style={styles.professionalDropdown}>
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>Select Category</Text>
                            <TouchableOpacity
                                onPress={() => setShowCategoryDropdown(false)}
                                style={styles.dropdownCloseBtn}
                            >
                                <Icon name="close" size={24} color="#2C3D5B" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.dropdownSearchContainer}>
                            <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                style={styles.dropdownSearch}
                                placeholder="Search category..."
                                placeholderTextColor="#999"
                            />
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
                                        <View style={styles.dropdownItemLeft}>
                                            <View style={styles.dropdownItemIcon}>
                                                <Icon name="briefcase" size={18} color={category === item ? '#2C3D5B' : '#666'} />
                                            </View>
                                            <Text style={[styles.dropdownItemText, category === item && styles.dropdownItemTextSelected]}>
                                                {item}
                                            </Text>
                                        </View>
                                        {category === item && (
                                            <Icon name="checkmark-circle" size={22} color="#2C3D5B" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Service Dropdown Modal for Events */}
            <Modal
                visible={showServiceDropdown}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowServiceDropdown(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowServiceDropdown(false)}
                    />
                    <View style={styles.professionalDropdown}>
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>Select Service</Text>
                            <TouchableOpacity
                                onPress={() => setShowServiceDropdown(false)}
                                style={styles.dropdownCloseBtn}
                            >
                                <Icon name="close" size={24} color="#2C3D5B" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.dropdownSearchContainer}>
                            <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                style={styles.dropdownSearch}
                                placeholder="Search service..."
                                placeholderTextColor="#999"
                            />
                        </View>
                        <FlatList
                            data={serviceOptions}
                            keyExtractor={(item) => item}
                            style={styles.dropdownList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setService(item);
                                        setShowServiceDropdown(false);
                                    }}
                                >
                                    <View style={styles.dropdownItemContent}>
                                        <View style={styles.dropdownItemLeft}>
                                            <View style={styles.dropdownItemIcon}>
                                                <Icon name="construct" size={18} color={service === item ? '#2C3D5B' : '#666'} />
                                            </View>
                                            <Text style={[styles.dropdownItemText, service === item && styles.dropdownItemTextSelected]}>
                                                {item}
                                            </Text>
                                        </View>
                                        {service === item && (
                                            <Icon name="checkmark-circle" size={22} color="#2C3D5B" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Event Type Dropdown Modal */}
            <Modal
                visible={showEventTypeDropdown}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowEventTypeDropdown(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowEventTypeDropdown(false)}
                    />
                    <View style={styles.professionalDropdown}>
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>Select Event Type</Text>
                            <TouchableOpacity
                                onPress={() => setShowEventTypeDropdown(false)}
                                style={styles.dropdownCloseBtn}
                            >
                                <Icon name="close" size={24} color="#2C3D5B" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.dropdownSearchContainer}>
                            <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                style={styles.dropdownSearch}
                                placeholder="Search event type..."
                                placeholderTextColor="#999"
                            />
                        </View>
                        <FlatList
                            data={eventTypeOptions}
                            keyExtractor={(item) => item}
                            style={styles.dropdownList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setEventType(item);
                                        setShowEventTypeDropdown(false);
                                    }}
                                >
                                    <View style={styles.dropdownItemContent}>
                                        <View style={styles.dropdownItemLeft}>
                                            <View style={styles.dropdownItemIcon}>
                                                <Icon name="calendar" size={18} color={eventType === item ? '#2C3D5B' : '#666'} />
                                            </View>
                                            <Text style={[styles.dropdownItemText, eventType === item && styles.dropdownItemTextSelected]}>
                                                {item}
                                            </Text>
                                        </View>
                                        {eventType === item && (
                                            <Icon name="checkmark-circle" size={22} color="#2C3D5B" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
            
            {/* Custom Success Modal */}
            <CustomSuccessModal
                visible={modalState.visible}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                onConfirm={() => {
                    setModalState({ visible: false, title: '', message: '', type: 'success' });
                    if (modalState.type === 'success' && onClose) {
                        setTimeout(() => {
                            onClose();
                        }, 100);
                    }
                }}
            />
            
            {/* Custom Toast for Errors */}
            <CustomToast
                visible={toastState.visible}
                message={toastState.message}
                type={toastState.type}
                onHide={() => setToastState({ ...toastState, visible: false })}
            />
        </KeyboardAvoidingView>
    );
};

export default CreateAddForm;

const styles = StyleSheet.create({
    modalBorderWrapPro: {
        flex: 1,
        backgroundColor: 'transparent',
        position: 'relative',
    },
    headerPro: {
        backgroundColor: 'transparent',
        width: '100%',
        paddingTop: 5,
        paddingBottom: 10,
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
    scrollViewPro: {
        flex: 1,
        marginBottom: 90,
    },
    containerPro: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 20,
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
        flexDirection: 'column',
        gap: 4,
    },
    addAttachmentFirst: {
        width: 120,
        paddingHorizontal: 16,
    },
    plusPro: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '300',
    },
    addPhotoText: {
        color: '#ffffff80',
        fontSize: 12,
        fontWeight: '500',
    },
    buttonRowFixedPro: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#ffffff20',
        backgroundColor: '#2C3D5B',
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
    disabledButton: {
        opacity: 0.6,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        color: '#ffffff',
        fontSize: 15,
    },
    tagsInputContainer: {
        backgroundColor: '#41547A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffffff30',
        height: 100,
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    tagsScrollView: {
        flex: 1,
        padding: 10,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    tagButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: '#2C3D5B',
        borderWidth: 1,
        borderColor: '#ffffff20',
        marginBottom: 4,
    },
    tagButtonSelected: {
        backgroundColor: '#ffffff',
        borderColor: '#ffffff',
    },
    tagText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '500',
    },
    tagTextSelected: {
        color: '#2C3D5B',
        fontWeight: '600',
    },
    offerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
        gap: 8,
    },
    offerInputContainer: {
        flex: 1,
    },
    offerLabel: {
        color: '#ffffff',
        fontSize: 13,
        marginBottom: 4,
        fontWeight: '500',
    },
    offerInput: {
        marginBottom: 0,
    },
    offerButtons: {
        flexDirection: 'row',
        gap: 4,
        paddingBottom: 2,
    },
    offerButton: {
        padding: 4,
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
        backgroundColor: 'transparent',
    },
    professionalDropdown: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -5 },
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3D5B',
    },
    dropdownCloseBtn: {
        padding: 4,
    },
    dropdownSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        margin: 16,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    dropdownSearch: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
    },
    dropdownList: {
        paddingBottom: 20,
    },
    dropdownModal: {
        backgroundColor: '#2C3D5B',
        borderRadius: 12,
        width: '80%',
        maxHeight: 300,
        borderWidth: 1,
        borderColor: '#ffffff30',
    },
    dropdownItem: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dropdownItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dropdownItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    dropdownItemTextSelected: {
        color: '#2C3D5B',
        fontWeight: '700',
    },
    wordCount: {
        color: '#ffffff80',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
        fontStyle: 'italic',
    },
    photosContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingRight: 8,
    },
    photoWrapper: {
        position: 'relative',
    },
    selectedPhoto: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffffff30',
        overflow: 'hidden', // Clip image to borderRadius
    },
    removePhotoBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#2C3D5B',
        borderRadius: 10,
    },
    photoCount: {
        color: '#ffffff80',
        fontSize: 12,
        marginTop: 8,
        textAlign: 'right',
        fontStyle: 'italic',
    },
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        color: '#ffffff',
        fontSize: 15,
    },
    placeholderText: {
        color: '#ffffff80',
        fontSize: 15,
    },
});
