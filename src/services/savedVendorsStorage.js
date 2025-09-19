import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_VENDORS_KEY = '@saved_vendors';
const SAVED_VENDORS_CACHE_KEY = '@saved_vendors_cache';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

class SavedVendorsStorage {
    constructor() {
        this.cachedData = null;
        this.cacheTimestamp = null;
    }

    // Initialize and load saved vendors from storage
    async initialize() {
        try {
            const savedVendors = await this.getSavedVendors();
            this.cachedData = savedVendors;
            this.cacheTimestamp = Date.now();
            return savedVendors;
        } catch (error) {
            console.error('Error initializing saved vendors storage:', error);
            return [];
        }
    }

    // Get all saved vendor IDs
    async getSavedVendors() {
        try {
            // Check cache first
            if (this.cachedData && this.cacheTimestamp && 
                (Date.now() - this.cacheTimestamp) < CACHE_EXPIRY_TIME) {
                return this.cachedData;
            }

            const jsonValue = await AsyncStorage.getItem(SAVED_VENDORS_KEY);
            const savedVendors = jsonValue != null ? JSON.parse(jsonValue) : [];
            
            // Update cache
            this.cachedData = savedVendors;
            this.cacheTimestamp = Date.now();
            
            return savedVendors;
        } catch (error) {
            console.error('Error getting saved vendors:', error);
            return [];
        }
    }

    // Check if a vendor is saved
    async isVendorSaved(vendorId) {
        try {
            const vendorIdNum = parseInt(vendorId, 10);
            if (isNaN(vendorIdNum)) {
                return false;
            }
            
            const savedVendors = await this.getSavedVendors();
            return savedVendors.some(saved => saved.vendorId === vendorIdNum);
        } catch (error) {
            console.error('Error checking if vendor is saved:', error);
            return false;
        }
    }

    // Save a vendor
    async saveVendor(vendorId, vendorData = {}) {
        try {
            const vendorIdNum = parseInt(vendorId, 10);
            if (isNaN(vendorIdNum)) {
                throw new Error('Invalid vendor ID');
            }

            const savedVendors = await this.getSavedVendors();
            
            // Check if already saved
            const existingIndex = savedVendors.findIndex(saved => saved.vendorId === vendorIdNum);
            if (existingIndex !== -1) {
                // Update existing saved vendor data
                savedVendors[existingIndex] = {
                    ...savedVendors[existingIndex],
                    ...vendorData,
                    vendorId: vendorIdNum,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Add new saved vendor
                savedVendors.push({
                    vendorId: vendorIdNum,
                    savedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    ...vendorData
                });
            }

            await AsyncStorage.setItem(SAVED_VENDORS_KEY, JSON.stringify(savedVendors));
            
            // Update cache
            this.cachedData = savedVendors;
            this.cacheTimestamp = Date.now();
            
            return true;
        } catch (error) {
            console.error('Error saving vendor:', error);
            throw error;
        }
    }

    // Unsave a vendor
    async unsaveVendor(vendorId) {
        try {
            const vendorIdNum = parseInt(vendorId, 10);
            if (isNaN(vendorIdNum)) {
                throw new Error('Invalid vendor ID');
            }

            const savedVendors = await this.getSavedVendors();
            const filteredVendors = savedVendors.filter(saved => saved.vendorId !== vendorIdNum);
            
            await AsyncStorage.setItem(SAVED_VENDORS_KEY, JSON.stringify(filteredVendors));
            
            // Update cache
            this.cachedData = filteredVendors;
            this.cacheTimestamp = Date.now();
            
            return true;
        } catch (error) {
            console.error('Error unsaving vendor:', error);
            throw error;
        }
    }

    // Toggle save status
    async toggleSaveVendor(vendorId, vendorData = {}) {
        try {
            const isSaved = await this.isVendorSaved(vendorId);
            
            if (isSaved) {
                await this.unsaveVendor(vendorId);
                return { saved: false };
            } else {
                await this.saveVendor(vendorId, vendorData);
                return { saved: true };
            }
        } catch (error) {
            console.error('Error toggling vendor save status:', error);
            throw error;
        }
    }

    // Get all saved vendors with full data
    async getSavedVendorsWithData() {
        try {
            const savedVendors = await this.getSavedVendors();
            return savedVendors;
        } catch (error) {
            console.error('Error getting saved vendors with data:', error);
            return [];
        }
    }

    // Clear all saved vendors (for debugging/logout)
    async clearAllSavedVendors() {
        try {
            await AsyncStorage.removeItem(SAVED_VENDORS_KEY);
            this.cachedData = [];
            this.cacheTimestamp = Date.now();
            return true;
        } catch (error) {
            console.error('Error clearing saved vendors:', error);
            return false;
        }
    }

    // Sync with backend saved vendors
    async syncWithBackend(backendSavedVendors) {
        try {
            if (!Array.isArray(backendSavedVendors)) {
                return false;
            }

            const formattedVendors = backendSavedVendors.map(vendor => ({
                vendorId: parseInt(vendor.item_id || vendor.itemId || vendor.id, 10),
                savedAt: vendor.saved_at || vendor.savedAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                name: vendor.name,
                type: vendor.type,
                location: vendor.location,
                rating: vendor.rating,
                image: vendor.image || vendor.images?.[0]
            })).filter(vendor => !isNaN(vendor.vendorId));

            await AsyncStorage.setItem(SAVED_VENDORS_KEY, JSON.stringify(formattedVendors));
            
            // Update cache
            this.cachedData = formattedVendors;
            this.cacheTimestamp = Date.now();
            
            return true;
        } catch (error) {
            console.error('Error syncing with backend:', error);
            return false;
        }
    }

    // Get saved vendors count
    async getSavedVendorsCount() {
        try {
            const savedVendors = await this.getSavedVendors();
            return savedVendors.length;
        } catch (error) {
            console.error('Error getting saved vendors count:', error);
            return 0;
        }
    }

    // Search saved vendors
    async searchSavedVendors(query) {
        try {
            const savedVendors = await this.getSavedVendors();
            const lowercaseQuery = query.toLowerCase();
            
            return savedVendors.filter(vendor => {
                return (
                    vendor.name?.toLowerCase().includes(lowercaseQuery) ||
                    vendor.type?.toLowerCase().includes(lowercaseQuery) ||
                    vendor.location?.toLowerCase().includes(lowercaseQuery)
                );
            });
        } catch (error) {
            console.error('Error searching saved vendors:', error);
            return [];
        }
    }

    // Get recently saved vendors
    async getRecentlySavedVendors(limit = 5) {
        try {
            const savedVendors = await this.getSavedVendors();
            
            // Sort by savedAt date (newest first)
            const sorted = savedVendors.sort((a, b) => {
                const dateA = new Date(a.savedAt || 0);
                const dateB = new Date(b.savedAt || 0);
                return dateB - dateA;
            });
            
            return sorted.slice(0, limit);
        } catch (error) {
            console.error('Error getting recently saved vendors:', error);
            return [];
        }
    }

    // Batch save vendors
    async batchSaveVendors(vendorDataArray) {
        try {
            const savedVendors = await this.getSavedVendors();
            const existingIds = new Set(savedVendors.map(v => v.vendorId));
            
            const newVendors = vendorDataArray
                .filter(vendor => {
                    const vendorId = parseInt(vendor.vendorId || vendor.id, 10);
                    return !isNaN(vendorId) && !existingIds.has(vendorId);
                })
                .map(vendor => ({
                    ...vendor,
                    vendorId: parseInt(vendor.vendorId || vendor.id, 10),
                    savedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));
            
            const updatedSavedVendors = [...savedVendors, ...newVendors];
            
            await AsyncStorage.setItem(SAVED_VENDORS_KEY, JSON.stringify(updatedSavedVendors));
            
            // Update cache
            this.cachedData = updatedSavedVendors;
            this.cacheTimestamp = Date.now();
            
            return true;
        } catch (error) {
            console.error('Error batch saving vendors:', error);
            return false;
        }
    }
}

// Create singleton instance
const savedVendorsStorage = new SavedVendorsStorage();

// Initialize on app startup
savedVendorsStorage.initialize();

export default savedVendorsStorage;