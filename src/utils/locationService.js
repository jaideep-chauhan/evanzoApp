// Utility functions for location services.
// Nominatim rejects React Native's default fetch traffic with 403/404 even with
// a User-Agent header, so we use Photon (https://photon.komoot.io) which serves
// the same OSM data without the strict policy. Reverse geocoding stays on
// Nominatim — Photon doesn't expose a reverse endpoint and a single reverse
// call after the user taps "Use Current Location" is well within its limits.
export const NOMINATIM_API_BASE = 'https://nominatim.openstreetmap.org';
export const PHOTON_API_BASE = 'https://photon.komoot.io';

// Map a Photon feature (GeoJSON) to the same shape the rest of the app expects
// from this service: { display_name, formatted, lat, lon, address, type, importance }.
const photonFeatureToResult = (feature) => {
    const props = feature.properties || {};
    const [lon, lat] = feature.geometry?.coordinates || [];
    const addressLike = {
        city: props.city || props.name,
        town: props.town,
        village: props.village,
        municipality: props.municipality,
        hamlet: props.hamlet,
        state: props.state,
        state_district: props.county,
        country: props.country,
        country_code: (props.countrycode || '').toLowerCase(),
    };
    const formatted = formatLocationName({ address: addressLike, display_name: props.name || '' });
    const displayName = [props.name, props.city, props.state, props.country]
        .filter(Boolean)
        .join(', ');
    return {
        display_name: displayName,
        formatted: formatted || props.name || '',
        lat: typeof lat === 'number' ? lat : null,
        lon: typeof lon === 'number' ? lon : null,
        address: addressLike,
        type: props.osm_value || props.type,
        importance: null,
    };
};

/**
 * Search for locations (Photon-backed, OSM data).
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<Array>} Array of location results
 */
export const searchLocations = async (query, options = {}) => {
    const { limit = 8 } = options;

    if (!query || query.trim().length < 3) {
        return [];
    }

    try {
        const url = new URL(`${PHOTON_API_BASE}/api`);
        url.searchParams.append('q', query.trim());
        url.searchParams.append('limit', String(limit));

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const features = Array.isArray(data?.features) ? data.features : [];
        return features
            .map(photonFeatureToResult)
            .filter((r) => r.formatted);
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
