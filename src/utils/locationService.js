// Utility functions for location services
export const NOMINATIM_API_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Search for locations using Nominatim API
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<Array>} Array of location results
 */
export const searchLocations = async (query, options = {}) => {
    const {
        limit = 8,
        countryCode = 'ca', // Default to Canada, change as needed
        includeCoordinates = true,
    } = options;

    if (query.trim().length < 3) {
        return [];
    }

    try {
        const url = new URL(`${NOMINATIM_API_BASE}/search`);
        url.searchParams.append('format', 'json');
        url.searchParams.append('q', query);
        url.searchParams.append('limit', limit.toString());
        url.searchParams.append('addressdetails', '1');

        if (countryCode) {
            url.searchParams.append('countrycodes', countryCode);
        }

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'EvanzoApp/1.0 (mobile-app)', // Replace with your app details
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data.map(item => ({
            display_name: item.display_name,
            formatted: formatLocationName(item),
            lat: includeCoordinates ? parseFloat(item.lat) : null,
            lon: includeCoordinates ? parseFloat(item.lon) : null,
            address: item.address,
            type: item.type,
            importance: item.importance,
        }));
    } catch (error) {
        console.error('Error searching locations:', error);
        throw error;
    }
};

/**
 * Format location name for better display
 * @param {object} item - Location item from Nominatim
 * @returns {string} Formatted location name
 */
export const formatLocationName = (item) => {
    const address = item.address || {};
    let formatted = '';

    // Priority order for location naming
    const locationParts = [
        address.city,
        address.town,
        address.village,
        address.municipality,
        address.hamlet
    ].filter(Boolean);

    if (locationParts.length > 0) {
        formatted = locationParts[0];
    }

    // Add region/state if available and different
    if (address.state_district && !formatted.includes(address.state_district)) {
        formatted += formatted ? `, ${address.state_district}` : address.state_district;
    }

    if (address.state && !formatted.includes(address.state)) {
        formatted += formatted ? `, ${address.state}` : address.state;
    }

    // Add country for international results
    if (address.country && address.country_code !== 'ca') {
        formatted += formatted ? `, ${address.country}` : address.country;
    }

    return formatted || item.display_name.split(',')[0];
};

/**
 * Get current location coordinates (requires permission)
 * @returns {Promise<{lat: number, lon: number}>} Current coordinates
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
            }
        );
    });
};

/**
 * Reverse geocode coordinates to get location name
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} Location name
 */
export const reverseGeocode = async (lat, lon) => {
    try {
        const url = new URL(`${NOMINATIM_API_BASE}/reverse`);
        url.searchParams.append('format', 'json');
        url.searchParams.append('lat', lat.toString());
        url.searchParams.append('lon', lon.toString());
        url.searchParams.append('addressdetails', '1');

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'EvanzoApp/1.0 (mobile-app)',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return formatLocationName(data);
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        throw error;
    }
};
