import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import categoryService from '../../services/categoryService';

export default function CategorySelectionModal({ visible, onClose, onCategorySelect, currentCategory, screenType = 'vendors' }) {
    const theme = useTheme();

    // Support both single and multi-select legacy
    const initialSelected = Array.isArray(currentCategory)
        ? currentCategory
        : currentCategory
            ? [currentCategory]
            : [];
    const [selectedCategories, setSelectedCategories] = useState(initialSelected);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch categories when modal becomes visible
    useEffect(() => {
        if (visible) {
            fetchCategories();
            // Initialize selectedCategories - ensure we use proper format
            const initial = Array.isArray(currentCategory) ? currentCategory : currentCategory ? [currentCategory] : [];
            setSelectedCategories(initial);
        }
    }, [visible, currentCategory, screenType]);

    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            let response;
            if (screenType === 'vendors') {
                response = await categoryService.getVendorCategories();
            } else {
                response = await categoryService.getEventCategories();
            }
            
            if (response.success && response.data) {
                console.log('📦 Raw category response:', {
                    data: response.data,
                    firstItem: response.data[0],
                    screenType
                });
                
                try {
                    const formattedCategories = categoryService.formatCategoriesForUI(response.data, screenType);
                    console.log('🎨 Formatted categories:', {
                        count: formattedCategories.length,
                        first: formattedCategories[0],
                        sample: formattedCategories.slice(0, 3)
                    });
                    
                    // Find and log Catering category specifically
                    const cateringCategory = formattedCategories.find(cat => 
                        cat.name && cat.name.toLowerCase().includes('catering')
                    );
                    console.log('🍽️ Catering category:', cateringCategory);
                    
                    if (formattedCategories && formattedCategories.length > 0) {
                        setCategories(formattedCategories);
                    } else {
                        // Use fallback categories if formatting returns empty
                        console.log('No categories after formatting, using fallback');
                        const fallbackData = screenType === 'vendors' ? 
                            categoryService.getFallbackVendorCategories().data : 
                            categoryService.getFallbackEventCategories().data;
                        const formattedFallback = categoryService.formatCategoriesForUI(fallbackData, screenType);
                        setCategories(formattedFallback);
                    }
                } catch (formatError) {
                    console.error('Error formatting categories:', formatError);
                    // Use fallback categories on formatting error
                    const fallbackData = screenType === 'vendors' ? 
                        categoryService.getFallbackVendorCategories().data : 
                        categoryService.getFallbackEventCategories().data;
                    const formattedFallback = categoryService.formatCategoriesForUI(fallbackData, screenType);
                    setCategories(formattedFallback);
                }
            } else {
                setError('Failed to load categories');
                setCategories([]);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories');
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategoryToggle = (category) => {
        // For vendors, use category ID, for events use name
        const categoryValue = screenType === 'vendors' ? 
            (category.value || category.id || category.category_id || category.name || category) :
            (category.name || category);
        
        console.log('🔄 Category toggled:', {
            category,
            extractedValue: categoryValue,
            screenType,
            categoryId: category.id,
            categoryValue: category.value,
            categoryName: category.name
        });
            
        setSelectedCategories((prev) => {
            const newCategories = prev.includes(categoryValue)
                ? prev.filter((c) => c !== categoryValue)
                : [...prev, categoryValue];
            
            console.log('📋 Selected categories updated:', {
                previous: prev,
                new: newCategories
            });
            
            return newCategories;
        });
    };

    const handleRemoveCategory = (category) => {
        // For vendors, use category ID, for events use name
        const categoryValue = screenType === 'vendors' ? 
            (category.value || category.id || category.category_id || category.name || category) :
            (category.name || category);
        setSelectedCategories((prev) => prev.filter((c) => c !== categoryValue));
    };

    const handleSave = () => {
        // Pass both selected IDs and the full category data for display
        const selectedCategoryData = categories.filter(cat => {
            const catValue = screenType === 'vendors' ? 
                (cat.value || cat.id || cat.category_id) :
                cat.name;
            return selectedCategories.includes(catValue);
        });
        
        console.log('🎯 Category Save Debug:', {
            screenType,
            selectedCategories,
            selectedCategoryData,
            categoriesAvailable: categories.length,
            firstCategory: categories[0]
        });
        
        if (screenType === 'vendors') {
            // For vendors, pass IDs and category data separately
            console.log('📤 Passing to vendor screen:', {
                ids: selectedCategories,
                data: selectedCategoryData
            });
            onCategorySelect(selectedCategories.length > 0 ? selectedCategories : null, selectedCategoryData);
        } else {
            // For events, just pass the selected categories
            onCategorySelect(selectedCategories.length > 0 ? selectedCategories : null);
        }
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const clearCategory = () => {
        setSelectedCategories([]);
    };

    const renderCategoryItem = ({ item }) => {
        const categoryName = item.name || item;
        const categoryValue = screenType === 'vendors' ? 
            (item.value || item.id || item.category_id || item.name || item) :
            (item.name || item);
        const isSelected = selectedCategories.includes(categoryValue);
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
                        {categoryName}
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

                {selectedCategories.length > 0 && !isLoading && (
                    <TouchableOpacity style={[styles.clearFilter, { borderColor: theme.colors.primary + '33', backgroundColor: theme.colors.primary + '10' }]} onPress={clearCategory}>
                        <Text style={[styles.clearFilterText, { color: theme.colors.primary }]}>Clear Category Filter</Text>
                    </TouchableOpacity>
                )}

                {/* Loading State */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
                            Loading {screenType === 'vendors' ? 'vendor' : 'event'} categories...
                        </Text>
                    </View>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <View style={styles.errorContainer}>
                        <Icon name="alert-circle-outline" size={32} color="#e74c3c" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity 
                            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                            onPress={fetchCategories}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Categories List */}
                {!isLoading && !error && categories.length > 0 && (
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryItem}
                        numColumns={3}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        contentContainerStyle={styles.categoriesContainer}
                        showsVerticalScrollIndicator={false}
                        columnWrapperStyle={styles.row}
                    />
                )}

                {/* No Categories State */}
                {!isLoading && !error && categories.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Icon name="list-outline" size={32} color="#999" />
                        <Text style={styles.emptyText}>No categories available</Text>
                    </View>
                )}

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#e74c3c',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 12,
    },
});

