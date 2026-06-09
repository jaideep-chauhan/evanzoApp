import { Platform } from 'react-native';

let allCities = null;
let loadingPromise = null;

// City data format: [name, countryCode, stateCode, lat, lon]
function mapCity(raw) {
    return { name: raw[0], countryCode: raw[1], stateCode: raw[2], latitude: raw[3], longitude: raw[4] };
}

async function loadCityData() {
    if (allCities) return allCities;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            if (Platform.OS === 'android') {
                // Android: read from assets folder asynchronously to avoid stack overflow
                const RNFS = require('react-native-fs').default || require('react-native-fs');
                const jsonStr = await RNFS.readFileAssets('city.json', 'utf8');
                allCities = JSON.parse(jsonStr);
            } else {
                // iOS: synchronous require works fine (no stack overflow)
                const cityModule = require('country-state-city/lib/cjs/city');
                const City = cityModule.default || cityModule;
                allCities = City.getAllCities().map(c => [c.name, c.countryCode, c.stateCode, c.latitude, c.longitude]);
            }
            return allCities;
        } catch (error) {
            console.warn('[cityLoader] Failed to load city data:', error.message);
            allCities = [];
            return allCities;
        } finally {
            loadingPromise = null;
        }
    })();

    return loadingPromise;
}

export async function getCitiesOfState(countryCode, stateCode) {
    const cities = await loadCityData();
    return cities
        .filter(c => c[1] === countryCode && c[2] === stateCode)
        .map(mapCity)
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCitiesOfCountry(countryCode) {
    const cities = await loadCityData();
    return cities
        .filter(c => c[1] === countryCode)
        .map(mapCity)
        .sort((a, b) => a.name.localeCompare(b.name));
}
