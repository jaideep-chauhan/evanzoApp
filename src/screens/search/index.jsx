import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    SafeAreaView,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import filterService from '../../services/filterService';
import categoryService from '../../services/categoryService';
import vendorService from '../../services/vendorService';
import { icons, getCategoryIcon } from '../../assets/icons';
import { popSearchHandler } from '../../services/searchBridge';

const RECENT_SEARCHES_KEY = '@evnzo_recent_searches';
const RECENT_LIMIT = 8;

// Standalone Search screen that opens when the user taps the search bar on
// Vendors or Events. Layout: back arrow + input header, recent searches as
// trending chips, popular categories grid using the new PNG icons, and live
// search results below as the user types.
export default function SearchScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { searchType = 'vendors', initialQuery = '' } = route.params || {};

    const [query, setQuery] = useState(initialQuery);
    const [recent, setRecent] = useState([]);
    const [categories, setCategories] = useState([]);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Load recents + categories once on mount
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
                if (raw) setRecent(JSON.parse(raw));
            } catch (_) { /* ignore */ }

            try {
                const fn = searchType === 'events'
                    ? categoryService.getEventCategories
                    : categoryService.getVendorCategories;
                const resp = await fn(false);
                if (resp?.success && Array.isArray(resp.data)) {
                    // Show only the first 6 — keeps the grid clean. Backend
                    // already returns most-popular-first for both endpoints.
                    setCategories(resp.data.slice(0, 6));
                }
            } catch (_) { /* ignore */ }
        })();

        // Focus the input on next tick so the keyboard opens automatically
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [searchType]);

    const persistRecent = useCallback(async (q) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        const next = [trimmed, ...recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, RECENT_LIMIT);
        setRecent(next);
        try {
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
        } catch (_) { /* ignore */ }
    }, [recent]);

    const runLiveSearch = useCallback(async (q) => {
        if (!q || q.trim().length < 2) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const fn = searchType === 'events'
                ? filterService.searchEvents
                : filterService.searchVendors;
            const resp = await fn({ keyword: q.trim(), page: 1, limit: 8 });
            if (resp?.success && Array.isArray(resp.data)) {
                setResults(resp.data);
            } else {
                setResults([]);
            }
        } catch (_) {
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [searchType]);

    const handleChange = (text) => {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runLiveSearch(text), 350);
    };

    const submitQuery = (q) => {
        const trimmed = (q ?? query).trim();
        if (!trimmed) return;
        Keyboard.dismiss();
        persistRecent(trimmed);
        // Hand the keyword back to the list screen via the bridge — its
        // handler is whatever it registered before navigating here.
        popSearchHandler()?.onQuery?.(trimmed);
        navigation.goBack();
    };

    const pickCategory = (category) => {
        persistRecent(category.name);
        popSearchHandler()?.onCategory?.(category);
        navigation.goBack();
    };

    const clearAllRecents = async () => {
        setRecent([]);
        try { await AsyncStorage.removeItem(RECENT_SEARCHES_KEY); } catch (_) { /* ignore */ }
    };

    const showResults = query.trim().length >= 2;

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header — back + search input */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.backBtn}
                >
                    <Icon name="arrow-back" size={22} color={'#1F2937'} />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <Icon name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder={`Search ${searchType === 'events' ? 'events' : 'vendors'}...`}
                        placeholderTextColor="#9CA3AF"
                        value={query}
                        onChangeText={handleChange}
                        onSubmitEditing={() => submitQuery()}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => handleChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Icon name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.divider} />

            {showResults ? (
                /* Live results */
                <FlatList
                    data={results}
                    keyExtractor={(item, idx) => `${item.vendor_ad_id || item.event_ad_id || item.id || idx}`}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.resultsList}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyResults}>
                            {isSearching ? (
                                <ActivityIndicator size="small" color="#2C3D5B" />
                            ) : (
                                <Text style={styles.emptyText}>No matches yet. Press search to view all.</Text>
                            )}
                        </View>
                    )}
                    renderItem={({ item }) => {
                        const name = item.company_name || item.title || item.name || 'Untitled';
                        const sub = item.city || item.location || item.category?.name || '';
                        return (
                            <TouchableOpacity
                                style={styles.resultRow}
                                onPress={() => submitQuery(name)}
                            >
                                <Image source={icons.location} style={styles.resultIcon} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.resultTitle} numberOfLines={1}>{name}</Text>
                                    {!!sub && <Text style={styles.resultSub} numberOfLines={1}>{sub}</Text>}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            ) : (
                <FlatList
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 24 }}
                    data={[]}
                    renderItem={null}
                    ListHeaderComponent={
                        <View>
                            {/* Trending / Recent Searches */}
                            {recent.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Trending Searches</Text>
                                        <TouchableOpacity onPress={clearAllRecents}>
                                            <Text style={styles.clearLink}>Clear</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.chipWrap}>
                                        {recent.map((term) => (
                                            <TouchableOpacity
                                                key={term}
                                                style={styles.trendingChip}
                                                onPress={() => submitQuery(term)}
                                            >
                                                <Icon name="trending-up" size={14} color="#2C3D5B" />
                                                <Text style={styles.trendingText}>{term}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Popular Categories — uses the new PNG icons */}
                            {categories.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Popular Categories</Text>
                                    <View style={styles.categoryGrid}>
                                        {categories.map((cat) => {
                                            const icon = getCategoryIcon(cat.name);
                                            return (
                                                <TouchableOpacity
                                                    key={cat.category_id || cat.id || cat.name}
                                                    style={styles.categoryChip}
                                                    onPress={() => pickCategory(cat)}
                                                >
                                                    {icon ? (
                                                        <Image source={icon} style={styles.categoryIcon} />
                                                    ) : (
                                                        <Icon name="pricetag-outline" size={18} color="#2C3D5B" />
                                                    )}
                                                    <Text style={styles.categoryText} numberOfLines={1}>{cat.name}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        gap: 12,
    },
    backBtn: {
        padding: 4,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        padding: 0,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E7EB',
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
    },
    clearLink: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    trendingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EAF2FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
    },
    trendingText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2C3D5B',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 22,
        minWidth: '46%',
        maxWidth: '100%',
    },
    categoryIcon: {
        width: 22,
        height: 22,
        resizeMode: 'contain',
    },
    categoryText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    resultsList: {
        paddingVertical: 6,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F3F4F6',
    },
    resultIcon: {
        width: 18,
        height: 18,
        resizeMode: 'contain',
    },
    resultTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    resultSub: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    emptyResults: {
        paddingTop: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: '#9CA3AF',
    },
});
