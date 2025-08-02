# Location Search API Integration

This implementation uses the **Nominatim API** (OpenStreetMap's geocoding service) to provide real-time location suggestions in the vendor search feature.

## Features

### ✅ **Free Location Search API**
- **No API key required** - Completely free to use
- **Global coverage** - Search locations worldwide
- **Real-time suggestions** - 500ms debounced search
- **Smart formatting** - Clean, readable location names

### ✅ **Current Location Support**
- **GPS integration** - Get user's current location
- **Reverse geocoding** - Convert coordinates to location names
- **Permission handling** - Proper error messages for denied permissions

### ✅ **Performance Optimized**
- **Debounced requests** - Prevents excessive API calls
- **Loading states** - Visual feedback during searches
- **Error handling** - Graceful fallbacks and user-friendly messages
- **Caching friendly** - Reuses popular location list when appropriate

## API Details

### **Nominatim API (OpenStreetMap)**
- **Base URL**: `https://nominatim.openstreetmap.org`
- **Rate Limit**: 1 request per second (we use debouncing to respect this)
- **Coverage**: Worldwide locations
- **Data Quality**: High-quality, community-maintained data

### **Search Parameters**
```javascript
{
  format: 'json',           // Response format
  q: 'search query',        // User's search text
  limit: 8,                 // Max results returned
  addressdetails: 1,        // Include detailed address components
  countrycodes: null        // Global search (or 'ca' for Canada only)
}
```

## Usage Examples

### **Search Locations**
```javascript
import { searchLocations } from '../utils/locationService';

const results = await searchLocations('Toronto', {
  limit: 5,
  countryCode: 'ca'
});
```

### **Get Current Location**
```javascript
import { getCurrentLocation, reverseGeocode } from '../utils/locationService';

const coords = await getCurrentLocation();
const locationName = await reverseGeocode(coords.lat, coords.lon);
```

## File Structure

```
src/
├── utils/
│   └── locationService.js     # Core location API functions
└── screens/vendors/
    └── LocationSearchModal.jsx # UI component with integrated search
```

## Permissions Required

### **Android** (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### **iOS** (`ios/Evanzo/Info.plist`)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to find vendors near you.</string>
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Network Errors** - Shows user-friendly messages
2. **Permission Denied** - Explains how to enable location access
3. **No Results** - Offers option to add custom location
4. **API Rate Limits** - Automatic debouncing prevents issues

## Alternative APIs

If you want to use different location APIs, here are some alternatives:

### **Google Places API** (Paid, higher quality)
- Requires API key and billing setup
- Better autocomplete and business data
- Higher rate limits

### **MapBox Geocoding API** (Freemium)
- 100,000 free requests/month
- High-quality data and fast responses
- Requires API key

### **Here Geocoding API** (Freemium)
- 250,000 free requests/month
- Good for automotive use cases
- Requires API key

## Customization

You can easily customize the search behavior:

1. **Change country focus** - Modify `countryCode` parameter
2. **Adjust search sensitivity** - Change minimum character count
3. **Modify result limit** - Adjust `limit` parameter
4. **Add result filtering** - Filter by location type or importance

## Performance Tips

1. **Debouncing** - Already implemented (500ms delay)
2. **Result limiting** - Maximum 8 results to keep UI responsive
3. **Error boundaries** - Graceful degradation when API is unavailable
4. **Caching** - Consider adding local storage for recent searches

The implementation provides a smooth, professional location search experience without requiring any paid services or complex setup!
