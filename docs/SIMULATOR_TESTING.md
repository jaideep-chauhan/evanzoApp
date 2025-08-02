# 🧪 Simulator Testing Guide for Location Search

## ✅ **What WORKS in Simulator:**

### 1. **API Location Search** - FULLY FUNCTIONAL ✅
- Type any location (e.g., "New York", "Paris", "Tokyo")
- Get real-time suggestions from Nominatim API
- Select locations and see vendor filtering work
- **Test**: Try searching for "Toronto" or "London"

### 2. **Popular Locations** - FULLY FUNCTIONAL ✅
- Click "Location" tab to open modal
- See Canadian popular locations
- Filter by typing (e.g., type "Van" to see Vancouver)
- **Test**: Select "Toronto, ON" and see vendors filter

### 3. **Custom Locations** - FULLY FUNCTIONAL ✅
- Type any custom location not in popular list
- Click "Add" button to use it as filter
- **Test**: Type "My Custom City" and add it

### 4. **UI and Navigation** - FULLY FUNCTIONAL ✅
- Modal animations and interactions
- Search input with debouncing
- Loading indicators
- **Test**: All UI elements should work smoothly

## ⚠️ **Current Location Limitations in Simulator:**

### **The "Use Current Location" Button:**
- **May show error** in simulator by default
- **Can be made to work** with simulator setup (see below)

## 🔧 **How to Test Current Location in Simulator:**

### **iOS Simulator Setup:**
1. **Open your app in iOS Simulator**
2. **Set simulator location:**
   - Simulator menu → Features → Location → Custom Location
   - Enter: Latitude `43.6532`, Longitude `-79.3832` (Toronto)
   - Click OK

3. **Test current location:**
   - Open location modal
   - Click "Use Current Location"
   - Should work and return "Toronto" area

### **Alternative iOS Locations to Test:**
- **Apple Park**: Simulator → Features → Location → Apple
- **City Run**: Simulator → Features → Location → City Run
- **Custom**: Use coordinates from our test file

### **Android Emulator Setup:**
1. **Open Extended Controls** (click ... in emulator toolbar)
2. **Go to Location tab**
3. **Set coordinates manually:**
   - Latitude: `43.6532`
   - Longitude: `-79.3832`
   - Click "Send"

4. **Enable location in Android settings:**
   - Settings → Privacy → Location Services → On

## 🧪 **Step-by-Step Testing:**

### **Test 1: Basic API Search**
```
1. Open app → Go to Vendors screen
2. Click "Location" tab
3. Type "New York" in search
4. Should see suggestions appear with loading spinner
5. Select a location
6. Should see "Showing vendors in: New York" message
7. Vendors should filter (may show "No vendors found" - that's OK)
```

### **Test 2: Popular Locations**
```
1. Click "Location" tab
2. See list of Canadian cities
3. Click "Toronto, ON"
4. Should filter vendors to Toronto-based ones
5. Should see 3 vendors (4x90 Studio, DJ Max, Eventify)
```

### **Test 3: Current Location (with simulator setup)**
```
1. Set simulator location (see above)
2. Click "Location" tab
3. Click "Use Current Location"
4. Should show loading spinner
5. Should auto-select your simulated location
6. Should close modal and filter vendors
```

### **Test 4: Custom Location**
```
1. Click "Location" tab
2. Type "My Test City"
3. Should see "Add" button appear
4. Click "Add"
5. Should use "My Test City" as filter
6. Will show "No vendors found" (expected)
```

## 🎯 **Expected Results:**

### **✅ What Should Work:**
- Typing shows API suggestions immediately
- Selecting locations filters vendors
- Popular locations work perfectly
- Custom locations can be added
- Loading states and animations work
- Error handling shows appropriate messages

### **⚠️ What Might Show Errors:**
- "Use Current Location" without simulator setup
- Network errors if no internet (shows user-friendly message)

## 🔍 **Debugging Tips:**

### **If API Search Doesn't Work:**
1. Check internet connection
2. Look at console logs for errors
3. Try different search terms

### **If Current Location Fails:**
1. Verify simulator location is set
2. Check that you allowed location permissions
3. Look for permission denied alerts

### **Console Logging:**
- Open debugger console to see API responses
- Look for "Error searching locations" messages
- Check network requests in network tab

## 📱 **Testing on Real Device:**

For complete testing, try on a real device where:
- Current location will work with actual GPS
- All network features work normally
- Permission requests work properly

## 🚀 **Quick Test Commands:**

To quickly test the API functionality, you can add this to your component temporarily:

```javascript
// Add this function to test API
const testAPI = async () => {
  try {
    const results = await searchLocations('Toronto');
    console.log('API Test Results:', results);
    Alert.alert('API Test', `Found ${results.length} locations`);
  } catch (error) {
    Alert.alert('API Error', error.message);
  }
};

// Add this button temporarily in your render
<TouchableOpacity onPress={testAPI} style={{padding: 20, backgroundColor: 'blue'}}>
  <Text style={{color: 'white'}}>Test API</Text>
</TouchableOpacity>
```

The location search should work perfectly in the simulator for all main features! The only limitation is current location, which can be simulated with the steps above.
