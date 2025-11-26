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
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import categoryService from '../../services/categoryService';

export default function CategorySelectionModalEnhanced({
    visible,
    onClose,
    onCategorySelect,
    currentCategory,
    screenType = 'vendors',
    filteredCategories = null, // Optional: if provided, use these instead of fetching
    showOnlySubcategories = false // Optional: if true, treat filteredCategories as subcategories to show directly
}) {
    const theme = useTheme();

    // Two-step selection: category -> subcategory
    const [selectionStep, setSelectionStep] = useState('category'); // 'category' or 'subcategory'
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch categories when modal becomes visible or use provided filteredCategories
    useEffect(() => {
        if (visible) {
            if (filteredCategories && showOnlySubcategories) {
                // Use filtered categories as subcategories directly
                console.log('📋 Using filtered subcategories:', filteredCategories.length);
                setCategories(filteredCategories);
                setSelectionStep('subcategory');
                setSelectedCategory({ name: 'Event Types' }); // Dummy parent for display
                setIsLoading(false);
                setError(null);
            } else if (filteredCategories) {
                // Use filtered categories normally
                console.log('📋 Using filtered categories:', filteredCategories.length);
                setCategories(filteredCategories);
                setSelectionStep('category');
                setSelectedCategory(null);
                setIsLoading(false);
                setError(null);
            } else {
                // Fetch categories from service
                fetchCategories();
            }
            // Reset selected subcategories when modal opens
            setSelectedSubcategories([]);
        }
    }, [visible, screenType, filteredCategories, showOnlySubcategories]);

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
                console.log('📦 Category response with subcategories:', {
                    count: response.data.length,
                    firstCategory: response.data[0],
                    hasSubcategories: response.data[0]?.subcategories?.length > 0,
                    allCategories: response.data.map(cat => ({
                        id: cat.category_id,
                        name: cat.name,
                        subCount: cat.subcategories?.length || 0
                    }))
                });

                setCategories(response.data);
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

    const handleCategoryClick = (category) => {
        console.log('📁 Category clicked:', {
            category,
            hasSubcategories: category.subcategories && category.subcategories.length > 0,
            subcategoriesCount: category.subcategories?.length || 0,
            subcategoriesArray: category.subcategories
        });

        // Debug: Check what's in the categories state
        console.log('🔍 All categories in state:', categories.map(cat => ({
            id: cat.category_id,
            name: cat.name,
            hasSubcategories: cat.subcategories && cat.subcategories.length > 0,
            subcategoriesCount: cat.subcategories?.length || 0
        })));

        // Always set the selected category and show subcategories (if any)
        setSelectedCategory(category);

        // Check if category has subcategories
        if (category.subcategories && category.subcategories.length > 0) {
            setSelectionStep('subcategory');
        } else {
            // No subcategories, but still go to subcategory view to show Done/Cancel buttons
            setSelectionStep('subcategory');
        }
    };

    const handleSubcategoryToggle = (subcategory) => {
        const subId = subcategory.category_id;

        setSelectedSubcategories((prev) => {
            const isSelected = prev.find(s => s.category_id === subId);
            if (isSelected) {
                return prev.filter((s) => s.category_id !== subId);
            } else {
                return [...prev, subcategory];
            }
        });
    };

    const handleBackToCategories = () => {
        setSelectionStep('category');
        setSelectedCategory(null);
        setSelectedSubcategories([]);
    };

    const handleSaveSubcategories = () => {
        if (selectedSubcategories.length === 0) {
            // No subcategories selected, just select the parent category
            onCategorySelect([selectedCategory.category_id], [selectedCategory]);
        } else {
            // Pass selected subcategory IDs
            const subcategoryIds = selectedSubcategories.map(sub => sub.category_id);
            onCategorySelect(subcategoryIds, selectedSubcategories);
        }
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const renderCategoryItem = ({ item }) => {
        const categoryName = item.name || item;

        return (
            <TouchableOpacity
                style={[
                    styles.categoryButton,
                    { borderColor: theme.colors.primary + '33' }
                ]}
                onPress={() => handleCategoryClick(item)}
            >
                <Text style={[
                    styles.categoryText,
                    { color: theme.colors.primary }
                ]}>
                    {categoryName}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderSubcategoryItem = ({ item }) => {
        const isSelected = selectedSubcategories.find(s => s.category_id === item.category_id);

        return (
            <TouchableOpacity
                style={[
                    styles.subcategoryButton,
                    { borderColor: theme.colors.primary + (isSelected ? '' : '33') },
                    isSelected && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => handleSubcategoryToggle(item)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[
                        styles.subcategoryText,
                        { color: isSelected ? '#fff' : theme.colors.primary }
                    ]}>
                        {item.name}
                    </Text>
                    {isSelected && (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                handleSubcategoryToggle(item);
                            }}
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
                {/* Header */}
                <View style={styles.header}>
                    {selectionStep === 'subcategory' && !showOnlySubcategories && (
                        <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
                            <Icon name="arrow-back" size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.titleHeader}>
                        {selectionStep === 'category' ? 'Select Category' : selectedCategory?.name}
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon name="close" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                {selectionStep === 'subcategory' && selectedSubcategories.length > 0 && !isLoading && (
                    <View style={[styles.selectedInfo, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '33' }]}>
                        <Text style={[styles.selectedInfoText, { color: theme.colors.primary }]}>
                            {selectedSubcategories.length} subcategory selected
                        </Text>
                    </View>
                )}

                {/* Loading State */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
                            Loading categories...
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
                {!isLoading && !error && selectionStep === 'category' && categories.length > 0 && (
                    <FlatList
                        key="categories-list-2col"
                        data={categories}
                        renderItem={renderCategoryItem}
                        numColumns={2}
                        keyExtractor={(item, index) => item.category_id?.toString() || index.toString()}
                        contentContainerStyle={styles.categoriesContainer}
                        showsVerticalScrollIndicator={false}
                        columnWrapperStyle={styles.row}
                    />
                )}

                {/* Subcategories List */}
                {!isLoading && !error && selectionStep === 'subcategory' && selectedCategory && (
                    <>
                        {showOnlySubcategories && categories.length > 0 ? (
                            // When showing filtered subcategories directly
                            <FlatList
                                key="filtered-subcategories-list-2col"
                                data={categories}
                                renderItem={renderSubcategoryItem}
                                numColumns={2}
                                keyExtractor={(item, index) => item.category_id?.toString() || index.toString()}
                                contentContainerStyle={styles.categoriesContainer}
                                showsVerticalScrollIndicator={false}
                                columnWrapperStyle={styles.row}
                            />
                        ) : selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
                            // Normal subcategory display
                            <FlatList
                                key="subcategories-list-2col"
                                data={selectedCategory.subcategories || []}
                                renderItem={renderSubcategoryItem}
                                numColumns={2}
                                keyExtractor={(item, index) => item.category_id?.toString() || index.toString()}
                                contentContainerStyle={styles.categoriesContainer}
                                showsVerticalScrollIndicator={false}
                                columnWrapperStyle={styles.row}
                            />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Icon name="albums-outline" size={32} color="#999" />
                                <Text style={styles.emptyText}>No subcategories available</Text>
                                <Text style={styles.emptySubtext}>Click Done to filter by "{selectedCategory.name}"</Text>
                            </View>
                        )}
                    </>
                )}

                {/* No Categories State */}
                {!isLoading && !error && selectionStep === 'category' && categories.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Icon name="list-outline" size={32} color="#999" />
                        <Text style={styles.emptyText}>No categories available</Text>
                    </View>
                )}

                {/* Bottom Buttons */}
                {selectionStep === 'category' && (
                    <View style={styles.bottomButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.bottomButton, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <Text style={[styles.bottomButtonText, styles.cancelButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {selectionStep === 'subcategory' && (
                    <View style={styles.bottomButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.bottomButton, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <Text style={[styles.bottomButtonText, styles.cancelButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.bottomButton, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                            onPress={handleSaveSubcategories}
                        >
                            <Text style={styles.bottomButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        alignItems: 'center',
        position: 'relative',
        flexDirection: 'row',
    },
    titleHeader: {
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 14,
        padding: 4,
        borderRadius: 16,
        zIndex: 2,
    },
    closeIconBtn: {
        position: 'absolute',
        right: 16,
        top: 14,
        padding: 4,
        borderRadius: 16,
        zIndex: 2,
    },
    selectedInfo: {
        marginHorizontal: 16,
        marginVertical: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedInfoText: {
        fontWeight: '600',
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
    subcategoryButton: {
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
    subcategoryText: {
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
    saveButton: {},
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
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
    },
});
