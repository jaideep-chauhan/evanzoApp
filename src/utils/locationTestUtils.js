/**
 * Test script to verify location search functionality
 * Run this in your app to test all features
 */

import { searchLocations, getCurrentLocation, reverseGeocode } from '../utils/locationService';

export const testLocationFeatures = async () => {
    console.log('🧪 Testing Location Search Features...\n');

    // Test 1: API Search
    console.log('1️⃣ Testing API Search...');
    try {
        const searchResults = await searchLocations('Toronto');
        console.log('✅ Search Results:', searchResults.length, 'locations found');
        console.log('📍 First result:', searchResults[0]?.formatted);
    } catch (error) {
        console.log('❌ Search failed:', error.message);
    }

    // Test 2: Current Location (if available)
    console.log('\n2️⃣ Testing Current Location...');
    try {
        const coords = await getCurrentLocation();
        console.log('✅ Current coordinates:', coords);

        // Test reverse geocoding
        const locationName = await reverseGeocode(coords.lat, coords.lon);
        console.log('✅ Reverse geocoded:', locationName);
    } catch (error) {
        console.log('⚠️ Current location failed (expected in simulator):', error.message);
    }

    // Test 3: Specific Location Reverse Geocoding
    console.log('\n3️⃣ Testing Reverse Geocoding with Known Coordinates...');
    try {
        // Toronto coordinates
        const locationName = await reverseGeocode(43.6532, -79.3832);
        console.log('✅ Toronto reverse geocoded as:', locationName);
    } catch (error) {
        console.log('❌ Reverse geocoding failed:', error.message);
    }

    console.log('\n🎉 Testing complete!');
};

// Test coordinates for different cities (use these in simulator)
export const TEST_COORDINATES = {
    toronto: { lat: 43.6532, lon: -79.3832 },
    vancouver: { lat: 49.2827, lon: -123.1207 },
    montreal: { lat: 45.5017, lon: -73.5673 },
    calgary: { lat: 51.0447, lon: -114.0719 },
    ottawa: { lat: 45.4215, lon: -75.6972 },
    newYork: { lat: 40.7128, lon: -74.0060 },
    london: { lat: 51.5074, lon: -0.1278 },
    tokyo: { lat: 35.6762, lon: 139.6503 },
};
