import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';

export default function CategorySelectionModal({ visible, onClose, onCategorySelect, currentCategory, screenType = 'vendors' }) {
    const theme = useTheme();

    // Support both single and multi-select legacy
    const initialSelected = Array.isArray(currentCategory)
        ? currentCategory
        : currentCategory
            ? [currentCategory]
            : [];
    const [selectedCategories, setSelectedCategories] = useState(initialSelected);

    useEffect(() => {
        // Reset selection when modal opens
        if (visible) {
            setSelectedCategories(Array.isArray(currentCategory) ? currentCategory : currentCategory ? [currentCategory] : []);
        }
    }, [visible, currentCategory]);

    const categories = [
        'Photography',
        'Videography',
        'Event Decoration',
        'DJ / Music',
        'Catering',
        'Makeup Artist',
        'Event Planning',
        'Florist',
        'Wedding Dress',
        'Venue Rental',
        'Transportation',
        'Security Services',
        'Audio Visual',
        'Lighting',
        'Entertainment',
        'Photo Booth',
        'Live Band',
        'MC / Host',
        'Wedding Cakes',
        'Bartending',
        'Hair Styling',
        'Jewelry Rental',
        'Invitation Design',
        'Gift & Favors'
    ];

    const handleCategoryToggle = (category) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const handleRemoveCategory = (category) => {
        setSelectedCategories((prev) => prev.filter((c) => c !== category));
    };

    const handleSave = () => {
        onCategorySelect(selectedCategories.length > 0 ? selectedCategories : null);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const clearCategory = () => {
        setSelectedCategories([]);
    };

    const renderCategoryItem = ({ item }) => {
        const isSelected = selectedCategories.includes(item);
        return (
            <TouchableOpacity
                style={[
                    styles.categoryButton,
                    { borderColor: theme.colors.primary + (isSelected ? '' : '33') },
                    isSelected && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => handleCategoryToggle(item)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[
                        styles.categoryText,
                        { color: isSelected ? '#fff' : theme.colors.primary }
                    ]}>
                        {item}
                    </Text>
                    {isSelected && (
                        <TouchableOpacity
                            onPress={() => handleRemoveCategory(item)}
                            style={{ marginLeft: 4 }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Icon name="close-circle" size={16} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, styles.safeAreaPad]}>
                <View style={styles.header}>
                    <Text style={styles.titleHeader}>{'Select Category'}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon name="close" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                {selectedCategories.length > 0 && (
                    <TouchableOpacity style={[styles.clearFilter, { borderColor: theme.colors.primary + '33', backgroundColor: theme.colors.primary + '10' }]} onPress={clearCategory}>
                        <Text style={[styles.clearFilterText, { color: theme.colors.primary }]}>Clear Category Filter</Text>
                    </TouchableOpacity>
                )}

                <FlatList
                    data={categories}
                    renderItem={renderCategoryItem}
                    numColumns={3}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.categoriesContainer}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={styles.row}
                />

                {/* Bottom Buttons */}
                <View style={styles.bottomButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.bottomButton, styles.cancelButton]}
                        onPress={handleCancel}
                    >
                        <Text style={[styles.bottomButtonText, styles.cancelButtonText]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.bottomButton, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleSave}
                    >
                        <Text style={styles.bottomButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeAreaPad: {
        paddingTop: 18,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#E7F0FF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#dbeafe',
        paddingVertical: 14,
        paddingHorizontal: 16,
        justifyContent: 'center',
        position: 'relative',
    },
    titleHeader: {
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
    },
    closeIconBtn: {
        position: 'absolute',
        right: 16,
        top: 14,
        padding: 4,
        borderRadius: 16,
        zIndex: 2,
    },
    placeholder: {
        width: 40,
    },
    clearFilter: {
        marginHorizontal: 16,
        marginVertical: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearFilterText: {
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 13,
    },
    categoriesContainer: {
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 8,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    categoryButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 10,
        marginHorizontal: 2,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60,
        borderWidth: 1,
        backgroundColor: '#E7F0FF',
        marginBottom: 6,
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 1,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 15,
    },
    bottomButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 18,
        paddingTop: 8,
        backgroundColor: '#fff',
        gap: 14,
    },
    bottomButton: {
        flex: 1,
        borderRadius: 24,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#2C3D5B',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        marginHorizontal: 4,
    },
    saveButton: {}, // backgroundColor applied inline
    cancelButton: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    bottomButtonText: {
        fontWeight: '700',
        fontSize: 15,
        color: '#fff',
    },
    cancelButtonText: {
        color: '#222',
    },
});

