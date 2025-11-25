import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_EVENTS_KEY = '@saved_events';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

class SavedEventsStorage {
    constructor() {
        this.cachedData = null;
        this.cacheTimestamp = null;
    }

    // Initialize and load saved events from storage
    async initialize() {
        try {
            const savedEvents = await this.getSavedEvents();
            this.cachedData = savedEvents;
            this.cacheTimestamp = Date.now();
            return savedEvents;
        } catch (error) {
            console.error('Error initializing saved events storage:', error);
            return [];
        }
    }

    // Get all saved event IDs
    async getSavedEvents() {
        try {
            // Check cache first
            if (this.cachedData && this.cacheTimestamp &&
                (Date.now() - this.cacheTimestamp) < CACHE_EXPIRY_TIME) {
                return this.cachedData;
            }

            const jsonValue = await AsyncStorage.getItem(SAVED_EVENTS_KEY);
            const savedEvents = jsonValue != null ? JSON.parse(jsonValue) : [];

            // Update cache
            this.cachedData = savedEvents;
            this.cacheTimestamp = Date.now();

            return savedEvents;
        } catch (error) {
            console.error('Error getting saved events:', error);
            return [];
        }
    }

    // Check if an event is saved
    async isEventSaved(eventId) {
        try {
            const eventIdNum = parseInt(eventId, 10);
            if (isNaN(eventIdNum)) {
                return false;
            }

            const savedEvents = await this.getSavedEvents();
            const isSaved = savedEvents.some(saved => saved.eventId === eventIdNum);
            console.log(`📱 Local storage check for event ${eventIdNum}: ${isSaved}`);
            return isSaved;
        } catch (error) {
            console.error('Error checking if event is saved:', error);
            return false;
        }
    }

    // Save an event
    async saveEvent(eventId, eventData = {}) {
        try {
            const eventIdNum = parseInt(eventId, 10);
            if (isNaN(eventIdNum)) {
                throw new Error('Invalid event ID');
            }

            const savedEvents = await this.getSavedEvents();

            // Check if already saved
            const existingIndex = savedEvents.findIndex(saved => saved.eventId === eventIdNum);
            if (existingIndex !== -1) {
                // Update existing saved event data
                savedEvents[existingIndex] = {
                    ...savedEvents[existingIndex],
                    ...eventData,
                    eventId: eventIdNum,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Add new saved event
                savedEvents.push({
                    eventId: eventIdNum,
                    savedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    ...eventData
                });
            }

            await AsyncStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(savedEvents));

            // Update cache
            this.cachedData = savedEvents;
            this.cacheTimestamp = Date.now();

            console.log(`💾 Saved event ${eventIdNum} to local storage`);
            return true;
        } catch (error) {
            console.error('Error saving event:', error);
            throw error;
        }
    }

    // Unsave an event
    async unsaveEvent(eventId) {
        try {
            const eventIdNum = parseInt(eventId, 10);
            if (isNaN(eventIdNum)) {
                throw new Error('Invalid event ID');
            }

            const savedEvents = await this.getSavedEvents();
            const filteredEvents = savedEvents.filter(saved => saved.eventId !== eventIdNum);

            await AsyncStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(filteredEvents));

            // Update cache
            this.cachedData = filteredEvents;
            this.cacheTimestamp = Date.now();

            console.log(`🗑️ Removed event ${eventIdNum} from local storage`);
            return true;
        } catch (error) {
            console.error('Error unsaving event:', error);
            throw error;
        }
    }

    // Clear all saved events
    async clearAllSavedEvents() {
        try {
            await AsyncStorage.removeItem(SAVED_EVENTS_KEY);
            this.cachedData = [];
            this.cacheTimestamp = Date.now();
            return true;
        } catch (error) {
            console.error('Error clearing saved events:', error);
            return false;
        }
    }
}

// Create singleton instance
const savedEventsStorage = new SavedEventsStorage();

// Initialize on app startup
savedEventsStorage.initialize();

export default savedEventsStorage;
